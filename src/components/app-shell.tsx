import { LogOut } from "lucide-react";
import Link from "next/link";

import { BottomNav } from "@/components/bottom-nav";
import { signOutAction } from "@/lib/auth-actions";

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-900/90">
        <Link href="/feed" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">📚</span>
          <span>{title ?? "Book Club"}</span>
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </form>
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
