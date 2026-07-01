"use client";

import { useActionState } from "react";

import { MEDIA_CATEGORIES } from "@/db/schema";
import { createRecommendation, type ActionState } from "@/lib/actions";
import { CATEGORY_META, displayName } from "@/lib/format";
import type { UserRef } from "@/lib/queries";

const initial: ActionState = {};

export function RecommendationForm({
  members,
  currentUserId,
}: {
  members: UserRef[];
  currentUserId: string;
}) {
  const [state, formAction, pending] = useActionState(
    createRecommendation,
    initial,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Title</span>
        <input
          name="title"
          required
          maxLength={200}
          placeholder="e.g. Dune: Part Two"
          className="rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900"
        />
      </label>

      <fieldset className="flex flex-col gap-1">
        <span className="text-sm font-medium">Category</span>
        <div className="flex flex-wrap gap-2">
          {MEDIA_CATEGORIES.map((c, i) => (
            <label
              key={c}
              className="cursor-pointer rounded-full border border-stone-300 px-3 py-1.5 text-sm has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:text-brand-700 dark:border-stone-700 dark:has-checked:bg-brand-500/20 dark:has-checked:text-brand-100"
            >
              <input
                type="radio"
                name="category"
                value={c}
                defaultChecked={i === 0}
                className="sr-only"
              />
              {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          Why do you recommend it?{" "}
          <span className="font-normal text-stone-400">(optional)</span>
        </span>
        <textarea
          name="notes"
          rows={4}
          maxLength={4000}
          placeholder="What did you love about it?"
          className="rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          For someone in particular?{" "}
          <span className="font-normal text-stone-400">(optional)</span>
        </span>
        <select
          name="taggedForUserId"
          defaultValue=""
          className="rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900"
        >
          <option value="">Everyone</option>
          {members
            .filter((m) => m.id !== currentUserId)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {displayName(m)}
              </option>
            ))}
        </select>
      </label>

      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post recommendation"}
      </button>
    </form>
  );
}
