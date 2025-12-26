import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "online" | "offline" | "warning" | "ok" | "low" | "empty";
  label?: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

const statusStyles = {
  online: "bg-success/20 text-success border-success/30",
  offline: "bg-destructive/20 text-destructive border-destructive/30",
  warning: "bg-warning/20 text-warning border-warning/30",
  ok: "bg-success/20 text-success border-success/30",
  low: "bg-warning/20 text-warning border-warning/30",
  empty: "bg-destructive/20 text-destructive border-destructive/30",
};

const dotStyles = {
  online: "bg-success",
  offline: "bg-destructive",
  warning: "bg-warning",
  ok: "bg-success",
  low: "bg-warning",
  empty: "bg-destructive",
};

const sizeStyles = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-base px-4 py-1.5",
};

export const StatusBadge = ({
  status,
  label,
  size = "md",
  pulse = false,
}: StatusBadgeProps) => {
  const displayLabel = label || status.toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-semibold uppercase tracking-wide",
        statusStyles[status],
        sizeStyles[size]
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          dotStyles[status],
          pulse && "animate-pulse"
        )}
      />
      {displayLabel}
    </span>
  );
};
