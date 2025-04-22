"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Calendar,
  Building,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteXeroConnection } from "@/app/actions/xero";
import { ConnectionStatusBadge } from "./xero-badge";
import { useToast } from "@/hooks/use-toast";

interface XeroConnection {
  id: string;
  tenantId: string;
  tenantName: string;
  expiresAt: Date;
  createdAt: Date;
}

export function XeroConnectionsList({
  connections,
}: {
  connections: XeroConnection[];
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async (connectionId: string) => {
    setIsDeleting(connectionId);

    try {
      await deleteXeroConnection(connectionId);
      toast({
        title: "Connection removed",
        description: "Your Xero connection has been removed successfully.",
      });
      setOpenDeleteDialog(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to remove connection. Please try again.",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const promptDelete = (connectionId: string) => {
    setIsDeleting(connectionId);
    setOpenDeleteDialog(true);
  };

  const viewDocuments = (connectionId: string) => {
    router.push(`/integrations/xero/${connectionId}`);
  };

  return (
    <div className="space-y-4">
      {connections.map((connection) => (
        <Card key={connection.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">
                  {connection.tenantName}
                </h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building className="mr-1 h-4 w-4" />
                  <span>{connection.tenantId}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span>
                    Connected{" "}
                    {formatDistanceToNow(new Date(connection.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
              <ConnectionStatusBadge
                isActive={new Date(connection.expiresAt) > new Date()}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between bg-muted/50 px-6 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => promptDelete(connection.id)}
              disabled={isDeleting === connection.id}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => viewDocuments(connection.id)}
            >
              <FileText className="mr-2 h-4 w-4" />
              View Documents
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Xero Connection</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect your Xero account. You&apos;ll need to
              reconnect if you want to import documents in the future. Any
              previously imported documents will remain available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => isDeleting && handleDelete(isDeleting)}
              disabled={!isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {!!isDeleting ? "Removing..." : "Remove Connection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
