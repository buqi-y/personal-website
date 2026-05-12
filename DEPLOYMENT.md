# 腾讯云 COS + SCF + Vercel 部署指南

> 本文档详细描述个人网站的完整部署流程，涵盖后端云函数、对象存储及前端托管的全链路配置。

---

## 一、架构概览

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│             │  HTTPS   │                  │  HTTPS   │                  │  SDK     │                 │
│  用户浏览器  │────────▶│  Vercel (前端)    │────────▶│  腾讯云 SCF (API) │────────▶│  腾讯云 COS     │
│             │◀────────│  静态页面托管      │◀────────│  Serverless 后端  │◀────────│  对象存储        │
│             │  HTML/JS │                  │  JSON    │                  │  数据    │                 │
└─────────────┘         └──────────────────┘         └──────────────────┘         └─────────────────┘
```

### 各组件角色

| 组件 | 角色 | 说明 |
|------|------|------|
| **Vercel** | 前端静态托管 | 托管 Next.js 导出的静态页面，提供全球 CDN 加速 |
| **腾讯云 SCF** | API 后端 | 无服务器云函数，处理数据读写请求，鉴权访问 COS |
| **腾讯云 COS** | 数据存储 | 对象存储服务，持久化存储笔记、书签、音乐等 JSON 数据 |

---

## 二、准备工作

### 2.1 注册腾讯云账户

1. 访问 [腾讯云官网](https://cloud.tencent.com/) 注册账户
2. 完成实名认证（个人/企业均可）
3. 进入 [API 密钥管理](https://console.cloud.tencent.com/cam/capi) 页面

### 2.2 获取密钥信息

在「访问管理 → API 密钥管理」页面获取以下信息：

- **SecretId**：用于标识 API 调用者身份
- **SecretKey**：用于加密签名字符串和验证签名
- **APPID**：在「账号信息」页面获取（纯数字）

> ⚠️ SecretKey 仅在创建时显示一次，请妥善保存。建议使用子账号密钥，遵循最小权限原则。

### 2.3 安装工具

```powershell
# 安装 coscmd（COS 命令行工具）
pip install coscmd

# 确认 Node.js 已安装（建议 v18+）
node --version
npm --version

# 安装 pnpm（如未安装）
npm install -g pnpm
```

---

## 三、创建 COS 存储桶

### 3.1 需要创建的存储桶

进入 [COS 控制台](https://console.cloud.tencent.com/cos/bucket)，依次创建以下 7 个存储桶：

| 存储桶名称 | 访问权限 | 用途 |
|-----------|---------|------|
| `personal-site-notes-{APPID}` | 私有读写 | 笔记数据存储 |
| `personal-site-life-{APPID}` | 私有读写 | 生活记录存储 |
| `personal-site-bookmarks-{APPID}` | 私有读写 | 书签数据存储 |
| `personal-site-portfolio-{APPID}` | 私有读写 | 作品集数据存储 |
| `personal-site-music-{APPID}` | 私有读写 | 音乐列表存储 |
| `personal-site-media-{APPID}` | **公有读私有写** | 媒体文件（图片/音频）|
| `personal-site-settings-{APPID}` | 私有读写 | 网站配置存储 |

### 3.2 创建步骤

1. 点击「创建存储桶」按钮
2. **所属地域**：统一选择 `ap-guangzhou`（广州）
3. **名称**：填入对应桶名（系统会自动追加 `-{APPID}` 后缀）
4. **访问权限**：按上表设置
5. 点击「确定」完成创建

> ⚠️ **重要**：COS 存储桶与 SCF 云函数必须部署在同一地域（ap-guangzhou），否则会产生跨地域流量费用且延迟增加。

### 3.3 开启静态网站功能（可选）

如需使用 COS 静态网站托管（而非 Vercel）：

1. 进入 `personal-site-static-{APPID}` 桶的管理页面
2. 左侧菜单选择「基础配置 → 静态网站」
3. 开启静态网站功能
4. 索引文档填入：`index.html`
5. 错误文档填入：`404.html`
6. 保存配置

> ⚠️ **2024年1月1日后创建的存储桶**，默认域名（`*.cos.ap-guangzhou.myqcloud.com`）访问文件时会直接下载而非在浏览器中预览/渲染。如需浏览器预览，必须配置自定义域名。**推荐使用 Vercel 托管前端**，避免此限制。

---

## 四、部署 SCF 云函数

### 4.1 安装依赖

```powershell
cd e:\work\Qoder_code\personal-website\scf-api
npm install
```

### 4.2 配置环境变量

在 `scf-api/` 目录下创建 `.env` 文件：

```env
COS_SECRET_ID={SECRET_ID}
COS_SECRET_KEY={SECRET_KEY}
COS_REGION=ap-guangzhou
COS_APPID={APPID}
API_KEY={API_KEY}
```

> ⚠️ `.env` 文件包含敏感信息，**绝对不要提交到 Git 仓库**。

### 4.3 部署方式一：使用部署脚本

```powershell
cd e:\work\Qoder_code\personal-website\scf-api
.\deploy-scf.ps1
```

### 4.3 部署方式二：通过 Serverless Framework

```powershell
# 安装 Serverless Framework
npm install -g serverless

