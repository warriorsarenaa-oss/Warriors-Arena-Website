'use client';

import { ReactNode, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function BookingModal({ isOpen, onClose, children }: BookingModalProps) {
  // Restore focus to the element that opened the modal when it closes
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Move focus into the modal after the opening animation frame
      const timer = setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Focus trap: keep Tab / Shift+Tab inside the modal while open
  // Escape key also closes the modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />

          {/* Modal Container — height-constrained so WizardShell controls internal scroll */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Booking wizard"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="bg-wa-bg w-full h-[100dvh] md:h-auto md:max-h-[90dvh] overflow-hidden relative border-t md:border border-wa-green/20 shadow-[0_0_50px_rgba(0,255,65,0.1)] flex flex-col
              rounded-t-[2rem] rounded-b-none md:rounded-[2rem] md:max-w-5xl"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close booking wizard"
              className="absolute top-4 right-4 md:top-6 md:right-6 z-[110] text-wa-text/40 hover:text-wa-green transition-colors p-3 hover:bg-wa-green/10 rounded-full"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>

            {/* Pass full height to children — wizard manages its own scrollable region */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
