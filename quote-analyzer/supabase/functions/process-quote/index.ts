import { serve } from "https://deno.land/std@0.204.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processQuote } from "./claude-client.ts";
import { Quote, QuoteStatus } from "./types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[process-quote] Starting quote processing request");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("[process-quote] Supabase URL:", supabaseUrl);
    console.log("[process-quote] Supabase Key:", supabaseKey);
    // Log credential verification (safely)
    console.log("[process-quote] Credential check:", {
      hasUrl: !!supabaseUrl,
      urlLength: supabaseUrl?.length ?? 0,
      hasKey: !!supabaseKey,
      keyLength: supabaseKey?.length ?? 0,
      keyPrefix: supabaseKey?.substring(0, 4) ?? "none",
    });

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create client with explicit auth config
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    });

    // Verify client setup
    console.log("[process-quote] Supabase client configuration:", {
      url: supabaseUrl,
      keyType: "service_role",
      hasAuth: !!supabaseClient.auth,
      hasHeaders: !!supabaseClient.rest.headers,
    });

    // Test connection
    try {
      const { data: testData, error: testError } = await supabaseClient
        .from("Quote")
        .select("id")
        .limit(1);

      if (testError) {
        console.error("[process-quote] Test query failed:", testError);
      } else {
        console.log("[process-quote] Test query successful");
      }
    } catch (testError) {
      console.error("[process-quote] Test query threw error:", testError);
    }

    console.log("[process-quote] Created Supabase client");

    const payload = await req.json();
    const { record } = payload;
    console.log(
      "[process-quote] Request payload:",
      JSON.stringify(payload, null, 2)
    );

    // Validate required fields from database schema
    if (!record?.id || !record?.fileUrl || !record?.title || !record?.userId) {
      console.error("[process-quote] Missing required fields:", { record });
      throw new Error("Invalid quote data: missing required fields");
    }
    console.log("[process-quote] Validated required fields");

    // Update status to processing
    const status: QuoteStatus = "PROCESSING";
    console.log(
      `[process-quote] Updating quote ${record.id} status to ${status}`
    );
    const processingUpdate = await supabaseClient
      .from("Quote")
      .update({ status })
      .eq("id", record.id);

    if (processingUpdate.error) {
      console.error(
        "[process-quote] Failed to update status to PROCESSING:",
        processingUpdate.error
      );
      throw new Error(
        `Failed to update status: ${processingUpdate.error.message}`
      );
    }
    console.log("[process-quote] Successfully updated status to PROCESSING");

    // Extract the file path from the full URL
    console.log("[process-quote] Original fileUrl:", record.fileUrl);
    const fileUrlParts = record.fileUrl.split("/quotes/");
    if (fileUrlParts.length !== 2) {
      console.error("[process-quote] Invalid file URL format:", record.fileUrl);
      throw new Error("Invalid file URL format");
    }
    const filePath = fileUrlParts[1];
    console.log("[process-quote] Extracted file path:", filePath);

    // Download PDF file from storage
    console.log("[process-quote] Downloading PDF from storage");
    const { data: pdfData, error: downloadError } = await supabaseClient.storage
      .from("quotes")
      .download(filePath);

    if (downloadError || !pdfData) {
      console.error("[process-quote] Failed to download PDF:", downloadError);
      throw new Error(
        `Failed to download PDF: ${downloadError?.message || "Unknown error"}`
      );
    }
    console.log("[process-quote] Successfully downloaded PDF");

    // Process with Claude
    console.log("[process-quote] Converting PDF to buffer");
    const pdfBuffer = new Uint8Array(await pdfData.arrayBuffer());
    console.log(`[process-quote] PDF buffer size: ${pdfBuffer.length} bytes`);

    console.log("[process-quote] Sending to Claude for analysis");
    const analysis = await processQuote(pdfBuffer);
    console.log(
      "[process-quote] Received analysis from Claude:",
      JSON.stringify(analysis, null, 2)
    );

    // Update quote with results
    const updateData: Partial<Quote> = {
      status: "COMPLETED" as QuoteStatus,
      originalData: {
        text: analysis.originalData.text,
        parsed_tables: analysis.originalData.parsed_tables,
      },
      results: {
        metadata: analysis.metadata,
        line_items: analysis.line_items,
        summary: analysis.summary,
      },
      updatedAt: new Date().toISOString(),
    };

    console.log(
      `[process-quote] Updating quote ${record.id} with results:`,
      JSON.stringify(updateData, null, 2)
    );
    const finalUpdate = await supabaseClient
      .from("Quote")
      .update(updateData)
      .eq("id", record.id);

    if (finalUpdate.error) {
      console.error(
        "[process-quote] Failed to update quote with results:",
        finalUpdate.error
      );
      throw new Error(`Failed to update quote: ${finalUpdate.error.message}`);
    }
    console.log("[process-quote] Successfully updated quote with results");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[process-quote] Error processing quote:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Update quote status to error if we have the record
    if (req.body && JSON.parse(req.body).record?.id) {
      try {
        console.log("[process-quote] Updating quote status to ERROR");
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const updateData: Partial<Quote> = {
          status: "ERROR" as QuoteStatus,
          results: { error: error.message },
          updatedAt: new Date().toISOString(),
        };

        const errorUpdate = await supabaseClient
          .from("Quote")
          .update(updateData)
          .eq("id", JSON.parse(req.body).record.id);

        if (errorUpdate.error) {
          console.error(
            "[process-quote] Failed to update status to ERROR:",
            errorUpdate.error
          );
        } else {
          console.log(
            "[process-quote] Successfully updated quote status to ERROR"
          );
        }
      } catch (updateError) {
        console.error(
          "[process-quote] Failed to update quote status to ERROR:",
          updateError
        );
      }
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
