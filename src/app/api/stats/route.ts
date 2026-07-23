import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const totalContacts = await prisma.contact.count({ where: { userId: user.id } });
    const totalAccounts = await prisma.account.count({ where: { userId: user.id } });
    const totalTemplates = await prisma.template.count({ where: { userId: user.id } });
    const tasks = await prisma.task.findMany({ where: { userId: user.id }, select: { status: true } });

    const activeTasks = tasks.filter((t: { status: string }) => t.status === "sending").length;
    const completedTasks = tasks.filter((t: { status: string }) => t.status === "completed").length;

    // Today's total sent across accounts
    const today = new Date().toISOString().split("T")[0];
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      select: { todaySent: true, todaySentDate: true },
    });
    const todaySent = accounts
      .filter((a: { todaySentDate: string | null; todaySent: number }) => a.todaySentDate === today)
      .reduce((sum: number, a: { todaySent: number }) => sum + a.todaySent, 0);

    // 7-day send trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentRecords = await prisma.sendRecord.findMany({
      where: {
        userId: user.id,
        sentAt: { gte: sevenDaysAgo },
      },
      select: { sentAt: true },
    });

    // Group by date
    const trendMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      trendMap[key] = 0;
    }

    for (const record of recentRecords) {
      const dateKey = new Date(record.sentAt).toISOString().split("T")[0];
      if (trendMap[dateKey] !== undefined) {
        trendMap[dateKey]++;
      }
    }

    const trend = Object.entries(trendMap).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json({
      totalContacts,
      totalAccounts,
      totalTemplates,
      activeTasks,
      completedTasks,
      todaySent,
      trend,
    });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
