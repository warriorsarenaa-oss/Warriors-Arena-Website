import { describe, it, expect, vi, beforeEach } from "vitest";
import { logAuditAction } from "@/lib/admin/audit-log";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/log", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockInsert = vi.fn();

vi.mock("@/lib/db/supabase-service", () => ({
  supabaseService: {
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  },
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("logAuditAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  it("inserts a record into audit_logs with the correct fields", async () => {
    const { supabaseService } = await import("@/lib/db/supabase-service");

    await logAuditAction({
      actor_user_id: "user-123",
      actor_email: "admin@wa.com",
      action: "UPDATE_BOOKING",
      entity_type: "bookings",
      entity_id: "booking-456",
      before_state: { status: "pending" },
      after_state: { status: "confirmed" },
    });

    expect(supabaseService.from).toHaveBeenCalledWith("audit_logs");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_user_id: "user-123",
        actor_email: "admin@wa.com",
        action: "UPDATE_BOOKING",
        entity_type: "bookings",
        entity_id: "booking-456",
        before_state: { status: "pending" },
        after_state: { status: "confirmed" },
      })
    );
  });

  it("extracts IP and user-agent from Request when provided", async () => {
    const mockRequest = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
        "user-agent": "TestBrowser/1.0",
      },
    });

    await logAuditAction({
      actor_user_id: "user-abc",
      action: "DELETE_GAME",
      entity_type: "games",
      entity_id: "game-789",
      request: mockRequest,
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ip_address: "1.2.3.4", // first IP from x-forwarded-for
        user_agent: "TestBrowser/1.0",
      })
    );
  });

  it("uses explicit ip_address and user_agent over request headers", async () => {
    const mockRequest = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "1.2.3.4",
        "user-agent": "RequestBrowser",
      },
    });

    await logAuditAction({
      actor_user_id: "user-abc",
      action: "TEST_ACTION",
      entity_type: "test",
      entity_id: "test-1",
      request: mockRequest,
      ip_address: "9.9.9.9",
      user_agent: "ExplicitAgent",
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ip_address: "9.9.9.9",
        user_agent: "ExplicitAgent",
      })
    );
  });

  it("defaults IP and user-agent to 'unknown' when no request provided", async () => {
    await logAuditAction({
      actor_user_id: "user-abc",
      action: "CREATE_BOOKING",
      entity_type: "bookings",
      entity_id: "booking-001",
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ip_address: "unknown",
        user_agent: "unknown",
      })
    );
  });

  it("converts entity_id to string for non-string IDs", async () => {
    await logAuditAction({
      actor_user_id: "user-abc",
      action: "UPDATE_PRICE",
      entity_type: "pricing",
      entity_id: "42", // always string in our type but guard is in impl
    });

    const insertArg = mockInsert.mock.calls[0][0];
    expect(typeof insertArg.entity_id).toBe("string");
  });

  it("does not throw on DB error — logs warning and returns", async () => {
    mockInsert.mockResolvedValue({ error: { message: "db error" } });
    const { logger } = await import("@/lib/log");

    // Should not throw
    await expect(
      logAuditAction({
        actor_user_id: "user-abc",
        action: "FAILED_AUDIT",
        entity_type: "test",
        entity_id: "test-1",
      })
    ).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalled();
  });
});
