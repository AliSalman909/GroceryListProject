'use client';

import { useState, useRef, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import type { Priority, Product } from '@/lib/types';
import { PRIORITY_CONFIG } from '@/lib/types';

interface AddItemFormProps {
  userId: string;
  userName: string;
  userAvatar: string;
}

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

function priceLabel(min: number | null, max: number | null): string {
  if (!min && !max) return '';
  if (min && max && min !== max) return ` · ₨${min}–${max}`;
  return ` · ₨${min ?? max}`;
}

export default function AddItemForm({ userId, userName, userAvatar }: AddItemFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const { products } = useProducts();
  const nameRef = useRef<HTMLInputElement>(null);

  // Filter catalog suggestions as user types
  useEffect(() => {
    const q = name.trim().toLowerCase();
    if (q.length < 1) {
      setSuggestions([]);
      setSuggestionOpen(false);
      return;
    }
    const matched = products
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 6);
    setSuggestions(matched);
    setSuggestionOpen(matched.length > 0);
  }, [name, products]);

  function handleOpen() {
    setOpen(true);
    setTimeout(() => nameRef.current?.focus(), 80);
  }

  function handleClose() {
    setOpen(false);
    setName('');
    setQuantity('');
    setPriority('medium');
    setSuggestions([]);
    setSuggestionOpen(false);
  }

  function selectSuggestion(product: Product) {
    setName(product.name);
    setSuggestionOpen(false);
    setTimeout(() => nameRef.current?.focus(), 50);
  }

  async function handleAdd() {
    if (!name.trim() || adding) return;
    setAdding(true);
    setSuggestionOpen(false);

    const supabase = getSupabaseBrowserClient();
    await supabase.from('items').insert({
      name: name.trim(),
      quantity: quantity.trim() || null,
      priority,
      requested_by: userId,
      requested_by_name: userName,
      requested_by_avatar: userAvatar,
      note: null,
    });

    setAdding(false);
    setJustAdded(true);
    setName('');
    setQuantity('');
    // priority stays for next item
    setTimeout(() => {
      setJustAdded(false);
      nameRef.current?.focus();
    }, 700);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
    if (e.key === 'Escape') { setSuggestionOpen(false); }
    if (e.key === 'ArrowDown' && suggestionOpen) {
      e.preventDefault();
      const el = document.querySelector<HTMLButtonElement>('.suggestion-item');
      el?.focus();
    }
  }

  return (
    <>
      {/* Trigger bar */}
      <div className="add-trigger" onClick={handleOpen}>
        <span className="add-trigger-icon">✏️</span>
        <span className="add-trigger-text">Add items to list…</span>
        <span className="add-trigger-plus">+</span>
      </div>

      {/* Bottom sheet */}
      {open && (
        <>
          <div className="sheet-backdrop" onClick={handleClose} />
          <div className="sheet">
            <div className="sheet-handle" />

            <div className="sheet-header">
              <span className="sheet-title">Add to list</span>
              <button className="sheet-done-btn" onClick={handleClose}>Done</button>
            </div>

            {/* Name with autocomplete */}
            <div className="sheet-field-group">
              <label className="sheet-label">Item</label>
              <div className="sheet-autocomplete-wrap">
                <input
                  ref={nameRef}
                  type="text"
                  className="sheet-input"
                  placeholder="What do you need?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setSuggestionOpen(true)}
                  autoComplete="off"
                />
                {name && (
                  <button className="sheet-input-clear" onClick={() => { setName(''); setSuggestionOpen(false); nameRef.current?.focus(); }}>
                    ×
                  </button>
                )}

                {suggestionOpen && suggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {suggestions.map((p) => (
                      <button
                        key={p.id}
                        className="suggestion-item"
                        onMouseDown={(e) => { e.preventDefault(); selectSuggestion(p); }}
                        onKeyDown={(e) => e.key === 'Enter' && selectSuggestion(p)}
                        tabIndex={0}
                      >
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="suggestion-img" />
                        ) : (
                          <div className="suggestion-img-placeholder">{p.name[0]}</div>
                        )}
                        <div className="suggestion-info">
                          <span className="suggestion-name">{p.name}</span>
                          <span className="suggestion-meta">
                            {p.brand ?? ''}{priceLabel(p.price_min, p.price_max)}
                          </span>
                        </div>
                        <span className="suggestion-tag">📦 Catalog</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div className="sheet-field-group">
              <label className="sheet-label">Quantity</label>
              <input
                type="text"
                className="sheet-input sheet-input--sm"
                placeholder="e.g. 2, 500g, 1 pack, dozen"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>

            {/* Priority */}
            <div className="sheet-field-group">
              <label className="sheet-label">Urgency</label>
              <div className="sheet-priority-row">
                {PRIORITIES.map((p) => {
                  const cfg = PRIORITY_CONFIG[p];
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`sheet-priority-btn ${priority === p ? 'sheet-priority-btn--active' : ''}`}
                      style={{ '--pill-color': cfg.color, '--pill-bg': cfg.bg, '--pill-border': cfg.border } as React.CSSProperties}
                      onClick={() => setPriority(p)}
                    >
                      {cfg.emoji} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add button */}
            <button
              className={`sheet-add-btn ${justAdded ? 'sheet-add-btn--done' : ''}`}
              onClick={handleAdd}
              disabled={!name.trim() || adding}
            >
              {justAdded ? '✓ Added!' : adding ? 'Adding…' : '+ Add to list'}
            </button>

            <p className="sheet-hint">Form stays open — keep adding, tap Done when finished.</p>
          </div>
        </>
      )}
    </>
  );
}
