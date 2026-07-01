import { describe, expect, it } from "vitest";

import {
  commentSchema,
  recommendationSchema,
  statusSchema,
} from "./validation";

describe("recommendationSchema", () => {
  it("accepts a valid recommendation", () => {
    const r = recommendationSchema.safeParse({
      title: "Dune: Part Two",
      category: "movie",
      notes: "Epic.",
      taggedForUserId: "",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const r = recommendationSchema.safeParse({
      title: "   ",
      category: "movie",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown category", () => {
    const r = recommendationSchema.safeParse({
      title: "Something",
      category: "podcast",
    });
    expect(r.success).toBe(false);
  });
});

describe("statusSchema", () => {
  it("coerces a string rating to a number", () => {
    const r = statusSchema.parse({
      mediaItemId: "abc",
      status: "consumed",
      rating: "5",
    });
    expect(r.rating).toBe(5);
  });

  it("allows clearing status with 'none'", () => {
    const r = statusSchema.safeParse({ mediaItemId: "abc", status: "none" });
    expect(r.success).toBe(true);
  });

  it("rejects a rating above 5", () => {
    const r = statusSchema.safeParse({
      mediaItemId: "abc",
      status: "consumed",
      rating: "9",
    });
    expect(r.success).toBe(false);
  });
});

describe("commentSchema", () => {
  it("rejects an empty comment body", () => {
    expect(
      commentSchema.safeParse({ mediaItemId: "abc", body: "  " }).success,
    ).toBe(false);
  });
});
