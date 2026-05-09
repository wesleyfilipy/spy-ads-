'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ExternalLink, TrendingUp, Zap, Globe, Filter } from 'lucide-react';
import { APP_CONFIG } from '@adspy/config';

const SUGGESTIONS = [
  { label: 'Suplementos', emoji: '💪' },
  { label: 'Curso Online', emoji: '🎓' },
  { label: 'Skincare', emoji: '✨' },
  { label: 'Emagrecimento', emoji: '🏃' },
  { label: 'Dropshipping', emoji: '📦' },
  { label: 'Investimentos', emoji: '📈' },
  { label: 'Pets', emoji: '🐾' },
  { label: 'Moda', emoji: '👗' },
  { label: 'Tecnologia', emoji: '💻' },
  { label: 'Imóveis', emoji: '🏠' },
  { label: 'Viagem', emoji: '✈️' },
  { label: 'Saúde', emoji: '❤️' },
];

const RECENT_SEARCHES = ['suplementos', 'curso online', 'skincare', 'dropshipping'];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('BR');
  const [adType, setAdType] = useState('ALL');
  const [status, setStatus] = useState('active');
  const [showFilters, setShowFilters] = useState(false);

  function buildUrl(q: string) {
    const params = new URLSearchParams({
      active_status: status,
      ad_type: adType,
      country: country,
      media_type: 'all',
      ...(q.trim() && { q: q.trim() }),
    });
    return `https://www.facebook.com/ads/library/?${params.toString()}`;
  }

  function openSearch(q = query) {
    window.open(buildUrl(q), '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Buscar Anúncios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pesquise diretamente na{' '}
          <span className="text-[#1877F2] font-semibold">Biblioteca de Anúncios do Meta</span>
        </p>
      </div>

      {/* Main search card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 mb-6"
      >
        {/* Search bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && openSearch()}
              placeholder="Marca, produto, nicho, copy..."
              className="w-full bg-secondary border border-border rounded-xl pl-11 pr-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all ${
              showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button
            onClick={() => openSearch()}
            className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-[0_0_20px_rgba(24,119,242,0.4)]"
          >
            <ExternalLink className="w-4 h-4" />
            Buscar no Meta
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50"
          >
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">País</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="ALL">🌍 Todos</option>
                <option value="BR">🇧🇷 Brasil</option>
                <option value="US">🇺🇸 EUA</option>
                <option value="GB">🇬🇧 UK</option>
                <option value="CA">🇨🇦 Canadá</option>
                <option value="AU">🇦🇺 Austrália</option>
                {APP_CONFIG.supportedCountries.filter(c => !['BR','US','GB','CA','AU'].includes(c.code)).map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
                <option value="all">Todos</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Tipo de mídia</label>
              <select value={adType} onChange={(e) => setAdType(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                <option value="ALL">Todos</option>
                <option value="IMAGE">Imagem</option>
                <option value="VIDEO">Vídeo</option>
                <option value="MEME">Meme</option>
              </select>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Suggestions */}
      <div className="mb-8">
        <h2 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Nichos populares — clique para buscar
        </h2>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => { setQuery(s.label); openSearch(s.label); }}
              className="flex items-center gap-1.5 bg-secondary hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border text-sm px-3 py-2 rounded-xl transition-all font-medium"
            >
              <span>{s.emoji}</span>
              {s.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent */}
      <div className="mb-8">
        <h2 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Buscas rápidas
        </h2>
        <div className="flex gap-2 flex-wrap">
          {RECENT_SEARCHES.map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); openSearch(s); }}
              className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full font-medium hover:bg-primary/20 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6 border border-[#1877F2]/20 bg-[#1877F2]/5"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1877F2]/20 flex items-center justify-center flex-shrink-0">
            <Globe className="w-6 h-6 text-[#1877F2]" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Como funciona</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Ao clicar em <strong className="text-foreground">Buscar no Meta</strong>, a Biblioteca de Anúncios do Facebook abre em
              uma nova aba com seus filtros já aplicados. Você vê os anúncios reais, criativos em vídeo e imagem,
              copy completo, data de veiculação e muito mais — sem precisar de nenhuma conta especial.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => openSearch('')}
                className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir Biblioteca Completa
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
