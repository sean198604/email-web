import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { testConnection } from "@/lib/mailer";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const account = await prisma.account.findUnique({ where: { id, userId: user.id } });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    return NextResponse.json(account);
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch account" },
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
    const { name, email, host, port, secure, authUser, authPass, replyTo, dailyLimit, hourlyLimit, sendInterval, weight, enabled } = body;

    const existing = await prisma.account.findUnique({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const account = await prisma.account.update({
      where: { id, userId: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(host !== undefined && { host }),
        ...(port !== undefined && { port }),
        ...(secure !== undefined && { secure }),
        ...(authUser !== undefined && { authUser }),
        ...(authPass !== undefined && { authPass }),
        ...(replyTo !== undefined && { replyTo }),
        ...(dailyLimit !== undefined && { dailyLimit }),
        ...(hourlyLimit !== undefined && { hourlyLimit }),
        ...(sendInterval !== undefined && { sendInterval }),
        ...(weight !== undefined && { weight }),
        ...(enabled !== undefined && { enabled }),
      },
    });
    return NextResponse.json(account);
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update account" },
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
    const existing = await prisma.account.findUnique({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    await prisma.account.delete({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete account" },
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

    if (action !== "test") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({ where: { id, userId: user.id } });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const result = await testConnection(account);
    return NextResponse.json(result);
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Connection test failed" },
      { status: 500 }
    );
  }
}
