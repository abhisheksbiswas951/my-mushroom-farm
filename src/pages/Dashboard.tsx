import { Thermometer, Droplets, Wind, CloudRain, Clock, Gauge } from "lucide-react";
import { SensorCard } from "@/components/SensorCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useDeviceData } from "@/hooks/useDeviceData";
import { useProfiles } from "@/hooks/useProfiles";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { sensorData, deviceStatus } = useDeviceData();
  const { activeProfile } = useProfiles();

  const getTemperatureStatus = () => {
    if (!activeProfile) return "normal";
    if (sensorData.temperature < activeProfile.minTemperature) return "critical";
    if (sensorData.temperature > activeProfile.maxTemperature) return "critical";
    if (
      sensorData.temperature < activeProfile.minTemperature + 2 ||
      sensorData.temperature > activeProfile.maxTemperature - 2
    ) {
      return "warning";
    }
    return "normal";
  };

  const getHumidityStatus = () => {
    if (!activeProfile) return "normal";
    if (sensorData.avgHumidity < activeProfile.minHumidity) return "critical";
    if (sensorData.avgHumidity > activeProfile.maxHumidity) return "warning";
    if (sensorData.avgHumidity < activeProfile.minHumidity + 5) return "warning";
    return "normal";
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header deviceStatus={deviceStatus} activeProfile={activeProfile} />

      <main className="p-4 space-y-6">
        {/* Active Profile Banner */}
        <div className="glass rounded-2xl p-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{activeProfile?.icon}</span>
            <div>
              <p className="text-sm text-muted-foreground">Active Profile</p>
              <p className="font-bold text-lg">{activeProfile?.name}</p>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Target: {activeProfile?.minHumidity}-{activeProfile?.maxHumidity}%</p>
            <p>{activeProfile?.minTemperature}-{activeProfile?.maxTemperature}°C</p>
          </div>
        </div>

        {/* Main Sensor Cards */}
        <div className="grid grid-cols-2 gap-4">
          <SensorCard
            icon={Thermometer}
            label="Temperature"
            value={sensorData.temperature}
            unit="°C"
            min={activeProfile?.minTemperature}
            max={activeProfile?.maxTemperature}
            status={getTemperatureStatus()}
          />
          <SensorCard
            icon={Droplets}
            label="Avg Humidity"
            value={sensorData.avgHumidity}
            unit="%"
            min={activeProfile?.minHumidity}
            max={activeProfile?.maxHumidity}
            status={getHumidityStatus()}
          />
        </div>

        {/* Humidity Sensors Detail */}
        <div className="glass rounded-2xl p-5 animate-fade-in">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            Humidity Sensors
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Sensor 1</p>
              <p className="text-2xl font-bold">{sensorData.humidity1.toFixed(1)}%</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Sensor 2</p>
              <p className="text-2xl font-bold">{sensorData.humidity2.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Device Status Grid */}
        <div className="glass rounded-2xl p-5 animate-fade-in">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Wind className="w-5 h-5 text-primary" />
            Device Status
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-info" />
                <span className="text-sm font-medium">Fogger</span>
              </div>
              <StatusBadge
                status={deviceStatus.foggerOn ? "online" : "offline"}
                label={deviceStatus.foggerOn ? "ON" : "OFF"}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-info" />
                <span className="text-sm font-medium">Exhaust</span>
              </div>
              <StatusBadge
                status={deviceStatus.exhaustFanOn ? "online" : "offline"}
                label={deviceStatus.exhaustFanOn ? "ON" : "OFF"}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-info" />
                <span className="text-sm font-medium">Circulation</span>
              </div>
              <StatusBadge
                status={deviceStatus.circulationFanOn ? "online" : "offline"}
                label={deviceStatus.circulationFanOn ? "ON" : "OFF"}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-info" />
                <span className="text-sm font-medium">Water</span>
              </div>
              <StatusBadge
                status={
                  deviceStatus.waterTankStatus === "OK"
                    ? "ok"
                    : deviceStatus.waterTankStatus === "LOW"
                    ? "low"
                    : "empty"
                }
                label={deviceStatus.waterTankStatus}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-fade-in">
          <Clock className="w-4 h-4" />
          <span>Last update: {formatTime(deviceStatus.lastUpdate)}</span>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
