import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 点击追踪：记录一次链接点击，再 302 跳转到原始链接。
// 公开端点（收件人点击邮件中的改写链接）。
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const t = searchParams.get("t");
  const u = searchParams.get("u");

  // 只放行 http/https 原始链接，杜绝 open-redirect（javascript:/data: 等）
  const target =
    u && /^https?:\/\//i.test(u) ? u : null;

  if (t) {
    try {
      const sr = await prisma.sendRecord.findUnique({ where: { id: t } });
      if (sr) {
        await prisma.sendRecord.update({
          where: { id: t },
          data: {
            clickCount: { increment: 1 },
            clickedAt: sr.clickedAt ?? new Date(),
            lastClickUrl: target,
          },
        });
      }
    } catch {
      // 追踪失败不影响跳转
    }
  }

  // 跳转：有效外链跳转原链接，否则回首页
  const redirectTo = target || "/";
  return NextResponse.redirect(redirectTo, 302);
}
