import { NextRequest, NextResponse } from "next/server";
import { finalizeXeroConnection } from "@/app/actions/xero";

export async function GET(request: NextRequest) {
    console.log("📣 Xero callback received", {
        url: request.url,
        time: new Date().toISOString(),
    });

    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        console.log("📣 Xero callback parameters:", {
            hasCode: !!code,
            hasState: !!state,
            error,
            errorDescription,
            allParams: Object.fromEntries(searchParams.entries()),
        });

        // Handle error from Xero
        if (error) {
            console.error("❌ Xero OAuth error:", error, errorDescription);
            const redirectUrl = new URL(`/integrations?error=${encodeURIComponent(errorDescription || error)}`, request.url);
            console.log("📣 Redirecting to error URL:", redirectUrl.toString());
            return NextResponse.redirect(redirectUrl);
        }

        // Validate required parameters
        if (!code || !state) {
            console.error("❌ Missing required OAuth parameters:", { code, state });
            const redirectUrl = new URL("/integrations?error=Missing required OAuth parameters", request.url);
            console.log("📣 Redirecting to error URL:", redirectUrl.toString());
            return NextResponse.redirect(redirectUrl);
        }

        console.log("📣 Processing Xero authorization with code and state");
        // Process the authorization
        const result = await finalizeXeroConnection(code, state);
        console.log("📣 Xero connection result:", result);

        if (result.success) {
            const redirectUrl = new URL(`/integrations?success=true&connections=${result.connectionCount}`, request.url);
            console.log("📣 Redirecting to success URL:", redirectUrl.toString());
            return NextResponse.redirect(redirectUrl);
        } else {
            const redirectUrl = new URL(`/integrations?error=${encodeURIComponent(result.error || "Connection failed")}`, request.url);
            console.log("📣 Redirecting to error URL:", redirectUrl.toString());
            return NextResponse.redirect(redirectUrl);
        }
    } catch (error) {
        console.error("❌ Error processing Xero callback:", error);
        const redirectUrl = new URL("/integrations?error=Internal server error", request.url);
        console.log("📣 Redirecting to error URL:", redirectUrl.toString());
        return NextResponse.redirect(redirectUrl);
    }
} 