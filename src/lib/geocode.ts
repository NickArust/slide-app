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
  const feature = Array.isArray(data.features) ? data.features[0] as unknown : null;
  const hasCenter = (f: unknown): f is { center: [number, number] } =>
    !!f && Array.isArray((f as { center?: unknown }).center) && (f as { center: unknown[] }).center.length >= 2

  if (!feature || !hasCenter(feature)) {
    return null;
  }

  const [lng, lat] = feature.center;
  return { lat, lng };
}

export async function suggestAddresses(query: string, limit = 5) {
  if (!process.env.MAPBOX_TOKEN) {
    throw new Error("MAPBOX_TOKEN not set");
  }
  const url =
    `${MAPBOX_BASE}/${encodeURIComponent(query)}.json` +
    `?access_token=${process.env.MAPBOX_TOKEN}` +
    `&autocomplete=true&limit=${limit}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Suggest failed with status ${res.status}`);
  }

  const data = await res.json();
  const features = Array.isArray(data.features) ? (data.features as unknown[]) : [];
  const withCoords = features.filter(
    (f): f is { center: [number, number]; place_name: string } =>
      Array.isArray((f as { center?: unknown }).center) &&
      typeof (f as { place_name?: unknown }).place_name === "string"
  );
  return withCoords.map((f) => {
    const [lng, lat] = f.center;
    return {
      label: f.place_name,
      lat,
      lng,
    };
  });
}

export async function reverseGeocode(lat: number, lng: number) {
  if (!process.env.MAPBOX_TOKEN) {
    throw new Error("MAPBOX_TOKEN not set");
  }

  const url =
    `${MAPBOX_BASE}/${encodeURIComponent(`${lng},${lat}`)}.json` +
    `?access_token=${process.env.MAPBOX_TOKEN}&limit=1`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Reverse geocode failed with status ${res.status}`);
  }

  const data = await res.json();
  const feature = Array.isArray(data.features) ? data.features[0] as unknown : null;
  const hasCenter = (f: unknown): f is { center: [number, number]; place_name?: string } =>
    !!f && Array.isArray((f as { center?: unknown }).center) && (f as { center: unknown[] }).center.length >= 2

  if (!feature || !hasCenter(feature)) {
    return null;
  }
  const [revLng, revLat] = feature.center;
  return {
    label: feature.place_name as string,
    lat: revLat,
    lng: revLng,
  };
}
