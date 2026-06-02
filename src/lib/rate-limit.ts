import { supabaseService } from "@/lib/db/supabase-service";
import { logger } from "./log";

/**
 * RATE LIMITING SYSTEM
 * 
 * Prevents abuse of public endpoints (e.g., booking creation, auth attempts).
 * Implemented using a database-backed sliding window / leaky bucket.
 */

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Checks if a request is allowed under the rate limit for a specific key.
 * 
 * Logic:
 * 1. fetch current bucket for key.
 * 2. recharge tokens based on time passed.
 * 3. if tokens > 1, decrement and allow.
 * 4. otherwise, block.
 */
export async function checkRateLimit(
  key: string, 
  limit: number, 
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = new Date();
  
  // 1. Fetch current bucket status
  const { data: bucket, error } = await supabaseService
    .from("rate_limit_buckets")
    .select("*")
    .eq("bucket_key", key)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 is "not found"
    // On DB error, we fail open for UX but log it via the official logger
    logger.error("Rate Limit DB Error", error, { key });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const rechargeRate = limit / windowSeconds;
  
  let currentTokens: number;
  let lastUpdate: Date;

  if (!bucket) {
    currentTokens = limit;
    lastUpdate = now;
  } else {
    lastUpdate = new Date(bucket.last_refill);
    const secondsPassed = (now.getTime() - lastUpdate.getTime()) / 1000;
    currentTokens = Math.min(limit, bucket.tokens + (secondsPassed * rechargeRate));
  }

  if (currentTokens >= 1) {
    // Subtract 1 token and update DB
    const newTokens = currentTokens - 1;
    await supabaseService.from("rate_limit_buckets").upsert({
      bucket_key: key,
      tokens: newTokens,
      last_refill: now.toISOString()
    });
    
    return { allowed: true, retryAfterSeconds: 0 };
  } else {
    // Blocked
    const waitSeconds = (1 - currentTokens) / rechargeRate;
    return { allowed: false, retryAfterSeconds: Math.ceil(waitSeconds) };
  }
}
