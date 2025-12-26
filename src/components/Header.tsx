import { StatusBadge } from "./StatusBadge";
import { DeviceStatus, MushroomProfile } from "@/types/mushroom";
import { Wifi, WifiOff, Cloud, Smartphone, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  deviceStatus: DeviceStatus;
  activeProfile?: MushroomProfile;
  alertCount?: number;
}

export const Header = ({ deviceStatus, activeProfile, alertCount = 0 }: HeaderProps) => {
  const navigate = useNavigate();

  const getConnectionIcon = () => {
    switch (deviceStatus.connectionMode) {
      case "cloud":
        return Cloud;
      case "local":
        return Smartphone;
      default:
        return WifiOff;
    }
  };

  const ConnectionIcon = getConnectionIcon();

  return (
    <header className="sticky top-0 z-40 glass border-b border-border safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🍄</div>
          <div>
            <h1 className="font-bold text-lg leading-tight">MushRoom</h1>
            {activeProfile && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span>{activeProfile.icon}</span>
                <span>{activeProfile.name}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ConnectionIcon
              className={cn(
                "w-4 h-4",
                deviceStatus.isOnline ? "text-primary" : "text-destructive"
              )}
            />
            <StatusBadge
              status={deviceStatus.isOnline ? "online" : "offline"}
              size="sm"
              pulse={deviceStatus.isOnline}
            />
          </div>

          <button
            onClick={() => navigate("/alerts")}
            className="relative p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
                {alertCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
