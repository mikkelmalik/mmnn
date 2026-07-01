"use client";

import { useActionState } from "react";

import {
  signInWithEmail,
  signInWithPassword,
  type SignInState,
} from "@/lib/auth-actions";

const initial: SignInState = {};

const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900";

export default function LoginPage() {
  const [pw, pwAction, pwPending] = useActionState(
    signInWithPassword,
    initial,
  );
  const [link, linkAction, linkPending] = useActionState(
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

      <form action={pwAction} className="flex flex-col gap-3">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClass}
        />
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          className={inputClass}
        />
        {pw.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{pw.error}</p>
        )}
        <button
          type="submit"
          disabled={pwPending}
          className="rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {pwPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-stone-400">
        <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
        or
        <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
      </div>

      {link.sent ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center dark:border-stone-800 dark:bg-stone-900">
          <div className="mb-2 text-3xl">✉️</div>
          <h2 className="font-semibold">Check your email</h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            We sent a sign-in link to <strong>{link.email}</strong>.
          </p>
          <p className="mt-3 text-xs text-stone-400">
            In local dev the link is printed to the server console.
          </p>
        </div>
      ) : (
        <form action={linkAction} className="flex flex-col gap-3">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="Email me a sign-in link instead"
            className={inputClass}
          />
          {link.error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {link.error}
            </p>
          )}
          <button
            type="submit"
            disabled={linkPending}
            className="rounded-xl border border-stone-300 px-4 py-3 font-medium transition-colors hover:bg-stone-100 disabled:opacity-60 dark:border-stone-700 dark:hover:bg-stone-800"
          >
            {linkPending ? "Sending…" : "Send me a magic link"}
          </button>
        </form>
      )}
    </div>
  );
}
