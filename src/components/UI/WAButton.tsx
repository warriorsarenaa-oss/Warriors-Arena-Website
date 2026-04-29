"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "orange" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const WAButton: React.FC<WAButtonProps> = ({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  children,
  ...props
}) => {
  const variants = {
    primary: "wa-btn",
    orange: "wa-btn wa-btn--orange",
    ghost: "wa-btn wa-btn--ghost",
  };

  const sizes = {
    sm: "wa-btn-sm",
    md: "",
    lg: "px-10 py-5 text-base font-bold",
  };

  return (
    <button
      type={type}
      className={cn(variants[variant], sizes[size], className)}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};
