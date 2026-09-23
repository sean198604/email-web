import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { generateIntroLetter, getAiConfig, IntroLetterInput } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const {
      contactId,
      name,
      company,
      country,
      title,
      customerProfile,
      needs,
      productContext,
      language,
      tone,
      senderName,
      senderTitle,
    } = body;

    if (!needs || !String(needs).trim()) {
      return NextResponse.json(
        { error: "请填写需求 / 产品卖点" },
        { status: 400 }
      );
    }

    // 若传入 contactId，优先从联系人带出姓名/公司/国家/职位/调研摘要
    const resolved = {
      name: name ?? null,
      company: company ?? null,
      country: country ?? null,
      title: title ?? null,
      customerProfile: customerProfile ?? null,
    };

    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId, userId: user.id },
      });
      if (contact) {
        let vars: Record<string, unknown> = {};
        try {
          vars = contact.variables ? JSON.parse(contact.variables) : {};
        } catch {
          // ignore
        }
        resolved.name = resolved.name ?? contact.name;
        resolved.company = resolved.company ?? contact.customer;
        resolved.country =
          resolved.country ?? ((vars.country as string) || null);
        resolved.title = resolved.title ?? ((vars.title as string) || null);
        resolved.customerProfile =
          resolved.customerProfile ?? ((vars.reportSummary as string) || null);
      }
    }

    const config = await getAiConfig(user.id);
    const input: IntroLetterInput = {
      name: resolved.name,
      company: resolved.company,
      country: resolved.country,
      title: resolved.title,
      customerProfile: resolved.customerProfile,
      needs: String(needs),
      productContext: productContext || null,
      language: language || "en",
      tone: tone || null,
      senderName: senderName || null,
      senderTitle: senderTitle || null,
    };

    const html = await generateIntroLetter(input, config);
    return NextResponse.json({ html });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err?.message || "生成失败" },
      { status: 500 }
    );
  }
}
