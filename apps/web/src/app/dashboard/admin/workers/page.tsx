'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Play, AlertCircle, CheckCircle, Clock, Pause, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { apiGet, apiPost } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface WorkerJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  progress: number;
  attemptsMade: number;
  failedReason?: string;
  timestamp: number;
  finishedOn?: number;
}

const QUEUE_COLORS: Record<string, string> = {
  mining: '#6366f1',
  'video-processing': '#10b981',
  thumbnails: '#f59e0b',
  deduplication: '#ec4899',
};

export default function WorkersPage() {
  const { accessToken, user } = useAuthStore();
  const [queues, setQueues] = useState<Record<string, QueueStats>>({});
  const [selectedQueue, setSelectedQueue] = useState('mining');
  const [selectedStatus, setSelectedStatus] = useState<'waiting' | 'active' | 'failed' | 'completed'>('failed');
  const [jobs, setJobs] = useState<WorkerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadQueues = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await apiGet<{ success: boolean; data: { queues: Record<string, QueueStats> } }>(
        '/api/admin/workers/status', accessToken
      );
      setQueues(res.data.queues ?? {});
    } catch {}
  }, [accessToken]);

  const loadJobs = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await apiGet<{ success: boolean; data: WorkerJob[] }>(
        `/api/admin/workers/jobs?queue=${selectedQueue}&status=${selectedStatus}&limit=20`,
        accessToken
      );
      setJobs(res.data ?? []);
    } catch {}
  }, [accessToken, selectedQueue, selectedStatus]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadQueues(), loadJobs()]).finally(() => setLoading(false));
  }, [loadQueues, loadJobs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadQueues();
      loadJobs();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadQueues, loadJobs]);

  async function retryJob(jobId: string) {
    if (!accessToken) return;
    await apiPost('/api/admin/workers/retry', { queueName: selectedQueue, jobId }, accessToken);
    await loadJobs();
  }

  if (user?.role !== 'ADMIN') return <div className="p-8 text-muted-foreground">Access denied</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Worker Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time queue and job status</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              autoRefresh
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-secondary border border-border text-muted-foreground'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`} />
            Live
          </button>
          <button
            onClick={() => { loadQueues(); loadJobs(); }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm p-2 rounded-lg hover:bg-secondary transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Object.entries(queues).map(([name, stats]) => {
          const color = QUEUE_COLORS[name] ?? '#6366f1';
          const isSelected = selectedQueue === name;
          return (
            <motion.button
              key={name}
              onClick={() => setSelectedQueue(name)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`glass rounded-2xl p-5 text-left transition-all ${
                isSelected ? 'border-primary/40 bg-primary/5' : 'hover:border-border/80'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold capitalize">{name}</span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: stats.active > 0 ? color : '#475569',
                    boxShadow: stats.active > 0 ? `0 0 8px ${color}` : 'none',
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Waiting</div>
                  <div className="font-bold text-base">{formatNumber(stats.waiting)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Active</div>
                  <div className="font-bold text-base" style={{ color: stats.active > 0 ? color : undefined }}>
                    {stats.active}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Done</div>
                  <div className="font-bold text-base text-emerald-400">{formatNumber(stats.completed)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Failed</div>
                  <div className="font-bold text-base text-rose-400">{stats.failed}</div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Jobs table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h2 className="font-bold capitalize">{selectedQueue} — Jobs</h2>
          <div className="flex gap-2">
            {(['waiting', 'active', 'failed', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  selectedStatus === status
                    ? status === 'failed'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {status}
                {status === 'failed' && queues[selectedQueue]?.failed > 0 && (
                  <span className="ml-1 bg-rose-500 text-white rounded-full px-1.5 py-0.5 text-xs">
                    {queues[selectedQueue].failed}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No {selectedStatus} jobs in {selectedQueue}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left py-3 px-6 font-medium">Job ID</th>
                  <th className="text-left py-3 px-4 font-medium">Data</th>
                  <th className="text-left py-3 px-4 font-medium">Progress</th>
                  <th className="text-left py-3 px-4 font-medium">Attempts</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-6 font-mono text-xs text-muted-foreground">{job.id}</td>
                    <td className="py-3 px-4 max-w-48">
                      <pre className="text-xs text-muted-foreground truncate">
                        {JSON.stringify(job.data).slice(0, 60)}
                      </pre>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{job.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{job.attemptsMade}</td>
                    <td className="py-3 px-4">
                      {job.failedReason ? (
                        <span className="flex items-center gap-1 text-rose-400 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          {job.failedReason.slice(0, 40)}
                        </span>
                      ) : job.finishedOn ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs">
                          <CheckCircle className="w-3 h-3" />
                          Done
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400 text-xs">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {selectedStatus === 'failed' && (
                        <button
                          onClick={() => retryJob(job.id)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
