import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// 管理员查看指定用户的详情：基本信息 + 联系人 + 绑定发件邮箱(账号) + 统计
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 绑定发件邮箱（账号）—— 不返回密码等敏感字段
    const accounts = await prisma.account.findMany({
      where: { userId: id },
      select: {
        id: true,
        name: true,
        email: true,
        host: true,
        port: true,
        secure: true,
        replyTo: true,
        dailyLimit: true,
        hourlyLimit: true,
        enabled: true,
        todaySent: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 联系人（附所属分组名）
    const contacts = await prisma.contact.findMany({
      where: { userId: id },
      select: {
        id: true,
        name: true,
        email: true,
        customer: true,
        tags: true,
        groupId: true,
        group: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 统计
    const [groupCount, templateCount, taskCount, sendRecordCount] =
      await Promise.all([
        prisma.contactGroup.count({ where: { userId: id } }),
        prisma.template.count({ where: { userId: id } }),
        prisma.task.count({ where: { userId: id } }),
        prisma.sendRecord.count({ where: { userId: id } }),
      ]);

    return NextResponse.json({
      user,
      accounts,
      contacts,
      stats: {
        accountCount: accounts.length,
        contactCount: contacts.length,
        groupCount,
        templateCount,
        taskCount,
        sendRecordCount,
      },
    });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (err?.message === "Forbidden") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    return NextResponse.json({ error: "获取用户详情失败" }, { status: 500 });
  }
}
