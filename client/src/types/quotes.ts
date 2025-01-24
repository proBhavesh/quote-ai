export interface ParsedTableRow {
  no: number;
  report_no: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  amount_excl_vat: number;
  vat_percentage: number;
  vat_amount: number;
  total_incl_vat: number;
  [key: string]: unknown;
}

export interface ParsedTableTotals {
  subtotal: number;
  total_vat: number;
  total_amount: number;
  [key: string]: unknown;
}

export interface ParsedTable {
  rows: ParsedTableRow[];
  totals: ParsedTableTotals;
  columns: string[];
  [key: string]: unknown;
}

export interface OriginalData {
  text: string;
  currency: string;
  parsed_tables: ParsedTable[];
  [key: string]: unknown;
}

export interface MarketData {
  price_range: {
    lowest_market_price: number;
    highest_market_price: number;
    [key: string]: unknown;
  };
  price_difference: number;
  current_market_price: number;
  percentage_difference: number;
  [key: string]: unknown;
}

export interface LineItem {
  no: number;
  quantity: number;
  report_no: string;
  unit_price: number;
  description: string;
  market_data: MarketData;
  total_price: number;
  [key: string]: unknown;
}

export interface MarketComparison {
  total_at_market_price: number;
  total_price_difference: number;
  percentage_above_market: number;
  [key: string]: unknown;
}

export interface QuoteSummary {
  tax: number;
  total: number;
  subtotal: number;
  discounts: number;
  market_comparison: MarketComparison;
  [key: string]: unknown;
}

export interface QuoteMetadata {
  date: string;
  vendor: string;
  total_amount: number;
  invoice_number: string;
  [key: string]: unknown;
}

export interface AIAnalysisResults {
  summary: QuoteSummary;
  metadata: QuoteMetadata;
  line_items: LineItem[];
  [key: string]: unknown;
}
