// Xero API Types
export interface XeroTenant {
    id: string;
    tenantId: string;
    tenantName: string;
    tenantType: string;
}

export interface XeroTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    id_token?: string;
}

export interface XeroContact {
    ContactID: string;
    Name: string;
}

// Xero Document Types
export type XeroDocumentType = "QUOTE" | "INVOICE" | "RECEIPT" | "PURCHASE_ORDER";

export interface XeroDocumentBase {
    documentId: string;
    documentNumber: string;
    documentType: XeroDocumentType;
    date: string | Date;
    updatedDateUTC: string | Date;
    contactName: string;
    contactId: string;
    status: string;
    total: number;
    currencyCode: string;
}

export interface XeroQuote extends XeroDocumentBase {
    documentType: "QUOTE";
    expiryDate?: string | Date;
    quoteNumber: string;
}

export interface XeroInvoice extends XeroDocumentBase {
    documentType: "INVOICE";
    invoiceNumber: string;
    dueDate?: string | Date;
}

export interface XeroReceipt extends XeroDocumentBase {
    documentType: "RECEIPT";
    receiptNumber: string;
}

export type XeroDocument = XeroQuote | XeroInvoice | XeroReceipt;

export interface XeroLineItem {
    lineItemID?: string;
    description: string;
    quantity: number;
    unitAmount: number;
    accountCode?: string;
    taxType?: string;
    taxAmount?: number;
    lineAmount: number;
    discountRate?: number;
}

// Connection & Session Types
export interface XeroConnectionState {
    status: "connected" | "disconnected" | "expired" | "connecting";
    tenant?: XeroTenant;
    expiresAt?: Date;
    message?: string;
}

export interface XeroDocumentSelectState {
    selected: string[];
    page: number;
    filter: {
        type: XeroDocumentType | "ALL";
        status: string | "ALL";
        date: {
            from?: Date;
            to?: Date;
        };
        search: string;
    };
}

// Xero Import Session Type
export interface XeroImportSession {
    id: string;
    status: "PROCESSING" | "COMPLETED" | "FAILED";
    connectionId: string;
    userId: string;
    totalDocuments: number;
    processedDocuments: number;
    createdAt: Date;
    updatedAt: Date;
    documents: string[]; // document IDs
}

// Types for mapping Xero API responses
export interface XeroQuoteResponse {
    QuoteID: string;
    QuoteNumber: string;
    Date: string;
    ExpiryDate?: string;
    UpdatedDateUTC: string;
    Contact: XeroContact;
    Status: string;
    Total: number;
    CurrencyCode: string;
}

export interface XeroInvoiceResponse {
    InvoiceID: string;
    InvoiceNumber: string;
    Date: string;
    DueDate?: string;
    UpdatedDateUTC: string;
    Contact: XeroContact;
    Status: string;
    Total: number;
    CurrencyCode: string;
}

export interface XeroReceiptResponse {
    ReceiptID: string;
    ReceiptNumber: string;
    Date: string;
    UpdatedDateUTC: string;
    Contact?: XeroContact;
    Status: string;
    Total: number;
    CurrencyCode: string;
}

export interface XeroPurchaseOrderResponse {
    PurchaseOrderID: string;
    PurchaseOrderNumber: string;
    Date: string;
    UpdatedDateUTC: string;
    Contact: XeroContact;
    Status: string;
    Total: number;
    CurrencyCode: string;
}

export interface XeroQuotesResponse {
    Quotes: XeroQuoteResponse[];
}

export interface XeroInvoicesResponse {
    Invoices: XeroInvoiceResponse[];
}

export interface XeroReceiptsResponse {
    Receipts: XeroReceiptResponse[];
}

export interface XeroPurchaseOrdersResponse {
    PurchaseOrders: XeroPurchaseOrderResponse[];
}

export type XeroApiResponse =
    | XeroQuotesResponse
    | XeroInvoicesResponse
    | XeroReceiptsResponse
    | XeroPurchaseOrdersResponse;

// Extended document properties for UI display
export interface XeroDocumentExtendedProperties {
    DateString?: string;
    dateString?: string;
}

export type XeroDocumentWithExtendedProps = XeroDocument & XeroDocumentExtendedProperties; 