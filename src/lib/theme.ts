// 主题应用逻辑：把 light/dark/system 映射到 <html> 的 .dark 类
export const THEME_STORAGE_KEY = "email-web-theme";

export function resolveDark(theme: string): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  // system
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return false;
}

export function applyTheme(theme: string): void {
  if (typeof document === "undefined") return;
  const isDark = resolveDark(theme);
  document.documentElement.classList.toggle("dark", isDark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}
