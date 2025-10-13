import type { ScrapingConfig } from './scraper';

// Minimal stub: website scraping config management for admin UI.
// Real implementation should live in `scraping-config.local.ts` (gitignored).

export interface WebsiteConfig {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  lastRunAt?: string;
}

// Empty/defaults for production. Admin pages that import this should handle empty lists.
export const WEBSITE_CONFIGS: WebsiteConfig[] = [];

export function getEnabledWebsites(): WebsiteConfig[] {
  return WEBSITE_CONFIGS.filter(w => w.enabled);
}

export function getWebsitesNeedingUpdate(): WebsiteConfig[] {
  return [];
}

export function updateWebsiteLastRun(_id: string): void {
  // no-op in production
}

// Optional: provide a tiny placeholder mapping to satisfy any imports
export const scrapingConfigs: Record<string, (baseUrl: string) => ScrapingConfig> = {
  generic: (baseUrl: string): ScrapingConfig => ({ url: baseUrl, selectors: {} }),
};
