import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { DEFAULT_TEMPLATES } from "@/lib/default-templates";

// 为当前用户补齐缺失的默认模板（按名称去重，重复点击不会灌入多份）
export async function POST() {
  try {
    const user = await requireAuth();

    const existing = await prisma.template.findMany({
      where: { userId: user.id, name: { in: DEFAULT_TEMPLATES.map((t) => t.name) } },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((t) => t.name));
    const toCreate = DEFAULT_TEMPLATES.filter((t) => !existingNames.has(t.name));

    if (toCreate.length === 0) {
      return NextResponse.json({ message: "默认模板已存在，无需添加", created: 0 });
    }

    await prisma.template.createMany({
      data: toCreate.map((t) => ({
        userId: user.id,
        name: t.name,
        subject: t.subject,
        htmlContent: t.htmlContent,
        textContent: t.textContent ?? null,
        category: t.category ?? null,
        variables: "[]",
      })),
    });

    return NextResponse.json({
      message: `已添加 ${toCreate.length} 个默认模板`,
      created: toCreate.length,
    });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Seed default templates error:", error);
    return NextResponse.json({ error: "添加默认模板失败" }, { status: 500 });
  }
}
