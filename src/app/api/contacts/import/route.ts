import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Body must be a JSON array" },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const item of body) {
      if (!item.email) {
        errors.push("Item missing email field");
        skipped++;
        continue;
      }

      const tagsStr = JSON.stringify(item.tags ?? []);
      const variablesStr = item.variables ? JSON.stringify(item.variables) : "{}";
      const customerVal = item.customer ?? null;

      // 解析目标分组：必须先校验该分组存在且属于当前用户，
      // 否则直接插入会触发外键约束违规（整条被跳过、联系人都进不去）。
      let targetGroupId: string | null = null;
      if (item.groupId) {
        const grp = await prisma.contactGroup.findFirst({
          where: { id: item.groupId, userId: user.id },
          select: { id: true },
        });
        if (grp) {
          targetGroupId = grp.id;
        } else {
          warnings.push(
            `联系人 ${item.email} 指定的分组不存在/不属于你，已放入「未分组」`
          );
        }
      }

      try {
        if (targetGroupId) {
          // 指定分组：走复合唯一键 upsert
          await prisma.contact.upsert({
            where: {
              email_groupId: {
                email: item.email,
                groupId: targetGroupId,
              },
            },
            create: {
              userId: user.id,
              name: item.name ?? null,
              email: item.email,
              tags: tagsStr,
              variables: variablesStr,
              customer: customerVal,
              groupId: targetGroupId,
            },
            update: {
              name: item.name ?? undefined,
              tags: item.tags !== undefined ? tagsStr : undefined,
              variables: item.variables !== undefined ? variablesStr : undefined,
              customer: item.customer !== undefined ? customerVal : undefined,
            },
          });
        } else {
          // 未指定分组(groupId 为 null)：SQLite 复合唯一键 where 不支持 null，
          // 改为先查是否存在同邮箱且无分组的联系人，再 update / create
          const existing = await prisma.contact.findFirst({
            where: { email: item.email, groupId: null },
          });
          if (existing) {
            await prisma.contact.update({
              where: { id: existing.id },
              data: {
                name: item.name ?? undefined,
                tags: item.tags !== undefined ? tagsStr : undefined,
                variables: item.variables !== undefined ? variablesStr : undefined,
                customer: item.customer !== undefined ? customerVal : undefined,
              },
            });
          } else {
            await prisma.contact.create({
              data: {
                userId: user.id,
                name: item.name ?? null,
                email: item.email,
                tags: tagsStr,
                variables: variablesStr,
                customer: customerVal,
                groupId: null,
              },
            });
          }
        }
        imported++;
      } catch (err) {
        skipped++;
        errors.push(
          `Failed for ${item.email}: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      total: body.length,
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to import contacts" },
      { status: 500 }
    );
  }
}
