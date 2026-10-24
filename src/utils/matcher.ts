import { SerperPlace } from '../types';

/**
 * Remove Vietnamese accents and special characters, normalize to lowercase
 */
export function normalizeVietnamese(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Token overlap ratio between two strings
 */
function calculateTokenOverlap(a: string, b: string): number {
  const tokensA = new Set(a.split(' ').filter((w) => w.length > 1));
  const tokensB = new Set(b.split(' ').filter((w) => w.length > 1));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let common = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      common++;
    }
  }

  // Jaccard-like or overlap against the shorter token set
  const minSize = Math.min(tokensA.size, tokensB.size);
  return common / minSize;
}

export interface MatchResult {
  matchedPlace: SerperPlace | null;
  rank: number | null; // 1..20 or null if not found in top 20
  matchReason?: 'cid' | 'placeId' | 'name_exact' | 'name_fuzzy' | 'not_found';
}

/**
 * Finds the target business in the Serper places list.
 * Priority 1: Matches CID or Place ID.
 * Priority 2: Matches business name (approximate / normalized Vietnamese).
 */
export function findTargetBusiness(
  places: SerperPlace[],
  businessName: string,
  cidOrPlaceId?: string
): MatchResult {
  if (!places || places.length === 0) {
    return { matchedPlace: null, rank: null, matchReason: 'not_found' };
  }

  const cleanCidOrPlaceId = cidOrPlaceId ? cidOrPlaceId.trim().toLowerCase() : '';
  const normTargetName = normalizeVietnamese(businessName);

  // 1. Priority 1: CID or Place ID matching
  if (cleanCidOrPlaceId) {
    for (let i = 0; i < places.length; i++) {
      const p = places[i];
      const pCid = (p.cid || '').toLowerCase();
      const pPlaceId = (p.placeId || '').toLowerCase();

      if (
        (pCid && (pCid === cleanCidOrPlaceId || cleanCidOrPlaceId.includes(pCid) || pCid.includes(cleanCidOrPlaceId))) ||
        (pPlaceId && (pPlaceId === cleanCidOrPlaceId || cleanCidOrPlaceId.includes(pPlaceId) || pPlaceId.includes(cleanCidOrPlaceId)))
      ) {
        const rank = p.position || i + 1;
        return {
          matchedPlace: p,
          rank: rank <= 20 ? rank : null,
          matchReason: pCid === cleanCidOrPlaceId ? 'cid' : 'placeId',
        };
      }
    }
  }

  // 2. Priority 2: Name matching if businessName is provided
  if (normTargetName) {
    // 2a. Exact match
    for (let i = 0; i < places.length; i++) {
      const p = places[i];
      const normTitle = normalizeVietnamese(p.title || '');
      if (normTitle === normTargetName) {
        const rank = p.position || i + 1;
        return {
          matchedPlace: p,
          rank: rank <= 20 ? rank : null,
          matchReason: 'name_exact',
        };
      }
    }

    // 2b. Substring contains match (either direction)
    for (let i = 0; i < places.length; i++) {
      const p = places[i];
      const normTitle = normalizeVietnamese(p.title || '');
      if (normTitle.includes(normTargetName) || normTargetName.includes(normTitle)) {
        const rank = p.position || i + 1;
        return {
          matchedPlace: p,
          rank: rank <= 20 ? rank : null,
          matchReason: 'name_fuzzy',
        };
      }
    }

    // 2c. Token overlap >= 75%
    let bestScore = 0;
    let bestPlace: SerperPlace | null = null;
    let bestIndex = -1;

    for (let i = 0; i < places.length; i++) {
      const p = places[i];
      const normTitle = normalizeVietnamese(p.title || '');
      const overlap = calculateTokenOverlap(normTargetName, normTitle);
      if (overlap >= 0.75 && overlap > bestScore) {
        bestScore = overlap;
        bestPlace = p;
        bestIndex = i;
      }
    }

    if (bestPlace && bestIndex !== -1) {
      const rank = bestPlace.position || bestIndex + 1;
      return {
        matchedPlace: bestPlace,
        rank: rank <= 20 ? rank : null,
        matchReason: 'name_fuzzy',
      };
    }
  }

  return {
    matchedPlace: null,
    rank: null,
    matchReason: 'not_found',
  };
}
