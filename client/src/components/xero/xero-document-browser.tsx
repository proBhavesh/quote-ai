"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getXeroDocuments, importXeroDocuments } from "@/app/actions/xero";
import {
  XeroDocument,
  XeroDocumentType,
  XeroDocumentWithExtendedProps,
} from "@/lib/types/xero";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  Calendar,
  User,
  Loader2,
  FileDown,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { XeroImportProgress } from "./xero-import-progress";
import { XeroBadge } from "./xero-badge";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

interface XeroDocumentBrowserProps {
  connectionId: string;
  tenantName: string;
}

export function XeroDocumentBrowser({
  connectionId,
  tenantName,
}: XeroDocumentBrowserProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [documentType, setDocumentType] = useState<XeroDocumentType>("QUOTE");
  const [documents, setDocuments] = useState<XeroDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSessionId, setImportSessionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentType, connectionId]);

  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getXeroDocuments(connectionId, documentType);
      if (result.success && result.documents) {
        console.log(
          "📘 Raw Xero documents:",
          JSON.stringify(result.documents, null, 2)
        );
        setDocuments(result.documents);
      } else {
        setError(result.error || "Failed to load documents");
        toast({
          variant: "destructive",
          title: "Error loading documents",
          description: result.error || "Failed to load documents",
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load documents",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectDocument = (id: string) => {
    setSelectedDocuments((current) =>
      current.includes(id)
        ? current.filter((docId) => docId !== id)
        : [...current, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map((doc) => doc.documentId));
    }
  };

  const importSelected = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        variant: "destructive",
        title: "No documents selected",
        description: "Please select at least one document to import",
      });
      return;
    }

    setIsImporting(true);
    try {
      const result = await importXeroDocuments(
        connectionId,
        selectedDocuments,
        documentType
      );

      if (result.success) {
        setImportSessionId(result.importSessionId || null);
        toast({
          title: "Import started",
          description: `Importing ${selectedDocuments.length} document(s) from Xero`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Import failed",
          description: result.error || "Failed to import documents",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description:
          error instanceof Error ? error.message : "Failed to import documents",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const onImportComplete = () => {
    setImportSessionId(null);
    setSelectedDocuments([]);
    router.push("/quotes");
  };

  const filteredDocuments = documents.filter((doc) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      doc.documentNumber.toLowerCase().includes(search) ||
      doc.contactName.toLowerCase().includes(search) ||
      doc.status.toLowerCase().includes(search)
    );
  });

  // Helper function to parse Xero dates
  const parseXeroDate = (dateValue: string | Date | null | undefined): Date => {
    if (!dateValue) return new Date();

    // If already a Date object
    if (dateValue instanceof Date) return dateValue;

    // If date is in Xero's /Date(timestamp)/ format
    if (typeof dateValue === "string" && dateValue.includes("/Date(")) {
      const timestamp = parseInt(dateValue.replace(/\/Date\((\d+)\)\//, "$1"));
      return new Date(timestamp);
    }

    // If date already has a DateString format
    try {
      return new Date(dateValue);
    } catch (e) {
      console.error("Error parsing date:", dateValue, e);
      return new Date(); // Fallback to current date
    }
  };

  // Safely extract date from Xero document
  const getDocumentDate = (doc: XeroDocument): Date => {
    // Cast to extended type to access potential extended properties
    const extendedDoc = doc as XeroDocumentWithExtendedProps;

    // Try to use dateString prop if it exists
    const customDateString = extendedDoc.DateString || extendedDoc.dateString;
    if (customDateString) {
      return parseXeroDate(customDateString);
    }

    // Fallback to standard date property
    return parseXeroDate(doc.date);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import from {tenantName}</CardTitle>
          <CardDescription>
            Select documents to import for analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="w-full sm:w-1/3">
              <Select
                value={documentType}
                onValueChange={(value) => {
                  setDocumentType(value as XeroDocumentType);
                  setSelectedDocuments([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUOTE">Quotes</SelectItem>
                  <SelectItem value="INVOICE">Invoices</SelectItem>
                  <SelectItem value="RECEIPT">Receipts</SelectItem>
                  <SelectItem value="PURCHASE_ORDER">
                    Purchase Orders
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-2/3">
              <Input
                placeholder="Search by number, contact, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-destructive text-lg font-medium">{error}</p>
              <Button
                variant="outline"
                onClick={loadDocuments}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg font-medium">
                No {documentType.toLowerCase()}s found
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          documents.length > 0 &&
                          selectedDocuments.length === documents.length
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.documentId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDocuments.includes(doc.documentId)}
                          onCheckedChange={() =>
                            toggleSelectDocument(doc.documentId)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                          {doc.documentNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {(() => {
                            try {
                              return format(getDocumentDate(doc), "PP");
                            } catch (e) {
                              console.error("Date formatting error:", e);
                              return "Invalid date";
                            }
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          {doc.contactName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <XeroBadge status={doc.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: doc.currencyCode,
                        }).format(doc.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {selectedDocuments.length} document(s) selected
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push("/integrations")}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={importSelected}
              disabled={
                selectedDocuments.length === 0 ||
                isImporting ||
                isLoading ||
                !!error
              }
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Import Selected
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {importSessionId && (
        <XeroImportProgress
          importSessionId={importSessionId}
          onComplete={onImportComplete}
        />
      )}
    </div>
  );
}
