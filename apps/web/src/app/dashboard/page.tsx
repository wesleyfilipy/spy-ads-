'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Search, Eye, Copy, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { apiGet } from '@/lib/api';

interface DashboardStats {
  total: number;
  active: number;
  scaled: number;
  duplicates: number;
  todayNew: number;
  lastMiningAt?: string;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass rounded-2xl p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <span className="text-muted-foreground text-sm font-medium">{label}</span>
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="text-3xl font-black">
      {typeof value === 'number' ? value.toLocaleString() : value}
    </div>
  </motion.div>
);

export default function DashboardPage() {
  const { accessToken, user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAds, setRecentAds] = useState<unknown[]>([]);

  useEffect(() => {
    if (!accessToken) return;

    apiGet<{ success: boolean; data: DashboardStats }>('/api/ads/stats/overview', accessToken)
      .then((res) => setStats(res.data))
      .catch(() => {});

    apiGet<{ success: boolean; data: unknown[] }>('/api/ads?limit=8&sortBy=createdAt&sortOrder=desc', accessToken)
      .then((res) => setRecentAds(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [accessToken]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here&apos;s what&apos;s happening in the ads world today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Total Ads"
          value={stats?.total ?? '—'}
          icon={Eye}
          color="bg-indigo-500/15 text-indigo-400"
          delay={0}
        />
        <StatCard
          label="Active Ads"
          value={stats?.active ?? '—'}
          icon={Zap}
          color="bg-emerald-500/15 text-emerald-400"
          delay={0.05}
        />
        <StatCard
          label="Scaled Campaigns"
          value={stats?.scaled ?? '—'}
          icon={TrendingUp}
          color="bg-amber-500/15 text-amber-400"
          delay={0.1}
        />
        <StatCard
          label="Duplicates"
          value={stats?.duplicates ?? '—'}
          icon={Copy}
          color="bg-rose-500/15 text-rose-400"
          delay={0.15}
        />
        <StatCard
          label="New Today"
          value={stats?.todayNew ?? '—'}
          icon={Search}
          color="bg-violet-500/15 text-violet-400"
          delay={0.2}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            title: 'Search Ads',
            desc: 'Find winning creatives with advanced filters',
            href: '/dashboard/search',
            icon: Search,
            color: 'from-indigo-500/20 to-violet-500/20',
          },
          {
            title: 'Scaled Campaigns',
            desc: 'Discover ads being aggressively scaled right now',
            href: '/dashboard/search?isScaled=true',
            icon: TrendingUp,
            color: 'from-amber-500/20 to-orange-500/20',
          },
          {
            title: 'Trending Creatives',
            desc: 'See the most active and duplicated ad creatives',
            href: '/dashboard/trends',
            icon: Zap,
            color: 'from-emerald-500/20 to-teal-500/20',
          },
        ].map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <Link
                href={action.href}
                className={`block glass rounded-2xl p-6 bg-gradient-to-br ${action.color} hover:scale-[1.02] transition-all group`}
              >
                <Icon className="w-8 h-8 mb-4 opacity-70" />
                <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{action.desc}</p>
                <div className="flex items-center gap-1 text-primary text-sm font-medium">
                  Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Recent ads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Recently Added Ads</h2>
          <Link href="/dashboard/search" className="text-primary text-sm hover:underline">
            View all
          </Link>
        </div>

        {recentAds.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No ads yet</p>
            <p className="text-sm mt-1">
              Install the Chrome extension and visit the Facebook Ads Library to start mining.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(recentAds as Array<{
              id: string;
              pageName?: string;
              domain?: string;
              status: string;
              creatives: Array<{ thumbnailUrl?: string; type: string }>;
            }>).map((ad, i) => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.03 }}
              >
                <Link href={`/dashboard/ads/${ad.id}`} className="block glass rounded-xl overflow-hidden hover:border-primary/30 transition-all group">
                  <div className="aspect-video bg-secondary relative overflow-hidden">
                    {ad.creatives[0]?.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ad.creatives[0].thumbnailUrl}
                        alt="Ad creative"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Eye className="w-8 h-8 opacity-20" />
                      </div>
                    )}
                    <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                      ad.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-secondary border border-border text-muted-foreground'
                    }`}>
                      {ad.status}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate">{ad.pageName ?? 'Unknown Page'}</p>
                    <p className="text-muted-foreground text-xs truncate mt-0.5">{ad.domain ?? '—'}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
