export type SubscriptionPlan = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'INCOMPLETE';

export interface PlanFeatures {
  dailySearches: number;
  savedAds: number;
  exportCsv: boolean;
  bulkDownload: boolean;
  apiAccess: boolean;
  advancedFilters: boolean;
  adAlerts: boolean;
  prioritySupport: boolean;
}

export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  FREE: {
    dailySearches: 10,
    savedAds: 20,
    exportCsv: false,
    bulkDownload: false,
    apiAccess: false,
    advancedFilters: false,
    adAlerts: false,
    prioritySupport: false,
  },
  BASIC: {
    dailySearches: 100,
    savedAds: 500,
    exportCsv: true,
    bulkDownload: false,
    apiAccess: false,
    advancedFilters: true,
    adAlerts: false,
    prioritySupport: false,
  },
  PRO: {
    dailySearches: 1000,
    savedAds: 5000,
    exportCsv: true,
    bulkDownload: true,
    apiAccess: false,
    advancedFilters: true,
    adAlerts: true,
    prioritySupport: true,
  },
  ENTERPRISE: {
    dailySearches: -1,
    savedAds: -1,
    exportCsv: true,
    bulkDownload: true,
    apiAccess: true,
    advancedFilters: true,
    adAlerts: true,
    prioritySupport: true,
  },
};

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}
