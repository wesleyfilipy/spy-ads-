export interface MiningJobData {
  type: 'FULL_CRAWL' | 'INCREMENTAL' | 'COUNTRY_TARGETED' | 'KEYWORD_TARGETED';
  country?: string;
  keyword?: string;
  limit?: number;
}

export interface VideoProcessingJobData {
  creativeId: string;
  mediaUrl: string;
}

export interface ThumbnailJobData {
  creativeId: string;
  videoUrl: string;
}

export interface DeduplicationJobData {
  adId: string;
  pHashValue: string;
}
