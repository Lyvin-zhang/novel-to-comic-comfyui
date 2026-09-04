# Novel to Comic — 可视化操作面板

为 `novel-to-comic-comfyui` skill 配套的可视化工作流操作面板。把小说转漫画的 6 步流程结构化管理，不用反复翻 SKILL.md。

## 功能

- **6 步工作流导航**：风格配置 → 分镜脚本 → 资产定义 → 资产生成 → 页面提示词 → 页面生成
- **结构化编辑**：分镜逐格编辑、角色/环境/道具资产卡片管理、页面提示词全字段编辑
- **风格系统**：6 种艺术风格 + 7 种色调 + 7 种布局 + 5 种预设，题材推荐
- **ComfyUI 友好**：资产引用表（IPAdapter 权重）、正负提示词、工作流备注（模型/采样器/CFG/分辨率）
- **双主题**：亮色 / 暗色切换
- **数据持久化**：Node 后端 + SQLite 本地数据库（`data/app.db`），自动保存
- **导入导出**：JSON 项目导入导出、Markdown 文件打包 ZIP 导出

## 技术栈

**前端**
- Vue 3 + TypeScript + Vite
- Naive UI（组件库）
- Pinia（状态管理）
- Vue Router
- Tailwind CSS v4
- JSZip + file-saver（导出）

**后端**
- Node.js + Express（`server/index.cjs`，端口 3001）
- better-sqlite3（SQLite，WAL 模式，`data/app.db`）

## 快速开始

```bash
# 安装依赖
npm install

# 一键启动前后端（推荐，后端 3001 + 前端开发服务器）
npm run dev:all

# 或分别启动
npm run dev:server   # 后端 API
npm run dev          # 前端（自动代理 /api 到 3001）

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 目录结构

```
web-panel/
├── server/
│   ├── index.cjs        # Express 后端（REST API，端口 3001）
│   └── db.cjs           # SQLite 封装（实体级拆表：项目/章节/分镜/提示词/资产）
├── data/
│   └── app.db           # SQLite 数据库文件（自动创建，可直接复制备份）
├── src/
│   ├── types/           # TypeScript 类型定义
│   ├── data/            # 静态配置数据（风格/色调/布局/预设）
│   ├── stores/          # Pinia 状态管理
│   ├── router/          # 路由配置
│   ├── layouts/         # 主布局（侧边栏+顶栏）
│   ├── views/           # 7 个页面视图
│   ├── utils/           # 工具函数（API 客户端、导出等）
│   ├── App.vue
│   ├── main.ts
│   └── style.css        # 全局样式 + 主题变量
├── index.html
├── vite.config.ts       # 含 /api → localhost:3001 开发代理
├── tsconfig.json
└── package.json
```

## 工作流说明

| 步骤 | 内容 | 产出 |
|------|------|------|
| Step 1 | 输入小说，选择艺术风格、色调、布局、画幅、预设 | 项目配置 |
| Step 2 | 逐页逐格编写分镜：场景、机位、角色、动作、灯光、对话/旁白/SFX | storyboard |
| Step 3 | 提取角色/环境/道具资产，定义外观配色，生成 ComfyUI 提示词 | assets |
| Step 4 | 【用户操作】在 ComfyUI 中生成资产图片，标记状态，填写文件路径 | 资产图片 |
| Step 5 | 为每页生成构图提示词：资产引用、面板布局、正负提示词、工作流备注 | page prompts |
| Step 6 | 【用户操作】在 ComfyUI 中生成页面，后期添加对话气泡/SFX/边框 | 成品漫画 |

## AI 辅助生成

面板本身是结构化编辑工具，不内置 AI 生成。你可以：

1. 把配套的 `novel-to-comic-comfyui` skill 放到豆包、Claude、Codex、Kimi 等 AI 工具中
2. 让 AI 帮你生成初稿（分镜、资产定义、提示词等）
3. 通过顶栏「导入 JSON」把 AI 生成的项目数据导入面板
4. 在面板中做精细化编辑和管理

也可以完全手动在面板中从零创建项目。

## 注意事项

- 所有生成提示词建议使用英文（模型对英文标签响应更好）
- 不要指望生成模型渲染可读文字，所有对话/旁白/SFX 都在后期添加
- 角色一致性依赖引用 Step 4 生成的资产图片（ComfyUI 走 IPAdapter，Krea2 直接附加参考图）
- 配套 skill（v2.1）支持 Krea2（默认）与 ComfyUI 双生成引擎，Krea2 提示词组成规则见 `../references/krea2-prompt-rules.md`
- 项目数据保存在本地 SQLite（`data/app.db`），删除该文件或清空 `data/` 目录会丢失数据；备份时直接复制 `app.db` 即可
