import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// 邮件追踪统计：总览（打开率/点击率）+ 按任务 + 按联系人。
// 需要登录。
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId") || undefined;

    const where: Record<string, unknown> = { userId: user.id };
    if (taskId) where.taskId = taskId;

    const records = await prisma.sendRecord.findMany({
      where,
      select: {
        taskId: true,
        contactEmail: true,
        contactName: true,
        customer: true,
        status: true,
        openedAt: true,
        openCount: true,
        clickedAt: true,
        clickCount: true,
        lastClickUrl: true,
      },
      orderBy: { sentAt: "desc" },
    });

    // 任务名映射
    const taskIds = Array.from(new Set(records.map((r) => r.taskId)));
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds }, userId: user.id },
      select: { id: true, name: true },
    });
    const taskNameMap = new Map(tasks.map((t) => [t.id, t.name]));

    // ===== 总览 =====
    const sent = records.filter((r) => r.status === "success").length;
    const opened = records.filter((r) => r.openedAt).length;
    const totalClicks = records.reduce((s, r) => s + (r.clickCount || 0), 0);
    const clickedContacts = records.filter((r) => (r.clickCount || 0) > 0).length;
    const openRate = sent > 0 ? opened / sent : 0;
    const clickRate = sent > 0 ? clickedContacts / sent : 0;

    // ===== 按任务 =====
    const taskMap = new Map<
      string,
      { taskId: string; taskName: string; sent: number; opened: number; clicks: number }
    >();
    for (const r of records) {
      if (!taskMap.has(r.taskId)) {
        taskMap.set(r.taskId, {
          taskId: r.taskId,
          taskName: taskNameMap.get(r.taskId) || r.taskId.slice(0, 8),
          sent: 0,
          opened: 0,
          clicks: 0,
        });
      }
      const agg = taskMap.get(r.taskId)!;
      if (r.status === "success") agg.sent++;
      if (r.openedAt) agg.opened++;
      agg.clicks += r.clickCount || 0;
    }
    const perTask = Array.from(taskMap.values());

    // ===== 按联系人（聚合同一邮箱的多次发送）=====
    const contactMap = new Map<
      string,
      {
        contactEmail: string;
        contactName: string | null;
        customer: string | null;
        opens: number;
        lastOpenedAt: string | null;
        clicks: number;
        lastClickedAt: string | null;
        lastClickUrl: string | null;
      }
    >();
    for (const r of records) {
      const key = r.contactEmail.toLowerCase();
      if (!contactMap.has(key)) {
        contactMap.set(key, {
          contactEmail: r.contactEmail,
          contactName: r.contactName,
          customer: r.customer,
          opens: 0,
          lastOpenedAt: null,
          clicks: 0,
          lastClickedAt: null,
          lastClickUrl: null,
        });
      }
      const c = contactMap.get(key)!;
      c.opens += r.openCount || 0;
      if (r.openedAt) {
        const t = new Date(r.openedAt).toISOString();
        if (!c.lastOpenedAt || t > c.lastOpenedAt) c.lastOpenedAt = t;
      }
      c.clicks += r.clickCount || 0;
      if (r.clickedAt) {
        const t = new Date(r.clickedAt).toISOString();
        if (!c.lastClickedAt || t > c.lastClickedAt) {
          c.lastClickedAt = t;
          c.lastClickUrl = r.lastClickUrl;
        }
      }
    }
    // 排序：点击多 -> 打开多 -> 邮箱
    const contacts = Array.from(contactMap.values()).sort((a, b) => {
      if (b.clicks !== a.clicks) return b.clicks - a.clicks;
      if (b.opens !== a.opens) return b.opens - a.opens;
      return a.contactEmail.localeCompare(b.contactEmail);
    });

    // 任务下拉列表（用于前端筛选）
    const tasksList = await prisma.task.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({
      summary: {
        sent,
        opened,
        openRate,
        totalClicks,
        clickedContacts,
        clickRate,
      },
      perTask,
      contacts,
      tasks: tasksList,
    });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch tracking" }, { status: 500 });
  }
}
