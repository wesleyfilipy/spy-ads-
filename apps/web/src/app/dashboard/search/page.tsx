'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, TrendingUp, Copy, ExternalLink, Download,
  Globe, Zap, Filter, X, ChevronDown, ChevronUp,
} from 'lucide-react';

interface ViralAd {
  id: string;
  pageName: string;
  domain: string;
  headline: string;
  body: string;
  callToAction: string;
  copies: number;
  impressionsMin: number;
  impressionsMax: number;
  startDate: string;
  status: string;
  platforms: string[];
  country: string;
  niche: string;
  thumbnail: string | null;
  fbLibraryUrl: string;
  isScaled: boolean;
}

function formatImpressions(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

function AdCard({ ad }: { ad: ViralAd }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyText() {
    navigator.clipboard.writeText(`${ad.headline}\n\n${ad.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden hover:border-primary/30 transition-all"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-secondary relative overflow-hidden group">
        {ad.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.thumbnail} alt={ad.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-violet-500/10">
            <Zap className="w-10 h-10 text-primary opacity-30" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {ad.isScaled && (
            <span className="bg-amber-500/90 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Escalado
            </span>
          )}
          <span className="bg-rose-500/90 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Copy className="w-3 h-3" /> {ad.copies} cópias
          </span>
        </div>

        <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${
          ad.status === 'ACTIVE' ? 'bg-emerald-500/90 text-white' : 'bg-black/70 text-white'
        }`}>
          {ad.status === 'ACTIVE' ? 'ATIVO' : 'INATIVO'}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <a
            href={ad.fbLibraryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-[#1877F2] text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-[#1877F2]/90 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Ver no Meta
          </a>
          {ad.thumbnail && (
            <a
              href={ad.thumbnail}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-white/30 transition-colors"
            >
              <Download className="w-3 h-3" /> Baixar
            </a>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{ad.pageName}</p>
            {ad.domain && (
              <a
                href={`https://${ad.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-0.5"
              >
                <Globe className="w-3 h-3" />
                {ad.domain}
              </a>
            )}
          </div>
          {ad.niche && (
            <span className="text-xs bg-secondary border border-border px-2 py-0.5 rounded-full text-muted-foreground flex-shrink-0">
              {ad.niche}
            </span>
          )}
        </div>

        {/* Headline */}
        {ad.headline && (
          <p className="text-sm font-semibold mb-1 line-clamp-2 leading-snug">{ad.headline}</p>
        )}

        {/* Body */}
        {ad.body && (
          <div>
            <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {ad.body}
            </p>
            {ad.body.length > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary hover:underline mt-1 flex items-center gap-0.5"
              >
                {expanded ? <><ChevronUp className="w-3 h-3" />Menos</> : <><ChevronDown className="w-3 h-3" />Mais</>}
              </button>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-amber-400" />
            <span className="font-medium text-foreground">
              {formatImpressions(ad.impressionsMin)}–{formatImpressions(ad.impressionsMax)}
            </span>
            <span>imp.</span>
          </div>
          {ad.platforms.length > 0 && (
            <div className="flex gap-1">
              {ad.platforms.slice(0, 2).map((p) => (
                <span key={p} className="bg-secondary px-1.5 py-0.5 rounded text-xs capitalize">
                  {p === 'audience_network' ? 'AN' : p.slice(0, 2).toUpperCase()}
                </span>
              ))}
            </div>
          )}
          {ad.callToAction && (
            <span className="ml-auto bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {ad.callToAction}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={copyText}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all border ${
              copied
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
            }`}
          >
            <Copy className="w-3 h-3" />
            {copied ? 'Copiado!' : 'Copiar texto'}
          </button>
          <a
            href={ad.fbLibraryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-[#1877F2]/10 border border-[#1877F2]/30 text-[#1877F2] hover:bg-[#1877F2]/20 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Ver no Meta
          </a>
          {ad.domain && (
            <a
              href={`https://${ad.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-xs bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              title="Visitar site"
            >
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [ads, setAds] = useState<ViralAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'demo' | 'facebook'>('demo');
  const [showFilters, setShowFilters] = useState(false);
  const [minCopies, setMinCopies] = useState(20);
  const [country, setCountry] = useState('BR');

  const fetchAds = useCallback(async (q = query) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, country, minCopies: String(minCopies) });
      const res = await fetch(`/api/viral-ads?${params}`);
      const json = await res.json();
      setAds(json.data ?? []);
      setSource(json.source ?? 'demo');
    } catch {
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [query, country, minCopies]);

  useEffect(() => { fetchAds(''); }, []);// eslint-disable-line

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Copy className="w-6 h-6 text-rose-400" />
            Anúncios Virais
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Anúncios com dezenas de cópias — os mais escalados do mercado
          </p>
        </div>
        {source === 'demo' && (
          <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full font-semibold">
            Modo Demo
          </span>
        )}
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAds()}
            placeholder="Buscar por nicho, marca, copy..."
            className="w-full bg-secondary border border-border rounded-xl pl-11 pr-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
        <button
          onClick={() => fetchAds()}
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
          <Filter className="w-4 h-4" /> Filtros
        </button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-5 mb-5 overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">País</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="BR">🇧🇷 Brasil</option>
                  <option value="US">🇺🇸 EUA</option>
                  <option value="ALL">🌍 Global</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Mín. de cópias</label>
                <select value={minCopies} onChange={(e) => setMinCopies(Number(e.target.value))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value={10}>10+ cópias</option>
                  <option value={20}>20+ cópias</option>
                  <option value={50}>50+ cópias</option>
                  <option value={100}>100+ cópias</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={() => { setMinCopies(20); setCountry('BR'); setQuery(''); fetchAds(''); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" /> Limpar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      {!loading && (
        <p className="text-muted-foreground text-sm mb-5">
          <span className="text-foreground font-semibold">{ads.length}</span> anúncios com {minCopies}+ cópias encontrados
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-secondary" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-secondary rounded w-3/4" />
                <div className="h-3 bg-secondary rounded w-full" />
                <div className="h-3 bg-secondary rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg">Nenhum resultado</p>
          <p className="text-sm mt-1">Tente outros termos ou reduza o mínimo de cópias</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
        </div>
      )}
    </div>
  );
}
