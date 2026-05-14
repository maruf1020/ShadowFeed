"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CirclePlus, House, Search, UserRound, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const primaryNavItems = [
  { href: "/feed", label: "Home", icon: House },
  { href: "/feed?compose=1#shadowfeed-composer", label: "Create", icon: CirclePlus },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function normalizeSearchValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildFeedSearchHref(pathname: string, searchParamsString: string, nextSearchValue: string) {
  const nextParams = new URLSearchParams(searchParamsString);
  const normalizedSearch = normalizeSearchValue(nextSearchValue);

  if (normalizedSearch) {
    nextParams.set("search", normalizedSearch);
  } else {
    nextParams.delete("search");
  }

  nextParams.delete("tag");
  nextParams.delete("limit");
  nextParams.delete("post");
  nextParams.delete("compose");

  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function FeedSearchLauncher({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const activeSearch = searchParams.get("search") ?? "";
  const [isOpen, setIsOpen] = useState(Boolean(activeSearch));
  const [draftSearch, setDraftSearch] = useState(activeSearch);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftSearch(activeSearch);

    if (activeSearch) {
      setIsOpen(true);
    }
  }, [activeSearch]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const href = buildFeedSearchHref(pathname, searchParams.toString(), draftSearch);
    const nextSearch = normalizeSearchValue(draftSearch);

    startTransition(() => {
      router.replace(href, { scroll: false });
    });

    if (!nextSearch) {
      setIsOpen(false);
    }
  }

  function clearSearch() {
    setDraftSearch("");
    setIsOpen(false);

    startTransition(() => {
      router.replace(buildFeedSearchHref(pathname, searchParams.toString(), ""), { scroll: false });
    });
  }

  const trigger = (
    <button
      type="button"
      onClick={() => setIsOpen((current) => !current)}
      className={cn(
        "theme-panel-interactive flex items-center gap-4 rounded-full px-3 py-3 text-base text-foreground",
        mobile && "flex flex-col gap-1 px-3 py-2 text-[0.68rem]",
        isOpen && "border border-border/70 bg-white/6",
      )}
      aria-expanded={isOpen}
      aria-controls={mobile ? "feed-mobile-search" : "feed-desktop-search"}
    >
      <Search className={cn("h-6 w-6", mobile && "h-5 w-5")} />
      <span>Search</span>
    </button>
  );

  if (mobile) {
    return (
      <>
        {isOpen ? (
          <div className="pointer-events-none fixed inset-x-4 bottom-20 z-40 lg:hidden">
            <form
              id="feed-mobile-search"
              onSubmit={submitSearch}
              className={cn(
                "pointer-events-auto rounded-3xl border border-border/70 bg-background/95 p-3 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.7)] backdrop-blur-sm",
                isPending && "opacity-80",
              )}
            >
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={draftSearch}
                  onChange={(event) => setDraftSearch(event.target.value)}
                  placeholder="Search text or #tag"
                  className="h-10 rounded-full"
                />
                {activeSearch ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Clear feed search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        ) : null}

        {trigger}
      </>
    );
  }

  return (
    <div className="space-y-2">
      {trigger}

      {isOpen ? (
        <form
          id="feed-desktop-search"
          onSubmit={submitSearch}
          className={cn("space-y-2 rounded-[1.4rem] border border-border/70 bg-card/85 p-3", isPending && "opacity-80")}
        >
          <Input
            ref={inputRef}
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Search text or #tag"
            className="h-10 rounded-full bg-input/70"
          />

          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Press Enter to update the feed</span>
            {activeSearch ? (
              <button type="button" onClick={clearSearch} className="font-medium text-primary transition-opacity hover:opacity-80">
                Clear
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}

export function FeedDesktopSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen py-6 lg:flex">
      <div className="space-y-8 pr-6">
        <Link href="/feed" className="block px-3 text-2xl font-semibold tracking-tight text-foreground">
          ShadowFeed
        </Link>

        <nav className="space-y-2">
          {primaryNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="theme-panel-interactive flex items-center gap-4 rounded-full px-3 py-3 text-base text-foreground"
            >
              <Icon className="h-6 w-6" />
              <span>{label}</span>
            </Link>
          ))}

          <FeedSearchLauncher />
        </nav>
      </div>
    </aside>
  );
}

export function FeedMobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-2 py-2 backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {primaryNavItems.map(({ href, label, icon: Icon }) => (
          <Link key={label} href={href} className="flex flex-col items-center gap-1 rounded-full px-3 py-2 text-[0.68rem] text-foreground">
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}

        <FeedSearchLauncher mobile />
      </div>
    </nav>
  );
}