"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * HOOK: useBookingDraft
 * 
 * Manages the persistence of the booking wizard state in sessionStorage.
 * This allows users to refresh the page without losing their selections.
 */

export interface BookingDraft {
  game_id?: string;
  bundle_id?: string | null;
  date?: string; // YYYY-MM-DD
  start_time?: string; // HH:mm
  duration_minutes?: 30 | 60;
  player_count: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_notes: string;
  currentStep: number;
}

const STORAGE_KEY = "wa_booking_draft";

const DEFAULT_DRAFT: BookingDraft = {
  game_id: undefined,
  bundle_id: null,
  date: undefined,
  start_time: undefined,
  duration_minutes: 30,
  player_count: 2,
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  customer_notes: "",
  currentStep: 1,
};

export function useBookingDraft() {
  const [draft, setDraft] = useState<BookingDraft>(DEFAULT_DRAFT);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDraft({ ...DEFAULT_DRAFT, ...parsed });
      } catch (err) {
        console.error("Failed to parse booking draft from storage", err);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. Save to sessionStorage on every change
  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  }, [draft, isLoaded]);

  const updateDraft = useCallback((updates: Partial<BookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearDraft = useCallback(() => {
    setDraft(DEFAULT_DRAFT);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    draft,
    updateDraft,
    clearDraft,
    isLoaded
  };
}
