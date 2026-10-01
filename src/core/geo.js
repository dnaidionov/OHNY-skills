export const NYC_BBOX = { minLat: 40.45, maxLat: 41.0, minLng: -74.3, maxLng: -73.65 };

export const inNyc = (lat, lng) =>
  lat >= NYC_BBOX.minLat && lat <= NYC_BBOX.maxLat && lng >= NYC_BBOX.minLng && lng <= NYC_BBOX.maxLng;

export function haversineKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Rough walking time: street grids add ~30% to straight-line distance, 4.8 km/h pace. */
export const walkMinutes = (km) => Math.max(1, Math.round(((km * 1.3) / 4.8) * 60));

export function mapsLinks(site) {
  const g = site.geo;
  const precise = g && g.conf === 'address';
  const a = site.address;
  const dest = a?.line1
    ? [a.line1, a.city, a.state, a.zip].filter(Boolean).join(', ')
    : precise ? `${g.lat},${g.lng}` : [site.name, site.neighborhood, site.borough, 'NY'].filter(Boolean).join(', ');
  const q = encodeURIComponent(dest);
  return {
    destination: dest,
    google_transit: `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=transit`,
    google_walking: `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=walking`,
    apple: `https://maps.apple.com/?daddr=${q}&dirflg=r`,
  };
}
