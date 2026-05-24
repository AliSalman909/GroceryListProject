'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Item } from '@/lib/types';

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error: fetchError } = await supabase
      .from('items')
      .select('*')
      .eq('is_checked', false)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel('items-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items' },
        (payload: RealtimePostgresChangesPayload<Item>) => {
          if (payload.eventType === 'INSERT') {
            setItems((prev) => [payload.new as Item, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Item;
            if (updated.is_checked) {
              // Remove checked items from the live list after a short delay (for animation)
              setItems((prev) =>
                prev.map((i) => (i.id === updated.id ? updated : i))
              );
              setTimeout(() => {
                setItems((prev) => prev.filter((i) => i.id !== updated.id));
              }, 500);
            } else {
              setItems((prev) =>
                prev.map((i) => (i.id === updated.id ? updated : i))
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  const checkItem = useCallback(
    async (itemId: string, userId: string, userName: string) => {
      // Optimistic update
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, is_checked: true, checked_by: userId, checked_by_name: userName, checked_at: new Date().toISOString() }
            : i
        )
      );
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }, 500);

      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase
        .from('items')
        .update({
          is_checked: true,
          checked_by: userId,
          checked_by_name: userName,
          checked_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (updateError) {
        // Rollback
        fetchItems();
      }
    },
    [fetchItems]
  );

  const lockItem = useCallback(
    async (itemId: string, userId: string, userName: string, sessionId: string) => {
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from('items')
        .update({
          is_locked: true,
          locked_by: userId,
          locked_by_name: userName,
          shopping_session_id: sessionId,
        })
        .eq('id', itemId);
    },
    []
  );

  return { items, loading, error, checkItem, lockItem, refetch: fetchItems };
}
