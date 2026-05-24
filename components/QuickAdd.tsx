'use client';

import { useState } from 'react';
import { COMMON_CATEGORIES } from '@/lib/commonItems';
import type { Priority } from '@/lib/types';

interface QuickAddProps {
  onAdd: (name: string) => void;
  currentPriority: Priority;
}

export default function QuickAdd({ onAdd, currentPriority }: QuickAddProps) {
  const [activeCategory, setActiveCategory] = useState(COMMON_CATEGORIES[0].name);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const category = COMMON_CATEGORIES.find((c) => c.name === activeCategory) ?? COMMON_CATEGORIES[0];

  function handleAdd(itemName: string) {
    onAdd(itemName);
    setAdded((prev) => new Set(prev).add(itemName));
    setTimeout(() => {
      setAdded((prev) => {
        const next = new Set(prev);
        next.delete(itemName);
        return next;
      });
    }, 1500);
  }

  return (
    <div className="quickadd">
      <div className="quickadd-cats">
        {COMMON_CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            type="button"
            className={`quickadd-cat ${activeCategory === cat.name ? 'quickadd-cat--active' : ''}`}
            onClick={() => setActiveCategory(cat.name)}
          >
            {cat.emoji}
          </button>
        ))}
      </div>
      <div className="quickadd-cat-label">{category.emoji} {category.name}</div>
      <div className="quickadd-chips">
        {category.items.map((item) => {
          const wasAdded = added.has(item);
          return (
            <button
              key={item}
              type="button"
              className={`quickadd-chip ${wasAdded ? 'quickadd-chip--added' : ''}`}
              onClick={() => handleAdd(item)}
            >
              {wasAdded ? '✓ Added' : item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
