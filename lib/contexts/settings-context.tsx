"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { settingsApi } from "@/lib/api";

export interface SiteSettings {
  backgroundColor: string;
  backgroundGradient: {
    enabled: boolean;
    from: string;
    to: string;
    direction: string;
  };
  wallpaperUrl: string | null;
  cardOpacity: number;
}

const defaultSettings: SiteSettings = {
  backgroundColor: "#0a0a0a",
  backgroundGradient: {
    enabled: false,
    from: "#0a0a0a",
    to: "#1a1a2e",
    direction: "to-b",
  },
  wallpaperUrl: null,
  cardOpacity: 80,
};

interface SettingsContextType {
  settings: SiteSettings;
  updateSettings: (partial: Partial<SiteSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);
  const apiSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    // 1. 先从 localStorage 快速加载
    const stored = localStorage.getItem("site-settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      } catch {
        // ignore parse errors
      }
    }

    // 2. 后台从 API 拉取最新
    settingsApi.get().then((data) => {
      if (data?.siteSettings) {
        const apiSettings = data.siteSettings as unknown as Partial<SiteSettings>;
        const merged = { ...defaultSettings, ...apiSettings };
        setSettings(merged);
        localStorage.setItem("site-settings", JSON.stringify(merged));
      }
    }).catch((err) => {
      console.warn("Failed to fetch settings from API, using cache:", err);
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("site-settings", JSON.stringify(settings));

    // 防抖同步到 API（避免频繁调色时大量请求）
    if (apiSyncTimer.current) clearTimeout(apiSyncTimer.current);
    apiSyncTimer.current = setTimeout(() => {
      settingsApi.update({ siteSettings: settings as unknown as import("@/lib/api").SiteSettings }).catch((err) => {
        console.warn("Failed to save settings to API:", err);
      });
    }, 1000);
  }, [settings, mounted]);

  const updateSettings = (partial: Partial<SiteSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
