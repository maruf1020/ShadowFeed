"use client";

import * as React from "react";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider, useTheme } from "@/components/providers/theme-provider";

function AppProvidersContent({ children }: React.PropsWithChildren) {
  const { theme } = useTheme();

  return (
    <QueryProvider>
      {children}
      <Toaster
        position="top-right"
        theme={theme}
        richColors
        closeButton
        toastOptions={{
          className: "glass-panel text-foreground",
        }}
      />
    </QueryProvider>
  );
}

export function AppProviders({ children }: React.PropsWithChildren) {
  return (
    <ThemeProvider defaultTheme="dark">
      <AppProvidersContent>{children}</AppProvidersContent>
    </ThemeProvider>
  );
}
