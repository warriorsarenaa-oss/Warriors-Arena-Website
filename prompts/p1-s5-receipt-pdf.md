# Sprint 5 — Receipt PDF Generation

> Prerequisites: Sprint 4 complete. Booking flow works end-to-end.

## Prompt To Give Antigravity

```
Sprint 5: PDF receipt generation.

Build server-side PDF generation using Puppeteer. DO NOT use @react-pdf/renderer (per lessons learned — causes React instance conflicts).

SCOPE:

1. src/app/api/v1/bookings/[code]/receipt/route.ts
   GET: generates and streams a PDF receipt.
   - Validates ?phone_last4=XXXX query param (same as Sprint 2 booking lookup)
   - If mismatch, 404 (not 403)
   - Cache: aggressive — PDFs are deterministic. Cache-Control: public, max-age=31536000, immutable

2. src/lib/pdf/render-receipt.ts
   - Uses @sparticuz/chromium + puppeteer-core for Vercel serverless compatibility
   - Renders an HTML template at src/lib/pdf/receipt-template.tsx (or .html.ts)
   - HTML template includes:
     - Warriors Arena logo (placeholder SVG until real logo provided)
     - Booking code in large text
     - Date (formatted "May 10, 2026"), start time (12-hour AM/PM), end time
     - Game name, duration, player count
     - Total price breakdown
     - Deposit amount + InstaPay details
     - WhatsApp number for confirmation
     - Park entry fee notice
     - Cancellation policy (text)
     - QR code linking back to booking lookup page
   - Language: use the locale the booking was created in (store in bookings table? Or default to EN for v1 — recommend default to EN for v1 simplicity, can extend).

3. src/lib/pdf/receipt-template.tsx — React component rendered to static HTML, styled with inline CSS (Puppeteer doesn't do Tailwind well in this setup).
   - A4 portrait page size
   - Clean typography
   - Arabic font fallback if template includes Arabic characters

4. Install dependencies:
   npm install puppeteer-core @sparticuz/chromium

5. vercel.json update: ensure the receipt route has enough memory (1024MB) and timeout (30s) — Puppeteer is heavy.

6. Error handling:
   - If PDF generation fails, log to Sentry with booking code, return 500 with a friendly "Receipt temporarily unavailable — please contact us" message.
   - Do NOT block booking creation if PDF generation fails.

7. Integration test:
   tests/e2e/receipt.spec.ts
   - Create booking
   - Fetch receipt with correct phone_last4 → 200 + application/pdf
   - Fetch with wrong phone_last4 → 404
   - Open PDF, verify booking code appears (use pdfjs-dist or similar for content assertion)

WORKING MODE:
- Chromium on Vercel is finicky. Budget extra time for this sprint.
- If Chromium integration proves too painful, fall back to rendering HTML and letting customers "Print to PDF" in browser — document this fallback in a TODO and we'll decide.

EXIT CRITERIA:
- After completing a booking, the Success Screen's download button produces a real PDF.
- PDF is readable, correctly formatted, Warriors Arena branded.
- PDF generation completes in under 5 seconds end-to-end.
- Caching works: second fetch of the same receipt is served from edge cache.
- Wrong phone_last4 returns 404 (not 403).

Begin with the plan.
```

---

*End of Sprint 5 Prompt*
