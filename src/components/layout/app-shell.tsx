"use client";

import Link from "next/link";
import { Hash, Home, Shield, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoutButton } from "@/components/auth/logout-button";
import { getInitials } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    username: string;
    fakeEmail: string;
    image?: string | null;
    role: string;
  };
};

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const isFeedRoute = pathname === "/feed";
  const navigation = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/profile", label: "Profile", icon: UserRound },
  ];

  if (user.role === "ADMIN") {
    navigation.push({ href: "/admin", label: "Admin", icon: Shield });
  }

  if (isFeedRoute) {
    return <>{children}</>;
  }

  return (
    <div className="shadow-feed-shell min-h-screen">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-10">
        <aside className="glass-panel hidden rounded-[1.8rem] p-6 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-8">
            <div className="space-y-3">
              <Badge className="w-fit">ShadowFeed</Badge>
              <h1 className="text-2xl font-semibold tracking-tight">The dev feed behind the office noise.</h1>
            </div>

            <nav className="space-y-2">
              {navigation.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="theme-panel-interactive flex items-center gap-3 rounded-2xl border border-border/60 bg-white/4 px-4 py-3 text-sm text-secondary-foreground"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4 rounded-[1.4rem] border border-border/70 bg-black/20 p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.image ?? undefined} alt={user.username} />
                <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">@{user.username}</p>
                <p className="text-sm text-muted-foreground">{user.fakeEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <header className="glass-panel theme-floating-shadow flex flex-col gap-4 rounded-[1.6rem] px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:hidden">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">
                ShadowFeed mobile shell
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Anonymous office network</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Badge variant="muted">@{user.username}</Badge>
              <LogoutButton />
            </div>
          </header>

          <main>{children}</main>

          <nav className="glass-panel fixed inset-x-4 bottom-4 z-20 flex items-center justify-around rounded-full px-3 py-3 lg:hidden">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </Link>
            ))}
            <Link href="/feed?tag=meeting" className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
              <Hash className="h-4 w-4 text-primary" />
              Tags
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}