import { useState, useEffect } from "react";

export interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
}

declare global {
  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
  }
}

export function useBattery() {
  const [batteryState, setBatteryState] = useState<{
    supported: boolean;
    level: number;
    charging: boolean;
  }>({
    supported: false,
    level: 1,
    charging: true,
  });

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.getBattery) {
      setBatteryState((prev) => ({ ...prev, supported: false }));
      return;
    }

    let battery: BatteryManager | null = null;

    const updateBatteryInfo = (bat: BatteryManager) => {
      setBatteryState({
        supported: true,
        level: bat.level,
        charging: bat.charging,
      });
    };

    const handleLevelChange = () => {
      if (battery) updateBatteryInfo(battery);
    };

    const handleChargingChange = () => {
      if (battery) updateBatteryInfo(battery);
    };

    navigator.getBattery().then((bat) => {
      battery = bat;
      updateBatteryInfo(bat);

      bat.addEventListener("levelchange", handleLevelChange);
      bat.addEventListener("chargingchange", handleChargingChange);
    }).catch((err) => {
      console.warn("Failed to get battery status:", err);
      setBatteryState((prev) => ({ ...prev, supported: false }));
    });

    return () => {
      if (battery) {
        battery.removeEventListener("levelchange", handleLevelChange);
        battery.removeEventListener("chargingchange", handleChargingChange);
      }
    };
  }, []);

  const isLowPower = batteryState.supported && batteryState.level < 0.20 && !batteryState.charging;

  return {
    ...batteryState,
    isLowPower,
  };
}
