import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const existing = await prisma.blacklist.findUnique({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    await prisma.blacklist.delete({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to remove from blacklist" },
      { status: 500 }
    );
  }
}
