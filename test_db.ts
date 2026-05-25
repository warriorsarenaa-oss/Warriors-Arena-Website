import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: games } = await supabase.from('games').select('id').limit(1);
  if (!games || games.length === 0) return console.log('No games found');
  
  const { error } = await supabase.from('game_day_availability').upsert({
    game_id: games[0].id,
    day_of_week: 1,
    is_available: true,
    allowed_times: ['10:00', '10:30']
  }, { onConflict: 'game_id,day_of_week' });
  
  console.log('Error:', error);
}

main();
