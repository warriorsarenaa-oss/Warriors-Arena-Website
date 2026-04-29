"use client";

/**
 * BundleBookButton — thin client wrapper so BundleCarousel (server component)
 * can trigger the wizard with a bundle seed without losing its RSC benefits.
 */

import React from "react";
import { WAButton } from "../UI/WAButton";
import { useBooking } from "@/contexts/BookingContext";

interface BundleBookButtonProps {
  bundleId: string;
  variant?: "primary" | "orange";
}

export const BundleBookButton: React.FC<BundleBookButtonProps> = ({
  bundleId,
  variant = "primary",
}) => {
  const { openWizard } = useBooking();

  return (
    <WAButton
      variant={variant}
      type="button"
      onClick={() => openWizard({ kind: "bundle", id: bundleId })}
    >
      SECURE SLOTS
    </WAButton>
  );
};
