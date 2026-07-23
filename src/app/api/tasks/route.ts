import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, templateId, groupId, tagFilter, accountIds, strategy, sendInterval, maxThreads, scheduledAt, attachments, footerHtml, unsubscribeLink } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // 校验模板/分组是否存在且属于当前用户，避免外键违规
    // （前端可能传 "none"（不选择/全部联系人）或过期 ID，必须转成 null）
    const warnings: string[] = [];
    let targetTemplateId: string | null = null;
    if (templateId) {
      const tpl = await prisma.template.findFirst({
        where: { id: templateId, userId: user.id },
        select: { id: true },
      });
      if (tpl) targetTemplateId = tpl.id;
      else warnings.push("指定的模板不存在，已不关联模板");
    }
    let targetGroupId: string | null = null;
    if (groupId) {
      const grp = await prisma.contactGroup.findFirst({
        where: { id: groupId, userId: user.id },
        select: { id: true },
      });
      if (grp) targetGroupId = grp.id;
      else warnings.push("指定的分组不存在，已设为全部联系人");
    }

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        status: "pending",
        name,
        templateId: targetTemplateId,
        groupId: targetGroupId,
        tagFilter: tagFilter ? JSON.stringify(tagFilter) : null,
        accountIds: JSON.stringify(accountIds ?? []),
        strategy: strategy ?? "round-robin",
        sendInterval: sendInterval ?? 3000,
        maxThreads: maxThreads ?? 1,
        scheduledAt: scheduledAt ?? null,
        attachments: attachments ? JSON.stringify(attachments) : "[]",
        footerHtml: footerHtml ?? "",
        unsubscribeLink: unsubscribeLink ?? false,
      },
    });
    return NextResponse.json(
      { ...task, warnings: warnings.length > 0 ? warnings : undefined },
      { status: 201 }
    );
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
