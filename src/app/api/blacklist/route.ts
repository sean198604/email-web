import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const list = await prisma.blacklist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(list);
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch blacklist" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { value, type, reason } = body;

    if (!value) {
      return NextResponse.json({ error: "Value is required" }, { status: 400 });
    }

    const entry = await prisma.blacklist.create({
      data: {
        userId: user.id,
        value,
        type: type ?? "email",
        reason: reason ?? null,
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to add to blacklist" },
      { status: 500 }
    );
  }
}
