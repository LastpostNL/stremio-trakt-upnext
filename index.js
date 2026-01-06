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
        .map(item => {
          const tmdb = item.show.ids.tmdb;
          const season = item.episode.season;
          const number = item.episode.number;
          const seasonStr = String(season).padStart(2, "0");
          const numberStr = String(number).padStart(2, "0");
          const episodeTitle = item.episode.title ? ` — ${item.episode.title}` : "";
          const name = `${item.show.title} — S${seasonStr}E${numberStr}${episodeTitle}`;
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
            ids: { tmdb }
          };
        })
    };
  } catch (err) {
    console.error("Error fetching Trakt data:", err && err.message ? err.message : err, err && err.stack ? err.stack : "");
    return { metas: [] };
  }
});

const port = Number(process.env.PORT) || 7000;

// wrap the stremio interface so we can respond on / and /ping for Render
const stremioInterface = builder.getInterface();
const server = http.createServer((req, res) => {
  // quick health endpoints to satisfy Render's probes
  if (req.url === "/" || req.url === "/ping") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }
  // forward everything else to the stremio interface
  try {
    stremioInterface(req, res);
  } catch (err) {
    console.error("Error in handler:", err);
    // best-effort response
    if (!res.headersSent) {
      res.writeHead(500);
    }
    res.end("internal server error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Trakt Up Next addon running on port ${port}`);
});
