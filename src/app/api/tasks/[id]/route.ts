import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { startTaskSend, stopTaskSend } from "@/lib/sender";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const task = await prisma.task.findUnique({ where: { id, userId: user.id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { name, templateId, groupId, tagFilter, accountIds, strategy, sendInterval, maxThreads, scheduledAt, attachments, footerHtml, unsubscribeLink } = body;

    const existing = await prisma.task.findUnique({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 校验模板/分组：前端可能传 "none"（不选择/全部联系人）或过期 ID，必须转成 null，避免外键违规
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (templateId !== undefined) {
      if (templateId && templateId !== "none") {
        const tpl = await prisma.template.findFirst({
          where: { id: templateId, userId: user.id },
          select: { id: true },
        });
        data.templateId = tpl ? tpl.id : null;
      } else {
        data.templateId = null;
      }
    }
    if (groupId !== undefined) {
      if (groupId && groupId !== "none") {
        const grp = await prisma.contactGroup.findFirst({
          where: { id: groupId, userId: user.id },
          select: { id: true },
        });
        data.groupId = grp ? grp.id : null;
      } else {
        data.groupId = null;
      }
    }
    if (tagFilter !== undefined) data.tagFilter = tagFilter !== null ? JSON.stringify(tagFilter) : null;
    if (accountIds !== undefined) data.accountIds = JSON.stringify(accountIds);
    if (strategy !== undefined) data.strategy = strategy;
    if (sendInterval !== undefined) data.sendInterval = sendInterval;
    if (maxThreads !== undefined) data.maxThreads = maxThreads;
    if (scheduledAt !== undefined) data.scheduledAt = scheduledAt;
    if (attachments !== undefined) data.attachments = JSON.stringify(attachments);
    if (footerHtml !== undefined) data.footerHtml = footerHtml;
    if (unsubscribeLink !== undefined) data.unsubscribeLink = unsubscribeLink;

    const task = await prisma.task.update({
      where: { id, userId: user.id },
      data,
    });
    return NextResponse.json(task);
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const existing = await prisma.task.findUnique({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    await prisma.task.delete({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const existing = await prisma.task.findUnique({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    switch (action) {
      case "start": {
        if (existing.status === "sending" || existing.status === "completed" || existing.status === "failed") {
          return NextResponse.json(
            { error: "Task is already in a running or final state" },
            { status: 400 }
          );
        }
        startTaskSend(id, user.id);
        return NextResponse.json({ success: true, status: "sending" });
      }

      case "stop": {
        if (existing.status !== "sending" && existing.status !== "paused") {
          return NextResponse.json(
            { error: "Task is not in a running state" },
            { status: 400 }
          );
        }
        stopTaskSend(id);
        await prisma.task.update({
          where: { id, userId: user.id },
          data: { status: "completed" },
        });
        return NextResponse.json({ success: true, status: "completed" });
      }

      case "pause": {
        if (existing.status !== "sending") {
          return NextResponse.json(
            { error: "Task is not currently sending" },
            { status: 400 }
          );
        }
        stopTaskSend(id);
        await prisma.task.update({
          where: { id, userId: user.id },
          data: { status: "paused" },
        });
        return NextResponse.json({ success: true, status: "paused" });
      }

      case "reset": {
        stopTaskSend(id);
        await prisma.task.update({
          where: { id, userId: user.id },
          data: {
            status: "draft",
            sentCount: 0,
            failCount: 0,
            totalCount: 0,
          },
        });
        return NextResponse.json({ success: true, status: "draft" });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: start, stop, pause, reset" },
          { status: 400 }
        );
    }
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Action failed" },
      { status: 500 }
    );
  }
}
