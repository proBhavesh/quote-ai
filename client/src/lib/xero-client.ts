import {
    XeroDocument,
    XeroDocumentType,
    XeroTokenResponse,
    XeroTenant,
    XeroApiResponse,
    XeroQuotesResponse,
    XeroInvoicesResponse,
    XeroReceiptsResponse,
    XeroQuoteResponse,
    XeroInvoiceResponse,
    XeroReceiptResponse,
} from "./types/xero";
import { env } from "@/env";
import { prisma } from "./prisma";

/**
 * Xero API client for interacting with Xero accounting software
 */
export class XeroClient {
    private baseUrl = "https://api.xero.com";
    private identityUrl = "https://identity.xero.com";
    private loginUrl = "https://login.xero.com";
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;
    private scopes: string[];

    constructor() {
        // Handle potentially undefined environment variables with defaults or error handling
        if (!env.XERO_CLIENT_ID) {
            throw new Error("XERO_CLIENT_ID is not defined in environment variables");
        }
        if (!env.XERO_CLIENT_SECRET) {
            throw new Error("XERO_CLIENT_SECRET is not defined in environment variables");
        }
        if (!env.XERO_REDIRECT_URI) {
            throw new Error("XERO_REDIRECT_URI is not defined in environment variables");
        }

        this.clientId = env.XERO_CLIENT_ID;
        this.clientSecret = env.XERO_CLIENT_SECRET;
        this.redirectUri = env.XERO_REDIRECT_URI;
        // Update scopes to match Xero's documentation exactly
        this.scopes = [
            "offline_access",
            "openid",
            "profile",
            "email",
            "accounting.transactions",
            "accounting.contacts",
            "accounting.settings"
        ];
    }

