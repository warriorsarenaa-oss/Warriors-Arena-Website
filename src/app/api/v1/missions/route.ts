import { NextResponse } from 'next/server';
import { createSupabaseAnon } from '@/lib/db/supabase-anon';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('game_id');

    const supabase = createSupabaseAnon();
    let query = supabase
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

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      }
    });
  } catch (error) {
    console.error('[MISSIONS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
  }
}
