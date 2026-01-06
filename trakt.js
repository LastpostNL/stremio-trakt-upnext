import fetch from "node-fetch";

const API = "https://api.trakt.tv";

function todayDate() {
  // Use UTC date to avoid timezone surprises
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Uses Trakt calendar endpoint:
 * upcoming episodes for the next `days` days starting from today
 */
export async function getUpNext(days = 7) {
  const start = todayDate();
  const url = `${API}/calendars/my/shows/${start}/${days}`;
  console.log("Fetching Trakt calendar:", url);

  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${process.env.TRAKT_ACCESS_TOKEN}`,
      "trakt-api-version": "2",
      "trakt-api-key": process.env.TRAKT_CLIENT_ID,
      "Content-Type": "application/json"
    }
  });

  // Debug logging to Render logs to help diagnose auth/permission issues
  const text = await res.text().catch(() => "");
  console.log("Trakt response status:", res.status);
  console.log("Trakt response body:", text);

  if (!res.ok) {
    throw new Error(`Trakt API error: status ${res.status} body: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    // If parsing fails, rethrow with body for easier debugging
    throw new Error(`Failed to parse Trakt JSON: ${err.message}. body: ${text}`);
  }
}
