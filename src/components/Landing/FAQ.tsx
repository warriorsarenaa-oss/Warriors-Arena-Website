"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

export const FAQ: React.FC = () => {
  const t = useTranslations("Landing.FAQ");
  const [openIndex, setOpenIndex] = useState<number>(0);

  const items = [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
  ];

  return (
    <div className="max-w-[1020px] mx-auto flex flex-col gap-1.5">
      {items.map((item, i) => (
        <div
          key={i}
          className="wa-panel border border-wa-line cursor-pointer"
          style={{
            background: "linear-gradient(180deg, var(--color-wa-panel-2,#1d231f) 0%, var(--color-wa-panel,#161b18) 100%)",
          }}
          onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
        >
          {/* Question row */}
          <div className="flex items-center gap-4 px-6 py-5">
            <span className="font-mono text-xs text-wa-green shrink-0">
              0{i + 1}
            </span>
            <div className="flex-1 font-archivo text-lg text-white uppercase tracking-tight">
              {item.q}
            </div>
            <div
              className="text-wa-green transition-transform duration-150 shrink-0"
              style={{ transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)" }}
            >
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
          </div>

          {/* Answer */}
          <AnimatePresence initial={false}>
            {openIndex === i && (
              <motion.div
                key="answer"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 ps-10 md:ps-14 text-wa-text-dim text-sm md:text-[15px] leading-relaxed border-t border-wa-line pt-4">
                  {item.a}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
