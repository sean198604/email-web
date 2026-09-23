import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const DEFAULT_BASE =
  process.env.CARD_RESEARCH_BASE_URL || "http://host.docker.internal:7004";

async function getBaseUrl(userId: string, override?: string): Promise<string> {
  if (override) return override;
  try {
    const setting = await prisma.setting.findUnique({
      where: { userId },
    });
    if (setting?.data) {
      const o = JSON.parse(setting.data);
      if (o.cardResearchUrl) return o.cardResearchUrl as string;
    }
  } catch {
    // ignore
  }
  return DEFAULT_BASE;
}

function summarizeReport(report: unknown): string {
  try {
    const r = typeof report === "string" ? JSON.parse(report) : report;
    if (!r) return "";
    const sections = Array.isArray(r.sections) ? r.sections : [];
    const pick = sections
      .filter((s: { title?: string }) =>
        /公司基本资料|合作匹配度|采购品类|终端客户/.test(s.title || "")
      )
      .map((s: { title?: string; content?: string }) => `【${s.title}】${s.content || ""}`)
      .join("\n");
    const txt = pick || JSON.stringify(r);
    return txt.slice(0, 1500);
  } catch {
    return typeof report === "string" ? report.slice(0, 1500) : "";
  }
}

function asArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray((raw as { customers?: unknown[] }).customers)) {
    return (raw as { customers: unknown[] }).customers;
  }
  return [];
}

// GET: 仅测试与名片宝的连通性，返回客户数量
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const url = new URL(request.url);
    const override = url.searchParams.get("baseUrl") || undefined;
    const base = await getBaseUrl(user.id, override);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(
        `${base.replace(/\/+$/, "")}/api/export?format=json`,
        { signal: controller.signal }
      );
      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: `名片宝返回 HTTP ${res.status}` },
          { status: 502 }
        );
      }
      const data = await res.json();
      const list = asArray(data);
      return NextResponse.json({ ok: true, count: list.length, base });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    const err = error as Error;
    if (err?.name === "AbortError") {
      return NextResponse.json(
        { ok: false, error: "连接名片宝超时（10s）" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { ok: false, error: `无法连接名片宝：${err?.message || "未知错误"}` },
      { status: 502 }
    );
  }
}

// POST: 拉取名片宝客户档案并写入当前用户联系人
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const base = await getBaseUrl(user.id, body.baseUrl);
    const groupId =
      body.groupId && body.groupId !== "none" ? body.groupId : null;

    // 分组归属校验，避免外键违规导致整批跳过
    let targetGroupId: string | null = null;
    if (groupId) {
      const grp = await prisma.contactGroup.findFirst({
        where: { id: groupId, userId: user.id },
        select: { id: true },
      });
      if (!grp) {
        return NextResponse.json(
          { error: "分组不存在或不属于你" },
          { status: 400 }
        );
      }
      targetGroupId = grp.id;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    let raw: unknown;
    try {
      const res = await fetch(
        `${base.replace(/\/+$/, "")}/api/export?format=json`,
        { signal: controller.signal }
      );
      if (!res.ok) {
        return NextResponse.json(
          { error: `名片宝返回 HTTP ${res.status}` },
          { status: 502 }
        );
      }
      raw = await res.json();
    } finally {
      clearTimeout(timer);
    }

    const list = asArray(raw);
    if (list.length === 0) {
      return NextResponse.json({
        imported: 0,
        skipped: 0,
        total: 0,
        warnings: ["名片宝没有可导出的客户档案"],
      });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const c of list as Record<string, unknown>[]) {
      const email = (c.email as string) || (c["邮箱"] as string);
      if (!email) {
        skipped++;
        errors.push("缺少邮箱，已跳过");
        continue;
      }

      const name =
        (c.contact_name as string) ||
        (c.name as string) ||
        (c["姓名"] as string) ||
        null;
      const company =
        (c.company as string) ||
        (c.customer as string) ||
        (c["客户"] as string) ||
        null;
      const tagsRaw = (c.tags as string) || "";
      const tags =
        typeof tagsRaw === "string"
          ? tagsRaw
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : Array.isArray(tagsRaw)
            ? (tagsRaw as string[])
            : [];

      const variables: Record<string, unknown> = {
        title: (c.title as string) || null,
        country: (c.country as string) || null,
        phone: (c.phone as string) || null,
        website: (c.website as string) || null,
        category: (c.category as string) || null,
        match_score: (c.match_score as string) || null,
        source: (c.source as string) || null,
        notes: (c.notes as string) || null,
        reportSummary: summarizeReport(c.report_json),
      };
      const variablesStr = JSON.stringify(variables);
      const tagsStr = JSON.stringify(tags);

      try {
        if (targetGroupId) {
          await prisma.contact.upsert({
            where: {
              email_groupId: { email, groupId: targetGroupId },
            },
            create: {
              userId: user.id,
              name,
              email,
              tags: tagsStr,
              variables: variablesStr,
              customer: company,
              groupId: targetGroupId,
            },
            update: {
              name: name ?? undefined,
              tags: tagsStr,
              variables: variablesStr,
              customer: company ?? undefined,
            },
          });
        } else {
          const existing = await prisma.contact.findFirst({
            where: { email, groupId: null },
          });
          if (existing) {
            await prisma.contact.update({
              where: { id: existing.id },
              data: {
                name: name ?? undefined,
                tags: tagsStr,
                variables: variablesStr,
                customer: company ?? undefined,
              },
            });
          } else {
            await prisma.contact.create({
              data: {
                userId: user.id,
                name,
                email,
                tags: tagsStr,
                variables: variablesStr,
                customer: company,
                groupId: null,
              },
            });
          }
        }
        imported++;
      } catch (err) {
        skipped++;
        errors.push(
          `Failed for ${email}: ${err instanceof Error ? err.message : "Unknown"}`
        );
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      total: list.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (err?.name === "AbortError") {
      return NextResponse.json(
        { error: "从名片宝拉取数据超时（30s）" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: err?.message || "导入失败" },
      { status: 500 }
    );
  }
}
