"use client";

import { useEffect } from "react";

/**
 * HOOK: useMetaPixel
 * 
 * Provides methods to fire Meta Pixel events for the booking funnel.
 * Events: ViewContent (Step 1), InitiateCheckout (Step 2), AddToCart (Step 4), Purchase (Success)
 */

declare global {
  interface Window {
    fbq: any;
  }
}

export function useMetaPixel() {
  const track = (eventName: string, params?: object) => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", eventName, params);
    } else {
      // Log for development if no pixel is installed
      if (process.env.NODE_ENV !== "production") {
        console.log(`[Meta Pixel Mock] Event: ${eventName}`, params);
      }
    }
  };

  return { track };
}
