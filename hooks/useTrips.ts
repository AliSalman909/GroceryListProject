'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Trip } from '@/lib/types';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });
    setTrips(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTrips();
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel('trips-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, fetchTrips)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTrips]);

  const createTrip = useCallback(async (
    name: string, userId: string, userName: string
  ): Promise<{ trip: Trip | null; error: string | null }> => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('trips')
      .insert({ name: name.trim(), created_by: userId, created_by_name: userName })
      .select()
      .single();
    if (!error && data) {
      setTrips((prev) => [data, ...prev]);
      return { trip: data, error: null };
    }
    return { trip: null, error: error?.message ?? 'Failed to create trip' };
  }, []);

  const completeTrip = useCallback(async (tripId: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from('trips')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', tripId);
  }, []);

  const deleteTrip = useCallback(async (tripId: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase.from('trips').delete().eq('id', tripId);
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
  }, []);

  return { trips, loading, createTrip, completeTrip, deleteTrip, refetch: fetchTrips };
}
