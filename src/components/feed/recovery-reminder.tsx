"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RecoveryReminder() {
  const [open, setOpen] = useState(true);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="glass-panel w-full max-w-md rounded-[1.6rem] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
          Optional recovery setup
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-balance">
          Add recovery questions before you forget your password.
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This is skippable, but if you do not set recovery answers from your profile there is no
          way back into this anonymous account later.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/profile">Open profile settings</Link>
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}
