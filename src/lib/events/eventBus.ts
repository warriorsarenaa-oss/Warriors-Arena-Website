import { supabaseService } from "@/lib/db/supabase-service";

export type EventType = 
  | 'BOOKING_UNDONE'
  | 'BOOKING_UPDATED'
  | 'SCHEDULE_PUBLISHED'
  | 'SCHEDULE_EDITED';

export async function emitEvent(
  eventType: EventType,
  entityType: string,
  entityId: string,
  payload: any,
  userId: string
) {
  try {
    const { error } = await supabaseService.from('event_queue').insert({
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      payload,
      created_by_user_id: userId,
      status: 'pending'
    });
    
    if (error) {
      console.error(`[EventBus] Error emitting ${eventType}:`, error);
      throw error;
    }

    // In a full microservices architecture, this would trigger a background worker.
    // For Vercel Serverless, we trigger the processing endpoint asynchronously.
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/admin/events/process`, { method: 'POST' }).catch(console.error);

    return true;
  } catch (err) {
    console.error(`[EventBus] Exception in emitEvent:`, err);
    return false;
  }
}
