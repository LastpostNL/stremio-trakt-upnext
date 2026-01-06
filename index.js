import { addonBuilder } from "stremio-addon-sdk";
import { manifest } from "./manifest.js";
import { getUpNext } from "./trakt.js";

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ id }) => {
  if (id !== "trakt_upnext") return { metas: [] };

  const data = await getUpNext();

  return {
    metas: data
      .filter(item => item.show?.ids?.tmdb)
      .map(item => ({
        id: `tmdb:${item.show.ids.tmdb}:${item.episode.season}:${item.episode.number}`,
        type: "tv"
      }))
  };
});

// ✅ Dit is de juiste manier voor ESM + Node 22
const port = process.env.PORT || 7000;
builder.getInterface().startServer(port)
  .then(() => console.log(`Trakt Up Next addon running on port ${port}`))
  .catch(err => console.error(err));
