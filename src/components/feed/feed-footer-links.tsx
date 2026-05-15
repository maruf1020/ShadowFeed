"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const footerLinks = [
  {
    key: "about",
    label: "About",
    emoji: "🚧",
    description: "The About page is still being shaped and will be available soon.",
  },
  {
    key: "help",
    label: "Help",
    emoji: "🛠️",
    description: "The Help section is not ready yet, but the support surface will land here.",
  },
  {
    key: "privacy",
    label: "Privacy",
    emoji: "🔒",
    description: "The Privacy details are under construction and will be published here soon.",
  },
  {
    key: "terms",
    label: "Terms",
    emoji: "📝",
    description: "The Terms page is still under construction and will be added here shortly.",
  },
] as const;

type FooterLinkKey = (typeof footerLinks)[number]["key"];

export function FeedFooterLinks() {
  const [activeKey, setActiveKey] = useState<FooterLinkKey | null>(null);

  const activeLink = useMemo(
    () => footerLinks.find((item) => item.key === activeKey) ?? null,
    [activeKey],
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {footerLinks.map((item, index) => (
          <div key={item.key} className="contents">
            {index ? <span aria-hidden="true">·</span> : null}
            <a
              href={`#footer-${item.key}`}
              onClick={(event) => {
                event.preventDefault();
                setActiveKey(item.key);
              }}
              className="font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {item.label}
            </a>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(activeLink)} onOpenChange={(open) => (!open ? setActiveKey(null) : undefined)}>
        <DialogContent className="max-w-md overflow-hidden border border-border/70 bg-card/98 p-0">
          <DialogHeader className="items-center border-b border-border/70 px-6 py-8 text-center">
            <span className="text-6xl leading-none" aria-hidden="true">
              {activeLink?.emoji}
            </span>
            <DialogTitle className="text-center text-2xl text-balance">
              {activeLink?.label} is under construction
            </DialogTitle>
            <DialogDescription className="max-w-sm text-center text-sm leading-6">
              {activeLink?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 pt-4 text-center">
            <p className="text-sm leading-6 text-muted-foreground">
              This popup is temporary while the page is being built for ShadowFeed.
            </p>
            <button
              type="button"
              onClick={() => setActiveKey(null)}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full border border-border/70 px-5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
            >
              Close popup
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}