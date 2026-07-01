"use client";

import { useActionState } from "react";

import { signInWithEmail, type SignInState } from "@/lib/auth-actions";

const initial: SignInState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    signInWithEmail,
    initial,
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">📚</div>
        <h1 className="text-3xl font-bold">Book Club</h1>
        <p className="mt-2 text-stone-500 dark:text-stone-400">
          Recommend movies, books, games &amp; music to your friends.
        </p>
      </div>

      {state.sent ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center dark:border-stone-800 dark:bg-stone-900">
          <div className="mb-2 text-3xl">✉️</div>
          <h2 className="font-semibold">Check your email</h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            We sent a sign-in link to <strong>{state.email}</strong>.
          </p>
          <p className="mt-3 text-xs text-stone-400">
            In local dev the link is printed to the server console.
          </p>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900"
          />
          {state.error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send me a sign-in link"}
          </button>
        </form>
      )}
    </div>
  );
}