# 部署
cd e:\work\Qoder_code\personal-website\scf-api
serverless deploy
```

### 4.4 记录 API 网关地址

部署成功后，控制台会输出 API 网关访问地址，格式如：

```
https://service-xxxxxxxx-xxxxxxxxxx.gz.apigw.tencentcs.com/release/
```

请记录此地址，后续配置前端时需要使用。

---

## 五、配置前端环境变量

### 5.1 创建环境变量文件

```powershell
cd e:\work\Qoder_code\personal-website
Copy-Item .env.example .env.local
```

### 5.2 编辑 `.env.local`

```env
NEXT_PUBLIC_API_URL={SCF_URL}
NEXT_PUBLIC_API_KEY={API_KEY}
NEXT_PUBLIC_MEDIA_CDN=https://personal-site-media-{APPID}.cos.ap-guangzhou.myqcloud.com
```

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NEXT_PUBLIC_API_URL` | SCF 云函数 API 网关地址 | `https://service-xxx.gz.apigw.tencentcs.com/release/` |
| `NEXT_PUBLIC_API_KEY` | 自定义 API 密钥（需与 SCF .env 中一致）| 自定义强密码字符串 |
| `NEXT_PUBLIC_MEDIA_CDN` | 媒体桶公有读地址 | `https://personal-site-media-{APPID}.cos.ap-guangzhou.myqcloud.com` |

---

## 六、验证 API 链路

### 6.1 测试命令

使用 PowerShell 逐一验证各 API 端点：

```powershell
# 测试 Notes 读取
Invoke-RestMethod -Uri "{SCF_URL}/notes" -Method GET

# 测试 Bookmarks 读取
Invoke-RestMethod -Uri "{SCF_URL}/bookmarks" -Method GET

# 测试 Settings 读取
Invoke-RestMethod -Uri "{SCF_URL}/settings" -Method GET

# 测试 Music 读取
Invoke-RestMethod -Uri "{SCF_URL}/music" -Method GET

# 测试 Portfolio 读取
Invoke-RestMethod -Uri "{SCF_URL}/portfolio" -Method GET

# 测试写入（需要 API Key 鉴权）
Invoke-RestMethod -Uri "{SCF_URL}/settings" -Method PUT `
  -Headers @{"x-api-key"="{API_KEY}"; "Content-Type"="application/json"} `
  -Body '{"site_name":"My Site"}'
```

### 6.2 预期结果

成功响应格式：

```json
{
  "code": 0,
  "data": { ... }
}
```

- `code: 0` 表示请求成功
- 若桶内无数据，`data` 可能为空对象或空数组，属正常现象

### 6.3 验证清单

| 端点 | Method | 需要 API Key | 预期 |
|------|--------|-------------|------|
| `/notes` | GET | 否 | 返回笔记列表 |
| `/bookmarks` | GET | 否 | 返回书签数据 |
| `/settings` | GET | 否 | 返回站点配置 |
| `/music` | GET | 否 | 返回音乐列表 |
| `/portfolio` | GET | 否 | 返回作品集 |
| `/notes` | PUT | ✅ 是 | 写入笔记数据 |
| `/bookmarks` | PUT | ✅ 是 | 写入书签数据 |
| `/settings` | PUT | ✅ 是 | 写入站点配置 |

---

## 七、迁移本地数据到 COS

### 7.1 方式一：使用迁移脚本（推荐）

