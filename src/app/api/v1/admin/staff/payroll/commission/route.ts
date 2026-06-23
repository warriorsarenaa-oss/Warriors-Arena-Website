import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-middleware";
import { getCommissionBreakdown } from "@/features/payroll/queries";

export const GET = requirePermission(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const staffId   = searchParams.get("staff_id");
  const weekStart = searchParams.get("week_start");
  const weekEnd   = searchParams.get("week_end");

  if (!staffId || !weekStart || !weekEnd) {
    return NextResponse.json(
      { error: "staff_id, week_start, and week_end are required" },
      { status: 400 }
    );
  }

  try {
    const items = await getCommissionBreakdown(staffId, weekStart, weekEnd);
    return NextResponse.json(items);
  } catch (error) {
    console.error("[COMMISSION_BREAKDOWN_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, "manage_financials");
