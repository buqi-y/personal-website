# 个人网站产品设计文档

> 版本: v1.0  
> 最后更新: 2026-05-12  
> 状态: 初始设计阶段

---

## 1. 产品概述

### 1.1 产品定位

本项目是一个**个人品牌展示 + 内容创作平台**，通过精心设计的视觉体验和结构化的内容组织，向外界传递个人的专业能力、思考深度和生活态度。它不仅是一个静态简历页面，更是一个持续更新的内容生态系统。

### 1.2 目标用户

| 用户画像 | 核心诉求 | 关注内容 |
|---------|---------|---------|
| 招聘方/HR | 快速评估候选人技术能力与项目经验 | 作品集、技术栈、项目成果 |
| 同行开发者 | 技术交流、学习参考、寻求合作机会 | 笔记、技术文章、开源项目 |
| 设计爱好者 | 欣赏视觉设计、交互创意 | 整站视觉体验、动效设计 |
| 潜在合作伙伴 | 了解个人能力与合作可能性 | 作品集、个人简介、联系方式 |
| 内容消费者 | 获取有价值的知识和灵感 | 笔记、收藏推荐、生活分享 |

### 1.3 产品目标

- **展示能力**：通过作品集系统性呈现技术广度与项目深度
- **记录成长**：通过笔记和生活模块记录学习轨迹与个人成长
- **分享知识**：输出高质量技术文章，建立行业影响力
- **建立品牌**：打造独特的个人 IP，形成差异化竞争优势

### 1.4 核心价值主张

> "用设计师的审美构建开发者的世界"

- 极致的视觉体验（Bento Grid + 毛玻璃 + 微动效）
- 结构化的内容体系（作品集 / 笔记 / 生活 / 收藏四维展示）
- 流畅的交互感受（Framer Motion 驱动的细腻动效）
- 优秀的技术实现（Next.js 14 SSG + 性能极致优化）

---

## 2. 信息架构

### 2.1 站点地图

```
/                           # 首页 (Bento Grid 仪表盘)
├── /portfolio              # 作品集列表
│   └── /portfolio/[slug]   # 作品详情页
├── /notes                  # 笔记列表
│   ├── /notes/[slug]       # 笔记详情页
│   ├── /notes/category/[category]  # 分类筛选
│   └── /notes/tag/[tag]    # 标签筛选
├── /life                   # 生活动态
│   └── /life/[id]          # 动态详情（可选）
├── /bookmarks              # 收藏夹
│   └── /bookmarks/[category]  # 分类收藏
├── /about                  # 关于我（可从首页跳转）
└── /rss.xml                # RSS 订阅源
```

### 2.2 导航结构

**主导航（Desktop）**

```
[Logo/Name]    Home    Portfolio    Notes    Life    Bookmarks    [Theme Toggle]
```

**移动端导航**

- 顶部: Logo + 汉堡菜单图标
- 展开后: 全屏覆盖层，居中展示导航链接，附带动效
- 备选方案: 底部 Tab Bar（Home / Portfolio / Notes / Life / Bookmarks）

### 2.3 URL 路由规划（Next.js App Router）

```
app/
├── page.tsx                        # /
├── portfolio/
│   ├── page.tsx                    # /portfolio
│   └── [slug]/
│       └── page.tsx                # /portfolio/[slug]
├── notes/
│   ├── page.tsx                    # /notes
│   ├── [slug]/
│   │   └── page.tsx                # /notes/[slug]
│   ├── category/
│   │   └── [category]/
│   │       └── page.tsx            # /notes/category/[category]
│   └── tag/
│       └── [tag]/
│           └── page.tsx            # /notes/tag/[tag]
├── life/
│   └── page.tsx                    # /life
├── bookmarks/
│   ├── page.tsx                    # /bookmarks
│   └── [category]/
│       └── page.tsx                # /bookmarks/[category]
├── about/
│   └── page.tsx                    # /about
├── layout.tsx                      # 根布局
├── not-found.tsx                   # 404 页面
└── sitemap.ts                      # 动态 Sitemap
```

---

## 3. 各页面功能需求

### 3.1 首页（Home）

#### 布局说明

采用 **Bento Grid** 网格卡片布局，灵感来源于 Apple 产品页和 Linear 官网。在桌面端呈现 4×N 网格（列数自适应），不同内容卡片占据不同格数，形成错落有致的视觉节奏。

#### 网格定义

```
Desktop (>1024px): 4 列网格
Tablet (768-1024px): 2 列网格
Mobile (<768px): 1 列网格

间距: gap-4 (16px)
```

#### 卡片规划

