import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { shopper_name } = body;

  // End any existing active sessions first
  await supabase
    .from('shopping_sessions')
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq('is_active', true);

  const { data, error } = await supabase
    .from('shopping_sessions')
    .insert({
      shopper_id: user.id,
      shopper_name: shopper_name || user.email,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { session_id } = body;

  if (!session_id) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 });
  }

  // Unlock all items in session
  await supabase
    .from('items')
    .update({ is_locked: false, locked_by: null, locked_by_name: null, shopping_session_id: null })
    .eq('shopping_session_id', session_id);

  const { data, error } = await supabase
    .from('shopping_sessions')
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq('id', session_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
