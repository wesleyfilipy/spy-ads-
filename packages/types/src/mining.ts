export type MiningStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';
export type MiningJobType =
  | 'FULL_CRAWL'
  | 'INCREMENTAL'
  | 'COUNTRY_TARGETED'
  | 'KEYWORD_TARGETED'
  | 'EXTENSION_SUBMIT';

export interface MiningJob {
  id: string;
  type: MiningJobType;
  status: MiningStatus;
  progress: number;
  totalAds: number;
  processedAds: number;
  newAds: number;
  updatedAds: number;
  errors: number;
  metadata?: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtensionAdPayload {
  facebookAdId: string;
  pageName?: string;
  pageId?: string;
  pageUrl?: string;
  domain?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'UNKNOWN';
  platforms: string[];
  countries: string[];
  languages: string[];
  startDate?: string;
  endDate?: string;
  creatives: ExtensionCreativePayload[];
  rawData?: Record<string, unknown>;
}

export interface ExtensionCreativePayload {
  type: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'TEXT';
  mediaUrl?: string;
  thumbnailUrl?: string;
  headline?: string;
  body?: string;
  description?: string;
  callToAction?: string;
  linkUrl?: string;
  displayUrl?: string;
}

export interface MiningStats {
  totalAds: number;
  activeAds: number;
  scaledAds: number;
  duplicateGroups: number;
  todayNewAds: number;
  lastMiningAt?: Date;
}
