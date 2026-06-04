import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { createBooking } from "@/lib/booking/create-booking";
import { generateWhatsAppLink } from "@/lib/booking/whatsapp-deep-link";
import { supabaseAnon } from "@/lib/db/supabase-anon";
import { z } from "zod";
import { sendToMeta } from "@/lib/analytics/capi";
import { sendAdminBookingNotification } from "@/utils/email";
/**
 * PUBLIC BOOKING CREATION API
 * 
 * Handles incoming booking requests from the website.
 * Implements strict rate limiting and validation to prevent bot spam.
 */

const EGYPT_PHONE_REGEX = /^(\+20|0)?1[0125][0-9]{8}$/;

const BookingRequestSchema = z.object({
  game_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string(),
  duration_minutes: z.union([z.literal(30), z.literal(60)]),
  player_count: z.number().int().min(1).max(100),
  customer_name: z.string().min(2).max(100).trim(),
  customer_phone: z.string().min(10).max(15),
  customer_email: z.string().email().optional().nullable(),
  customer_notes: z.string().max(500).optional().nullable(),
  special_mission_id: z.string().uuid().optional().nullable(),
  mission_additional_price: z.number().optional(),
  whatsapp_confirmed: z.boolean().optional().default(false),
  event_id: z.string().optional() // From Meta Pixel on client
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  
  // 1. IP Rate Limit: 5/hour
  const { allowed: ipAllowed, retryAfterSeconds: ipRetry } = await checkRateLimit(`booking_ip_${ip}`, 5, 3600);
  if (!ipAllowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many bookings from this IP. Try again later." } },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    
    // 2. Zod Validation
    const parsed = BookingRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: parsed.error.flatten() } },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // 3. Phone Validation & Rate Limit
    if (!EGYPT_PHONE_REGEX.test(data.customer_phone)) {
      return NextResponse.json(
        { error: { code: "INVALID_PHONE", message: "Please provide a valid Egyptian mobile number" } },
        { status: 400 }
      );
    }

    const { allowed: phoneAllowed, retryAfterSeconds: phoneRetry } = await checkRateLimit(`booking_phone_${data.customer_phone}`, 2, 3600);
    if (!phoneAllowed) {
      return NextResponse.json(
        { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many bookings for this phone number. Try again later." } },
        { status: 429 }
      );
    }

    // 4. Dynamic max_players check — validate against game's actual DB value
    const { data: gameRow } = await supabaseAnon
      .from("games")
      .select("max_players")
      .eq("id", data.game_id)
      .single();
    const maxAllowed = gameRow?.max_players ?? 6;
    if (data.player_count > maxAllowed) {
      return NextResponse.json(
        { error: { code: "PLAYER_COUNT_EXCEEDED", message: `This game allows a maximum of ${maxAllowed} players per slot.` } },
        { status: 400 }
      );
    }

    // 5. Call Service Layer
    const result = await createBooking({
      ...data,
      source: "online",
      whatsapp_confirmed: data.whatsapp_confirmed
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.code === "SLOT_CONFLICT" ? 409 : 500 }
      );
    }

    // 6. Fetch game and mission details for WhatsApp link
    const [{ data: gameData }, { data: missionData }] = await Promise.all([
      supabaseAnon.from("games").select("name_en").eq("id", data.game_id).single(),
      data.special_mission_id 
        ? supabaseAnon.from("special_missions").select("name_en").eq("id", data.special_mission_id).single()
        : Promise.resolve({ data: null })
    ]);

    const whatsappLink = generateWhatsAppLink({
      phone: data.customer_phone,
      customerName: data.customer_name,
      bookingCode: result.booking_code!,
      gameName: gameData?.name_en || "Game",
      missionName: missionData?.name_en || null,
      date: data.date,
      startTime: data.start_time,
      totalPrice: result.total_price!,
      playerCount: data.player_count,
      depositAmount: result.deposit_amount!
    });

    // 7. Send Email Confirmation via Resend (Fire and forget)
    void sendAdminBookingNotification({
      bookingCode: result.booking_code!,
      gameName: gameData?.name_en || "Game",
      bookingDate: data.date,
      startTime: data.start_time,
      playerCount: data.player_count,
      totalAmount: result.total_price!,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      specialMission: missionData?.name_en
    });

    // 7. Fire Meta Conversions API (Fire and forget)
    if (data.event_id) {
      sendToMeta({
        event_name: "Purchase",
        event_id: data.event_id,
        value: result.total_price || 0,
        currency: "EGP",
        user_data: {
          em: data.customer_email || undefined,
          ph: data.customer_phone
        },
        custom_data: {
          content_name: gameData?.name_en || "Game",
          content_type: "game"
        }
      }).catch(err => {
         console.error("[CAPI_BACKGROUND_ERROR]", err);
         // Do not throw, booking already successful
      });
    }

    // 8. Success Response
    return NextResponse.json({
      booking_id: result.booking_id,
      booking_code: result.booking_code,
      total_price: result.total_price,
      deposit_amount: result.deposit_amount,
      whatsapp_link: whatsappLink,
      customer_phone: data.customer_phone
    }, { status: 201 });

  } catch (err) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Could not parse request body" } },
      { status: 400 }
    );
  }
}
