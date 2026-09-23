import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TRANSPARENT_GIF_BUFFER } from "@/lib/tracking";

// 打开追踪像素：邮件客户端加载该 1x1 图片即记为一次「打开」。
// 公开端点（邮件客户端请求，不带登录态）。
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const t = searchParams.get("t");

  if (t) {
    try {
      const sr = await prisma.sendRecord.findUnique({ where: { id: t } });
      if (sr) {
        // 首次打开记录时间；openCount 每次加载累加（可多次打开）
        await prisma.sendRecord.update({
          where: { id: t },
          data: {
            openCount: { increment: 1 },
            openedAt: sr.openedAt ?? new Date(),
          },
        });
      }
    } catch {
      // 追踪失败不影响邮件本身，静默忽略
    }
  }

  // 返回透明 GIF，禁止缓存
  return new NextResponse(TRANSPARENT_GIF_BUFFER, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Content-Length": String(TRANSPARENT_GIF_BUFFER.length),
    },
  });
}