```powershell
cd e:\work\Qoder_code\personal-website
.\scripts\migrate-data.ps1 -AppId "{APPID}"
```

> ⚠️ 脚本必须传入 `-AppId` 参数，否则会报错退出。

### 7.2 方式二：通过 API 手动迁移

将 `content/` 目录下的 JSON 数据逐个通过 PUT 请求写入：

```powershell
# 迁移笔记数据
$notesData = Get-Content -Path "content\notes.json" -Raw
Invoke-RestMethod -Uri "{SCF_URL}/notes" -Method PUT `
  -Headers @{"x-api-key"="{API_KEY}"; "Content-Type"="application/json"} `
  -Body $notesData

# 迁移书签数据
$bookmarksData = Get-Content -Path "content\bookmarks.json" -Raw
Invoke-RestMethod -Uri "{SCF_URL}/bookmarks" -Method PUT `
  -Headers @{"x-api-key"="{API_KEY}"; "Content-Type"="application/json"} `
  -Body $bookmarksData

# 迁移设置数据
$settingsData = Get-Content -Path "content\settings.json" -Raw
Invoke-RestMethod -Uri "{SCF_URL}/settings" -Method PUT `
  -Headers @{"x-api-key"="{API_KEY}"; "Content-Type"="application/json"} `
  -Body $settingsData
```

### 7.3 验证迁移结果

```powershell
# 确认数据已成功写入
Invoke-RestMethod -Uri "{SCF_URL}/notes" -Method GET
Invoke-RestMethod -Uri "{SCF_URL}/bookmarks" -Method GET
Invoke-RestMethod -Uri "{SCF_URL}/settings" -Method GET
```

返回的 `data` 字段应包含刚迁移的内容。

---

## 八、构建前端

### 8.1 执行构建

```powershell
cd e:\work\Qoder_code\personal-website
pnpm build
```

### 8.2 常见构建问题

> ⚠️ **`dynamicParams` 与 `output: export` 冲突**
>
> 如果构建时报错提示 `dynamicParams: true` 与 `output: 'export'` 不兼容，需要修改：
>
> 文件：`app/notes/[slug]/page.tsx`
>
> ```typescript
> // 将
> export const dynamicParams = true;
> // 改为
> export const dynamicParams = false;
> ```
>
> 这是因为静态导出模式下不支持动态路由参数，必须在构建时生成所有页面。

### 8.3 构建产物

构建成功后，静态文件输出到 `out/` 目录：

```
out/
├── index.html
├── notes/
├── bookmarks/
├── _next/
│   ├── static/
│   └── ...
└── ...
```

---

## 九、部署前端到 Vercel

### 9.1 方式一：通过 GitHub 部署（推荐）

#### 步骤 1：推送到 GitHub

```powershell
cd e:\work\Qoder_code\personal-website
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/personal-website.git
git push -u origin main
```

#### 步骤 2：在 Vercel 导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击「Add New → Project」
3. 选择「Import Git Repository」
4. 从列表中选择 `personal-website` 仓库
5. Framework Preset 选择 `Next.js`

#### 步骤 3：配置环境变量

在部署设置页面的「Environment Variables」区域添加：

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `{SCF_URL}` |
| `NEXT_PUBLIC_API_KEY` | `{API_KEY}` |
| `NEXT_PUBLIC_MEDIA_CDN` | `{MEDIA_CDN}` |

#### 步骤 4：点击 Deploy

等待构建完成，Vercel 会分配一个 `.vercel.app` 域名。

> ⚠️ Vercel 仅支持 GitHub、GitLab、Bitbucket 三种 Git 托管平台，**不支持 Gitee 直连部署**。

### 9.2 方式二：使用 Vercel CLI 本地部署

```powershell
# 安装 Vercel CLI
npm install -g vercel

# 预览部署（测试环境）
cd e:\work\Qoder_code\personal-website
vercel

# 生产部署
vercel --prod
```

首次运行 `vercel` 命令时会引导登录并关联项目。

---

## 十、常见问题排查

### 10.1 coscmd SSL 错误

**现象**：执行 coscmd 上传时报 SSL 证书错误

**解决方案**：

```powershell
# 使用 HTTP 协议绕过 SSL 问题
coscmd upload --scheme http ./local-file /remote-path
```

---

