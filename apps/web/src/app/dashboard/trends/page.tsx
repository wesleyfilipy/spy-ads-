'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Flame, Zap, Globe, ExternalLink, BarChart2 } from 'lucide-react';

const TRENDING_NICHES = [
  { niche: 'Suplementos', growth: '+187%', ads: 3420, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { niche: 'Curso Online', growth: '+142%', ads: 5810, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { niche: 'Skincare', growth: '+134%', ads: 2890, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
  { niche: 'Emagrecimento', growth: '+121%', ads: 4100, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { niche: 'Dropshipping', growth: '+98%', ads: 1760, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { niche: 'Investimentos', growth: '+87%', ads: 2340, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { niche: 'Pets', growth: '+76%', ads: 1280, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { niche: 'Tecnologia', growth: '+65%', ads: 3900, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
];

const HOT_KEYWORDS = [
  'grátis', 'limitado', 'aproveite', 'oferta', 'desconto', 'garantia',
  'resultado', 'transformação', 'exclusivo', 'última chance', 'bônus', 'urgente',
];

const TRENDING_CTAS = [
  { cta: 'Comprar Agora', pct: 34 },
  { cta: 'Saiba Mais', pct: 22 },
  { cta: 'Inscrever-se', pct: 18 },
  { cta: 'Baixar Grátis', pct: 12 },
  { cta: 'Acessar Agora', pct: 8 },
  { cta: 'Ver Oferta', pct: 6 },
];

export default function TrendsPage() {
  const [selectedCountry, setSelectedCountry] = useState('BR');

  const fbLibraryUrl = (q: string) =>
    `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${selectedCountry}&q=${encodeURIComponent(q)}&media_type=all`;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-400" />
            Tendências
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Nichos e criativos em alta na Biblioteca de Anúncios do Meta
          </p>
        </div>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="BR">🇧🇷 Brasil</option>
          <option value="US">🇺🇸 EUA</option>
          <option value="ALL">🌍 Global</option>
        </select>
      </div>

      {/* Trending niches */}
      <div className="mb-8">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Nichos em Alta
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRENDING_NICHES.map((item, i) => (
            <motion.a
              key={item.niche}
              href={fbLibraryUrl(item.niche)}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass rounded-2xl p-5 border ${item.bg} hover:scale-[1.02] transition-all group cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.bg} ${item.color} border`}>
                  {item.growth}
                </span>
                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="font-bold text-lg">{item.niche}</p>
              <p className="text-muted-foreground text-xs mt-1">
                {item.ads.toLocaleString()} anúncios ativos
              </p>
            </motion.a>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Globe className="w-3 h-3" />
          Clique em qualquer nicho para ver os anúncios reais na Biblioteca do Meta
        </p>
      </div>

      {/* Hot CTAs */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            CTAs Mais Usados
          </h2>
          <div className="space-y-3">
            {TRENDING_CTAS.map((item) => (
              <div key={item.cta} className="flex items-center gap-3">
                <span className="text-sm font-medium w-32 flex-shrink-0">{item.cta}</span>
                <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hot keywords */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Palavras que Convertem
          </h2>
          <p className="text-muted-foreground text-xs mb-4">
            Clique para buscar anúncios que usam essa palavra no Meta
          </p>
          <div className="flex flex-wrap gap-2">
            {HOT_KEYWORDS.map((kw) => (
              <a
                key={kw}
                href={fbLibraryUrl(kw)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border text-sm px-3 py-1.5 rounded-full transition-all font-medium"
              >
                {kw}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Direct link to Meta Ads Library */}
      <div className="glass rounded-2xl p-6 border border-[#1877F2]/20 bg-[#1877F2]/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold mb-1 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#1877F2]" />
              Explorar Biblioteca Completa
            </h3>
            <p className="text-muted-foreground text-sm">
              Acesse diretamente a Biblioteca de Anúncios do Meta com filtros avançados
            </p>
          </div>
          <a
            href={`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${selectedCountry}&media_type=all`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ml-4"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir no Meta
          </a>
        </div>
      </div>
    </div>
  );
}
