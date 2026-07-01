import { toggleReaction } from "@/lib/actions";
import { REACTION_EMOJIS } from "@/lib/format";
import type { FeedItem } from "@/lib/queries";

/**
 * Interactive emoji reactions via a server action (progressive enhancement —
 * works without client JS). Each emoji is its own submit button.
 */
export function ReactionBar({
  itemId,
  reactions,
}: {
  itemId: string;
  reactions: FeedItem["reactions"];
}) {
  const counts = new Map(reactions.map((r) => [r.emoji, r]));
  return (
    <div className="flex flex-wrap gap-1.5">
      {REACTION_EMOJIS.map((emoji) => {
        const agg = counts.get(emoji);
        const mine = agg?.mine ?? false;
        const count = agg?.count ?? 0;
        return (
          <form key={emoji} action={toggleReaction}>
            <input type="hidden" name="mediaItemId" value={itemId} />
            <input type="hidden" name="emoji" value={emoji} />
            <button
              type="submit"
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition-colors ${
                mine
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-100"
                  : "border-stone-200 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
              }`}
              aria-pressed={mine}
              aria-label={`React ${emoji}`}
            >
              <span aria-hidden>{emoji}</span>
              {count > 0 && (
                <span className="text-xs tabular-nums">{count}</span>
              )}
            </button>
          </form>
        );
      })}
    </div>
  );
}
