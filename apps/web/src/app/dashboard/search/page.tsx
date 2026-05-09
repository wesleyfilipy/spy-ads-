'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, TrendingUp, Copy, Eye, Heart, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { apiGet, apiPost } from '@/lib/api';
import { APP_CONFIG } from '@adspy/config';

interface AdResult {
  id: string;
  facebookAdId: string;
  pageName?: string;
  domain?: string;
  status: string;
  isScaled: boolean;
  isDuplicate: boolean;
  duplicateScore?: number;
  startDate?: string;
  creatives: Array<{
    id: string;
    type: string;
    thumbnailUrl?: string;
    mediaUrl?: string;
    headline?: string;
    body?: string;
    callToAction?: string;
  }>;
  adCountries: Array<{ countryCode: string }>;
}

interface SearchMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SearchPage() {
  const { accessToken } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdResult[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    status: '',
    countries: '',
    isScaled: '',
    isDuplicate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const search = useCallback(
    async (page = 1) => {
      if (!accessToken) return;
      setLoading(true);

      try {
        const params = new URLSearchParams({
          ...(query && { q: query }),
          ...(filters.status && { status: filters.status }),
          ...(filters.countries && { countries: filters.countries }),
          ...(filters.isScaled && { isScaled: filters.isScaled }),
          ...(filters.isDuplicate && { isDuplicate: filters.isDuplicate }),
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          page: String(page),
          limit: '20',
        });

        const res = await apiGet<{ success: boolean; data: AdResult[]; meta: SearchMeta }>(
          `/api/ads?${params.toString()}`,
          accessToken
        );

        setResults(res.data ?? []);
        setMeta(res.meta ?? null);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    },
    [query, filters, accessToken]
  );

  async function addToFavorites(adId: string) {
    if (!accessToken) return;
    try {
      await apiPost('/api/favorites', { adId }, accessToken);
    } catch {
      // already favorited
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Search Ads</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search {meta?.total?.toLocaleString() ?? 'millions of'} ads with advanced filters
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Search by keyword, brand, domain, copy..."
            className="w-full bg-secondary border border-border rounded-xl pl-11 pr-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
        <button
          onClick={() => search()}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition-all"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all ${
            showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-6 mb-6 overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Country</label>
                <select
                  value={filters.countries}
                  onChange={(e) => setFilters((f) => ({ ...f, countries: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">All Countries</option>
                  {APP_CONFIG.supportedCountries.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Scaled</label>
                <select
                  value={filters.isScaled}
                  onChange={(e) => setFilters((f) => ({ ...f, isScaled: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">All</option>
                  <option value="true">Scaled Only</option>
                  <option value="false">Not Scaled</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="createdAt">Date Added</option>
                  <option value="startDate">Start Date</option>
                  <option value="impressionsLower">Impressions</option>
                  <option value="spendLower">Ad Spend</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4 gap-3">
              <button
                onClick={() => setFilters({ status: '', countries: '', isScaled: '', isDuplicate: '', sortBy: 'createdAt', sortOrder: 'desc' })}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
              <button
                onClick={() => search()}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      {meta && (
        <p className="text-muted-foreground text-sm mb-4">
          Found <span className="text-foreground font-semibold">{meta.total.toLocaleString()}</span> ads
          {query && <> for &quot;<span className="text-primary">{query}</span>&quot;</>}
        </p>
      )}

      {/* Results grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-secondary" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-secondary rounded w-3/4" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg">No results found</p>
          <p className="text-sm mt-1">Try different keywords or adjust your filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {results.map((ad, i) => (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-xl overflow-hidden hover:border-primary/30 transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-secondary relative overflow-hidden">
                    {ad.creatives[0]?.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ad.creatives[0].thumbnailUrl}
                        alt="Ad creative"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Eye className="w-8 h-8 text-muted-foreground opacity-20" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {ad.isScaled && (
                        <span className="bg-amber-500/80 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Scaled
                        </span>
                      )}
                      {ad.isDuplicate && (
                        <span className="bg-rose-500/80 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                      ad.status === 'ACTIVE'
                        ? 'bg-emerald-500/80 text-white'
                        : 'bg-black/60 text-white'
                    }`}>
                      {ad.status}
                    </div>

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Link
                        href={`/dashboard/ads/${ad.id}`}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 text-white" />
                      </Link>
                      <button
                        onClick={() => addToFavorites(ad.id)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <Heart className="w-4 h-4 text-white" />
                      </button>
                      {ad.creatives[0]?.mediaUrl && (
                        <a
                          href={ad.creatives[0].mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4 text-white" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="font-semibold text-sm truncate">{ad.pageName ?? 'Unknown'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-muted-foreground text-xs truncate flex-1">{ad.domain ?? '—'}</span>
                      {ad.domain && (
                        <a
                          href={`https://${ad.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {ad.creatives[0]?.callToAction && (
                      <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {ad.creatives[0].callToAction}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: Math.min(meta.totalPages, 10) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => search(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                    page === meta.page
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
