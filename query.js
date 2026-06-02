const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const query = process.argv[2];
  if (!query) {
    console.error("No query provided");
    return;
  }
  
  // We can't run raw SQL via supabase-js unless we have an RPC.
  // But we can check if a table is accessible.
  if (query.startsWith("SELECT")) {
    const tableName = query.split("FROM")[1].trim().split(" ")[0].replace(/;/g, "");
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Data:", JSON.stringify(data, null, 2));
    }
  }
}

run();
