"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/contexts/settings-context";
import { RotateCcw, Image, Upload, Trash2, Link } from "lucide-react";
import { Input } from "@/components/ui/input";
import { mediaApi } from "@/lib/api";

// ─── Color Utility Functions ───────────────────────────────────────────────────

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 4];
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

// ─── Preset Themes ─────────────────────────────────────────────────────────────

const presetThemes = [
  { name: "深空", colors: ["#0a0a0f", "#1a1a2e"], icon: "✦" },
  { name: "暗夜紫", colors: ["#0d0015", "#1a0533"], icon: "◆" },
  { name: "深海蓝", colors: ["#0a1628", "#0f2540"], icon: "◇" },
  { name: "森林", colors: ["#0a1a0a", "#0f2818"], icon: "♠" },
  { name: "暖夜", colors: ["#1a0f0a", "#2d1810"], icon: "♣" },
  { name: "玫瑰金", colors: ["#1a0a10", "#2d1520"], icon: "♥" },
  { name: "极光", colors: ["#0a1a1a", "#0f2828"], icon: "◈" },
  { name: "日落", colors: ["#1a100a", "#2d1a0f"], icon: "●" },
  { name: "纯黑", colors: ["#000000", "#0a0a0a"], icon: "■" },
  { name: "星云", colors: ["#0f0a1a", "#1a1033"], icon: "☆" },
];

// ─── Gradient Directions ───────────────────────────────────────────────────────

const gradientDirectionMap: Record<string, { angle: number; label: string }> = {
  "to-t": { angle: 0, label: "上" },
  "to-tr": { angle: 45, label: "右上" },
  "to-r": { angle: 90, label: "右" },
  "to-br": { angle: 135, label: "右下" },
  "to-b": { angle: 180, label: "下" },
  "to-bl": { angle: 225, label: "左下" },
  "to-l": { angle: 270, label: "左" },
  "to-tl": { angle: 315, label: "左上" },
};

const directionKeys = ["to-t", "to-tr", "to-r", "to-br", "to-b", "to-bl", "to-l", "to-tl"];

// ─── Recent Colors Storage ─────────────────────────────────────────────────────

function getRecentColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("recent-bg-colors");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentColor(color: string) {
  if (typeof window === "undefined") return;
  const recent = getRecentColors().filter((c) => c !== color);
  recent.unshift(color);
  localStorage.setItem("recent-bg-colors", JSON.stringify(recent.slice(0, 6)));
}

// ─── Sub Components ────────────────────────────────────────────────────────────

