import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Book Club",
    short_name: "Book Club",
    description: "Recommend movies, books, games & music to your friends.",
    start_url: "/feed",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#6d5bd0",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
