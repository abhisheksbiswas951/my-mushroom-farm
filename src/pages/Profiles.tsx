import { useState } from "react";
import { Plus } from "lucide-react";
import { ProfileCard } from "@/components/ProfileCard";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useProfiles } from "@/hooks/useProfiles";
import { useDeviceData } from "@/hooks/useDeviceData";
import { ProfileEditor } from "@/components/ProfileEditor";
import { MushroomProfile } from "@/types/mushroom";
import { useToast } from "@/hooks/use-toast";

const Profiles = () => {
  const { deviceStatus } = useDeviceData();
  const {
    profiles,
    activeProfile,
    activeProfileId,
    selectProfile,
    updateProfile,
    createProfile,
    duplicateProfile,
    deleteProfile,
  } = useProfiles();
  const { toast } = useToast();

  const [editingProfile, setEditingProfile] = useState<MushroomProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    setIsCreating(true);
    setEditingProfile({
      id: "",
      name: "New Profile",
      icon: "🍄",
      minHumidity: 75,
      maxHumidity: 90,
      minTemperature: 18,
      maxTemperature: 26,
      freshAirInterval: 60,
      freshAirDuration: 120,
      foggerMaxOnTime: 300,
      isCustom: true,
    });
  };

  const handleSave = (profile: MushroomProfile) => {
    if (isCreating) {
      createProfile(profile);
      toast({
        title: "Profile Created",
        description: `${profile.name} has been added.`,
      });
    } else {
      updateProfile(profile.id, profile);
      toast({
        title: "Profile Updated",
        description: `${profile.name} has been saved.`,
      });
    }
    setEditingProfile(null);
    setIsCreating(false);
  };

  const handleDuplicate = async (id: string) => {
    const newProfile = await duplicateProfile(id);
    if (newProfile) {
      toast({
        title: "Profile Duplicated",
        description: `${newProfile.name} has been created.`,
      });
    }
  };

  const handleDelete = (id: string) => {
    const profile = profiles.find((p) => p.id === id);
    if (deleteProfile(id)) {
      toast({
        title: "Profile Deleted",
        description: `${profile?.name} has been removed.`,
      });
    }
  };

  const handleSelect = (id: string) => {
    selectProfile(id);
    const profile = profiles.find((p) => p.id === id);
    toast({
      title: "Profile Activated",
      description: `Now using ${profile?.name} settings.`,
    });
  };

  if (editingProfile) {
    return (
      <ProfileEditor
        profile={editingProfile}
        onSave={handleSave}
        onCancel={() => {
          setEditingProfile(null);
          setIsCreating(false);
        }}
        isCreating={isCreating}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header deviceStatus={deviceStatus} activeProfile={activeProfile} />

      <main className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Mushroom Profiles</h2>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Select a profile to apply its settings. Changes take effect immediately.
        </p>

        <div className="space-y-4">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isActive={profile.id === activeProfileId}
              onSelect={() => handleSelect(profile.id)}
              onEdit={() => setEditingProfile(profile)}
              onDuplicate={() => handleDuplicate(profile.id)}
              onDelete={() => handleDelete(profile.id)}
            />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profiles;