/** Horizontal Hue Bar with draggable slider */
function HueBar({
  hue,
  saturation,
  lightness,
  onChange,
}: {
  hue: number;
  saturation: number;
  lightness: number;
  onChange: (hue: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const calcHue = useCallback((clientX: number) => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return Math.round((x / rect.width) * 360);
  }, []);

  const handleStart = useCallback(
    (clientX: number) => {
      isDragging.current = true;
      onChange(calcHue(clientX));
    },
    [calcHue, onChange]
  );

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging.current) return;
      onChange(calcHue(clientX));
    },
    [calcHue, onChange]
  );

  const handleEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => handleEnd();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleMove, handleEnd]);

  const gradient = `linear-gradient(to right, 
    hsl(0,${saturation}%,${lightness}%), 
    hsl(60,${saturation}%,${lightness}%), 
    hsl(120,${saturation}%,${lightness}%), 
    hsl(180,${saturation}%,${lightness}%), 
    hsl(240,${saturation}%,${lightness}%), 
    hsl(300,${saturation}%,${lightness}%), 
    hsl(360,${saturation}%,${lightness}%))`;

  return (
    <div
      ref={barRef}
      className="relative w-full h-6 rounded-full cursor-pointer border border-zinc-700 select-none"
      style={{ background: gradient }}
      onMouseDown={(e) => handleStart(e.clientX)}
      onTouchStart={(e) => {
        if (e.touches[0]) handleStart(e.touches[0].clientX);
      }}
    >
      <div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
        style={{
          left: `calc(${(hue / 360) * 100}% - 8px)`,
          backgroundColor: hslToHex(hue, saturation, lightness),
          boxShadow: "0 0 4px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
}

/** Circular Gradient Direction Selector */
function DirectionWheel({
  direction,
  onChange,
}: {
  direction: string;
  onChange: (dir: string) => void;
}) {
  const currentAngle = gradientDirectionMap[direction]?.angle ?? 180;

  return (
    <div className="relative w-[60px] h-[60px] rounded-full border border-zinc-600 bg-zinc-800/80 flex items-center justify-center">
      {/* Direction indicator line */}
      <div
        className="absolute w-[2px] h-[22px] bg-primary rounded-full origin-bottom"
        style={{
          bottom: "50%",
          left: "calc(50% - 1px)",
          transform: `rotate(${currentAngle}deg)`,
          transformOrigin: "bottom center",
        }}
      />
      {/* 8 direction dots */}
      {directionKeys.map((key) => {
        const { angle } = gradientDirectionMap[key];
        const rad = ((angle - 90) * Math.PI) / 180;
        const r = 24;
        const x = 30 + r * Math.cos(rad);
        const y = 30 + r * Math.sin(rad);
        const isActive = direction === key;
        return (
          <button
            key={key}
            className={`absolute w-2.5 h-2.5 rounded-full transition-all ${
              isActive
                ? "bg-primary scale-125 shadow-[0_0_6px_rgba(59,130,246,0.6)]"
                : "bg-zinc-500 hover:bg-zinc-400"
            }`}
            style={{
              left: `${x - 5}px`,
              top: `${y - 5}px`,
            }}
            onClick={() => onChange(key)}
            title={gradientDirectionMap[key].label}
          />
        );
      })}
      {/* Center dot */}
      <div className="w-2 h-2 rounded-full bg-zinc-600" />
    </div>
  );
}

// ─── Wallpaper Compress ─────────────────────────────────────────────────────────

async function compressWallpaper(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1920;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Wallpaper Section Component ────────────────────────────────────────────────

function WallpaperSection() {
  const { settings, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("仅支持 JPG、PNG、WebP 格式");
      return;
    }
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("文件大小不能超过 5MB");
      return;
    }
    setIsLoading(true);
    try {
      // 尝试通过 API 上传获取远程 URL
      const remoteUrl = await mediaApi.upload(file, 'wallpapers').catch(() => null);
      if (remoteUrl) {
        updateSettings({ wallpaperUrl: remoteUrl });
      } else {
        // Fallback 到 base64
        const base64 = await compressWallpaper(file);
        updateSettings({ wallpaperUrl: base64 });
      }
    } catch {
      setError("图片处理失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUrlImport = () => {
    setError(null);
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setError("URL 必须以 http:// 或 https:// 开头");
      return;
    }
    setIsLoading(true);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      updateSettings({ wallpaperUrl: url });
      setUrlInput("");
      setIsLoading(false);
    };
    img.onerror = () => {
      setError("图片加载失败，请检查 URL 是否有效");
      setIsLoading(false);
    };
    img.src = url;
  };

  const removeWallpaper = () => {
    updateSettings({ wallpaperUrl: null });
    setError(null);
  };

  return (
    <section className="space-y-3">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
        壁纸
      </Label>

      {/* Current wallpaper preview */}
      {settings.wallpaperUrl && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-10 rounded-md border border-zinc-700 bg-cover bg-center"
              style={{ backgroundImage: `url(${settings.wallpaperUrl})` }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-zinc-400 truncate">当前壁纸</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeWallpaper}
              className="h-7 w-7 p-0 text-zinc-400 hover:text-red-400"
              title="移除壁纸"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-zinc-700 hover:border-zinc-500"
        } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = "";
          }}
        />
        <Upload className="size-5 mx-auto mb-1.5 text-zinc-500" />
        <p className="text-[11px] text-zinc-400">
          {isLoading ? "处理中..." : "点击或拖拽上传图片"}
        </p>
        <p className="text-[10px] text-zinc-600 mt-0.5">
          JPG / PNG / WebP，最大 5MB
        </p>
      </div>

      {/* URL import */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
          <Input
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUrlImport();
            }}
            placeholder="粘贴图片 URL"
            className="h-8 pl-8 text-xs bg-zinc-800/60 border-zinc-700 placeholder:text-zinc-600"
            disabled={isLoading}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUrlImport}
          disabled={isLoading || !urlInput.trim()}
          className="h-8 px-3 border border-zinc-700 hover:border-zinc-500"
        >
          <Image className="size-3.5" />
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-[11px] text-red-400 animate-in fade-in duration-150">
          {error}
        </p>
      )}
    </section>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const { settings, updateSettings } = useSettings();
  const [recentColors, setRecentColors] = useState<string[]>([]);

  // HSL state for primary color
  const [hsl, setHsl] = useState<[number, number, number]>(() =>
    hexToHsl(settings.backgroundColor)
  );

  // HSL state for gradient secondary color
  const [hsl2, setHsl2] = useState<[number, number, number]>(() =>
    hexToHsl(settings.backgroundGradient.to)
  );

  // Load recent colors on mount
  useEffect(() => {
    setRecentColors(getRecentColors());
  }, []);

  // Sync HSL when settings change externally
  useEffect(() => {
    setHsl(hexToHsl(settings.backgroundColor));
  }, [settings.backgroundColor]);

  useEffect(() => {
    setHsl2(hexToHsl(settings.backgroundGradient.to));
  }, [settings.backgroundGradient.to]);

  // Apply primary color from HSL
  const applyPrimaryColor = useCallback(
    (h: number, s: number, l: number) => {
      setHsl([h, s, l]);
      const hex = hslToHex(h, s, l);
      updateSettings({ backgroundColor: hex });
      if (settings.backgroundGradient.enabled) {
        updateSettings({
          backgroundGradient: {
            ...settings.backgroundGradient,
            from: hex,
          },
        });
      }
    },
    [updateSettings, settings.backgroundGradient]
  );

  // Apply secondary color from HSL
  const applySecondaryColor = useCallback(
    (h: number, s: number, l: number) => {
      setHsl2([h, s, l]);
      const hex = hslToHex(h, s, l);
      updateSettings({
        backgroundGradient: {
          ...settings.backgroundGradient,
          to: hex,
        },
      });
    },
    [updateSettings, settings.backgroundGradient]
  );

  // Apply preset theme
  const applyTheme = (colors: string[]) => {
    const [from, to] = colors;
    updateSettings({
      backgroundColor: from,
      backgroundGradient: {
        ...settings.backgroundGradient,
        enabled: true,
        from,
        to,
      },
    });
    addRecentColor(from);
    setRecentColors(getRecentColors());
  };

  // Save to recent on color finalize
  const finalizeColor = () => {
    addRecentColor(settings.backgroundColor);
    setRecentColors(getRecentColors());
  };

  // Reset to defaults
  const resetDefaults = () => {
    updateSettings({
      backgroundColor: "#0a0a0a",
      backgroundGradient: {
        enabled: false,
        from: "#0a0a0a",
        to: "#1a1a2e",
        direction: "to-b",
      },
      cardOpacity: 80,
    });
  };

  // Check if a theme is currently active
  const isThemeActive = (colors: string[]) => {
    return (
      settings.backgroundGradient.enabled &&
      settings.backgroundGradient.from === colors[0] &&
      settings.backgroundGradient.to === colors[1]
    );
  };

  // Get CSS gradient direction string for preview
  const getGradientCSS = (dir: string, from: string, to: string) => {
    const dirMap: Record<string, string> = {
      "to-t": "to top",
      "to-tr": "to top right",
      "to-r": "to right",
      "to-br": "to bottom right",
      "to-b": "to bottom",
      "to-bl": "to bottom left",
      "to-l": "to left",
      "to-tl": "to top left",
    };
    return `linear-gradient(${dirMap[dir] || "to bottom"}, ${from}, ${to})`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="overflow-y-auto bg-zinc-900/95 border-zinc-800 p-0 w-[340px] sm:w-[380px]"
      >
        <SheetHeader className="p-4 border-b border-zinc-800">
          <SheetTitle className="text-foreground">网站设置</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            自定义网站外观
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 p-4">
          {/* ═══ 预设主题 ═══ */}
          <section className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              预设主题
            </Label>
            <div className="flex flex-wrap gap-2">
              {presetThemes.map((theme) => (
                <button
                  key={theme.name}
                  className={`group relative w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                    isThemeActive(theme.colors)
                      ? "border-primary scale-110 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                      : "border-zinc-700 hover:border-zinc-500 hover:scale-105"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})`,
                  }}
                  onClick={() => applyTheme(theme.colors)}
                  title={theme.name}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                    {theme.icon}
                  </span>
                </button>
              ))}
            </div>
            {/* Theme name labels */}
            <div className="flex flex-wrap gap-2">
              {presetThemes.map((theme) => (
                <span
                  key={theme.name}
                  className={`text-[10px] w-10 text-center truncate ${
                    isThemeActive(theme.colors)
                      ? "text-primary"
                      : "text-zinc-500"
                  }`}
                >
                  {theme.name}
                </span>
              ))}
            </div>
          </section>

          {/* ═══ 最近使用 ═══ */}
          {recentColors.length > 0 && (
            <section className="space-y-2">
              <Label className="text-xs text-muted-foreground">最近使用</Label>
              <div className="flex gap-2">
                {recentColors.map((color, i) => (
                  <button
                    key={`${color}-${i}`}
                    className={`w-6 h-6 rounded-full border transition-all ${
                      settings.backgroundColor === color
                        ? "border-primary scale-110"
                        : "border-zinc-600 hover:border-zinc-400 hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      updateSettings({ backgroundColor: color });
                      if (settings.backgroundGradient.enabled) {
                        updateSettings({
                          backgroundGradient: {
                            ...settings.backgroundGradient,
                            from: color,
                          },
                        });
                      }
                    }}
                    title={color}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="border-t border-zinc-800" />

          {/* ═══ 色相条 ═══ */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                主色调
              </Label>
              <div
                className="w-6 h-6 rounded-md border border-zinc-600"
                style={{ backgroundColor: settings.backgroundColor }}
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500">色相</span>
              <HueBar
                hue={hsl[0]}
                saturation={hsl[1]}
                lightness={hsl[2]}
                onChange={(h) => applyPrimaryColor(h, hsl[1], hsl[2])}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-zinc-500">饱和度</span>
                <span className="text-[10px] text-zinc-500">{hsl[1]}%</span>
              </div>
              <Slider
                value={[hsl[1]]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => {
                  const val = Array.isArray(v) ? v[0] : v;
                  applyPrimaryColor(hsl[0], val, hsl[2]);
                }}
                onPointerUp={finalizeColor}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-zinc-500">明度</span>
                <span className="text-[10px] text-zinc-500">{hsl[2]}%</span>
              </div>
              <Slider
                value={[hsl[2]]}
                min={0}
                max={50}
                step={1}
                onValueChange={(v) => {
                  const val = Array.isArray(v) ? v[0] : v;
                  applyPrimaryColor(hsl[0], hsl[1], val);
                }}
                onPointerUp={finalizeColor}
              />
            </div>
          </section>

          <div className="border-t border-zinc-800" />

          {/* ═══ 渐变设置 ═══ */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                渐变设置
              </Label>
              <Switch
                checked={settings.backgroundGradient.enabled}
                onCheckedChange={(checked) =>
                  updateSettings({
                    backgroundGradient: {
                      ...settings.backgroundGradient,
                      enabled: !!checked,
                      from: settings.backgroundColor,
                    },
                  })
                }
              />
            </div>

            {settings.backgroundGradient.enabled && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Second color hue bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">第二颜色 · 色相</span>
                    <div
                      className="w-5 h-5 rounded border border-zinc-600"
                      style={{
                        backgroundColor: settings.backgroundGradient.to,
                      }}
                    />
                  </div>
                  <HueBar
                    hue={hsl2[0]}
                    saturation={hsl2[1]}
                    lightness={hsl2[2]}
                    onChange={(h) => applySecondaryColor(h, hsl2[1], hsl2[2])}
                  />
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-zinc-500">饱和度</span>
                      <span className="text-[10px] text-zinc-500">{hsl2[1]}%</span>
                    </div>
                    <Slider
                      value={[hsl2[1]]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(v) => {
                        const val = Array.isArray(v) ? v[0] : v;
                        applySecondaryColor(hsl2[0], val, hsl2[2]);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-zinc-500">明度</span>
                      <span className="text-[10px] text-zinc-500">{hsl2[2]}%</span>
                    </div>
                    <Slider
                      value={[hsl2[2]]}
                      min={0}
                      max={50}
                      step={1}
                      onValueChange={(v) => {
                        const val = Array.isArray(v) ? v[0] : v;
                        applySecondaryColor(hsl2[0], hsl2[1], val);
                      }}
                    />
                  </div>
                </div>

                {/* Direction selector */}
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500">渐变方向</span>
                    <DirectionWheel
                      direction={settings.backgroundGradient.direction}
                      onChange={(dir) =>
                        updateSettings({
                          backgroundGradient: {
                            ...settings.backgroundGradient,
                            direction: dir,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] text-zinc-500">渐变预览</span>
                    <div
                      className="h-10 rounded-lg border border-zinc-700"
                      style={{
                        background: getGradientCSS(
                          settings.backgroundGradient.direction,
                          settings.backgroundGradient.from,
                          settings.backgroundGradient.to
                        ),
                      }}
                    />
                    <span className="text-[10px] text-zinc-600">
                      {gradientDirectionMap[settings.backgroundGradient.direction]?.label || "下"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className="border-t border-zinc-800" />

          {/* ═══ 壁纸设置 ═══ */}
          <WallpaperSection />

          <div className="border-t border-zinc-800" />

          {/* ═══ 卡片透明度 ═══ */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                卡片透明度
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {settings.cardOpacity}%
              </span>
            </div>
            <Slider
              value={[settings.cardOpacity]}
              min={0}
              max={100}
              onValueChange={(value) => {
                const v = Array.isArray(value) ? value[0] : value;
                updateSettings({ cardOpacity: v });
              }}
            />
          </section>

          <div className="border-t border-zinc-800" />

          {/* ═══ 实时预览条 ═══ */}
          <section className="space-y-2">
            <Label className="text-xs text-muted-foreground">当前背景效果</Label>
            <div
              className="h-8 rounded-lg border border-zinc-700 overflow-hidden"
              style={{
                background: settings.backgroundGradient.enabled
                  ? getGradientCSS(
                      settings.backgroundGradient.direction,
                      settings.backgroundGradient.from,
                      settings.backgroundGradient.to
                    )
                  : settings.backgroundColor,
              }}
            />
          </section>

          {/* ═══ 重置默认 ═══ */}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetDefaults}
            className="w-full text-muted-foreground hover:text-foreground border border-zinc-800 hover:border-zinc-700"
          >
            <RotateCcw className="size-3 mr-2" />
            重置默认
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
