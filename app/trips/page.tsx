'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useTrips } from '@/hooks/useTrips';

function getDisplayName(email: string | undefined): string {
  if (!email) return 'Family';
  return email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || email;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TripsPage() {
  const { user, loading: userLoading } = useUser();
  const { trips, loading, createTrip, deleteTrip } = useTrips();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) router.push('/login');
  }, [user, userLoading, router]);

  if (userLoading || !user) {
    return <div className="fridge-loading"><div className="fridge-loading-dot" /></div>;
  }

  const displayName = getDisplayName(user.email);
  const activeTrips = trips.filter((t) => !t.is_completed);
  const completedTrips = trips.filter((t) => t.is_completed);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    const trip = await createTrip(newName.trim(), user!.id, displayName);
    setCreating(false);
    setNewName('');
    setShowCreate(false);
    if (trip) router.push(`/trips/${trip.id}`);
  }

  return (
    <div className="fridge-page">
      <header className="fridge-header">
        <div className="fridge-header-left">
          <Link href="/home" className="trips-back">← List</Link>
          <h1 className="fridge-title">My Trips</h1>
        </div>
        <button className="btn-shop" onClick={() => setShowCreate((v) => !v)}>
          + New Trip
        </button>
      </header>

      {showCreate && (
        <div className="trip-create-card">
          <form onSubmit={handleCreate} className="trip-create-form">
            <input
              type="text"
              className="trip-create-input"
              placeholder="Trip name (e.g. Carrefour run, Weekly shop)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <button type="submit" className="trip-create-submit" disabled={!newName.trim() || creating}>
              {creating ? '…' : 'Create →'}
            </button>
          </form>
        </div>
      )}

      <main className="fridge-board">
        {loading ? (
          <div className="fridge-empty"><div className="fridge-loading-dot" /></div>
        ) : trips.length === 0 && !showCreate ? (
          <div className="fridge-empty">
            <p className="fridge-empty-text">No trips yet</p>
            <p className="fridge-empty-sub">Tap "+ New Trip" to plan a shopping run</p>
          </div>
        ) : (
          <>
            {activeTrips.length > 0 && (
              <div className="trips-section">
                <div className="trips-section-title">Active</div>
                <div className="trips-list">
                  {activeTrips.map((trip) => (
                    <Link key={trip.id} href={`/trips/${trip.id}`} className="trip-card">
                      <div className="trip-card-left">
                        <span className="trip-card-icon">🛍️</span>
                        <div>
                          <div className="trip-card-name">{trip.name}</div>
                          <div className="trip-card-meta">
                            {trip.created_by_name} · {formatDate(trip.created_at)}
                          </div>
                        </div>
                      </div>
                      <span className="trip-card-arrow">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {completedTrips.length > 0 && (
              <div className="trips-section">
                <div className="trips-section-title">Completed</div>
                <div className="trips-list">
                  {completedTrips.map((trip) => (
                    <div key={trip.id} className="trip-card trip-card--done">
                      <div className="trip-card-left">
                        <span className="trip-card-icon">✅</span>
                        <div>
                          <div className="trip-card-name">{trip.name}</div>
                          <div className="trip-card-meta">
                            {trip.created_by_name} · {formatDate(trip.created_at)}
                          </div>
                        </div>
                      </div>
                      <button
                        className="trip-delete-btn"
                        onClick={() => deleteTrip(trip.id)}
                        title="Delete trip"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
