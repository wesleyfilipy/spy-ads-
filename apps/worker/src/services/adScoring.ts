import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export interface AdScore {
  viralityScore: number;
  scaleScore: number;
  aggressivenessScore: number;
  repetitionScore: number;
  overallScore: number;
  isWinningCreative: boolean;
  winningReasons: string[];
}

const HIGH_PERFORMANCE_CTAS = new Set([
  'shop now', 'get offer', 'order now', 'buy now', 'claim offer',
  'get started', 'sign up', 'download', 'install now',
]);

export async function scoreAd(adId: string): Promise<AdScore> {
  const ad = await prisma.ad.findUnique({
    where: { id: adId },
    include: {
      creatives: true,
      adCountries: true,
    },
  });

  if (!ad) throw new Error(`Ad ${adId} not found`);

  const score: AdScore = {
    viralityScore: 0,
    scaleScore: 0,
    aggressivenessScore: 0,
    repetitionScore: 0,
    overallScore: 0,
    isWinningCreative: false,
    winningReasons: [],
  };

  // ── Virality Score (0–100) ─────────────────────────────────
  let virality = 0;
  if (ad.status === 'ACTIVE') virality += 20;
  if (ad.impressionsUpper && ad.impressionsUpper > 1_000_000) { virality += 30; score.winningReasons.push('1M+ impressions'); }
  else if (ad.impressionsUpper && ad.impressionsUpper > 100_000) virality += 15;
  if (ad.adCountries.length > 3) { virality += 20; score.winningReasons.push(`Running in ${ad.adCountries.length} countries`); }
  if (ad.startDate) {
    const daysRunning = Math.floor((Date.now() - ad.startDate.getTime()) / 86400000);
    if (daysRunning > 30) { virality += 20; score.winningReasons.push(`Running for ${daysRunning} days`); }
    else if (daysRunning > 14) virality += 10;
  }
  // Has video creative boosts virality
  if (ad.creatives.some((c) => c.type === 'VIDEO')) virality += 10;
  score.viralityScore = Math.min(100, virality);

  // ── Scale Score (0–100) ────────────────────────────────────
  let scale = 0;
  if (ad.isScaled) { scale += 40; score.winningReasons.push('Visually scaled campaign'); }
  if (ad.isDuplicate) scale += 20;
  if (ad.duplicateScore && ad.duplicateScore > 80) scale += 20;
  const creativeCount = ad.creatives.length;
  if (creativeCount >= 5) { scale += 20; score.winningReasons.push(`${creativeCount} creatives`); }
  else if (creativeCount >= 3) scale += 10;
  if (ad.spendUpper && ad.spendUpper > 10000) { scale += 20; score.winningReasons.push('High ad spend'); }
  score.scaleScore = Math.min(100, scale);

  // ── Aggressiveness Score (0–100) ──────────────────────────
  let aggression = 0;
  if (ad.platforms.length > 2) aggression += 20;
  const allCopy = ad.creatives.map((c) => c.callToAction?.toLowerCase() ?? '').join(' ');
  if (HIGH_PERFORMANCE_CTAS.has(allCopy.trim())) { aggression += 30; score.winningReasons.push('High-converting CTA'); }
  // CAPS lock in copy signals aggressive marketing
  const bodyCopy = ad.creatives.map((c) => c.body ?? '').join(' ');
  const capsRatio = (bodyCopy.match(/[A-Z]/g)?.length ?? 0) / Math.max(bodyCopy.length, 1);
  if (capsRatio > 0.15) aggression += 20;
  if (ad.spendLower && ad.spendLower > 1000) aggression += 30;
  score.aggressivenessScore = Math.min(100, aggression);

  // ── Repetition Score (0–100) ──────────────────────────────
  let repetition = 0;
  if (ad.duplicateGroupId) {
    const groupSize = await prisma.ad.count({ where: { duplicateGroupId: ad.duplicateGroupId } });
    if (groupSize > 20) { repetition = 100; score.winningReasons.push(`Duplicated ${groupSize}x`); }
    else if (groupSize > 10) repetition = 70;
    else if (groupSize > 5) repetition = 40;
    else repetition = 20;
  }
  score.repetitionScore = Math.min(100, repetition);

  // ── Overall Score ──────────────────────────────────────────
  score.overallScore = Math.round(
    score.viralityScore * 0.35 +
    score.scaleScore * 0.30 +
    score.aggressivenessScore * 0.20 +
    score.repetitionScore * 0.15
  );

  // Winning creative threshold
  score.isWinningCreative = score.overallScore >= 65 && score.viralityScore >= 40;
  if (score.isWinningCreative) score.winningReasons.push('Overall winner pattern');

  // Persist scores to dedicated columns
  await prisma.ad.update({
    where: { id: adId },
    data: {
      viralityScore: score.viralityScore,
      scaleScore: score.scaleScore,
      aggressivenessScore: score.aggressivenessScore,
      repetitionScore: score.repetitionScore,
      overallScore: score.overallScore,
      isWinningCreative: score.isWinningCreative,
    },
  });

  logger.debug(`[Scoring] Ad ${adId}: overall=${score.overallScore} winner=${score.isWinningCreative}`);
  return score;
}

export async function scoreAllUnscoredAds(batchSize = 100): Promise<void> {
  const ads = await prisma.ad.findMany({
    where: {
      rawData: { path: ['scores'], equals: undefined },
    },
    select: { id: true },
    take: batchSize,
    orderBy: { createdAt: 'desc' },
  });

  logger.info(`[Scoring] Scoring ${ads.length} unscored ads`);

  for (const ad of ads) {
    await scoreAd(ad.id).catch((err) => logger.debug(`Score failed for ${ad.id}:`, err));
  }
}