| 卡片名称 | 网格占位 | 内容 | 数据来源 |
|---------|---------|------|---------|
| 个人介绍卡 | 2×2 | 头像、姓名、一句话简介、社交链接 | 静态配置 |
| 精选作品卡 | 2×1 | 最新/精选项目封面 + 标题 | Portfolio 数据 |
| 最新笔记卡 | 1×2 | 最近 3 篇笔记标题 + 日期 | Notes 数据 |
| 技术栈卡 | 1×1 | 技术图标矩阵（动态旋转展示） | 静态配置 |
| 生活快照卡 | 1×1 | 最新一张生活照片 | Life 数据 |
| 音乐/状态卡 | 1×1 | 当前在听的音乐或状态信息 | API/静态 |
| 收藏推荐卡 | 2×1 | 最近收藏的 2-3 个精选链接 | Bookmarks 数据 |
| GitHub 活跃度卡 | 2×1 | GitHub Contribution Graph | GitHub API |
| 联系方式卡 | 1×1 | 邮箱、社交媒体图标 | 静态配置 |

#### 交互规范

- 卡片 hover: `scale(1.02)` + 光泽扫过效果（CSS gradient animation）
- 卡片点击: 跳转到对应模块详情
- 页面加载: 卡片依次 stagger 动画进入（从下方 fadeInUp）
- 背景: 微妙的网格背景图案 + 渐变色块（blur 模糊处理）

---

### 3.2 作品集（Portfolio）

#### 项目列表页 `/portfolio`

**功能点：**

- 瀑布流/网格布局展示项目卡片
- 顶部筛选栏：按分类（Web App / Mobile / 开源 / 设计）切换
- 支持按时间排序（最新优先）
- 项目卡片包含：封面图、标题、简述、技术标签

**筛选交互：**

- 点击分类标签时，通过 Framer Motion `AnimatePresence` 实现卡片切换动效
- 使用 `layout` 属性实现流畅的重排动画

#### 项目详情页 `/portfolio/[slug]`

**功能点：**

- 全宽 Hero 封面图（带视差滚动效果）
- 项目基础信息（标题、时间、角色、技术栈）
- MDX 内容区（项目描述、功能截图、技术细节）
- 项目链接（在线预览、GitHub 仓库）
- 上一个/下一个项目导航
- 相关项目推荐

#### 数据字段定义

```typescript
interface Project {
  slug: string;              // URL 标识
  title: string;             // 项目标题
  description: string;       // 简短描述 (≤120字)
  content: MDXContent;       // MDX 正文内容
  coverImage: string;        // 封面图 URL
  screenshots: string[];     // 项目截图数组
  category: ProjectCategory; // 分类: 'web' | 'mobile' | 'opensource' | 'design'
  techStack: string[];       // 技术栈标签
  role: string;              // 担任角色
  liveUrl?: string;          // 在线预览链接
  githubUrl?: string;        // GitHub 仓库链接
  startDate: string;         // 开始时间 (YYYY-MM)
  endDate?: string;          // 结束时间
  featured: boolean;         // 是否精选（首页展示）
  order: number;             // 排序权重
}
```

---

### 3.3 笔记（Notes）

#### 文章列表页 `/notes`

**功能点：**

- 文章卡片列表（标题 + 摘要 + 日期 + 分类 + 标签）
- 顶部分类 Tab 切换（全部 / 技术 / 设计 / 思考 / ...）
- 标签云或标签列表（侧边栏或顶部）
- 搜索框（支持标题和内容全文搜索）
- 分页或无限滚动加载
- 阅读时间估算显示

**搜索功能方案：**

- 客户端搜索: 使用 `flexsearch` 构建本地索引
- 搜索 UI: 按 `Cmd/Ctrl + K` 唤起搜索面板（类似 Spotlight）
- 支持搜索: 标题、摘要、标签、分类

#### 文章详情页 `/notes/[slug]`

**功能点：**

- 文章标题 + 元信息（日期、分类、标签、阅读时间）
- MDX 正文渲染
- 目录导航（Table of Contents，桌面端右侧悬浮）
- 代码块高亮（支持行号、行高亮、复制按钮）
- 数学公式渲染（KaTeX）
- 自定义 MDX 组件（Callout、Tabs、Image Gallery 等）
- 上一篇/下一篇导航
- 相关文章推荐
- 阅读进度条（顶部）

#### 分类与标签系统

```
分类 (Category): 互斥，一篇文章只属于一个分类
├── 技术 (tech)
├── 设计 (design)
├── 思考 (thoughts)
└── 教程 (tutorial)

标签 (Tag): 可多选，一篇文章可有多个标签
├── React, Next.js, TypeScript, CSS, Node.js ...
├── UI/UX, 动效, 排版 ...
└── 职业, 效率, 工具 ...
```

#### 数据字段定义

