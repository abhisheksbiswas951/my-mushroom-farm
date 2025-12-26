import { useState } from "react";
import {
  Wifi,
  Bell,
  Shield,
  RefreshCw,
  Info,
  ChevronRight,
  Search,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useDeviceData } from "@/hooks/useDeviceData";
import { useProfiles } from "@/hooks/useProfiles";
import { useConnection } from "@/hooks/useConnection";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { deviceStatus } = useDeviceData();
  const { activeProfile, resetToDefaults, syncWithDevice, isSyncing } = useProfiles();
  const {
    config,
    isConnected,
    isConnecting,
    isAutoDetecting,
    lastError,
    updateConfig,
    testConnection,
    autoDetect,
  } = useConnection();
  const { toast } = useToast();

  const [showConnectionConfig, setShowConnectionConfig] = useState(false);
  const [ipAddress, setIpAddress] = useState(config.ipAddress);
  const [port, setPort] = useState(config.port.toString());
  const [authToken, setAuthToken] = useState(config.authToken);

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

  const handleSaveConnection = async () => {
    updateConfig({
      ipAddress,
      port: parseInt(port) || 80,
      authToken,
    });

    const success = await testConnection();
    if (success) {
      toast({
        title: "Connected",
        description: `Successfully connected to ESP32 at ${ipAddress}`,
      });
      setShowConnectionConfig(false);
    } else {
      toast({
        title: "Connection Failed",
        description: lastError || "Could not connect to device",
        variant: "destructive",
      });
    }
  };

  const handleAutoDetect = async () => {
    const foundIp = await autoDetect();
    if (foundIp) {
      setIpAddress(foundIp);
      toast({
        title: "Device Found",
        description: `ESP32 detected at ${foundIp}`,
      });
    } else {
      toast({
        title: "Not Found",
        description: "No ESP32 device found on network",
        variant: "destructive",
      });
    }
  };

  const handleSyncProfiles = async () => {
    await syncWithDevice();
    toast({
      title: "Synced",
      description: "Profiles synchronized with device",
    });
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
              <span className="text-muted-foreground">Status</span>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <X className="w-4 h-4 text-destructive" />
                )}
                <span
                  className={cn(
                    "font-semibold",
                    isConnected ? "text-success" : "text-destructive"
                  )}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Device IP</span>
              <span className="font-semibold font-mono text-sm">
                {config.ipAddress}:{config.port}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Mode</span>
              <span className="font-semibold capitalize">
                {deviceStatus.connectionMode}
              </span>
            </div>

            {lastError && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                {lastError}
              </div>
            )}

            <button
              onClick={() => setShowConnectionConfig(!showConnectionConfig)}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors flex items-center justify-between"
            >
              <span>Configure Connection</span>
              <ChevronRight
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  showConnectionConfig && "rotate-90"
                )}
              />
            </button>

            {showConnectionConfig && (
              <div className="space-y-4 pt-2 animate-fade-in">
                {/* IP Address */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    ESP32 IP Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      placeholder="192.168.4.1"
                      className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none font-mono text-sm"
                    />
                    <button
                      onClick={handleAutoDetect}
                      disabled={isAutoDetecting}
                      className="px-4 py-3 rounded-xl bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isAutoDetecting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Port */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="80"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none font-mono text-sm"
                  />
                </div>

                {/* Auth Token */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Auth Token / PIN (optional)
                  </label>
                  <input
                    type="password"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder="Enter device PIN or token"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveConnection}
                  disabled={isConnecting}
                  className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Save & Connect"
                  )}
                </button>
              </div>
            )}
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
            onClick={handleSyncProfiles}
            disabled={isSyncing}
            className="w-full glass rounded-2xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            {isSyncing ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5 text-primary" />
            )}
            <span>Sync Profiles with Device</span>
          </button>

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
