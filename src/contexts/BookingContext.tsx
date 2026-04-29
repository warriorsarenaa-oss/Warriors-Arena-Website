"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SeedKind = "game" | "bundle";

export interface SeedItem {
  kind: SeedKind;
  id: string;
}

interface BookingContextValue {
  isOpen: boolean;
  seed: SeedItem | null;
  openWizard: (seed?: SeedItem) => void;
  closeWizard: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [seed, setSeed] = useState<SeedItem | null>(null);

  const openWizard = useCallback((s?: SeedItem) => {
    setSeed(s ?? null);
    setIsOpen(true);
    // Prevent body scroll while wizard is open
    document.body.style.overflow = "hidden";
  }, []);

  const closeWizard = useCallback(() => {
    setIsOpen(false);
    setSeed(null);
    document.body.style.overflow = "";
  }, []);

  return (
    <BookingContext.Provider value={{ isOpen, seed, openWizard, closeWizard }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
}
