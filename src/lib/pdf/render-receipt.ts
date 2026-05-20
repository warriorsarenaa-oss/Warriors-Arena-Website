import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import React from 'react';
import { supabaseService } from '@/lib/db/supabase-service';
import { ReceiptTemplate } from './receipt-template';
import { generateQRCode } from './qr-code';
import { format } from 'date-fns';
import { enUS, arSA } from 'date-fns/locale';

/**
 * Generates a PDF receipt for a booking.
 * Returns a Buffer of the PDF data.
 */
export async function generateReceipt(
  bookingOrCode: string | any, 
  locale: 'en' | 'ar' = 'en'
): Promise<Buffer> {
  let browser = null;
  let bookingStrOrObj = bookingOrCode;
  let bookingCode = typeof bookingOrCode === 'string' ? bookingOrCode : bookingOrCode.booking_code;

  try {
    // 1. Resolve Booking Data
    let booking = typeof bookingStrOrObj === 'string' ? null : bookingStrOrObj;

    if (!booking || !booking.games) {
       throw new Error(`Booking data is incomplete or missing joins for code: ${bookingCode}`);
    }

    // 2. Fetch System Settings (InstaPay, WhatsApp)
    const { data: settings } = await supabaseService
      .from('system_settings')
      .select('key, value');

    const findSetting = (key: string) => settings?.find(s => s.key === key)?.value;
    
    const whatsappData = findSetting('whatsapp_number') as { number: string };
    const instapayData = findSetting('instapay_identifier') as { identifier: string };

    // 3. Prepare Template Props
    const dateLocale = locale === 'ar' ? arSA : enUS;
    const bookingDateFormatted = format(new Date(booking.booking_date), 'MMMM dd, yyyy', { locale: dateLocale });
    
    // QR Code links to Instagram profile as requested
    const instagramUrl = 'https://www.instagram.com/warriors_arenaa';
    const qrCodeDataUrl = await generateQRCode(instagramUrl);

    // Read Logo as Base64 for PDF embedding
    let logoDataUrl = '';
    try {
      const fs = require('fs');
      const path = require('path');
      const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
      const logoBuffer = fs.readFileSync(logoPath);
      logoDataUrl = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
    } catch (err) {
      console.warn('Failed to load logo for PDF receipt:', err);
    }

    const templateProps = {
      bookingCode: booking.booking_code,
      gameTitle: locale === 'ar' ? booking.games.name_ar : booking.games.name_en,
      bookingDate: bookingDateFormatted,
      startTime: booking.start_time.substring(0, 5), // HH:mm
      endTime: booking.end_time.substring(0, 5),
      duration: `${booking.duration_minutes} min`,
      playerCount: booking.player_count,
      totalPrice: Number(booking.total_price_at_booking),
      depositAmount: Number(booking.deposit_amount),
      currencyCode: 'EGP',
      whatsappNumber: whatsappData?.number || '+20 122 655 7592',
      instapayId: instapayData?.identifier || 'warriors@instapay',
      locale,
      qrCodeDataUrl,
      logoDataUrl,
    };

    // 4. Render React to Static HTML
    const { renderToStaticMarkup } = require('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(ReceiptTemplate, templateProps)
    );

    // 5. PDF Generation via Puppeteer
    const isLocal = process.env.NODE_ENV === 'development';
    
    const launchOptions = isLocal 
      ? {
          args: [],
          executablePath: process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          headless: true,
        }
      : {
          args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
          defaultViewport: chromium.defaultViewport || { width: 1280, height: 720 },
          executablePath: await chromium.executablePath(
            "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
          ),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        };

    browser = await puppeteer.launch(launchOptions as any);
    const page = await browser.newPage();
    
    // Set content and wait for it to render
    await page.setContent(`<!DOCTYPE html><html><body>${html}</body></html>`, {
      waitUntil: 'networkidle0'
    });

    // Print to PDF (A4)
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    return Buffer.from(pdfBuffer);

  } catch (err) {
    console.error(`[PDF_GEN_ERROR] ${bookingCode}:`, err);
    throw err;
  } finally {
    if (browser) {
      await (browser as any).close();
    }
  }
}
