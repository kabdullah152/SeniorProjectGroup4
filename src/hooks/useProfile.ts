import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  university_id: string | null;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile>({ first_name: null, last_name: null, full_name: null, email: null, university_id: null });
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles_safe" as any)
        .select("full_name, email, university_id")
        .eq("id", session.user.id)
        .single() as { data: { full_name: string | null; email: string | null; university_id: string | null } | null; error: any };

      if (profileData && !error) {
        const fullName = profileData.full_name ?? "";
        const parts = fullName.split(/\s+/);
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ") || "";
        const normalized = {
          first_name: firstName || null,
          last_name: lastName || null,
          full_name: profileData.full_name ?? null,
          email: profileData.email ?? null,
          university_id: profileData.university_id ?? null,
        };
        setProfile(normalized);
        setOriginalProfile(normalized);
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Track changes
  useEffect(() => {
    if (originalProfile) {
      const changed = 
        profile.first_name !== originalProfile.first_name ||
        profile.last_name !== originalProfile.last_name ||
        profile.university_id !== originalProfile.university_id;
      setHasChanges(changed);
    }
  }, [profile, originalProfile]);

  const updateProfile = useCallback((updates: Partial<Profile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  const saveProfile = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      if (!hasChanges) return true;

      const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || null;
      const updates: Record<string, unknown> = {
        full_name: fullName,
        university_id: profile.university_id || null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", session.user.id);

      if (error) {
        console.error("Error saving profile:", error);
        return false;
      }

      // Re-sync original to current so hasChanges resets
      const saved = { ...profile };
      setOriginalProfile(saved);
      setHasChanges(false);
      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      return false;
    }
  }, [profile, hasChanges]);

  return {
    profile,
    isLoading,
    hasChanges,
    updateProfile,
    saveProfile,
    fetchProfile,
  };
};
