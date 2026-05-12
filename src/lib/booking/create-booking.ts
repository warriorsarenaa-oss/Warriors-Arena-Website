import { supabaseService } from "@/lib/db/supabase-service";
import { logAuditAction } from "@/lib/admin/audit-log";
import { logger } from "@/lib/log";

/**
 * BOOKING SERVICE LAYER
 * 
 * Centralizes the creation of bookings to ensure atomic operations
 * and consistent audit logging.
 * 
 * Rules:
 * 1. Must use fn_create_booking RPC for atomicity (BR-SLOT-06).
 * 2. Must record every creation in the audit log.
 * 3. Distinguishes between 'online' (public) and 'manual' (staff) sources.
 */

export interface CreateBookingParams {
  game_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  duration_minutes: number;
  player_count: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  customer_notes?: string | null;
  special_mission_id?: string | null;
  mission_additional_price?: number;
  source: "online" | "manual";
  created_by_user_id?: string | null;
}

export interface BookingResult {
  success: boolean;
  booking_id?: string;
  booking_code?: string;
  total_price?: number;
  deposit_amount?: number;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Creates a new booking atomically.
 */
export async function createBooking(params: CreateBookingParams): Promise<BookingResult> {
  logger.info("Attempting to create booking", { 
    date: params.date, 
    time: params.start_time, 
    phone: params.customer_phone 
  });

  // 1. Call Database RPC
  const { data, error } = await supabaseService.rpc("fn_create_booking", {
    p_game_id: params.game_id,
    p_bundle_id: null,
    p_date: params.date,
    p_start_time: params.start_time,
    p_duration_minutes: params.duration_minutes,
    p_player_count: params.player_count,
    p_customer_name: params.customer_name,
    p_customer_phone: params.customer_phone,
    p_customer_email: params.customer_email || null,
    p_customer_notes: params.customer_notes || null,
    p_source: params.source,
    p_created_by_user_id: params.created_by_user_id || null,
    p_special_mission_id: params.special_mission_id || null
  }).single();

  // 2. Handle RPC Errors
  if (error) {
    // Check for specific known business errors from PostgreSQL
    if (error.message.includes("SLOT_CONFLICT")) {
      return { 
        success: false, 
        error: { code: "SLOT_CONFLICT", message: "One or more requested slots are already occupied" } 
      };
    }
    
    logger.error("RPC Error in fn_create_booking", error, { params });
    return { 
      success: false, 
      error: { code: "BOOKING_FAILURE", message: error.message } 
    };
  }

  const result = data as { 
    booking_id: string; 
    booking_code: string; 
    total_price: number; 
    deposit_amount: number; 
  };

  // 3. Write Audit Log — non-fatal: booking is already committed in DB
  try {
    await logAuditAction({
      actor_user_id: params.created_by_user_id || "anonymous",
      actor_email: params.source === "online" ? "anonymous" : "staff",
      action: "CREATE_BOOKING",
      entity_type: "bookings",
      entity_id: result.booking_id,
      after_state: {
        code: result.booking_code,
        game_id: params.game_id,
        date: params.date,
        total: result.total_price,
      },
    });
  } catch (auditErr) {
    logger.error("Audit log failed for successful booking", auditErr, { booking_id: result.booking_id });
  }

  return {
    success: true,
    booking_id: result.booking_id,
    booking_code: result.booking_code,
    total_price: result.total_price,
    deposit_amount: result.deposit_amount
  };
}
