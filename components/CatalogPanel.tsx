'use client';

import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductModal from './ProductModal';
import type { Priority } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface CatalogPanelProps {
  userId: string;
  userName: string;
  userAvatar: string;
  defaultPriority?: Priority;
}

function priceLabel(min: number | null, max: number | null): string {
  if (!min && !max) return '';
  if (min && max && min !== max) return `₨${min}–${max}`;
  return `₨${min ?? max}`;
}

export default function CatalogPanel({ userId, userName, userAvatar, defaultPriority = 'medium' }: CatalogPanelProps) {
  const { products, loading, addProduct, deleteProduct } = useProducts();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddToList(productId: string, productName: string, brand: string | null) {
    setAdding(productId);
    const supabase = getSupabaseBrowserClient();
    const note = brand ? `${brand}` : null;
    await supabase.from('items').insert({
      name: productName,
      note,
      priority: defaultPriority,
      requested_by: userId,
      requested_by_name: userName,
      requested_by_avatar: userAvatar,
    });
    setAdding(null);
  }

  async function handleSave(product: Parameters<typeof addProduct>[0], imageFile: File | null) {
    await addProduct(product, imageFile);
  }

  return (
    <div className="catalog-panel">
      <div className="catalog-header">
        <div className="catalog-title-row">
          <span className="catalog-title">📦 Catalog</span>
          <button className="catalog-add-btn" onClick={() => setShowModal(true)}>+ Add</button>
        </div>
        <input
          type="text"
          className="catalog-search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="catalog-list">
        {loading ? (
          <div className="catalog-empty"><div className="fridge-loading-dot" /></div>
        ) : filtered.length === 0 ? (
          <div className="catalog-empty">
            <p className="catalog-empty-text">{search ? 'No results' : 'No products yet'}</p>
            {!search && (
              <button className="catalog-empty-cta" onClick={() => setShowModal(true)}>
                Add your first product →
              </button>
            )}
          </div>
        ) : (
          filtered.map((product) => (
            <div key={product.id} className="catalog-item">
              <div className="catalog-item-img-wrap">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="catalog-item-img" />
                ) : (
                  <div className="catalog-item-img-placeholder">
                    {product.name.substring(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="catalog-item-info">
                <span className="catalog-item-name">{product.name}</span>
                {product.brand && <span className="catalog-item-brand">{product.brand}</span>}
                <div className="catalog-item-meta">
                  {product.category && <span className="catalog-item-tag">{product.category}</span>}
                  {(product.price_min || product.price_max) && (
                    <span className="catalog-item-price">{priceLabel(product.price_min, product.price_max)}</span>
                  )}
                  {product.unit && <span className="catalog-item-unit">{product.unit}</span>}
                </div>
                {product.stores && product.stores.length > 0 && (
                  <div className="catalog-item-stores">
                    {product.stores.slice(0, 3).map((s) => (
                      <span key={s} className="catalog-item-store">{s}</span>
                    ))}
                    {product.stores.length > 3 && (
                      <span className="catalog-item-store">+{product.stores.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="catalog-item-actions">
                <button
                  className={`catalog-add-list-btn ${adding === product.id ? 'catalog-add-list-btn--adding' : ''}`}
                  onClick={() => handleAddToList(product.id, product.name, product.brand)}
                  disabled={adding === product.id}
                  title="Add to grocery list"
                >
                  {adding === product.id ? '✓' : '+'}
                </button>
                {confirmDelete === product.id ? (
                  <div className="catalog-delete-confirm">
                    <button className="catalog-delete-yes" onClick={() => { deleteProduct(product.id); setConfirmDelete(null); }}>✕ Delete</button>
                    <button className="catalog-delete-no" onClick={() => setConfirmDelete(null)}>Keep</button>
                  </div>
                ) : (
                  <button className="catalog-delete-btn" onClick={() => setConfirmDelete(product.id)} title="Delete">🗑</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <ProductModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          userId={userId}
          userName={userName}
        />
      )}
    </div>
  );
}
