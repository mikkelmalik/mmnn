import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

/**
 * The data model for the media book-club.
 *
 * Grouping is multi-group-*capable* (groups + memberships) but v1 uses a single
 * seeded group. Everything a member can see is scoped by `groupId`.
 *
 * `mediaItems` carries nullable enrichment columns (externalSource, coverImageUrl,
 * metadata, ...) so a future TMDB / Open Library / IGDB layer is purely additive —
 * no migration needed to add cover art later.
 *
 * NOTE: This targets SQLite for zero-setup local dev. Moving to Postgres (Neon)
 * later is a contained change: swap the column builders (text->uuid, json mode,
 * timestamps) and the driver in src/db/index.ts.
 */

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

// ---------------------------------------------------------------------------
// Auth.js tables (shape required by @auth/drizzle-adapter, sqlite flavor)
// ---------------------------------------------------------------------------

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// ---------------------------------------------------------------------------
// App domain tables
// ---------------------------------------------------------------------------

export const groups = sqliteTable("groups", {
  id: id(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const memberships = sqliteTable(
  "memberships",
  {
    id: id(),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "member"] })
      .notNull()
      .default("member"),
    joinedAt: createdAt(),
  },
  (m) => [unique().on(m.groupId, m.userId)],
);

export const invites = sqliteTable("invites", {
  id: id(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  invitedByUserId: text("invited_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: createdAt(),
});

export const MEDIA_CATEGORIES = [
  "movie",
  "tv",
  "book",
  "game",
  "music",
  "other",
] as const;
export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export const mediaItems = sqliteTable("media_items", {
  id: id(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category", { enum: MEDIA_CATEGORIES }).notNull(),
  notes: text("notes"),
  taggedForUserId: text("tagged_for_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  // --- enrichment (nullable; filled by a future external-API layer) ---
  externalSource: text("external_source", {
    enum: ["tmdb", "openlibrary", "igdb"],
  }),
  externalId: text("external_id"),
  coverImageUrl: text("cover_image_url"),
  metadata: text("metadata", { mode: "json" }),
  enrichedAt: integer("enriched_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const reactions = sqliteTable(
  "reactions",
  {
    id: id(),
    mediaItemId: text("media_item_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: createdAt(),
  },
  (r) => [unique().on(r.mediaItemId, r.userId, r.emoji)],
);

export const comments = sqliteTable("comments", {
  id: id(),
  mediaItemId: text("media_item_id")
    .notNull()
    .references(() => mediaItems.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const ITEM_STATUSES = ["want_to_try", "consumed"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const itemStatuses = sqliteTable(
  "item_statuses",
  {
    id: id(),
    mediaItemId: text("media_item_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", { enum: ITEM_STATUSES }).notNull(),
    rating: integer("rating"),
    updatedAt: updatedAt(),
  },
  (s) => [unique().on(s.mediaItemId, s.userId)],
);
