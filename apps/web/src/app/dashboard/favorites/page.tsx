'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { apiGet, apiDelete } from '@/lib/api';

interface FavoriteItem {
  id: string;
  adId: string;
  createdAt: string;
  ad: {
    id: string;
    pageName?: string;
    domain?: string;
    status: string;
    creatives: Array<{ thumbnailUrl?: string; type: string }>;
  };
}

export default function FavoritesPage() {
  const { accessToken } = useAuthStore();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    apiGet<{ success: boolean; data: FavoriteItem[] }>('/api/favorites', accessToken)
      .then((res) => { setFavorites(res.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [accessToken]);

  async function removeFavorite(adId: string) {
    if (!accessToken) return;
    await apiDelete(`/api/favorites/${adId}`, accessToken);
    setFavorites((prev) => prev.filter((f) => f.adId !== adId));
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Favorites</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {favorites.length} saved ads
        </p>
      </div>

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
      ) : favorites.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center text-muted-foreground">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg">No favorites yet</p>
          <p className="text-sm mt-1">Save ads you like while browsing the search page</p>
          <Link href="/dashboard/search" className="inline-block mt-4 text-primary hover:underline text-sm">
            Browse ads
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {favorites.map((fav, i) => (
            <motion.div
              key={fav.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass rounded-xl overflow-hidden hover:border-primary/30 transition-all group"
            >
              <div className="aspect-video bg-secondary relative overflow-hidden">
                {fav.ad.creatives[0]?.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fav.ad.creatives[0].thumbnailUrl}
                    alt="Ad creative"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Eye className="w-8 h-8 text-muted-foreground opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Link href={`/dashboard/ads/${fav.ad.id}`} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg">
                    <Eye className="w-4 h-4 text-white" />
                  </Link>
                  <button onClick={() => removeFavorite(fav.adId)} className="p-2 bg-rose-500/20 hover:bg-rose-500/40 rounded-lg">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm truncate">{fav.ad.pageName ?? 'Unknown'}</p>
                <p className="text-muted-foreground text-xs truncate mt-0.5">{fav.ad.domain ?? '—'}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
