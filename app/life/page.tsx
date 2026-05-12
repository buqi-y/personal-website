"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TagManager } from "@/components/shared/TagManager";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { lifeApi } from "@/lib/api";
import lifeData from "@/content/life.json";

// --- Types ---
interface LifeImage {
  type: "local" | "url";
  data: string;
}

interface LifeVideo {
  type: "local" | "url" | "embed";
  data: string;
  poster?: string;
}

interface LifePost {
  id: string;
  content: string;
  images: (string | LifeImage)[];
  videos?: LifeVideo[];
  date: string;
  location: string;
  category: string;
}

// --- Helpers ---
function parseVideoUrl(url: string): LifeVideo | null {
  // B站
  const biliMatch = url.match(/bilibili\.com\/video\/(BV[\w]+)/);
  if (biliMatch) {
    return {
      type: "embed",
      data: `https://player.bilibili.com/player.html?bvid=${biliMatch[1]}&autoplay=0`,
    };
  }

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) {
    return {
      type: "embed",
      data: `https://www.youtube.com/embed/${ytMatch[1]}`,
    };
  }

  // 直接视频URL
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    return { type: "url", data: url };
  }

  // 其他URL当作直接视频尝试
  if (/^https?:\/\/.+/i.test(url)) {
    return { type: "url", data: url };
  }

  return null;
}

function isColorValue(val: unknown): boolean {
  return typeof val === "string" && /^#[0-9a-fA-F]{6}$/.test(val);
}

function getImageSrc(img: string | LifeImage): string | null {
  if (isColorValue(img)) return null;
  let src: string;
  if (typeof img === "string") {
    src = img;
  } else {
    src = img.data;
  }
  // 过滤空值
  if (!src || src.trim() === "") return null;
  // 对 COS 签名 URL 去除过期的签名参数，转换为公开 URL
  if (src.includes(".cos.") && src.includes("q-sign-algorithm")) {
    try {
      const urlObj = new URL(src);
      urlObj.search = "";
      src = urlObj.toString();
    } catch {
      // URL 解析失败则保持原值
    }
  }
  return src;
}

