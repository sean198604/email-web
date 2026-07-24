"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "注册失败");
        return;
      }
      // 注册成功后服务端已写入会话 cookie，这里校验浏览器确实保存并能带回
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      if (meRes.ok) {
        toast.success("注册成功");
        // 整页跳转进入系统：最可靠，绕开客户端 RSC 导航对 cookie 的传递细节
        window.location.href = "/";
        return;
      }
      toast.error(
        "注册已成功，但浏览器未能保存会话。请检查是否禁用了 Cookie，或改用无痕窗口后重试。"
      );
    } catch {
      toast.error("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo.jpg" alt="Email-Web" width={64} height={64} className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">创建账号</CardTitle>
          <CardDescription>每个账号数据完全隔离</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名（可选）</Label>
              <Input
                id="name"
                placeholder="您的称呼"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少6位"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "注册中..." : "注册"}
            </Button>
            <p className="text-sm text-muted-foreground">
              已有账号？{" "}
              <Link href="/login" className="text-primary hover:underline">
                直接登录
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
