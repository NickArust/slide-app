const MAPBOX_BASE =
  "https://api.mapbox.com/geocoding/v5/mapbox.places";

export async function geocodeAddress(address: string) {
  if (!process.env.MAPBOX_TOKEN) {
    throw new Error("MAPBOX_TOKEN not set");
  }

  const url =
    `${MAPBOX_BASE}/${encodeURIComponent(address)}.json` +
    `?access_token=${process.env.MAPBOX_TOKEN}&limit=1`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Geocoding failed with status ${res.status}`);
  }

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature || !Array.isArray(feature.center)) {
    return null;
  }

  const [lng, lat] = feature.center;
  return { lat, lng };
}
