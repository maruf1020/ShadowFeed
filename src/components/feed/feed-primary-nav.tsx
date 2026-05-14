"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CirclePlus, House, Search, Settings2, UserRound, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const formRef = useRef<HTMLFormElement>(null);
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

  function handleFormBlur(event: React.FocusEvent<HTMLFormElement>) {
    const nextFocusedElement = event.relatedTarget;

    if (nextFocusedElement instanceof Node && formRef.current?.contains(nextFocusedElement)) {
      return;
    }

    if (!normalizeSearchValue(draftSearch) && !activeSearch) {
      setIsOpen(false);
    }
  }

  const expanded = isOpen || Boolean(activeSearch);

  if (mobile) {
    return (
      <>
        {isOpen ? (
          <div className="pointer-events-none fixed inset-x-4 bottom-20 z-40 lg:hidden">
            <form
              ref={formRef}
              id="feed-mobile-search"
              onSubmit={submitSearch}
              onBlur={handleFormBlur}
              className={cn(
                "pointer-events-auto rounded-full border border-border/70 bg-background/95 p-2 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.7)] backdrop-blur-sm",
                isPending && "opacity-80",
              )}
            >
              <div className="flex items-center gap-2">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/70 text-muted-foreground">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  ref={inputRef}
                  value={draftSearch}
                  onChange={(event) => setDraftSearch(event.target.value)}
                  placeholder="Search text or #tag"
                  className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  aria-label="Search feed"
                />
                {draftSearch || activeSearch ? (
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

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center gap-1 rounded-full px-3 py-2 text-[0.68rem] text-foreground"
          aria-expanded={isOpen}
          aria-controls="feed-mobile-search"
        >
          <Search className="h-5 w-5" />
          <span>Search</span>
        </button>
      </>
    );
  }

  return (
    <form
      ref={formRef}
      id="feed-desktop-search"
      onSubmit={submitSearch}
      onBlur={handleFormBlur}
      onClick={() => setIsOpen(true)}
      className={cn(
        "theme-panel-interactive flex items-center gap-4 overflow-hidden rounded-full px-3 py-3 text-base text-foreground transition-all duration-300 ease-out",
        expanded ? "w-full" : "w-auto",
        isPending && "opacity-80",
      )}
      aria-label="Search feed"
    >
      <Search className="h-6 w-6 shrink-0" />

      <input
        ref={inputRef}
        value={draftSearch}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => setDraftSearch(event.target.value)}
        placeholder="Search text or #tag"
        className={cn(
          "min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground transition-all duration-200",
          expanded ? "w-full opacity-100" : "hidden",
        )}
      />

      {!expanded ? <span className="truncate">Search</span> : null}

      {expanded && (draftSearch || activeSearch) ? (
        <button
          type="button"
          onClick={clearSearch}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Clear feed search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </form>
  );
}

export function FeedDesktopSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen py-6 lg:flex">
      <div className="space-y-8 pr-4">
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

          <div className="min-w-0 pt-1">
            <FeedSearchLauncher />
          </div>

          <Link
            href="/settings"
            className="theme-panel-interactive flex items-center gap-4 rounded-full px-3 py-3 text-base text-foreground"
          >
            <Settings2 className="h-6 w-6" />
            <span>Settings</span>
          </Link>
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

        <Link href="/settings" className="flex flex-col items-center gap-1 rounded-full px-3 py-2 text-[0.68rem] text-foreground">
          <Settings2 className="h-5 w-5" />
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
}