"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function BlogPagination({
  currentPage,
  totalPages,
  baseUrl,
}: BlogPaginationProps) {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const createPageUrl = (page: number) => {
    params.set("page", page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        disabled={currentPage <= 1}
        asChild={currentPage > 1}
      >
        {currentPage > 1 ? (
          <Link href={createPageUrl(currentPage - 1)}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Link>
        ) : (
          <>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </>
        )}
      </Button>

      <div className="flex items-center justify-center">
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <Button
        variant="outline"
        disabled={currentPage >= totalPages}
        asChild={currentPage < totalPages}
      >
        {currentPage < totalPages ? (
          <Link href={createPageUrl(currentPage + 1)}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        ) : (
          <>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
} 