import { db, settings } from "@/lib/db";

export type Geofence = { lat: number | null; lng: number | null; radius: number };

export async function getGeofence(): Promise<Geofence> {
  const rows = await db.select().from(settings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    lat: map.schoolLat ? Number(map.schoolLat) : null,
    lng: map.schoolLng ? Number(map.schoolLng) : null,
    radius: map.geofenceRadius ? Number(map.geofenceRadius) : 20,
  };
}

/** Great-circle distance between two coordinates, in meters (haversine formula). */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
