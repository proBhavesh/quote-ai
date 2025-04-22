import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface XeroBadgeProps {
  status: string;
  className?: string;
}

export function XeroBadge({ status, className }: XeroBadgeProps) {
  // Determine the appropriate style based on the status
  const getVariant = () => {
    if (status === "ACCEPTED" || status === "PAID") {
      return "outline";
    } else if (status === "DRAFT") {
      return "secondary";
    } else {
      return "default";
    }
  };

  return (
    <Badge variant={getVariant()} className={className}>
      {status}
    </Badge>
  );
}

export function ConnectionStatusBadge({
  isActive,
  className,
}: {
  isActive: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isActive
          ? "bg-green-100 text-green-800"
          : "bg-destructive text-destructive-foreground",
        className
      )}
    >
      {isActive ? "Active" : "Expired"}
    </span>
  );
}
