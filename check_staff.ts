import { supabaseService } from "./src/lib/db/supabase-service";

async function checkSchema() {
  const { data, error } = await supabaseService.rpc('inspect_table_columns', { table_name: 'users' });
  console.log("Users table columns:", data);

  const { data: staffData, error: staffError } = await supabaseService.rpc('inspect_table_columns', { table_name: 'staff' });
  console.log("Staff table columns:", staffData);
  if (staffError) console.log("Staff table error:", staffError.message);
}

// Note: I don't have inspect_table_columns RPC.
// I'll try a raw query.
async function rawQuery() {
  const { data, error } = await supabaseService.from('users').select('*').limit(1);
  console.log("Users data sample:", data);

  const { data: staffData, error: staffError } = await supabaseService.from('staff').select('*').limit(1);
  console.log("Staff data sample:", staffData);
  if (staffError) console.log("Staff table error:", staffError.message);
}

rawQuery();
