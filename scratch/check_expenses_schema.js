const { createClient } = require('@supabase/supabase-client');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching from expenses:", error);
  } else {
    console.log("Columns in expenses:", data.length > 0 ? Object.keys(data[0]) : "No records to check columns");
  }
}

checkSchema();
