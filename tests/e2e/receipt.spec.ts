import { test, expect } from '@playwright/test';
// No need for pdf-parse if we just verify the magic bytes to avoid ESM issues

// Use standard API URL or local
const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

test.describe('Receipt PDF Generation', () => {
  let bookingCode: string;
  let phoneLast4: string;

  test.beforeAll(async () => {
    // We use a known existing booking from the database for reliable receipt testing
    bookingCode = 'WA-2804-S5NP';
    phoneLast4 = '5678';
  });

  test('should generate a valid PDF receipt when phone_last4 is correct', async ({ request }) => {
    test.skip(!bookingCode, 'Booking code not available');

    const receiptUrl = `${baseURL}/api/v1/bookings/${bookingCode}/receipt?phone_last4=${phoneLast4}`;
    
    // Fetch receipt
    const startTime = Date.now();
    const response = await request.get(receiptUrl);
    const duration = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/pdf');
    expect(response.headers()['cache-control']).toContain('immutable');

    // Verify it's a valid PDF by checking magic bytes '%PDF-'
    const pdfBuffer = await response.body();
    const magicBytes = pdfBuffer.slice(0, 5).toString();
    expect(magicBytes).toBe('%PDF-');
    
    // Performance expectation
    expect(duration).toBeLessThan(8000); // Allow slightly higher than 5s in CI
  });

  test('should return 404 when phone_last4 is incorrect', async ({ request }) => {
    test.skip(!bookingCode, 'Booking code not available');

    const wrongLast4 = '9999';
    const receiptUrl = `${baseURL}/api/v1/bookings/${bookingCode}/receipt?phone_last4=${wrongLast4}`;
    
    const response = await request.get(receiptUrl);
    
    expect(response.status()).toBe(404);
  });
});
