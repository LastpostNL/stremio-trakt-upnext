import fetch from "node-fetch";

const API = "https://api.trakt.tv";

/**
 * Uses Trakt calendar endpoint:
 * upcoming episodes for the next 7 days
 */
export async function getUpNext() {
  const res = await fetch(
    `${API}/calendars/my/shows/next/7`,
    {
      headers: {
        "Authorization": `Bearer ${process.env.TRAKT_ACCESS_TOKEN}`,
        "trakt-api-version": "2",
        "trakt-api-key": process.env.TRAKT_CLIENT_ID
      }
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trakt API error: ${text}`);
  }

  return res.json();
}