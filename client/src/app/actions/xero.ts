"use server";

import { auth } from "@/auth";
import { xeroClient } from "@/lib/xero-client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { XeroDocumentType } from "@/lib/types/xero";
import { nanoid } from "nanoid";

/**
 * Initiate Xero OAuth connection
 */
export async function initiateXeroConnection() {
    console.log("📣 Initiating Xero connection");

    const session = await auth();
    if (!session?.user) {
        console.error("❌ Authentication required for Xero connection");
        throw new Error("Authentication required");
    }

    console.log("📣 User authenticated:", session.user.id);

    // Generate a unique state to verify the callback
    const state = `${session.user.id}-${Date.now()}`;
    console.log("📣 Generated state param:", state);

    // Get the authorization URL
    console.log("📣 Getting Xero authorization URL");
    const authUrl = xeroClient.getAuthorizationUrl(state);
    console.log("📣 Xero authorization URL:", authUrl);
    console.log("📣 IMPORTANT: Using login.xero.com domain for authorization (not identity.xero.com)");
    console.log("📣 Expected redirect after auth:", process.env.XERO_REDIRECT_URI);

    // Store state in database temporarily for verification
    console.log("📣 Storing state in database");
    await prisma.session.create({
        data: {
            sessionToken: `xero-state-${state}`,
            userId: session.user.id,
            expires: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes
        },
    });
    console.log("📣 State stored successfully");

    // Return auth URL and state
    console.log("📣 Returning auth URL for redirect");
    return {
        authUrl,
        state,
    };
}

/**
 * Finalize Xero OAuth connection after user authorizes
 */
