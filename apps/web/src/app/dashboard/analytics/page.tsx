'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, Users, Zap, Globe, Award, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { apiGet } from '@/lib/api';
import { MiniLineChart, BarChart, DonutChart } from '@/components/charts/MiniLineChart';
import { StatCardSkeleton } from '@/components/ui/skeleton';
import { formatNumber, formatCurrency } from '@/lib/utils';

interface AnalyticsData {
  users: { total: number; new7d: number };
  ads: { total: number; new7d: number; today: number; active: number; scaled: number; duplicates: number };
  revenue: { total: number };
  subscriptions: Array<{ plan: string; _count: number }>;
  miningActivity: Array<{ createdAt: string; newAds: number; processedAds: number; errors: number }>;
}

function StatCard({
  label, value, subValue, icon: Icon, color, trend, chart,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  color: string;
  trend?: number;
  chart?: { values: number[]; color: string };
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-3xl font-black mb-1">{value}</div>
      {subValue && <div className="text-muted-foreground text-xs">{subValue}</div>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs mt-2 ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
          {Math.abs(trend)}% vs last week
        </div>
      )}
      {chart && (
        <div className="mt-3 -mx-1">
          <MiniLineChart
            data={chart.values.map((v) => ({ value: v }))}
            color={chart.color}
            height={40}
          />
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { accessToken, user } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';

  function load() {
    if (!accessToken) return;
    setLoading(true);
    const endpoint = isAdmin ? '/api/admin/analytics/overview' : '/api/ads/stats/overview';
    apiGet<{ success: boolean; data: AnalyticsData }>(endpoint, accessToken)
      .then((res) => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, [accessToken]);

  const miningChartData = data?.miningActivity?.slice(-14).map((m) => ({
    value: m.newAds,
  })) ?? [];

  const subscriptionDonut = [
    { label: 'FREE', value: data?.subscriptions?.find((s) => s.plan === 'FREE')?._count ?? 0, color: '#64748b' },
    { label: 'BASIC', value: data?.subscriptions?.find((s) => s.plan === 'BASIC')?._count ?? 0, color: '#6366f1' },
    { label: 'PRO', value: data?.subscriptions?.find((s) => s.plan === 'PRO')?._count ?? 0, color: '#8b5cf6' },
    { label: 'ENTERPRISE', value: data?.subscriptions?.find((s) => s.plan === 'ENTERPRISE')?._count ?? 0, color: '#f59e0b' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform performance overview</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Ads"
              value={formatNumber(data?.ads.total ?? 0)}
              subValue={`+${data?.ads.new7d ?? 0} this week`}
              icon={BarChart2}
              color="bg-indigo-500/15 text-indigo-400"
              trend={data?.ads.new7d ? Math.round((data.ads.new7d / Math.max(data.ads.total, 1)) * 100) : 0}
            />
            <StatCard
              label="Active Ads"
              value={formatNumber(data?.ads.active ?? 0)}
              icon={Zap}
              color="bg-emerald-500/15 text-emerald-400"
            />
            <StatCard
              label="Scaled Campaigns"
              value={formatNumber(data?.ads.scaled ?? 0)}
              icon={TrendingUp}
              color="bg-amber-500/15 text-amber-400"
            />
            <StatCard
              label="New Today"
              value={formatNumber(data?.ads.today ?? 0)}
              icon={Award}
              color="bg-violet-500/15 text-violet-400"
            />
            {isAdmin && (
              <>
                <StatCard
                  label="Total Users"
                  value={formatNumber(data?.users?.total ?? 0)}
                  subValue={`+${data?.users?.new7d ?? 0} this week`}
                  icon={Users}
                  color="bg-sky-500/15 text-sky-400"
                />
                <StatCard
                  label="Revenue"
                  value={formatCurrency(data?.revenue?.total ?? 0)}
                  icon={BarChart2}
                  color="bg-emerald-500/15 text-emerald-400"
                />
                <StatCard
                  label="Duplicates Found"
                  value={formatNumber(data?.ads.duplicates ?? 0)}
                  icon={Globe}
                  color="bg-rose-500/15 text-rose-400"
                />
              </>
            )}
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mining activity chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="font-bold mb-1">Mining Activity</h2>
          <p className="text-muted-foreground text-xs mb-6">New ads collected per day (last 14 days)</p>

          {loading ? (
            <div className="h-40 animate-pulse bg-secondary rounded-xl" />
          ) : miningChartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              No mining data yet
            </div>
          ) : (
            <div className="h-40">
              <BarChart
                data={miningChartData}
                color="#6366f1"
                height={160}
              />
            </div>
          )}
        </div>

        {/* Subscription breakdown */}
        {isAdmin && (
          <div className="glass rounded-2xl p-6">
            <h2 className="font-bold mb-1">Subscriptions</h2>
            <p className="text-muted-foreground text-xs mb-6">Plan distribution</p>

            {loading ? (
              <div className="h-40 animate-pulse bg-secondary rounded-xl" />
            ) : (
              <div>
                <div className="flex justify-center mb-4">
                  <DonutChart data={subscriptionDonut} size={120} />
                </div>
                <div className="space-y-2">
                  {subscriptionDonut.map((d) => (
                    <div key={d.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                        <span className="text-muted-foreground">{d.label}</span>
                      </div>
                      <span className="font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top domains */}
        <TopDomainsCard accessToken={accessToken} />
      </div>
    </div>
  );
}

function TopDomainsCard({ accessToken }: { accessToken: string | null }) {
  const [domains, setDomains] = useState<Array<{ domain: string; adsCount: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    apiGet<{ success: boolean; data: Array<{ domain: string; adsCount: number }> }>(
      '/api/search/filters/options',
      accessToken
    )
      .then((res) => {
        const data = res.data as unknown as { domains: Array<{ value: string; count: number }> };
        setDomains(data.domains?.slice(0, 8).map((d) => ({ domain: d.value, adsCount: d.count })) ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [accessToken]);

  const maxCount = Math.max(...domains.map((d) => d.adsCount), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="lg:col-span-3 glass rounded-2xl p-6"
    >
      <h2 className="font-bold mb-1">Top Advertisers</h2>
      <p className="text-muted-foreground text-xs mb-6">Domains with most ads</p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-4 w-32 bg-secondary rounded" />
              <div className="flex-1 h-3 bg-secondary rounded" />
              <div className="h-4 w-12 bg-secondary rounded" />
            </div>
          ))}
        </div>
      ) : domains.length === 0 ? (
        <p className="text-muted-foreground text-sm">No domain data yet</p>
      ) : (
        <div className="space-y-3">
          {domains.map((d, i) => (
            <div key={d.domain} className="flex items-center gap-3">
              <span className="text-muted-foreground text-xs w-4 flex-shrink-0">{i + 1}</span>
              <span className="text-sm font-medium w-48 truncate flex-shrink-0">{d.domain}</span>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                  style={{ width: `${(d.adsCount / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs w-12 text-right flex-shrink-0">
                {formatNumber(d.adsCount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
