import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "邮件群发工具",
  description: "专业高效的网页版邮件群发系统",
};

// 在首屏绘制前根据本地缓存的主题设置 .dark 类，避免深浅色闪烁
const themeInitScript = `try{var t=localStorage.getItem('email-web-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-full text-foreground flex">
        <div className="app-backdrop" aria-hidden />
        <ThemeProvider>
          <TooltipProvider>
            <Sidebar />
            <main className="flex-1 overflow-auto pt-14 md:pt-0">
              <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                {children}
              </div>
            </main>
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
