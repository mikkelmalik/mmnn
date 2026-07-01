import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/**
 * The data model for the media book-club.
 *
 * Grouping is multi-group-*capable* (groups + memberships) but v1 uses a single
 * seeded group. Everything a member can see is scoped by `groupId`.
 *
 * `mediaItems` carries nullable enrichment columns (externalSource, coverImageUrl,
 * metadata, ...) so a future TMDB / Open Library / IGDB layer is purely additive —
 * no migration needed to add cover art later.
 */

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  timestamp("created_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date());

const updatedAt = () =>
  timestamp("updated_at", { mode: "date" })
    .notNull()
    .$defaultFn(() => new Date());

// ---------------------------------------------------------------------------
// Auth.js tables (shape required by @auth/drizzle-adapter, postgres flavor)
// ---------------------------------------------------------------------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // scrypt hash for email+password login (magic-link users leave this null).
  passwordHash: text("password_hash"),
});

export const accounts = pgTable(
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

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// ---------------------------------------------------------------------------
// App domain tables
// ---------------------------------------------------------------------------

export const groups = pgTable("groups", {
  id: id(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const memberships = pgTable(
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

export const invites = pgTable("invites", {
  id: id(),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  // null = an open, shareable sign-up link anyone can use until it expires.
  // set = a link addressed to one person (email is pre-filled, single-use).
  email: text("email"),
  token: text("token").notNull().unique(),
  invitedByUserId: text("invited_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  acceptedAt: timestamp("accepted_at", { mode: "date" }),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
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

export const mediaItems = pgTable("media_items", {
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
  metadata: jsonb("metadata"),
  enrichedAt: timestamp("enriched_at", { mode: "date" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const reactions = pgTable(
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

export const comments = pgTable("comments", {
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

export const itemStatuses = pgTable(
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
