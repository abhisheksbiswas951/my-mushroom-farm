import { useState, useCallback, useEffect } from "react";
import { MushroomProfile } from "@/types/mushroom";
import { defaultProfiles } from "@/data/defaultProfiles";
import { esp32Api } from "@/services/esp32Api";

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

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch profiles from ESP32 on mount
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const [esp32Profiles, activeProfile] = await Promise.all([
          esp32Api.getProfiles(),
          esp32Api.getActiveProfile(),
        ]);

        if (esp32Profiles.length > 0) {
          const mappedProfiles = esp32Profiles.map((p) =>
            esp32Api.toMushroomProfile(p)
          );
          setProfiles(mappedProfiles);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedProfiles));
        }

        if (activeProfile) {
          setActiveProfileId(activeProfile.id);
          localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfile.id);
        }

        setError(null);
      } catch (err) {
        // Use cached data on error
        console.log("Using cached profiles");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  // Save to localStorage as backup
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
  }, [activeProfileId]);

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const updateProfile = useCallback(
    async (id: string, updates: Partial<MushroomProfile>) => {
      setIsSyncing(true);
      try {
        // Try to update on ESP32 first
        await esp32Api.updateProfile(id, updates);
        setError(null);
      } catch (err) {
        console.log("ESP32 update failed, updating locally");
      } finally {
        setIsSyncing(false);
      }

      // Always update local state
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    []
  );

  const createProfile = useCallback(
    async (profile: Omit<MushroomProfile, "id">) => {
      setIsSyncing(true);
      let newProfile: MushroomProfile;

      try {
        // Try to create on ESP32
        const esp32Profile = await esp32Api.createProfile({
          ...profile,
          isCustom: true,
        });
        newProfile = esp32Api.toMushroomProfile(esp32Profile);
        setError(null);
      } catch (err) {
        // Create locally if ESP32 fails
        newProfile = {
          ...profile,
          id: `custom_${Date.now()}`,
          isCustom: true,
        };
        console.log("ESP32 create failed, creating locally");
      } finally {
        setIsSyncing(false);
      }

      setProfiles((prev) => [...prev, newProfile]);
      return newProfile;
    },
    []
  );

  const duplicateProfile = useCallback(
    async (id: string) => {
      const original = profiles.find((p) => p.id === id);
      if (!original) return null;

      const duplicateData: Omit<MushroomProfile, "id"> = {
        ...original,
        name: `${original.name} (Copy)`,
        isCustom: true,
      };

      return await createProfile(duplicateData);
    },
    [profiles, createProfile]
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      const profile = profiles.find((p) => p.id === id);
      if (!profile?.isCustom) return false;

      setIsSyncing(true);
      try {
        await esp32Api.deleteProfile(id);
        setError(null);
      } catch (err) {
        console.log("ESP32 delete failed, deleting locally");
      } finally {
        setIsSyncing(false);
      }

      setProfiles((prev) => prev.filter((p) => p.id !== id));
      if (activeProfileId === id) {
        setActiveProfileId(profiles[0]?.id || "oyster");
      }
      return true;
    },
    [profiles, activeProfileId]
  );

  const selectProfile = useCallback(async (id: string) => {
    setIsSyncing(true);
    try {
      await esp32Api.activateProfile(id);
      setError(null);
    } catch (err) {
      console.log("ESP32 activate failed, activating locally");
    } finally {
      setIsSyncing(false);
    }

    setActiveProfileId(id);
  }, []);

  const resetToDefaults = useCallback(async () => {
    setProfiles(defaultProfiles);
    setActiveProfileId("oyster");

    // Try to sync defaults to ESP32
    try {
      for (const profile of defaultProfiles) {
        await esp32Api.updateProfile(profile.id, profile);
      }
      await esp32Api.activateProfile("oyster");
    } catch (err) {
      console.log("Failed to sync defaults to ESP32");
    }
  }, []);

  const syncWithDevice = useCallback(async () => {
    setIsSyncing(true);
    try {
      const esp32Profiles = await esp32Api.getProfiles();
      if (esp32Profiles.length > 0) {
        const mappedProfiles = esp32Profiles.map((p) =>
          esp32Api.toMushroomProfile(p)
        );
        setProfiles(mappedProfiles);
      }

      const activeProfile = await esp32Api.getActiveProfile();
      if (activeProfile) {
        setActiveProfileId(activeProfile.id);
      }

      setError(null);
    } catch (err) {
      setError("Failed to sync with device");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    profiles,
    activeProfile,
    activeProfileId,
    isLoading,
    isSyncing,
    error,
    updateProfile,
    createProfile,
    duplicateProfile,
    deleteProfile,
    selectProfile,
    resetToDefaults,
    syncWithDevice,
  };
};
