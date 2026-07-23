import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const group = await prisma.contactGroup.findUnique({
      where: { id, userId: user.id },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    return NextResponse.json(group);
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch group" },
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
    const { name, description } = body;

    const existing = await prisma.contactGroup.findUnique({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const group = await prisma.contactGroup.update({
      where: { id, userId: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    });
    return NextResponse.json(group);
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update group" },
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
    const existing = await prisma.contactGroup.findUnique({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    await prisma.contactGroup.delete({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}

// Merge: move all contacts from this group to targetGroupId, then delete this group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { action, targetGroupId } = body;

    if (action !== "merge" || !targetGroupId) {
      return NextResponse.json(
        { error: "Action must be 'merge' with targetGroupId" },
        { status: 400 }
      );
    }

    if (id === targetGroupId) {
      return NextResponse.json(
        { error: "Cannot merge a group into itself" },
        { status: 400 }
      );
    }

    const sourceGroup = await prisma.contactGroup.findUnique({ where: { id, userId: user.id } });
    if (!sourceGroup) {
      return NextResponse.json({ error: "Source group not found" }, { status: 404 });
    }

    const targetGroup = await prisma.contactGroup.findUnique({ where: { id: targetGroupId, userId: user.id } });
    if (!targetGroup) {
      return NextResponse.json({ error: "Target group not found" }, { status: 404 });
    }

    // Move contacts to target group
    await prisma.contact.updateMany({
      where: { groupId: id, userId: user.id },
      data: { groupId: targetGroupId },
    });

    // Delete the source group
    await prisma.contactGroup.delete({ where: { id, userId: user.id } });

    return NextResponse.json({ success: true, targetGroupId });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to merge groups" },
      { status: 500 }
    );
  }
}
