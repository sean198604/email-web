import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { sendEmail } from "@/lib/mailer";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { accountId, to, subject, html, text, replyTo } = body;

    if (!accountId || !to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: accountId, to, subject, html" },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId, userId: user.id },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const result = await sendEmail(account, to, subject, html, text, replyTo);

    return NextResponse.json(result);
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}
