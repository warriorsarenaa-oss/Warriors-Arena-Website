import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log('--- TEST 1: GAMES ---');
  const { data: games } = await supabase.from('games').select('name_en').eq('is_active', true);
  console.log('Games:', games?.length, games?.map(g => g.name_en).join(', '));

  console.log('--- TEST 2: PRICING ---');
  const { data: pricing } = await supabase.from('game_pricing').select('duration_minutes, price_per_player, games!inner(name_en)').eq('is_active', true);
  console.log('Pricing:', pricing?.length, pricing);

  console.log('--- TEST 3: BUNDLES ---');
  const { data: bundles } = await supabase.from('bundles').select('title_en, player_count, duration_minutes, price_value').eq('is_active', true);
  console.log('Bundles:', bundles?.length, bundles);

  console.log('--- TEST 4: SETTINGS ---');
  const { data: settings } = await supabase.from('system_settings').select('*');
  console.log('Settings:', settings?.length, settings);

  console.log('--- TEST 5: HOURS ---');
  const { data: hours } = await supabase.from('operating_hours').select('*').eq('scope', 'default');
  console.log('Hours:', hours?.length, hours);
}

run().catch(console.error);
