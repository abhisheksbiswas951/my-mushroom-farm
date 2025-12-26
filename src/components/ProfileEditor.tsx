import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { MushroomProfile } from "@/types/mushroom";
import { cn } from "@/lib/utils";

interface ProfileEditorProps {
  profile: MushroomProfile;
  onSave: (profile: MushroomProfile) => void;
  onCancel: () => void;
  isCreating?: boolean;
}

const EMOJI_OPTIONS = ["🍄", "🦪", "🥛", "🌰", "🧫", "🌱", "🍃", "✨"];

export const ProfileEditor = ({
  profile,
  onSave,
  onCancel,
  isCreating = false,
}: ProfileEditorProps) => {
  const [formData, setFormData] = useState(profile);

  const handleChange = (field: keyof MushroomProfile, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Cancel</span>
          </button>
          <h1 className="font-bold text-lg">
            {isCreating ? "New Profile" : "Edit Profile"}
          </h1>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 text-primary font-semibold"
          >
            <Save className="w-5 h-5" />
            <span>Save</span>
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 pb-8">
        {/* Name & Icon */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold">Basic Info</h3>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Profile Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter profile name"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleChange("icon", emoji)}
                  className={cn(
                    "text-3xl p-2 rounded-xl transition-all",
                    formData.icon === emoji
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Humidity Settings */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold">Humidity (%)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Minimum
              </label>
              <input
                type="number"
                value={formData.minHumidity}
                onChange={(e) => handleChange("minHumidity", Number(e.target.value))}
                min={0}
                max={100}
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Maximum
              </label>
              <input
                type="number"
                value={formData.maxHumidity}
                onChange={(e) => handleChange("maxHumidity", Number(e.target.value))}
                min={0}
                max={100}
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Temperature Settings */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold">Temperature (°C)</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Minimum
              </label>
              <input
                type="number"
                value={formData.minTemperature}
                onChange={(e) => handleChange("minTemperature", Number(e.target.value))}
                min={0}
                max={50}
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Maximum
              </label>
              <input
                type="number"
                value={formData.maxTemperature}
                onChange={(e) => handleChange("maxTemperature", Number(e.target.value))}
                min={0}
                max={50}
                className="w-full bg-muted rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Automation Settings */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold">Automation</h3>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Fresh Air Interval (minutes)
            </label>
            <input
              type="number"
              value={formData.freshAirInterval}
              onChange={(e) => handleChange("freshAirInterval", Number(e.target.value))}
              min={1}
              max={240}
              className="w-full bg-muted rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Fresh Air Duration (seconds)
            </label>
            <input
              type="number"
              value={formData.freshAirDuration}
              onChange={(e) => handleChange("freshAirDuration", Number(e.target.value))}
              min={10}
              max={600}
              className="w-full bg-muted rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Fogger Max ON Time (seconds)
            </label>
            <input
              type="number"
              value={formData.foggerMaxOnTime}
              onChange={(e) => handleChange("foggerMaxOnTime", Number(e.target.value))}
              min={30}
              max={900}
              className="w-full bg-muted rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </form>
    </div>
  );
};
