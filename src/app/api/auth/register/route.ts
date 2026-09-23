import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { DEFAULT_TEMPLATES } from "@/lib/default-templates";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "邮箱和密码必填，密码至少6位" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "邮箱已被注册" }, { status: 409 });
    }

    // 管理员引导：当环境变量 ADMIN_EMAIL / ADMIN_PASSWORD 设置，
    // 且注册邮箱与密码与之匹配时，自动创建为管理员账号
    const isAdminBootstrap =
      !!process.env.ADMIN_EMAIL &&
      !!process.env.ADMIN_PASSWORD &&
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD;

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: await hashPassword(password),
        role: isAdminBootstrap ? "admin" : "user",
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    await setAuthCookie(token);

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
