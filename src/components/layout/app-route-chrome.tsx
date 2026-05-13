"use client";

import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getInitials } from "@/lib/utils";

type AppChromeProps = {
  user: {
    username: string;
    fakeEmail: string;
    image?: string | null;
  };
};

export function AppSidebarFooter({ user }: AppChromeProps) {
  const pathname = usePathname();

  if (pathname === "/feed") {
    return null;
  }

  return (
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
  );
}

export function AppMobileHeader({ user }: AppChromeProps) {
  const pathname = usePathname();

  if (pathname === "/feed") {
    return null;
  }

  return (
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
  );
}