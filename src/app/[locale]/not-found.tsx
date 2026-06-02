"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { WAPanel } from "@/components/UI/WAPanel";
import { WAButton } from "@/components/UI/WAButton";

export default function NotFound() {
  const t = useTranslations("Common"); // Assuming Common has generic translations or we just hardcode EN/AR structure

  return (
    <div className="min-h-screen bg-wa-bg flex items-center justify-center p-4">
      <WAPanel className="max-w-md w-full text-center p-8 border border-wa-green/20">
        <h1 className="text-6xl font-heading font-bold text-wa-green mb-4">404</h1>
        <h2 className="text-2xl font-bold uppercase tracking-widest mb-6">Page Not Found</h2>
        <p className="text-wa-text/70 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/">
          <WAButton className="bg-wa-green text-wa-bg font-bold w-full">
            BACK TO HOME
          </WAButton>
        </Link>
      </WAPanel>
    </div>
  );
}
