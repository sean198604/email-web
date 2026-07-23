import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/auth";

// 上传目录：放在数据卷 /app/data 下，随容器持久化，重建不丢失
const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/data/uploads";
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 });
    }

    const f = file as File;
    if (f.size === 0) {
      return NextResponse.json({ error: "文件为空" }, { status: 400 });
    }
    if (f.size > MAX_SIZE) {
      return NextResponse.json({ error: "文件超过 25MB 限制" }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    // 原文件名仅用于展示；存储名加入 uuid 避免覆盖与特殊字符路径问题
    const safeName = f.name.replace(/[^\w.\-\u4e00-\u9fa5]/g, "_");
    const storedName = `${randomUUID()}-${safeName}`;
    const buffer = Buffer.from(await f.arrayBuffer());
    await writeFile(join(UPLOAD_DIR, storedName), buffer);

    return NextResponse.json({
      filename: f.name,
      path: join(UPLOAD_DIR, storedName),
    });
  } catch (error) {
    const err = error as Error;
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "上传失败: " + (err?.message || "未知错误") },
      { status: 500 }
    );
  }
}