```typescript
interface Note {
  slug: string;              // URL 标识
  title: string;             // 文章标题
  description: string;       // 摘要 (≤200字)
  content: MDXContent;       // MDX 正文
  category: NoteCategory;    // 分类
  tags: string[];            // 标签数组
  coverImage?: string;       // 封面图（可选）
  publishedAt: string;       // 发布日期 (YYYY-MM-DD)
  updatedAt?: string;        // 更新日期
  readingTime: number;       // 阅读时间 (分钟)
  featured: boolean;         // 是否精选
  draft: boolean;            // 是否为草稿
  toc: TocItem[];            // 目录结构
}

interface TocItem {
  id: string;
  title: string;
  level: 2 | 3 | 4;
}
```

---

### 3.4 生活（Life）

#### 页面布局

**方案: 时间轴 + 照片墙混合布局**

- 按时间倒序展示生活动态
- 支持两种视图切换：时间轴视图 / 瀑布流照片墙视图
- 每条动态可包含：文字、图片（单图/多图）、地理位置标签

#### 功能点

- 时间轴视图: 左侧时间线 + 右侧内容卡片，年份分隔
- 照片墙视图: Masonry 瀑布流布局，点击查看大图 + 详情
- 图片灯箱: 点击图片打开全屏灯箱，支持左右滑动切换
- 地理位置: 可选展示城市/地点标签，带地图图标
- 加载策略: 无限滚动 + 图片懒加载

#### 数据字段定义

```typescript
interface LifeMoment {
  id: string;                // 唯一标识
  content: string;           // 文字内容 (Markdown 格式)
  images: LifeImage[];       // 图片数组
  location?: {               // 地理位置（可选）
    name: string;            // 地点名称
    city?: string;           // 城市
    country?: string;        // 国家
    coordinates?: {          // 经纬度（可选）
      lat: number;
      lng: number;
    };
  };
  mood?: string;             // 心情标签（可选）
  createdAt: string;         // 发布时间 (ISO 8601)
  tags?: string[];           // 话题标签
}

interface LifeImage {
  url: string;               // 图片 URL
  alt: string;               // 替代文本
  width: number;             // 图片宽度
  height: number;            // 图片高度
  blurDataURL?: string;      // 模糊占位图 (base64)
}
```

---

### 3.5 收藏（Bookmarks）

#### 页面布局

- 左侧/顶部: 分类导航（图标 + 分类名 + 数量）
- 右侧/主区域: 收藏卡片网格

#### 功能点

- 分类管理: 预定义分类（工具 / 文章 / 设计资源 / 开源项目 / 灵感 / 其他）
- 卡片信息: 网站标题、描述、Favicon、截图缩略图
- 外链跳转: 点击卡片在新标签页打开链接
- 视觉标识: 自动抓取网站 Favicon 作为图标展示
- 排序: 支持按添加时间 / 分类排序

#### 分类体系

```
收藏分类:
├── 🛠️ 开发工具 (tools)
├── 📖 技术文章 (articles)
├── 🎨 设计资源 (design)
├── 📦 开源项目 (opensource)
├── ✨ 灵感参考 (inspiration)
└── 📌 其他 (others)
```

#### 数据字段定义

```typescript
interface Bookmark {
  id: string;                // 唯一标识
  title: string;             // 网站标题
  description: string;       // 网站描述 (≤150字)
  url: string;               // 链接地址
  category: BookmarkCategory; // 分类
  favicon?: string;          // Favicon URL
  screenshot?: string;       // 网站截图
  tags?: string[];           // 标签
  createdAt: string;         // 收藏时间
  pinned: boolean;           // 是否置顶
}
```

---

## 4. 交互设计规范

### 4.1 全局交互模式

#### 页面切换过渡

```typescript
// 页面切换动画配置 (Framer Motion)
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: {
    duration: 0.3,
    ease: [0.25, 0.1, 0.25, 1.0] // cubic-bezier
  }
};
```

#### 滚动行为

- 平滑滚动: `scroll-behavior: smooth`
- 导航锚点跳转: 带 offset（避免被 sticky header 遮挡）
- 返回顶部: 滚动超过 1 屏后显示返回顶部按钮
- 滚动方向检测: 下滑隐藏导航栏，上滑显示

#### 加载状态

- 页面级: 顶部进度条（NProgress 风格）
- 组件级: 骨架屏（Skeleton）占位
- 图片: blur placeholder → 清晰图片过渡
- 按钮: loading spinner + 禁用状态

### 4.2 导航交互

| 交互场景 | 实现方式 |
|---------|---------|
| Sticky Navbar | `position: sticky; top: 0` + backdrop-blur 毛玻璃效果 |
| 当前页高亮 | 底部指示条动画（`layoutId` 共享布局动画） |
| 移动端菜单 | 全屏覆盖层，链接 stagger 动画进入 |
| Logo 交互 | hover 时微旋转 + 发光效果 |
| 主题切换 | 太阳/月亮图标旋转切换动画 |

