import { useState, useEffect, useCallback } from "react";
import { esp32Api, ConnectionConfig } from "@/services/esp32Api";

export const useConnection = () => {
  const [config, setConfig] = useState<ConnectionConfig>(esp32Api.getConfig());
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  // Sync connection status periodically
  useEffect(() => {
    const checkStatus = () => {
      const status = esp32Api.getConnectionStatus();
      setIsConnected(status.isConnected);
      setLastError(status.lastError);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateConfig = useCallback((updates: Partial<ConnectionConfig>) => {
    esp32Api.updateConfig(updates);
    setConfig(esp32Api.getConfig());
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true);
    setLastError(null);
    
    try {
      await esp32Api.getStatus();
      const status = esp32Api.getConnectionStatus();
      setIsConnected(status.isConnected);
      setLastError(status.lastError);
      return status.isConnected;
    } catch (error) {
      const status = esp32Api.getConnectionStatus();
      setIsConnected(false);
      setLastError(status.lastError);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const autoDetect = useCallback(async (): Promise<string | null> => {
    setIsAutoDetecting(true);
    setLastError(null);
    
    try {
      const foundIp = await esp32Api.autoDetect();
      if (foundIp) {
        setConfig(esp32Api.getConfig());
        setIsConnected(true);
        return foundIp;
      } else {
        setLastError("No ESP32 device found on network");
        return null;
      }
    } catch (error) {
      setLastError("Auto-detection failed");
      return null;
    } finally {
      setIsAutoDetecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  return {
    config,
    isConnected,
    isConnecting,
    isAutoDetecting,
    lastError,
    updateConfig,
    testConnection,
    autoDetect,
    disconnect,
  };
};
