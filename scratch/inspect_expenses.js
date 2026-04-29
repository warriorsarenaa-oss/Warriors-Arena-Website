const { createClient } = require('@supabase/supabase-client');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectTable() {
  console.log("=== INSPECTING 'expenses' TABLE ===");
  
  // Use a raw SQL-like query via RPC or just a sample record
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching from expenses:", error);
  } else {
    console.log("Sample Record / Columns:", data.length > 0 ? data[0] : "No records found.");
    
    // Check columns by trying a dry-run insert or just listing keys if data exists
    if (data.length > 0) {
      console.log("Columns present:", Object.keys(data[0]));
    }
  }

  // Check for required columns by looking at the error message of a failed empty insert
  console.log("\n=== TESTING REQUIRED COLUMNS ===");
  const { error: insertError } = await supabase
    .from('expenses')
    .insert({});
    
  console.log("Insert error details (this reveals the first missing required column):", insertError?.message);
}

inspectTable();