### 4.3 卡片交互

```css
/* 卡片基础样式 */
.card {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

/* Hover 效果 */
.card:hover {
  transform: scale(1.02);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}
```

**光泽扫过效果：**

```css
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.05) 45%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 55%,
    transparent 60%
  );
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}
.card:hover::before {
  transform: translateX(100%);
}
```

**骨架屏加载：**

- 卡片形状保持一致
- 使用 `animate-pulse` 脉冲动画
- 灰色渐变色块占位

### 4.4 动效规范

| 动效类型 | 持续时间 | 缓动函数 | 应用场景 |
|---------|---------|---------|---------|
| 快速反馈 | 150ms | `ease-out` | 按钮点击、开关切换 |
| 标准过渡 | 300ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` | 卡片 hover、面板展开 |
| 页面切换 | 400ms | `cubic-bezier(0.4, 0, 0.2, 1)` | 路由切换、模态框 |
| 强调动画 | 600ms | `spring(1, 80, 10)` | 首次加载、重要元素进入 |
| Stagger | 50ms/item | - | 列表项依次进入 |

```typescript
// Framer Motion 通用变体
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};
```

### 4.5 微交互

- **按钮点击**: scale(0.95) → scale(1) 弹性回弹
- **链接悬浮**: 下划线从左向右展开动画
- **返回顶部**: 淡入显示 + 点击后平滑滚动
- **复制反馈**: 图标切换（复制 → 勾选）+ tooltip 提示 "已复制"
- **图片加载**: blur → clear 渐进式加载
- **错误状态**: shake 抖动动画 + 红色边框闪烁

---

## 5. 响应式适配策略

### 5.1 断点定义

```css
/* Tailwind CSS 默认断点 */
sm: 640px    /* 大屏手机 */
md: 768px    /* 平板竖屏 */
lg: 1024px   /* 平板横屏/小屏笔记本 */
xl: 1280px   /* 桌面显示器 */
2xl: 1536px  /* 大屏显示器 */
```

**核心断点分组：**

| 分组 | 范围 | 典型设备 |
|-----|------|---------|
| Mobile | < 768px | iPhone, Android 手机 |
| Tablet | 768px - 1024px | iPad, Android 平板 |
| Desktop | > 1024px | 笔记本、台式机 |

### 5.2 各断点布局差异

#### 首页 Bento Grid

```
Desktop (>1024px):  4 列网格, 卡片按原始占位展示
Tablet (768-1024px): 2 列网格, 大卡片缩为 2×1
Mobile (<768px):     1 列, 所有卡片全宽堆叠, 部分卡片隐藏/简化
```

#### 作品集

```
Desktop: 3 列网格
Tablet:  2 列网格
Mobile:  1 列列表, 卡片简化为水平布局 (左图右文)
```

#### 笔记列表

```
Desktop: 主内容区 + 右侧边栏 (目录/标签)
Tablet:  全宽列表, 侧边栏收起为顶部折叠区
Mobile:  全宽卡片列表, 搜索栏固定顶部
```

### 5.3 移动端特殊处理

- **底部导航栏**: 固定底部 Tab Bar（5 个 Tab），替代顶部 Hamburger 菜单
- **手势操作**: 支持左右滑动切换文章（上一篇/下一篇）
- **触摸优化**: 按钮最小点击区域 44×44px
- **键盘避让**: 搜索输入框聚焦时内容区域上推
- **安全区域**: 适配 iPhone 底部 Home Indicator (`env(safe-area-inset-bottom)`)

### 5.4 图片响应式方案

```tsx
import Image from 'next/image';

// Next.js Image 响应式配置
<Image
  src="/images/project-cover.jpg"
  alt="项目封面"
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  fill
  style={{ objectFit: 'cover' }}
  placeholder="blur"
  blurDataURL={blurDataURL}
/>
```

- 使用 `next/image` 自动生成 srcset
- WebP/AVIF 格式自动转换
- 基于视口宽度的 `sizes` 属性优化加载
- blur placeholder 减少布局偏移

---

## 6. 内容管理方案

### 6.1 MDX 内容组织方式

```
content/
├── notes/                          # 笔记文章
│   ├── 2024/
│   │   ├── nextjs-app-router.mdx
│   │   ├── framer-motion-guide.mdx
│   │   └── ...
│   └── 2025/
│       └── ...
├── projects/                       # 作品集
│   ├── project-alpha.mdx
│   ├── project-beta.mdx
│   └── ...
├── life/                           # 生活动态 (JSON/YAML)
│   └── moments.json
└── bookmarks/                      # 收藏数据 (JSON/YAML)
    └── bookmarks.json
