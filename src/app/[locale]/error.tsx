"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-wa-bg flex items-center justify-center p-4">
      <WAPanel className="max-w-md w-full text-center p-8 border border-wa-error/20">
        <h1 className="text-6xl font-heading font-bold text-wa-error mb-4">500</h1>
        <h2 className="text-2xl font-bold uppercase tracking-widest mb-6">Something Went Wrong</h2>
        <p className="text-wa-text/70 mb-8">
          We're sorry. An unexpected error occurred. Please try again or contact support.
        </p>
        <div className="flex flex-col gap-4">
          <WAButton onClick={() => reset()} className="bg-transparent border border-wa-text/20 font-bold w-full">
            RETRY
          </WAButton>
          <Link href="/" className="w-full">
            <WAButton className="bg-wa-green text-wa-bg font-bold w-full">
              BACK TO HOME
            </WAButton>
          </Link>
        </div>
      </WAPanel>
    </div>
  );
}