    /**
     * Get the authorization URL for OAuth flow
     */
    getAuthorizationUrl(state: string): string {
        const scopesEncoded = encodeURIComponent(this.scopes.join(" "));
        const stateEncoded = encodeURIComponent(state);

        // Use login.xero.com instead of identity.xero.com as per documentation
        return `${this.loginUrl}/identity/connect/authorize?` +
            `response_type=code&` +
            `client_id=${this.clientId}&` +
            `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
            `scope=${scopesEncoded}&` +
            `state=${stateEncoded}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async getAccessToken(authorizationCode: string): Promise<XeroTokenResponse> {
        try {
            console.log("Exchanging code for token...");

            // Create the authorization header with Base64 encoded clientId:clientSecret
            const authHeader = `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`;
            console.log("Authorization header created");

            const tokenUrl = `${this.identityUrl}/connect/token`;
            console.log("Token URL:", tokenUrl);

            const formData = new URLSearchParams({
                grant_type: "authorization_code",
                code: authorizationCode,
                redirect_uri: this.redirectUri,
            });

            console.log("Request body prepared:", formData.toString());

            const response = await fetch(tokenUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": authHeader,
                },
                body: formData.toString(),
            });

            const responseBody = await response.text();
            console.log("Response status:", response.status);

            if (!response.ok) {
                console.error("Token exchange failed:", response.status, responseBody);
                throw new Error(`Failed to get access token: ${response.status} ${responseBody}`);
            }

            const data = JSON.parse(responseBody);
            console.log("Token exchange successful");
            return data as XeroTokenResponse;
        } catch (error) {
            console.error("Token exchange error:", error);
            throw error;
        }
    }

    /**
     * Refresh the access token
     */
    async refreshAccessToken(refreshToken: string): Promise<XeroTokenResponse> {
        try {
            console.log("Refreshing token...");

            const response = await fetch(`${this.identityUrl}/connect/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
                },
                body: new URLSearchParams({
                    grant_type: "refresh_token",
                    refresh_token: refreshToken,
                }).toString(),
            });

            if (!response.ok) {
                const error = await response.text();
                console.error("Token refresh failed:", response.status, error);
                throw new Error(`Failed to refresh token: ${error}`);
            }

            const data = await response.json();
            console.log("Token refresh successful");
            return data as XeroTokenResponse;
        } catch (error) {
            console.error("Token refresh error:", error);
            throw error;
        }
    }

    /**
     * Get connected tenants (Xero organizations)
     */
    async getTenants(accessToken: string): Promise<XeroTenant[]> {
        try {
            console.log("Getting connected tenants...");

            const response = await fetch(`${this.baseUrl}/connections`, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const error = await response.text();
                console.error("Failed to get tenants:", response.status, error);
                throw new Error(`Failed to get tenants: ${response.status} ${error}`);
            }

            const data = await response.json();
            console.log("Got tenants:", data.length);
            return data as XeroTenant[];
        } catch (error) {
            console.error("Error getting tenants:", error);
            throw error;
        }
    }

    /**
     * Get documents from Xero based on type
     */
    async getDocuments(
        connectionId: string,
        documentType: XeroDocumentType,
        page: number = 1,
        pageSize: number = 20
    ): Promise<XeroDocument[]> {
        try {
            console.log(`Getting ${documentType} documents for connection ${connectionId}...`);

            const connection = await prisma.xeroConnection.findUnique({
                where: { id: connectionId },
            });

            if (!connection) {
                throw new Error("Xero connection not found");
            }

            // Check if token is expired
            if (new Date(connection.expiresAt) < new Date()) {
                console.log("Access token expired, refreshing...");
                // Refresh token and update in database
                const tokenResponse = await this.refreshAccessToken(connection.refreshToken);

                await prisma.xeroConnection.update({
                    where: { id: connectionId },
                    data: {
                        accessToken: tokenResponse.access_token,
                        refreshToken: tokenResponse.refresh_token,
                        expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
                    },
                });

                console.log("Token refreshed and updated in database");
            }

            // Endpoint varies by document type
            let endpoint = "";
            if (documentType === "QUOTE") {
                endpoint = `/api.xro/2.0/Quotes`;
            } else if (documentType === "INVOICE") {
                endpoint = `/api.xro/2.0/Invoices`;
            } else if (documentType === "RECEIPT") {
                endpoint = `/api.xro/2.0/Receipts`;
            } else if (documentType === "PURCHASE_ORDER") {
                endpoint = `/api.xro/2.0/PurchaseOrders`;
            }

            console.log(`Making API call to ${endpoint}`);

            // Make API call to Xero with proper headers
            const response = await fetch(`${this.baseUrl}${endpoint}?page=${page}&pageSize=${pageSize}`, {
                headers: {
                    "Authorization": `Bearer ${connection.accessToken}`,
                    "Content-Type": "application/json",
                    "Xero-Tenant-Id": connection.tenantId,
                    "Accept": "application/json",
                },
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`Failed to get ${documentType}s:`, response.status, error);
                throw new Error(`Failed to get ${documentType}s: ${response.status} ${error}`);
            }

            const data = await response.json();
            console.log(`Successfully retrieved ${documentType} documents`);
            return this.mapXeroResponse(data, documentType);
        } catch (error) {
            console.error(`Error getting ${documentType} documents:`, error);
            throw error;
        }
    }

    /**
     * Download a document as PDF from Xero
     */
    async downloadDocument(
        connectionId: string,
        documentType: XeroDocumentType,
        documentId: string
    ): Promise<Buffer> {
        try {
            console.log(`Downloading ${documentType} document ${documentId}...`);

            const connection = await prisma.xeroConnection.findUnique({
                where: { id: connectionId },
            });

            if (!connection) {
                throw new Error("Xero connection not found");
            }

            // Check if token is expired
            if (new Date(connection.expiresAt) < new Date()) {
                console.log("Access token expired, refreshing...");
                // Refresh token and update in database
                const tokenResponse = await this.refreshAccessToken(connection.refreshToken);

                await prisma.xeroConnection.update({
                    where: { id: connectionId },
                    data: {
                        accessToken: tokenResponse.access_token,
                        refreshToken: tokenResponse.refresh_token,
                        expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
                    },
                });

                console.log("Token refreshed and updated in database");
            }

            // Endpoint varies by document type - NOTE: Removed /pdf suffix as it's not needed
            let endpoint = "";
            if (documentType === "QUOTE") {
                endpoint = `/api.xro/2.0/Quotes/${documentId}`;
            } else if (documentType === "INVOICE") {
                endpoint = `/api.xro/2.0/Invoices/${documentId}`;
            } else if (documentType === "RECEIPT") {
                endpoint = `/api.xro/2.0/Receipts/${documentId}`;
            } else if (documentType === "PURCHASE_ORDER") {
                endpoint = `/api.xro/2.0/PurchaseOrders/${documentId}`;
            }

            console.log(`Making API call to ${endpoint} with Accept: application/pdf header`);

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    "Authorization": `Bearer ${connection.accessToken}`,
                    "Accept": "application/pdf", // This header tells Xero to return PDF format
                    "Xero-Tenant-Id": connection.tenantId,
                },
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`Failed to download document:`, response.status, error);
                throw new Error(`Failed to download document: ${response.status} ${error}`);
            }

            console.log(`Successfully downloaded ${documentType} document`);
            return Buffer.from(await response.arrayBuffer());
        } catch (error) {
            console.error(`Error downloading document:`, error);
            throw error;
        }
    }

    /**
     * Map Xero API response to our document types
     */
    private mapXeroResponse(
        response: XeroApiResponse,
        documentType: XeroDocumentType
    ): XeroDocument[] {
        // Response structure varies by document type
        if (documentType === "QUOTE") {
            const quotesResponse = response as XeroQuotesResponse;
            return quotesResponse.Quotes.map((quote: XeroQuoteResponse) => ({
                documentId: quote.QuoteID,
                documentNumber: quote.QuoteNumber,
                documentType: "QUOTE" as const,
                date: quote.Date,
                updatedDateUTC: quote.UpdatedDateUTC,
                expiryDate: quote.ExpiryDate,
                contactName: quote.Contact.Name,
                contactId: quote.Contact.ContactID,
                status: quote.Status,
                total: quote.Total,
                currencyCode: quote.CurrencyCode,
                quoteNumber: quote.QuoteNumber,
            }));
        } else if (documentType === "INVOICE") {
            const invoicesResponse = response as XeroInvoicesResponse;
            return invoicesResponse.Invoices.map((invoice: XeroInvoiceResponse) => ({
                documentId: invoice.InvoiceID,
                documentNumber: invoice.InvoiceNumber,
                documentType: "INVOICE" as const,
                date: invoice.Date,
                updatedDateUTC: invoice.UpdatedDateUTC,
                dueDate: invoice.DueDate,
                contactName: invoice.Contact.Name,
                contactId: invoice.Contact.ContactID,
                status: invoice.Status,
                total: invoice.Total,
                currencyCode: invoice.CurrencyCode,
                invoiceNumber: invoice.InvoiceNumber,
            }));
        } else if (documentType === "RECEIPT") {
            const receiptsResponse = response as XeroReceiptsResponse;
            return receiptsResponse.Receipts.map((receipt: XeroReceiptResponse) => ({
                documentId: receipt.ReceiptID,
                documentNumber: receipt.ReceiptNumber,
                documentType: "RECEIPT" as const,
                date: receipt.Date,
                updatedDateUTC: receipt.UpdatedDateUTC,
                contactName: receipt.Contact?.Name || "Unknown",
                contactId: receipt.Contact?.ContactID || "",
                status: receipt.Status,
                total: receipt.Total,
                currencyCode: receipt.CurrencyCode,
                receiptNumber: receipt.ReceiptNumber,
            }));
        }

        return [];
    }
}

// Singleton instance
export const xeroClient = new XeroClient(); 