import { SensorData, DeviceStatus, MushroomProfile, ManualOverride } from "@/types/mushroom";

// API Response types matching ESP32 endpoints
export interface ESP32StatusResponse {
  online: boolean;
  fogger: boolean;
  exhaustFan: boolean;
  circulationFan: boolean;
  mode: "auto" | "manual";
  lastUpdate: string;
}

export interface ESP32SensorsResponse {
  temperature: number;
  humidity1: number;
  humidity2: number;
  avgHumidity: number;
  timestamp: string;
}

export interface ESP32WaterResponse {
  status: "OK" | "LOW" | "EMPTY";
  level?: number;
}

export interface ESP32ProfileResponse {
  id: string;
  name: string;
  icon: string;
  minHumidity: number;
  maxHumidity: number;
  minTemperature: number;
  maxTemperature: number;
  freshAirInterval: number;
  freshAirDuration: number;
  foggerMaxOnTime: number;
  isCustom: boolean;
}

export interface ESP32ManualResponse {
  enabled: boolean;
  expiresAt: string | null;
  devices: {
    fogger: boolean;
    exhaustFan: boolean;
    circulationFan: boolean;
  };
}

export interface ConnectionConfig {
  ipAddress: string;
  port: number;
  authToken: string;
  autoDetect: boolean;
}

const STORAGE_KEY = "esp32_connection_config";
const CACHE_KEY = "esp32_cached_data";
const DEFAULT_TIMEOUT = 5000;

// Default connection config
const defaultConfig: ConnectionConfig = {
  ipAddress: "192.168.4.1", // ESP32 AP mode default
  port: 80,
  authToken: "",
  autoDetect: true,
};

// Cache structure for offline support
interface CachedData {
  sensors: ESP32SensorsResponse | null;
  status: ESP32StatusResponse | null;
  water: ESP32WaterResponse | null;
  profiles: ESP32ProfileResponse[] | null;
  activeProfileId: string | null;
  timestamp: number;
}

class ESP32ApiService {
  private config: ConnectionConfig;
  private cache: CachedData;
  private isConnected: boolean = false;
  private lastError: string | null = null;

  constructor() {
    this.config = this.loadConfig();
    this.cache = this.loadCache();
  }

