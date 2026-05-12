"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, ArrowUpRight, Calendar, Plus, Pencil, Trash2, X } from "lucide-react";
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
import { portfolioApi } from "@/lib/api";
import portfolioData from "@/content/portfolio.json";

interface Project {
  id: string;
  title: string;
  description: string;
  cover: string;
  techStack: string[];
  category: string;
  link: string;
  date: string;
}

const DEFAULT_TAGS = ["全部", "Web", "App", "设计"];

function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative group"
    >
      {/* Action buttons */}
      <div className="absolute right-3 top-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
          className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/80 hover:bg-primary/20 text-foreground transition-colors"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/80 hover:bg-destructive/20 text-foreground transition-colors"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <a
        href={project.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl glass card-hover card-shine cursor-pointer"
      >
        {/* Cover Area */}
        <div
          className="relative h-40 rounded-t-2xl flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: project.cover }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
          <Layers className="relative size-10 text-white/80" />
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-3">
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
            {project.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>

          {/* Tech Stack Badges */}
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <Badge key={tech} variant="secondary">
                {tech}
              </Badge>
            ))}
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              {project.date}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
              查看详情
              <ArrowUpRight className="size-4" />
            </span>
          </div>
        </div>
      </a>
    </motion.div>
  );
}

const emptyProject: Project = {
  id: "",
  title: "",
  description: "",
  cover: "#6366f1",
  techStack: [],
  category: "",
  link: "",
  date: "",
};

export default function PortfolioPage() {
  const [projects, setProjects] = useLocalStorage<Project[]>(
    "portfolio-items",
    portfolioData as Project[]
  );
  const [tags, setTags] = useState<string[]>(DEFAULT_TAGS);
  const [activeTag, setActiveTag] = useState("全部");

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project>(emptyProject);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newTech, setNewTech] = useState("");

  // 从 API 拉取最新数据
  useEffect(() => {
    portfolioApi.get().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        const mapped: Project[] = data.map((item) => ({
          id: item.id,
          title: item.title || "",
          description: item.description || "",
          cover: item.image || "#6366f1",
          techStack: item.tags || [],
          category: "",
          link: item.url || "",
          date: item.date || "",
        }));
        setProjects(mapped);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProjects = useMemo(() => {
    if (activeTag === "全部") return projects;
    return projects.filter((p) => p.category === activeTag);
  }, [activeTag, projects]);

  const handleTagAdd = (tag: string) => {
    setTags((prev) => [...prev, tag]);
  };

  const handleTagDelete = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
    if (activeTag === tag) setActiveTag("全部");
  };

  // CRUD operations
  const handleCreate = () => {
    setEditingProject({ ...emptyProject, id: Date.now().toString() });
    setNewTech("");
    setEditDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject({ ...project });
    setNewTech("");
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingProject.title.trim()) return;
    setProjects((prev) => {
      const exists = prev.find((p) => p.id === editingProject.id);
      let newProjects: Project[];
      if (exists) {
        newProjects = prev.map((p) => (p.id === editingProject.id ? editingProject : p));
      } else {
        newProjects = [editingProject, ...prev];
      }
      // 同步到 API
      portfolioApi.update(newProjects.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        url: p.link,
        image: p.cover,
        tags: p.techStack,
        date: p.date,
      }))).catch((err) => console.warn('Sync failed:', err));
      return newProjects;
    });
    setEditDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      setProjects((prev) => {
        const newProjects = prev.filter((p) => p.id !== deletingId);
        // 同步到 API
        portfolioApi.update(newProjects.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          url: p.link,
          image: p.cover,
          tags: p.techStack,
          date: p.date,
        }))).catch((err) => console.warn('Sync failed:', err));
        return newProjects;
      });
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleAddTech = () => {
    if (newTech.trim() && !editingProject.techStack.includes(newTech.trim())) {
      setEditingProject((prev) => ({
        ...prev,
        techStack: [...prev.techStack, newTech.trim()],
      }));
      setNewTech("");
    }
  };

  const handleRemoveTech = (tech: string) => {
    setEditingProject((prev) => ({
      ...prev,
      techStack: prev.techStack.filter((t) => t !== tech),
    }));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">作品集</h1>
          <p className="mt-2 text-muted-foreground">我的项目和作品</p>
        </div>
        <Button onClick={handleCreate} className="gap-1.5">
          <Plus className="size-4" />
          新建项目
        </Button>
      </div>

      {/* Tag Filter */}
      <div className="mb-8">
        <TagManager
          tags={tags}
          activeTag={activeTag}
          onTagSelect={setActiveTag}
          onTagAdd={handleTagAdd}
          onTagDelete={handleTagDelete}
          undeletableTags={["全部"]}
        />
      </div>

      {/* Project Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => handleEdit(project)}
              onDelete={() => {
                setDeletingId(project.id);
                setDeleteDialogOpen(true);
              }}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="mt-16 text-center text-muted-foreground">
          <Layers className="mx-auto size-12 opacity-30 mb-4" />
          <p>该分类下暂无项目</p>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingProject.id && projects.find((p) => p.id === editingProject.id)
                ? "编辑项目"
                : "新建项目"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">项目标题</Label>
              <Input
                value={editingProject.title}
                onChange={(e) =>
                  setEditingProject((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="输入项目标题"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">项目描述</Label>
              <Textarea
                value={editingProject.description}
                onChange={(e) =>
                  setEditingProject((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="输入项目描述"
                className="bg-muted/50 min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">封面颜色</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={editingProject.cover}
                  onChange={(e) =>
                    setEditingProject((prev) => ({ ...prev, cover: e.target.value }))
                  }
                  className="h-9 w-14 rounded border border-border cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{editingProject.cover}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">技术栈</Label>
              <div className="flex gap-2">
                <Input
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  placeholder="添加技术标签"
                  className="bg-muted/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleAddTech(); }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddTech}>
                  添加
                </Button>
              </div>
              {editingProject.techStack.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {editingProject.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="gap-1 pr-1">
                      {tech}
                      <button
                        onClick={() => handleRemoveTech(tech)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">分类</Label>
              <Input
                value={editingProject.category}
                onChange={(e) =>
                  setEditingProject((prev) => ({ ...prev, category: e.target.value }))
                }
                placeholder="例如：Web、App、设计"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">项目链接</Label>
              <Input
                value={editingProject.link}
                onChange={(e) =>
                  setEditingProject((prev) => ({ ...prev, link: e.target.value }))
                }
                placeholder="https://..."
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">日期</Label>
              <Input
                type="month"
                value={editingProject.date}
                onChange={(e) =>
                  setEditingProject((prev) => ({ ...prev, date: e.target.value }))
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
            <DialogTitle className="text-lg font-semibold">确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定要删除吗？此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
