"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StrategicNotice } from "@/components/UI/StrategicNotice";

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
}) => {
  const t = useTranslations("Booking");

  // Don't show progress/nav if it's the success screen
  if (isSuccess) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* 0. Strategic Notice (Always Visible) */}
      <StrategicNotice type="warning" className="mb-2 shadow-lg shadow-wa-orange/5" />

      {/* 1. Progress Indicator */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <span className="text-wa-green font-mono text-xs uppercase tracking-widest">
            {t("stepProgress", { current: currentStep, total: totalSteps })}
          </span>
          <span className="text-wa-text/40 font-mono text-[10px] uppercase">
            {t("tacticalStatus", { step: currentStep })}
          </span>
        </div>
        <div className="flex gap-1 h-1 w-full">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 transition-all duration-500 ${
                i + 1 <= currentStep ? "bg-wa-green shadow-[0_0_10px_#00FF41]" : "bg-wa-gray/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 2. Content Panel */}
      <WAPanel className="p-4 md:p-10 min-h-[400px] flex flex-col">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl text-wa-text font-archivo uppercase mb-2">
            {title}
          </h1>
          <p className="text-wa-text/60 font-barlow text-lg">
            {description}
          </p>
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3. Navigation Buttons */}
        <div className="flex justify-between items-center mt-12 pt-8 border-t border-wa-gray/20">
          <WAButton
            variant="ghost"
            onClick={onBack}
            disabled={currentStep === 1 || isSubmitting}
            className="flex items-center gap-2 group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {t("back")}
          </WAButton>

          {showNext && (
            <WAButton
              variant="primary"
              onClick={onNext}
              disabled={isNextDisabled || isSubmitting}
              className="flex items-center gap-2 group min-w-[140px] justify-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-wa-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {nextLabel || t("next")}
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </WAButton>
          )}
        </div>
      </WAPanel>

    </div>
  );
};
