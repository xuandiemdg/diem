import { GridPoint, GridSize, GridStepKm } from '../types';

/**
 * Calculates distance in kilometers between two lat/lng coordinates (Haversine Formula)
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Generates an NxN grid of coordinates around the center point.
 * Spaced by stepKm.
 */
export function generateGridPoints(
  centerLat: number,
  centerLng: number,
  gridSize: GridSize,
  stepKm: GridStepKm
): GridPoint[] {
  const points: GridPoint[] = [];
  const half = Math.floor(gridSize / 2);

  // 1 degree latitude ~ 111.32 km
  const kmPerLatDegree = 111.32;
  const deltaLat = stepKm / kmPerLatDegree;

  // 1 degree longitude at centerLat ~ 111.32 * cos(lat)
  const latRad = (centerLat * Math.PI) / 180;
  const kmPerLngDegree = 111.32 * Math.max(0.1, Math.cos(latRad));
  const deltaLng = stepKm / kmPerLngDegree;

  // We loop from row = half down to -half (North to South)
  // and col = -half to half (West to East)
  for (let row = half; row >= -half; row--) {
    for (let col = -half; col <= half; col++) {
      const lat = centerLat + row * deltaLat;
      const lng = centerLng + col * deltaLng;
      const distanceKm = getDistanceKm(centerLat, centerLng, lat, lng);

      points.push({
        id: `pt_${row}_${col}`,
        row,
        col,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        distanceKm,
        status: 'pending',
        rank: null,
        rankDisplay: '-',
        places: [],
      });
    }
  }

  return points;
}

/**
 * Quick geocoding lookup using OpenStreetMap Nominatim
 */
export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
}

const geocodeCache = new Map<string, GeocodeResult[]>();

export async function searchLocationNominatim(query: string): Promise<GeocodeResult[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery || cleanQuery.length < 2) return [];

  if (geocodeCache.has(cleanQuery)) {
    return geocodeCache.get(cleanQuery)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query.trim()
    )}&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'vi,en;q=0.9',
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const results = data.map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
    geocodeCache.set(cleanQuery, results);
    return results;
  } catch (err) {
    console.error('Nominatim search error:', err);
    return [];
  }
}
