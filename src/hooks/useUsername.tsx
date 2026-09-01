import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/api";
import { useAuth } from "./useAuth";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/;

export function useUsername() {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchUsername = useCallback(async () => {
    if (!user) { setUsername(null); setError(null); setLoading(false); return; }
    setLoading(true);
    setError(null);
    const result = await supabase.from("usernames").select("username").eq("user_id", user.id).single();
    if (!result.error || result.error.code === "PGRST116") setUsername(result.data?.username || null);
    else setError(result.error.message);
    setLoading(false);
  }, [user]);
  useEffect(() => { void fetchUsername(); }, [fetchUsername]);
  const normalise = (value: string) => { const next = value.trim().toLowerCase(); if (!USERNAME_PATTERN.test(next)) throw new Error("Username must be 3–30 characters and use only letters, numbers, hyphens, or underscores."); return next; };
  const createUsername = async (value: string) => { if (!user) throw new Error("User not authenticated"); const next = normalise(value); const result = await supabase.from("usernames").insert({ user_id: user.id, username: next }).select().single(); if (result.error) throw new Error(result.error.message); setError(null); setUsername(next); return result.data; };
  const updateUsername = async (value: string) => { if (!user) throw new Error("User not authenticated"); const next = normalise(value); const existing = await supabase.from("usernames").select("id").eq("user_id", user.id).single(); if (existing.error && existing.error.code !== "PGRST116") throw new Error(existing.error.message); const result = existing.data ? await supabase.from("usernames").update({ username: next }).eq("user_id", user.id).select().single() : await supabase.from("usernames").insert({ user_id: user.id, username: next }).select().single(); if (result.error) throw new Error(result.error.message); setError(null); setUsername(next); return result.data; };
  const checkUsernameAvailable = async (value: string) => {
    const next = value.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(next)) return false;
    const result = await supabase.from("usernames").select("id").eq("username", next).single();
    if (result.error && result.error.code !== "PGRST116") throw new Error(result.error.message);
    return result.error?.code === "PGRST116";
  };
  return { username, loading, error, createUsername, updateUsername, checkUsernameAvailable, refetch: fetchUsername };
}

export async function getUserIdByUsername(username: string): Promise<string | null> { const result = await supabase.from("usernames").select("user_id").eq("username", username.trim().toLowerCase()).single(); if (result.error && result.error.code !== "PGRST116") throw new Error(result.error.message); return result.data?.user_id ?? null; }
export async function getUsernameByUserId(userId: string): Promise<string | null> {
  const result = await supabase.from("usernames").select("username").eq("user_id", userId).single();
  if (result.error?.code === "PGRST116") return null;
  if (result.error) throw new Error(result.error.message);
  return result.data?.username ?? null;
}

export async function getUsernamesByUserIds(userIds: string[]): Promise<Record<string, string>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))].slice(0, 100);
  if (!uniqueIds.length) return {};
  const result = await supabase.from("usernames").select("user_id, username").in("user_id", uniqueIds);
  if (result.error) throw new Error(result.error.message);
  return Object.fromEntries((result.data ?? []).map((row) => [row.user_id, row.username]));
}
