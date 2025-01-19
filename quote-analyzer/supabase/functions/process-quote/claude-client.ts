import { QuoteAnalysisResult, QuoteStatus } from "./types.ts";
import { encode as base64Encode } from "https://deno.land/std@0.204.0/encoding/base64.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-3-5-sonnet-20241022";

export async function processQuote(
  pdfBuffer: Uint8Array
): Promise<QuoteAnalysisResult> {
  try {
    console.log("[processQuote] Starting quote processing");
    console.log(`[processQuote] PDF buffer size: ${pdfBuffer.length} bytes`);

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error(
        "[processQuote] ANTHROPIC_API_KEY not found in environment"
      );
      throw new Error("ANTHROPIC_API_KEY environment variable not set");
    }
    console.log("[processQuote] Successfully retrieved API key");

    // Check PDF size limit (32MB)
    if (pdfBuffer.length > 32 * 1024 * 1024) {
      console.error(
        `[processQuote] PDF size ${pdfBuffer.length} bytes exceeds 32MB limit`
      );
      throw new Error("PDF file size exceeds 32MB limit");
    }
    console.log("[processQuote] PDF size validation passed");

    console.log("[processQuote] Converting PDF to base64");
    const base64Data = base64Encode(pdfBuffer);
    console.log(
      `[processQuote] Base64 conversion complete. Length: ${base64Data.length}`
    );

    console.log("[processQuote] Preparing API request");
    const requestBody = {
      model: MODEL,
      max_tokens: 4000,
      temperature: 0.1,
      system:
        "You are an expert at analyzing quotes and invoices with deep knowledge of current market prices. Your tasks are:\n\n" +
        "1. Extract all line items exactly as they appear in the document\n" +
        "2. For each service/item, provide REAL market price estimates:\n" +
        "   - Research-based current market prices that may be different from quoted prices\n" +
        "   - Realistic price ranges based on market research\n" +
        "   - Calculate actual price differences between quoted and market prices\n" +
        "   - Show percentage differences when prices vary from market rates\n" +
        "3. For the overall analysis:\n" +
        "   - Calculate what the total cost would be at current market prices\n" +
        "   - Show the actual difference between quoted total and market-rate total\n" +
        "   - Provide realistic percentage comparisons\n\n" +
        "IMPORTANT: Do not just repeat the quoted prices. Provide genuine market-based price estimates that may be higher or lower than the quoted prices.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Data,
              },
              cache_control: {
                type: "ephemeral",
              },
            },
            {
              type: "text",
              text:
                "Extract the raw data and provide REAL market price analysis. The quoted prices may not match current market rates. Return only JSON in this format:\n\n" +
                "{\n" +
                '  "originalData": {\n' +
                '    "text": string,\n' +
                '    "parsed_tables": [{\n' +
                '      "columns": string[],\n' +
                '      "rows": [{\n' +
                '        "no": number,\n' +
                '        "report_no": string,\n' +
                '        "description": string,\n' +
                '        "quantity": number,\n' +
                '        "unit_price": number,\n' +
                '        "discount": number,\n' +
                '        "amount_excl_vat": number,\n' +
                '        "vat_percentage": number,\n' +
                '        "vat_amount": number,\n' +
                '        "total_incl_vat": number\n' +
                "      }],\n" +
                '      "totals": {\n' +
                '        "subtotal": number,\n' +
                '        "total_vat": number,\n' +
                '        "total_amount": number\n' +
                "      }\n" +
                "    }]\n" +
                "  },\n" +
                '  "metadata": {\n' +
                '    "invoice_number": string,\n' +
                '    "date": string,\n' +
                '    "vendor": string,\n' +
                '    "total_amount": number\n' +
                "  },\n" +
                '  "line_items": [{\n' +
                '    "no": number,\n' +
                '    "report_no": string,\n' +
                '    "description": string,\n' +
                '    "quantity": number,\n' +
                '    "unit_price": number,\n' +
                '    "total_price": number,\n' +
                '    "market_data": {\n' +
                '      "current_market_price": number,\n' +
                '      "price_range": {\n' +
                '        "lowest_market_price": number,\n' +
                '        "highest_market_price": number\n' +
                "      },\n" +
                '      "price_difference": number,\n' +
                '      "percentage_difference": number\n' +
                "    }\n" +
                "  }],\n" +
                '  "summary": {\n' +
                '    "subtotal": number,\n' +
                '    "tax": number,\n' +
                '    "total": number,\n' +
                '    "discounts": number,\n' +
                '    "market_comparison": {\n' +
                '      "total_at_market_price": number,\n' +
                '      "total_price_difference": number,\n' +
                '      "percentage_above_market": number\n' +
                "    }\n" +
                "  }\n" +
                '}"',
            },
          ],
        },
      ],
    };

    console.log("[processQuote] Sending request to Claude API");
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(
      `[processQuote] Received response with status: ${response.status}`
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[processQuote] API error response:", error);
      throw new Error(`Anthropic API error: ${JSON.stringify(error)}`);
    }

    console.log("[processQuote] Parsing API response");
    const result = await response.json();
    console.log(
      "[processQuote] API response:",
      JSON.stringify(result, null, 2)
    );

    const text = result.content[0].text;
    console.log("[processQuote] Extracted text from response");

    // Parse and validate the response
    console.log("[processQuote] Parsing JSON response");
    const parsedResult = JSON.parse(text) as QuoteAnalysisResult;

    // Basic validation
    console.log("[processQuote] Validating response structure");
    if (
      !parsedResult.metadata ||
      !parsedResult.line_items ||
      !parsedResult.summary ||
      !parsedResult.originalData
    ) {
      console.error("[processQuote] Invalid response structure:", parsedResult);
      throw new Error("Invalid response format from Claude");
    }

    console.log("[processQuote] Successfully processed quote");
    return parsedResult;
  } catch (error) {
    console.error("[processQuote] Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw new Error("Failed to analyze quote with AI");
  }
}
