export interface MushroomProfile {
  id: string;
  name: string;
  icon: string;
  minHumidity: number;
  maxHumidity: number;
  minTemperature: number;
  maxTemperature: number;
  freshAirInterval: number; // minutes
  freshAirDuration: number; // seconds
  foggerMaxOnTime: number; // seconds
  isCustom: boolean;
}

export interface SensorData {
  temperature: number;
  humidity1: number;
  humidity2: number;
  avgHumidity: number;
  timestamp: Date;
}

export interface DeviceStatus {
  isOnline: boolean;
  foggerOn: boolean;
  exhaustFanOn: boolean;
  circulationFanOn: boolean;
  waterTankStatus: 'OK' | 'LOW' | 'EMPTY';
  lastUpdate: Date;
  connectionMode: 'cloud' | 'local' | 'offline';
}

export interface ManualOverride {
  device: 'fogger' | 'exhaustFan' | 'circulationFan';
  active: boolean;
  expiresAt: Date | null;
}

export interface Alert {
  id: string;
  type: 'humidity_low' | 'humidity_high' | 'temp_low' | 'temp_high' | 'water_low' | 'water_empty' | 'sensor_fail' | 'device_offline';
  message: string;
  timestamp: Date;
  read: boolean;
  severity: 'warning' | 'critical';
}

export interface HistoryDataPoint {
  timestamp: Date;
  temperature: number;
  humidity: number;
  foggerRuntime: number;
  fanRuntime: number;
}
