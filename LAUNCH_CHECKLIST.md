# 🚀 Warriors Arena — Production Launch Checklist

Follow these steps before pointing your domain to the production server.

## 1. Database & Supabase
- [ ] **Apply All Migrations**: Ensure all files in `supabase/migrations/` have been executed against your production DB.
- [ ] **RLS Policies**: Verify that `bookings`, `special_missions`, and `venue_settings` have active RLS policies.
- [ ] **Storage Buckets**: Ensure `games-assets` bucket exists and is set to "Public".
- [ ] **RPC Functions**: Test `fn_create_booking` and `fn_get_availability` in the production SQL editor.

## 2. Environment Variables (Vercel)
Ensure these are set in your production environment:
- `NEXT_PUBLIC_SUPABASE_URL`: Your production project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your production anon key.
- `SUPABASE_SERVICE_ROLE_KEY`: **SECRET** — Production service role key.
- `NEXT_PUBLIC_APP_URL`: `https://your-domain.com` (Used for absolute links and Meta Pixel).
- `META_PIXEL_ID`: Your production Pixel ID.
- `META_ACCESS_TOKEN`: **SECRET** — Conversions API token.

## 3. Authentication
- [ ] **Redirect URLs**: Add `https://your-domain.com/auth/callback` to the Supabase Auth Redirect URLs list.
- [ ] **Site URL**: Update the Supabase Site URL to `https://your-domain.com`.
- [ ] **Email Templates**: Customize the "Confirm Signup" and "Password Reset" templates with Warriors Arena branding.

## 4. Operational Settings
- [ ] **Operating Hours**: Log into the Admin panel and set the correct hours for each day of the week.
- [ ] **Game Pricing**: Verify that all games have active pricing for 30/60 minute durations.
- [ ] **Staff Permissions**: Ensure all staff members have the correct roles (Staff vs Admin).

## 5. Third-Party Integrations
- [ ] **WhatsApp**: Verify the `whatsapp_link` generation works with the correct business number.
- [ ] **InstaPay**: Confirm the QR code or ID shown in the booking flow is correct.
- [ ] **Google Maps**: Ensure the location link in "Find Us" opens correctly on mobile.

## 6. Final UX Pass
- [ ] **Mobile Booking**: Run through the entire booking flow on an iPhone and Android.
- [ ] **Receipt PDF**: Download a test receipt and verify the QR code and branding.
- [ ] **Arabic Alignment**: Check all sections for RTL correctness.

---
**Status:** 🟢 Ready for final staging tests.
