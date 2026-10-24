import { CompetitorStat, GridPoint, ScanConfig, ScanSummary, SerperPlace } from '../types';
import { findTargetBusiness } from './matcher';

export interface SerperMapsRequest {
  q: string;
  ll: string; // e.g. "@21.028511,105.854444,15z"
  gl: string;
  hl: string;
}

export interface SerperMapsResponse {
  searchParameters?: any;
  places?: SerperPlace[];
  error?: string;
  message?: string;
}

/**
 * Executes a single Serper Maps request with 1 retry on failure
 */
export async function fetchSerperMapsPoint(
  apiKey: string,
  params: { q: string; lat: number; lng: number; gl: string; hl: string },
  signal?: AbortSignal
): Promise<SerperPlace[]> {
  const requestBody: SerperMapsRequest = {
    q: params.q,
    ll: `@${params.lat.toFixed(6)},${params.lng.toFixed(6)},15z`,
    gl: params.gl || 'vn',
    hl: params.hl || 'vi',
  };

  const headers = {
    'X-API-KEY': apiKey.trim(),
    'Content-Type': 'application/json',
  };

  const executeCall = async (): Promise<SerperPlace[]> => {
    // Call https://google.serper.dev/maps directly from browser to avoid hitting server proxy rate limits ("Rate exceeded.")
    const response = await fetch('https://google.serper.dev/maps', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedMsg = `HTTP ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        parsedMsg = errJson.message || errJson.error || parsedMsg;
      } catch {
        if (errText) parsedMsg = errText.slice(0, 100);
      }
      if (response.status === 401 || response.status === 403 || parsedMsg.includes('Unauthorized') || parsedMsg.includes('Invalid API key')) {
        throw new Error('API Key không hợp lệ hoặc đã hết lượt dùng');
      }
      if (response.status === 429 || parsedMsg.toLowerCase().includes('rate')) {
        throw new Error('RATE_LIMIT: Quá giới hạn tốc độ gọi API, đang tự động thử lại...');
      }
      throw new Error(parsedMsg);
    }

    const data: SerperMapsResponse = await response.json();
    return data.places || [];
  };

  // Attempt 1 with automatic retry & exponential backoff on rate limit
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await executeCall();
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      if (err.message?.includes('API Key không hợp lệ')) throw err;
      if (attempt === 2) throw err;

      // Wait longer if rate limited (2.5s -> 5s), otherwise 1.2s
      const isRateLimit = err.message?.includes('RATE_LIMIT') || err.message?.toLowerCase().includes('rate');
      const backoffMs = isRateLimit ? 2500 * (attempt + 1) : 1200 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw new Error('Không thể kết nối đến Serper API');
}

/**
 * Generates realistic simulation data for Demo Mode
 */
export async function simulateSerperMapsPoint(
  params: { q: string; lat: number; lng: number; businessName: string; distanceKm: number }
): Promise<SerperPlace[]> {
  // Simulate network latency (200 - 600ms)
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 400));

  const keyword = params.q.trim() || 'Dịch vụ';
  const targetName = params.businessName.trim() || 'Doanh Nghiệp Của Bạn';

  // Typical local competitors based on keyword
  const sampleCompetitors = [
    { title: `${keyword} 24/7 Premium`, rating: 4.8, ratingCount: 142 },
    { title: `Trung Tâm ${keyword} Uy Tín`, rating: 4.9, ratingCount: 310 },
    { title: `${keyword} Quốc Tế Stars`, rating: 4.7, ratingCount: 89 },
    { title: `${keyword} Sài Gòn / Hà Nội`, rating: 4.6, ratingCount: 220 },
    { title: `Dịch Vụ ${keyword} Chuyên Nghiệp`, rating: 4.5, ratingCount: 75 },
    { title: `${keyword} Giá Rẻ City`, rating: 4.3, ratingCount: 54 },
    { title: `${keyword} Express Hoàng Gia`, rating: 4.9, ratingCount: 420 },
    { title: `Hệ Thống ${keyword} Việt Nam`, rating: 4.7, ratingCount: 185 },
    { title: `${keyword} Plus Center`, rating: 4.4, ratingCount: 96 },
    { title: `Tập Đoàn ${keyword} Top 1`, rating: 4.6, ratingCount: 155 },
    { title: `${keyword} Tân Thời Đại`, rating: 4.2, ratingCount: 43 },
    { title: `${keyword} Đại Tín`, rating: 4.5, ratingCount: 68 },
    { title: `${keyword} Pro Service`, rating: 4.8, ratingCount: 260 },
    { title: `${keyword} Minh Khang`, rating: 4.1, ratingCount: 38 },
    { title: `${keyword} Eco Green`, rating: 4.6, ratingCount: 112 },
    { title: `${keyword} VIP Corner`, rating: 4.7, ratingCount: 84 },
    { title: `${keyword} Family Care`, rating: 4.3, ratingCount: 62 },
    { title: `${keyword} Toàn Phát`, rating: 4.4, ratingCount: 77 },
    { title: `${keyword} An Phát Đạt`, rating: 4.5, ratingCount: 103 },
    { title: `${keyword} Thành Công`, rating: 4.2, ratingCount: 49 },
  ];

  // Target business rank degrades gracefully with distance from center
  // Near center (0-1km): rank 1 to 3
  // 1-2.5km: rank 3 to 9
  // 2.5-4km: rank 9 to 18
  // > 4km: 20+ (not found)
  let targetRank: number;
  if (params.distanceKm < 0.6) {
    targetRank = Math.random() < 0.8 ? 1 : 2;
  } else if (params.distanceKm < 1.5) {
    targetRank = Math.floor(2 + Math.random() * 3); // 2-4
  } else if (params.distanceKm < 3.0) {
    targetRank = Math.floor(5 + Math.random() * 6); // 5-10
  } else if (params.distanceKm < 4.5) {
    targetRank = Math.floor(10 + Math.random() * 8); // 10-17
  } else {
    targetRank = Math.random() < 0.4 ? 18 : 25; // 25 = out of top 20
  }

  const resultPlaces: SerperPlace[] = [];
  let compIdx = 0;

  for (let rank = 1; rank <= 20; rank++) {
    if (rank === targetRank) {
      resultPlaces.push({
        position: rank,
        title: targetName,
        address: `Tọa độ ${(params.lat).toFixed(4)}, ${(params.lng).toFixed(4)}`,
        latitude: params.lat,
        longitude: params.lng,
        rating: 4.8,
        ratingCount: 198,
        cid: '108849201948271',
        placeId: 'ChIJTargetLocal1234',
        category: 'Doanh nghiệp địa phương',
      });
    } else {
      const comp = sampleCompetitors[compIdx % sampleCompetitors.length];
      compIdx++;
      resultPlaces.push({
        position: rank,
        title: comp.title,
        address: `Khu vực ${(params.lat + (Math.random() - 0.5) * 0.01).toFixed(4)}, ${(params.lng + (Math.random() - 0.5) * 0.01).toFixed(4)}`,
        latitude: params.lat + (Math.random() - 0.5) * 0.01,
        longitude: params.lng + (Math.random() - 0.5) * 0.01,
        rating: comp.rating,
        ratingCount: comp.ratingCount,
        cid: `987654321${rank}`,
        placeId: `ChIJComp_${rank}_${compIdx}`,
        category: 'Đối thủ địa phương',
      });
    }
  }

  return resultPlaces;
}

/**
 * Runner with concurrency of 4
 */
export async function scanGridWithConcurrency(
  points: GridPoint[],
  config: ScanConfig,
  apiKey: string,
  isDemo: boolean,
  onProgress: (updatedPoints: GridPoint[], currentIndex: number) => void,
  abortSignal?: AbortSignal
): Promise<GridPoint[]> {
  const CONCURRENCY_LIMIT = 4;
  const updatedPoints = [...points];
  let nextIndex = 0;
  let activeWorkers = 0;
  let completedCount = 0;

  return new Promise((resolve, reject) => {
    const runWorker = async () => {
      if (abortSignal?.aborted) {
        return;
      }

      while (nextIndex < updatedPoints.length) {
        if (abortSignal?.aborted) {
          break;
        }

        const currentIndex = nextIndex++;
        const currentPoint = updatedPoints[currentIndex];

        // Mark as scanning
        updatedPoints[currentIndex] = {
          ...currentPoint,
          status: 'scanning',
        };
        onProgress([...updatedPoints], currentIndex);

        try {
          let places: SerperPlace[] = [];

          if (isDemo || !apiKey.trim()) {
            places = await simulateSerperMapsPoint({
              q: config.keyword,
              lat: currentPoint.lat,
              lng: currentPoint.lng,
              businessName: config.businessName,
              distanceKm: currentPoint.distanceKm,
            });
          } else {
            places = await fetchSerperMapsPoint(
              apiKey,
              {
                q: config.keyword,
                lat: currentPoint.lat,
                lng: currentPoint.lng,
                gl: config.gl,
                hl: config.hl,
              },
              abortSignal
            );
          }

          // Match business
          const match = findTargetBusiness(places, config.businessName, config.cidOrPlaceId);

          updatedPoints[currentIndex] = {
            ...currentPoint,
            status: 'success',
            rank: match.rank,
            rankDisplay: match.rank !== null ? `${match.rank}` : '20+',
            matchedPlace: match.matchedPlace,
            places,
          };
        } catch (err: any) {
          if (abortSignal?.aborted) break;

          updatedPoints[currentIndex] = {
            ...currentPoint,
            status: 'failed',
            rank: null,
            rankDisplay: '!',
            error: err.message || 'Lỗi kết nối',
          };
        }

        completedCount++;
        onProgress([...updatedPoints], currentIndex);

        // Small breathing delay between live API calls to prevent "Rate exceeded."
        if (!isDemo && apiKey.trim() && nextIndex < updatedPoints.length && !abortSignal?.aborted) {
          await new Promise((r) => setTimeout(r, 250));
        }
      }

      activeWorkers--;
      if (activeWorkers === 0) {
        resolve(updatedPoints);
      }
    };

    // Start initial pool of workers up to concurrency limit with slight stagger
    const totalWorkers = Math.min(CONCURRENCY_LIMIT, points.length);
    activeWorkers = totalWorkers;

    for (let i = 0; i < totalWorkers; i++) {
      setTimeout(() => {
        runWorker().catch((err) => {
          if (!abortSignal?.aborted) {
            console.error('Worker error:', err);
          }
        });
      }, i * 200);
    }

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        resolve(updatedPoints);
      });
    }
  });
}

/**
 * Computes summary analytics across all scanned points
 */
export function calculateScanSummary(
  points: GridPoint[],
  businessName: string,
  cidOrPlaceId?: string
): ScanSummary {
  const total = points.length;
  const scanned = points.filter((p) => p.status === 'success' || p.status === 'failed');
  const success = points.filter((p) => p.status === 'success');
  const failed = points.filter((p) => p.status === 'failed');

  let top3 = 0;
  let top10 = 0;
  let notFound = 0;
  let rankSum = 0;
  let rankCount = 0;

  // Aggregate competitors
  const competitorMap: Map<string, {
    title: string;
    appearances: number;
    top3Count: number;
    top10Count: number;
    bestRank: number;
    rankSum: number;
    address?: string;
    rating?: number;
    cid?: string;
  }> = new Map();

  for (const pt of success) {
    if (pt.rank !== null && pt.rank <= 20) {
      rankSum += pt.rank;
      rankCount++;
      if (pt.rank <= 3) top3++;
      if (pt.rank <= 10) top10++;
    } else {
      notFound++;
      // Count out-of-top-20 as penalty 21 for average rank calculation
      rankSum += 21;
      rankCount++;
    }

    // Inspect competitors at this point
    for (let i = 0; i < Math.min(pt.places.length, 10); i++) {
      const place = pt.places[i];
      const rank = place.position || i + 1;

      // Skip the target business itself from competitor stats
      const match = findTargetBusiness([place], businessName, cidOrPlaceId);
      if (match.matchedPlace) continue;

      const titleKey = place.title.trim().toLowerCase();
      const existing = competitorMap.get(titleKey);

      if (existing) {
        existing.appearances++;
        if (rank <= 3) existing.top3Count++;
        if (rank <= 10) existing.top10Count++;
        existing.bestRank = Math.min(existing.bestRank, rank);
        existing.rankSum += rank;
        if (!existing.rating && place.rating) existing.rating = place.rating;
      } else {
        competitorMap.set(titleKey, {
          title: place.title,
          appearances: 1,
          top3Count: rank <= 3 ? 1 : 0,
          top10Count: rank <= 10 ? 1 : 0,
          bestRank: rank,
          rankSum: rank,
          address: place.address,
          rating: place.rating,
          cid: place.cid,
        });
      }
    }
  }

  const avgRank = rankCount > 0 ? Number((rankSum / rankCount).toFixed(1)) : null;
  const top3Percentage = total > 0 ? Math.round((top3 / total) * 100) : 0;
  const top10Percentage = total > 0 ? Math.round((top10 / total) * 100) : 0;
  const notFoundPercentage = total > 0 ? Math.round((notFound / total) * 100) : 0;

  const topCompetitors: CompetitorStat[] = Array.from(competitorMap.values())
    .map((c) => ({
      title: c.title,
      appearances: c.appearances,
      top3Count: c.top3Count,
      top10Count: c.top10Count,
      bestRank: c.bestRank,
      avgRank: Number((c.rankSum / c.appearances).toFixed(1)),
      address: c.address,
      rating: c.rating,
      cid: c.cid,
    }))
    .sort((a, b) => b.top3Count - a.top3Count || b.appearances - a.appearances)
    .slice(0, 10);

  return {
    totalPoints: total,
    scannedPoints: scanned.length,
    successPoints: success.length,
    failedPoints: failed.length,
    avgRank,
    top3Percentage,
    top10Percentage,
    notFoundPercentage,
    topCompetitors,
  };
}
