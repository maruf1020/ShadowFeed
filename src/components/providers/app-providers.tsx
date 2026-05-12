"use client";

import * as React from "react";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: React.PropsWithChildren) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryProvider>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            className: "glass-panel text-foreground",
          }}
        />
      </QueryProvider>
    </ThemeProvider>
  );
}
