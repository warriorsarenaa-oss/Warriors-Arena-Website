import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/log", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// We intercept supabaseService so no real DB calls are made.
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockSingle = vi.fn();

vi.mock("@/lib/db/supabase-service", () => ({
  supabaseService: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
      upsert: mockUpsert,
    })),
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the mock bucket shape the DB would return for an existing bucket. */
function makeBucket(tokens: number, secondsAgo = 0) {
  const lastRefill = new Date(Date.now() - secondsAgo * 1000).toISOString();
  return { data: { bucket_key: "test-key", tokens, last_refill: lastRefill }, error: null };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows the first request when no bucket exists (bucket not found)", async () => {
    // PGRST116 = PostgREST "no rows found"
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

    const result = await checkRateLimit("new-key", 5, 900);

    expect(result.allowed).toBe(true);
    expect(result.retryAfterSeconds).toBe(0);
    expect(mockUpsert).toHaveBeenCalledOnce();
  });

  it("allows request when bucket has tokens remaining", async () => {
    mockSingle.mockResolvedValue(makeBucket(3));

    const result = await checkRateLimit("existing-key", 5, 900);

    expect(result.allowed).toBe(true);
    expect(result.retryAfterSeconds).toBe(0);
    // Tokens should be decremented (3 -> 2) and upserted
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ tokens: expect.any(Number) })
    );
  });

  it("blocks request when bucket has zero tokens", async () => {
    mockSingle.mockResolvedValue(makeBucket(0));

    const result = await checkRateLimit("exhausted-key", 5, 900);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    // No upsert — we don't consume tokens when blocked
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("recharges tokens over time", async () => {
    // Bucket had 0 tokens, 180 seconds ago. Rate = 5/900 = 0.00556/s
    // After 180s: 0 + 180 * (5/900) = 0 + 1.0 = 1.0 token — should allow.
    mockSingle.mockResolvedValue(makeBucket(0, 180));

    const result = await checkRateLimit("recharging-key", 5, 900);

    expect(result.allowed).toBe(true);
  });

  it("does not exceed the limit cap when recharging", async () => {
    // Bucket had 4 tokens, 900 seconds ago — should recharge to max 5, not 9.
    mockSingle.mockResolvedValue(makeBucket(4, 900));

    const result = await checkRateLimit("capped-key", 5, 900);

    expect(result.allowed).toBe(true);
    // The upserted token count should not exceed limit - 1 (after consuming one)
    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.tokens).toBeLessThanOrEqual(4); // max 5, minus 1 consumed
  });

  it("fails open (allows) on unexpected DB errors", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "INTERNAL_ERROR", message: "db down" } });

    const result = await checkRateLimit("error-key", 5, 900);

    // Should fail open — never lock users out due to infra issues
    expect(result.allowed).toBe(true);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it("returns a positive retryAfterSeconds when blocked", async () => {
    // 0 tokens, last refilled just now — needs a full token to recharge
    mockSingle.mockResolvedValue(makeBucket(0));

    const result = await checkRateLimit("blocked-key", 5, 900);

    expect(result.allowed).toBe(false);
    // retryAfterSeconds = ceil((1 - 0) / (5/900)) = ceil(180) = 180
    expect(result.retryAfterSeconds).toBe(180);
  });
});
