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

// get the stremio interface once
const stremioInterfaceCandidate = builder.getInterface();

// helper to attempt calling the interface using a few possible shapes
function callStremioInterface(handlerCandidate, req, res) {
  try {
    if (typeof handlerCandidate === "function") {
      return handlerCandidate(req, res);
    }
    if (handlerCandidate && typeof handlerCandidate.default === "function") {
      return handlerCandidate.default(req, res);
    }
    if (handlerCandidate && typeof handlerCandidate.handle === "function") {
      return handlerCandidate.handle(req, res);
    }
    if (handlerCandidate && typeof handlerCandidate.callback === "function") {
      return handlerCandidate.callback(req, res);
    }
    console.error("stremio interface is not callable. typeof:", typeof handlerCandidate, "value:", handlerCandidate);
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("stremio interface not available");
  } catch (err) {
    console.error("Error calling stremio interface:", err);
    if (!res.headersSent) res.writeHead(500);
    res.end("internal server error");
  }
}

// create server and respond to Render health checks
const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/ping") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  // forward to stremio interface
  callStremioInterface(stremioInterfaceCandidate, req, res);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Trakt Up Next addon running on port ${port}`);
  console.log("stremioInterface typeof:", typeof stremioInterfaceCandidate);
  // if it's an object, log keys to help debugging
  if (stremioInterfaceCandidate && typeof stremioInterfaceCandidate === "object") {
    console.log("stremioInterface keys:", Object.keys(stremioInterfaceCandidate));
  }
});
