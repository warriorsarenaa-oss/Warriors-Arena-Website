-- Add whatsapp_confirmed column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS whatsapp_confirmed BOOLEAN DEFAULT false;

COMMENT ON COLUMN bookings.whatsapp_confirmed IS 'Indicates if the customer completed the mandatory WhatsApp confirmation step in the booking wizard.';
