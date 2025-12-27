import { useState, useCallback, useEffect } from "react";
import { MushroomProfile } from "@/types/mushroom";
import { defaultProfiles } from "@/data/defaultProfiles";
import { esp32Api } from "@/services/esp32Api";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useProfiles = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<MushroomProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("oyster");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Convert database profile to MushroomProfile
  const fromDbProfile = (dbProfile: any): MushroomProfile => ({
    id: dbProfile.id,
    name: dbProfile.name,
    icon: dbProfile.type === 'oyster' ? '🦪' : dbProfile.type === 'button' ? '🍄' : dbProfile.type === 'milky' ? '🥛' : '🍄',
    minHumidity: Number(dbProfile.humidity_min),
    maxHumidity: Number(dbProfile.humidity_max),
    minTemperature: Number(dbProfile.temperature_min),
    maxTemperature: Number(dbProfile.temperature_max),
    freshAirInterval: dbProfile.fresh_air_interval,
    freshAirDuration: dbProfile.fresh_air_duration,
    foggerMaxOnTime: dbProfile.fogger_max_on_time,
    isCustom: !dbProfile.is_default,
  });

  // Convert MushroomProfile to database format
  const toDbProfile = (profile: MushroomProfile, userId: string) => ({
    user_id: userId,
    name: profile.name,
    type: profile.id.toLowerCase().replace(/[^a-z]/g, '') || 'custom',
    is_default: !profile.isCustom,
    humidity_min: profile.minHumidity,
    humidity_max: profile.maxHumidity,
    temperature_min: profile.minTemperature,
    temperature_max: profile.maxTemperature,
    fresh_air_interval: profile.freshAirInterval,
    fresh_air_duration: profile.freshAirDuration,
    fogger_max_on_time: profile.foggerMaxOnTime,
  });

  // Fetch profiles from database
  const fetchProfiles = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('mushroom_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        const mappedProfiles = data.map(fromDbProfile);
        setProfiles(mappedProfiles);
        
        // Find active profile
        const activeDb = data.find(p => p.is_active);
        if (activeDb) {
          setActiveProfileId(activeDb.id);
        } else {
          setActiveProfileId(data[0].id);
        }
      } else {
        // No profiles - create defaults for this user
        await initializeDefaultProfiles();
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
      setError('Failed to load profiles');
      // Fallback to defaults
      setProfiles(defaultProfiles);
      setActiveProfileId('oyster');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initialize default profiles for new user
  const initializeDefaultProfiles = async () => {
    if (!user) return;

    try {
      const defaultData = defaultProfiles.map((profile, index) => ({
        user_id: user.id,
        name: profile.name,
        type: profile.id,
        is_default: true,
        humidity_min: profile.minHumidity,
        humidity_max: profile.maxHumidity,
        temperature_min: profile.minTemperature,
        temperature_max: profile.maxTemperature,
        fresh_air_interval: profile.freshAirInterval,
        fresh_air_duration: profile.freshAirDuration,
        fogger_max_on_time: profile.foggerMaxOnTime,
        is_active: index === 0, // First one is active
      }));

      const { data, error: insertError } = await supabase
        .from('mushroom_profiles')
        .insert(defaultData)
        .select();

      if (insertError) throw insertError;

      if (data) {
        const mappedProfiles = data.map(fromDbProfile);
        setProfiles(mappedProfiles);
        setActiveProfileId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to initialize profiles:', err);
      setProfiles(defaultProfiles);
      setActiveProfileId('oyster');
    }
  };

  // Fetch on user change
  useEffect(() => {
    if (user) {
      fetchProfiles();
    } else {
      setProfiles([]);
      setActiveProfileId('');
      setIsLoading(false);
    }
  }, [user, fetchProfiles]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const updateProfile = useCallback(
    async (id: string, updates: Partial<MushroomProfile>) => {
      if (!user) return;

      setIsSyncing(true);
      try {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.minHumidity !== undefined) dbUpdates.humidity_min = updates.minHumidity;
        if (updates.maxHumidity !== undefined) dbUpdates.humidity_max = updates.maxHumidity;
        if (updates.minTemperature !== undefined) dbUpdates.temperature_min = updates.minTemperature;
        if (updates.maxTemperature !== undefined) dbUpdates.temperature_max = updates.maxTemperature;
        if (updates.freshAirInterval !== undefined) dbUpdates.fresh_air_interval = updates.freshAirInterval;
        if (updates.freshAirDuration !== undefined) dbUpdates.fresh_air_duration = updates.freshAirDuration;
        if (updates.foggerMaxOnTime !== undefined) dbUpdates.fogger_max_on_time = updates.foggerMaxOnTime;

        const { error: updateError } = await supabase
          .from('mushroom_profiles')
          .update(dbUpdates)
          .eq('id', id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Try ESP32 sync
        try {
          await esp32Api.updateProfile(id, updates);
        } catch {
          console.log("ESP32 sync skipped");
        }

        setProfiles((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
        );
        setError(null);
      } catch (err) {
        console.error('Failed to update profile:', err);
        setError('Failed to update profile');
      } finally {
        setIsSyncing(false);
      }
    },
    [user]
  );

  const createProfile = useCallback(
    async (profile: Omit<MushroomProfile, "id">) => {
      if (!user) throw new Error('Not authenticated');

      setIsSyncing(true);
      try {
        const { data, error: insertError } = await supabase
          .from('mushroom_profiles')
          .insert({
            user_id: user.id,
            name: profile.name,
            type: 'custom',
            is_default: false,
            humidity_min: profile.minHumidity,
            humidity_max: profile.maxHumidity,
            temperature_min: profile.minTemperature,
            temperature_max: profile.maxTemperature,
            fresh_air_interval: profile.freshAirInterval,
            fresh_air_duration: profile.freshAirDuration,
            fogger_max_on_time: profile.foggerMaxOnTime,
            is_active: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const newProfile = fromDbProfile(data);
        setProfiles((prev) => [...prev, newProfile]);
        setError(null);
        return newProfile;
      } catch (err) {
        console.error('Failed to create profile:', err);
        setError('Failed to create profile');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [user]
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
      if (!user) return false;

      const profile = profiles.find((p) => p.id === id);
      if (!profile?.isCustom) return false;

      setIsSyncing(true);
      try {
        const { error: deleteError } = await supabase
          .from('mushroom_profiles')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        setProfiles((prev) => prev.filter((p) => p.id !== id));
        if (activeProfileId === id && profiles.length > 1) {
          const remaining = profiles.filter(p => p.id !== id);
          if (remaining.length > 0) {
            await selectProfile(remaining[0].id);
          }
        }
        setError(null);
        return true;
      } catch (err) {
        console.error('Failed to delete profile:', err);
        setError('Failed to delete profile');
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [user, profiles, activeProfileId]
  );

  const selectProfile = useCallback(async (id: string) => {
    if (!user) return;

    setIsSyncing(true);
    try {
      // Deactivate all profiles first
      await supabase
        .from('mushroom_profiles')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Activate selected profile
      const { error: updateError } = await supabase
        .from('mushroom_profiles')
        .update({ is_active: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Try ESP32 sync
      try {
        await esp32Api.activateProfile(id);
      } catch {
        console.log("ESP32 sync skipped");
      }

      setActiveProfileId(id);
      setError(null);
    } catch (err) {
      console.error('Failed to activate profile:', err);
      setError('Failed to activate profile');
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  const resetToDefaults = useCallback(async () => {
    if (!user) return;

    setIsSyncing(true);
    try {
      // Delete all existing profiles
      await supabase
        .from('mushroom_profiles')
        .delete()
        .eq('user_id', user.id);

      // Recreate defaults
      await initializeDefaultProfiles();
      setError(null);
    } catch (err) {
      console.error('Failed to reset profiles:', err);
      setError('Failed to reset profiles');
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  const syncWithDevice = useCallback(async () => {
    setIsSyncing(true);
    try {
      const esp32Profiles = await esp32Api.getProfiles();
      if (esp32Profiles.length > 0) {
        console.log('ESP32 profiles synced:', esp32Profiles.length);
      }

      const activeProfileResult = await esp32Api.getActiveProfile();
      if (activeProfileResult) {
        console.log('ESP32 active profile:', activeProfileResult.id);
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