### 10.2 COS 文件下载而非浏览器显示

**现象**：通过默认域名访问 COS 文件时，浏览器直接下载而非渲染显示

**原因**：2024 年 1 月 1 日后创建的存储桶，默认域名不再支持浏览器内联预览

**解决方案**：
- 方案 A：为 COS 桶配置自定义域名
- 方案 B（推荐）：使用 Vercel 托管前端静态资源，无需依赖 COS 静态网站功能

---

### 10.3 API 返回空数据

**现象**：GET 请求返回 `{"code": 0, "data": {}}` 或空数组

**说明**：这是**正常现象**。存储桶内尚无数据时，API 返回空结果。网站前端设计了 localStorage 作为 fallback 方案，本地数据会在 COS 无数据时自动生效。

**处理**：执行第七步「迁移本地数据到 COS」即可。

---

### 10.4 GitHub push 失败

**现象**：`git push` 超时或连接被拒绝

**解决方案**：
- 方案 A：配置 Git 代理
  ```powershell
  git config --global http.proxy http://127.0.0.1:7890
  git config --global https.proxy http://127.0.0.1:7890
  ```
- 方案 B：使用 Vercel CLI 直接本地部署，跳过 GitHub
  ```powershell
  vercel --prod
  ```

---

## 十一、项目结构参考

```
personal-website/
├── app/                  # Next.js 页面路由
├── components/           # React 组件
├── content/              # 本地静态内容（迁移用）
├── lib/                  # 工具函数
├── public/               # 静态资源
├── scf-api/              # 腾讯云 SCF 云函数代码
│   ├── index.js          # 主入口、路由分发
│   ├── handlers/         # API 处理器
│   ├── utils/            # 工具（COS 客户端、鉴权）
│   ├── deploy-scf.ps1   # SCF 部署脚本
│   └── .env              # 环境变量（不提交 Git）
├── scripts/
│   ├── deploy.ps1        # COS 静态文件部署
│   └── migrate-data.ps1  # 数据迁移脚本
├── .github/workflows/
│   └── deploy.yml        # GitHub Actions CI/CD
├── .env.local            # 前端环境变量（不提交 Git）
├── next.config.ts        # Next.js 配置（output: export）
└── package.json
```

---

## 十二、安全注意事项

| 安全项 | 措施 |
|--------|------|
| 密钥文件 | `.env` 和 `.env.local` 已在 `.gitignore` 中，**绝不提交到 Git** |
| API 鉴权 | API Key 仅保护写操作（POST/PUT/DELETE），读操作（GET）无需鉴权 |
| COS 私有桶 | 通过 SCF 生成临时签名 URL 授权访问，签名有效期有限 |
| 密钥轮换 | 生产环境建议每 90 天轮换一次 SecretId/SecretKey |
| 子账号 | 建议创建 CAM 子账号，仅授予 COS + SCF 必要权限 |

> ⚠️ 确认 `.gitignore` 包含以下条目：
> ```
> .env
> .env.local
> .env*.local
> ```

---

## 部署完成后的最终架构

| 层级 | 服务 | 地址 | 说明 |
|------|------|------|------|
| 前端 | Vercel | `https://your-project.vercel.app` | Next.js 静态页面，全球 CDN |
| API | 腾讯云 SCF | `{SCF_URL}` | 无服务器后端，ap-guangzhou |
| 数据 | 腾讯云 COS | `*.cos.ap-guangzhou.myqcloud.com` | 7 个存储桶，ap-guangzhou |
| 媒体 | 腾讯云 COS（公有读）| `{MEDIA_CDN}` | 图片/音频公开访问 |
| CI/CD | GitHub Actions | `.github/workflows/deploy.yml` | 自动化部署流水线 |

---

> 📌 **部署检查清单**
>
> - [ ] 腾讯云实名认证完成
> - [ ] 7 个 COS 存储桶已创建（ap-guangzhou）
> - [ ] SCF 云函数部署成功，API 网关地址已获取
> - [ ] 前端 `.env.local` 配置完成
> - [ ] API 链路验证通过（GET/PUT 测试）
> - [ ] 本地数据已迁移到 COS
> - [ ] 前端构建成功（`pnpm build`）
> - [ ] Vercel 部署完成，网站可访问
> - [ ] `.env` 系列文件未提交到 Git
