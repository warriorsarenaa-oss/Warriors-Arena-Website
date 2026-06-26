"use client";

import React from "react";
import Image from "next/image";
import { WAPanel } from "../UI/WAPanel";
import { WAButton } from "../UI/WAButton";
import { Target } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";

interface GameCardProps {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  price: number | null;
  isHot?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({
  id,
  name,
  description,
  image,
  price,
  isHot = false,
}) => {
  const { openWizard } = useBooking();

  return (
    <WAPanel
      className="h-full flex flex-col group p-0 border-l-[3px] border-l-wa-green hover:border-wa-green transition-all duration-300"
      withBrackets={false}
      hot={isHot}
    >
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={image}
          alt={`${name} game at Warriors Arena, Heliopolis Cairo`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-wa-bg/90 to-transparent" />

        {price !== null && (
          <div className="absolute top-4 right-4">
            <span className="wa-tape wa-tape--orange text-[10px] font-bold">
              FROM {price} EGP
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-3xl font-archivo text-wa-green mb-3 uppercase tracking-tighter">
          {name}
        </h3>

        <p className="text-sm text-wa-text-dim mb-8 flex-grow italic leading-relaxed">
          {description}
        </p>

        <WAButton
          variant="primary"
          className="w-full justify-between"
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
              (window as any).fbq("track", "InitiateCheckout", {
                content_category: "Game Booking",
                content_name: "Warriors Arena Booking",
                currency: "EGP",
              });
            }
            openWizard({ kind: "game", id });
          }}
        >
          <span>SELECT MISSION</span>
          <Target className="w-4 h-4 ml-2 opacity-50" />
        </WAButton>
      </div>
    </WAPanel>
  );
};
