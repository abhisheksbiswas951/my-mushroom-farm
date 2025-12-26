import { useState } from "react";
import { Wifi, Bell, Shield, RefreshCw, Moon, Info, ChevronRight } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useDeviceData } from "@/hooks/useDeviceData";
import { useProfiles } from "@/hooks/useProfiles";
import { cn } from "@/lib/utils";

const Settings = () => {
  const { deviceStatus } = useDeviceData();
  const { activeProfile, resetToDefaults } = useProfiles();

  const [notifications, setNotifications] = useState({
    lowHumidity: true,
    highTemperature: true,
    waterEmpty: true,
    sensorFailure: true,
    deviceOffline: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header deviceStatus={deviceStatus} activeProfile={activeProfile} />

      <main className="p-4 space-y-6">
        <h2 className="text-xl font-bold">Settings</h2>

        {/* Connection */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <Wifi className="w-5 h-5 text-primary" />
              Connection
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Mode</span>
              <span className="font-semibold capitalize">{deviceStatus.connectionMode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <span className={cn(
                "font-semibold",
                deviceStatus.isOnline ? "text-success" : "text-destructive"
              )}>
                {deviceStatus.isOnline ? "Connected" : "Disconnected"}
              </span>
            </div>
            <button className="w-full mt-2 py-3 px-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors flex items-center justify-between">
              <span>Configure WiFi</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Alert Notifications
            </h3>
          </div>
          <div className="p-4 space-y-1">
            {Object.entries(notifications).map(([key, enabled]) => (
              <button
                key={key}
                onClick={() => toggleNotification(key as keyof typeof notifications)}
                className="w-full py-3 px-4 rounded-xl hover:bg-muted/50 transition-colors flex items-center justify-between"
              >
                <span className="capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <div
                  className={cn(
                    "w-12 h-7 rounded-full transition-colors p-1",
                    enabled ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full bg-foreground transition-transform",
                      enabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Safety */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Safety Limits
            </h3>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Max Fogger Runtime</span>
              <span className="font-semibold">15 min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Min Humidity Alert</span>
              <span className="font-semibold">50%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Max Temperature Alert</span>
              <span className="font-semibold">40°C</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={resetToDefaults}
            className="w-full glass rounded-2xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-warning" />
            <span>Reset Profiles to Defaults</span>
          </button>
        </div>

        {/* App Info */}
        <div className="glass rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Info className="w-5 h-5" />
            <div className="text-sm">
              <p>MushRoom Smart Farming v1.0.0</p>
              <p>ESP32 IoT Controller</p>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;
