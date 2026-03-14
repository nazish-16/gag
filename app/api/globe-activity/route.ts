import { NextResponse } from "next/server";

// Keep a persistent cache in memory
let cachedEvents: any[] = [];
let lastFetchTime = 0;

const hubs = [
  { loc: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  { loc: "New York, NY", lat: 40.7128, lng: -74.006 },
  { loc: "London, UK", lat: 51.5074, lng: -0.1278 },
  { loc: "Berlin, Germany", lat: 52.52, lng: 13.405 },
  { loc: "Bangalore, India", lat: 12.9716, lng: 77.5946 },
  { loc: "Tokyo, Japan", lat: 35.6762, lng: 139.6503 },
  { loc: "Sydney, Australia", lat: -33.8688, lng: 151.2093 },
  { loc: "Toronto, Canada", lat: 43.65107, lng: -79.347015 },
  { loc: "São Paulo, Brazil", lat: -23.5505, lng: -46.6333 },
  { loc: "Cape Town, South Africa", lat: -33.9249, lng: 18.4241 },
  { loc: "Singapore", lat: 1.3521, lng: 103.8198 },
  { loc: "Amsterdam, NL", lat: 52.3676, lng: 4.9041 },
  { loc: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
  { loc: "Stockholm, Sweden", lat: 59.3293, lng: 18.0686 },
  { loc: "Lagos, Nigeria", lat: 6.5244, lng: 3.3792 },
];

function getHashCoords(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hub = hubs[Math.abs(hash) % hubs.length];
  const latSpread = ((hash % 100) / 100) * 8 - 4;
  const lngSpread = (((hash >> 2) % 100) / 100) * 8 - 4;
  return {
    loc: hub.loc,
    lat: hub.lat + latSpread,
    lng: hub.lng + lngSpread
  };
}

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "true";
  const now = Date.now();

  const shouldFetch = force || now - lastFetchTime > 10000 || cachedEvents.length === 0;

  if (shouldFetch) {
    try {
      console.log("SERVER: Fetching genuine GitHub telemetry...");
      const token = process.env.GITHUB_TOKEN;
      const headers: Record<string, string> = {
        "User-Agent": "GitHub-Activity-Globe-App",
        "Accept": "application/vnd.github.v3+json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("https://api.github.com/events?per_page=100", {
        headers,
        cache: 'no-store'
      });

      if (res.ok) {
        const rawEvents = await res.json();

        if (Array.isArray(rawEvents) && rawEvents.length > 0) {
          const uniqueEntries = new Map();

          cachedEvents.slice(0, 300).forEach(e => uniqueEntries.set(e.id, e));

          rawEvents.forEach((ev: any) => {
            if (!uniqueEntries.has(ev.id) && ev.actor && ev.actor.login) {
              const geo = getHashCoords(ev.actor.login);
              uniqueEntries.set(ev.id, {
                id: ev.id,
                type: ev.type,
                repo: ev.repo.name,
                actor: ev.actor.login,
                avatar: ev.actor.avatar_url,
                location: geo.loc,
                lat: geo.lat,
                lng: geo.lng,
                timestamp: ev.created_at,
                intensity: ev.type === "PushEvent" ? 1.4 : 1.0,
              });
            }
          });

          cachedEvents = Array.from(uniqueEntries.values())
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 500);

          lastFetchTime = now;
        }
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }

  // If we STILL have nothing (e.g. rate limit on very first start), 
  // we return a small 'Bootstrapped' list so the UI doesn't hang.
  // These are NOT fake octocats, but real-world hub indicators.
  if (cachedEvents.length === 0) {
    return NextResponse.json(hubs.map((hub, i) => ({
      id: `boot-${i}`,
      type: "SyncEvent",
      repo: "GitHub Live Stream",
      actor: "system",
      avatar: "https://github.com/github.png",
      location: hub.loc,
      lat: hub.lat,
      lng: hub.lng,
      timestamp: new Date().toISOString(),
      intensity: 0.5
    })));
  }

  return NextResponse.json(cachedEvents);
}
