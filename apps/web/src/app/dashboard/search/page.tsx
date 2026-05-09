'use client';

import { useState } from 'react';
import { Search, ExternalLink, Globe } from 'lucide-react';
import { APP_CONFIG } from '@adspy/config';

const COUNTRIES = [
  { code: 'BR', name: '🇧🇷 Brasil' },
  { code: 'US', name: '🇺🇸 Estados Unidos' },
  { code: 'ALL', name: '🌍 Todos os países' },
  ...APP_CONFIG.supportedCountries
    .filter((c) => !['BR', 'US'].includes(c.code))
    .map((c) => ({ code: c.code, name: c.name })),
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('BR');
  const [adType, setAdType] = useState('ALL');
  const [status, setStatus] = useState('active');
  const [iframeUrl, setIframeUrl] = useState('');
  const [iframeBlocked, setIframeBlocked] = useState(false);

  function buildUrl(q = query) {
    const params = new URLSearchParams({
      active_status: status,
      ad_type: adType,
      country: country,
      media_type: 'all',
      ...(q && { q }),
    });
    return `https://www.facebook.com/ads/library/?${params.toString()}`;
  }

  function handleSearch() {
    const url = buildUrl();
    setIframeUrl(url);
    setIframeBlocked(false);
  }

  function openInFacebook() {
    window.open(buildUrl(), '_blank');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex-shrink-0 p-6 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Meta Ads Library</h1>
          <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold ml-1">
            Dados reais do Facebook
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Search input */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Marca, produto, nicho..."
              className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {/* Country */}
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="all">Todos</option>
          </select>

          {/* Ad type */}
          <select
            value={adType}
            onChange={(e) => setAdType(e.target.value)}
            className="bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="ALL">Todos os tipos</option>
            <option value="IMAGE">Imagem</option>
            <option value="VIDEO">Vídeo</option>
            <option value="MEME">Meme</option>
          </select>

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
          >
            Buscar
          </button>

          {/* Open in Facebook */}
          <button
            onClick={openInFacebook}
            className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir no Facebook
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden">
        {!iframeUrl ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-[#1877F2]/10 border border-[#1877F2]/20 flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-[#1877F2]" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Pesquise anúncios reais do Facebook</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Digite uma palavra-chave acima e clique em <strong>Buscar</strong> para ver anúncios reais
              diretamente da Biblioteca de Anúncios do Meta.
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-sm">
              {['suplementos', 'curso online', 'emagrecimento', 'dropshipping', 'skincare', 'investimentos'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setQuery(suggestion); handleSearch(); }}
                  className="bg-secondary hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border px-3 py-1.5 rounded-full transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : iframeBlocked ? (
          /* Iframe blocked fallback */
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
              <ExternalLink className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Abrir no Facebook</h2>
            <p className="text-muted-foreground max-w-md mb-6 text-sm">
              O Facebook bloqueia incorporação direta por segurança. Clique abaixo para ver os anúncios na Biblioteca oficial.
            </p>
            <button
              onClick={openInFacebook}
              className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir Biblioteca de Anúncios
            </button>
            <p className="text-xs text-muted-foreground mt-4">
              URL: <code className="text-primary text-xs">{iframeUrl.slice(0, 80)}...</code>
            </p>
          </div>
        ) : (
          /* Iframe */
          <iframe
            key={iframeUrl}
            src={iframeUrl}
            className="w-full h-full border-0"
            title="Meta Ads Library"
            onError={() => setIframeBlocked(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )}
      </div>
    </div>
  );
}
