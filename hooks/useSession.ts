'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ShoppingSession } from '@/lib/types';

export function useSession() {
  const [session, setSession] = useState<ShoppingSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveSession = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from('shopping_sessions')
      .select('*')
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setSession(data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActiveSession();

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel('sessions-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_sessions' },
        () => {
          fetchActiveSession();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveSession]);

  const startSession = useCallback(
    async (userId: string, userName: string): Promise<ShoppingSession | null> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('shopping_sessions')
        .insert({ shopper_id: userId, shopper_name: userName, is_active: true })
        .select()
        .single();

      if (!error && data) {
        setSession(data);
        return data;
      }
      return null;
    },
    []
  );

  const endSession = useCallback(
    async (sessionId: string) => {
      const supabase = getSupabaseBrowserClient();

      // Unlock all items in session
      await supabase
        .from('items')
        .update({ is_locked: false, locked_by: null, locked_by_name: null, shopping_session_id: null })
        .eq('shopping_session_id', sessionId);

      await supabase
        .from('shopping_sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('id', sessionId);

      setSession(null);
    },
    []
  );

  return { session, loading, startSession, endSession };
}
