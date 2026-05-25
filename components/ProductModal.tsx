'use client';

import { useState, useRef } from 'react';
import { PRODUCT_CATEGORIES, COMMON_STORES } from '@/lib/types';
import type { Product } from '@/lib/types';

interface ProductModalProps {
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'created_at'>, imageFile: File | null) => Promise<void>;
  userId: string;
  userName: string;
}

export default function ProductModal({ onClose, onSave, userId, userName }: ProductModalProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [unit, setUnit] = useState('');
  const [stores, setStores] = useState<string[]>([]);
  const [customStore, setCustomStore] = useState('');
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleStore(store: string) {
    setStores((prev) =>
      prev.includes(store) ? prev.filter((s) => s !== store) : [...prev, store]
    );
  }

  function addCustomStore() {
    const s = customStore.trim();
    if (s && !stores.includes(s)) {
      setStores((prev) => [...prev, s]);
    }
    setCustomStore('');
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        brand: brand.trim() || null,
        category: category || null,
        price_min: priceMin ? parseFloat(priceMin) : null,
        price_max: priceMax ? parseFloat(priceMax) : null,
        unit: unit.trim() || null,
        stores: stores.length > 0 ? stores : null,
        image_url: null,
        notes: notes.trim() || null,
        added_by: userId,
        added_by_name: userName,
      }, imageFile);
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Product to Catalog</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Photo */}
          <div className="modal-photo-row">
            <div
              className="modal-photo-box"
              onClick={() => fileRef.current?.click()}
              style={{ backgroundImage: imagePreview ? `url(${imagePreview})` : undefined }}
            >
              {!imagePreview && (
                <>
                  <span className="modal-photo-icon">📷</span>
                  <span className="modal-photo-hint">Add photo</span>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="modal-file-hidden" />
            {imagePreview && (
              <button type="button" className="modal-photo-clear" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                Remove photo
              </button>
            )}
          </div>

          {/* Name + Brand */}
          <div className="modal-row-2">
            <div className="modal-field">
              <label>Product Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Full Cream Milk"
                autoFocus
              />
            </div>
            <div className="modal-field">
              <label>Brand / Company</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Nestle, Olpers"
              />
            </div>
          </div>

          {/* Category + Unit */}
          <div className="modal-row-2">
            <div className="modal-field">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select category</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="modal-field">
              <label>Unit / Size</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. 1 litre, 500g, per dozen"
              />
            </div>
          </div>

          {/* Price range */}
          <div className="modal-field">
            <label>Price Range (PKR)</label>
            <div className="modal-price-row">
              <input
                type="number"
                min="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Min"
                className="modal-price-input"
              />
              <span className="modal-price-dash">—</span>
              <input
                type="number"
                min="0"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Max"
                className="modal-price-input"
              />
              <span className="modal-price-currency">₨</span>
            </div>
          </div>

          {/* Stores */}
          <div className="modal-field">
            <label>Available At</label>
            <div className="modal-stores-grid">
              {COMMON_STORES.map((store) => (
                <button
                  key={store}
                  type="button"
                  className={`modal-store-chip ${stores.includes(store) ? 'modal-store-chip--active' : ''}`}
                  onClick={() => toggleStore(store)}
                >
                  {store}
                </button>
              ))}
            </div>
            <div className="modal-custom-store-row">
              <input
                type="text"
                value={customStore}
                onChange={(e) => setCustomStore(e.target.value)}
                placeholder="Add another store…"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomStore())}
                className="modal-custom-store-input"
              />
              {customStore.trim() && (
                <button type="button" className="modal-custom-store-add" onClick={addCustomStore}>+</button>
              )}
            </div>
            {stores.filter((s) => !COMMON_STORES.includes(s)).length > 0 && (
              <div className="modal-stores-grid" style={{ marginTop: 6 }}>
                {stores.filter((s) => !COMMON_STORES.includes(s)).map((store) => (
                  <button
                    key={store}
                    type="button"
                    className="modal-store-chip modal-store-chip--active"
                    onClick={() => toggleStore(store)}
                  >
                    {store} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="modal-field">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra info — preferred variant, barcode, seasonal availability…"
              rows={2}
              className="modal-textarea"
            />
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-btn-save" disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : '💾 Save to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
