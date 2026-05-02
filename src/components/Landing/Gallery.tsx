"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SectionHeader } from "../UI/SectionHeader";

const fallbackImages = [
  "https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&w=1200",
  "https://images.unsplash.com/photo-1511871893393-82e9c16b81e3?auto=format&fit=crop&w=800",
  "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&w=800",
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800",
];

export const Gallery: React.FC<{ locale?: string }> = ({ locale = "en" }) => {
  const t = useTranslations("Landing.Gallery");
  const isRtl = locale === "ar";
  const [images, setImages] = useState<any[]>([]);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch('/api/v1/cms/gallery');
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) setImages(data);
        }
      } catch (err) {
        console.error("Failed to fetch gallery", err);
      }
    };
    fetchGallery();
  }, []);

  const displayImages = images.length > 0 ? images.map(img => img.url) : fallbackImages;

  return (
    <div>
      <SectionHeader title={t("galleryTitle", { fallback: "FROM THE ARENA" })} line={t("galleryLine", { fallback: "Visual intel from past operations." })} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[300px]">
        {displayImages.map((src, i) => {
          let colSpan = "";
          let label = "";
          if (i % 4 === 0) {
            colSpan = "md:col-span-2 md:row-span-2";
            label = "Zone Alpha: Field Ops";
          } else if (i % 4 === 3) {
            colSpan = "md:col-span-2";
            label = "Close Quarter Combat";
          }
          
          return (
            <div key={i} className={`${colSpan} relative overflow-hidden wa-panel-clip border border-wa-line`}>
              <Image
                src={src}
                alt="Arena"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105"
              />
              {label && <div className={`absolute ${i % 4 === 0 ? 'top-6 left-6' : 'bottom-6 right-6'} wa-tape ${i % 4 === 3 ? 'wa-tape--orange' : ''} text-[10px]`}>{label}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
