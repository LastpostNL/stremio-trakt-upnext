import { addonBuilder } from "stremio-addon-sdk";
import { manifest } from "./manifest.js";
import { getUpNext } from "./trakt.js";
import http from "http";

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

const port = process.env.PORT || 7000;

// Maak een HTTP server en koppel de addon interface
http.createServer(builder.getInterface()).listen(port, () => {
  console.log(`Trakt Up Next addon running on port ${port}`);
});
