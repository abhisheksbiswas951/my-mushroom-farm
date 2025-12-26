import { useState, useEffect, useCallback } from "react";
import { SensorData, DeviceStatus, ManualOverride, Alert } from "@/types/mushroom";

// Simulated data for demo - replace with actual ESP32 API calls
const generateMockSensorData = (): SensorData => {
  const humidity1 = 82 + Math.random() * 10;
  const humidity2 = 80 + Math.random() * 12;
  return {
    temperature: 22 + Math.random() * 4,
    humidity1,
    humidity2,
    avgHumidity: (humidity1 + humidity2) / 2,
    timestamp: new Date(),
  };
};

export const useDeviceData = () => {
  const [sensorData, setSensorData] = useState<SensorData>(generateMockSensorData());
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    isOnline: true,
    foggerOn: false,
    exhaustFanOn: true,
    circulationFanOn: false,
    waterTankStatus: "OK",
    lastUpdate: new Date(),
    connectionMode: "cloud",
  });
  const [manualOverrides, setManualOverrides] = useState<ManualOverride[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(generateMockSensorData());
      setDeviceStatus((prev) => ({
        ...prev,
        lastUpdate: new Date(),
        foggerOn: Math.random() > 0.7,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Check and expire manual overrides
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setManualOverrides((prev) =>
        prev.filter((override) => !override.expiresAt || override.expiresAt > now)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleManualControl = useCallback(
    (device: ManualOverride["device"]) => {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      setManualOverrides((prev) => {
        const existing = prev.find((o) => o.device === device);
        if (existing) {
          return prev.filter((o) => o.device !== device);
        }
        return [...prev, { device, active: true, expiresAt }];
      });

      // Update device status
      setDeviceStatus((prev) => {
        const key = device === "fogger" ? "foggerOn" : 
                   device === "exhaustFan" ? "exhaustFanOn" : "circulationFanOn";
        return { ...prev, [key]: !prev[key] };
      });
    },
    []
  );

  const getOverrideTimeRemaining = useCallback(
    (device: ManualOverride["device"]) => {
      const override = manualOverrides.find((o) => o.device === device);
      if (!override?.expiresAt) return null;
      
      const remaining = Math.max(0, override.expiresAt.getTime() - Date.now());
      return Math.ceil(remaining / 1000);
    },
    [manualOverrides]
  );

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
    );
  }, []);

  return {
    sensorData,
    deviceStatus,
    manualOverrides,
    alerts,
    toggleManualControl,
    getOverrideTimeRemaining,
    dismissAlert,
  };
};
