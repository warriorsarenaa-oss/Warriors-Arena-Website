# Sprint 4 — Booking Wizard (Public UI)

> Prerequisites: Sprint 3 complete. Landing page shipping.

## Prompt To Give Antigravity

```
Sprint 4: The conversion flow.

Build the 5-step booking wizard at /book. This is the revenue-generating feature.

SCOPE:

1. src/app/[locale]/book/page.tsx — wizard orchestrator. Client component managing step state.
   - sessionStorage for draft state (clears on tab close, per Section 7.1 P2)
   - URL param ?game=<slug> pre-selects game in step 1
   - Browser back button navigates steps (use pushState)
   - Fires Meta Pixel events at each step per spec

2. Step components in src/components/public/booking/:
   - Step1Game.tsx — game cards, selectable
   - Step2Configure.tsx — duration radio (filtered by what's offered for selected game), player stepper (1-6 with +/-), live price calculation. If bundle is selected, skip this step.
   - Step3Date.tsx — calendar widget. Min=today Cairo, Max=today+90. Closed dates disabled. Use a touch-friendly calendar (react-day-picker or roll a minimal one).
   - Step4Time.tsx — slot grid for selected date. Calls /api/v1/availability. Shows 12-hour labels. Unavailable slots disabled with visible reason tooltip. 60-min slots grayed if only one 30-min slot of pair is open.
   - Step5Customer.tsx — name, phone (required + Egyptian mobile validation), email (optional), notes (optional), terms checkbox, "Confirm Reservation" CTA.

3. src/components/public/booking/WizardShell.tsx — wraps step content with progress bar, back/next, save-draft indicator.

4. src/components/public/booking/PriceSummary.tsx — sticky bottom on mobile, sidebar on desktop. Shows running total, deposit amount.

5. src/components/public/booking/SuccessScreen.tsx — post-confirmation display:
   - Booking code in a large copy-button card
   - Receipt PDF download button
   - Deposit amount + InstaPay identifier
   - "Send via WhatsApp" button (uses whatsapp_deep_link from API response)
   - Park entry fee notice
   - Cancellation policy (informational text only in v1)

6. src/hooks/useBookingDraft.ts — sessionStorage persistence for steps 1-4 state.

7. Form validation:
   - Use react-hook-form + zod resolver
   - Egyptian mobile regex as specified in Sprint 2
   - Friendly error messages in both locales

8. Meta Pixel events (client-side, fired at step transitions):
   - Step 1 shown → ViewContent
   - Step 2 → InitiateCheckout
   - Step 4 slot selected → AddToCart
   - Step 5 success → Purchase (with value + currency)
   - Each event also fires server-side via CAPI from the API route (Sprint 2 handles this; verify it's wired)

WORKING MODE:
- This is the conversion flow. Every interaction matters.
- Test on mobile (actual device or accurate DevTools throttling).
- Loading states for the slot availability call — show skeleton, not spinner, for <500ms loads.
- Disable the "Confirm" button during submission (per lessons learned).
- After success, DO NOT let the back button return to the form with filled data (clear sessionStorage).

EXIT CRITERIA:
- End-to-end happy path: open /book, select laser_tag, 30-min, 4 players, pick date, pick slot, enter Ahmed Hassan + +201234567890, confirm → see Success Screen with booking code.
- Verify in DB: booking row exists with status='confirmed', 1 booking_slots row, correct total_price.
- Conflict path: two tabs try to book the same slot simultaneously, one succeeds, other shows "This slot was just taken — please pick another" and returns to step 4.
- Arabic flow works end-to-end, RTL layout correct, all text translated.
- Phone validation rejects 123456, accepts +201234567890, accepts 01234567890.
- sessionStorage clears on success.
- Meta Pixel network panel shows 4 events fired in the right order.

Begin with the plan.
```

---

*End of Sprint 4 Prompt*
