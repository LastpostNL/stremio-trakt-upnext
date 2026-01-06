import { addonBuilder } from "stremio-addon-sdk";
import { manifest } from "./manifest.js";
import { getUpNext } from "./trakt.js";
import express from "express";

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ id }) => {
  if (id !== "trakt_upnext") return { metas: [] };

  try {
    const data = await getUpNext();
    return {
      metas: data
        .filter(item => item.show?.ids?.tmdb)
        .map(item => ({
          id: `tmdb:${item.show.ids.tmdb}:${item.episode.season}:${item.episode.number}`,
          type: "tv"
        }))
    };
  } catch (err) {
    console.error("Error fetching Trakt data:", err);
    return { metas: [] };
  }
});

// 🚀 Express server voor Render
const app = express();
const port = process.env.PORT || 7000;

// Stremio interface koppelen
app.use("/", builder.getInterface());

// Start server
app.listen(port, () => {
  console.log(`Trakt Up Next addon running on port ${port}`);
});
