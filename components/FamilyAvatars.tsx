'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ShoppingSession } from '@/lib/types';

interface PresenceState {
  [key: string]: { user_id: string; user_name: string; online_at: string }[];
}

interface FamilyAvatarsProps {
  currentUserId: string;
  currentUserName: string;
  session: ShoppingSession | null;
}

const AVATAR_COLORS: Record<string, string> = {
  default0: '#dc2626',
  default1: '#7c3aed',
  default2: '#0369a1',
  default3: '#059669',
  default4: '#d97706',
};

function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const colors = Object.values(AVATAR_COLORS);
  return colors[Math.abs(hash) % colors.length];
}

export default function FamilyAvatars({ currentUserId, currentUserName, session }: FamilyAvatarsProps) {
  const [onlineUsers, setOnlineUsers] = useState<{ user_id: string; user_name: string }[]>([]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase.channel('presence', { config: { presence: { key: currentUserId } } });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as PresenceState;
        const users: { user_id: string; user_name: string }[] = [];
        Object.values(state).forEach((presences) => {
          presences.forEach((p) => {
            if (!users.find((u) => u.user_id === p.user_id)) {
              users.push({ user_id: p.user_id, user_name: p.user_name });
            }
          });
        });
        setOnlineUsers(users);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId, user_name: currentUserName, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, currentUserName]);

  if (onlineUsers.length === 0) return null;

  return (
    <div className="family-avatars">
      {onlineUsers.map((u) => {
        const initials = u.user_name.substring(0, 2).toUpperCase();
        const isShopper = session?.shopper_id === u.user_id;
        const color = getAvatarColor(u.user_id);
        return (
          <div key={u.user_id} className="avatar-wrap" title={u.user_name}>
            <div
              className="avatar"
              style={{ '--avatar-color': color } as React.CSSProperties}
            >
              {initials}
            </div>
            {isShopper && <span className="avatar-badge">🛒</span>}
          </div>
        );
      })}
    </div>
  );
}