```

### 6.2 Frontmatter 字段规范

#### 笔记 Frontmatter

```yaml
---
title: "Next.js App Router 深度指南"
description: "全面解析 Next.js 14 App Router 的核心概念与最佳实践"
category: "tech"
tags: ["Next.js", "React", "SSR"]
publishedAt: "2025-03-15"
updatedAt: "2025-04-01"
coverImage: "/images/notes/nextjs-guide-cover.jpg"
featured: true
draft: false
---
```

#### 作品集 Frontmatter

```yaml
---
title: "智能仪表盘系统"
description: "基于 React + D3.js 的实时数据可视化平台"
category: "web"
techStack: ["React", "TypeScript", "D3.js", "WebSocket"]
role: "前端负责人"
liveUrl: "https://dashboard.example.com"
githubUrl: "https://github.com/username/dashboard"
coverImage: "/images/projects/dashboard-cover.jpg"
screenshots:
  - "/images/projects/dashboard-1.jpg"
  - "/images/projects/dashboard-2.jpg"
startDate: "2024-06"
endDate: "2024-12"
featured: true
order: 1
---
```

### 6.3 图片/资源管理

```
public/
├── images/
│   ├── notes/          # 笔记配图
│   ├── projects/       # 项目截图
│   ├── life/           # 生活照片
│   └── og/             # Open Graph 预览图
├── fonts/              # 自托管字体文件
└── icons/              # 自定义图标
```

**图片规范：**

| 用途 | 推荐尺寸 | 格式 | 最大体积 |
|-----|---------|------|---------|
| 项目封面 | 1920×1080 | WebP | 200KB |
| 笔记封面 | 1200×630 | WebP | 150KB |
| 生活照片 | 原始比例 | WebP | 500KB |
| OG Image | 1200×630 | PNG | 100KB |
| Favicon | 32×32, 180×180 | PNG/SVG | 10KB |

### 6.4 内容发布流程

```
1. 本地创建 MDX 文件 (content/notes/xxx.mdx)
2. 编写 Frontmatter + 正文内容
3. 本地预览确认 (next dev)
4. Git commit & push
5. Vercel 自动构建部署 (SSG)
6. CDN 分发，页面上线
```

### 6.5 未来 CMS 扩展路径

```
Phase 1 (当前): 纯 MDX 文件 + Git 管理
    ↓
Phase 2: 接入 Headless CMS (推荐 Notion API / Contentlayer)
    ↓
Phase 3: 自建后台管理面板 (CRUD + 在线编辑器)
```

**推荐 CMS 选项：**

| 方案 | 优点 | 缺点 |
|-----|------|------|
| Contentlayer | 类型安全、与 Next.js 深度集成 | 仅支持本地文件 |
| Notion API | 可视化编辑、移动端友好 | API 速率限制、渲染定制性弱 |
| Sanity | 灵活 schema、实时预览 | 学习曲线、需付费 |
| Keystatic | 开源、Git-based、可视化编辑 | 社区较小 |

---

## 7. SEO 策略

### 7.1 Meta 标签策略

```tsx
// app/layout.tsx - 全局默认 Meta
export const metadata: Metadata = {
  metadataBase: new URL('https://yourname.dev'),
  title: {
    default: 'Your Name - 前端开发者 & 设计爱好者',
    template: '%s | Your Name'
  },
  description: '个人网站 - 作品集、技术笔记、生活记录',
  keywords: ['前端开发', '个人网站', '技术博客', 'React', 'Next.js'],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Name',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
```

### 7.2 Open Graph / Twitter Card

```tsx
// 每个页面动态生成 OG 信息
export const metadata = {
  openGraph: {
    title: '文章标题',
    description: '文章摘要',
    url: 'https://yourname.dev/notes/slug',
    siteName: 'Your Name',
    images: [{
      url: '/og/notes-slug.png',
      width: 1200,
      height: 630,
      alt: '文章标题',
    }],
    locale: 'zh_CN',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: '文章标题',
    description: '文章摘要',
    images: ['/og/notes-slug.png'],
    creator: '@yourhandle',
  },
};
```

**OG Image 自动生成方案：**

使用 `next/og`（Satori）动态生成 OG 图片，确保每篇文章都有独特的社交预览图。

### 7.3 结构化数据（JSON-LD）

```tsx
// 文章页 JSON-LD
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: note.title,
  description: note.description,
  image: note.coverImage,
  datePublished: note.publishedAt,
  dateModified: note.updatedAt,
  author: {
    '@type': 'Person',
    name: 'Your Name',
    url: 'https://yourname.dev',
  },
};

