import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from './useAuth';

/**
 * Usernames live on `profiles.username` (mirrored into the `usernames` table
 * for lookup) — this hook keeps the same ergonomics the app already used.
 */
export function useUsername() {
  const { user, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState<string | null>(profile?.username ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUsername(null);
      setLoading(false);
      return;
    }
    const fromProfile = (profile?.username as string | null) ?? null;
    setUsername(fromProfile);
    setLoading(false);
  }, [user, profile?.username]);

  const checkUsernameAvailable = useCallback(async (candidate: string) => {
    const { data } = await api.get<{ available: boolean; reason: string | null }>(
      `/api/usernames/check/${encodeURIComponent(candidate)}`
    );
    return data?.available ?? false;
  }, []);

  const saveUsername = useCallback(
    async (next: string) => {
      const { data, error } = await api.patch<{ profile: any }>('/api/profile', { username: next });
      if (error) throw Object.assign(new Error(error.message), error);
      setUsername(next);
      await refreshProfile();
      return data?.profile;
    },
    [refreshProfile]
  );

  return {
    username,
    loading,
    createUsername: saveUsername,
    updateUsername: saveUsername,
    checkUsernameAvailable,
    refetch: refreshProfile,
  };
}

export async function getUserIdByUsername(username: string): Promise<string | null> {
  const { data } = await api.get<{ userId: string }>(`/api/usernames/resolve/${encodeURIComponent(username)}`);
  return data?.userId ?? null;
}

export async function getUsernameByUserId(userId: string): Promise<string | null> {
  const { data } = await api.get<any[]>(`/api/db/profiles?f.id=eq.${encodeURIComponent(userId)}&limit=1`);
  const profile = Array.isArray(data) ? data[0] : null;
  return profile?.username ?? null;
}
