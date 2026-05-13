import Link from "next/link";
import { Hash, Home, Shield, UserRound } from "lucide-react";
import { AppMobileHeader, AppSidebarFooter } from "@/components/layout/app-route-chrome";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const navigation = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/profile", label: "Profile", icon: UserRound },
  ];

  if (user.role === "ADMIN") {
    navigation.push({ href: "/admin", label: "Admin", icon: Shield });
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

          <AppSidebarFooter user={user} />
        </aside>

        <div className="space-y-6">
          <AppMobileHeader user={user} />

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
