# Creative Studio

无限画布 + 视频时间线编辑器 —— 基于 Next.js + PixiJS (WebGL) 构建。

## 快速开始

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 功能概览

### 画布（PixiJS WebGL 渲染）

| 功能 | 操作方式 |
|------|---------|
| 平移画布 | 鼠标拖拽空白区域 |
| 缩放画布 | 鼠标滚轮 / 双指捏合 |
| 添加矩形 | 工具栏 ▬ 或快捷键 `R` → 点击画布 |
| 添加圆形 | 工具栏 ● 或快捷键 `O` → 点击画布 |
| 添加文字 | 工具栏 T 或快捷键 `T` → 点击画布 |
| 添加便签 | 工具栏 ▣ 或快捷键 `N` → 点击画布 |
| 添加图片 | 工具栏 🖼 或快捷键 `I` → 选择文件 |
| 添加视频 | 工具栏 ▶ 或快捷键 `D` → 选择文件 |
| 选中对象 | 左键点击对象 |
| 移动对象 | 选中后拖拽 |
| 缩放对象 | 选中后拖拽 8 个蓝色 handle |
| 删除对象 | 选中后按 `Delete` / `Backspace` |
| 取消选中 | 点击空白处 或 按 `Esc` |

### 时间线（DOM + requestAnimationFrame）

| 功能 | 操作方式 |
|------|---------|
| 播放/暂停 | 点击 ▶ / ⏸ 按钮 |
| 跳转播放头 | 点击时间线刻度区域 |
| 移动 clip | 拖拽 clip 中间部分 |
| 裁剪 clip 左边 | 拖拽 clip 左边缘 |
| 裁剪 clip 右边 | 拖拽 clip 右边缘 |

### 画布与时间线联动

- **上传视频** → 自动同时在画布和时间线出现
- **选中同步** → 画布选中视频 ↔ 时间线对应 clip 高亮
- **裁剪同步** → 时间线裁剪 clip → 画布视频预览帧同步更新
- **播放同步** → 时间线播放时，画布视频自动 seek 到对应帧

### 属性面板

选中对象后，右侧面板可实时编辑：
- 位置 (X, Y)
- 尺寸 (W, H)
- 颜色（矩形/圆形/便签）
- 文字内容（文字/便签）
- 字号（文字）
- 裁剪起点（视频，秒）

### 导出

点击右上角 **Export PNG** 下载当前画布截图。

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `V` | 选择工具 |
| `R` | 矩形工具 |
| `O` | 圆形工具 |
| `T` | 文字工具 |
| `N` | 便签工具 |
| `I` | 上传图片 |
| `D` | 上传视频 |
| `Delete` / `Backspace` | 删除选中对象 |
| `Esc` | 取消选中 / 切回选择工具 |

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16+ (App Router) | 框架 |
| React | 19+ | UI |
| TypeScript | 5+ | 类型安全 |
| PixiJS | 8.20+ | WebGL 画布渲染 |
| pixi-viewport | 6.0+ | 画布平移/缩放 |
| Zustand | 5.0+ | 状态管理（React ↔ PixiJS 桥梁） |
| Tailwind CSS | 4+ | 样式 |

## 架构

```
React UI (工具栏/时间线/属性面板)
    ↕ Zustand store (objects, clips, selection, playback)
PixiJS Canvas (SceneManager 命令式管理场景图)
```

- **Zustand 双向同步**：React UI 操作 → store update → SceneManager 订阅触发 → PixiJS 命令式更新；反向同理
- **Map 不可变更新**：每次 store action 创建新 Map 实例触发响应
- **subscribeWithSelector**：SceneManager 订阅特定字段，高频更新（如播放时间）不触发 React 重渲染
- **自定义交互系统**：8 方向 resize handles 纯 PixiJS Graphics 实现

## 项目结构

```
app/
├── layout.tsx / page.tsx              # 入口（SSR 安全的 dynamic import）
├── editor/
│   ├── EditorShell.tsx                # 顶层布局
│   ├── canvas/                        # PixiJS 画布核心
│   │   ├── PixiCanvas.tsx             # React 生命周期管理 + 键盘快捷键
│   │   ├── SceneManager.ts            # 场景图管理 + Zustand 订阅
│   │   ├── SelectionController.ts     # 自定义选中框 + 8 resize handles
│   │   ├── VideoSpriteManager.ts      # 视频纹理管理（缓存 + seek + play）
│   │   └── shapeFactory.ts            # 形状创建工厂
│   ├── timeline/                      # 时间线 (纯 DOM)
│   │   ├── Timeline.tsx               # 容器 + 播放循环
│   │   ├── Track.tsx                  # 单轨道
│   │   ├── Clip.tsx                   # 可拖拽/裁剪的 clip
│   │   ├── Playhead.tsx               # 播放头
│   │   └── TimeRuler.tsx              # 时间刻度
│   ├── toolbar/Toolbar.tsx            # 左侧工具栏 + 文件上传
│   ├── panels/PropertiesPanel.tsx     # 右侧属性编辑面板
│   ├── export/ExportButton.tsx        # PNG 导出
│   ├── store/                         # Zustand
│   │   ├── editorStore.ts             # 全局状态
│   │   └── types.ts                   # 类型定义
│   └── utils/                         # 工具函数
│       ├── coordinate.ts              # 坐标转换
│       └── time.ts                    # 时间格式化
```
