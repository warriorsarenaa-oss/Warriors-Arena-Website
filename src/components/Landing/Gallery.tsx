"use client";

import React from "react";
import Image from "next/image";

const images = [
  "https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&w=1200",
  "https://images.unsplash.com/photo-1511871893393-82e9c16b81e3?auto=format&fit=crop&w=800",
  "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&w=800",
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800",
];

export const Gallery: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[300px]">
      <div className="md:col-span-2 md:row-span-2 relative overflow-hidden wa-panel-clip border border-wa-line">
        <Image
          src={images[0]}
          alt="Arena Field"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105"
        />
        <div className="absolute top-6 left-6 wa-tape text-[10px]">Zone Alpha: Field Ops</div>
      </div>

      <div className="relative overflow-hidden wa-panel-clip border border-wa-line">
        <Image
          src={images[1]}
          alt="Tactical Gear"
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105"
        />
      </div>

      <div className="relative overflow-hidden wa-panel-clip border border-wa-line">
        <Image
          src={images[2]}
          alt="Squad Moment"
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105"
        />
      </div>

      <div className="md:col-span-2 relative overflow-hidden wa-panel-clip border border-wa-line">
        <Image
          src={images[3]}
          alt="Action Shot"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105"
        />
        <div className="absolute bottom-6 right-6 wa-tape wa-tape--orange text-[10px]">Close Quarter Combat</div>
      </div>
    </div>
  );
};
