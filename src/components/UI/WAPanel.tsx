"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WAPanelProps {
  children: React.ReactNode;
  className?: string;
  withBrackets?: boolean;
  withClip?: boolean;
  hot?: boolean;
}

export const WAPanel: React.FC<WAPanelProps> = ({
  children,
  className,
  withBrackets = true,
  withClip = true,
  hot = false,
}) => {
  return (
    <div className={cn(
      "wa-panel",
      withClip && "wa-panel-clip",
      withBrackets && "wa-brackets",
      hot && "wa-panel--hot",
      className
    )}>
      {children}
    </div>
  );
};
