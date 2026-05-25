'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { useItems } from '@/hooks/useItems';
import { useSession } from '@/hooks/useSession';
import ItemCard from '@/components/ItemCard';
import AddItemForm from '@/components/AddItemForm';
import ShoppingBanner from '@/components/ShoppingBanner';
import CatalogPanel from '@/components/CatalogPanel';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { PRIORITY_CONFIG } from '@/lib/types';
import type { Priority, Item } from '@/lib/types';

function getDisplayName(email: string | undefined): string {
  if (!email) return 'Family';
  return email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || email;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const PRIORITY_ORDER: Priority[] = ['high', 'medium', 'low'];

function groupByPriority(items: Item[]): Record<Priority, Item[]> {
  return {
    high:   items.filter((i) => (i.priority ?? 'medium') === 'high'),
    medium: items.filter((i) => (i.priority ?? 'medium') === 'medium'),
    low:    items.filter((i) => (i.priority ?? 'medium') === 'low'),
  };
}

export default function HomePage() {
  const { user, loading: userLoading } = useUser();
  const { items, loading: itemsLoading, checkItem, lockItem } = useItems();
  const { session, startSession, endSession } = useSession();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) router.push('/login');
  }, [user, userLoading, router]);

  if (userLoading || !user) {
    return <div className="fridge-loading"><div className="fridge-loading-dot" /></div>;
  }

  const displayName = getDisplayName(user.email);
  const initials = getInitials(displayName);
  const userAvatar = initials;
  const isInSession = !!session;
  const isShopper = session?.shopper_id === user.id;
  const grouped = groupByPriority(items);
  const hasItems = items.length > 0;

  async function handleStartShopping() { await startSession(user!.id, displayName); }
  async function handleEndShopping() { if (session) await endSession(session.id); }
  async function handleCheck(itemId: string) { await checkItem(itemId, user!.id, displayName); }
  async function handleLock(itemId: string) {
    if (session) await lockItem(itemId, user!.id, displayName, session.id);
  }
  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="fridge-page">
      {session && (
        <ShoppingBanner session={session} currentUserId={user.id} onEndSession={handleEndShopping} />
      )}

      <header className="fridge-header">
        <div className="fridge-header-left">
          <h1 className="fridge-title">Family Market</h1>
        </div>
        <div className="fridge-header-right">
          <Link href="/trips" className="btn-trips">🛍️ Trips</Link>
          {!isInSession && (
            <button className="btn-shop" onClick={handleStartShopping}>🛒 Shop</button>
          )}
          {/* Mobile catalog toggle */}
          <button
            className={`btn-catalog-toggle ${catalogOpen ? 'btn-catalog-toggle--active' : ''}`}
            onClick={() => setCatalogOpen((v) => !v)}
            title="Product catalog"
          >
            📦
          </button>
          <button className="btn-signout" onClick={handleSignOut} title="Sign out">👋</button>
        </div>
      </header>

      <div className="fridge-content">
        <main className="fridge-board">
          {itemsLoading ? (
            <div className="fridge-empty"><div className="fridge-loading-dot" /></div>
          ) : !hasItems ? (
            <div className="fridge-empty">
              <p className="fridge-empty-text">The list is empty 🎉</p>
              <p className="fridge-empty-sub">Add something below</p>
            </div>
          ) : (
            <div className="priority-sections">
              {PRIORITY_ORDER.map((p) => {
                const sectionItems = grouped[p];
                if (sectionItems.length === 0) return null;
                const cfg = PRIORITY_CONFIG[p];
                return (
                  <div
                    key={p}
                    className="priority-section"
                    style={{ '--section-bg': cfg.bg, '--section-border': cfg.border, '--section-color': cfg.color } as React.CSSProperties}
                  >
                    <div className="priority-section-header">
                      <span className="priority-section-emoji">{cfg.emoji}</span>
                      <span className="priority-section-label">{cfg.label}</span>
                      <span className="priority-section-count">{sectionItems.length}</span>
                    </div>
                    <div className="items-grid">
                      {sectionItems.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          currentUserId={user.id}
                          currentUserName={displayName}
                          isInSession={isInSession && isShopper}
                          sessionId={session?.id ?? null}
                          onCheck={handleCheck}
                          onLock={handleLock}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Right panel — always visible on desktop, toggled on mobile */}
        <aside className={`catalog-aside ${catalogOpen ? 'catalog-aside--open' : ''}`}>
          <CatalogPanel
            userId={user.id}
            userName={displayName}
            userAvatar={userAvatar}
          />
        </aside>
      </div>

      <footer className="fridge-footer">
        <AddItemForm userId={user.id} userName={displayName} userAvatar={userAvatar} />
      </footer>
    </div>
  );
}
