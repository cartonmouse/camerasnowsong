# camerasnowsong

一个个人摄影作品集网站，用相册和题材整理照片，保存一次次观看、行走和按下快门的记录。

在线访问：[https://camerasnowsong.vip/](https://camerasnowsong.vip/)

## 项目简介

`camerasnowsong` 是一个静态个人摄影网站。它不依赖传统后端，而是通过本地照片目录、相册配置文件、发布图生成脚本和 GitHub Pages 部署流程来管理作品。

网站的视觉方向偏克制、干净、留白和编辑感。照片既可以按题材浏览，也可以按相册进入一次拍摄的完整语境。

## 功能特性

- 首页精选照片展示，支持手动排序、隐藏和展示数量控制。
- 作品页支持按相册和按题材浏览，默认进入相册视图。
- 相册可以配置标题、描述、题材、封面和单张照片信息。
- 本地相册管理工具支持扫描相册、编辑信息、Star 首页照片和更新主站数据。
- 原图保存在 `public/photos/`，网站发布使用 `public/site-photos/` 中生成的轻量 WebP 图片。
- 数据同步脚本会生成 `src/data/photos.json`，供主站读取。
- GitHub Actions 自动构建并部署到 GitHub Pages。
- 支持自定义域名访问。

## 技术栈

- React
- Vite
- Node.js 本地脚本
- Python + Pillow 图片处理
- GitHub Actions
- GitHub Pages

## 本地开发

安装依赖：

```bash
npm install
```

启动主站：

```bash
npm run dev
```

默认访问：

```text
http://127.0.0.1:5173/
```

启动本地相册管理工具：

```bash
npm run admin
```

默认访问：

```text
http://127.0.0.1:4000/admin
```

## 照片管理流程

照片源文件按相册放在：

```text
public/photos/
```

每个相册文件夹可以包含一个 `album.json`，用于记录相册标题、描述、题材和单张照片信息。

常用流程：

```bash
npm run admin
```

然后在管理页面中：

1. 点击“扫描”，识别 `public/photos/` 中的相册和照片。
2. 编辑相册信息、题材分类和单张照片信息。
3. 给需要展示在首页的照片设置 Star。
4. 在“首页照片管理”中调整展示顺序。
5. 点击“更新主站”，生成主站数据和发布用 WebP 图片。

也可以使用命令行同步：

```bash
npm run photos:sync
```

生成发布用 WebP 图片：

```bash
npm run photos:publish
```

## 构建与验证

运行数据和布局相关测试：

```bash
npm run test:data
```

运行管理工具测试：

```bash
npm run test:admin
```

构建生产版本：

```bash
npm run build
```

## 部署

本项目通过 GitHub Actions 部署到 GitHub Pages。推送到 `main` 分支后，工作流会自动执行构建并发布网站。

当前自定义域名：

```text
camerasnowsong.vip
```

GitHub Pages 原始地址：

```text
https://cartonmouse.github.io/camerasnowsong/
```

## 项目文档

更完整的维护说明见：

- [个人摄影网站使用手册](./个人摄影网站使用手册.md)
- [版权与复用说明](./NOTICE.md)

## 版权与许可

本仓库公开可见，但公开不等于授权复用。

所有照片、图片资产、相册描述、照片标题、照片说明、个人文字和网站文案均保留版权，未经许可不得复制、转载、改作、商用、用于训练数据集，或作为他人作品展示。

网站源代码目前未授予开源许可证。除非之后明确添加许可证，否则不得复制、修改、再发布或包装成自己的项目。

如需授权，请联系：

```text
paperboxmouse@163.com
```
