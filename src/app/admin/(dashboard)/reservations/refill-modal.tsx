"use client";

import React, { useState } from "react";
import { Minus, Plus, Loader2, Package, X } from "lucide-react";
import { WAButton } from "@/components/UI/WAButton";
import { WAPanel } from "@/components/UI/WAPanel";

interface RefillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingCode: string;
  playerCount: number;
  onSuccess?: () => void;
}

export const RefillModal: React.FC<RefillModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  bookingCode,
  playerCount,
  onSuccess
}) => {
  const [refillPlayers, setRefillPlayers] = useState(playerCount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const pricePerPlayer = 50;
  const totalCost = refillPlayers * pricePerPlayer;

  const handleIncrement = () => {
    if (refillPlayers < playerCount) {
      setRefillPlayers(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (refillPlayers > 1) {
      setRefillPlayers(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/admin/reservations/${bookingId}/refill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_count: refillPlayers,
          ammo_per_player: 400,
          price_per_player: pricePerPlayer
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add refill");
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm">
      <WAPanel className="max-w-md w-full p-8 border-wa-green/30 bg-wa-bg relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-wa-text/30 hover:text-wa-text transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <Package className="w-6 h-6 text-wa-green" />
          <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-wa-green font-heading">
            Add Ammo Refill
          </h2>
        </div>
        <p className="text-[10px] text-wa-text/40 font-mono uppercase tracking-[0.2em] mb-8">
          Booking Code: <span className="text-wa-text/60">{bookingCode}</span>
        </p>

        <div className="space-y-8">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50 text-wa-text/60">
              Players Getting Refill
            </label>
            <div className="flex items-center gap-6 bg-wa-bg/50 p-4 border border-wa-green/10 rounded-xl">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={refillPlayers <= 1}
                className="w-10 h-10 flex items-center justify-center border border-wa-green/20 rounded-full hover:bg-wa-green/10 disabled:opacity-20 disabled:cursor-not-allowed text-wa-green transition-all"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <div className="flex-1 text-center">
                <span className="text-4xl font-mono font-bold text-wa-text tracking-tighter">
                  {refillPlayers}
                </span>
                <span className="text-[10px] uppercase tracking-widest block text-wa-text/40 mt-1">
                  Selected
                </span>
              </div>

              <button
                type="button"
                onClick={handleIncrement}
                disabled={refillPlayers >= playerCount}
                className="w-10 h-10 flex items-center justify-center border border-wa-green/20 rounded-full hover:bg-wa-green/10 disabled:opacity-20 disabled:cursor-not-allowed text-wa-green transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[9px] text-wa-text/30 font-mono uppercase text-center tracking-wider">
              Max {playerCount} players from original booking
            </p>
          </div>

          <div className="bg-wa-green/5 border border-wa-green/20 p-6 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-wa-text/40 text-[10px] uppercase tracking-widest font-mono">Package</span>
              <span className="text-wa-text font-bold text-sm tracking-wide">400 Bullets / Player</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-wa-text/40 text-[10px] uppercase tracking-widest font-mono">Rate</span>
              <span className="text-wa-text font-bold text-sm tracking-wide">50 EGP</span>
            </div>
            <div className="h-px bg-wa-green/10" />
            <div className="flex justify-between items-end">
              <span className="text-wa-green/60 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Total Cost</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-wa-green">{totalCost}</span>
                <span className="text-wa-green/60 text-xs font-bold uppercase">EGP</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <WAButton 
              onClick={onClose}
              className="flex-1 border border-wa-text/10 text-wa-text/40 hover:text-wa-text hover:bg-wa-text/5 font-bold py-4"
            >
              CANCEL
            </WAButton>
            <WAButton 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-wa-green text-wa-bg font-bold py-4 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "CONFIRM REFILL"
              )}
            </WAButton>
          </div>
        </div>
      </WAPanel>
    </div>
  );
};

