"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/actions/account";
import { SubmitButton } from "@/components/auth/submit-button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { userSettingFeedSortOptions, type ResolvedUserSettings } from "@/lib/user-settings";

type SettingsFormProps = {
  settings: ResolvedUserSettings;
};

export function SettingsForm({ settings }: SettingsFormProps) {
  const [state, formAction] = useActionState(updateSettingsAction, undefined);

  return (
    <form action={formAction} className="space-y-5 rounded-[1.6rem] border border-border/80 bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="default-feed-sort">Default feed order</Label>
        <Select
          id="default-feed-sort"
          name="defaultFeedSort"
          defaultValue={settings.defaultFeedSort}
          ariaLabel="Default feed order"
          options={userSettingFeedSortOptions.map((option) => ({ value: option.value, label: option.label }))}
          className="h-11 rounded-2xl border-border/70 bg-background/70"
        />
        <p className="text-sm leading-6 text-muted-foreground">
          This becomes the feed order whenever you land on the main feed without an explicit sort in the URL.
        </p>
      </div>

      <div className="space-y-3 rounded-[1.35rem] border border-border/70 bg-white/4 p-4">
        <label className="flex items-start gap-3 text-sm text-secondary-foreground">
          <input
            type="checkbox"
            name="preferAnonymousPublishing"
            defaultChecked={settings.preferAnonymousPublishing}
            className="mt-1 h-4 w-4 accent-[var(--primary)]"
          />
          <span className="space-y-1">
            <span className="block font-medium text-foreground">Open the composer in anonymous mode</span>
            <span className="block leading-6 text-muted-foreground">
              Useful if most of your posts should stay detached from your visible profile.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm text-secondary-foreground">
          <input
            type="checkbox"
            name="autoPromoteAnonymousPosts"
            defaultChecked={settings.autoPromoteAnonymousPosts}
            className="mt-1 h-4 w-4 accent-[var(--primary)]"
          />
          <span className="space-y-1">
            <span className="block font-medium text-foreground">Reopen anonymous posts at the top after publishing</span>
            <span className="block leading-6 text-muted-foreground">
              When enabled, new anonymous posts jump back into view in newest order as soon as you publish.
            </span>
          </span>
        </label>
      </div>

      {state?.message ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {state.message}
        </div>
      ) : null}

      <SubmitButton size="lg" className="w-full sm:w-auto" pendingLabel="Saving settings...">
        Save settings
      </SubmitButton>
    </form>
  );
}