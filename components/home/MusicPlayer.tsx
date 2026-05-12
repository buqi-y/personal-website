"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Volume2,
  VolumeX,
  Loader2,
  Settings,
  ListMusic,
  AlertCircle,
  Repeat,
  Repeat1,
  Shuffle,
  Camera,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { musicApi } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MusicTrack {
  name: string;
  artist: string;
  url: string;
  cover: string;
  lrc: string;
}

interface Lyric {
  time: number;
  text: string;
}

type PlayMode = 'loop' | 'single' | 'random';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const METING_API = "https://api.i-meto.com/meting/api";
const DEFAULT_PLAYLIST_ID = "60198";
const LS_KEY_PLAYLIST = "music_playlist_id";
const LS_KEY_PLAYMODE = "music_play_mode";
const LS_KEY_COVER = "custom-music-cover";

const compressCover = (file: File, maxWidth: number = 300): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function fetchPlaylist(playlistId: string): Promise<MusicTrack[]> {
  const res = await fetch(
    `${METING_API}?server=netease&type=playlist&id=${playlistId}&r=${Math.random()}`
  );
  if (!res.ok) throw new Error(`API 请求失败 (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0)
    throw new Error("歌单为空或不存在");
  return data;
}

function parseLrc(lrcText: string): Lyric[] {
  if (!lrcText || lrcText.length > 30000) return [];
  const lines = lrcText.split(/\r?\n/);
  const result: Lyric[] = [];

  for (const line of lines) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (matches.length === 0) continue;

    const text = line.replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
    const cleanText = text.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "");

    if (cleanText) {
      for (const match of matches) {
        const min = parseInt(match[1]);
        const sec = parseInt(match[2]);
        const ms = match[3] ? parseInt(match[3]) : 0;
        const divisor = match[3] && match[3].length === 3 ? 1000 : 100;
        const time = min * 60 + sec + ms / divisor;
        result.push({ time, text: cleanText });
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MusicPlayer() {
  /* ---- Playlist state ---- */
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  /* ---- Playback state ---- */
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [playMode, setPlayMode] = useState<PlayMode>('loop');

  /* ---- Lyrics state ---- */
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [displayedText, setDisplayedText] = useState("");
  const [lyricLoading, setLyricLoading] = useState(false);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- UI state ---- */
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playlistInput, setPlaylistInput] = useState("");

  /* ---- Custom cover state ---- */
  const [customCover, setCustomCover] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* -------------------------------------------------------------- */
  /*  Load playlist ID from localStorage & fetch tracks              */
  /* -------------------------------------------------------------- */

  const loadPlaylist = useCallback(async (id: string) => {
    setFetchLoading(true);
    setFetchError(null);
    setTracks([]);
    setCurrentTrack(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    try {
      const data = await fetchPlaylist(id);
      setTracks(data);
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "获取歌单失败，请稍后重试"
      );
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. 先从 localStorage 快速加载
    const stored = localStorage.getItem(LS_KEY_PLAYLIST);
    const id = stored || DEFAULT_PLAYLIST_ID;
    setPlaylistInput(id);
    loadPlaylist(id);

    // Load play mode from localStorage
    const storedMode = localStorage.getItem(LS_KEY_PLAYMODE) as PlayMode | null;
    if (storedMode && ['loop', 'single', 'random'].includes(storedMode)) {
      setPlayMode(storedMode);
    }

    // Load custom cover from localStorage
    const storedCover = localStorage.getItem(LS_KEY_COVER);
    if (storedCover) setCustomCover(storedCover);

    // 2. 后台从 API 拉取最新配置
    musicApi.get().then((config) => {
      if (config) {
        if (config.playlistId && config.playlistId !== id) {
          setPlaylistInput(config.playlistId);
          localStorage.setItem(LS_KEY_PLAYLIST, config.playlistId);
          loadPlaylist(config.playlistId);
        }
        if (config.playMode && ['loop', 'single', 'random'].includes(config.playMode)) {
          setPlayMode(config.playMode);
          localStorage.setItem(LS_KEY_PLAYMODE, config.playMode);
        }
        if (typeof config.volume === 'number') {
          setVolume(config.volume);
          if (audioRef.current) audioRef.current.volume = config.volume;
        }
      }
    }).catch((err) => {
      console.warn("Failed to fetch music config from API, using cache:", err);
    });
  }, [loadPlaylist]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressCover(file);
    localStorage.setItem(LS_KEY_COVER, compressed);
    setCustomCover(compressed);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const removeCustomCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem(LS_KEY_COVER);
    setCustomCover(null);
  };

  /* -------------------------------------------------------------- */
  /*  Audio element initialisation                                    */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    audioRef.current.preload = "metadata";

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------- */
  /*  Audio event listeners                                           */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsBuffering(false);
      setAudioError(null);
    };
    const onEnded = () => {
      if (tracks.length === 0) return;
      if (playMode === 'single') {
        audio.currentTime = 0;
        audio.play();
      } else if (playMode === 'random') {
        const randomIndex = Math.floor(Math.random() * tracks.length);
        playTrack(randomIndex);
      } else {
        playTrack((currentTrack + 1) % tracks.length);
      }
    };
    const onCanPlay = () => {
      setIsBuffering(false);
      setAudioError(null);
    };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onError = () => {
      setIsBuffering(false);
      setIsPlaying(false);
      setAudioError("音频加载失败，请检查网络或尝试下一首");
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("error", onError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, tracks, playMode]);

  /* -------------------------------------------------------------- */
  /*  Lyrics loading                                                   */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    const track = tracks[currentTrack];
    if (!track) {
      setLyrics([]);
      setCurrentLyricIndex(-1);
      setDisplayedText("");
      return;
    }

    let cancelled = false;

    const loadLyrics = async () => {
      setLyricLoading(true);
      setLyrics([]);
      setCurrentLyricIndex(-1);
      setDisplayedText("");

      try {
        let lrcText = track.lrc || "";

        if (lrcText.startsWith("http")) {
          const res = await fetch(lrcText);
          if (res.ok) {
            lrcText = await res.text();
          } else {
            lrcText = "";
          }
        }

        if (!cancelled) {
          const parsed = parseLrc(lrcText);
          setLyrics(parsed);
        }
      } catch {
        // Silently handle lyrics loading failure
        if (!cancelled) setLyrics([]);
      } finally {
        if (!cancelled) setLyricLoading(false);
      }
    };

    loadLyrics();
    return () => { cancelled = true; };
  }, [currentTrack, tracks]);

  /* -------------------------------------------------------------- */
  /*  Lyrics sync (timeupdate driven via currentTime)                  */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    if (lyrics.length === 0) return;

    let idx = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (lyrics[i].time <= currentTime) {
        idx = i;
        break;
      }
    }

    if (idx !== currentLyricIndex) {
      setCurrentLyricIndex(idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, lyrics]);

  /* -------------------------------------------------------------- */
  /*  Typewriter animation                                             */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    // Clear previous typewriter interval
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }

    if (currentLyricIndex < 0 || !lyrics[currentLyricIndex]) {
      setDisplayedText("");
      return;
    }

    const fullText = lyrics[currentLyricIndex].text;
    let charIndex = 0;
    setDisplayedText("");

    typewriterRef.current = setInterval(() => {
      charIndex++;
      if (charIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex));
      } else {
        if (typewriterRef.current) {
          clearInterval(typewriterRef.current);
          typewriterRef.current = null;
        }
      }
    }, 50);

    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
      }
    };
  }, [currentLyricIndex, lyrics]);

  /* -------------------------------------------------------------- */
  /*  Playback controls                                               */
  /* -------------------------------------------------------------- */

  const playTrack = useCallback(
    (index: number) => {
      const audio = audioRef.current;
      if (!audio || tracks.length === 0) return;
      const idx = ((index % tracks.length) + tracks.length) % tracks.length;
      setCurrentTrack(idx);
      setCurrentTime(0);
      setDuration(0);
      setAudioError(null);
      setIsBuffering(true);
      audio.src = tracks[idx].url;
      audio.load();
      audio.play().catch(() => {
        setIsPlaying(false);
        setIsBuffering(false);
      });
      setIsPlaying(true);
    },
    [tracks]
  );

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (!audio.src || audio.src === "" || audio.src === location.href) {
        audio.src = tracks[currentTrack].url;
        audio.load();
        setIsBuffering(true);
      }
      audio.play().catch(() => {
        setIsPlaying(false);
        setIsBuffering(false);
      });
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrack, tracks]);

  const handleNext = useCallback(() => {
    if (tracks.length === 0) return;
    playTrack((currentTrack + 1) % tracks.length);
  }, [currentTrack, playTrack, tracks.length]);

  const handlePrev = useCallback(() => {
    if (tracks.length === 0) return;
    playTrack((currentTrack - 1 + tracks.length) % tracks.length);
  }, [currentTrack, playTrack, tracks.length]);

  const handleSeek = useCallback((value: number | readonly number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const seekTime = Array.isArray(value) ? value[0] : value;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  }, []);

  const handleVolumeChange = useCallback(
    (value: number | readonly number[]) => {
      const audio = audioRef.current;
      if (!audio) return;
      const vol = Array.isArray(value) ? value[0] : value;
      setVolume(vol);
      audio.volume = vol;
      if (vol > 0) setIsMuted(false);
    },
    []
  );

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  /* -------------------------------------------------------------- */
  /*  Settings – save playlist ID                                     */
  /* -------------------------------------------------------------- */

  const handleSaveSettings = () => {
    const id = playlistInput.trim();
    if (!id) return;
    localStorage.setItem(LS_KEY_PLAYLIST, id);
    setSettingsOpen(false);
    loadPlaylist(id);
    // 同步到 API
    musicApi.update({ playlistId: id, playMode, volume }).catch((err) => {
      console.warn("Failed to save music config to API:", err);
    });
  };

  const togglePlayMode = useCallback(() => {
    setPlayMode((prev) => {
      const next: PlayMode = prev === 'loop' ? 'single' : prev === 'single' ? 'random' : 'loop';
      localStorage.setItem(LS_KEY_PLAYMODE, next);
      // 同步到 API
      musicApi.update({
        playlistId: localStorage.getItem(LS_KEY_PLAYLIST) || DEFAULT_PLAYLIST_ID,
        playMode: next,
        volume,
      }).catch((err) => {
        console.warn("Failed to save play mode to API:", err);
      });
      return next;
    });
  }, [volume]);

  const playModeIcon = playMode === 'single' ? Repeat1 : playMode === 'random' ? Shuffle : Repeat;
  const playModeTitle = playMode === 'loop' ? '列表循环' : playMode === 'single' ? '单曲循环' : '随机播放';

  /* -------------------------------------------------------------- */
  /*  Derived values                                                  */
  /* -------------------------------------------------------------- */

  const track: MusicTrack | null = tracks[currentTrack] ?? null;

  /* -------------------------------------------------------------- */
  /*  Render                                                          */
  /* -------------------------------------------------------------- */

  return (
    <>
      <motion.div
        className="rounded-3xl glass p-6 card-shine relative"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        {/* Settings Button – Top Right */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          onClick={() => setSettingsOpen(true)}
          aria-label="播放器设置"
        >
          <Settings className="size-4" />
        </Button>

        {/* ---- Loading state ---- */}
        {fetchLoading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">正在加载歌单...</p>
          </div>
        )}

        {/* ---- Fetch error state ---- */}
        {!fetchLoading && fetchError && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <AlertCircle className="size-6 text-red-400" />
            <p className="text-xs text-red-400 text-center">{fetchError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const id =
                  localStorage.getItem(LS_KEY_PLAYLIST) || DEFAULT_PLAYLIST_ID;
                loadPlaylist(id);
              }}
            >
              重试
            </Button>
          </div>
        )}

        {/* ---- Player content ---- */}
        {!fetchLoading && !fetchError && track && (
          <>
            {/* Track Info */}
            <div className="flex items-center gap-3 mb-4 pr-8">
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => coverInputRef.current?.click()}
              >
                <motion.div
                  className="w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-border"
                  animate={{ rotate: isPlaying ? 360 : 0 }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear",
                    ...(isPlaying ? {} : { duration: 0 }),
                  }}
                >
                  {customCover ? (
                    <img
                      src={customCover}
                      alt="自定义封面"
                      className="w-full h-full object-cover"
                    />
                  ) : track.cover ? (
                    <img
                      src={track.cover}
                      alt={track.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="size-5 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {customCover ? (
                    <button
                      onClick={removeCustomCover}
                      className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <X className="size-4 text-white" />
                    </button>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors">
                      <Camera className="size-4 text-white" />
                    </div>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{track.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {track.artist}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={togglePlayMode}
                className="text-muted-foreground hover:text-foreground"
                title={playModeTitle}
              >
                {React.createElement(playModeIcon, { className: "size-4" })}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handlePrev}
                className="text-muted-foreground hover:text-foreground"
              >
                <SkipBack className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                className="text-foreground relative"
              >
                {isBuffering ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="size-5" />
                ) : (
                  <Play className="size-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleNext}
                className="text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowPlaylist((v) => !v)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="歌单列表"
              >
                <ListMusic className="size-4" />
              </Button>
            </div>

            {/* Error Message */}
            {audioError && (
              <div className="text-center mb-2">
                <p className="text-xs text-red-400">{audioError}</p>
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-2">
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 1}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Lyrics Display */}
            <div className="mb-3 min-h-[20px] text-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentLyricIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-muted-foreground/70 truncate"
                >
                  {lyricLoading
                    ? "歌词加载中..."
                    : lyrics.length === 0
                      ? "暂无歌词"
                      : displayedText || "♪"}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleMute}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="flex-1"
              />
            </div>

            {/* Playlist Panel */}
            <AnimatePresence>
              {showPlaylist && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/10 pt-2 mt-1 max-h-[180px] overflow-y-auto scrollbar-thin">
                    {tracks.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => playTrack(i)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs truncate transition-colors ${
                          i === currentTrack
                            ? "bg-white/10 text-foreground font-medium"
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        }`}
                      >
                        <span className="text-muted-foreground/50 mr-2 inline-block w-5 text-right">
                          {i + 1}
                        </span>
                        {t.name}
                        <span className="text-muted-foreground/40 ml-1">
                          - {t.artist}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Track count footer */}
            <div className="text-center mt-2 flex items-center justify-center gap-1.5">
              <Music className="size-3 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground/50">
                {currentTrack + 1} / {tracks.length} 首
              </span>
            </div>
          </>
        )}
      </motion.div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="glass border-white/10 bg-[hsl(0_0%_8%/0.95)] backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="size-5 text-primary" />
              <span>播放器设置</span>
            </DialogTitle>
            <DialogDescription>
              输入网易云音乐歌单 ID，即可播放歌单中的音乐
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 flex flex-col gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                歌单 ID
              </label>
              <input
                type="text"
                placeholder="例如：60198（网易云热歌榜）"
                value={playlistInput}
                onChange={(e) => setPlaylistInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveSettings()}
                className="w-full h-9 px-3 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground/60 mt-1.5">
                打开网易云音乐歌单页面，从 URL 中获取歌单 ID
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleSaveSettings}
            >
              保存并加载歌单
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
