"use client";

import * as React from "react";
export type AppTheme = "dark" | "light";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "shadowfeed-theme";

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = React.PropsWithChildren<{
  defaultTheme?: AppTheme;
}>;

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

function getStoredTheme(defaultTheme: AppTheme) {
  if (typeof window === "undefined") {
    return defaultTheme;
  }

  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);

    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }
  } catch {}

  return defaultTheme;
}

export function ThemeProvider({ children, defaultTheme = "dark" }: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<AppTheme>(() => getStoredTheme(defaultTheme));

  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = React.useCallback((nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {}
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = React.useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [setTheme, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
