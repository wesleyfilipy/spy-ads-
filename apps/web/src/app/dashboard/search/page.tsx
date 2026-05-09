'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, TrendingUp, Eye, ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { APP_CONFIG } from '@adspy/config';

interface FbAd {
  id: string;
  pageName: string;
  pageId: string;
  headline: string;
  body: string;
  snapshotUrl: string;
  startDate: string;
  endDate: string;
  status: string;
  platforms: string[];
  impressions?: { lower_bound: string; upper_bound: string };
  spend?: { lower_bound: string; upper_bound: string };
  currency?: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FbAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [noToken, setNoToken] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [countries, setCountries] = useState('BR,US');
  const [searched, setSearched] = useState(false);

  async function doSearch(term = query) {
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const params = new URLSearchParams({ q: term || 'produto', countries, limit: '24' });
      const res = await fetch(`/api/ads/search?${params}`);
      const json = await res.json();

      if (json.error === 'FACEBOOK_ACCESS_TOKEN not configured') {
        setNoToken(true);
        setResults([]);
      } else if (json.error) {
        setError(json.error);
        setResults([]);
      } else {
        setNoToken(false);
        setResults(json.data ?? []);
      }
    } catch {
      setError('Falha ao conectar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    doSearch('produto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Search Ads</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Busca em tempo real na <span className="text-primary font-semibold">Meta Ads Library</span>
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
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            placeholder="Pesquise por marca, produto, nicho, copy..."
            className="w-full bg-secondary border border-border rounded-xl pl-11 pr-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
        <button
          onClick={() => doSearch()}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition-all"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all ${
            showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">País</label>
                <select
                  value={countries}
                  onChange={(e) => setCountries(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="BR,US">Brasil + EUA</option>
                  {APP_CONFIG.supportedCountries.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setCountries('BR,US'); doSearch(); }}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" /> Limpar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No token warning */}
      {noToken && (
        <div className="glass border border-amber-500/30 bg-amber-500/5 rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-400 mb-1">Token do Facebook não configurado</p>
              <p className="text-sm text-muted-foreground mb-3">
                Para ver anúncios reais do Meta Ads Library, adicione o <code className="bg-secondary px-1 rounded">FACEBOOK_ACCESS_TOKEN</code> nas variáveis de ambiente do Vercel.
              </p>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p><span className="text-foreground font-medium">1.</span> Acesse <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">developers.facebook.com/tools/explorer</a></p>
                <p><span className="text-foreground font-medium">2.</span> Gere um User Access Token com permissão <code className="bg-secondary px-1 rounded">ads_read</code></p>
                <p><span className="text-foreground font-medium">3.</span> No Vercel → Settings → Environment Variables → adicione <code className="bg-secondary px-1 rounded">FACEBOOK_ACCESS_TOKEN</code></p>
                <p><span className="text-foreground font-medium">4.</span> Redeploy o projeto</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass border border-destructive/30 bg-destructive/5 rounded-2xl p-4 mb-6 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results count */}
      {!noToken && searched && !loading && (
        <p className="text-muted-foreground text-sm mb-4">
          <span className="text-foreground font-semibold">{results.length}</span> anúncios encontrados
          {query && <> para &quot;<span className="text-primary">{query}</span>&quot;</>}
        </p>
      )}

      {/* Loading skeletons */}
      {loading && (
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
      )}

      {/* Results */}
      {!loading && !noToken && results.length > 0 && (
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
                {/* Snapshot iframe preview */}
                <div className="aspect-video bg-secondary relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                    <Eye className="w-6 h-6 text-muted-foreground opacity-30 mb-2" />
                    {ad.headline && (
                      <p className="text-xs font-semibold line-clamp-2 text-foreground">{ad.headline}</p>
                    )}
                    {ad.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{ad.body}</p>
                    )}
                  </div>

                  <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                    ad.status === 'ACTIVE' ? 'bg-emerald-500/80 text-white' : 'bg-black/60 text-white'
                  }`}>
                    {ad.status === 'ACTIVE' ? 'ATIVO' : 'INATIVO'}
                  </div>

                  {ad.platforms?.includes('instagram') && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-pink-500/80 text-white text-xs px-2 py-0.5 rounded-full font-bold">IG</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a
                      href={ad.snapshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 bg-primary text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <Eye className="w-3 h-3" /> Ver no Meta
                    </a>
                  </div>
                </div>

                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{ad.pageName}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-muted-foreground text-xs truncate flex-1">
                      {ad.startDate ? new Date(ad.startDate).toLocaleDateString('pt-BR') : '—'}
                    </span>
                    {ad.snapshotUrl && (
                      <a href={ad.snapshotUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {ad.impressions && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <TrendingUp className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">
                        {Number(ad.impressions.lower_bound).toLocaleString()}–{Number(ad.impressions.upper_bound).toLocaleString()} imp.
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* No results */}
      {!loading && !noToken && searched && results.length === 0 && !error && (
        <div className="glass rounded-2xl p-16 text-center text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg">Nenhum resultado encontrado</p>
          <p className="text-sm mt-1">Tente outras palavras-chave ou mude o país</p>
        </div>
      )}
    </div>
  );
}
