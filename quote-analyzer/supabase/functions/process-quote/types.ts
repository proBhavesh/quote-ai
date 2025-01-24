// Database types matching Prisma schema
export type QuoteStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";

export interface Quote {
  id: string;
  userId: string;
  title: string;
  fileUrl: string;
  status: QuoteStatus;
  originalData?: {
    text: string;
    currency: string;
    parsed_tables: Array<{
      columns: string[];
      rows: Array<{
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
      }>;
      totals: {
        subtotal: number;
        total_vat: number;
        total_amount: number;
      };
    }>;
  };
  results?: QuoteAnalysisResult;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteAnalysisResult {
  originalData: {
    text: string;
    currency: string;
    parsed_tables: Array<{
      columns: string[];
      rows: Array<{
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
      }>;
      totals: {
        subtotal: number;
        total_vat: number;
        total_amount: number;
      };
    }>;
  };
  metadata: {
    invoice_number: string;
    date: string;
    vendor: string;
    total_amount: number;
  };
  line_items: Array<{
    no: number;
    report_no: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    market_data: {
      current_market_price: number;
      price_range: {
        lowest_market_price: number;
        highest_market_price: number;
      };
      price_difference: number;
      percentage_difference: number;
    };
  }>;
  summary: {
    subtotal: number;
    tax: number;
    total: number;
    discounts?: number;
    market_comparison: {
      total_at_market_price: number;
      total_price_difference: number;
      percentage_above_market: number;
    };
  };
  error?: string; // Optional error message field
}
