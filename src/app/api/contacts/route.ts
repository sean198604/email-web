import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import type { Contact } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");

    let contacts: Contact[] = await prisma.contact.findMany({
      where: { userId: user.id, ...(groupId ? { groupId } : {}) },
      orderBy: { createdAt: "desc" },
    });

    // Filter by tag (stored as JSON string)
    if (tag) {
      contacts = contacts.filter((c) => {
        const tags: string[] = JSON.parse(c.tags);
        return tags.includes(tag);
      });
    }

    // Search by name or email
    if (search) {
      const lower = search.toLowerCase();
      contacts = contacts.filter((c) => {
        const nameMatch = c.name?.toLowerCase().includes(lower);
        const emailMatch = c.email.toLowerCase().includes(lower);
        const customerMatch = c.customer?.toLowerCase().includes(lower);
        return nameMatch || emailMatch || customerMatch;
      });
    }

    return NextResponse.json(contacts);
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, email, tags, variables, groupId, customer } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        userId: user.id,
        name: name ?? null,
        email,
        tags: JSON.stringify(tags ?? []),
        variables: variables ? JSON.stringify(variables) : "{}",
        customer: customer ?? null,
        groupId: groupId ?? null,
      },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
