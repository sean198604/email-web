import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(accounts);
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, email, host, port, secure, authUser, authPass, replyTo, dailyLimit, hourlyLimit, sendInterval, weight, enabled } = body;

    if (!name || !email || !host || !authUser || !authPass) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name,
        email,
        host,
        port: port ?? 465,
        secure: secure ?? true,
        authUser,
        authPass,
        replyTo: replyTo ?? null,
        dailyLimit: dailyLimit ?? 500,
        hourlyLimit: hourlyLimit ?? 50,
        sendInterval: sendInterval ?? 3000,
        weight: weight ?? 1,
        enabled: enabled ?? true,
      },
    });
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
