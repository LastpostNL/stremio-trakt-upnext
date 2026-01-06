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
        .filter(item => item.show?.ids?.tmdb) // only items with a TMDB id
        .map(item => {
          const tmdb = item.show.ids.tmdb;
          const season = item.episode.season;
          const number = item.episode.number;
          const seasonStr = String(season).padStart(2, "0");
          const numberStr = String(number).padStart(2, "0");
          const episodeTitle = item.episode.title ? ` — ${item.episode.title}` : "";
          const name = `${item.show.title} — S${seasonStr}E${numberStr}${episodeTitle}`;
          // Trakt sometimes provides images in show.images.*.full
          const poster =
            item.show?.images?.poster?.full ||
            item.show?.images?.fanart?.full ||
            item.show?.images?.banner?.full ||
            null;

          return {
            id: `tmdb:${tmdb}:${season}:${number}`,
            type: "tv",
            name,
            poster,
            ids: { tmdb } // helps metadata addons (AIOmetadata) match the item
          };
        })
    };
  } catch (err) {
    console.error("Error fetching Trakt data:", err && err.message ? err.message : err, err && err.stack ? err.stack : "");
    return { metas: [] };
  }
});

const port = process.env.PORT || 7000;

// Belangrijk: http.createServer werkt perfect met getInterface()
http.createServer(builder.getInterface()).listen(port, '0.0.0.0', () => {
  console.log(`Trakt Up Next addon running on port ${port}`);
});