// 首页 Person JSON-LD
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Your Name',
  url: 'https://yourname.dev',
  jobTitle: '前端开发工程师',
  sameAs: [
    'https://github.com/username',
    'https://twitter.com/username',
  ],
};
```

### 7.4 Sitemap 生成

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const notes = getAllNotes(); // 获取所有笔记
  const projects = getAllProjects(); // 获取所有项目

  return [
    { url: 'https://yourname.dev', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://yourname.dev/portfolio', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://yourname.dev/notes', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ...notes.map(note => ({
      url: `https://yourname.dev/notes/${note.slug}`,
      lastModified: new Date(note.updatedAt || note.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...projects.map(project => ({
      url: `https://yourname.dev/portfolio/${project.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
```

### 7.5 RSS Feed

```typescript
// app/rss.xml/route.ts
import RSS from 'rss';

export async function GET() {
  const feed = new RSS({
    title: 'Your Name - 技术笔记',
    description: '前端开发、设计思考与技术分享',
    site_url: 'https://yourname.dev',
    feed_url: 'https://yourname.dev/rss.xml',
    language: 'zh-CN',
  });

  const notes = getAllNotes();
  notes.forEach(note => {
    feed.item({
      title: note.title,
      description: note.description,
      url: `https://yourname.dev/notes/${note.slug}`,
      date: note.publishedAt,
      categories: [note.category, ...note.tags],
    });
  });

  return new Response(feed.xml(), {
    headers: { 'Content-Type': 'application/xml' },
  });
}
```

### 7.6 图片 ALT 文本规范

- 所有图片必须包含描述性 `alt` 属性
- 装饰性图片使用 `alt=""`
- 项目截图格式: `"[项目名] - [功能描述] 截图"`
- 生活照片格式: `"[场景描述] - [地点]"`
- 技术图表格式: `"[图表类型]: [内容概述]"`

---

## 8. 性能优化方案

### 8.1 Next.js SSG/ISR 策略

| 页面 | 渲染策略 | 说明 |
|-----|---------|------|
| 首页 | SSG + ISR (1h) | 聚合数据定期更新 |
| 作品集列表 | SSG | 项目更新频率低 |
| 作品详情 | SSG | 构建时生成所有项目页 |
| 笔记列表 | SSG + ISR (30min) | 新文章发布后半小时内更新 |
| 笔记详情 | SSG | 构建时生成所有笔记页 |
| 生活动态 | SSG + ISR (1h) | 动态更新频率中等 |
| 收藏夹 | SSG + ISR (6h) | 收藏更新频率低 |

```typescript
// 页面级 ISR 配置
export const revalidate = 3600; // 1 小时重新验证
```

### 8.2 图片优化

- **next/image**: 自动优化、格式转换（WebP/AVIF）、响应式 srcset
- **blur placeholder**: 所有图片提供 blurDataURL，减少 CLS
- **懒加载**: 首屏以外图片使用 `loading="lazy"`
- **CDN 分发**: Vercel Edge Network 全球加速
- **尺寸限制**: 源文件不超过 500KB，自动压缩

### 8.3 字体优化

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const notoSansSC = localFont({
  src: '../public/fonts/NotoSansSC-VF.woff2',
  display: 'swap',
  variable: '--font-noto',
  preload: true,
});
```

- 使用 `next/font` 自动优化字体加载
- `font-display: swap` 避免 FOIT
- 中文字体子集化（仅包含常用字符，减少体积至 ~500KB）
- 变体字体（Variable Font）减少请求数

### 8.4 代码分割与懒加载

```typescript
// 路由级代码分割 (Next.js 自动处理)
// 组件级懒加载
import dynamic from 'next/dynamic';

const CodeBlock = dynamic(() => import('@/components/mdx/CodeBlock'), {
  loading: () => <CodeBlockSkeleton />,
});

const ImageGallery = dynamic(() => import('@/components/ImageGallery'), {
  ssr: false, // 仅客户端渲染
});

const SearchDialog = dynamic(() => import('@/components/SearchDialog'), {
  ssr: false,
});
```

### 8.5 缓存策略

| 资源类型 | Cache-Control | 说明 |
|---------|--------------|------|
| 静态资源 (JS/CSS) | `public, max-age=31536000, immutable` | 永久缓存（哈希文件名） |
| 图片 | `public, max-age=86400, stale-while-revalidate=604800` | 1天缓存，7天 SWR |
| HTML 页面 | `public, max-age=0, must-revalidate` | 始终验证 |
| 字体文件 | `public, max-age=31536000, immutable` | 永久缓存 |
| API 响应 | `public, s-maxage=3600, stale-while-revalidate=86400` | CDN 缓存 1h |

### 8.6 Core Web Vitals 目标值

