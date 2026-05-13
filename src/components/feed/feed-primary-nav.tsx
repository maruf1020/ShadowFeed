import Link from "next/link";
import { CirclePlus, House, UserRound } from "lucide-react";

const desktopNavItems = [
  { href: "/feed", label: "Home", icon: House },
  { href: "#shadowfeed-composer", label: "Create", icon: CirclePlus },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const mobileNavItems = [
  { href: "/feed", label: "Home", icon: House },
  { href: "#shadowfeed-composer", label: "Create", icon: CirclePlus },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function FeedDesktopSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen py-6 lg:flex">
      <div className="space-y-8 pr-6">
        <Link href="/feed" className="block px-3 text-2xl font-semibold tracking-tight text-foreground">
          ShadowFeed
        </Link>

        <nav className="space-y-2">
          {desktopNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="theme-panel-interactive flex items-center gap-4 rounded-full px-3 py-3 text-base text-foreground"
            >
              <Icon className="h-6 w-6" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export function FeedMobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-2 py-2 backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {mobileNavItems.map(({ href, label, icon: Icon }) => (
          <Link key={label} href={href} className="flex flex-col items-center gap-1 rounded-full px-3 py-2 text-[0.68rem] text-foreground">
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}