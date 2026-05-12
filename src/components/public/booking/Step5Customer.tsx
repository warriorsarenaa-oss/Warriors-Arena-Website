"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { User, Phone, Mail, FileText, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";

const EGYPT_PHONE_REGEX = /^(\+20|0)?1[0125][0-9]{8}$/;

const schema = z.object({
  customer_name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  customer_phone: z.string().regex(EGYPT_PHONE_REGEX, "Invalid Egyptian phone number"),
  customer_email: z.string().email("Invalid email format").optional().or(z.literal("")),
  customer_notes: z.string().max(500).optional(),
  terms_agreed: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms",
  }),
});

type FormData = z.infer<typeof schema>;

interface Step5CustomerProps {
  defaultValues: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  onValidationChange?: (isValid: boolean) => void;
  isSubmitting: boolean;
}

export const Step5Customer: React.FC<Step5CustomerProps> = ({
  defaultValues,
  onSubmit,
  onValidationChange,
  isSubmitting,
}) => {
  const t = useTranslations("Booking.Step5");

  const [showPolicy, setShowPolicy] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      ...defaultValues,
      terms_agreed: false as any,
    },
  });

  // Sync validation state to parent
  React.useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const onFormSubmit = (data: FormData) => {
    onSubmit(data);
  };

  const isChecked = watch("terms_agreed");

  return (
    <form id="booking-form" onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="customer_name" className="text-wa-text/60 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            <User className="w-3 h-3" />
            {t("fullName")} *
          </label>
          <input
            id="customer_name"
            type="text"
            autoComplete="name"
            {...register("customer_name")}
            aria-invalid={!!errors.customer_name}
            aria-describedby={errors.customer_name ? "name-error" : undefined}
            className={`bg-wa-text/5 border-2 p-4 text-wa-text outline-none transition-all ${
              errors.customer_name ? "border-wa-error/50" : "border-wa-text/10 focus:border-wa-green shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]"
            }`}
            placeholder="e.g. Ahmed Hassan"
          />
          {errors.customer_name && (
            <span id="name-error" role="alert" className="text-wa-error text-xs font-mono">{errors.customer_name.message}</span>
          )}
        </div>

        {/* 2. Phone */}
        <div className="flex flex-col gap-2">
          <label htmlFor="customer_phone" className="text-wa-text/60 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Phone className="w-3 h-3" />
            {t("phone")} *
          </label>
          <input
            id="customer_phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...register("customer_phone")}
            aria-invalid={!!errors.customer_phone}
            aria-describedby={errors.customer_phone ? "phone-error" : undefined}
            className={`bg-wa-text/5 border-2 p-4 text-wa-text outline-none transition-all ${
              errors.customer_phone ? "border-wa-error/50" : "border-wa-text/10 focus:border-wa-green shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]"
            }`}
            placeholder="01xxxxxxxxx"
          />
          {errors.customer_phone && (
            <span id="phone-error" role="alert" className="text-wa-error text-xs font-mono">{errors.customer_phone.message}</span>
          )}
        </div>

        {/* 3. Email */}
        <div className="flex flex-col gap-2">
          <label htmlFor="customer_email" className="text-wa-text/60 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Mail className="w-3 h-3" />
            {t("email")} ({t("optional")})
          </label>
          <input
            id="customer_email"
            type="email"
            autoComplete="email"
            {...register("customer_email")}
            aria-invalid={!!errors.customer_email}
            aria-describedby={errors.customer_email ? "email-error" : undefined}
            className={`bg-wa-text/5 border-2 p-4 text-wa-text outline-none transition-all border-wa-text/10 focus:border-wa-green shadow-[inset_0_0_10px_rgba(255,255,255,0.02)] ${
              errors.customer_email ? "border-wa-error/50" : ""
            }`}
            placeholder="email@example.com"
          />
          {errors.customer_email && (
            <span id="email-error" role="alert" className="text-wa-error text-xs font-mono">{errors.customer_email.message}</span>
          )}
        </div>

        {/* 4. Notes */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="customer_notes" className="text-wa-text/60 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-3 h-3" />
            {t("specialRequests")} ({t("optional")})
          </label>
          <textarea
            id="customer_notes"
            autoComplete="off"
            {...register("customer_notes")}
            rows={3}
            className="bg-wa-text/5 border-2 border-wa-text/10 p-4 text-wa-text outline-none focus:border-wa-green transition-all shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]"
            placeholder={t("notesPlaceholder")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 py-6 border-y border-wa-gray/20">
        <div className="relative">
          <input
            id="terms_agreed"
            type="checkbox"
            {...register("terms_agreed")}
            className="peer sr-only"
          />
          <label htmlFor="terms_agreed" className="flex items-start gap-4 cursor-pointer group select-none">
            {/* Custom checkbox box */}
            <div className={`
              w-6 h-6 border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200
              ${isChecked 
                ? "border-wa-green bg-wa-green shadow-[0_0_10px_rgba(0,255,65,0.3)]" 
                : "border-wa-text/20 group-hover:border-wa-green/50 bg-wa-text/5"
              }
              ${errors.terms_agreed ? "border-wa-error" : ""}
            `}>
              {isChecked && (
                <CheckCircle2 className="w-4 h-4 text-wa-bg" />
              )}
            </div>

            <p className="text-xs text-wa-text/60 leading-relaxed font-barlow">
              {t("termsNote")} 
              {" "}
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPolicy(true);
                }}
                className="text-wa-green underline hover:text-wa-orange transition-colors"
              >
                {t("cancelPolicy")}
              </button>.
            </p>
          </label>
        </div>
        {errors.terms_agreed && (
          <span id="terms-error" role="alert" className="text-wa-error text-[10px] font-mono uppercase tracking-widest mt-1">
            {errors.terms_agreed.message}
          </span>
        )}
      </div>

      {/* Cancellation Policy Popup */}
      {showPolicy && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-wa-black/95 backdrop-blur-md">
          <WAPanel hot className="max-w-md w-full p-8 flex flex-col items-center text-center gap-6 relative">
            <button 
              onClick={() => setShowPolicy(false)}
              className="absolute top-4 right-4 text-wa-text/40 hover:text-wa-green transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-16 h-16 bg-wa-orange/20 rounded-full flex items-center justify-center border-2 border-wa-orange/50">
              <AlertTriangle className="w-8 h-8 text-wa-orange" />
            </div>

            <div>
              <h3 className="text-xl font-archivo text-wa-orange uppercase tracking-widest mb-4">
                {t("cancelPolicy")}
              </h3>
              <p className="text-wa-text/80 font-barlow leading-relaxed">
                Before 6 hours of the booked slot only.
              </p>
            </div>

            <WAButton 
              variant="orange" 
              className="w-full mt-2"
              onClick={() => setShowPolicy(false)}
            >
              UNDERSTOOD
            </WAButton>
          </WAPanel>
        </div>
      )}
    </form>
  );
};
