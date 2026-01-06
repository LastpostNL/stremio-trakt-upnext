import { manifest } from "./manifest.js";
import { getUpNext } from "./trakt.js";
import http from "http";
import { URL } from "url";

const port = Number(process.env.PORT) || 7000;

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}

function buildMetasFromTrakt(data) {
  return data
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
        type: "series",
        name,
        poster,
        ids: { tmdb }
      };
    });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    // Health endpoints
    if (url.pathname === "/" || url.pathname === "/ping") {
      res.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
      res.end("ok");
      return;
    }

    // CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      });
      res.end();
      return;
    }

    // Manifest endpoint used by Stremio
    if (url.pathname === "/manifest.json") {
      sendJson(res, 200, manifest);
      return;
    }

    // Catalog endpoint (query-style)
    if (url.pathname === "/catalog") {
      const type = url.searchParams.get("type");
      const id = url.searchParams.get("id");
      if (type !== "series" || id !== "trakt_upnext") {
        sendJson(res, 200, { metas: [] });
        return;
      }
      try {
        const data = await getUpNext();
        const metas = buildMetasFromTrakt(data);
        sendJson(res, 200, { metas });
        return;
      } catch (err) {
        console.error("Error fetching Trakt data:", err && err.message ? err.message : err);
        sendJson(res, 200, { metas: [] });
        return;
      }
    }

    // Catalog endpoint (path-style) — supports /catalog/<type>/<id>.json
    const pathCatalogMatch = url.pathname.match(/^\/catalog\/([^\/]+)\/([^\/]+)\.json$/);
    if (pathCatalogMatch) {
      const [, type, id] = pathCatalogMatch;
      if (type !== "series" || id !== "trakt_upnext") {
        sendJson(res, 200, { metas: [] });
        return;
      }
      try {
        const data = await getUpNext();
        const metas = buildMetasFromTrakt(data);
        sendJson(res, 200, { metas });
        return;
      } catch (err) {
        console.error("Error fetching Trakt data:", err && err.message ? err.message : err);
        sendJson(res, 200, { metas: [] });
        return;
      }
    }

    // fallthrough 404
    res.writeHead(404, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
    res.end("not found");
  } catch (err) {
    console.error("Server error:", err);
    res.writeHead(500, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
    res.end("internal server error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Trakt Up Next (manual routes) running on port ${port}`);
});
