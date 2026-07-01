import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { CategoryBadge } from "@/components/category-badge";
import { MediaCard } from "@/components/media-card";
import { MEDIA_CATEGORIES, type MediaCategory } from "@/db/schema";
import { requireMember } from "@/lib/auth-guard";
import { getFeedItems } from "@/lib/queries";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; for?: string }>;
}) {
  const member = await requireMember();
  const sp = await searchParams;
  const category = MEDIA_CATEGORIES.includes(sp.category as MediaCategory)
    ? (sp.category as MediaCategory)
    : undefined;
  const forMe = sp.for === "me";

  const items = await getFeedItems(member.groupId, member.userId, {
    category,
    forMe,
  });

  const chip = (label: string, href: string, active: boolean) => (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-stone-200 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feed</h1>
        <Link
          href="/new"
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          + Recommend
        </Link>
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {chip("All", "/feed", !category && !forMe)}
        {chip("For me", "/feed?for=me", forMe)}
        {MEDIA_CATEGORIES.map((c) =>
          chip(
            CategoryLabel(c),
            `/feed?category=${c}`,
            category === c && !forMe,
          ),
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState forMe={forMe} />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              currentUserId={member.userId}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function CategoryLabel(c: MediaCategory) {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function EmptyState({ forMe }: { forMe: boolean }) {
  return (
    <div className="mt-16 flex flex-col items-center gap-3 text-center text-stone-500 dark:text-stone-400">
      <span className="text-4xl">🍿</span>
      <p className="max-w-xs">
        {forMe
          ? "Nothing recommended just for you yet."
          : "No recommendations yet. Be the first to share something great!"}
      </p>
      <Link
        href="/new"
        className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Add a recommendation
      </Link>
      <span className="mt-2 flex gap-1">
        {(["movie", "book", "game", "music"] as MediaCategory[]).map((c) => (
          <CategoryBadge key={c} category={c} />
        ))}
      </span>
    </div>
  );
}
