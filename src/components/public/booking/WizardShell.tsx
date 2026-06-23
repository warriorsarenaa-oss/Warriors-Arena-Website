"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WizardShellProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext?: () => void;
  isNextDisabled?: boolean;
  nextLabel?: string;
  isSubmitting?: boolean;
  showNext?: boolean;
  isSuccess?: boolean;
  formId?: string;
}

export const WizardShell: React.FC<WizardShellProps> = ({
  currentStep,
  totalSteps,
  title,
  description,
  children,
  onBack,
  onNext,
  isNextDisabled = false,
  nextLabel,
  isSubmitting = false,
  showNext = true,
  isSuccess = false,
  formId,
}) => {
  const t = useTranslations("Booking");
  const locale = useLocale();

  if (isSuccess) {
    return <div className="w-full">{children}</div>;
  }

  return (
    // Fills all vertical space given by BookingModal; flex column so progress + panel stack vertically
    <div className="flex flex-col flex-1 min-h-0 w-full max-w-4xl mx-auto">

      {/* 1. Progress Indicator — fixed height, no scroll */}
      <div className="flex-shrink-0 px-4 md:px-10 pt-4 pb-3">
        <div className="flex justify-between items-end mb-1.5">
          <span className="text-wa-green font-mono text-[11px] uppercase tracking-widest">
            {t("stepProgress", { current: currentStep, total: totalSteps })}
          </span>
          <span className="text-wa-text/40 font-mono text-[9px] uppercase">
            {t("tacticalStatus", { step: currentStep })}
          </span>
        </div>
        <div className="flex gap-1 h-0.5 w-full">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 transition-all duration-500 ${
                i + 1 <= currentStep ? "bg-wa-green shadow-[0_0_6px_#00FF41]" : "bg-wa-gray/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 2. Content Panel — fills remaining height */}
      <WAPanel className="flex-1 min-h-0 flex flex-col mx-4 md:mx-0 mb-4 md:mb-0 p-0 overflow-hidden">

        {/* 2a. Step header — fixed, never scrolls */}
        <div className="flex-shrink-0 px-4 md:px-10 pt-4 md:pt-8 pb-3 md:pb-4">
          <h1 className="text-xl sm:text-2xl md:text-4xl text-wa-text font-archivo uppercase mb-1 md:mb-2">
            {title}
          </h1>
          <p className="text-wa-text/60 font-barlow text-sm md:text-lg leading-snug">
            {description}
          </p>
        </div>

        {/* 2b. Scrollable step content */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 md:px-10 pb-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 2c. Navigation — sticky at bottom of panel, never scrolls away */}
        <div className="flex-shrink-0 flex justify-between items-center px-4 md:px-10 pt-3 pb-4 md:pb-6 border-t border-wa-gray/20 bg-wa-bg">
          <WAButton
            variant="ghost"
            onClick={onBack}
            disabled={currentStep === 1 || isSubmitting}
            className="flex items-center gap-2 group min-h-[48px]"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform ${
                locale === 'ar' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'
              }`}
            />
            {t("back")}
          </WAButton>

          {showNext && (
            <WAButton
              variant="primary"
              onClick={formId ? undefined : onNext}
              type={formId ? "submit" : "button"}
              form={formId}
              disabled={isNextDisabled || isSubmitting}
              className="flex items-center gap-2 group min-w-[140px] justify-center min-h-[48px] text-sm md:text-base"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-wa-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {nextLabel || t("next")}
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      locale === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'
                    }`}
                  />
                </>
              )}
            </WAButton>
          )}
        </div>
      </WAPanel>
    </div>
  );
};
