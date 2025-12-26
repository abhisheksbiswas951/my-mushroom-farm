import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface DeviceControlProps {
  icon: LucideIcon;
  label: string;
  isOn: boolean;
  onToggle: () => void;
  manualOverrideSeconds?: number | null;
  disabled?: boolean;
}

export const DeviceControl = ({
  icon: Icon,
  label,
  isOn,
  onToggle,
  manualOverrideSeconds,
  disabled = false,
}: DeviceControlProps) => {
  const [timeRemaining, setTimeRemaining] = useState(manualOverrideSeconds);

  useEffect(() => {
    setTimeRemaining(manualOverrideSeconds);
  }, [manualOverrideSeconds]);

  useEffect(() => {
    if (!timeRemaining) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev ? Math.max(0, prev - 1) : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "w-full glass rounded-2xl p-5 transition-all duration-300 active:scale-95",
        "flex flex-col items-center gap-4",
        isOn ? "border-primary/50 glow-primary" : "border-border",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "p-4 rounded-2xl transition-all duration-300",
          isOn
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="w-8 h-8" />
      </div>

      <div className="text-center space-y-1">
        <p className="font-semibold text-lg">{label}</p>
        <p
          className={cn(
            "text-sm font-medium",
            isOn ? "text-primary" : "text-muted-foreground"
          )}
        >
          {isOn ? "ON" : "OFF"}
        </p>
      </div>

      {timeRemaining && timeRemaining > 0 && (
        <div className="flex items-center gap-2 text-xs text-warning">
          <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          <span>Manual: {formatTime(timeRemaining)}</span>
        </div>
      )}
    </button>
  );
};
