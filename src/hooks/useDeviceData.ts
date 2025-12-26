import { useState, useEffect, useCallback, useRef } from "react";
import { SensorData, DeviceStatus, ManualOverride, Alert } from "@/types/mushroom";
import { esp32Api } from "@/services/esp32Api";

const POLL_INTERVAL = 5000; // 5 seconds
const MANUAL_OVERRIDE_DURATION = 10 * 60 * 1000; // 10 minutes

export const useDeviceData = () => {
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    humidity1: 0,
    humidity2: 0,
    avgHumidity: 0,
    timestamp: new Date(),
  });

  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    isOnline: false,
    foggerOn: false,
    exhaustFanOn: false,
    circulationFanOn: false,
    waterTankStatus: "OK",
    lastUpdate: new Date(),
    connectionMode: "offline",
  });

  const [manualOverrides, setManualOverrides] = useState<ManualOverride[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all device data
  const fetchDeviceData = useCallback(async () => {
    try {
      // Fetch all data in parallel
      const [statusData, sensorsData, waterData] = await Promise.all([
        esp32Api.getStatus(),
        esp32Api.getSensors(),
        esp32Api.getWater(),
      ]);

      setSensorData(esp32Api.toSensorData(sensorsData));
      setDeviceStatus(esp32Api.toDeviceStatus(statusData, waterData));
      setError(null);

      // Check for alert conditions
      checkAlertConditions(sensorsData, waterData, statusData);
    } catch (err) {
      const connectionStatus = esp32Api.getConnectionStatus();
      setError(connectionStatus.lastError || "Connection failed");
      
      // Use cached data if available
      const cached = esp32Api.getCachedData();
      if (cached.sensors) {
        setSensorData(esp32Api.toSensorData(cached.sensors));
      }
      if (cached.status && cached.water) {
        const status = esp32Api.toDeviceStatus(cached.status, cached.water);
        setDeviceStatus({ ...status, isOnline: false, connectionMode: "offline" });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for alert conditions
  const checkAlertConditions = useCallback(
    (sensors: any, water: any, status: any) => {
      const newAlerts: Alert[] = [];
      const now = new Date();

      if (water.status === "EMPTY") {
        newAlerts.push({
          id: `water_empty_${now.getTime()}`,
          type: "water_empty",
          message: "Water tank is empty!",
          timestamp: now,
          read: false,
          severity: "critical",
        });
      } else if (water.status === "LOW") {
        newAlerts.push({
          id: `water_low_${now.getTime()}`,
          type: "water_low",
          message: "Water tank is running low",
          timestamp: now,
          read: false,
          severity: "warning",
        });
      }

      if (!status.online) {
        newAlerts.push({
          id: `device_offline_${now.getTime()}`,
          type: "device_offline",
          message: "Device is offline",
          timestamp: now,
          read: false,
          severity: "critical",
        });
      }

      // Only add new alerts that don't already exist
      setAlerts((prev) => {
        const existingTypes = new Set(prev.map((a) => a.type));
        const uniqueNewAlerts = newAlerts.filter((a) => !existingTypes.has(a.type));
        return [...prev, ...uniqueNewAlerts];
      });
    },
    []
  );

  // Start polling for data
  useEffect(() => {
    fetchDeviceData();

    pollIntervalRef.current = setInterval(fetchDeviceData, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchDeviceData]);

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
    async (device: ManualOverride["device"]) => {
      const expiresAt = new Date(Date.now() + MANUAL_OVERRIDE_DURATION);

      try {
        // First enable manual mode on ESP32
        await esp32Api.enableManualMode();

        // Determine current state and toggle
        let isCurrentlyOn = false;
        switch (device) {
          case "fogger":
            isCurrentlyOn = deviceStatus.foggerOn;
            await esp32Api.controlFogger(!isCurrentlyOn);
            break;
          case "exhaustFan":
            isCurrentlyOn = deviceStatus.exhaustFanOn;
            await esp32Api.controlExhaust(!isCurrentlyOn);
            break;
          case "circulationFan":
            isCurrentlyOn = deviceStatus.circulationFanOn;
            await esp32Api.controlFan(!isCurrentlyOn);
            break;
        }

        // Update manual overrides
        setManualOverrides((prev) => {
          const existing = prev.find((o) => o.device === device);
          if (existing) {
            return prev.filter((o) => o.device !== device);
          }
          return [...prev, { device, active: true, expiresAt }];
        });

        // Update device status optimistically
        setDeviceStatus((prev) => {
          const key =
            device === "fogger"
              ? "foggerOn"
              : device === "exhaustFan"
              ? "exhaustFanOn"
              : "circulationFanOn";
          return { ...prev, [key]: !prev[key] };
        });

        setError(null);
      } catch (err) {
        setError("Failed to control device");
        console.error("Manual control error:", err);
      }
    },
    [deviceStatus]
  );

  const disableManualMode = useCallback(async () => {
    try {
      await esp32Api.disableManualMode();
      setManualOverrides([]);
      await fetchDeviceData(); // Refresh to get automation state
    } catch (err) {
      setError("Failed to disable manual mode");
    }
  }, [fetchDeviceData]);

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

  const refreshData = useCallback(() => {
    fetchDeviceData();
  }, [fetchDeviceData]);

  return {
    sensorData,
    deviceStatus,
    manualOverrides,
    alerts,
    isLoading,
    error,
    toggleManualControl,
    disableManualMode,
    getOverrideTimeRemaining,
    dismissAlert,
    refreshData,
  };
};
