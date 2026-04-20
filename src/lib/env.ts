import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Site
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().min(2).default("en"),

  // Business (can be optional in schema if defaults exist in DB, but good to have here)
  WHATSAPP_BUSINESS_NUMBER: z.string().optional(),
  INSTAPAY_IDENTIFIER: z.string().optional(),

  // Analytics
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
  META_CAPI_ACCESS_TOKEN: z.string().optional(),

  // Security
  CRON_SECRET: z.string().optional(),
});

// Parse process.env at import time
export const env = envSchema.parse(process.env);

// Export types for env
export type Env = z.infer<typeof envSchema>;
