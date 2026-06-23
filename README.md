# 个人摄影网站

这是一个静态个人摄影作品集，风格偏克制、干净、编辑感。当前版本使用本地图片文件、相册配置和自动同步脚本管理作品信息，不需要后端。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 自动同步照片

把照片按相册放进 `public/photos/` 下的文件夹，然后运行：

```bash
npm run photos:sync
```

例如：

```text
public/photos/沙金/IMG_0661-已增强-NR.jpg
public/photos/116天安门升旗/终稿/IMG_1885-已增强-降噪.jpg
public/photos/131水长城/IMG_4268-已增强-降噪.jpg
```

同步命令会自动更新 `src/data/photos.json`：

- 相册文件夹名会成为相册 ID。
- `album.json` 会提供相册标题、题材、相册描述和精选规则。
- 图片路径会自动生成。
- 文件名会自动清理成标题。
- 如果图片 EXIF 里有拍摄时间，会自动填入年份。
- 图片宽高会自动读取，用来减少页面加载时的跳动。

## 自动创建相册配置

放入新的照片文件夹后，可以先运行：

```bash
npm run photos:template
```

这个命令会扫描 `public/photos/` 下的相册文件夹：

- 没有 `album.json` 的相册会自动创建一个基础配置。
- 新配置会根据文件夹名低成本推断 `title`、`topics` 和 `description`。
- 新配置会包含单张照片配置示例，方便复制。
- 已经存在的 `album.json` 不会被覆盖。
- 不会再给每张照片生成空的 `photos` 条目。

如果之前生成过大量空的单张照片配置，可以运行：

```bash
npm run photos:clean
```

这个命令会删除全空的单张照片配置，但会保留已经填写过标题、描述、题材、地点或精选状态的照片。

常用顺序是：

```bash
npm run photos:template
npm run photos:clean
npm run photos:sync
```

## 相册配置 album.json

每个相册文件夹可以放一个 `album.json`：

如果忘记字段名，可以复制这个模板：

```text
public/photos/album.template.json
```

复制到新相册文件夹后，把文件名改成：

```text
album.json
```

```json
{
  "title": "沙金",
  "topics": ["Cosplay", "人像", "舞台"],
  "description": "一组以角色造型、现场互动和舞台氛围为主的照片。",
  "featured": true
}
```

网站会同时支持：

- 按题材浏览：风景 / 人像 / Cosplay / 城市 / 旅行 / 舞台 / 纪实 / 日常 / 其他新增题材
- 按相册浏览：沙金 / 116天安门升旗 / 131水长城 / 后续新增相册

## 给单张照片写单独介绍

如果某张照片需要单独标题、说明、题材、地点或精选设置，可以在相册的 `album.json` 里添加 `photos`：

```json
{
  "title": "131水长城",
  "topics": ["风景", "旅行", "日常"],
  "description": "一组关于水长城、山水和旅行途中观察的照片。",
  "featured": true,
  "photos": {
    "IMG_4268-已增强-降噪.jpg": {
      "title": "湖面与长城",
      "description": "水面很安静，远处的长城线条把山势和天空连接起来。",
      "topics": ["风景", "旅行"],
      "location": "北京",
      "featured": true
    }
  }
}
```

规则：

- 没有单独配置的照片会继承相册信息。
- `photos` 里的文件名必须和真实照片文件名一致。
- 如果照片在子文件夹里，也可以用相册内相对路径，例如 `"终稿/IMG_1885-已增强-降噪.jpg"`。
- 单张照片配置会优先于相册配置。

## 推荐题材

优先使用这些题材，必要时也可以新增：

- 风景
- 人像
- Cosplay
- 城市
- 旅行
- 舞台
- 纪实
- 日常

建议第一版先保持少量题材。作品集会因为“筛选过”而更有力量，而不是因为“放得多”而更完整。
## 本地相册管理工具

如果不想手动编辑每个 `album.json`，可以启动本地管理工具：

```bash
npm run admin
```

然后打开：

```text
http://127.0.0.1:4000/admin
```

这个工具最初只管理“相册级信息”，现在已经扩展为本地照片内容管理入口：

- 相册名称
- 相册描述
- 题材分类
- 首页回退精选
- 给照片 Star
- 首页照片排序
- 首页照片隐藏/显示
- 首页展示数量

它不会上传照片，也不会编辑单张照片的独立介绍。单张照片配置仍然保留在 `album.json` 的 `photos` 字段里，管理工具保存相册信息时会保留这些已有内容。

推荐流程：

```bash
npm run admin
```

在管理页面中点击“扫描”，让新放入的照片文件夹生成 `album.json`。随后选择相册，填写题材和描述，点击“保存相册信息”。如果要控制首页照片，进入“首页照片管理”，调整顺序后点击“保存首页顺序”。最后点击管理页里的“更新主站”，或在终端运行：

```bash
npm run photos:sync
npm run dev
```

## 首页照片管理

首页照片由两部分共同决定：

- `album.json` 中的 `star: true`：表示某张照片进入首页照片池。
- `public/photos/homepage.json`：记录首页顺序、隐藏状态和展示数量。

常用流程：

```text
在相册管理中给照片点 Star
→ 保存相册信息
→ 进入首页照片管理
→ 置顶 / 置底 / 上移 / 下移 / 隐藏 / 显示
→ 保存首页顺序
→ 更新主站
```

如果没有任何 Star 照片，首页会使用旧的精选回退规则，避免首页空白。

## GitHub 上传策略

建议上传代码、脚本、文档和 JSON 配置，但不要上传真实照片、RAW 原片、依赖和构建产物。

当前 `.gitignore` 会忽略：

- `node_modules/`
- `dist/`
- `.env*`
- 日志文件
- `public/photos/` 下的图片和 RAW 文件

但会保留：

- `public/photos/album.template.json`
- 各相册的 `album.json`
- `public/photos/homepage.json`
- `src/data/photos.json`
- 使用手册和工程日志

如果之后要公开仓库，需要再次检查 `album.json`、`homepage.json` 和 `src/data/photos.json` 是否包含不想公开的相册名、地点或描述。当前更适合上传到私有 GitHub 仓库。
