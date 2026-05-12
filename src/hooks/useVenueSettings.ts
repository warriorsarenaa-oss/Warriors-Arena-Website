"use client";

import { useState, useEffect } from "react";

interface DepositConfig {
  enabled: boolean;
  percentage: number;
}

interface ParkEntranceConfig {
  regular_price: number;
  holiday_price: number;
}

interface VenueSettings {
  deposit_config: DepositConfig;
  park_entrance_config: ParkEntranceConfig;
}

export function useVenueSettings() {
  const [settings, setSettings] = useState<VenueSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/v1/venue-settings");
        if (res.ok) {
          const data = await res.json();
          // Map array of {key, value} to object
          const mapped = data.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
          }, {});
          setSettings(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch venue settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  return { settings, loading };
}
