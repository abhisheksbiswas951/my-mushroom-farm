import { useState } from "react";
import { BarChart3, Download, Calendar } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useDeviceData } from "@/hooks/useDeviceData";
import { useProfiles } from "@/hooks/useProfiles";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Mock historical data
const generateMockHistory = (hours: number) => {
  const data = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      temperature: 22 + Math.random() * 4,
      humidity: 80 + Math.random() * 15,
    });
  }
  return data;
};

const History = () => {
  const { deviceStatus } = useDeviceData();
  const { activeProfile } = useProfiles();
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  const chartData = generateMockHistory(timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720);
  const displayData = timeRange === "24h" ? chartData : chartData.filter((_, i) => i % (timeRange === "7d" ? 7 : 24) === 0);

  const handleExport = () => {
    const csv = [
      "Time,Temperature,Humidity",
      ...chartData.map((d) => `${d.time},${d.temperature.toFixed(1)},${d.humidity.toFixed(1)}`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mushroom-data-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header deviceStatus={deviceStatus} activeProfile={activeProfile} />

      <main className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Data History
          </h2>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(["24h", "7d", "30d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all",
                timeRange === range
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {range === "24h" ? "24 Hours" : range === "7d" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>

        {/* Temperature Chart */}
        <div className="glass rounded-2xl p-5 animate-fade-in">
          <h3 className="font-semibold mb-4">Temperature & Humidity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={false}
                  name="Temp (°C)"
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="hsl(var(--info))"
                  strokeWidth={2}
                  dot={false}
                  name="Humidity (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5 animate-fade-in">
            <p className="text-sm text-muted-foreground mb-1">Avg Temperature</p>
            <p className="text-2xl font-bold">
              {(chartData.reduce((a, b) => a + b.temperature, 0) / chartData.length).toFixed(1)}°C
            </p>
          </div>
          <div className="glass rounded-2xl p-5 animate-fade-in">
            <p className="text-sm text-muted-foreground mb-1">Avg Humidity</p>
            <p className="text-2xl font-bold">
              {(chartData.reduce((a, b) => a + b.humidity, 0) / chartData.length).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Runtime Stats */}
        <div className="glass rounded-2xl p-5 animate-fade-in">
          <h3 className="font-semibold mb-4">Device Runtime ({timeRange})</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Fogger Runtime</span>
              <span className="font-semibold">4h 32m</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Exhaust Fan Runtime</span>
              <span className="font-semibold">8h 15m</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Circulation Fan Runtime</span>
              <span className="font-semibold">12h 45m</span>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default History;
