import { describe, it, expect, vi } from "vitest";
import { getUserPermissions } from "@/lib/auth/permissions";
import { supabaseService } from "@/lib/db/supabase-service";

// Mock Supabase service
vi.mock("@/lib/db/supabase-service", () => ({
  supabaseService: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
  },
}));

describe("Permissions System", () => {
  it("returns active: false for inactive users", async () => {
    // Mock user data for an inactive user
    (supabaseService.from as any).mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { is_active: false, roles: { name: "admin" } },
            error: null,
          }),
        })),
      })),
    });

    const perms = await getUserPermissions("inactive-user-id");
    expect(perms.isActive).toBe(false);
    expect(perms.permissionKeys).toHaveLength(0);
  });

  it("returns empty permissions for users with no role", async () => {
    (supabaseService.from as any).mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { is_active: true, roles: null },
            error: null,
          }),
        })),
      })),
    });

    const perms = await getUserPermissions("no-role-user-id");
    expect(perms.role).toBeNull();
    expect(perms.permissionKeys).toHaveLength(0);
  });

  it("flattens nested permission keys correctly for active admins", async () => {
    // Mock the user status fetch
    const mockFrom = supabaseService.from as any;
    
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { 
              is_active: true, 
              roles: { 
                name: "super_admin",
                role_permissions: [
                  { permissions: { key: "manage_bookings" } },
                  { permissions: { key: "view_revenue" } },
                ]
              } 
            },
            error: null,
          }),
        })),
      })),
    });

    const perms = await getUserPermissions("admin-id");
    expect(perms.isActive).toBe(true);
    expect(perms.role).toBe("super_admin");
    expect(perms.permissionKeys).toContain("manage_bookings");
    expect(perms.permissionKeys).toContain("view_revenue");
  });
});
