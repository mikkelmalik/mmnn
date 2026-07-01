import type { MediaCategory } from "@/db/schema";
import { CATEGORY_META } from "@/lib/format";

export function CategoryBadge({ category }: { category: MediaCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-100">
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
