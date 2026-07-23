"use client";

import { useEffect } from "react";
import { applyTheme, THEME_STORAGE_KEY } from "@/lib/theme";

// 在客户端挂载后，从设置接口拉取用户的主题偏好并应用；
// 同时监听系统主题变化（仅当主题为 system 时自动跟随）。
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let current = "system";

    const applyFromStorage = () => {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved) {
          current = saved;
          applyTheme(saved);
        }
      } catch {
        /* ignore */
      }
    };

    // 先用本地缓存立即应用，避免等待请求
    applyFromStorage();

    // 再从服务端设置拉取权威值
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const theme = data?.theme || current;
        current = theme;
        applyTheme(theme);
      })
      .catch(() => {
        /* 网络失败则保留本地缓存 */
      });

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY) || "system";
        if (saved === "system") applyTheme("system");
      } catch {
        /* ignore */
      }
    };
    mq.addEventListener?.("change", onChange);

    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return <>{children}</>;
}
