export interface SerperPlace {
  position?: number;
  title: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  ratingCount?: number;
  category?: string;
  phoneNumber?: string;
  website?: string;
  cid?: string;
  placeId?: string;
  thumbnailUrl?: string;
}

export type PointStatus = 'pending' | 'scanning' | 'success' | 'failed';

export interface GridPoint {
  id: string;
  row: number; // e.g. -2 to 2 for 5x5
  col: number; // e.g. -2 to 2 for 5x5
  lat: number;
  lng: number;
  distanceKm: number;
  status: PointStatus;
  rank: number | null; // 1 to 20, or null (represented as "20+")
  rankDisplay: string; // "1", "2", ... "20", "20+", or "-"
  matchedPlace?: SerperPlace | null;
  places: SerperPlace[];
  error?: string;
  retries?: number;
}

export type GridSize = 3 | 5 | 7; // 3x3 (9), 5x5 (25), 7x7 (49)
export type GridStepKm = 0.5 | 1 | 2 | 5;

export interface ScanConfig {
  keyword: string;
  businessName: string;
  cidOrPlaceId?: string;
  centerLat: number;
  centerLng: number;
  centerAddress?: string;
  gridSize: GridSize;
  stepKm: GridStepKm;
  hl: string; // e.g. "vi"
  gl: string; // e.g. "vn"
}

export interface CompetitorStat {
  title: string;
  appearances: number;
  top3Count: number;
  top10Count: number;
  bestRank: number;
  avgRank: number;
  address?: string;
  rating?: number;
  cid?: string;
}

export interface ScanSummary {
  totalPoints: number;
  scannedPoints: number;
  successPoints: number;
  failedPoints: number;
  avgRank: number | null; // calculated over found ranks or with penalty
  top3Percentage: number;
  top10Percentage: number;
  notFoundPercentage: number;
  topCompetitors: CompetitorStat[];
}

export interface ScanRecord {
  id: string;
  timestamp: number;
  dateFormatted: string;
  config: ScanConfig;
  points: GridPoint[];
  summary: ScanSummary;
  isDemo?: boolean;
}
