"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "../UI/SectionHeader";

export const HowItWorks: React.FC<{ locale?: string }> = ({ locale = "en" }) => {
  const t = useTranslations("Landing.HowItWorks");
  const isRtl = locale === "ar";
  const [steps, setSteps] = useState<any[]>([]);

  useEffect(() => {
    const fetchSteps = async () => {
      try {
        const res = await fetch('/api/v1/cms/protocol');
        if (res.ok) {
          const data = await res.json();
          setSteps(data);
        }
      } catch (err) {
        console.error("Failed to fetch protocol", err);
      }
    };
    fetchSteps();
  }, []);

  // Fallback to translations if CMS is empty
  const displaySteps = steps.length > 0 ? steps.map(s => ({
    n: String(s.step_number).padStart(2, '0'),
    title: isRtl ? s.title_ar || s.title_en : s.title_en,
    desc: isRtl ? s.description_ar || s.description_en : s.description_en
  })) : [
    { n: "01", title: t("step1Title"), desc: t("step1Desc") },
    { n: "02", title: t("step2Title"), desc: t("step2Desc") },
    { n: "03", title: t("step3Title"), desc: t("step3Desc") },
    { n: "04", title: t("step4Title"), desc: t("step4Desc") },
  ];

  return (
    <div>
      <SectionHeader title={t("howItWorksTitle")} line={t("howItWorksLine")} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displaySteps.map((step, i) => (
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
    </div>
  );
};
