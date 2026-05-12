import type { ReactNode } from "react";
import Link from "next/link";
import { Ghost } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
  asideTitle: string;
  asideCopy: string;
  bullets: string[];
};

export function AuthShell({
  badge,
  title,
  description,
  children,
  asideTitle,
  asideCopy,
  bullets,
}: AuthShellProps) {
  return (
    <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:py-14">
      <Card className="hidden flex-col justify-between lg:flex">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
              <Ghost className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                ShadowFeed
              </p>
              <p className="text-sm text-muted-foreground">Echologyx internal network</p>
            </div>
          </div>

          <Badge className="w-fit">{asideTitle}</Badge>
          <div className="space-y-4">
            <h2 className="text-4xl font-semibold tracking-tight text-balance">{asideCopy}</h2>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              Anonymous on the surface, structured underneath. The first pass focuses on clean
              identity gates, fast posting loops, and moderation-ready audit trails.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-[1.6rem] border border-border/80 bg-white/4 p-6">
          {bullets.map((bullet) => (
            <div key={bullet} className="rounded-2xl border border-border/70 bg-black/20 px-4 py-4">
              <p className="text-sm leading-6 text-secondary-foreground">{bullet}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex items-center justify-center p-0">
        <div className="w-full max-w-xl p-7 sm:p-9">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-primary"
          >
            Back to ShadowFeed
          </Link>
          <Badge className="w-fit">{badge}</Badge>
          <div className="mt-5 space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {title}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
          </div>

          <div className="mt-8">{children}</div>
        </div>
      </Card>
    </div>
  );
}
