export type Priority = 'high' | 'medium' | 'low';

export type Item = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  note: string | null;
  priority: Priority;
  requested_by: string | null;
  requested_by_name: string | null;
  requested_by_avatar: string | null;
  is_checked: boolean;
  checked_by: string | null;
  checked_by_name: string | null;
  checked_at: string | null;
  is_locked: boolean;
  locked_by: string | null;
  locked_by_name: string | null;
  shopping_session_id: string | null;
  image_url: string | null;
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  high:   { label: 'Urgent',   emoji: '🔴', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  medium: { label: 'Normal',   emoji: '🟡', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  low:    { label: 'Whenever', emoji: '🟢', color: '#059669', bg: '#f0fdf4', border: '#86efac' },
};

export type Product = {
  id: string;
  created_at: string;
  name: string;
  brand: string | null;
  category: string | null;
  price_min: number | null;
  price_max: number | null;
  unit: string | null;
  stores: string[] | null;
  image_url: string | null;
  notes: string | null;
  added_by: string | null;
  added_by_name: string | null;
};

export const PRODUCT_CATEGORIES = [
  'Dairy', 'Produce', 'Meat & Fish', 'Bakery',
  'Pantry', 'Drinks', 'Snacks', 'Frozen',
  'Household', 'Personal Care', 'Baby', 'Other',
];

export const COMMON_STORES = [
  'Carrefour', 'Metro', 'Imtiaz', 'Naheed',
  'Chase Up', 'Hyperstar', 'Al-Fatah', 'Agha\'s', 'Macro',
];

export type Trip = {
  id: string;
  created_at: string;
  name: string;
  created_by: string | null;
  created_by_name: string | null;
  is_completed: boolean;
  completed_at: string | null;
};

export type TripItem = {
  id: string;
  created_at: string;
  trip_id: string;
  name: string;
  note: string | null;
  is_checked: boolean;
  checked_at: string | null;
  source_item_id: string | null;
};

export type ShoppingSession = {
  id: string;
  started_at: string;
  ended_at: string | null;
  shopper_id: string | null;
  shopper_name: string | null;
  is_active: boolean;
};

export type FamilyMember = {
  id: string;
  name: string;
  initials: string;
  color: string;
  emoji: string;
};

export const FAMILY_MEMBERS: FamilyMember[] = [
  { id: '', name: 'Ali', initials: 'AL', color: '#dc2626', emoji: '🧑' },
  { id: '', name: 'Mama', initials: 'MA', color: '#7c3aed', emoji: '👩' },
  { id: '', name: 'Baba', initials: 'BA', color: '#0369a1', emoji: '👨' },
  { id: '', name: 'Sara', initials: 'SA', color: '#059669', emoji: '👧' },
  { id: '', name: 'Omar', initials: 'OM', color: '#d97706', emoji: '👦' },
];

export const CARD_COLORS = [
  '#fef08a', // yellow
  '#bae6fd', // blue
  '#fda4af', // pink
  '#bbf7d0', // green
  '#fed7aa', // orange
  '#e9d5ff', // purple
];

export function getCardColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

export function getCardRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  // Returns a float between -2 and 2
  return ((Math.abs(hash) % 400) / 100) - 2;
}
