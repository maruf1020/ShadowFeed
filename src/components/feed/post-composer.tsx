"use client";

import { useActionState, useState } from "react";
import { createPostAction } from "@/actions/feed";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { postCategoryOptions } from "@/lib/constants";

export function PostComposer() {
  const [state, formAction] = useActionState(createPostAction, undefined);
  const [category, setCategory] = useState("CONFESSION");

  return (
    <form action={formAction} className="space-y-4 rounded-[1.7rem] border border-border/80 bg-card p-6">
      <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-2">
          <Label htmlFor="composer-category">Category</Label>
          <select
            id="composer-category"
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="flex h-11 w-full rounded-2xl border border-border bg-input px-4 text-sm text-foreground"
          >
            {postCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="composer-title">Title</Label>
          <Input id="composer-title" name="title" placeholder="Optional title for your post" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="composer-content">Post</Label>
        <Textarea
          id="composer-content"
          name="content"
          placeholder="Today I want to say..."
          className="min-h-36"
        />
        {state?.errors?.content ? (
          <p className="text-sm text-destructive">{state.errors.content[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="composer-tags">Tags</Label>
          <Input id="composer-tags" name="tags" placeholder="meeting, buglife, canteen" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="composer-gif">GIF URL</Label>
          <Input id="composer-gif" name="gifUrl" placeholder="https://media.giphy.com/..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="composer-image">Image URL</Label>
          <Input id="composer-image" name="imageUrl" placeholder="https://..." />
        </div>
      </div>

      {category === "POLL" ? (
        <div className="grid gap-4 rounded-[1.4rem] border border-primary/20 bg-primary/7 p-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="composer-poll-question">Poll question</Label>
            <Input id="composer-poll-question" name="pollQuestion" placeholder="Remote or office?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="poll-option-one">Option one</Label>
            <Input id="poll-option-one" name="pollOptionOne" placeholder="Remote" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="poll-option-two">Option two</Label>
            <Input id="poll-option-two" name="pollOptionTwo" placeholder="Office" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="poll-option-three">Optional third option</Label>
            <Input id="poll-option-three" name="pollOptionThree" placeholder="Hybrid chaos" />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-[1.4rem] border border-border/80 bg-white/4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm text-secondary-foreground">
          <input defaultChecked type="checkbox" name="isAnonymous" className="h-4 w-4 accent-[var(--primary)]" />
          Post anonymously
        </label>
        <label className="flex items-center gap-3 text-sm text-secondary-foreground">
          <input defaultChecked type="checkbox" name="allowComments" className="h-4 w-4 accent-[var(--primary)]" />
          Allow comments
        </label>
      </div>

      {state?.message ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {state.message}
        </div>
      ) : null}

      <SubmitButton size="lg" className="w-full" pendingLabel="Publishing...">
        Publish to the feed
      </SubmitButton>
    </form>
  );
}
