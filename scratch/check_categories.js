const { createClient } = require('@supabase/supabase-client');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCategories() {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching categories:", error);
  } else {
    console.log("Found categories:", data);
  }
}

checkCategories();
