export const manifest = {
  id: "org.jouwnaam.trakt.upnext",
  version: "1.0.0",
  name: "📺 Trakt Up Next",
  description: "Shows upcoming TV episodes from Trakt (catalog only)",
  resources: ["catalog"],
  types: ["series"],
  catalogs: [
    {
      type: "series",
      id: "trakt_upnext",
      name: "Afleveringen de komende 14 dagen"
    }
  ]
};

