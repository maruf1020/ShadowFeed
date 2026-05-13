"use client";

import { useSyncExternalStore } from "react";
import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";

function subscribe() {
  return () => {};
}

export function ThemeToggle() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (!mounted) {
    return <span aria-hidden className="inline-flex h-10 w-10 rounded-full border border-border/80 bg-white/4" />;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="h-10 w-10 rounded-full px-0"
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
