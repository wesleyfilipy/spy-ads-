'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Eye, Zap, TrendingUp, Play, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { apiGet, apiPost } from '@/lib/api';

interface AdminStats {
  users: number;
  ads: number;
  subscriptions: Array<{ plan: string; _count: number }>;
  totalRevenue: number;
}

export default function AdminPage() {
  const { accessToken, user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<unknown[]>([]);
  const [triggeringMining, setTriggeringMining] = useState(false);

  useEffect(() => {
    if (!accessToken || user?.role !== 'ADMIN') return;

    apiGet<{ success: boolean; data: AdminStats }>('/api/admin/stats', accessToken)
      .then((res) => setStats(res.data))
      .catch(() => {});

    apiGet<{ success: boolean; data: unknown[] }>('/api/admin/users?limit=10', accessToken)
      .then((res) => setUsers(res.data ?? []))
      .catch(() => {});
  }, [accessToken, user?.role]);

  async function triggerMining() {
    if (!accessToken) return;
    setTriggeringMining(true);
    try {
      await apiPost('/api/admin/mining/trigger', { type: 'INCREMENTAL', limit: 100 }, accessToken);
      alert('Mining job queued!');
    } catch (err) {
      alert('Failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setTriggeringMining(false);
    }
  }

  if (user?.role !== 'ADMIN') {
    return <div className="p-8 text-muted-foreground">Access denied</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform management and monitoring</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats?.users ?? '—', icon: Users, color: 'bg-indigo-500/15 text-indigo-400' },
          { label: 'Total Ads', value: stats?.ads ?? '—', icon: Eye, color: 'bg-emerald-500/15 text-emerald-400' },
          { label: 'Revenue', value: stats?.totalRevenue ? `$${(stats.totalRevenue / 100).toFixed(0)}` : '—', icon: TrendingUp, color: 'bg-amber-500/15 text-amber-400' },
          { label: 'Active Subs', value: stats?.subscriptions.reduce((acc, s) => acc + s._count, 0) ?? '—', icon: Zap, color: 'bg-violet-500/15 text-violet-400' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground text-sm">{stat.label}</span>
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black">{stat.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="glass rounded-2xl p-6 mb-8">
        <h2 className="font-bold mb-4">Mining Controls</h2>
        <div className="flex gap-3">
          <button
            onClick={triggerMining}
            disabled={triggeringMining}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            {triggeringMining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {triggeringMining ? 'Queuing...' : 'Trigger Mining'}
          </button>
        </div>
      </div>

      {/* Recent users */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-bold mb-4">Recent Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 text-muted-foreground font-medium">User</th>
                <th className="text-left py-3 text-muted-foreground font-medium">Plan</th>
                <th className="text-left py-3 text-muted-foreground font-medium">Role</th>
                <th className="text-left py-3 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(users as Array<{
                id: string;
                name: string;
                email: string;
                role: string;
                status: string;
                subscription?: { plan: string };
              }>).map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                  <td className="py-3">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-muted-foreground text-xs">{u.email}</p>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {u.subscription?.plan ?? 'FREE'}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{u.role}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
