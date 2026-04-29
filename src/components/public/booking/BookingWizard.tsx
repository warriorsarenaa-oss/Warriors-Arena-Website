"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useBookingDraft } from "@/hooks/useBookingDraft";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { WizardShell } from "./WizardShell";
import { PriceSummary } from "./PriceSummary";
import { Step1Game } from "./Step1Game";
import { Step2Configure } from "./Step2Configure";
import { Step3Date } from "./Step3Date";
import { Step5Customer } from "./Step5Customer";
import { SuccessScreen } from "./SuccessScreen";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { AlertTriangle } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";

interface BookingWizardProps {
  onSuccess?: () => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ onSuccess }) => {
  const t = useTranslations("Booking");
  const locale = useLocale();
  const { track } = useMetaPixel();
  const { draft, updateDraft, clearDraft, isLoaded } = useBookingDraft();
  const { seed } = useBooking();

  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [isStep5Valid, setIsStep5Valid] = useState(false);

  // 1. Sync Step History
  const goToStep = (step: number) => {
    updateDraft({ currentStep: step });
    if (typeof window !== "undefined" && window.location.pathname.endsWith("/book")) {
        window.history.pushState({ step }, "", `#step=${step}`);
    }
  };

  // Skip Step 1 if game is already selected via seed
  useEffect(() => {
    if (!isLoaded) return;

    // Handle seed logic
    if (seed?.kind === "game" && seed.id) {
      if (draft.game_id !== seed.id) {
        updateDraft({ game_id: seed.id, bundle_id: null, currentStep: 2 });
        return;
      } else if (draft.currentStep === 1) {
        goToStep(2);
      }
    } else if (seed?.kind === "bundle" && seed.id) {
      if (draft.bundle_id !== seed.id) {
        updateDraft({ bundle_id: seed.id, currentStep: 3 }); // Bundles go straight to Date selection
        return;
      }
    }

    const fetchDetails = async () => {
      // Fetch Game if needed
      if (draft.game_id && !selectedGame) {
        try {
          const res = await fetch("/api/v1/games");
          if (res.ok) {
            const games = await res.json();
            const game = games.find((g: any) => g.id === draft.game_id);
            if (game) setSelectedGame(game);
          }
        } catch (err) {
          console.error("Failed to fetch game for draft:", err);
        }
      }

      // Fetch Bundle if needed
      if (draft.bundle_id && !selectedBundle) {
        try {
          const res = await fetch("/api/v1/admin/bundles"); // We use admin endpoint because it's already implemented
          if (res.ok) {
            const bundles = await res.json();
            const bundle = bundles.find((b: any) => b.id === draft.bundle_id);
            if (bundle) {
              setSelectedBundle(bundle);
              // Sync bundle requirements into draft
              updateDraft({
                game_id: bundle.game_id,
                duration_minutes: bundle.duration_minutes,
                player_count: bundle.player_count
              });
            }
          }
        } catch (err) {
          console.error("Failed to fetch bundle for draft:", err);
        }
      }
    };

    fetchDetails();
  }, [isLoaded, draft.game_id, draft.bundle_id, draft.currentStep, selectedGame, selectedBundle, seed, updateDraft]);

  // 2. Track Funnel Events
  useEffect(() => {
    if (!isLoaded) return;

    switch (draft.currentStep) {
      case 1:
        track("ViewContent", { content_name: "Booking Wizard" });
        break;
      case 2:
        track("InitiateCheckout");
        break;
      case 3:
        if (draft.start_time) {
          let price = 0;
          if (selectedBundle) {
            price = selectedBundle.pricing_mode === 'per_player' 
              ? selectedBundle.price_value * selectedBundle.player_count 
              : selectedBundle.price_value;
          } else {
            price = (selectedGame?.pricing?.find((p: any) => p.duration_minutes === draft.duration_minutes)?.price_per_player || 0) * draft.player_count;
          }
          track("AddToCart", { value: price, currency: "EGP" });
        }
        break;
    }
  }, [draft.currentStep, draft.start_time, isLoaded, selectedGame, selectedBundle, draft.duration_minutes, draft.player_count, track]);

  // 3. Validation Guards
  const isStepValid = useMemo(() => {
    switch (draft.currentStep) {
      case 1: return !!draft.game_id;
      case 2: return !!draft.duration_minutes && !!draft.player_count;
      case 3: return !!draft.date && !!draft.start_time;
      case 4: return isStep5Valid;
      default: return false;
    }
  }, [draft, isStep5Valid]);

  // 4. Submission Handler
  const handleFinalSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setSubmissionError(null);

    // Normalize phone number (remove spaces, ensure +20 if needed)
    const normalizePhone = (phone: string): string => {
      let cleaned = phone.replace(/[\s\-\(\)]/g, "");
      if (!cleaned.startsWith("+")) {
        if (cleaned.startsWith("0")) {
          cleaned = "+20" + cleaned.substring(1);
        } else {
          cleaned = "+20" + cleaned;
        }
      }
      return cleaned;
    };

    // Construct clean payload matching API schema
    const payload = {
      game_id: draft.game_id,
      bundle_id: draft.bundle_id || null,
      date: draft.date,
      start_time: draft.start_time,
      duration_minutes: draft.duration_minutes,
      player_count: draft.player_count,
      customer_name: formData.customer_name?.trim(),
      customer_phone: normalizePhone(formData.customer_phone),
      customer_email: formData.customer_email?.trim() || null, 
      customer_notes: formData.customer_notes?.trim() || null,
    };

    // Pre-flight check
    if (!payload.game_id || !payload.date || !payload.start_time || !payload.customer_name || !payload.customer_phone) {
      console.error("[BOOKING_DEBUG] Missing required fields in payload:", payload);
      setSubmissionError("Missing required booking information. Please go back and check your selection.");
      setIsSubmitting(false);
      return;
    }

    // Bundle-specific validation
    if (draft.bundle_id && !payload.bundle_id) {
       payload.bundle_id = draft.bundle_id;
    }

    console.log("[BOOKING_DEBUG] Sending payload:", payload);

    try {
      const res = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("[BOOKING_DEBUG] Error response:", data);
        if (res.status === 409) {
          setShowConflictModal(true);
        } else {
          // Extract specific field error if available from Zod flatten()
          let errorMsg = data.error?.message || "Booking failed";
          
          if (data.error?.details?.fieldErrors) {
            const fieldErrors = data.error.details.fieldErrors;
            const firstField = Object.keys(fieldErrors)[0];
            const firstMsg = fieldErrors[firstField][0];
            errorMsg = `${firstField}: ${firstMsg}`;
          } else if (data.error?.details) {
             errorMsg = typeof data.error.details === 'string' ? data.error.details : JSON.stringify(data.error.details);
          }
          
          throw new Error(errorMsg);
        }
        return;
      }

      // Success!
      const totalPrice = data.total_price;
      track("Purchase", { value: totalPrice, currency: "EGP", content_ids: [data.booking_code] });
      
      console.log("[BOOKING_DEBUG] Success Response:", data);
      
      setSuccessData({
        ...data,
        // Capture these specifically because draft will be cleared
        selection: {
          gameName: selectedGame?.name_en || "Game",
          date: draft.date,
          startTime: draft.start_time,
          playerCount: draft.player_count
        }
      });
      
      clearDraft();
    } catch (err) {
      console.error("[BOOKING_DEBUG] Submission catch:", err);
      setSubmissionError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) return null;

  if (successData) {
    return (
      <SuccessScreen 
        bookingData={successData}
        selection={successData.selection}
        onClose={onSuccess}
      />
    );
  }

  const currentPricePerPlayer = selectedBundle 
    ? (selectedBundle.pricing_mode === 'per_player' ? selectedBundle.price_value : selectedBundle.price_value / selectedBundle.player_count)
    : (selectedGame?.pricing?.find((p: any) => p.duration_minutes === draft.duration_minutes)?.price_per_player || 0);

  const displayGameName = selectedBundle 
    ? (locale === "ar" ? selectedBundle.title_ar : selectedBundle.title_en)
    : (locale === "ar" ? selectedGame?.name_ar : selectedGame?.name_en);

  return (
    <div className="flex flex-col lg:flex-row gap-12 items-start w-full pb-32 lg:pb-0">
      <div className="flex-1 w-full order-2 lg:order-1">
        <WizardShell
          currentStep={draft.currentStep}
          totalSteps={4}
          title={t(`Step${draft.currentStep === 4 ? 5 : draft.currentStep}.title`)}
          description={t(`Step${draft.currentStep === 4 ? 5 : draft.currentStep}.description`)}
          onBack={() => goToStep(draft.currentStep - 1)}
          onNext={() => {
            if (draft.currentStep === 4) {
              document.getElementById("booking-form")?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            } else {
              goToStep(draft.currentStep + 1);
            }
          }}
          isNextDisabled={!isStepValid}
          nextLabel={draft.currentStep === 4 ? t("confirm") : undefined}
          isSubmitting={isSubmitting}
        >
          {draft.currentStep === 1 && (
            <Step1Game 
              selectedGameId={draft.game_id}
              onSelect={(game) => {
                setSelectedGame(game);
                updateDraft({ game_id: game.id, duration_minutes: 30 });
              }}
            />
          )}
          {draft.currentStep === 2 && selectedGame && (
            <Step2Configure 
              pricing={selectedGame.pricing}
              duration={draft.duration_minutes}
              playerCount={draft.player_count}
              onUpdate={updateDraft}
              disabled={!!draft.bundle_id}
            />
          )}
          {draft.currentStep === 3 && (
            <Step3Date 
              selectedDate={draft.date}
              onSelectDate={(date) => {
                updateDraft({ date, start_time: undefined });
              }}
              selectedTime={draft.start_time}
              onSelectTime={(start_time) => updateDraft({ start_time })}
              duration={draft.duration_minutes || 30}
            />
          )}
          {draft.currentStep === 4 && (
            <Step5Customer 
              defaultValues={draft}
              onSubmit={handleFinalSubmit}
              onValidationChange={setIsStep5Valid}
              isSubmitting={isSubmitting}
            />
          )}
        </WizardShell>

        {submissionError && (
          <div className="mt-6 p-4 bg-wa-error/10 border border-wa-error/30 text-wa-error font-mono text-xs uppercase flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            {submissionError}
          </div>
        )}
      </div>

      {/* Desktop Sidebar Summary */}
      <aside className="hidden lg:block w-full lg:w-80 lg:sticky lg:top-8 order-1 lg:order-2">
        <PriceSummary 
          compact
          gameName={displayGameName}
          duration={draft.duration_minutes}
          playerCount={draft.player_count}
          pricePerPlayer={currentPricePerPlayer}
          isBundle={!!selectedBundle}
        />
      </aside>

      {/* Mobile Sticky Summary */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <PriceSummary 
          compact
          gameName={displayGameName}
          duration={draft.duration_minutes}
          playerCount={draft.player_count}
          pricePerPlayer={currentPricePerPlayer}
          isBundle={!!selectedBundle}
        />
      </div>

      {showConflictModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-wa-black/90 backdrop-blur-sm">
          <WAPanel hot className="max-w-md w-full p-8 flex flex-col items-center text-center gap-6">
            <AlertTriangle className="w-16 h-16 text-wa-orange animate-pulse" />
            <h2 className="text-2xl font-archivo uppercase text-wa-orange">{t("Errors.conflictTitle")}</h2>
            <p className="text-wa-text/60 font-barlow">{t("Errors.conflictMessage")}</p>
            <WAButton 
              variant="orange" 
              className="w-full"
              onClick={() => {
                setShowConflictModal(false);
                updateDraft({ start_time: undefined });
                goToStep(3); // Go back to combined date/time step
              }}
            >
              {t("Errors.pickAnother")}
            </WAButton>
          </WAPanel>
        </div>
      )}
    </div>
  );
};
