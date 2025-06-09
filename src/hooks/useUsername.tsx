
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUsername() {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUsername();
    } else {
      setUsername(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUsername = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('usernames')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching username:', error);
      } else {
        setUsername(data?.username || null);
      }
    } catch (error) {
      console.error('Error fetching username:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUsername = async (newUsername: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('usernames')
      .insert({ user_id: user.id, username: newUsername })
      .select()
      .single();

    if (error) throw error;
    
    setUsername(newUsername);
    return data;
  };

  const updateUsername = async (newUsername: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('usernames')
      .update({ username: newUsername })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    
    setUsername(newUsername);
    return data;
  };

  const checkUsernameAvailable = async (usernameToCheck: string) => {
    const { data, error } = await supabase
      .from('usernames')
      .select('username')
      .eq('username', usernameToCheck)
      .single();

    if (error && error.code === 'PGRST116') {
      return true; // Username is available
    }
    
    return false; // Username is taken
  };

  return {
    username,
    loading,
    createUsername,
    updateUsername,
    checkUsernameAvailable,
    refetch: fetchUsername
  };
}

export async function getUserIdByUsername(username: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('usernames')
    .select('user_id')
    .eq('username', username)
    .single();

  if (error || !data) return null;
  return data.user_id;
}

export async function getUsernameByUserId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('usernames')
    .select('username')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.username;
}
