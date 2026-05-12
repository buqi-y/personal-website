"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  User,
  Calendar,
  MapPin,
  GraduationCap,
  Briefcase,
  Code,
  Mail,
  Eye,
  EyeOff,
  Pencil,
  Globe,
  MessageCircle,
  Plus,
  Trash2,
  Camera,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ProfileField {
  id: string;
  icon: string;
  label: string;
  value: string;
  visible: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  Calendar,
  MapPin,
  GraduationCap,
  Briefcase,
  Code,
  Mail,
};

const defaultFields: ProfileField[] = [
  { id: "age", icon: "Calendar", label: "年龄", value: "25岁", visible: true },
  { id: "location", icon: "MapPin", label: "所在地", value: "上海", visible: true },
  { id: "education", icon: "GraduationCap", label: "学习背景", value: "XX大学 · 计算机科学", visible: true },
  { id: "work", icon: "Briefcase", label: "工作经历", value: "字节跳动 · 前端工程师", visible: true },
  { id: "skills", icon: "Code", label: "技能特长", value: "React, TypeScript, Node.js", visible: true },
  { id: "email", icon: "Mail", label: "联系方式", value: "hello@example.com", visible: true },
];

const LS_KEY_AVATAR = "custom-avatar";

const compressAvatar = (file: File, maxWidth: number = 200): Promise<string> => {
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

export function ProfileCard() {
  const [fields, setFields] = useState<ProfileField[]>(defaultFields);
  const [editFields, setEditFields] = useState<ProfileField[]>(defaultFields);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY_AVATAR);
    if (stored) setCustomAvatar(stored);
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressAvatar(file);
    localStorage.setItem(LS_KEY_AVATAR, compressed);
    setCustomAvatar(compressed);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const removeCustomAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem(LS_KEY_AVATAR);
    setCustomAvatar(null);
  };

  const openEdit = () => {
    setEditFields([...fields]);
    setDialogOpen(true);
  };

  const saveEdit = () => {
    setFields([...editFields]);
    setDialogOpen(false);
  };

  const addCustomField = () => {
    const newField: ProfileField = {
      id: `custom-${Date.now()}`,
      icon: "Code",
      label: "自定义字段",
      value: "",
      visible: true,
    };
    setEditFields([...editFields, newField]);
  };

  const removeEditField = (id: string) => {
    setEditFields(editFields.filter((f) => f.id !== id));
  };

  const updateEditField = (id: string, key: keyof ProfileField, value: string | boolean) => {
    setEditFields(editFields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  return (
    <motion.div
      className="rounded-3xl glass p-6 relative card-shine"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Edit Button */}
      <Button
        variant="ghost"
        size="icon-xs"
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        onClick={openEdit}
      >
        <Pencil className="size-3.5" />
      </Button>

      {/* Avatar */}
      <div className="flex flex-col items-center text-center">
        <div
          className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-3 relative group cursor-pointer"
          onClick={() => avatarInputRef.current?.click()}
        >
          {customAvatar ? (
            <img src={customAvatar} alt="头像" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User className="size-8 text-muted-foreground" />
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {customAvatar ? (
              <button
                onClick={removeCustomAvatar}
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
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <h2 className="text-xl font-bold">张三</h2>
        <p className="text-sm text-muted-foreground">全栈开发者 / 设计师</p>
        <p className="text-sm text-muted-foreground mt-2">热爱创造美好的数字体验</p>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 my-4" />

      {/* Info Fields */}
      <div className="space-y-3">
        {fields
          .filter((f) => f.visible)
          .map((field) => {
            const IconComp = iconMap[field.icon] || Code;
            return (
              <div
                key={field.id}
                className="flex items-center gap-3 text-sm group/field relative"
                onMouseEnter={() => setHoveredField(field.id)}
                onMouseLeave={() => setHoveredField(null)}
              >
                <IconComp className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground shrink-0">{field.label}</span>
                <span className="text-foreground/80 truncate">{field.value}</span>
                {hoveredField === field.id && (
                  <Eye className="size-3.5 text-muted-foreground absolute right-0" />
                )}
              </div>
            );
          })}
      </div>

      {/* Social Links */}
      <div className="border-t border-white/10 my-4" />
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
          <Globe className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
          <MessageCircle className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
          <Mail className="size-4" />
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑个人信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editFields.map((field) => (
              <div key={field.id} className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <Input
                    value={field.label}
                    onChange={(e) => updateEditField(field.id, "label", e.target.value)}
                    placeholder="字段名"
                    className="text-xs h-7"
                  />
                  <Input
                    value={field.value}
                    onChange={(e) => updateEditField(field.id, "value", e.target.value)}
                    placeholder="内容"
                    className="text-xs h-7"
                  />
                </div>
                <Switch
                  checked={field.visible}
                  onCheckedChange={(val) => updateEditField(field.id, "visible", val)}
                  size="sm"
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeEditField(field.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={addCustomField}>
              <Plus className="size-3 mr-1" />
              添加自定义字段
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button size="sm" onClick={saveEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
