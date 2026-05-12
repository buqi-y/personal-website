"use client";

import React from "react";
import { useSettings } from "@/lib/contexts/settings-context";

export function BackgroundLayer({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  const getBackgroundStyle = (): React.CSSProperties => {
    if (settings.wallpaperUrl) {
      return {
        backgroundImage: `url(${settings.wallpaperUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      };
    }

    if (settings.backgroundGradient.enabled) {
      const directionMap: Record<string, string> = {
        "to-r": "to right",
        "to-l": "to left",
        "to-b": "to bottom",
        "to-t": "to top",
        "to-br": "to bottom right",
        "to-bl": "to bottom left",
        "to-tr": "to top right",
        "to-tl": "to top left",
      };
      const dir = directionMap[settings.backgroundGradient.direction] || "to bottom";
      return {
        background: `linear-gradient(${dir}, ${settings.backgroundGradient.from}, ${settings.backgroundGradient.to})`,
      };
    }

    return {
      backgroundColor: settings.backgroundColor,
    };
  };

  const combinedStyle: React.CSSProperties = {
    ...getBackgroundStyle(),
    // Expose cardOpacity as CSS variable for glass cards
    "--card-opacity": settings.cardOpacity / 100,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen flex flex-col" style={combinedStyle}>
      {children}
    </div>
  );
}
