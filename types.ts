
export interface NcmTax {
  name: string;
  rate: string;
  description?: string;
}

export interface NcmData {
  code: string;
  description: string;
  sector?: string;
  cest?: string; // Código Especificador da Substituição Tributária
  taxes: {
    ii: string;
    ipi: string;
    pis: string;
    cofins: string;
    icms_avg: string;
  };
  restrictions?: string[];
  relevance?: number;
  isObsolete?: boolean;
  replacementCode?: string;
  statusNote?: string;
}

export interface SearchHistory {
  query: string;
  timestamp: number;
}

export enum ViewMode {
  SEARCH = 'search',
  FAVORITES = 'favorites',
  HISTORY = 'history',
  DETAILS = 'details',
  TOOLS = 'tools'
}

export interface TaxCalculationResult {
  ii: number;
  ipi: number;
  pis: number;
  cofins: number;
  icms: number;
  difal: number;
  totalTaxes: number;
  finalValue: number;
}

export interface ProductClassificationInput {
  name: string;
  material: string;
  application: string;
}
