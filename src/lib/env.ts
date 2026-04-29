import { z } from "zod";

/**
 * Environment variable schema for Warriors Arena.
 * 
 * We use Zod for boot-time validation to ensure the application fails fast
 * if critical infrastructure keys are missing.
 * 
 * Rules:
 * 1. v1 required variables MUST be present or have defaults.
 * 2. v1.1+ variables (payments, advanced integratons) are optional.
 */
const envSchema = z.object({
  // --- Infrastructure (v1 REQUIRED) ---
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  
  // --- Site Config (v1 REQUIRED) ---
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().min(2).default("en"),
  
  // --- Business Information (v1 REQUIRED via DB, but env provides defaults) ---
  WHATSAPP_BUSINESS_NUMBER: z.string().min(1).default("+201000000000"),
  CONTACT_EMAIL: z.string().email().default("hello@warriorsarena.example"),
  
  // --- Security (v1 REQUIRED) ---
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required for automated tasks"),

  // --- Integrations (v1.1+ OPTIONAL) ---
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
  META_CAPI_ACCESS_TOKEN: z.string().optional(),
  
  PAYMOB_API_KEY: z.string().optional(),
  PAYMOB_WEBHOOK_HMAC_SECRET: z.string().optional(),
  
  SENTRY_AUTH_TOKEN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

// We catch the error early to provide a clean message during boot
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.issues.map(i => i.path.join(".")).join(", ");
      console.error("❌ CRITICAL: Missing or invalid environment variables:", missing);
      // In a build context, we throw to stop the process
      throw new Error(`Environment validation failed. Missing: ${missing}`);
    }
    throw error;
  }
};

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;
