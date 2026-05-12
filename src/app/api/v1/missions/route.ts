import { NextResponse } from 'next/server';
import { supabaseAnon } from '@/lib/db/supabase-anon';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('game_id');

    let query = supabaseAnon
      .from('special_missions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (gameId) {
      // Filter missions that are compatible with the specific game
      // If compatible_games is null or empty [], it's compatible with all
      query = query.or(`compatible_games.is.null,compatible_games.eq.{},compatible_games.cs.{${gameId}}`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('[MISSIONS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
  }
}
