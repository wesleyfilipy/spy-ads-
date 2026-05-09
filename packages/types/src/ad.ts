export type AdStatus = 'ACTIVE' | 'INACTIVE' | 'UNKNOWN';
export type AdType = 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'TEXT';
export type AdPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'AUDIENCE_NETWORK' | 'MESSENGER';

export interface AdCreative {
  id: string;
  adId: string;
  type: AdType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  headline?: string;
  body?: string;
  description?: string;
  callToAction?: string;
  linkUrl?: string;
  displayUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ad {
  id: string;
  facebookAdId: string;
  pageId?: string;
  pageName?: string;
  pageUrl?: string;
  domain?: string;
  status: AdStatus;
  platforms: AdPlatform[];
  countries: string[];
  languages: string[];
  niche?: string;
  startDate?: Date;
  endDate?: Date;
  impressionsLower?: number;
  impressionsUpper?: number;
  spendLower?: number;
  spendUpper?: number;
  currency?: string;
  isScaled: boolean;
  isDuplicate: boolean;
  duplicateGroupId?: string;
  duplicateScore?: number;
  pHashValue?: string;
  creatives: AdCreative[];
  rawData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdSearchFilters {
  query?: string;
  countries?: string[];
  languages?: string[];
  domains?: string[];
  niches?: string[];
  callToActions?: string[];
  status?: AdStatus;
  type?: AdType;
  isScaled?: boolean;
  isDuplicate?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'startDate' | 'impressionsLower' | 'spendLower';
  sortOrder?: 'asc' | 'desc';
}

export interface AdSearchResult {
  ads: Ad[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ScaledAdGroup {
  groupId: string;
  ads: Ad[];
  dominantDomain?: string;
  totalAds: number;
  activeAds: number;
  firstSeen: Date;
  lastSeen: Date;
  averageDuplicateScore: number;
}
