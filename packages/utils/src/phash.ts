/**
 * Perceptual hashing utilities for duplicate/scaled ad detection.
 * Implements a simplified pHash algorithm using DCT-like approach.
 */

export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

export function calculateSimilarityScore(hash1: string, hash2: string): number {
  if (!hash1 || !hash2) return 0;
  const maxDistance = hash1.length;
  const distance = hammingDistance(hash1, hash2);
  if (distance === Infinity) return 0;
  return Math.round((1 - distance / maxDistance) * 100);
}

export function isLikelySameAd(hash1: string, hash2: string, threshold = 90): boolean {
  return calculateSimilarityScore(hash1, hash2) >= threshold;
}

export function isLikelyScaled(hash1: string, hash2: string, threshold = 75): boolean {
  const score = calculateSimilarityScore(hash1, hash2);
  return score >= threshold && score < 100;
}

/**
 * Groups ads by their visual similarity using pHash values.
 */
export function groupAdsByVisualSimilarity<T extends { id: string; pHashValue?: string | null }>(
  ads: T[],
  threshold = 85
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  const assigned = new Set<string>();

  for (const ad of ads) {
    if (assigned.has(ad.id) || !ad.pHashValue) continue;

    const group: T[] = [ad];
    assigned.add(ad.id);

    for (const other of ads) {
      if (assigned.has(other.id) || !other.pHashValue || other.id === ad.id) continue;
      if (calculateSimilarityScore(ad.pHashValue, other.pHashValue) >= threshold) {
        group.push(other);
        assigned.add(other.id);
      }
    }

    if (group.length > 1) {
      groups.set(ad.id, group);
    }
  }

  return groups;
}
