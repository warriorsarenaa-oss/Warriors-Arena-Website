"use client";

import React from "react";
import { useTranslations } from "next-intl";

export const HowItWorks: React.FC = () => {
  const t = useTranslations("Landing.HowItWorks");

  const steps = [
    { n: "01", title: t("step1Title"), desc: t("step1Desc") },
    { n: "02", title: t("step2Title"), desc: t("step2Desc") },
    { n: "03", title: t("step3Title"), desc: t("step3Desc") },
    { n: "04", title: t("step4Title"), desc: t("step4Desc") },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {steps.map((step, i) => (
        <div
          key={i}
          className="wa-panel border border-wa-line p-5 md:p-6 relative"
          style={{
            background: "linear-gradient(180deg, var(--color-wa-panel-2,#1d231f) 0%, var(--color-wa-panel,#161b18) 100%)",
          }}
        >
          {/* Large step number watermark */}
          <div className="font-archivo text-5xl md:text-6xl text-wa-green leading-none mb-4 select-none">
            {step.n}
          </div>

          {/* Divider */}
          <div className="h-px bg-wa-line-hot mb-4" />

          <h4 className="font-archivo text-lg md:text-xl text-white uppercase tracking-wide mb-2">
            {step.title}
          </h4>
          <p className="text-[13px] md:text-sm text-wa-text-dim leading-relaxed">
            {step.desc}
          </p>
        </div>
      ))}
    </div>
  );
};
