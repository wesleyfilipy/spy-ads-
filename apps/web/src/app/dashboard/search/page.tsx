'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, TrendingUp, Copy, Eye, Heart, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { APP_CONFIG } from '@adspy/config';

interface AdResult {
  id: string;
  pageName: string;
  domain: string;
  status: string;
  isScaled: boolean;
  isDuplicate: boolean;
  country: string;
  niche: string;
  cta: string;
  headline: string;
  creatives: Array<{ type: string; thumbnailUrl: string; callToAction: string }>;
}

const DEMO_ADS: AdResult[] = [
  { id: '1',  pageName: 'NovaSkin Beauty',      domain: 'novaskin.com',       status: 'ACTIVE',   isScaled: true,  isDuplicate: false, country: 'US', niche: 'Beauty',      cta: 'Shop Now',    headline: 'Glow Like Never Before',         creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad1/400/300',  callToAction: 'Shop Now'    }] },
  { id: '2',  pageName: 'FitPro Supplements',   domain: 'fitpro.io',          status: 'ACTIVE',   isScaled: true,  isDuplicate: false, country: 'US', niche: 'Health',      cta: 'Buy Now',     headline: 'Fuel Your Workout',              creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad2/400/300',  callToAction: 'Buy Now'     }] },
  { id: '3',  pageName: 'LuxWatch Store',        domain: 'luxwatch.co',        status: 'ACTIVE',   isScaled: false, isDuplicate: false, country: 'GB', niche: 'Fashion',     cta: 'Shop Now',    headline: 'Elegance on Your Wrist',         creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad3/400/300',  callToAction: 'Shop Now'    }] },
  { id: '4',  pageName: 'TechGadgets Hub',       domain: 'techgadgets.shop',   status: 'INACTIVE', isScaled: false, isDuplicate: true,  country: 'US', niche: 'Technology',  cta: 'Learn More',  headline: 'Future Tech Today',              creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad4/400/300',  callToAction: 'Learn More'  }] },
  { id: '5',  pageName: 'PetCare Plus',          domain: 'petcareplus.com',    status: 'ACTIVE',   isScaled: false, isDuplicate: false, country: 'CA', niche: 'Pets',        cta: 'Get Offer',   headline: 'Your Pet Deserves the Best',     creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad5/400/300',  callToAction: 'Get Offer'   }] },
  { id: '6',  pageName: 'HomeDecor Pro',         domain: 'homedecorpro.net',   status: 'ACTIVE',   isScaled: true,  isDuplicate: false, country: 'US', niche: 'Home',        cta: 'Shop Now',    headline: 'Transform Your Living Space',    creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad6/400/300',  callToAction: 'Shop Now'    }] },
  { id: '7',  pageName: 'SportX Gear',           domain: 'sportxgear.com',     status: 'ACTIVE',   isScaled: false, isDuplicate: false, country: 'AU', niche: 'Sports',      cta: 'Buy Now',     headline: 'Gear Up for Victory',            creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad7/400/300',  callToAction: 'Buy Now'     }] },
  { id: '8',  pageName: 'EcoLife Brands',        domain: 'ecolife.store',      status: 'INACTIVE', isScaled: false, isDuplicate: true,  country: 'DE', niche: 'Eco',         cta: 'Learn More',  headline: 'Live Sustainably',               creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad8/400/300',  callToAction: 'Learn More'  }] },
  { id: '9',  pageName: 'DentaWhite Pro',        domain: 'dentawhite.com',     status: 'ACTIVE',   isScaled: true,  isDuplicate: false, country: 'US', niche: 'Health',      cta: 'Try Free',    headline: 'Whiter Teeth in 7 Days',         creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad9/400/300',  callToAction: 'Try Free'    }] },
  { id: '10', pageName: 'KidsToys World',        domain: 'kidstoys.world',     status: 'ACTIVE',   isScaled: false, isDuplicate: false, country: 'BR', niche: 'Kids',        cta: 'Shop Now',    headline: 'Fun for Every Child',            creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad10/400/300', callToAction: 'Shop Now'    }] },
  { id: '11', pageName: 'CryptoEdge Academy',    domain: 'cryptoedge.io',      status: 'ACTIVE',   isScaled: true,  isDuplicate: false, country: 'US', niche: 'Finance',     cta: 'Enroll Now',  headline: 'Master Crypto in 30 Days',       creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad11/400/300', callToAction: 'Enroll Now'  }] },
  { id: '12', pageName: 'GlowUp Cosmetics',      domain: 'glowup.beauty',      status: 'ACTIVE',   isScaled: false, isDuplicate: false, country: 'FR', niche: 'Beauty',      cta: 'Buy Now',     headline: 'Makeup That Lasts All Day',      creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad12/400/300', callToAction: 'Buy Now'     }] },
  { id: '13', pageName: 'DropShip Mastery',      domain: 'dropshipmaster.co',  status: 'ACTIVE',   isScaled: true,  isDuplicate: false, country: 'US', niche: 'Education',   cta: 'Start Now',   headline: '$10k/Month from Home',           creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad13/400/300', callToAction: 'Start Now'   }] },
  { id: '14', pageName: 'VitaBoost Health',      domain: 'vitaboost.health',   status: 'INACTIVE', isScaled: false, isDuplicate: true,  country: 'US', niche: 'Health',      cta: 'Get 50% Off', headline: 'Feel 10 Years Younger',          creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad14/400/300', callToAction: 'Get 50% Off' }] },
  { id: '15', pageName: 'NightOwl Coffee',       domain: 'nightowlcoffee.com', status: 'ACTIVE',   isScaled: false, isDuplicate: false, country: 'CA', niche: 'Food',        cta: 'Order Now',   headline: 'The Perfect Morning Brew',       creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad15/400/300', callToAction: 'Order Now'   }] },
  { id: '16', pageName: 'SlimFit App',           domain: 'slimfit.app',        status: 'ACTIVE',   isScaled: true,  isDuplicate: false, country: 'US', niche: 'Fitness',     cta: 'Download',    headline: 'Lose Weight Without Starving',   creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad16/400/300', callToAction: 'Download'    }] },
  { id: '17', pageName: 'ArtPrint Studio',       domain: 'artprintstudio.com', status: 'ACTIVE',   isScaled: false, isDuplicate: false, country: 'GB', niche: 'Art',         cta: 'Shop Now',    headline: 'Unique Art for Your Walls',      creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad17/400/300', callToAction: 'Shop Now'    }] },
  { id: '18', pageName: 'AutoDetailing Pro',     domain: 'autodetailing.pro',  status: 'ACTIVE',   isScaled: false, isDuplicate: false, country: 'US', niche: 'Automotive',  cta: 'Book Now',    headline: 'Your Car Deserves the Best',     creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad18/400/300', callToAction: 'Book Now'    }] },
  { id: '19', pageName: 'TravelHack Club',       domain: 'travelhack.club',    status: 'ACTIVE',   isScaled: true,  isDuplicate: false, country: 'US', niche: 'Travel',      cta: 'Join Free',   headline: 'Fly Business for Economy Price', creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad19/400/300', callToAction: 'Join Free'   }] },
  { id: '20', pageName: 'SleepWell Pillow',      domain: 'sleepwell.shop',     status: 'ACTIVE',   isScaled: true,  isDuplicate: false, country: 'US', niche: 'Home',        cta: 'Buy Now',     headline: 'Sleep Like a Baby Tonight',      creatives: [{ type: 'IMAGE', thumbnailUrl: 'https://picsum.photos/seed/ad20/400/300', callToAction: 'Buy Now'     }] },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState({
    status: '',
    countries: '',
    isScaled: '',
    sortBy: 'createdAt',
  });

  const results = useMemo(() => {
    if (!submitted && !filters.status && !filters.countries && !filters.isScaled) {
      return DEMO_ADS;
    }
    return DEMO_ADS.filter((ad) => {
      const q = query.toLowerCase();
      const matchQuery = !query || ad.pageName.toLowerCase().includes(q) || ad.domain.toLowerCase().includes(q) || ad.headline.toLowerCase().includes(q) || ad.niche.toLowerCase().includes(q);
      const matchStatus = !filters.status || ad.status === filters.status;
      const matchCountry = !filters.countries || ad.country === filters.countries;
      const matchScaled = !filters.isScaled || (filters.isScaled === 'true' ? ad.isScaled : !ad.isScaled);
      return matchQuery && matchStatus && matchCountry && matchScaled;
    });
  }, [query, filters, submitted]);

  function handleSearch() {
    setSubmitted(true);
  }

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Search Ads</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search <span className="text-foreground font-semibold">18,420</span> ads with advanced filters
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
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by keyword, brand, domain, copy..."
            className="w-full bg-secondary border border-border rounded-xl pl-11 pr-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
        <button
          onClick={handleSearch}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold transition-all"
        >
          Search
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all ${
            showFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Status</label>
                <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Country</label>
                <select value={filters.countries} onChange={(e) => setFilters((f) => ({ ...f, countries: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="">All Countries</option>
                  {APP_CONFIG.supportedCountries.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Scaled</label>
                <select value={filters.isScaled} onChange={(e) => setFilters((f) => ({ ...f, isScaled: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="">All</option>
                  <option value="true">Scaled Only</option>
                  <option value="false">Not Scaled</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Sort By</label>
                <select value={filters.sortBy} onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                  <option value="createdAt">Date Added</option>
                  <option value="impressions">Impressions</option>
                  <option value="spend">Ad Spend</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4 gap-3">
              <button onClick={() => { setFilters({ status: '', countries: '', isScaled: '', sortBy: 'createdAt' }); setSubmitted(false); }} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X className="w-3 h-3" /> Clear filters
              </button>
              <button onClick={handleSearch} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold">
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <p className="text-muted-foreground text-sm mb-4">
        Showing <span className="text-foreground font-semibold">{results.length}</span> ads
        {query && <> for &quot;<span className="text-primary">{query}</span>&quot;</>}
      </p>

      {/* Results grid */}
      {results.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-lg">No results found</p>
          <p className="text-sm mt-1">Try different keywords or adjust your filters</p>
        </div>
      ) : (
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
                <div className="aspect-video bg-secondary relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ad.creatives[0].thumbnailUrl}
                    alt="Ad creative"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute top-2 left-2 flex gap-1">
                    {ad.isScaled && (
                      <span className="bg-amber-500/80 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Scaled
                      </span>
                    )}
                    {ad.isDuplicate && (
                      <span className="bg-rose-500/80 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Copy className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                    ad.status === 'ACTIVE' ? 'bg-emerald-500/80 text-white' : 'bg-black/60 text-white'
                  }`}>
                    {ad.status}
                  </div>

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Link href={`/dashboard/ads/${ad.id}`} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      <Eye className="w-4 h-4 text-white" />
                    </Link>
                    <button onClick={() => toggleFavorite(ad.id)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      <Heart className={`w-4 h-4 ${favorites.has(ad.id) ? 'text-rose-400 fill-rose-400' : 'text-white'}`} />
                    </button>
                    <a href={ad.creatives[0].thumbnailUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      <Download className="w-4 h-4 text-white" />
                    </a>
                  </div>
                </div>

                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{ad.pageName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted-foreground text-xs truncate flex-1">{ad.domain}</span>
                    <a href={`https://${ad.domain}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {ad.creatives[0].callToAction}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
