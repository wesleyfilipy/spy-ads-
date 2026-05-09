'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Download,
  ExternalLink,
  TrendingUp,
  Copy,
  Globe,
  Calendar,
  Eye,
  Play,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { apiGet, apiPost } from '@/lib/api';
import { formatDate } from '@adspy/utils';

interface AdDetail {
  id: string;
  facebookAdId: string;
  pageName?: string;
  pageUrl?: string;
  domain?: string;
  status: string;
  isScaled: boolean;
  isDuplicate: boolean;
  duplicateScore?: number;
  startDate?: string;
  endDate?: string;
  platforms: string[];
  creatives: Array<{
    id: string;
    type: string;
    mediaUrl?: string;
    thumbnailUrl?: string;
    headline?: string;
    body?: string;
    description?: string;
    callToAction?: string;
    linkUrl?: string;
    displayUrl?: string;
  }>;
  adCountries: Array<{ countryCode: string; country: { name: string } }>;
  adLanguages: Array<{ languageCode: string; language: { name: string } }>;
  related: Array<{
    id: string;
    pageName?: string;
    creatives: Array<{ thumbnailUrl?: string; type: string }>;
  }>;
}

export default function AdDetailPage({ params }: { params: { id: string } }) {
  const { accessToken } = useAuthStore();
  const [ad, setAd] = useState<AdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCreative, setActiveCreative] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    apiGet<{ success: boolean; data: AdDetail }>(`/api/ads/${params.id}`, accessToken)
      .then((res) => {
        setAd(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id, accessToken]);

  async function handleFavorite() {
    if (!accessToken || !ad) return;
    try {
      await apiPost('/api/favorites', { adId: ad.id }, accessToken);
      setIsFavorited(true);
    } catch {
      setIsFavorited(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-1/4" />
          <div className="h-96 bg-secondary rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Ad not found</p>
        <Link href="/dashboard/search" className="text-primary hover:underline mt-2 block">
          Back to search
        </Link>
      </div>
    );
  }

  const currentCreative = ad.creatives[activeCreative];

  return (
    <div className="p-8">
      {/* Back */}
      <Link
        href="/dashboard/search"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Search
      </Link>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        {/* Left: Creative viewer */}
        <div>
          <div className="glass rounded-2xl overflow-hidden mb-4">
            {/* Main creative */}
            <div className="aspect-video bg-secondary relative">
              {currentCreative?.type === 'VIDEO' ? (
                <video
                  src={currentCreative.mediaUrl}
                  poster={currentCreative.thumbnailUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : currentCreative?.thumbnailUrl || currentCreative?.mediaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentCreative.thumbnailUrl ?? currentCreative.mediaUrl}
                  alt="Ad creative"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Eye className="w-16 h-16 text-muted-foreground opacity-20" />
                </div>
              )}
            </div>

            {/* Creative thumbnails */}
            {ad.creatives.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {ad.creatives.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCreative(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      i === activeCreative ? 'border-primary' : 'border-border opacity-60 hover:opacity-100'
                    }`}
                  >
                    {c.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        {c.type === 'VIDEO' ? <Play className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Copy */}
          {(currentCreative?.headline || currentCreative?.body) && (
            <div className="glass rounded-2xl p-6">
              {currentCreative.headline && (
                <h2 className="font-bold text-xl mb-3">{currentCreative.headline}</h2>
              )}
              {currentCreative.body && (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm">
                  {currentCreative.body}
                </p>
              )}
              {currentCreative.description && (
                <p className="text-muted-foreground text-sm mt-3 italic">{currentCreative.description}</p>
              )}
              {currentCreative.callToAction && (
                <div className="mt-4">
                  <span className="inline-block bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-semibold">
                    {currentCreative.callToAction}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Ad info */}
        <div className="space-y-4">
          {/* Page info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-bold text-xl">{ad.pageName ?? 'Unknown Page'}</h1>
                {ad.domain && (
                  <a
                    href={`https://${ad.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary text-sm hover:underline mt-1"
                  >
                    <Globe className="w-3 h-3" />
                    {ad.domain}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleFavorite}
                  className={`p-2 rounded-lg border transition-all ${
                    isFavorited
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'border-border text-muted-foreground hover:text-rose-400 hover:border-rose-500/30'
                  }`}
                >
                  <Heart className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} />
                </button>
                {currentCreative?.mediaUrl && (
                  <a
                    href={currentCreative.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                ad.status === 'ACTIVE'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-secondary border border-border text-muted-foreground'
              }`}>
                {ad.status}
              </span>
              {ad.isScaled && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Scaled
                </span>
              )}
              {ad.isDuplicate && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <Copy className="w-3 h-3" /> Duplicate ({ad.duplicateScore}%)
                </span>
              )}
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              {ad.startDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Started {formatDate(ad.startDate)}</span>
                </div>
              )}
              {ad.adCountries.length > 0 && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Globe className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{ad.adCountries.map((c) => c.country?.name ?? c.countryCode).join(', ')}</span>
                </div>
              )}
              {ad.platforms.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span>{ad.platforms.join(', ')}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Related ads */}
          {ad.related.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Related Ads</h3>
              <div className="grid grid-cols-3 gap-2">
                {ad.related.slice(0, 6).map((related) => (
                  <Link key={related.id} href={`/dashboard/ads/${related.id}`} className="aspect-square rounded-lg overflow-hidden bg-secondary hover:ring-2 hover:ring-primary/50 transition-all">
                    {related.creatives[0]?.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={related.creatives[0].thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Eye className="w-6 h-6 text-muted-foreground opacity-20" />
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
