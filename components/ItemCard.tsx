'use client';

import { useState } from 'react';
import type { Item } from '@/lib/types';
import { getCardColor, getCardRotation, PRIORITY_CONFIG } from '@/lib/types';
import CheckAnimation from './CheckAnimation';

interface ItemCardProps {
  item: Item;
  currentUserId: string;
  currentUserName: string;
  isInSession: boolean;
  sessionId: string | null;
  onCheck: (itemId: string) => void;
  onLock: (itemId: string) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;

  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` ${time}`;
}

export default function ItemCard({
  item,
  currentUserId,
  isInSession,
  sessionId,
  onCheck,
  onLock,
}: ItemCardProps) {
  const [leaving, setLeaving] = useState(false);

  const cardColor = getCardColor(item.id);
  const rotation = getCardRotation(item.id);
  const isLockedByOther = item.is_locked && item.locked_by !== currentUserId;
  const isLockedByMe = item.is_locked && item.locked_by === currentUserId;
  const priorityCfg = PRIORITY_CONFIG[item.priority ?? 'medium'];

  function handleCheck() {
    setLeaving(true);
    onCheck(item.id);
  }

  function handleCardClick() {
    if (isInSession && sessionId && !item.is_locked && !item.is_checked) {
      onLock(item.id);
    }
  }

  return (
    <div
      className={`item-card ${leaving ? 'item-card--leaving' : ''} ${isLockedByOther ? 'item-card--locked' : ''}`}
      style={{
        '--card-color': cardColor,
        '--rotation': `${rotation}deg`,
      } as React.CSSProperties}
      onClick={handleCardClick}
    >
      {isLockedByOther && (
        <div className="item-lock-badge" title={`${item.locked_by_name} is looking at this`}>🔒</div>
      )}
      {isLockedByMe && (
        <div className="item-lock-badge item-lock-badge--mine" title="You are looking at this">👀</div>
      )}

      <div className="item-card-body">
        <CheckAnimation
          checked={item.is_checked}
          onCheck={handleCheck}
          disabled={isLockedByOther}
        />
        <div className="item-card-content">
          <div className="item-name-row">
            <span className={`item-name ${item.is_checked ? 'item-name--checked' : ''}`}>
              {item.name}
            </span>
            {item.quantity && (
              <span className="item-qty-badge">{item.quantity}</span>
            )}
          </div>
          {item.note && <span className="item-note">{item.note}</span>}
        </div>
      </div>

      <div className="item-card-footer">
        <div className="item-footer-left">
          <div className="item-avatar" title={item.requested_by_name ?? 'Unknown'}>
            {item.requested_by_avatar ?? (item.requested_by_name?.substring(0, 2).toUpperCase() ?? '?')}
          </div>
          <span className="item-time">{formatDate(item.created_at)}</span>
        </div>
        <span
          className="item-priority-dot"
          title={priorityCfg.label}
          style={{ background: priorityCfg.color } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