export async function finalizeXeroConnection(code: string, state: string) {
    console.log("📣 Finalizing Xero connection", { code: !!code, state });

    const session = await auth();
    if (!session?.user) {
        console.error("❌ Authentication required for finalizing Xero connection");
        throw new Error("Authentication required");
    }

    console.log("📣 User authenticated:", session.user.id);

    // Verify state parameter
    console.log("📣 Verifying state parameter");
    const storedState = await prisma.session.findFirst({
        where: {
            sessionToken: `xero-state-${state}`,
            userId: session.user.id,
        },
    });

    if (!storedState) {
        console.error("❌ Invalid authorization request - state not found");
        throw new Error("Invalid authorization request");
    }

    console.log("📣 State verification successful");

    // Clean up the state
    console.log("📣 Cleaning up stored state");
    await prisma.session.delete({
        where: {
            id: storedState.id,
        },
    });

    try {
        // Exchange code for tokens
        console.log("📣 Exchanging code for tokens");
        const tokenResponse = await xeroClient.getAccessToken(code);
        console.log("📣 Token exchange successful", {
            hasAccessToken: !!tokenResponse.access_token,
            hasRefreshToken: !!tokenResponse.refresh_token,
            expiresIn: tokenResponse.expires_in
        });

        // Get tenant information
        console.log("📣 Getting tenant information");
        const tenants = await xeroClient.getTenants(tokenResponse.access_token);
        console.log("📣 Retrieved tenants:", tenants.length);

        // Store each tenant connection
        console.log("📣 Storing tenant connections");
        for (const tenant of tenants) {
            console.log("📣 Processing tenant:", tenant.tenantName || tenant.tenantId);

            const existingConnection = await prisma.xeroConnection.findUnique({
                where: {
                    userId_tenantId: {
                        userId: session.user.id,
                        tenantId: tenant.tenantId,
                    },
                },
            });

            if (existingConnection) {
                // Update existing connection
                console.log("📣 Updating existing connection");
                await prisma.xeroConnection.update({
                    where: {
                        id: existingConnection.id,
                    },
                    data: {
                        accessToken: tokenResponse.access_token,
                        refreshToken: tokenResponse.refresh_token,
                        expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
                        tenantName: tenant.tenantName,
                    },
                });
            } else {
                // Create new connection
                console.log("📣 Creating new connection");
                await prisma.xeroConnection.create({
                    data: {
                        userId: session.user.id,
                        tenantId: tenant.tenantId,
                        tenantName: tenant.tenantName,
                        accessToken: tokenResponse.access_token,
                        refreshToken: tokenResponse.refresh_token,
                        expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
                    },
                });
            }
        }

        console.log("📣 Revalidating integrations page");
        revalidatePath("/integrations");
        console.log("📣 Xero connection successful");
        return { success: true, connectionCount: tenants.length };
    } catch (error) {
        console.error("❌ Xero connection error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

/**
 * Get all Xero connections for current user
 */
export async function getXeroConnections() {
    const session = await auth();
    if (!session?.user) {
        return [];
    }

    return await prisma.xeroConnection.findMany({
        where: {
            userId: session.user.id,
        },
        select: {
            id: true,
            tenantId: true,
            tenantName: true,
            expiresAt: true,
            createdAt: true,
        },
    });
}

/**
 * Delete a Xero connection
 */
export async function deleteXeroConnection(connectionId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Authentication required");
    }

    // Verify the connection belongs to the user
    const connection = await prisma.xeroConnection.findFirst({
        where: {
            id: connectionId,
            userId: session.user.id,
        },
    });

    if (!connection) {
        throw new Error("Connection not found");
    }

    await prisma.xeroConnection.delete({
        where: {
            id: connectionId,
        },
    });

    revalidatePath("/integrations");
    return { success: true };
}

/**
 * Get Xero documents by type for a connection
 */
export async function getXeroDocuments(
    connectionId: string,
    documentType: XeroDocumentType,
    page: number = 1
) {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Authentication required");
    }

    // Verify the connection belongs to the user
    const connection = await prisma.xeroConnection.findFirst({
        where: {
            id: connectionId,
            userId: session.user.id,
        },
    });

    if (!connection) {
        throw new Error("Connection not found");
    }

    try {
        const documents = await xeroClient.getDocuments(
            connectionId,
            documentType,
            page
        );
        return { success: true, documents };
    } catch (error) {
        console.error("Error fetching Xero documents:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

/**
 * Parse Microsoft JSON date format (/Date(timestamp)/)
 */
function parseXeroDate(dateValue: string | Date): Date | null {
    // If already a Date object, return it
    if (dateValue instanceof Date) return dateValue;

    if (!dateValue) return null;

    // Extract timestamp from /Date(timestamp)/ format
    const matches = dateValue.match(/\/Date\((\d+)\)\//);
    if (!matches || matches.length < 2) {
        // Try parsing as a regular date string if not in /Date()/ format
        try {
            return new Date(dateValue);
        } catch {
            // Ignore error and return null
            return null;
        }
    }

    // Parse the timestamp (milliseconds since epoch)
    const timestamp = parseInt(matches[1], 10);
    if (isNaN(timestamp)) return null;

    return new Date(timestamp);
}

/**
 * Import selected documents from Xero for analysis
 */
export async function importXeroDocuments(
    connectionId: string,
    documentIds: string[],
    documentType: XeroDocumentType
) {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Authentication required");
    }

    // Verify the connection belongs to the user
    const connection = await prisma.xeroConnection.findFirst({
        where: {
            id: connectionId,
            userId: session.user.id,
        },
        select: {
            id: true,
            tenantId: true,
            tenantName: true,
        },
    });

    if (!connection) {
        throw new Error("Connection not found");
    }

    try {
        // Create import session
        const importSession = await prisma.xeroImportSession.create({
            data: {
                userId: session.user.id,
                connectionId,
                totalDocuments: documentIds.length,
                status: "PROCESSING",
            },
        });

        // Process each document asynchronously
        // In production, this should be handled by a background job/queue
        // For demo, we'll do it in this request
        const documents = await xeroClient.getDocuments(
            connectionId,
            documentType
        );

        const selectedDocuments = documents.filter(doc =>
            documentIds.includes(doc.documentId));

        for (const document of selectedDocuments) {
            try {
                // Download document as PDF
                const pdfBuffer = await xeroClient.downloadDocument(
                    connectionId,
                    documentType,
                    document.documentId
                );

                // Debug to verify PDF buffer
                console.log(`PDF buffer received, size: ${pdfBuffer.byteLength} bytes`);

                if (!pdfBuffer || pdfBuffer.byteLength === 0) {
                    throw new Error("Empty PDF received from Xero");
                }

                // Upload to Supabase - use arrayBuffer/Blob approach for better compatibility
                const fileName = `${nanoid()}-${document.documentNumber}.pdf`;
                const filePath = `${session.user.id}/${fileName}`;

                console.log(`Uploading to Supabase: ${filePath}`);

                // Convert Buffer to Blob for Supabase upload
                const blob = new Blob([pdfBuffer], { type: 'application/pdf' });

                const { error } = await supabase.storage
                    .from("quotes")
                    .upload(filePath, blob, {
                        contentType: "application/pdf",
                        cacheControl: "3600",
                    });

                if (error) {
                    console.error("Supabase upload error details:", error);
                    throw new Error(`Supabase upload error: ${error.message}`);
                }

                console.log("PDF successfully uploaded to Supabase");

                // Get public URL
                const publicUrlResult = supabase.storage
                    .from("quotes")
                    .getPublicUrl(filePath);

                if (!publicUrlResult.data) {
                    throw new Error("Failed to get public URL for uploaded file");
                }

                const publicUrl = publicUrlResult.data.publicUrl;
                console.log("Public URL obtained:", publicUrl);

                // Create quote and XeroDocument records
                try {
                    console.log("Creating database records...");

                    // Safely convert the document to a JSON-compatible object
                    const safeDocumentData = JSON.parse(JSON.stringify(document));

                    // Parse the date correctly from Xero format
                    const documentDate = parseXeroDate(document.date);
                    if (!documentDate) {
                        console.warn(`Invalid date format in Xero document: ${document.date}, using current date`);
                    }

                    // Check if the document already exists
                    const existingDocument = await prisma.$queryRaw`
                        SELECT "id", "quoteId" FROM "XeroDocument" 
                        WHERE "connectionId" = ${connectionId} AND "xeroId" = ${document.documentId}
                        LIMIT 1
                    `;

                    if (existingDocument && Array.isArray(existingDocument) && existingDocument.length > 0) {
                        console.log(`Document already exists, skipping: ${document.documentId}`);

                        // Update processed count
                        await prisma.xeroImportSession.update({
                            where: { id: importSession.id },
                            data: {
                                processedDocuments: {
                                    increment: 1,
                                },
                            },
                        });

                        continue; // Skip to next document
                    }

                    // Create database record with proper type handling
                    const quote = await prisma.quote.create({
                        data: {
                            userId: session.user.id,
                            title: `${connection.tenantName} - ${document.documentNumber}`,
                            fileUrl: publicUrl,
                            sourceType: "XERO",
                            status: "PENDING",
                            xeroDocuments: {
                                create: {
                                    connectionId,
                                    xeroId: document.documentId,
                                    documentType: document.documentType,
                                    documentNumber: document.documentNumber,
                                    // Use parsed date or fallback to current date
                                    documentDate: documentDate || new Date(),
                                    contactName: document.contactName,
                                    contactId: document.contactId,
                                    status: document.status,
                                    total: document.total,
                                    currencyCode: document.currencyCode,
                                    fileUrl: publicUrl,
                                    originalData: safeDocumentData,
                                },
                            },
                        },
                    });

                    console.log("Database records created successfully, quoteId:", quote.id);

                    // Update processed count
                    await prisma.xeroImportSession.update({
                        where: { id: importSession.id },
                        data: {
                            processedDocuments: {
                                increment: 1,
                            },
                        },
                    });
                } catch (dbError) {
                    // Log database error
                    console.error("Failed to process document due to database error:",
                        dbError instanceof Error ? dbError.message : "Unknown database error");

                    // Still need to rethrow the error to ensure it's properly handled
                    throw dbError;
                }
            } catch (error) {
                console.error(`Error processing document ${document.documentId}:`,
                    error instanceof Error ? error.message : "Unknown error"
                );
            }
        }

        // Mark import session as completed
        await prisma.xeroImportSession.update({
            where: { id: importSession.id },
            data: {
                status: "COMPLETED",
            },
        });

        revalidatePath("/quotes");
        return { success: true, importSessionId: importSession.id };
    } catch (error) {
        console.error("Error importing Xero documents:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

/**
 * Get import session status
 */
export async function getImportSessionStatus(importSessionId: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Authentication required");
    }

    const importSession = await prisma.xeroImportSession.findFirst({
        where: {
            id: importSessionId,
            userId: session.user.id,
        },
        select: {
            totalDocuments: true,
            processedDocuments: true,
            status: true,
        },
    });

    if (!importSession) {
        throw new Error("Import session not found");
    }

    return {
        status: importSession.status,
        processed: importSession.processedDocuments,
        total: importSession.totalDocuments,
        progress: Math.round(
            (importSession.processedDocuments / importSession.totalDocuments) * 100
        ),
    };
} 