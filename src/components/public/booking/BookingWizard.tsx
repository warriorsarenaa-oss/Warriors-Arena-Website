"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useBookingDraft } from "@/hooks/useBookingDraft";
import { WizardShell } from "./WizardShell";
import { PriceSummary } from "./PriceSummary";
import { Step1Game } from "./Step1Game";
import { Step2Configure } from "./Step2Configure";
import { StepMission, SpecialMission } from "./StepMission";
import { Step3Date } from "./Step3Date";
import { Step5Customer } from "./Step5Customer";
import { Step6Summary } from "./Step6Summary";
import { SuccessScreen } from "./SuccessScreen";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";
import { AlertTriangle } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";

// ---------------------------------------------------------------------------
// Step name type — the canonical identifier for each wizard step
// ---------------------------------------------------------------------------
type StepName = 'game' | 'configure' | 'date' | 'mission' | 'customer' | 'summary';

interface BookingWizardProps {
  onSuccess?: () => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ onSuccess }) => {
  const t = useTranslations("Booking");
  const locale = useLocale();
  const { draft, updateDraft, clearDraft, isLoaded } = useBookingDraft();
  const { seed } = useBooking();

  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [selectedMission, setSelectedMission] = useState<SpecialMission | null>(null);
  const [hasMissions, setHasMissions] = useState(false);
  const [missionsChecked, setMissionsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [isStep5Valid, setIsStep5Valid] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // ---------------------------------------------------------------------------
  // Dynamic step array
  // Game pre-selection: skip Step A. Mission conditional: skip Step D if none.
  // ---------------------------------------------------------------------------
  const isGamePreselected = seed?.kind === 'game' && !!seed.id;

  const steps = useMemo<StepName[]>(() => [
    ...(!isGamePreselected ? ['game' as const] : []),
    'configure',
    'date',
    ...(hasMissions ? ['mission' as const] : []),
    'customer',
    'summary',
  ], [isGamePreselected, hasMissions]);

  const totalSteps = steps.length;

  // 1-based index into `steps` → step name
  const currentStepName: StepName | undefined = steps[draft.currentStep - 1];

  // Helper: name → 1-based step index
  const stepIndex = (name: StepName) => steps.indexOf(name) + 1;

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  const goToStep = (step: number) => {
    setIsNavigating(true);
    setTimeout(() => {
      updateDraft({ currentStep: step });
      if (typeof window !== 'undefined' && window.location.pathname.endsWith('/book')) {
        window.history.pushState({ step }, '', `#step=${step}`);
      }
      setIsNavigating(false);
    }, 300);
  };

  // ---------------------------------------------------------------------------
  // Seed: skip game step when a game is pre-selected from a game card
  // ---------------------------------------------------------------------------
  const prevIsPreselected = useRef(isGamePreselected);

  useEffect(() => {
    if (!isLoaded) return;

    // When the pre-selected flag changes (e.g., navbar open vs card open), reset to step 1
    if (prevIsPreselected.current !== isGamePreselected) {
      prevIsPreselected.current = isGamePreselected;
      updateDraft({ currentStep: 1 });
    }

    if (seed?.kind === 'game' && seed.id) {
      if (draft.game_id !== seed.id) {
        // New game seeded — reset to step 1 (which = 'configure' in preselected mode)
        updateDraft({ game_id: seed.id, currentStep: 1 });
        return;
      } else if (draft.currentStep === 1 && !isGamePreselected) {
        // Was on game-select step, game now preselected → jump to configure
        goToStep(1);
      }
    }

    const fetchDetails = async () => {
      if (draft.game_id && !selectedGame) {
        try {
          const res = await fetch('/api/v1/games');
          if (res.ok) {
            const games = await res.json();
            const game = games.find((g: any) => g.id === draft.game_id);
            if (game) setSelectedGame(game);
          }
        } catch (err) {
          console.error('Failed to fetch game for draft:', err);
        }
      }

      if (draft.special_mission_id && !selectedMission) {
        try {
          const res = await fetch('/api/v1/missions');
          if (res.ok) {
            const missions = await res.json();
            const mission = missions.find((m: any) => m.id === draft.special_mission_id);
            if (mission) setSelectedMission(mission);
          }
        } catch (err) {
          console.error('Failed to fetch mission for draft:', err);
        }
      }
    };

    fetchDetails();
  }, [isLoaded, draft.game_id, draft.currentStep, selectedGame, seed, updateDraft, isGamePreselected]);

  // ---------------------------------------------------------------------------
  // Pre-fetch mission count when game is set — determines if Step D is included
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!draft.game_id) {
      setHasMissions(false);
      setMissionsChecked(false);
      return;
    }
    setMissionsChecked(false);
    fetch(`/api/v1/missions?game_id=${draft.game_id}`)
      .then(r => (r.ok ? r.json() : []))
      .then((data: any[]) => setHasMissions(Array.isArray(data) && data.length > 0))
      .catch(() => setHasMissions(false))
      .finally(() => setMissionsChecked(true));
  }, [draft.game_id]);

  // Clamp currentStep if it exceeds the dynamic steps array (e.g., mission step removed)
  useEffect(() => {
    if (totalSteps > 0 && draft.currentStep > totalSteps) {
      updateDraft({ currentStep: totalSteps });
    }
  }, [totalSteps, draft.currentStep, updateDraft]);

  // ---------------------------------------------------------------------------
  // Validation guards
  // ---------------------------------------------------------------------------
  const isStepValid = useMemo(() => {
    switch (currentStepName) {
      case 'game':      return !!draft.game_id;
      case 'configure': return !!draft.duration_minutes && !!draft.player_count;
      case 'date':      return !!draft.date && !!draft.start_time;
      case 'mission':   return true; // optional selection
      case 'customer':  return isStep5Valid;
      case 'summary':   return true;
      default:          return false;
    }
  }, [currentStepName, draft, isStep5Valid]);

  // ---------------------------------------------------------------------------
  // Submission
  // ---------------------------------------------------------------------------
  const handleFinalSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setSubmissionError(null);

    const normalizePhone = (phone: string): string => {
      if (!phone) return '';
      let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
      if (cleaned.startsWith('20') && cleaned.length > 10) cleaned = cleaned.substring(2);
      if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
      return '+20' + cleaned;
    };

    const payload = {
      game_id: draft.game_id,
      date: draft.date,
      start_time: draft.start_time,
      duration_minutes: draft.duration_minutes,
      player_count: draft.player_count,
      special_mission_id: draft.special_mission_id || null,
      mission_additional_price: draft.mission_additional_price || 0,
      customer_name: (formData.customer_name || draft.customer_name || '').trim(),
      customer_phone: normalizePhone(formData.customer_phone || draft.customer_phone || ''),
      customer_email: (formData.customer_email || draft.customer_email || '').trim() || null,
      customer_notes: (formData.customer_notes || draft.customer_notes || '').trim() || null,
      whatsapp_confirmed: true,
    };

    const missingFields = [];
    if (!payload.game_id) missingFields.push('Game');
    if (!payload.date) missingFields.push('Date');
    if (!payload.start_time) missingFields.push('Time');
    if (!payload.customer_name) missingFields.push('Name');
    if (!payload.customer_phone) missingFields.push('Phone');

    if (missingFields.length > 0) {
      setSubmissionError(`Missing required info: ${missingFields.join(', ')}. Please go back and check your details.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setShowConflictModal(true);
        } else {
          let errorMsg = data.error?.message || 'Booking failed';
          if (data.error?.details?.fieldErrors) {
            const fieldErrors = data.error.details.fieldErrors;
            const firstField = Object.keys(fieldErrors)[0];
            errorMsg = `${firstField}: ${fieldErrors[firstField][0]}`;
          } else if (data.error?.details) {
            errorMsg = typeof data.error.details === 'string'
              ? data.error.details
              : JSON.stringify(data.error.details);
          }
          throw new Error(errorMsg);
        }
        return;
      }

      const totalPrice = data.total_price;
      const gameName = selectedGame?.name_en || 'Game';
      if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
        (window as any).fbq('track', 'Purchase', {
          value: totalPrice,
          currency: 'EGP',
          content_type: 'product',
          content_name: gameName,
          content_category: 'Game Booking',
          num_items: 1,
          eventID: `purchase_${data.booking_code}`,
        });
      }

      setSuccessData({
        ...data,
        selection: {
          gameName: selectedGame?.name_en || 'Game',
          date: draft.date,
          startTime: draft.start_time,
          playerCount: draft.player_count,
          missionName: selectedMission
            ? (locale === 'ar' ? selectedMission.name_ar : selectedMission.name_en)
            : null,
        },
      });

      clearDraft();
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Step title / description mapping (uses existing translation keys)
  // ---------------------------------------------------------------------------
  const stepMeta: Record<StepName, { title: string; description: string }> = {
    game:      { title: t('Step1.title'),       description: t('Step1.description') },
    configure: { title: t('Step2.title'),       description: t('Step2.description') },
    date:      { title: t('Step3.title'),       description: t('Step4.description') },
    mission:   { title: t('StepMission.title'), description: t('StepMission.description') },
    customer:  { title: t('Step5.title'),       description: t('Step5.description') },
    summary:   { title: t('Step6.title'),       description: t('Step6.description') },
  };

  // ---------------------------------------------------------------------------
  // Derived display values
  // ---------------------------------------------------------------------------
  const selectedPricing = selectedGame?.pricing?.find(
    (p: any) => p.duration_minutes === draft.duration_minutes
  );
  const pricingType = selectedPricing?.pricing_type || 'time';
  const ammoCount = selectedPricing?.ammo_count;
  const currentPricePerPlayer = selectedPricing?.price_per_player || 0;
  const displayGameName = locale === 'ar' ? selectedGame?.name_ar : selectedGame?.name_en;

  // ---------------------------------------------------------------------------
  // Guards
  // ---------------------------------------------------------------------------
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

  // Block render until we know whether missions exist (prevents step array flicker)
  if (draft.game_id && !missionsChecked) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-wa-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const meta = currentStepName ? stepMeta[currentStepName] : { title: '', description: '' };

  // Show summary footer only after players + game are known (after step B / 'configure')
  const showSummaryFooter = !!draft.game_id && !!draft.player_count && draft.currentStep > stepIndex('configure');

  return (
    // Fills the height given by BookingModal; flex-col so wizard + footer stack
    <div className="flex flex-col flex-1 min-h-0 pt-3 md:pt-10">

      {/* Wizard area */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-12 items-start flex-1 min-h-0 px-0 lg:px-6 lg:py-6">

        {/* Step content */}
        <div className="flex-1 min-h-0 w-full order-2 lg:order-1 flex flex-col">
          <WizardShell
            currentStep={draft.currentStep}
            totalSteps={totalSteps}
            title={meta.title}
            description={meta.description}
            onBack={() => goToStep(draft.currentStep - 1)}
            onNext={() => goToStep(draft.currentStep + 1)}
            isNextDisabled={!isStepValid || isNavigating}
            showNext={currentStepName !== 'summary'}
            isSubmitting={isSubmitting || isNavigating}
            formId={currentStepName === 'customer' ? 'booking-form' : undefined}
            nextLabel={currentStepName === 'customer' ? t('confirm') : undefined}
          >
            {currentStepName === 'game' && (
              <Step1Game
                selectedGameId={draft.game_id}
                date={draft.date}
                onSelect={(game) => {
                  setSelectedGame(game);
                  updateDraft({ game_id: game.id, duration_minutes: 30 });
                  setTimeout(() => goToStep(draft.currentStep + 1), 200);
                }}
              />
            )}

            {currentStepName === 'configure' && selectedGame && (
              <Step2Configure
                pricing={selectedGame.pricing}
                duration={draft.duration_minutes}
                playerCount={draft.player_count}
                maxPlayers={selectedGame.max_players ?? 6}
                onUpdate={updateDraft}
              />
            )}

            {currentStepName === 'date' && (
              <Step3Date
                selectedDate={draft.date}
                onSelectDate={(date) => updateDraft({ date })}
                selectedTime={draft.start_time}
                onSelectTime={(start_time) => updateDraft({ start_time })}
                duration={draft.duration_minutes ?? 30}
                gameId={draft.game_id}
              />
            )}

            {currentStepName === 'mission' && selectedGame && (
              <StepMission
                gameId={selectedGame.id}
                selectedMissionId={draft.special_mission_id || undefined}
                onSelect={(mission) => {
                  setSelectedMission(mission);
                  updateDraft({
                    special_mission_id: mission?.id || null,
                    mission_additional_price: mission?.additional_price_per_player || 0,
                  });
                }}
                onNext={() => goToStep(draft.currentStep + 1)}
              />
            )}

            {currentStepName === 'customer' && (
              <Step5Customer
                defaultValues={draft}
                onSubmit={(data) => {
                  if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
                    (window as any).fbq('track', 'Lead', {
                      content_category: 'Game Booking',
                      content_name: 'Warriors Arena Booking',
                      currency: 'EGP',
                    });
                  }
                  updateDraft({ ...data });
                  goToStep(draft.currentStep + 1);
                }}
                onValidationChange={setIsStep5Valid}
                isSubmitting={isSubmitting}
              />
            )}

            {currentStepName === 'summary' && (
              <Step6Summary
                bookingData={draft}
                gameName={displayGameName || selectedGame?.name_en || ''}
                missionName={selectedMission
                  ? (locale === 'ar' ? selectedMission.name_ar : selectedMission.name_en)
                  : null}
                totalAmount={
                  Math.round(
                    ((currentPricePerPlayer + (draft.mission_additional_price || 0)) *
                     (draft.player_count || 0)) * 100
                  ) / 100
                }
                onSubmit={() => handleFinalSubmit(draft)}
                isSubmitting={isSubmitting}
                locale={locale as 'en' | 'ar'}
              />
            )}
          </WizardShell>

          {submissionError && (
            <div className="mt-3 mx-4 md:mx-0 p-4 bg-wa-error/10 border border-wa-error/30 text-wa-error font-mono text-xs uppercase flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              {submissionError}
            </div>
          )}
        </div>

        {/* Desktop sidebar summary */}
        <aside className="hidden lg:block w-full lg:w-80 lg:sticky lg:top-8 order-1 lg:order-2">
          <PriceSummary
            compact={false}
            gameName={displayGameName}
            duration={draft.duration_minutes}
            playerCount={draft.player_count}
            pricePerPlayer={currentPricePerPlayer}
            isBundle={false}
            missionName={selectedMission
              ? (locale === 'ar' ? selectedMission.name_ar : selectedMission.name_en)
              : undefined}
            missionPricePerPlayer={draft.mission_additional_price}
            pricingType={pricingType}
            ammoCount={ammoCount}
          />
        </aside>
      </div>

      {/* Mobile compact footer — shows once game + players known (after Step B) */}
      {showSummaryFooter && (
        <div className="lg:hidden flex-shrink-0 shadow-[0_-6px_20px_rgba(0,0,0,0.4)]">
          <PriceSummary
            compact
            gameName={displayGameName}
            duration={draft.duration_minutes}
            playerCount={draft.player_count}
            pricePerPlayer={currentPricePerPlayer}
            isBundle={false}
            missionName={selectedMission
              ? (locale === 'ar' ? selectedMission.name_ar : selectedMission.name_en)
              : undefined}
            missionPricePerPlayer={draft.mission_additional_price}
            pricingType={pricingType}
            ammoCount={ammoCount}
          />
        </div>
      )}

      {/* Conflict modal */}
      {showConflictModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-wa-black/90 backdrop-blur-sm">
          <WAPanel hot className="max-w-md w-full p-8 flex flex-col items-center text-center gap-6">
            <AlertTriangle className="w-16 h-16 text-wa-orange animate-pulse" />
            <h2 className="text-2xl font-archivo uppercase text-wa-orange">{t('Errors.conflictTitle')}</h2>
            <p className="text-wa-text/60 font-barlow">{t('Errors.conflictMessage')}</p>
            <WAButton
              variant="orange"
              className="w-full"
              onClick={() => {
                setShowConflictModal(false);
                updateDraft({ start_time: undefined });
                goToStep(stepIndex('date'));
              }}
            >
              {t('Errors.pickAnother')}
            </WAButton>
          </WAPanel>
        </div>
      )}
    </div>
  );
};
