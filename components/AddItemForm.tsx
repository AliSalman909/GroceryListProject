'use client';

import { useState, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Priority } from '@/lib/types';
import { PRIORITY_CONFIG } from '@/lib/types';
import QuickAdd from './QuickAdd';

interface AddItemFormProps {
  userId: string;
  userName: string;
  userAvatar: string;
  onAdded?: () => void;
}

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

export default function AddItemForm({ userId, userName, userAvatar, onAdded }: AddItemFormProps) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [expanded, setExpanded] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  async function insertItem(itemName: string, itemNote: string | null = null, itemPriority: Priority = priority) {
    const supabase = getSupabaseBrowserClient();
    await supabase.from('items').insert({
      name: itemName.trim(),
      note: itemNote,
      priority: itemPriority,
      requested_by: userId,
      requested_by_name: userName,
      requested_by_avatar: userAvatar,
    });
    onAdded?.();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    await insertItem(name.trim(), note.trim() || null);
    setName('');
    setNote('');
    setPriority('medium');
    setExpanded(false);
    setShowQuickAdd(false);
    setSubmitting(false);
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  function handleQuickAdd(itemName: string) {
    insertItem(itemName);
  }

  return (
    <div className={`add-form-container ${expanded || showQuickAdd ? 'add-form-container--expanded' : ''}`}>
      <form onSubmit={handleSubmit} className="add-form">
        <div className="add-form-row">
          <span className="add-form-pencil" aria-hidden="true">✏️</span>
          <input
            ref={nameRef}
            type="text"
            className="add-form-input"
            placeholder="Add to the list…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setExpanded(true)}
            onKeyDown={handleNameKeyDown}
            autoComplete="off"
          />
          <button
            type="button"
            className={`add-form-quickbtn ${showQuickAdd ? 'add-form-quickbtn--active' : ''}`}
            onClick={() => { setShowQuickAdd((v) => !v); setExpanded(true); }}
            title="Quick add common items"
          >
            ⚡
          </button>
          {name.trim() && (
            <button type="submit" className="add-form-submit" disabled={submitting} aria-label="Add item">
              {submitting ? '…' : '+'}
            </button>
          )}
        </div>

        {expanded && (
          <>
            <div className="add-form-note-row">
              <input
                type="text"
                className="add-form-note"
                placeholder="Any note? (brand, size, etc.)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && (setExpanded(false), setShowQuickAdd(false))}
              />
            </div>
            <div className="add-form-priority-row">
              {PRIORITIES.map((p) => {
                const cfg = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    type="button"
                    className={`priority-pill ${priority === p ? 'priority-pill--active' : ''}`}
                    style={{ '--pill-color': cfg.color, '--pill-bg': cfg.bg, '--pill-border': cfg.border } as React.CSSProperties}
                    onClick={() => setPriority(p)}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {showQuickAdd && (
          <QuickAdd onAdd={handleQuickAdd} currentPriority={priority} />
        )}
      </form>
    </div>
  );
}
