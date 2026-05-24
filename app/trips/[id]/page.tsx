'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useTrips } from '@/hooks/useTrips';
import { useTripItems } from '@/hooks/useTripItems';
import { useItems } from '@/hooks/useItems';
import QuickAdd from '@/components/QuickAdd';

function getDisplayName(email: string | undefined): string {
  if (!email) return 'Family';
  return email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || email;
}

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.id as string;
  const { user, loading: userLoading } = useUser();
  const { trips, completeTrip } = useTrips();
  const { tripItems, loading: itemsLoading, addItem, checkItem, removeItem } = useTripItems(tripId);
  const { items: mainItems } = useItems();
  const [newItemName, setNewItemName] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) router.push('/login');
  }, [user, userLoading, router]);

  const trip = trips.find((t) => t.id === tripId);

  if (userLoading || !user) {
    return <div className="fridge-loading"><div className="fridge-loading-dot" /></div>;
  }

  if (!trip && !itemsLoading) {
    return (
      <div className="fridge-page">
        <div className="fridge-empty">
          <p className="fridge-empty-text">Trip not found</p>
          <Link href="/trips" className="trips-back">← Back to trips</Link>
        </div>
      </div>
    );
  }

  // Main list items NOT already in this trip
  const tripItemNames = new Set(tripItems.map((i) => i.name.toLowerCase()));
  const pendingMainItems = mainItems.filter((i) => !tripItemNames.has(i.name.toLowerCase()));

  const unchecked = tripItems.filter((i) => !i.is_checked);
  const checked = tripItems.filter((i) => i.is_checked);
  const progress = tripItems.length > 0 ? Math.round((checked.length / tripItems.length) * 100) : 0;

  async function handleAddTyped(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;
    await addItem(newItemName.trim());
    setNewItemName('');
  }

  async function handleAddFromMain(name: string, sourceId: string) {
    await addItem(name, null, sourceId);
  }

  async function handleAddQuick(name: string) {
    await addItem(name);
  }

  async function handleComplete() {
    await completeTrip(tripId);
    router.push('/trips');
  }

  return (
    <div className="fridge-page">
      <header className="fridge-header">
        <div className="fridge-header-left">
          <Link href="/trips" className="trips-back">← Trips</Link>
          <h1 className="fridge-title">{trip?.name ?? '…'}</h1>
        </div>
        {!trip?.is_completed && tripItems.length > 0 && (
          <button className="btn-done-trip" onClick={handleComplete}>
            ✓ Done
          </button>
        )}
      </header>

      {tripItems.length > 0 && (
        <div className="trip-progress-bar-wrap">
          <div className="trip-progress-bar" style={{ width: `${progress}%` }} />
          <span className="trip-progress-label">{checked.length} / {tripItems.length} checked</span>
        </div>
      )}

      <main className="fridge-board">
        {itemsLoading ? (
          <div className="fridge-empty"><div className="fridge-loading-dot" /></div>
        ) : (
          <>
            {/* Trip items — unchecked */}
            {unchecked.length > 0 && (
              <div className="trip-section">
                <div className="trip-section-title">To get</div>
                {unchecked.map((item) => (
                  <div key={item.id} className="trip-item">
                    <button
                      className="trip-check-btn"
                      onClick={() => checkItem(item.id, true)}
                      aria-label="Check off"
                    >
                      <span className="trip-check-circle" />
                    </button>
                    <div className="trip-item-body">
                      <span className="trip-item-name">{item.name}</span>
                      {item.note && <span className="trip-item-note">{item.note}</span>}
                    </div>
                    <button className="trip-remove-btn" onClick={() => removeItem(item.id)} title="Remove">×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Pending items from the main shared list */}
            {pendingMainItems.length > 0 && (
              <div className="trip-section">
                <div className="trip-section-title">📋 From the shared list</div>
                <div className="trip-section-sub">Tap to add to this trip</div>
                <div className="trip-main-chips">
                  {pendingMainItems.map((item) => (
                    <button
                      key={item.id}
                      className="trip-main-chip"
                      onClick={() => handleAddFromMain(item.name, item.id)}
                    >
                      + {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick add common items */}
            <div className="trip-section">
              <div className="trip-section-title">
                <button
                  className="trip-quickadd-toggle"
                  onClick={() => setShowQuick((v) => !v)}
                >
                  ⚡ Common items {showQuick ? '▲' : '▼'}
                </button>
              </div>
              {showQuick && <QuickAdd onAdd={handleAddQuick} currentPriority="medium" />}
            </div>

            {/* Add custom item */}
            <div className="trip-section">
              <form onSubmit={handleAddTyped} className="trip-add-row">
                <input
                  type="text"
                  className="trip-add-input"
                  placeholder="Add a specific item…"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
                {newItemName.trim() && (
                  <button type="submit" className="trip-add-submit">Add</button>
                )}
              </form>
            </div>

            {/* Checked items */}
            {checked.length > 0 && (
              <div className="trip-section">
                <div className="trip-section-title trip-section-title--done">
                  ✓ Got it ({checked.length})
                </div>
                {checked.map((item) => (
                  <div key={item.id} className="trip-item trip-item--checked">
                    <button
                      className="trip-check-btn trip-check-btn--checked"
                      onClick={() => checkItem(item.id, false)}
                      aria-label="Uncheck"
                    >
                      <span className="trip-check-circle trip-check-circle--filled">✓</span>
                    </button>
                    <span className="trip-item-name trip-item-name--checked">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
