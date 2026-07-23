import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const setting = await prisma.setting.findUnique({
      where: { userId: user.id },
    });

    if (!setting) {
      return NextResponse.json({});
    }

    return NextResponse.json(JSON.parse(setting.data));
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const setting = await prisma.setting.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        data: JSON.stringify(body),
      },
      update: {
        data: JSON.stringify(body),
      },
    });

    return NextResponse.json(JSON.parse(setting.data));
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
