import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SensorCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  unit: string;
  min?: number;
  max?: number;
  status?: "normal" | "warning" | "critical";
  className?: string;
}

export const SensorCard = ({
  icon: Icon,
  label,
  value,
  unit,
  min,
  max,
  status = "normal",
  className,
}: SensorCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "warning":
        return "text-warning";
      case "critical":
        return "text-destructive";
      default:
        return "text-primary";
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case "warning":
        return "border-warning/30";
      case "critical":
        return "border-destructive/30";
      default:
        return "border-border";
    }
  };

  const isInRange = min !== undefined && max !== undefined;
  const percentage = isInRange ? ((value - min) / (max - min)) * 100 : 50;

  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] animate-fade-in",
        getBorderColor(),
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            "p-3 rounded-xl bg-muted/50",
            getStatusColor()
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
        {isInRange && (
          <span className="text-xs text-muted-foreground">
            {min}-{max}{unit}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className={cn("text-4xl font-bold tracking-tight", getStatusColor())}>
            {value.toFixed(1)}
          </span>
          <span className="text-lg text-muted-foreground">{unit}</span>
        </div>
      </div>

      {isInRange && (
        <div className="mt-4 space-y-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                status === "normal" ? "bg-primary" : 
                status === "warning" ? "bg-warning" : "bg-destructive"
              )}
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
