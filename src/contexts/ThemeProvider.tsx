import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ThemeContext } from "./themeContext";
import type { Theme, ThemeContextValue } from "./themeContext";

const STORAGE_KEY = "project-two-theme";

const detectInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(detectInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light-mode", "dark-mode");
    root.classList.add(theme === "dark" ? "dark-mode" : "light-mode");
    root.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme: () => setThemeState((current) => (current === "dark" ? "light" : "dark")),
      setTheme: (nextTheme: Theme) => setThemeState(nextTheme),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export default ThemeProvider;
