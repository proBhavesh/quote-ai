import { QuoteAnalysisResult } from "./types.ts";
import { encode as base64Encode } from "https://deno.land/std@0.204.0/encoding/base64.ts";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4-vision-preview";
const MAX_TOKENS = 4000;

export async function processQuoteWithOpenAI(
  pdfBuffer: Uint8Array
): Promise<QuoteAnalysisResult> {
  try {
    console.log("[processQuoteOpenAI] Starting quote processing");
    console.log(
      `[processQuoteOpenAI] PDF buffer size: ${pdfBuffer.length} bytes`
    );

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error(
        "[processQuoteOpenAI] OPENAI_API_KEY not found in environment"
      );
      throw new Error("OPENAI_API_KEY environment variable not set");
    }
    console.log("[processQuoteOpenAI] Successfully retrieved API key");

    // Check PDF size limit (20MB for OpenAI)
    if (pdfBuffer.length > 20 * 1024 * 1024) {
      console.error(
        `[processQuoteOpenAI] PDF size ${pdfBuffer.length} bytes exceeds 20MB limit`
      );
      throw new Error("PDF file size exceeds 20MB limit");
    }
    console.log("[processQuoteOpenAI] PDF size validation passed");

    console.log("[processQuoteOpenAI] Converting PDF to base64");
    const base64Data = base64Encode(pdfBuffer);
    console.log(
      `[processQuoteOpenAI] Base64 conversion complete. Length: ${base64Data.length}`
    );

    console.log("[processQuoteOpenAI] Preparing API request");
    const requestBody = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are an expert at analyzing quotes and invoices with deep knowledge of current market prices. Extract data and provide market analysis from the provided document.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Extract the raw data and provide REAL market price analysis. The quoted prices may not match current market rates. Follow these tasks:\n\n" +
                "1. Extract all line items exactly as they appear\n" +
                "2. Identify the currency used (use ISO 4217 code)\n" +
                "3. For each item, provide real market price estimates in the same currency\n" +
                "4. Calculate price differences and market comparisons\n" +
                "Return the analysis in the specified JSON format.",
            },
            {
              type: "image",
              image_url: {
                url: `data:application/pdf;base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    };

    console.log("[processQuoteOpenAI] Sending request to OpenAI API");
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(
      `[processQuoteOpenAI] Received response with status: ${response.status}`
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[processQuoteOpenAI] API error response:", error);
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    console.log("[processQuoteOpenAI] Parsing API response");
    const result = await response.json();
    console.log(
      "[processQuoteOpenAI] API response:",
      JSON.stringify(result, null, 2)
    );

    // Extract the content from the response
    const content = result.choices[0].message.content;
    console.log("[processQuoteOpenAI] Extracted content from response");

    // Parse and validate the response
    console.log("[processQuoteOpenAI] Parsing JSON response");
    const parsedResult = JSON.parse(content) as QuoteAnalysisResult;

    // Basic validation
    console.log("[processQuoteOpenAI] Validating response structure");
    if (
      !parsedResult.metadata ||
      !parsedResult.line_items ||
      !parsedResult.summary ||
      !parsedResult.originalData
    ) {
      console.error(
        "[processQuoteOpenAI] Invalid response structure:",
        parsedResult
      );
      throw new Error("Invalid response format from OpenAI");
    }

    console.log("[processQuoteOpenAI] Successfully processed quote");
    return parsedResult;
  } catch (error) {
    console.error("[processQuoteOpenAI] Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw new Error("Failed to analyze quote with OpenAI");
  }
}
