"use client";

import { useActionState } from "react";

import { signUpWithInvite, type SignUpState } from "@/lib/auth-actions";

const initial: SignUpState = {};

const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900 disabled:opacity-70";

export function SignupForm({
  token,
  lockedEmail,
}: {
  token: string;
  lockedEmail: string | null;
}) {
  const [state, action, pending] = useActionState(signUpWithInvite, initial);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <input
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        defaultValue={lockedEmail ?? undefined}
        readOnly={!!lockedEmail}
        className={inputClass}
      />
      <input
        type="text"
        name="name"
        autoComplete="name"
        placeholder="Your name (optional)"
        className={inputClass}
      />
      <input
        type="password"
        name="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="Choose a password (min 8 characters)"
        className={inputClass}
      />
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account & join"}
      </button>
    </form>
  );
}
