"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  Send,
  Server,
  List,
  Shield,
  Settings,
  LogOut,
  User,
  Menu,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogoBadge } from "@/components/logo-badge";

const navItems = [
  { icon: LayoutDashboard, label: "仪表盘", href: "/" },
  { icon: Users, label: "联系人管理", href: "/contacts" },
  { icon: FileText, label: "邮件模板", href: "/templates" },
  { icon: Send, label: "群发任务", href: "/tasks" },
  { icon: Server, label: "账号管理", href: "/accounts" },
  { icon: List, label: "发送日志", href: "/logs" },
  { icon: Eye, label: "邮件追踪", href: "/tracking" },
  { icon: Shield, label: "黑名单", href: "/blacklist" },
  { icon: Settings, label: "设置", href: "/settings" },
];

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.user && setUser(data.user))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      toast.success("已退出登录");
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <>
      {/* 移动端顶部栏 */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 h-14 flex items-center gap-2 px-3 backdrop-blur-2xl bg-sidebar/70 border-b border-foreground/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="打开菜单"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <LogoBadge className="h-8 w-8 rounded-xl" />
        <span className="font-semibold text-sm truncate">邮件群发工具</span>
      </div>

      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "w-56 h-full backdrop-blur-2xl bg-sidebar/60 border-r border-foreground/10 text-foreground flex flex-col shrink-0 shadow-[0_0_30px_rgba(15,23,42,0.08)]",
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-out",
          "md:static md:z-auto md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      <div className="h-16 flex items-center px-4 border-b border-foreground/10">
        <LogoBadge className="h-9 w-9 rounded-xl mr-2 shrink-0" />
        <span className="font-semibold text-foreground text-sm truncate">邮件群发工具</span>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {[...navItems, ...(user?.role === "admin" ? [{ icon: Shield, label: "系统管理", href: "/admin" }] : [])].map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm transition-all",
                isActive
                  ? "bg-primary/20 text-primary font-medium shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary),transparent_70%)]"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-foreground/10 space-y-3">
        {user && (
          <div className="flex items-center gap-2 px-2">
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground truncate">{user.name || user.email}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setMobileOpen(false);
            handleLogout();
          }}
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-foreground/5"
        >
          <LogOut className="h-4 w-4 mr-2" />
          退出登录
        </Button>
      </div>
    </aside>
    </>
  );
}
