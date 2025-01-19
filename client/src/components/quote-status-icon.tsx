import { Clock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface QuoteStatusIconProps {
  status: string;
  className?: string;
}

export function QuoteStatusIcon({
  status,
  className = "",
}: QuoteStatusIconProps) {
  switch (status.toLowerCase()) {
    case "pending":
      return <Clock className={`w-4 h-4 text-yellow-500 ${className}`} />;
    case "processing":
      return (
        <Loader2
          className={`w-4 h-4 text-blue-500 animate-spin ${className}`}
        />
      );
    case "completed":
      return <CheckCircle2 className={`w-4 h-4 text-green-500 ${className}`} />;
    case "error":
      return <AlertCircle className={`w-4 h-4 text-red-500 ${className}`} />;
    default:
      return null;
  }
}
