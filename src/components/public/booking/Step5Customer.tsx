"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { User, Phone, Mail, FileText, CheckCircle2 } from "lucide-react";

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

  const {
    register,
    handleSubmit,
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

  return (
    <form id="booking-form" onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Name */}
        <div className="flex flex-col gap-2">
          <label className="text-wa-text/60 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            <User className="w-3 h-3" />
            {t("fullName")} *
          </label>
          <input
            {...register("customer_name")}
            className={`bg-wa-text/5 border-2 p-4 text-wa-text outline-none transition-all ${
              errors.customer_name ? "border-wa-error/50" : "border-wa-text/10 focus:border-wa-green shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]"
            }`}
            placeholder="e.g. Ahmed Hassan"
          />
          {errors.customer_name && (
            <span className="text-wa-error text-[10px] uppercase font-mono">{errors.customer_name.message}</span>
          )}
        </div>

        {/* 2. Phone */}
        <div className="flex flex-col gap-2">
          <label className="text-wa-text/60 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Phone className="w-3 h-3" />
            {t("phone")} *
          </label>
          <input
            {...register("customer_phone")}
            className={`bg-wa-text/5 border-2 p-4 text-wa-text outline-none transition-all ${
              errors.customer_phone ? "border-wa-error/50" : "border-wa-text/10 focus:border-wa-green shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]"
            }`}
            placeholder="01xxxxxxxxx"
          />
          {errors.customer_phone && (
            <span className="text-wa-error text-[10px] uppercase font-mono">{errors.customer_phone.message}</span>
          )}
        </div>

        {/* 3. Email */}
        <div className="flex flex-col gap-2">
          <label className="text-wa-text/60 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Mail className="w-3 h-3" />
            {t("email")} ({t("optional")})
          </label>
          <input
            {...register("customer_email")}
            className={`bg-wa-text/5 border-2 p-4 text-wa-text outline-none transition-all border-wa-text/10 focus:border-wa-green shadow-[inset_0_0_10px_rgba(255,255,255,0.02)] ${
              errors.customer_email ? "border-wa-error/50" : ""
            }`}
            placeholder="email@example.com"
          />
          {errors.customer_email && (
            <span className="text-wa-error text-[10px] uppercase font-mono">{errors.customer_email.message}</span>
          )}
        </div>

        {/* 4. Notes */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-wa-text/60 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-3 h-3" />
            {t("specialRequests")} ({t("optional")})
          </label>
          <textarea
            {...register("customer_notes")}
            rows={3}
            className="bg-wa-text/5 border-2 border-wa-text/10 p-4 text-wa-text outline-none focus:border-wa-green transition-all shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]"
            placeholder={t("notesPlaceholder")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 py-6 border-y border-wa-gray/20">
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="relative mt-1">
            <input
              type="checkbox"
              {...register("terms_agreed")}
              className="peer sr-only"
            />
            <div className={`w-5 h-5 border-2 transition-all group-hover:border-wa-green ${errors.terms_agreed ? "border-wa-error" : "border-wa-text/40 peer-checked:bg-wa-green peer-checked:border-wa-green"}`} />
            <CheckCircle2 className="absolute top-0 left-0 w-5 h-5 text-wa-bg opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-wa-text/60 leading-relaxed font-barlow">
            {t("termsNote")} <a href="#" className="text-wa-green underline hover:text-wa-orange">{t("rules")}</a> {t("and")} <a href="#" className="text-wa-green underline hover:text-wa-orange">{t("cancelPolicy")}</a>.
          </p>
        </label>
        {errors.terms_agreed && (
          <span className="text-wa-error text-[10px] uppercase font-mono">{errors.terms_agreed.message}</span>
        )}
      </div>
    </form>
  );
};
