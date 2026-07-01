import { MessageCircle } from "lucide-react";
import Link from "next/link";

import { CategoryBadge } from "@/components/category-badge";
import { displayName, timeAgo } from "@/lib/format";
import type { FeedItem } from "@/lib/queries";

export function MediaCard({
  item,
  currentUserId,
}: {
  item: FeedItem;
  currentUserId: string;
}) {
  const totalReactions = item.reactions.reduce((n, r) => n + r.count, 0);
  return (
    <Link
      href={`/item/${item.id}`}
      className="block rounded-2xl border border-stone-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <CategoryBadge category={item.category} />
            {item.taggedFor && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                for{" "}
                {item.taggedFor.id === currentUserId
                  ? "you"
                  : displayName(item.taggedFor)}
              </span>
            )}
          </div>
          <h3 className="truncate text-lg font-semibold">{item.title}</h3>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
            {displayName(item.author)} · {timeAgo(item.createdAt)}
          </p>
        </div>
        {item.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverImageUrl}
            alt=""
            className="h-16 w-12 shrink-0 rounded-md object-cover"
          />
        )}
      </div>

      {item.notes && (
        <p className="mt-2 line-clamp-3 text-sm text-stone-700 dark:text-stone-300">
          {item.notes}
        </p>
      )}

      <div className="mt-3 flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
        {totalReactions > 0 && (
          <span className="flex items-center gap-1">
            {item.reactions.slice(0, 3).map((r) => (
              <span key={r.emoji} aria-hidden>
                {r.emoji}
              </span>
            ))}
            <span className="tabular-nums">{totalReactions}</span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <MessageCircle size={15} />
          <span className="tabular-nums">{item.commentCount}</span>
        </span>
        {item.statusSummary.consumed > 0 && (
          <span className="tabular-nums">
            ✓ {item.statusSummary.consumed} done
          </span>
        )}
      </div>
    </Link>
  );
}
