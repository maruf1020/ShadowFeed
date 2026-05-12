import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const sans = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ShadowFeed",
    template: "%s | ShadowFeed",
  },
  description:
    "Anonymous developer community for Echologyx with confessions, polls, tags, reactions, and office lore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
