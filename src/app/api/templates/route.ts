import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const templates = await prisma.template.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, subject, htmlContent, textContent, category, variables } = body;

    if (!name || !subject || !htmlContent) {
      return NextResponse.json(
        { error: "Missing required fields: name, subject, htmlContent" },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        userId: user.id,
        name,
        subject,
        htmlContent,
        textContent: textContent ?? null,
        category: category ?? null,
        variables: variables ? JSON.stringify(variables) : "[]",
      },
    });
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
