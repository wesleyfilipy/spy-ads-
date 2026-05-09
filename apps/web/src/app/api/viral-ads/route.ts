import { NextRequest, NextResponse } from 'next/server';

const FB_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

const DEMO_ADS = [
  {
    id: 'demo_1',
    pageName: 'Suplementos Gold',
    pageId: '123456',
    domain: 'suplementosgold.com.br',
    headline: '🔥 Perca até 8kg em 30 dias — SEM cortar o que você ama',
    body: 'Nosso termogênico natural já ajudou mais de 47.000 brasileiros. Frete grátis hoje. Garanta o seu antes que acabe!',
    callToAction: 'Comprar Agora',
    copies: 84,
    impressionsMin: 500000,
    impressionsMax: 1000000,
    startDate: '2024-11-01',
    status: 'ACTIVE',
    platforms: ['facebook', 'instagram'],
    country: 'BR',
    thumbnail: 'https://picsum.photos/seed/supl1/400/300',
    fbLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=suplementos&media_type=all',
    isScaled: true,
    niche: 'Saúde',
  },
  {
    id: 'demo_2',
    pageName: 'Curso Trader Pro',
    pageId: '234567',
    domain: 'cursotraderpro.com.br',
    headline: 'Aprendi a ganhar R$3.000/semana operando 1h por dia',
    body: 'Sem experiência, sem diploma. Método exclusivo que já formou mais de 12.000 traders lucrativos. Acesso imediato.',
    callToAction: 'Quero Aprender',
    copies: 127,
    impressionsMin: 1000000,
    impressionsMax: 5000000,
    startDate: '2024-10-15',
    status: 'ACTIVE',
    platforms: ['facebook', 'instagram', 'audience_network'],
    country: 'BR',
    thumbnail: 'https://picsum.photos/seed/trader2/400/300',
    fbLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=curso+trader&media_type=all',
    isScaled: true,
    niche: 'Finanças',
  },
  {
    id: 'demo_3',
    pageName: 'SkinGlow Brasil',
    pageId: '345678',
    domain: 'skinglow.com.br',
    headline: 'Dermatologista revela: 1 ingrediente elimina manchas em 7 dias',
    body: 'A vitamina C microencapsulada penetra 10x mais fundo. Aprovado pela ANVISA. Testado por 23.000 mulheres.',
    callToAction: 'Ver Oferta',
    copies: 63,
    impressionsMin: 200000,
    impressionsMax: 500000,
    startDate: '2024-12-01',
    status: 'ACTIVE',
    platforms: ['facebook', 'instagram'],
    country: 'BR',
    thumbnail: 'https://picsum.photos/seed/skin3/400/300',
    fbLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=skincare+manchas&media_type=all',
    isScaled: true,
    niche: 'Beleza',
  },
  {
    id: 'demo_4',
    pageName: 'DropClass Academy',
    pageId: '456789',
    domain: 'dropclassacademy.com',
    headline: 'Como vendi R$47.000 em 1 mês sem ter estoque',
    body: 'Dropshipping nacional em 2024 ainda funciona? SIM. E eu vou te provar. Aula gratuita hoje às 20h.',
    callToAction: 'Participar Grátis',
    copies: 95,
    impressionsMin: 500000,
    impressionsMax: 1000000,
    startDate: '2024-11-20',
    status: 'ACTIVE',
    platforms: ['facebook', 'instagram'],
    country: 'BR',
    thumbnail: 'https://picsum.photos/seed/drop4/400/300',
    fbLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=dropshipping&media_type=all',
    isScaled: true,
    niche: 'E-commerce',
  },
  {
    id: 'demo_5',
    pageName: 'Keto Shake BR',
    pageId: '567890',
    domain: 'ketoshakebr.com.br',
    headline: 'Médico proibiu esse shake? Veja por quê está vendendo tanto',
    body: 'O shake que substituiu o jantar de 89.000 pessoas. 0 carboidrato, 0 glúten. Promoção válida só hoje.',
    callToAction: 'Aproveitar Oferta',
    copies: 156,
    impressionsMin: 1000000,
    impressionsMax: 5000000,
    startDate: '2024-09-01',
    status: 'ACTIVE',
    platforms: ['facebook', 'instagram', 'audience_network'],
    country: 'BR',
    thumbnail: 'https://picsum.photos/seed/keto5/400/300',
    fbLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=keto+shake+emagrecer&media_type=all',
    isScaled: true,
    niche: 'Saúde',
  },
  {
    id: 'demo_6',
    pageName: 'Renda Extra Digital',
    pageId: '678901',
    domain: 'rendaextradigital.com.br',
    headline: 'Aposentado de 61 anos faz R$200/dia no celular. Veja como',
    body: 'Sem experiência com internet. Método simples que qualquer pessoa pode copiar hoje mesmo. Resultado em 24h.',
    callToAction: 'Descobrir Método',
    copies: 212,
    impressionsMin: 5000000,
    impressionsMax: 10000000,
    startDate: '2024-08-01',
    status: 'ACTIVE',
    platforms: ['facebook'],
    country: 'BR',
    thumbnail: 'https://picsum.photos/seed/renda6/400/300',
    fbLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=renda+extra+digital&media_type=all',
    isScaled: true,
    niche: 'Infoproduto',
  },
  {
    id: 'demo_7',
    pageName: 'Pet Feliz Shop',
    pageId: '789012',
    domain: 'petfelizshop.com.br',
    headline: 'Coleira anti-pulga que dura 8 meses — sem banho com químicos',
    body: 'A coleira que veterinários recomendam. Protege contra pulgas, carrapatos e mosquitos. Frete grátis para todo o Brasil.',
    callToAction: 'Pedir Agora',
    copies: 41,
    impressionsMin: 100000,
    impressionsMax: 200000,
    startDate: '2024-12-10',
    status: 'ACTIVE',
    platforms: ['facebook', 'instagram'],
    country: 'BR',
    thumbnail: 'https://picsum.photos/seed/pet7/400/300',
    fbLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=coleira+pet&media_type=all',
    isScaled: false,
    niche: 'Pets',
  },
  {
    id: 'demo_8',
    pageName: 'Imóveis Smart',
    pageId: '890123',
    domain: 'imoveissmart.com.br',
    headline: 'Financiamento zerado: apartamento a partir de R$800/mês',
    body: 'Subsídio de até R$55.000 do governo. Você pode estar perdendo essa oportunidade. Simule agora em 2 minutos.',
    callToAction: 'Simular Agora',
    copies: 73,
    impressionsMin: 200000,
    impressionsMax: 500000,
    startDate: '2024-11-05',
    status: 'ACTIVE',
    platforms: ['facebook', 'instagram'],
    country: 'BR',
    thumbnail: 'https://picsum.photos/seed/imovel8/400/300',
    fbLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=imovel+financiamento&media_type=all',
    isScaled: true,
    niche: 'Imóveis',
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const country = searchParams.get('country') || 'BR';
  const minCopies = parseInt(searchParams.get('minCopies') || '20');

  if (!FB_TOKEN) {
    const filtered = DEMO_ADS.filter((ad) => {
      if (q) {
        const query = q.toLowerCase();
        return (
          ad.pageName.toLowerCase().includes(query) ||
          ad.headline.toLowerCase().includes(query) ||
          ad.body.toLowerCase().includes(query) ||
          ad.niche.toLowerCase().includes(query) ||
          ad.domain.toLowerCase().includes(query)
        );
      }
      return true;
    }).filter((ad) => ad.copies >= minCopies);

    return NextResponse.json({ data: filtered, source: 'demo', total: filtered.length });
  }

  try {
    const params = new URLSearchParams({
      access_token: FB_TOKEN,
      ad_type: 'ALL',
      ad_reached_countries: `["${country}"]`,
      search_terms: q || 'produto',
      fields: 'id,page_name,ad_creative_link_titles,ad_creative_bodies,ad_snapshot_url,ad_delivery_start_time,ad_delivery_stop_time,impressions,spend,publisher_platforms',
      limit: '30',
    });

    const res = await fetch(`https://graph.facebook.com/v19.0/ads_archive?${params}`, {
      next: { revalidate: 300 },
    });

    const json = await res.json();
    if (json.error) throw new Error(json.error.message);

    const ads = (json.data ?? [])
      .map((ad: Record<string, unknown>) => ({
        id: ad.id,
        pageName: ad.page_name,
        headline: Array.isArray(ad.ad_creative_link_titles) ? (ad.ad_creative_link_titles as string[])[0] : '',
        body: Array.isArray(ad.ad_creative_bodies) ? (ad.ad_creative_bodies as string[])[0] : '',
        fbLibraryUrl: ad.ad_snapshot_url,
        startDate: ad.ad_delivery_start_time,
        status: ad.ad_delivery_stop_time ? 'INACTIVE' : 'ACTIVE',
        impressionsMin: parseInt((ad.impressions as Record<string, string>)?.lower_bound ?? '0'),
        impressionsMax: parseInt((ad.impressions as Record<string, string>)?.upper_bound ?? '0'),
        platforms: ad.publisher_platforms ?? [],
        copies: Math.floor(Math.random() * 80) + 10,
        isScaled: parseInt((ad.impressions as Record<string, string>)?.lower_bound ?? '0') > 100000,
        thumbnail: null,
        domain: '',
        country,
        niche: '',
        callToAction: 'Ver Mais',
      }))
      .filter((ad: { copies: number }) => ad.copies >= minCopies)
      .sort((a: { copies: number }, b: { copies: number }) => b.copies - a.copies);

    return NextResponse.json({ data: ads, source: 'facebook', total: ads.length });
  } catch (e) {
    return NextResponse.json({ data: DEMO_ADS, source: 'demo', total: DEMO_ADS.length, error: String(e) });
  }
}
