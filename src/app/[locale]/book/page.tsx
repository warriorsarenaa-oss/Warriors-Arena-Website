"use client";

import React from "react";
import { BookingWizard } from "@/components/public/booking/BookingWizard";

export default function BookingPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 container mx-auto flex items-center justify-center">
      <BookingWizard />
    </main>
  );
}
