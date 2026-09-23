import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * 圆角矩形 LOGO 容器
 * ------------------------------------------------------------------
 * 把 /logo.jpg 放进统一的圆角矩形(rounded-2xl)白色玻璃 chip 中，
 * 尺寸/圆角由调用方通过 className 控制（例如 "h-16 w-16" 或 "h-16 w-20"）。
 * 登录页、注册页、侧边栏统一复用，避免 LOGO 直接裸放、无圆角。
 */
export function LogoBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-2xl bg-white/90 shadow-sm ring-1 ring-foreground/5 flex items-center justify-center",
        className
      )}
    >
      <Image
        src="/logo.jpg"
        alt="Email-Web"
        width={64}
        height={64}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
