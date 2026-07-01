import { formatDistanceToNow } from "date-fns";

import type { MediaCategory } from "@/db/schema";

export const CATEGORY_META: Record<
  MediaCategory,
  { label: string; emoji: string }
> = {
  movie: { label: "Movie", emoji: "🎬" },
  tv: { label: "TV", emoji: "📺" },
  book: { label: "Book", emoji: "📚" },
  game: { label: "Game", emoji: "🎮" },
  music: { label: "Music", emoji: "🎵" },
  other: { label: "Other", emoji: "✨" },
};

export const REACTION_EMOJIS = ["🔥", "👀", "❤️", "😂", "👍", "🤔"] as const;

export function timeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function displayName(
  user: { name: string | null; email: string | null } | null | undefined,
): string {
  if (!user) return "Someone";
  if (user.name) return user.name;
  if (user.email) return user.email.split("@")[0];
  return "Someone";
}
