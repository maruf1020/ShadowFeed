"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/actions/account";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProfileFormProps = {
  avatarUrl: string | null;
  bio: string | null;
  hintOne: string | null;
  hintTwo: string | null;
  hintThree: string | null;
  moodStatus: string | null;
};

export function ProfileForm(props: ProfileFormProps) {
  const [state, formAction] = useActionState(updateProfileAction, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-[1.6rem] border border-border/80 bg-card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-avatar">Avatar image URL</Label>
          <Input id="profile-avatar" name="avatarUrl" defaultValue={props.avatarUrl ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-mood">Mood status</Label>
          <Input id="profile-mood" name="moodStatus" maxLength={32} defaultValue={props.moodStatus ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-bio">Bio</Label>
        <Textarea id="profile-bio" name="bio" maxLength={200} defaultValue={props.bio ?? ""} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="hint-one">Hint one</Label>
          <Input id="hint-one" name="hintOne" maxLength={20} defaultValue={props.hintOne ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hint-two">Hint two</Label>
          <Input id="hint-two" name="hintTwo" maxLength={20} defaultValue={props.hintTwo ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hint-three">Hint three</Label>
          <Input id="hint-three" name="hintThree" maxLength={20} defaultValue={props.hintThree ?? ""} />
        </div>
      </div>

      {state?.message ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {state.message}
        </div>
      ) : null}

      <SubmitButton size="lg" className="w-full sm:w-auto" pendingLabel="Saving profile...">
        Save profile
      </SubmitButton>
    </form>
  );
}
