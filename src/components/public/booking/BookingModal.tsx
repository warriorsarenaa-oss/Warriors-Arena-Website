'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function BookingModal({ isOpen, onClose, children }: BookingModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 pt-10 md:p-6 pb-0 md:pb-6">
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
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="bg-wa-bg w-full max-h-[90dvh] overflow-hidden relative border-t md:border border-wa-green/20 shadow-[0_0_50px_rgba(0,255,65,0.1)] flex flex-col
              rounded-t-[2rem] rounded-b-none md:rounded-[2rem] md:max-w-5xl"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-[110] text-wa-text/40 hover:text-wa-green transition-colors p-3 hover:bg-wa-green/10 rounded-full"
            >
              <X className="w-6 h-6" />
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
