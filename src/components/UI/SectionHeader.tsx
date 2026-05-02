import React from "react";

export function SectionHeader({
  kicker,
  title,
  line,
}: {
  kicker?: string;
  title: string;
  line?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-10 flex-wrap mb-12">
      <div>
        {kicker && (
          <div className="font-mono text-wa-green text-[12px] tracking-[0.2em] mb-3 uppercase">
            {kicker}
          </div>
        )}
        <h2
          className="font-archivo uppercase m-0 leading-none text-wa-text"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
        >
          {title}
        </h2>
      </div>
      {line && (
        <p className="max-w-[440px] text-wa-text-dim text-base mb-1.5">{line}</p>
      )}
    </div>
  );
}
