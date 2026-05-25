'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Product } from '@/lib/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    setProducts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchProducts]);

  const addProduct = useCallback(async (
    product: Omit<Product, 'id' | 'created_at'>,
    imageFile: File | null
  ): Promise<Product | null> => {
    const supabase = getSupabaseBrowserClient();
    let image_url = product.image_url;

    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, imageFile, { upsert: true });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(uploadData.path);
        image_url = urlData.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from('products')
      .insert({ ...product, image_url })
      .select()
      .single();

    if (!error && data) {
      setProducts((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    }
    return null;
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase.from('products').delete().eq('id', id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { products, loading, addProduct, deleteProduct, refetch: fetchProducts };
}
