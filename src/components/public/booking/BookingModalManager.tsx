"use client";

import { ReactNode } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { BookingWizard } from '@/components/public/booking/BookingWizard';
import BookingModal from '@/components/public/booking/BookingModal';

export function BookingModalManager() {
  const { isOpen, closeWizard } = useBooking();
  
  return (
    <BookingModal isOpen={isOpen} onClose={closeWizard}>
      <BookingWizard onSuccess={closeWizard} />
    </BookingModal>
  );
}
