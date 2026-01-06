import { addonBuilder } from "stremio-addon-sdk";
import { manifest } from "./manifest.js";
import { getUpNext } from "./trakt.js";
import express from "express";

const builder = new addonBuilder(manifest);
const app = express();

// Catalog handler
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

// Koppel addon interface aan Express
app.use("/", builder.getInterface());

// Luister op poort Render geeft
const port = process.env.PORT || 7000;
app.listen(port, () => {
  console.log(`Trakt Up Next addon running on port ${port}`);
});
