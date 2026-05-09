export const APP_CONFIG = {
  name: 'AdSpy Platform',
  description: 'Mine, track, and analyze Facebook Ads at scale',
  version: '1.0.0',

  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  mining: {
    intervalMs: 5 * 60 * 1000,
    batchSize: 50,
    concurrency: 5,
    retryAttempts: 3,
    retryDelayMs: 2000,
  },

  deduplication: {
    similarityThreshold: 85,
    scalingThreshold: 75,
    exactMatchThreshold: 95,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    skipSuccessfulRequests: false,
  },

  jwt: {
    expiresIn: '15m',
    refreshExpiresIn: '7d',
  },

  plans: {
    FREE: { price: 0, label: 'Free' },
    BASIC: { price: 29, label: 'Basic' },
    PRO: { price: 79, label: 'Pro' },
    ENTERPRISE: { price: 199, label: 'Enterprise' },
  },

  supportedCountries: [
    { code: 'US', name: 'United States' },
    { code: 'BR', name: 'Brazil' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'MX', name: 'Mexico' },
    { code: 'IN', name: 'India' },
    { code: 'ALL', name: 'All Countries' },
  ],

  supportedLanguages: [
    { code: 'en', name: 'English' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
  ],

  niches: [
    'E-commerce',
    'Health & Beauty',
    'Finance',
    'Software/SaaS',
    'Education',
    'Travel',
    'Gaming',
    'Fashion',
    'Food & Beverage',
    'Real Estate',
    'Automotive',
    'Sports & Fitness',
    'Entertainment',
    'B2B',
    'Non-profit',
  ],

  callToActions: [
    'Shop Now',
    'Learn More',
    'Sign Up',
    'Get Offer',
    'Download',
    'Watch More',
    'Book Now',
    'Contact Us',
    'Apply Now',
    'Get Quote',
    'Subscribe',
    'Order Now',
  ],
} as const;
