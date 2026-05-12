"use client";

import React, { useState, useEffect } from "react";
import { WAButton } from "../UI/WAButton";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Menu, X, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { useBooking } from "@/contexts/BookingContext";

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;
  const t = useTranslations("Landing.Nav");
  const { openWizard } = useBooking();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLocale = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    window.location.href = newPath;
  };

  const navLinks = [
    { label: t("games"), href: "#games" },
    { label: t("missions"), href: "#missions" },
    { label: t("howItWorks"), href: "#how" },
    { label: t("location"), href: "#location" },
  ];

  return (
    <header
      className="sticky top-0 z-50 border-b border-wa-line"
      style={{
        background: "rgba(10,13,10,0.85)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-[1320px] mx-auto px-6 py-3.5 flex items-center gap-6">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center no-underline shrink-0 group">
          <div className="relative w-12 h-12 md:w-14 md:h-14 overflow-hidden border border-wa-green/20 group-hover:border-wa-green transition-colors"
               style={{ clipPath: "polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)" }}>
            <img src="/logo.jpg" alt="Warriors Arena" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="ms-3 leading-none flex flex-col">
            <span className="font-archivo text-[18px] text-wa-text uppercase tracking-tight">WARRIORS</span>
            <span className="font-mono text-[10px] text-wa-green tracking-[0.2em]">ARENA · EGY</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 flex-1 ms-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-archivo text-[13px] uppercase tracking-[0.1em] text-wa-text-dim no-underline transition-colors hover:text-wa-green"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-3">
          {/* Language toggle */}
          <button
            type="button"
            onClick={toggleLocale}
            className="flex items-center gap-1.5 border border-wa-line text-wa-text-dim px-3 py-2 text-[12px] font-mono uppercase tracking-wider hover:border-wa-green hover:text-wa-green transition-colors bg-transparent cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            {locale === "en" ? "AR" : "EN"}
          </button>

          {/* Book CTA */}
          <WAButton variant="primary" size="sm" type="button" onClick={() => openWizard()}>
            {t("bookNow")}
          </WAButton>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden text-wa-green p-2 bg-transparent border-0 cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-wa-line bg-wa-bg/98 px-6 py-8 flex flex-col gap-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-archivo text-2xl text-white lowercase tracking-widest no-underline hover:text-wa-green transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="h-px bg-wa-line" />
          <WAButton type="button" className="w-full py-4 text-base" onClick={() => { openWizard(); setMenuOpen(false); }}>
            {t("bookNow")}
          </WAButton>
        </div>
      )}
    </header>
  );
};
