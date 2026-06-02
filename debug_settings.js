const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
  console.log("Checking venue_settings...");
  const { data, error } = await supabase.from('venue_settings').select('*');
  if (error) {
    console.error("Error fetching settings:", error);
  } else {
    console.log("Current Settings:", JSON.stringify(data, null, 2));
  }

  console.log("\nChecking last booking...");
  const { data: booking, error: bError } = await supabase
    .from('bookings')
    .select('booking_code, total_price_at_booking, deposit_amount, deposit_status')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (bError) {
    console.error("Error fetching booking:", bError);
  } else {
    console.log("Last Booking:", JSON.stringify(booking, null, 2));
  }
}

debug();