| 指标 | 目标值 | 优化手段 |
|-----|-------|---------|
| LCP (Largest Contentful Paint) | < 1.5s | SSG + 图片优化 + 字体预加载 |
| FID (First Input Delay) | < 50ms | 代码分割 + 最小化主线程阻塞 |
| CLS (Cumulative Layout Shift) | < 0.05 | 图片占位 + 字体 swap + 固定尺寸 |
| INP (Interaction to Next Paint) | < 150ms | 优化事件处理 + 减少重排 |
| TTFB (Time to First Byte) | < 200ms | CDN + SSG + Edge Runtime |
| FCP (First Contentful Paint) | < 1.0s | 关键 CSS 内联 + 资源预加载 |

---

## 9. 技术架构

### 9.1 项目目录结构

```
personal-website/
├── app/                            # Next.js App Router
│   ├── (main)/                     # 主布局分组
│   │   ├── layout.tsx
│   │   ├── page.tsx                # 首页
│   │   ├── portfolio/
│   │   ├── notes/
│   │   ├── life/
│   │   └── bookmarks/
│   ├── api/                        # API Routes
│   │   └── og/                     # OG Image 生成
│   ├── layout.tsx                  # 根布局
│   ├── globals.css                 # 全局样式
│   ├── sitemap.ts
│   └── robots.ts
├── components/                     # 组件库
│   ├── ui/                         # shadcn/ui 基础组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/                     # 布局组件
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileNav.tsx
│   │   └── ThemeToggle.tsx
│   ├── home/                       # 首页专用组件
│   │   ├── BentoGrid.tsx
│   │   ├── ProfileCard.tsx
│   │   ├── ProjectCard.tsx
│   │   └── ...
│   ├── portfolio/                  # 作品集组件
│   ├── notes/                      # 笔记组件
│   ├── life/                       # 生活组件
│   ├── bookmarks/                  # 收藏组件
│   ├── mdx/                        # MDX 自定义组件
│   │   ├── CodeBlock.tsx
│   │   ├── Callout.tsx
│   │   ├── Tabs.tsx
│   │   └── ImageZoom.tsx
│   └── shared/                     # 通用组件
│       ├── AnimatedCard.tsx
│       ├── SearchDialog.tsx
│       ├── ScrollToTop.tsx
│       └── Skeleton.tsx
├── content/                        # 内容文件
│   ├── notes/
│   ├── projects/
│   ├── life/
│   └── bookmarks/
├── lib/                            # 工具库
│   ├── mdx.ts                      # MDX 处理
│   ├── content.ts                  # 内容读取
│   ├── utils.ts                    # 通用工具
│   └── constants.ts                # 常量配置
├── hooks/                          # 自定义 Hooks
│   ├── useScrollDirection.ts
│   ├── useMediaQuery.ts
│   └── useTheme.ts
├── styles/                         # 样式文件
│   └── mdx.css                     # MDX 内容样式
├── public/                         # 静态资源
│   ├── images/
│   ├── fonts/
│   └── icons/
├── config/                         # 配置文件
│   ├── site.ts                     # 站点配置
│   └── navigation.ts              # 导航配置
├── types/                          # TypeScript 类型
│   └── index.ts
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```

### 9.2 组件设计原则（原子设计方法论）

```
Atoms (原子)         → shadcn/ui 基础组件 (Button, Badge, Input...)
Molecules (分子)     → 组合组件 (SearchBar, TagList, CardMeta...)
Organisms (有机体)   → 业务组件 (ProjectCard, NoteCard, BentoGrid...)
Templates (模板)     → 页面布局 (MainLayout, ArticleLayout...)
Pages (页面)         → 路由页面 (app/*/page.tsx)
```

**组件开发规范：**

- 所有组件使用 TypeScript + 严格类型
- Props 接口命名: `ComponentNameProps`
- 使用 `forwardRef` 支持 ref 透传
- 默认导出 + 命名导出 types
- 组件文件与样式同目录

### 9.3 状态管理方案

本项目以**内容展示**为主，状态管理需求较轻量：

| 状态类型 | 方案 | 说明 |
|---------|------|------|
| 主题状态 | `next-themes` | 亮/暗模式切换与持久化 |
| UI 状态 | React `useState` | 菜单开关、筛选选中等 |
| URL 状态 | Next.js `searchParams` | 筛选条件、分页参数 |
| 服务端数据 | SSG/ISR | 构建时生成，无需客户端缓存 |
| 搜索索引 | 内存缓存 | flexsearch 索引一次性加载 |

### 9.4 数据流设计

```
Content Layer (MDX/JSON 文件)
    ↓ 构建时读取
Data Fetching (lib/content.ts)
    ↓ 解析 & 转换
Page Components (SSG 页面)
    ↓ props 传递
UI Components (展示层)
    ↓ 交互事件
Client State (useState/useReducer)
```

