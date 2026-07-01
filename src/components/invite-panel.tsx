"use client";

import { Check, Copy, Link2, Trash2 } from "lucide-react";
import { useState } from "react";

import { createInvite, revokeInvite } from "@/lib/invite-actions";

export type InviteView = {
  id: string;
  url: string;
  email: string | null;
  expiresLabel: string;
};

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard may be unavailable (e.g. non-HTTPS); the link is still selectable.
        }
      }}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-medium hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function InvitePanel({ invites }: { invites: InviteView[] }) {
  return (
    <section className="mt-8">
      <h2 className="mb-1 text-lg font-semibold">Invite people</h2>
      <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
        Create a sign-up link and share it. Anyone with the link can join the
        group.
      </p>

      <form action={createInvite} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="email"
          placeholder="Restrict to an email (optional)"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900"
        />
        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Link2 size={16} /> Create link
        </button>
      </form>

      {invites.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {invites.map((inv) => (
            <li
              key={inv.id}
              className="rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inv.url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full truncate rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs text-stone-600 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300"
                />
                <CopyButton url={inv.url} />
                <form action={revokeInvite}>
                  <input type="hidden" name="id" value={inv.id} />
                  <button
                    type="submit"
                    aria-label="Revoke invite"
                    className="inline-flex shrink-0 items-center rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-stone-700 dark:hover:bg-red-950/40"
                  >
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>
              <p className="mt-1.5 text-xs text-stone-400">
                {inv.email ? `For ${inv.email} · ` : "Open link · "}
                expires {inv.expiresLabel}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
