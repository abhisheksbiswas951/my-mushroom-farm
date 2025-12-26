import { MushroomProfile } from "@/types/mushroom";
import { cn } from "@/lib/utils";
import { Check, Copy, Trash2, Edit2 } from "lucide-react";

interface ProfileCardProps {
  profile: MushroomProfile;
  isActive: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export const ProfileCard = ({
  profile,
  isActive,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
}: ProfileCardProps) => {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 transition-all duration-300 animate-fade-in",
        isActive
          ? "border-primary/50 glow-primary"
          : "border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <button
          onClick={onSelect}
          className="flex items-center gap-3 text-left flex-1"
        >
          <span className="text-4xl">{profile.icon}</span>
          <div>
            <h3 className="font-bold text-lg">{profile.name}</h3>
            {profile.isCustom && (
              <span className="text-xs text-muted-foreground">Custom</span>
            )}
          </div>
        </button>

        {isActive && (
          <div className="p-2 rounded-full bg-primary text-primary-foreground">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-muted-foreground text-xs mb-1">Humidity</p>
          <p className="font-semibold">
            {profile.minHumidity}-{profile.maxHumidity}%
          </p>
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-muted-foreground text-xs mb-1">Temperature</p>
          <p className="font-semibold">
            {profile.minTemperature}-{profile.maxTemperature}°C
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSelect}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all",
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-foreground"
          )}
        >
          {isActive ? "Active" : "Select"}
        </button>

        <div className="flex gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          {onDelete && profile.isCustom && (
            <button
              onClick={onDelete}
              className="p-2.5 rounded-xl bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
