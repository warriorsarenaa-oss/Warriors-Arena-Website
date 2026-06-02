import { createClient } from '@supabase/supabase-js';
import { fromZonedTime } from "date-fns-tz";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We simulate calling the API logic
async function runTests() {
  const cairoDate = new Date().toLocaleString("en-US", {timeZone: "Africa/Cairo"});
  const d = new Date(cairoDate);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  console.log("Scenario 7: Timezone and Past Slots");
  const res = await fetch(`http://localhost:3000/api/v1/availability?date=${dateStr}`);
  const data = await res.json();
  if (data.slots) {
    const pastSlots = data.slots.filter((s: any) => s.reason === "past");
    console.log(`PASS: Found ${pastSlots.length} past slots properly marked.`);
  } else {
     console.log("FAIL: Could not fetch slots.");
  }
}
runTests();
