# 个人摄影网站 v2 设计规格

> 日期: 2025-06-21 | 状态: 设计确认

## 项目定位

安静克制的个人摄影作品集。像翻阅一本精装摄影集——留白多、节奏慢、让照片自己说话。

## 技术选型

- **构建工具**: Vite
- **前端**: Vanilla HTML/CSS/JS（不引入框架）
- **图片处理**: sharp (Node.js)，构建时生成 WebP 缩略图
- **构建脚本**: Node.js 原生 fs，字符串模板拼接 HTML
- **部署**: 纯静态文件，部署到任意静态托管

### 为什么不引入框架

摄影集网站的核心是视觉呈现，不是交互逻辑。四个页面（封面 + 3 专题 + 灯箱层）不需要 React 的状态管理。Vanilla 方案对每个像素有绝对掌控，构建出更干净的 HTML，加载更快。

## 页面架构

```
index.html (封面)
  ├── 全屏封面照片
  ├── 网站标题（微小浮动）
  └── 三个项目入口（底部）
       │
       ├── 沙金.html (项目专题页)
       ├── 天安门升旗.html (项目专题页)
       └── 水长城.html (项目专题页)
              │
              └── 灯箱浮层（任意页面，URL hash 触发）
```

- **封面页**: 一张 100vh 满屏封面照片（非浏览器全屏 API），标题以小字浮于一角，三个项目入口位于底部，无顶部导航
- **项目专题页**: 纵向滚动，每张照片独占屏幕注意力，大量留白，左上角返回箭头
- **灯箱层**: 通过 URL hash (`#photo-id`) 触发，支持链接分享，前后切换照片
- **无顶部导航栏**: 封面底部入口 → 项目页内左上返回，保持视觉纯净

## 视觉设计系统

### 字体

| 用途 | 选择 | 尺寸 |
|:---|:---|:---|
| 标题/项目名 | Georgia / Noto Serif SC（系统衬线） | 2.5rem ~ 4rem |
| 正文/元信息 | Inter / 系统默认无衬线 | 0.75rem |
| 照片标题（灯箱） | 衬线体 | 2rem |

### 色彩

| 用途 | 色值 | 说明 |
|:---|:---|:---|
| 页面背景 | `#FAFAF8` | 极浅暖白，像相纸底色 |
| 主文字 | `#2B2B28` | 深棕灰而非纯黑，更柔和 |
| 次级文字 | `#8A857C` | 温润灰色 |
| 强调/悬停 | `#1A1A18` | 几乎黑色，极少使用 |
| 灯箱背景 | `rgba(20,18,16,0.95)` | 近乎全黑，让照片浮在最纯粹的环境中 |

没有"主题色"。照片本身就是色彩。

### 留白

| 区域 | 尺寸 |
|:---|:---|
| 照片间距（项目页） | 6rem (96px) |
| 页面边距 | 3rem (48px) |
| 灯箱内边距 | 3rem |

### 动效

- **无入场动画**: 照片就该在那里，不需要 fade in
- **灯箱**: 打开/关闭 `opacity` 过渡 200ms easing
- **照片切换**: `opacity` 交叉淡入淡出 150ms
- **不做的**: parallax、scroll reveal、hover 放大 —— 安静地滚动就好

## 图片管线

### 源文件结构

```
public/
├── 沙金/
│   ├── photos.json       ← 照片序列元数据
│   ├── cover.jpg          ← 项目封面（首页用）
│   └── images/
│       ├── IMG_0661.jpg   ← 原图
│       ├── IMG_0661.webp  ← 400px 缩略图（构建生成）
│       └── IMG_0661@2x.webp ← 800px 缩略图（构建生成）
├── 天安门升旗/
│   └── （同上结构）
└── 水长城/
    └── （同上结构）
```

### 构建脚本处理

1. 扫描 `public/*/images/` 所有原图
2. 用 sharp 生成 400px 和 800px WebP 缩略图
3. 读取每项目 `photos.json`，补全 `width`、`height`、`aspectRatio`
4. 生成 `public/index.json` 全局索引用供首页和灯箱
5. 从 `src/templates/` 模板拼接 HTML 输出到 `dist/`

### 图片加载策略

- 项目页：用 `<img srcset>` 加载 400px/800px WebP，`loading="lazy"`
- 灯箱：点击时按需加载原图
- 占位：构建时生成 20px 模糊占位图（base64 内联）

## 数据模型

每项目的 `photos.json`：

```json
[
  {
    "id": "shajin-01",
    "src": "images/IMG_0661.jpg",
    "title": "沙金午后",
    "year": "2024",
    "location": "河北",
    "description": "",
    "order": 1
  }
]
```

必填：`id`、`src`、`title`、`order`。可选：`year`、`location`、`description`。

与上一版相比的简化：去掉 `category`（文件夹即分类）、去掉 `featured`（用 `order` 控制序列）、去掉 `tone`（全局色系统一）、`width/height` 由构建脚本采集。

## CCB 多代理分工

| 角色 | 代理 | 职责 |
|:---|:---|:---|
| Planner | Claude Code | 设计决策、排版推敲、代码审查、视觉验收 |
| Worker | Codex | 实现模板、CSS、构建脚本、图片处理逻辑 |
| Reviewer | Claude Code | 检查实现是否偏离"安静克制"基调、代码质量、边界情况 |

## 项目目录结构

```
personal-photography-website-superpowers/
├── public/                 ← 照片源文件 + 元数据
│   ├── 沙金/
│   ├── 天安门升旗/
│   ├── 水长城/
│   └── index.json          ← 构建生成
├── src/
│   ├── templates/          ← HTML 模板
│   │   ├── base.html
│   │   ├── cover.html
│   │   ├── project.html
│   │   └── partials/
│   ├── styles/
│   │   └── main.css        ← 全局样式
│   ├── scripts/
│   │   ├── lightbox.js     ← 灯箱交互
│   │   └── navigation.js   ← 键盘导航
│   └── assets/
│       └── favicon.svg
├── scripts/
│   ├── build-photos.mjs    ← 图片处理 + 全局索引
│   ├── build-pages.mjs     ← HTML 生成
│   └── build.mjs           ← 主入口
├── dist/                   ← 构建输出
├── package.json
└── vite.config.js
```

## 不在此范围

- 后端/CMS —— 纯静态，手动加照片即可
- 关于页 —— 暂不需要，封面足以表达
- 多语言 —— 仅中文
- SEO 优化 —— 暂不涉及（后续可加 meta 标签）
- 用户系统/评论 —— 不需要
