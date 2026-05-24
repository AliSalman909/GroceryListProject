'use client';

import type { ShoppingSession } from '@/lib/types';

interface ShoppingBannerProps {
  session: ShoppingSession;
  currentUserId: string;
  onEndSession: () => void;
}

export default function ShoppingBanner({ session, currentUserId, onEndSession }: ShoppingBannerProps) {
  const isShopper = session.shopper_id === currentUserId;

  return (
    <div className="shopping-banner">
      <div className="shopping-banner-content">
        <span className="shopping-banner-icon">🛒</span>
        <span className="shopping-banner-text">
          {isShopper ? 'You are' : <strong>{session.shopper_name}</strong>} shopping right now
          {!isShopper && ' — items may be locked'}
        </span>
      </div>
      {isShopper && (
        <button className="shopping-banner-end" onClick={onEndSession}>
          Done shopping
        </button>
      )}
    </div>
  );
}
