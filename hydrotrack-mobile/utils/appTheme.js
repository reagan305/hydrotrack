export const getAppTheme = (themeMode = "dark") => {
  const isDark = themeMode === "dark";

  return {
    isDark,
    bg: isDark ? "#020617" : "#f4f8fc",
    card: isDark ? "#0f172a" : "#ffffff",
    soft: isDark ? "#111827" : "#e2e8f0",
    text: isDark ? "#ffffff" : "#0f172a",
    subtext: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "#1e293b" : "#cbd5e1",
    nav: isDark ? "#0f172a" : "#ffffff",
  };
};