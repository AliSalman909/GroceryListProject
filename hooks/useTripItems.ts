'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { TripItem } from '@/lib/types';

export function useTripItems(tripId: string) {
  const [tripItems, setTripItems] = useState<TripItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from('trip_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });
    setTripItems(data ?? []);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    fetchItems();
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`trip-items-${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_items', filter: `trip_id=eq.${tripId}` },
        (payload: RealtimePostgresChangesPayload<TripItem>) => {
          if (payload.eventType === 'INSERT') {
            setTripItems((prev) => [...prev, payload.new as TripItem]);
          } else if (payload.eventType === 'UPDATE') {
            setTripItems((prev) => prev.map((i) => (i.id === payload.new.id ? payload.new as TripItem : i)));
          } else if (payload.eventType === 'DELETE') {
            setTripItems((prev) => prev.filter((i) => i.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchItems, tripId]);

  const addItem = useCallback(async (name: string, note: string | null = null, sourceItemId: string | null = null) => {
    const supabase = getSupabaseBrowserClient();
    await supabase.from('trip_items').insert({
      trip_id: tripId,
      name: name.trim(),
      note,
      source_item_id: sourceItemId,
    });
  }, [tripId]);

  const checkItem = useCallback(async (itemId: string, checked: boolean) => {
    // Optimistic
    setTripItems((prev) =>
      prev.map((i) => i.id === itemId ? { ...i, is_checked: checked, checked_at: checked ? new Date().toISOString() : null } : i)
    );
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from('trip_items')
      .update({ is_checked: checked, checked_at: checked ? new Date().toISOString() : null })
      .eq('id', itemId);
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    setTripItems((prev) => prev.filter((i) => i.id !== itemId));
    const supabase = getSupabaseBrowserClient();
    await supabase.from('trip_items').delete().eq('id', itemId);
  }, []);

  return { tripItems, loading, addItem, checkItem, removeItem };
}
