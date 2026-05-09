import axios from 'axios';
import { logger } from '../lib/logger';

export interface PlatformInfo {
  platform: string | null;
  detectedNiche: string | null;
  hasPixel: boolean;
  pixels: string[];
  technologies: string[];
  shopifyStore?: string;
  woocommerceShop?: string;
}

const PLATFORM_SIGNATURES: Record<string, RegExp[]> = {
  Shopify: [
    /cdn\.shopify\.com/i,
    /shopify\.com\/s\/files/i,
    /myshopify\.com/i,
    /"shopify"/i,
    /Shopify\.theme/i,
    /window\.Shopify/i,
  ],
  WooCommerce: [
    /woocommerce/i,
    /wp-content\/plugins\/woocommerce/i,
    /wc-ajax/i,
    /class="woocommerce/i,
  ],
  ClickFunnels: [
    /clickfunnels\.com/i,
    /cfcdn\.com/i,
    /clickfunnels/i,
  ],
  Webflow: [
    /webflow\.com/i,
    /assets-global\.website-files\.com/i,
    /\.webflow\.io/i,
  ],
  Magento: [
    /magento/i,
    /mage\/cookies/i,
    /Magento_/i,
  ],
  BigCommerce: [
    /bigcommerce\.com/i,
    /cdn\d?\.bigcommerce\.com/i,
  ],
  Squarespace: [
    /squarespace\.com/i,
    /static1\.squarespace\.com/i,
  ],
  WordPress: [
    /wp-content/i,
    /wp-includes/i,
    /wordpress/i,
  ],
};

const PIXEL_SIGNATURES: Record<string, RegExp[]> = {
  'Facebook Pixel': [/fbq\s*\(/i, /facebook\.com\/tr/i, /connect\.facebook\.net/i],
  'Google Analytics': [/gtag\s*\(/i, /google-analytics\.com\/analytics/i, /UA-\d{6,}/],
  'Google Tag Manager': [/googletagmanager\.com/i, /GTM-[A-Z0-9]+/],
  'TikTok Pixel': [/analytics\.tiktok\.com/i, /ttq\./i],
  'Snap Pixel': [/sc-static\.net/i, /snaptr\s*\(/i],
  'Pinterest Tag': [/ct\.pinterest\.com/i, /pintrk\s*\(/i],
  'Twitter/X Pixel': [/static\.ads-twitter\.com/i, /twq\s*\(/i],
  Klaviyo: [/static\.klaviyo\.com/i, /klaviyo\.identify/i],
  Hotjar: [/static\.hotjar\.com/i, /hjid:/i],
  'Segment.io': [/cdn\.segment\.com/i, /analytics\.identify/i],
};

const NICHE_KEYWORDS: Record<string, string[]> = {
  'Health & Beauty': ['skincare', 'beauty', 'wellness', 'supplement', 'vitamin', 'fitness', 'weight'],
  'Fashion': ['clothing', 'fashion', 'apparel', 'shoes', 'dress', 'outfit'],
  'Finance': ['crypto', 'investment', 'trading', 'bitcoin', 'forex', 'finance'],
  'Software/SaaS': ['software', 'saas', 'app', 'tool', 'platform', 'automation'],
  'Education': ['course', 'training', 'learn', 'academy', 'coaching', 'tutorial'],
  'E-commerce': ['shop', 'store', 'buy', 'order', 'cart', 'product'],
  'Gaming': ['game', 'gaming', 'play', 'esports', 'gamer'],
  'Travel': ['travel', 'hotel', 'flight', 'vacation', 'tour'],
  'Food & Beverage': ['food', 'recipe', 'restaurant', 'coffee', 'nutrition', 'diet'],
  'Real Estate': ['real estate', 'property', 'house', 'rent', 'mortgage'],
  'Pets': ['pet', 'dog', 'cat', 'animal', 'puppy', 'kitten'],
  'Sports & Fitness': ['sport', 'gym', 'workout', 'training', 'muscle', 'protein'],
};

const cache = new Map<string, { data: PlatformInfo; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function detectPlatform(domain: string): Promise<PlatformInfo> {
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const result: PlatformInfo = {
    platform: null,
    detectedNiche: null,
    hasPixel: false,
    pixels: [],
    technologies: [],
  };

  try {
    const url = `https://${domain}`;
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      },
      maxRedirects: 5,
      validateStatus: (s) => s < 500,
    });

    const html = response.data as string;
    const headers = response.headers;

    // Platform detection
    for (const [platform, patterns] of Object.entries(PLATFORM_SIGNATURES)) {
      if (patterns.some((p) => p.test(html))) {
        result.platform = platform;
        if (platform === 'Shopify') {
          const shopMatch = html.match(/"myshopify_domain":\s*"([^"]+)"/);
          result.shopifyStore = shopMatch?.[1];
        }
        break;
      }
    }

    // Powered-by header
    const poweredBy = headers['x-powered-by'] ?? headers['x-generator'] ?? '';
    if (poweredBy && !result.platform) {
      result.platform = poweredBy;
    }

    // Pixel detection
    for (const [pixel, patterns] of Object.entries(PIXEL_SIGNATURES)) {
      if (patterns.some((p) => p.test(html))) {
        result.pixels.push(pixel);
      }
    }
    result.hasPixel = result.pixels.length > 0;

    // Niche detection from HTML content + domain
    const textContent = (html.replace(/<[^>]+>/g, ' ') + ' ' + domain).toLowerCase();
    for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
      const matches = keywords.filter((k) => textContent.includes(k));
      if (matches.length >= 2) {
        result.detectedNiche = niche;
        break;
      }
    }
  } catch (err) {
    logger.debug(`[Platform Detector] Failed for ${domain}: ${(err as Error).message}`);
  }

  cache.set(domain, { data: result, ts: Date.now() });
  return result;
}
