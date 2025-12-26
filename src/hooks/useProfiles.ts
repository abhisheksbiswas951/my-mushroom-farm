import { useState, useCallback, useEffect } from "react";
import { MushroomProfile } from "@/types/mushroom";
import { defaultProfiles } from "@/data/defaultProfiles";

const STORAGE_KEY = "mushroom_profiles";
const ACTIVE_PROFILE_KEY = "active_profile";

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<MushroomProfile[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultProfiles;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_PROFILE_KEY) || "oyster";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
  }, [activeProfileId]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const updateProfile = useCallback((id: string, updates: Partial<MushroomProfile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const createProfile = useCallback((profile: Omit<MushroomProfile, "id">) => {
    const newProfile: MushroomProfile = {
      ...profile,
      id: `custom_${Date.now()}`,
      isCustom: true,
    };
    setProfiles((prev) => [...prev, newProfile]);
    return newProfile;
  }, []);

  const duplicateProfile = useCallback((id: string) => {
    const original = profiles.find((p) => p.id === id);
    if (!original) return null;

    const duplicate: MushroomProfile = {
      ...original,
      id: `${original.id}_copy_${Date.now()}`,
      name: `${original.name} (Copy)`,
      isCustom: true,
    };
    setProfiles((prev) => [...prev, duplicate]);
    return duplicate;
  }, [profiles]);

  const deleteProfile = useCallback((id: string) => {
    const profile = profiles.find((p) => p.id === id);
    if (!profile?.isCustom) return false;

    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (activeProfileId === id) {
      setActiveProfileId(profiles[0]?.id || "oyster");
    }
    return true;
  }, [profiles, activeProfileId]);

  const selectProfile = useCallback((id: string) => {
    setActiveProfileId(id);
  }, []);

  const resetToDefaults = useCallback(() => {
    setProfiles(defaultProfiles);
    setActiveProfileId("oyster");
  }, []);

  return {
    profiles,
    activeProfile,
    activeProfileId,
    updateProfile,
    createProfile,
    duplicateProfile,
    deleteProfile,
    selectProfile,
    resetToDefaults,
  };
};
