import { Bell, AlertTriangle, Droplets, Thermometer, Wifi, X } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useDeviceData } from "@/hooks/useDeviceData";
import { useProfiles } from "@/hooks/useProfiles";
import { cn } from "@/lib/utils";
import { Alert } from "@/types/mushroom";
import { useState } from "react";

// Mock alerts for demo
const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "humidity_low",
    message: "Humidity dropped below 75%. Check fogger.",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    severity: "warning",
  },
  {
    id: "2",
    type: "water_low",
    message: "Water tank level is low. Refill soon.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    severity: "warning",
  },
  {
    id: "3",
    type: "temp_high",
    message: "Temperature exceeded 30°C. Check ventilation.",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
    severity: "critical",
  },
];

const getAlertIcon = (type: Alert["type"]) => {
  switch (type) {
    case "humidity_low":
    case "humidity_high":
    case "water_low":
    case "water_empty":
      return Droplets;
    case "temp_low":
    case "temp_high":
      return Thermometer;
    case "device_offline":
    case "sensor_fail":
      return Wifi;
    default:
      return AlertTriangle;
  }
};

const Alerts = () => {
  const { deviceStatus } = useDeviceData();
  const { activeProfile } = useProfiles();
  const [alerts, setAlerts] = useState(mockAlerts);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header
        deviceStatus={deviceStatus}
        activeProfile={activeProfile}
        alertCount={unreadCount}
      />

      <main className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Alerts
          </h2>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-primary font-medium"
            >
              Mark all read
            </button>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center animate-fade-in">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">No Alerts</p>
            <p className="text-muted-foreground">
              Everything is running smoothly!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = getAlertIcon(alert.type);
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "glass rounded-2xl p-4 transition-all animate-fade-in",
                    !alert.read && "border-l-4",
                    !alert.read &&
                      (alert.severity === "critical"
                        ? "border-l-destructive"
                        : "border-l-warning")
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-xl",
                        alert.severity === "critical"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-warning/20 text-warning"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          "font-medium",
                          !alert.read && "text-foreground",
                          alert.read && "text-muted-foreground"
                        )}
                      >
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(alert.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="p-2 rounded-xl hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Alerts;
