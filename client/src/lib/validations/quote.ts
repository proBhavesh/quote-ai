import { z } from "zod";

// Base schemas for nested objects
const priceRangeSchema = z
  .object({
    lowest_market_price: z.number(),
    highest_market_price: z.number(),
  })
  .catchall(z.unknown());

const marketDataSchema = z
  .object({
    price_range: priceRangeSchema,
    price_difference: z.number(),
    current_market_price: z.number(),
    percentage_difference: z.number(),
    supplier_links: z
      .array(
        z.object({
          url: z.string().url(),
          name: z.string(),
          price: z.number(),
          availability: z.string(),
        })
      )
      .optional(),
  })
  .catchall(z.unknown());

const lineItemSchema = z
  .object({
    no: z.number(),
    quantity: z.number(),
    report_no: z.string(),
    unit_price: z.number(),
    description: z.string(),
    market_data: marketDataSchema.optional(),
    total_price: z.number(),
  })
  .catchall(z.unknown());

const marketComparisonSchema = z
  .object({
    total_at_market_price: z.number(),
    total_price_difference: z.number(),
    percentage_above_market: z.number(),
  })
  .catchall(z.unknown());

const quoteSummarySchema = z
  .object({
    tax: z.number(),
    total: z.number(),
    subtotal: z.number(),
    discounts: z.number(),
    market_comparison: marketComparisonSchema,
  })
  .catchall(z.unknown());

const quoteMetadataSchema = z
  .object({
    date: z.string(),
    vendor: z.string(),
    total_amount: z.number(),
    invoice_number: z.string().optional(),
  })
  .catchall(z.unknown());

// Main schemas
export const parsedTableRowSchema = z
  .object({
    no: z.number(),
    report_no: z.string(),
    description: z.string(),
    quantity: z.number(),
    unit_price: z.number(),
    discount: z.number(),
    amount_excl_vat: z.number(),
    vat_percentage: z.number(),
    vat_amount: z.number(),
    total_incl_vat: z.number(),
  })
  .catchall(z.unknown());

export const parsedTableTotalsSchema = z
  .object({
    subtotal: z.number(),
    total_vat: z.number(),
    total_amount: z.number(),
  })
  .catchall(z.unknown());

export const parsedTableSchema = z
  .object({
    rows: z.array(parsedTableRowSchema),
    totals: parsedTableTotalsSchema,
    columns: z.array(z.string()),
  })
  .catchall(z.unknown());

export const originalDataSchema = z
  .object({
    text: z.string(),
    currency: z.string(),
    parsed_tables: z.array(parsedTableSchema),
  })
  .catchall(z.unknown());

export const aiAnalysisResultsSchema = z
  .object({
    summary: quoteSummarySchema,
    metadata: quoteMetadataSchema,
    line_items: z.array(lineItemSchema),
  })
  .catchall(z.unknown());

// Type inference
export type ValidatedOriginalData = z.infer<typeof originalDataSchema>;
export type ValidatedAIAnalysisResults = z.infer<
  typeof aiAnalysisResultsSchema
>;