### 9.5 第三方集成

| 服务 | 用途 | 方案 |
|-----|------|------|
| 评论系统 | 文章评论 | Giscus（基于 GitHub Discussions） |
| 统计分析 | 访问统计 | Umami / Plausible（隐私友好） |
| 搜索 | 全文搜索 | flexsearch（客户端） |
| 部署 | 构建 & 托管 | Vercel |
| 域名 | 自定义域名 | Vercel DNS / Cloudflare |
| 图床 | 图片存储 | Vercel Blob / Cloudflare R2 |
| 监控 | 性能监控 | Vercel Analytics + Speed Insights |

---

## 10. 未来扩展规划

### 10.1 Phase 2 功能

**预计时间: v1.0 上线后 1-2 个月**

| 功能 | 描述 | 技术方案 |
|-----|------|---------|
| 评论系统 | 笔记/作品页支持评论 | Giscus (GitHub Discussions) |
| Newsletter 订阅 | 邮件通知新文章 | Resend + React Email |
| 搜索增强 | 支持模糊搜索、搜索建议 | Algolia DocSearch / 自建 |
| 阅读统计 | 文章浏览量显示 | Vercel KV / Upstash Redis |
| 代码演示 | 文章内嵌交互式代码 | Sandpack / CodeSandbox Embed |
| 暗色模式优化 | 更精细的色彩适配 | CSS Custom Properties |

### 10.2 Phase 3 功能

**预计时间: v1.0 上线后 3-6 个月**

| 功能 | 描述 | 技术方案 |
|-----|------|---------|
| 多语言支持 | 中/英双语切换 | next-intl / i18n 路由 |
| 后台管理面板 | 可视化内容管理 | 自建 Admin (Next.js + Auth) |
| API 开放 | 提供公开 API 接口 | Next.js Route Handlers |
| 友链系统 | 友情链接交换 | 独立页面 + JSON 数据 |
| 周报/月报 | 自动生成内容摘要 | Cron Job + AI 辅助 |
| 访客留言板 | 独立留言页面 | 数据库 (Planetscale/Supabase) |

### 10.3 长期愿景

```
┌─────────────────────────────────────────────────────────┐
│                    个人数字花园                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📂 作品集    📝 笔记    🌅 生活    🔖 收藏            │
│       ↓          ↓         ↓         ↓                 │
│  ┌─────────────────────────────────────────────┐       │
│  │     统一内容管理平台 (自建 CMS)              │       │
│  └─────────────────────────────────────────────┘       │
│       ↓                                                 │
│  ┌─────────────────────────────────────────────┐       │
│  │  开放 API → 第三方集成 → 数据可视化          │       │
│  └─────────────────────────────────────────────┘       │
│       ↓                                                 │
│  ┌─────────────────────────────────────────────┐       │
│  │  个人知识库 → AI 辅助创作 → 自动化工作流     │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**长期目标：**

1. **从网站到平台**: 不仅是展示窗口，更是个人内容创作与管理的核心平台
2. **从手动到自动化**: 通过 CI/CD + Webhook + Cron 实现内容自动化发布
3. **从单向到互动**: 评论、Newsletter、API 开放，建立读者社区
4. **从静态到智能**: 引入 AI 辅助（内容推荐、自动摘要、智能标签）
5. **从个人到品牌**: 形成独特的个人技术品牌，产生持续影响力

---

## 附录

### A. 设计参考

| 参考网站 | 参考方向 |
|---------|---------|
| [leerob.io](https://leerob.io) | 内容结构、Next.js 最佳实践 |
| [paco.me](https://paco.me) | 极简设计、动效细节 |
| [rauno.me](https://rauno.me) | 交互设计、动效灵感 |
| [linear.app](https://linear.app) | Bento Grid 布局、视觉风格 |
| [apple.com](https://apple.com) | 网格设计、产品展示 |
| [ui.shadcn.com](https://ui.shadcn.com) | 组件设计规范 |

### B. 技术栈版本锁定

| 技术 | 版本 | 说明 |
|-----|------|------|
| Next.js | 14.x | App Router |
| React | 18.x | 稳定版本 |
| TypeScript | 5.x | 严格模式 |
| Tailwind CSS | 3.4+ | JIT 模式 |
| Framer Motion | 11.x | 动效库 |
| shadcn/ui | latest | 按需安装 |
| MDX | 3.x | 内容渲染 |
| Lucide Icons | latest | 图标库 |

### C. 设计 Token

```css
:root {
  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* 间距 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* 动效 */
  --ease-default: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;

  /* 毛玻璃 */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-blur: 10px;
}
```

---

> 本文档将随项目开发持续迭代更新。
