import { CloudRain, Wind, RotateCcw, AlertTriangle } from "lucide-react";
import { DeviceControl } from "@/components/DeviceControl";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useDeviceData } from "@/hooks/useDeviceData";
import { useProfiles } from "@/hooks/useProfiles";

const Control = () => {
  const { deviceStatus, toggleManualControl, getOverrideTimeRemaining } = useDeviceData();
  const { activeProfile } = useProfiles();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header deviceStatus={deviceStatus} activeProfile={activeProfile} />

      <main className="p-4 space-y-6">
        <div className="glass rounded-2xl p-4 flex items-start gap-3 border-warning/30 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-warning">Manual Control Mode</p>
            <p className="text-muted-foreground">
              Override expires after 10 minutes. Automation will resume automatically.
            </p>
          </div>
        </div>

        <h2 className="text-xl font-bold">Manual Controls</h2>

        <div className="grid grid-cols-2 gap-4">
          <DeviceControl
            icon={CloudRain}
            label="Fogger"
            isOn={deviceStatus.foggerOn}
            onToggle={() => toggleManualControl("fogger")}
            manualOverrideSeconds={getOverrideTimeRemaining("fogger")}
          />
          <DeviceControl
            icon={Wind}
            label="Exhaust Fan"
            isOn={deviceStatus.exhaustFanOn}
            onToggle={() => toggleManualControl("exhaustFan")}
            manualOverrideSeconds={getOverrideTimeRemaining("exhaustFan")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DeviceControl
            icon={RotateCcw}
            label="Circulation"
            isOn={deviceStatus.circulationFanOn}
            onToggle={() => toggleManualControl("circulationFan")}
            manualOverrideSeconds={getOverrideTimeRemaining("circulationFan")}
          />
          <div className="glass rounded-2xl p-5 flex flex-col items-center justify-center gap-3 border-muted-foreground/20">
            <div className="p-4 rounded-2xl bg-muted text-muted-foreground">
              <Wind className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg text-muted-foreground">Auto Mode</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </div>

        {/* Current Settings */}
        <div className="glass rounded-2xl p-5 space-y-4 animate-fade-in">
          <h3 className="font-semibold">Current Automation Settings</h3>
          
          {activeProfile && (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Fresh Air Interval</span>
                <span className="font-semibold">{activeProfile.freshAirInterval} min</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Fresh Air Duration</span>
                <span className="font-semibold">{activeProfile.freshAirDuration} sec</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Fogger Max ON</span>
                <span className="font-semibold">{activeProfile.foggerMaxOnTime} sec</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Target Humidity</span>
                <span className="font-semibold">
                  {activeProfile.minHumidity}-{activeProfile.maxHumidity}%
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Control;