function compressImage(
  file: File,
  maxWidth = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxWidth / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = e.target!.result as string;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

function estimateStorageSize(posts: LifePost[]): number {
  return new Blob([JSON.stringify(posts)]).size;
}

const DEFAULT_TAGS = ["全部", "旅行", "电影", "美食", "日常"];

const emptyPost: LifePost = {
  id: "",
  content: "",
  images: [],
  videos: [],
  date: "",
  location: "",
  category: "",
};

// --- Component ---
export default function LifePage() {
  const [posts, setPosts] = useLocalStorage<LifePost[]>(
    "life-items",
    lifeData as LifePost[]
  );
  const [tags, setTags] = useState<string[]>(DEFAULT_TAGS);
  const [activeTag, setActiveTag] = useState("全部");

  // 后台从 API 拉取最新数据
  useEffect(() => {
    lifeApi.list().then((apiPosts) => {
      if (apiPosts && Array.isArray(apiPosts) && apiPosts.length > 0) {
        const mapped: LifePost[] = apiPosts.map((p) => ({
          id: p.id,
          content: p.content,
          date: p.date,
          images: p.images || [],
          videos: [],
          location: "",
          category: "",
        }));
        setPosts(mapped);
      }
    }).catch((err) => {
      console.warn("Failed to fetch life posts from API, using cache:", err);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<LifePost>(emptyPost);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Image form states
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video form states
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [videoUrlError, setVideoUrlError] = useState("");

  // Image preview lightbox
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const filteredPosts = useMemo(() => {
    if (activeTag === "全部") return posts;
    return posts.filter((post) => post.category === activeTag);
  }, [posts, activeTag]);

  const handleTagAdd = (tag: string) => {
    setTags((prev) => [...prev, tag]);
  };

  const handleTagDelete = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
    if (activeTag === tag) setActiveTag("全部");
  };

  // CRUD handlers
  const handleCreate = () => {
    setEditingPost({
      ...emptyPost,
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
    });
    setImageTab("upload");
    setUrlInput("");
    setUrlError("");
    setUploadError("");
    setVideoUrlInput("");
    setVideoUrlError("");
    setEditDialogOpen(true);
  };

  const handleEdit = (post: LifePost) => {
    setEditingPost({ ...post, videos: post.videos || [] });
    setImageTab("upload");
    setUrlInput("");
    setUrlError("");
    setUploadError("");
    setVideoUrlInput("");
    setVideoUrlError("");
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingPost.content.trim()) return;
    setPosts((prev) => {
      const exists = prev.find((p) => p.id === editingPost.id);
      let newPosts: LifePost[];
      if (exists) {
        newPosts = prev.map((p) => (p.id === editingPost.id ? editingPost : p));
      } else {
        newPosts = [editingPost, ...prev];
      }
      // 同步到 API
      lifeApi.update(newPosts.map((p) => ({
        id: p.id,
        content: p.content,
        date: p.date,
        images: p.images.map((img) => typeof img === "string" ? img : (img as LifeImage).data),
        videos: (p.videos || []).map((v) => v.data),
      }))).catch((err) => {
        console.warn("Failed to save life posts to API:", err);
      });
      return newPosts;
    });
    setEditDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      setPosts((prev) => {
        const newPosts = prev.filter((p) => p.id !== deletingId);
        // 同步到 API
        lifeApi.update(newPosts.map((p) => ({
          id: p.id,
          content: p.content,
          date: p.date,
          images: p.images.map((img) => typeof img === "string" ? img : (img as LifeImage).data),
          videos: (p.videos || []).map((v) => v.data),
        }))).catch((err) => {
          console.warn("Failed to sync life posts deletion to API:", err);
        });
        return newPosts;
      });
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  // Image management
  const realImageCount = editingPost.images.filter((i) => !isColorValue(i)).length;

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      setUploadError("");
      const remaining = 9 - realImageCount;
      if (remaining <= 0) {
        setUploadError("最多添加 9 张图片");
        return;
      }

      const toProcess = Array.from(files).slice(0, remaining);
      const newImages: LifeImage[] = [];

      for (const file of toProcess) {
        if (file.size > 2 * 1024 * 1024) {
          setUploadError(`"${file.name}" 超过 2MB，已跳过`);
          continue;
        }
        try {
          // 尝试通过 API 上传
          const url = await lifeApi.uploadImage(file).catch(() => null);
          if (url) {
            newImages.push({ type: "url", data: url });
          } else {
            // Fallback 到 base64
            const data = await compressImage(file);
            newImages.push({ type: "local", data });
          }
        } catch {
          setUploadError(`"${file.name}" 处理失败`);
        }
      }

      if (newImages.length > 0) {
        const updatedPost = {
          ...editingPost,
          images: [...editingPost.images, ...newImages],
        };
        // Check total storage
        const tempPosts = posts.map((p) =>
          p.id === updatedPost.id ? updatedPost : p
        );
        if (!posts.find((p) => p.id === updatedPost.id)) {
          tempPosts.push(updatedPost);
        }
        const size = estimateStorageSize(tempPosts);
        if (size > 3 * 1024 * 1024) {
          setUploadError("存储空间不足，建议使用链接方式");
          return;
        }
        setEditingPost(updatedPost);
      }
    },
    [editingPost, posts, realImageCount]
  );

  const handleUrlAdd = () => {
    setUrlError("");
    const url = urlInput.trim();
    if (!url) return;
    if (realImageCount >= 9) {
      setUrlError("最多添加 9 张图片");
      return;
    }
    // Validate URL format
    if (!/^https?:\/\/.+/i.test(url)) {
      setUrlError("请输入有效的图片链接（以 http:// 或 https:// 开头）");
      return;
    }
    // Try loading to validate
    const img = new window.Image();
    img.onload = () => {
      setEditingPost((prev) => ({
        ...prev,
        images: [...prev.images, { type: "url", data: url }],
      }));
      setUrlInput("");
      setUrlError("");
    };
    img.onerror = () => {
      setUrlError("图片链接无效，无法加载");
    };
    img.src = url;
  };

  const handleRemoveImage = (index: number) => {
    setEditingPost((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Video management
  const handleVideoUrlAdd = () => {
    setVideoUrlError("");
    const url = videoUrlInput.trim();
    if (!url) return;
    const currentVideos = editingPost.videos || [];
    if (currentVideos.length >= 3) {
      setVideoUrlError("最多添加 3 个视频");
      return;
    }
    const parsed = parseVideoUrl(url);
    if (!parsed) {
      setVideoUrlError("无法识别的视频链接");
      return;
    }
    setEditingPost((prev) => ({
      ...prev,
      videos: [...(prev.videos || []), parsed],
    }));
    setVideoUrlInput("");
    setVideoUrlError("");
  };

  const handleRemoveVideo = (index: number) => {
    setEditingPost((prev) => ({
      ...prev,
      videos: (prev.videos || []).filter((_, i) => i !== index),
    }));
  };

  // Preview lightbox
  const openPreview = (images: string[], startIndex: number) => {
    setPreviewImages(images);
    setPreviewIndex(startIndex);
    setPreviewOpen(true);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">生活</h1>
          <p className="mt-2 text-muted-foreground">记录日常的美好瞬间</p>
        </div>
        <Button onClick={handleCreate} className="gap-1.5">
          <Plus className="size-4" />
          发布动态
        </Button>
      </motion.div>

      {/* Tag Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-10"
      >
        <TagManager
          tags={tags}
          activeTag={activeTag}
          onTagSelect={setActiveTag}
          onTagAdd={handleTagAdd}
          onTagDelete={handleTagDelete}
          undeletableTags={DEFAULT_TAGS}
        />
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-px border-l-2 border-muted md:left-[9px]" />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTag}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {filteredPosts.map((post, index) => {
              // Get real images (skip color placeholders)
              const realImages = post.images
                .map((i) => getImageSrc(i))
                .filter((s): s is string => s !== null);

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="relative pl-8 md:pl-10 group"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-3 size-[14px] rounded-full border-2 border-primary bg-background md:size-[18px] md:left-0" />

                  {/* Action buttons */}
                  <div className="absolute right-3 top-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleEdit(post)}
                      className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/80 hover:bg-primary/20 text-foreground transition-colors"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(post.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/80 hover:bg-destructive/20 text-foreground transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  {/* Card */}
                  <div className="glass rounded-xl p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                    {/* Real images */}
                    {realImages.length > 0 && (
                      <div className="mb-3">
                        {realImages.length === 1 ? (
                          <div
                            className="cursor-pointer overflow-hidden rounded-lg"
                            onClick={() => openPreview(realImages, 0)}
                          >
                            <img
                              src={realImages[0]}
                              alt="动态图片"
                              className="w-full max-h-48 object-cover rounded-lg hover:scale-[1.02] transition-transform duration-200"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = "none";
                                const placeholder = document.createElement("div");
                                placeholder.className = "w-full h-48 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs";
                                placeholder.textContent = "图片加载失败";
                                target.parentElement?.appendChild(placeholder);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {realImages.map((src, idx) => (
                              <div
                                key={idx}
                                className="cursor-pointer overflow-hidden rounded-lg aspect-square"
                                onClick={() => openPreview(realImages, idx)}
                              >
                                <img
                                  src={src}
                                  alt={`动态图片 ${idx + 1}`}
                                  className="w-full h-full object-cover hover:scale-[1.05] transition-transform duration-200"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = "none";
                                    const placeholder = document.createElement("div");
                                    placeholder.className = "w-full h-full rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs";
                                    placeholder.textContent = "图片加载失败";
                                    target.parentElement?.appendChild(placeholder);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Videos */}
                    {post.videos && post.videos.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {post.videos.map((video, idx) =>
                          video.type === "embed" ? (
                            <div
                              key={idx}
                              className="relative w-full aspect-video rounded-lg overflow-hidden"
                            >
                              <iframe
                                src={video.data}
                                className="absolute inset-0 w-full h-full"
                                allowFullScreen
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              />
                            </div>
                          ) : (
                            <video
                              key={idx}
                              src={video.data}
                              controls
                              className="w-full rounded-lg max-h-64 object-cover"
                              poster={video.poster}
                            />
                          )
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {post.content}
                    </p>

                    {/* Meta */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3" />
                        {post.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {post.location}
                      </span>
                      <Badge variant="secondary">{post.category}</Badge>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center text-muted-foreground"
          >
            暂无相关动态
          </motion.div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {posts.find((p) => p.id === editingPost.id)
                ? "编辑动态"
                : "发布动态"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">内容</Label>
              <Textarea
                value={editingPost.content}
                onChange={(e) =>
                  setEditingPost((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                placeholder="记录此刻的想法..."
                className="bg-muted/50 min-h-24"
              />
            </div>

            {/* Image management */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">图片</Label>

              {/* Tabs */}
              <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
                <button
                  type="button"
                  onClick={() => setImageTab("upload")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    imageTab === "upload"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Upload className="size-3.5" />
                  本地上传
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab("url")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    imageTab === "url"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LinkIcon className="size-3.5" />
                  链接导入
                </button>
              </div>

              {/* Upload tab */}
              {imageTab === "upload" && (
                <div>
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-6 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="size-8 text-muted-foreground/60" />
                    <span className="text-xs text-muted-foreground">
                      点击或拖拽图片到此处
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      支持多张，单张 &lt; 2MB，最多 9 张
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  {uploadError && (
                    <p className="mt-1.5 text-xs text-destructive">
                      {uploadError}
                    </p>
                  )}
                </div>
              )}

              {/* URL tab */}
              {imageTab === "url" && (
                <div>
                  <div className="flex gap-2">
                    <Input
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setUrlError("");
                      }}
                      placeholder="https://example.com/photo.jpg"
                      className="bg-muted/50 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleUrlAdd();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUrlAdd}
                    >
                      添加
                    </Button>
                  </div>
                  {urlError && (
                    <p className="mt-1.5 text-xs text-destructive">
                      {urlError}
                    </p>
                  )}
                </div>
              )}

              {/* Preview thumbnails */}
              <div className="pt-1">
                {editingPost.images.filter((i) => !isColorValue(i)).length >
                0 ? (
                  <div className="flex flex-wrap gap-2">
                    {editingPost.images.map((img, idx) => {
                      const src = getImageSrc(img);
                      if (!src) return null;
                      return (
                        <div key={idx} className="relative group/thumb">
                          <div className="h-[60px] w-[60px] rounded-md overflow-hidden border border-border">
                            <img
                              src={src}
                              alt={`图片 ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-4 w-4 rounded-full bg-destructive text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                          >
                            <X className="size-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/60 text-center py-2">
                    还没有添加图片
                  </p>
                )}
              </div>
            </div>

            {/* Video management */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Video className="size-3.5" />
                视频
                <span className="text-[10px] text-muted-foreground/60">
                  （最多 3 个，支持B站/YouTube/直接链接）
                </span>
              </Label>

              <div>
                <div className="flex gap-2">
                  <Input
                    value={videoUrlInput}
                    onChange={(e) => {
                      setVideoUrlInput(e.target.value);
                      setVideoUrlError("");
                    }}
                    placeholder="粘贴视频链接（B站/YouTube/mp4）"
                    className="bg-muted/50 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleVideoUrlAdd();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleVideoUrlAdd}
                  >
                    添加
                  </Button>
                </div>
                {videoUrlError && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {videoUrlError}
                  </p>
                )}
              </div>

              {/* Video list */}
              <div className="pt-1">
                {(editingPost.videos || []).length > 0 ? (
                  <div className="space-y-2">
                    {(editingPost.videos || []).map((video, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 group/vid"
                      >
                        <Video className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {video.type === "embed"
                            ? video.data.includes("bilibili")
                              ? `B站视频`
                              : video.data.includes("youtube")
                              ? `YouTube视频`
                              : "嵌入视频"
                            : video.data}
                        </span>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {video.type === "embed" ? "嵌入" : "链接"}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(idx)}
                          className="flex items-center justify-center h-5 w-5 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/60 text-center py-2">
                    还没有添加视频
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">地点</Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={editingPost.location}
                  onChange={(e) =>
                    setEditingPost((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="输入地点"
                  className="bg-muted/50 pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">分类</Label>
              <Input
                value={editingPost.category}
                onChange={(e) =>
                  setEditingPost((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                placeholder="旅行/电影/美食/日常"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">日期</Label>
              <Input
                type="date"
                value={editingPost.date}
                onChange={(e) =>
                  setEditingPost((prev) => ({ ...prev, date: e.target.value }))
                }
                className="bg-muted/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              确认删除
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定要删除吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Lightbox */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setPreviewOpen(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-4 right-4 z-50 flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Navigation arrows */}
            {previewImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewIndex((prev) =>
                      prev === 0 ? previewImages.length - 1 : prev - 1
                    );
                  }}
                  className="absolute left-4 z-50 flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewIndex((prev) =>
                      prev === previewImages.length - 1 ? 0 : prev + 1
                    );
                  }}
                  className="absolute right-4 z-50 flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.img
              key={previewIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              src={previewImages[previewIndex]}
              alt="预览大图"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
              }}
            />

            {/* Index indicator */}
            {previewImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                {previewImages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === previewIndex
                        ? "w-4 bg-white"
                        : "w-1.5 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
