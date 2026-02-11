
export interface NcmTax {
  name: string;
  rate: string;
  description?: string;
}

export interface NcmData {
  code: string;
  description: string;
  sector?: string;
  taxes: {
    ii: string;
    ipi: string;
    pis: string;
    cofins: string;
    icms_avg: string;
  };
  restrictions?: string[];
  relevance?: number;
}

export interface SearchHistory {
  query: string;
  timestamp: number;
}

export enum ViewMode {
  SEARCH = 'search',
  FAVORITES = 'favorites',
  HISTORY = 'history',
  DETAILS = 'details'
}
