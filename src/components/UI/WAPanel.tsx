"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface WAPanelProps {
  children: React.ReactNode;
  className?: string;
  /** Optional panel header rendered above children as a labelled kicker. */
  title?: string;
  withBrackets?: boolean;
  withClip?: boolean;
  hot?: boolean;
}

export const WAPanel: React.FC<WAPanelProps> = ({
  children,
  className,
  title,
  withBrackets = true,
  withClip = true,
  hot = false,
}) => {
  return (
    <div
      className={cn(
        "wa-panel",
        withClip && "wa-panel-clip",
        withBrackets && "wa-brackets",
        hot && "wa-panel--hot",
        className
      )}
    >
      {title && (
        <div className="px-6 pt-4 pb-0">
          <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-wa-green/60 font-bold">
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  );
};
