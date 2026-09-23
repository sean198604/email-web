import { prisma } from "./db";
import { sendEmail } from "./mailer";
import { injectTracking, getTrackingBaseUrl } from "./tracking";
import type { Account } from "@/generated/prisma/client";

type AccountQuota = Account & { remaining: number };

// Simple in-memory queue for sending
const activeTasks = new Map<string, boolean>();

export async function startTaskSend(taskId: string, userId: string): Promise<void> {
  if (activeTasks.get(taskId)) return;

  const task = await prisma.task.findUnique({
    where: { id: taskId, userId },
    include: { template: true, group: true },
  });

  if (!task) return;
  if (task.status === "sending") return;

  activeTasks.set(taskId, true);
  await prisma.task.update({
    where: { id: taskId, userId },
    data: { status: "sending" },
  });

  try {
    // Get accounts
    const accountIds: string[] = JSON.parse(task.accountIds);
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, enabled: true, userId },
    });

    if (accounts.length === 0) {
      throw new Error("没有可用的发件账号");
    }

    // Get contacts
    let contacts = await prisma.contact.findMany({
      where: {
        userId,
        groupId: task.groupId || undefined,
      },
    });

    // Filter by tags
    if (task.tagFilter) {
      const tagFilters: string[] = JSON.parse(task.tagFilter);
      if (tagFilters.length > 0) {
        contacts = contacts.filter((c) => {
          const contactTags: string[] = JSON.parse(c.tags);
          return tagFilters.some((t) => contactTags.includes(t));
        });
      }
    }

    // Filter out blacklisted
    const blacklist = await prisma.blacklist.findMany({ where: { userId } });
    const blacklistEmails = new Set(
      blacklist.filter((b) => b.type === "email").map((b) => b.value.toLowerCase())
    );
    const blacklistDomains = new Set(
      blacklist.filter((b) => b.type === "domain").map((b) => b.value.toLowerCase())
    );

    contacts = contacts.filter((c) => {
      const email = c.email.toLowerCase();
      if (blacklistEmails.has(email)) return false;
      const domain = email.split("@")[1];
      if (domain && blacklistDomains.has(domain)) return false;
      return true;
    });

    await prisma.task.update({
      where: { id: taskId, userId },
      data: { totalCount: contacts.length },
    });

    // Get account quotas
    const accountQuotas: AccountQuota[] = accounts.map((a) => ({
      ...a,
      remaining: a.dailyLimit - (a.todaySentDate === new Date().toISOString().split("T")[0] ? a.todaySent : 0),
    }));

    let sentCount = 0;
    let failCount = 0;
    const attachments: { filename: string; path?: string }[] = JSON.parse(task.attachments || "[]");

    for (const contact of contacts) {
      if (!activeTasks.get(taskId)) break;

      // Select account based on strategy
      const account = selectAccount(accountQuotas, task.strategy);
      if (!account) break;

      // Variable substitution
      const contactVars: Record<string, string> = JSON.parse(contact.variables || "{}");
      let subject = task.template?.subject || "";
      let html = task.template?.htmlContent || "";
      let text = task.template?.textContent || "";

      // Replace variables
      const allVars = { name: contact.name || contact.email, email: contact.email, ...contactVars };
      for (const [key, val] of Object.entries(allVars)) {
        const re = new RegExp(`\\{${key}\\}`, "g");
        subject = subject.replace(re, String(val));
        html = html.replace(re, String(val));
        text = text.replace(re, String(val));
      }

      // Add footer
      if (task.footerHtml) {
        html += task.footerHtml;
      }

      // Add unsubscribe link
      if (task.unsubscribeLink) {
        const encodedEmail = Buffer.from(contact.email).toString("base64");
        html += `<br/><br/><p style="font-size:12px;color:#999;">如果您不想再收到此类邮件，请<a href="mailto:${account.email}?subject=退订请求&body=请将我${encodedEmail}从邮件列表中移除">点击退订</a></p>`;
      }

      // 先落一条发送记录拿到 id，再据此注入追踪像素/改写链接（追踪以 sendRecord.id 为令牌）
      const sr = await prisma.sendRecord.create({
        data: {
          userId,
          taskId,
          contactEmail: contact.email,
          contactName: contact.name,
          customer: contact.customer,
          accountEmail: account.email,
          status: "pending",
        },
      });

      // 注入邮件追踪：打开像素 + 链接改写为点击跳转
      const trackedHtml = injectTracking(html, sr.id, getTrackingBaseUrl());

      const result = await sendEmail(
        account,
        contact.email,
        subject,
        trackedHtml,
        text,
        undefined,
        attachments.length > 0 ? attachments.map((a) => ({ filename: a.filename, path: a.path })) : undefined
      );

      // Record
      await prisma.sendRecord.update({
        where: { id: sr.id },
        data: {
          status: result.success ? "success" : "failed",
          errorMessage: result.error,
        },
      });

      if (result.success) {
        sentCount++;
        account.remaining--;
        account.todaySent++;
      } else {
        failCount++;
      }

      // Update task progress
      await prisma.task.update({
        where: { id: taskId, userId },
        data: { sentCount, failCount },
      });

      // Apply send interval
      await new Promise((resolve) => setTimeout(resolve, task.sendInterval || 3000));
    }

    // Update account todaySent
    const today = new Date().toISOString().split("T")[0];
    for (const acc of accounts) {
      const quota = accountQuotas.find((q) => q.id === acc.id);
      if (quota) {
        await prisma.account.update({
          where: { id: acc.id, userId },
          data: {
            todaySent: quota.todaySent,
            todaySentDate: today,
          },
        });
      }
    }

    await prisma.task.update({
      where: { id: taskId, userId },
      data: { status: failCount === contacts.length && sentCount === 0 ? "failed" : "completed" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.task.update({
      where: { id: taskId, userId },
      data: { status: "failed" },
    });
    await prisma.auditLog.create({
      data: {
        userId,
        action: "send_task_error",
        detail: `Task ${taskId}: ${message}`,
        level: "error",
      },
    });
  } finally {
    activeTasks.delete(taskId);
  }
}

export function stopTaskSend(taskId: string): void {
  activeTasks.delete(taskId);
}

function selectAccount(accounts: AccountQuota[], strategy: string) {
  const available = accounts.filter((a) => a.enabled && a.remaining > 0);
  if (available.length === 0) return null;

  switch (strategy) {
    case "weighted": {
      const totalWeight = available.reduce((sum, a) => sum + a.weight, 0);
      let random = Math.random() * totalWeight;
      for (const a of available) {
        random -= a.weight;
        if (random <= 0) return a;
      }
      return available[0];
    }
    case "optimal":
      return available.sort((a, b) => b.remaining - a.remaining)[0];
    case "round-robin":
    default:
      return available[0];
  }
}
