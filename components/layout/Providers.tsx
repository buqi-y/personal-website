"use client";

import React from "react";
import { ThemeProvider } from "@/lib/contexts/theme-context";
import { SettingsProvider } from "@/lib/contexts/settings-context";
import { EditorProvider } from "@/lib/contexts/editor-context";
import { BackgroundLayer } from "./BackgroundLayer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <EditorProvider>
          <BackgroundLayer>{children}</BackgroundLayer>
        </EditorProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