  private loadConfig(): ConnectionConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
    } catch {
      return defaultConfig;
    }
  }

  private saveConfig(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
  }

  private loadCache(): CachedData {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return {
      sensors: null,
      status: null,
      water: null,
      profiles: null,
      activeProfileId: null,
      timestamp: 0,
    };
  }

  private saveCache(): void {
    this.cache.timestamp = Date.now();
    localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
  }

  private get baseUrl(): string {
    return `http://${this.config.ipAddress}:${this.config.port}`;
  }

  private get headers(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (this.config.authToken) {
      headers["Authorization"] = `Bearer ${this.config.authToken}`;
    }
    return headers;
  }

  // Generic fetch with timeout and error handling
  private async fetchWithTimeout<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = DEFAULT_TIMEOUT
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: this.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        this.lastError = "Unauthorized: Invalid auth token";
        throw new Error(this.lastError);
      }

      if (!response.ok) {
        this.lastError = `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(this.lastError);
      }

      this.isConnected = true;
      this.lastError = null;
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      this.isConnected = false;

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          this.lastError = "Connection timeout";
        } else if (error.message.includes("Failed to fetch")) {
          this.lastError = "Device unreachable";
        } else {
          this.lastError = error.message;
        }
      }
      throw error;
    }
  }

  // Configuration methods
  getConfig(): ConnectionConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ConnectionConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  getConnectionStatus(): { isConnected: boolean; lastError: string | null } {
    return { isConnected: this.isConnected, lastError: this.lastError };
  }

  // Auto-detect ESP32 on common IPs
  async autoDetect(): Promise<string | null> {
    const commonIPs = [
      "192.168.4.1",    // ESP32 AP mode default
      "192.168.1.100",  // Common LAN
      "192.168.1.101",
      "192.168.0.100",
      "192.168.0.101",
    ];

    for (const ip of commonIPs) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`http://${ip}:${this.config.port}/status`, {
          signal: controller.signal,
          headers: this.headers,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          this.config.ipAddress = ip;
          this.saveConfig();
          return ip;
        }
      } catch {
        // Continue to next IP
      }
    }
    return null;
  }

  // ============ READ ENDPOINTS ============

  async getStatus(): Promise<ESP32StatusResponse> {
    try {
      const data = await this.fetchWithTimeout<ESP32StatusResponse>("/status");
      this.cache.status = data;
      this.saveCache();
      return data;
    } catch {
      if (this.cache.status) {
        return this.cache.status;
      }
      throw new Error("No cached status available");
    }
  }

  async getSensors(): Promise<ESP32SensorsResponse> {
    try {
      const data = await this.fetchWithTimeout<ESP32SensorsResponse>("/sensors");
      this.cache.sensors = data;
      this.saveCache();
      return data;
    } catch {
      if (this.cache.sensors) {
        return this.cache.sensors;
      }
      throw new Error("No cached sensor data available");
    }
  }

  async getWater(): Promise<ESP32WaterResponse> {
    try {
      const data = await this.fetchWithTimeout<ESP32WaterResponse>("/water");
      this.cache.water = data;
      this.saveCache();
      return data;
    } catch {
      if (this.cache.water) {
        return this.cache.water;
      }
      throw new Error("No cached water data available");
    }
  }

  async getActiveProfile(): Promise<ESP32ProfileResponse | null> {
    try {
      const data = await this.fetchWithTimeout<ESP32ProfileResponse>("/profile/active");
      this.cache.activeProfileId = data.id;
      this.saveCache();
      return data;
    } catch {
      return null;
    }
  }

  // ============ CONTROL ENDPOINTS ============

  async controlFogger(on: boolean): Promise<void> {
    await this.fetchWithTimeout("/control/fogger", {
      method: "POST",
      body: JSON.stringify({ on }),
    });
  }

  async controlFan(on: boolean): Promise<void> {
    await this.fetchWithTimeout("/control/fan", {
      method: "POST",
      body: JSON.stringify({ on }),
    });
  }

  async controlExhaust(on: boolean): Promise<void> {
    await this.fetchWithTimeout("/control/exhaust", {
      method: "POST",
      body: JSON.stringify({ on }),
    });
  }

  // ============ PROFILE ENDPOINTS ============

  async getProfiles(): Promise<ESP32ProfileResponse[]> {
    try {
      const data = await this.fetchWithTimeout<ESP32ProfileResponse[]>("/profiles");
      this.cache.profiles = data;
      this.saveCache();
      return data;
    } catch {
      if (this.cache.profiles) {
        return this.cache.profiles;
      }
      throw new Error("No cached profiles available");
    }
  }

  async createProfile(profile: Omit<ESP32ProfileResponse, "id">): Promise<ESP32ProfileResponse> {
    return await this.fetchWithTimeout<ESP32ProfileResponse>("/profiles", {
      method: "POST",
      body: JSON.stringify(profile),
    });
  }

  async updateProfile(id: string, profile: Partial<ESP32ProfileResponse>): Promise<ESP32ProfileResponse> {
    return await this.fetchWithTimeout<ESP32ProfileResponse>(`/profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(profile),
    });
  }

  async deleteProfile(id: string): Promise<void> {
    await this.fetchWithTimeout(`/profiles/${id}`, {
      method: "DELETE",
    });
  }

  async activateProfile(id: string): Promise<void> {
    await this.fetchWithTimeout("/profiles/activate", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    this.cache.activeProfileId = id;
    this.saveCache();
  }

  // ============ MANUAL OVERRIDE ENDPOINTS ============

  async enableManualMode(): Promise<ESP32ManualResponse> {
    return await this.fetchWithTimeout<ESP32ManualResponse>("/manual/enable", {
      method: "POST",
    });
  }

  async disableManualMode(): Promise<void> {
    await this.fetchWithTimeout("/manual/disable", {
      method: "POST",
    });
  }

  // ============ UTILITY METHODS ============

  // Convert ESP32 responses to app types
  toSensorData(data: ESP32SensorsResponse): SensorData {
    return {
      temperature: data.temperature,
      humidity1: data.humidity1,
      humidity2: data.humidity2,
      avgHumidity: data.avgHumidity,
      timestamp: new Date(data.timestamp),
    };
  }

  toDeviceStatus(
    status: ESP32StatusResponse,
    water: ESP32WaterResponse
  ): DeviceStatus {
    return {
      isOnline: status.online,
      foggerOn: status.fogger,
      exhaustFanOn: status.exhaustFan,
      circulationFanOn: status.circulationFan,
      waterTankStatus: water.status,
      lastUpdate: new Date(status.lastUpdate),
      connectionMode: this.isConnected ? "local" : "offline",
    };
  }

  toMushroomProfile(data: ESP32ProfileResponse): MushroomProfile {
    return {
      id: data.id,
      name: data.name,
      icon: data.icon,
      minHumidity: data.minHumidity,
      maxHumidity: data.maxHumidity,
      minTemperature: data.minTemperature,
      maxTemperature: data.maxTemperature,
      freshAirInterval: data.freshAirInterval,
      freshAirDuration: data.freshAirDuration,
      foggerMaxOnTime: data.foggerMaxOnTime,
      isCustom: data.isCustom,
    };
  }

  getCachedData(): CachedData {
    return { ...this.cache };
  }

  getCacheAge(): number {
    return Date.now() - this.cache.timestamp;
  }
}

// Singleton instance
export const esp32Api = new ESP32ApiService();
