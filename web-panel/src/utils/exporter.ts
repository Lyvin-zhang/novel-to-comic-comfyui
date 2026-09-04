import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { ComicProject, StoryboardPage, CharacterAsset, EnvironmentAsset, PropAsset, PagePrompt } from '@/types'

function frontMatter(data: Record<string, unknown>): string {
  const lines = Object.entries(data)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? `"${v}"` : JSON.stringify(v)}`)
    .join('\n')
  return `---\n${lines}\n---\n\n`
}

function exportStoryboard(project: ComicProject): string {
  const meta = project.meta
  const totalPages = project.chapters.reduce((sum, c) => sum + c.storyboard.length, 0)
  let md = frontMatter({
    title: meta.title,
    art_style: meta.artStyle,
    tone: meta.tone,
    layout: meta.layout,
    aspect_ratio: meta.aspectRatio,
    page_count: totalPages,
    chapter_count: project.chapters.length,
    language: meta.language,
    preset: meta.preset,
  })

  md += `# ${meta.title} - 漫画分镜脚本\n\n`
  md += `**章节数**：${project.chapters.length} 章\n`
  md += `**总页数**：${totalPages} 页\n`
  md += `**风格**：${meta.artStyle} / ${meta.tone}\n`
  md += `**布局**：${meta.layout}\n\n---\n\n`

  project.chapters.forEach(chapter => {
    md += `# ${chapter.title}\n\n`
    if (chapter.novelText) {
      md += `> 本章原文 ${chapter.novelText.replace(/\s/g, '').length} 字\n\n`
    }

    chapter.storyboard.forEach((page: StoryboardPage) => {
      md += `## 第 ${page.pageNumber} 页 — ${page.title}\n\n`
      md += `**布局**：${page.layout}\n`
      md += `**叙事层**：${page.narrativeLayer}\n`
      md += `**核心信息**：${page.coreMessage || '—'}\n\n`
      md += `### 面板布局（${page.panels.length} 格）\n\n`

      page.panels.forEach(panel => {
        md += `#### 面板 ${panel.panelNumber}（${panel.size}，${panel.position}）\n\n`
        md += `- **场景**：${panel.scene || '—'}\n`
        md += `- **机位**：${panel.camera}\n`
        md += `- **环境**：${panel.environment || '—'}\n`
        md += `- **灯光**：${panel.lighting || '—'}\n`
        md += `- **动作**：${panel.action || '—'}\n`
        if (panel.characters.length > 0) {
          md += `- **角色**：\n`
          panel.characters.forEach(c => {
            md += `  - ${c.name}（${c.assetId}）：${c.description || '—'}\n`
          })
        }
        if (panel.environment?.name) {
          md += `- **环境**：${panel.environment.name}（${panel.environment.assetId}）：${panel.environment.description || '—'}\n`
        }
        if (panel.props && panel.props.length > 0) {
          md += `- **道具**：\n`
          panel.props.forEach(p => {
            md += `  - ${p.name}（${p.assetId}）：${p.description || '—'}\n`
          })
        }
        if (panel.textElements.length > 0) {
          md += `- **文字元素**：\n`
          panel.textElements.forEach(t => {
            md += `  - [${t.type}] ${t.content}${t.speaker ? `（${t.speaker}）` : ''}\n`
          })
        }
        md += '\n'
      })

      md += `**页面钩子**：${page.pageHook || '—'}\n\n`
      if (page.visualPrompt) {
        md += `**视觉提示词**：\n\`\`\`\n${page.visualPrompt}\n\`\`\`\n\n`
      }
    })

    md += `---\n\n`
  })

  return md
}

function exportCharacters(project: ComicProject): string {
  let md = `# 角色资产 - ${project.meta.title}\n\n`
  md += `**风格**：${project.meta.artStyle}\n\n---\n\n`

  project.characters.forEach((char: CharacterAsset) => {
    md += `## ${char.id}：${char.name}\n\n`
    md += `- **角色**：${char.role || '—'}\n`
    md += `- **年龄**：${char.age || '—'}\n`
    md += `- **首次出场**：${char.firstAppearance || '—'}\n`
    md += `- **出现章节**：${formatChapters(char.recurringChapters || [])}\n`
    md += `- **重复出现页**：${char.recurringPages.length > 0 ? char.recurringPages.join(', ') : '—'}\n\n`

    md += `### 外观\n`
    md += `- 脸型：${char.appearance.faceShape || '—'}\n`
    md += `- 发型：${char.appearance.hair || '—'}\n`
    md += `- 眼睛：${char.appearance.eyes || '—'}\n`
    md += `- 体型：${char.appearance.build || '—'}\n`
    md += `- 特征：${char.appearance.distinguishingFeatures || '—'}\n\n`

    md += `### 服装\n`
    md += `- 默认服装：${char.costume.defaultOutfit || '—'}\n`
    md += `- 配色：${char.costume.colorPalette || '—'}\n`
    md += `- 配饰：${char.costume.accessories || '—'}\n\n`

    md += `### 表情范围\n`
    md += `- 中性：${char.expressionRange.neutral || '—'}\n`
    md += `- 开心：${char.expressionRange.happy || '—'}\n`
    md += `- 思考：${char.expressionRange.thinking || '—'}\n`
    md += `- 坚定：${char.expressionRange.determined || '—'}\n`
    md += `- 其他：${char.expressionRange.custom || '—'}\n\n`

    if (char.visualReferenceNotes) {
      md += `### 视觉参考备注\n${char.visualReferenceNotes}\n\n`
    }

    if (char.referenceSheetPrompt) {
      md += `### 参考表 ComfyUI 提示词\n\`\`\`\n${char.referenceSheetPrompt}\n\`\`\`\n\n`
    }

    if (char.standingPosePrompt) {
      md += `### 站姿 ComfyUI 提示词\n\`\`\`\n${char.standingPosePrompt}\n\`\`\`\n\n`
    }

    md += `---\n\n`
  })

  return md
}

function exportEnvironments(project: ComicProject): string {
  let md = `# 环境资产 - ${project.meta.title}\n\n---\n\n`

  project.environments.forEach((env: EnvironmentAsset) => {
    md += `## ${env.id}：${env.name}\n\n`
    md += `- **类型**：${env.type}\n`
    md += `- **首次出场**：${env.firstAppearance || '—'}\n`
    md += `- **出现章节**：${formatChapters(env.recurringChapters || [])}\n\n`

    md += `### 描述\n`
    md += `- 位置：${env.description.location || '—'}\n`
    md += `- 建筑：${env.description.architecture || '—'}\n`
    md += `- 关键道具：${env.description.keyProps || '—'}\n`
    md += `- 氛围：${env.description.atmosphere || '—'}\n\n`

    md += `### 配色\n`
    md += `- 主色：${env.colorPalette.dominant || '—'}\n`
    md += `- 辅色：${env.colorPalette.secondary || '—'}\n`
    md += `- 点缀：${env.colorPalette.accent || '—'}\n`
    md += `- 灯光：${env.colorPalette.lighting || '—'}\n\n`

    if (env.comfyPrompt) {
      md += `### ComfyUI 正向提示词\n\`\`\`\n${env.comfyPrompt}\n\`\`\`\n\n`
    }
    if (env.negativePrompt) {
      md += `### ComfyUI 负向提示词\n\`\`\`\n${env.negativePrompt}\n\`\`\`\n\n`
    }

    md += `---\n\n`
  })

  return md
}

function exportProps(project: ComicProject): string {
  let md = `# 道具资产 - ${project.meta.title}\n\n---\n\n`

  project.props.forEach((prop: PropAsset) => {
    md += `## ${prop.id}：${prop.name}\n\n`
    md += `- **类型**：${prop.type || '—'}\n`
    md += `- **持有者**：${prop.ownerWielder || '—'}\n`
    md += `- **首次出场**：${prop.firstAppearance || '—'}\n`
    md += `- **出现章节**：${formatChapters(prop.recurringChapters || [])}\n\n`

    md += `### 描述\n`
    md += `- 形态：${prop.description.form || '—'}\n`
    md += `- 细节：${prop.description.details || '—'}\n`
    md += `- 功能：${prop.description.function || '—'}\n`
    md += `- 特性：${prop.description.specialTraits || '—'}\n`
    md += `- 比例参考：${prop.description.scaleReference || '—'}\n\n`

    if (prop.comfyPrompt) {
      md += `### ComfyUI 正向提示词\n\`\`\`\n${prop.comfyPrompt}\n\`\`\`\n\n`
    }

    md += `---\n\n`
  })

  return md
}

function exportPagePrompt(prompt: PagePrompt): string {
  let md = frontMatter({
    page: prompt.pageNumber,
    title: prompt.title,
    layout: prompt.layout,
    aspect: prompt.aspect,
    art_style: prompt.artStyle,
    tone: prompt.tone,
    panel_count: prompt.panelCount,
  })

  md += `# 第 ${prompt.pageNumber} 页 — ${prompt.title}\n\n`

  md += `## 资产引用\n\n`
  if (prompt.assetReferences.characters.length > 0) {
    md += `### 角色资产\n| ID | 文件 | 角色 | 权重 |\n|---|---|---|---|\n`
    prompt.assetReferences.characters.forEach(c => {
      md += `| ${c.assetId} | ${c.file} | ${c.role} | ${c.weight} |\n`
    })
    md += '\n'
  }
  if (prompt.assetReferences.environments.length > 0) {
    md += `### 环境资产\n| ID | 文件 | 面板 | 权重 |\n|---|---|---|---|\n`
    prompt.assetReferences.environments.forEach(e => {
      md += `| ${e.assetId} | ${e.file} | ${e.panels || '—'} | ${e.weight} |\n`
    })
    md += '\n'
  }

  md += `## 面板布局\n- 类型：${prompt.panelLayout.layoutType}\n- 装订线：${prompt.panelLayout.gutter}\n- 边框：${prompt.panelLayout.border}\n\n`

  md += `## ComfyUI 正向提示词\n\`\`\`\n${prompt.positivePrompt}\n\`\`\`\n\n`
  md += `## ComfyUI 负向提示词\n\`\`\`\n${prompt.negativePrompt}\n\`\`\`\n\n`

  md += `## 工作流备注\n- 基础模型：${prompt.workflowNotes.baseModel || '—'}\n`
  md += `- IPAdapter：${prompt.workflowNotes.ipadapter || '—'}\n`
  md += `- ControlNet：${prompt.workflowNotes.controlNet || '—'}\n`
  md += `- LoRA：${prompt.workflowNotes.lora || '—'}\n`
  md += `- 采样器：${prompt.workflowNotes.sampler || '—'}\n`
  md += `- CFG：${prompt.workflowNotes.cfg || '—'}\n`
  md += `- 分辨率：${prompt.workflowNotes.resolution || '—'}\n\n`

  md += `## 后期清单\n`
  prompt.postCompositing.forEach(item => {
    md += `- [${item.done ? 'x' : ' '}] ${item.label}\n`
  })

  return md
}

function exportCover(project: ComicProject): string | null {
  const cover = project.cover
  if (!cover) return null

  let md = frontMatter({
    type: 'cover',
    title: cover.title,
    aspect: cover.aspect,
    art_style: cover.artStyle,
    tone: cover.tone,
  })

  md += `# 封面 — ${cover.title}\n\n`
  md += `> 项目级封面构图提示词（单幅大图），标题排版在后期添加。\n\n`
  md += `## 正向提示词\n\`\`\`\n${cover.positivePrompt}\n\`\`\`\n\n`
  if (cover.negativePrompt) {
    md += `## 负向提示词\n\`\`\`\n${cover.negativePrompt}\n\`\`\`\n\n`
  }
  md += `## 工作流备注\n- 基础模型/引擎：${cover.workflowNotes.baseModel || '—'}\n`
  md += `- IPAdapter/参考图：${cover.workflowNotes.ipadapter || '—'}\n`
  md += `- 采样器：${cover.workflowNotes.sampler || '—'}\n`
  md += `- CFG：${cover.workflowNotes.cfg || '—'}\n`
  md += `- 分辨率：${cover.workflowNotes.resolution || '—'}\n`
  md += `- LoRA：${cover.workflowNotes.lora || '—'}\n\n`
  if (cover.typographyNotes) {
    md += `## 标题排版备注（后期添加）\n${cover.typographyNotes}\n\n`
  }
  md += `## 后期清单\n`
  cover.postCompositing.forEach(item => {
    md += `- [${item.done ? 'x' : ' '}] ${item.label}\n`
  })
  return md
}

function formatChapters(nums: number[]): string {
  return nums.length > 0 ? nums.map(n => `第${n}章`).join(', ') : '—'
}

export async function exportMarkdownZip(project: ComicProject): Promise<void> {
  const zip = new JSZip()
  const safeTitle = project.meta.title.replace(/[<>:"/\\|?*]/g, '_')

  zip.file('storyboard.md', exportStoryboard(project))
  zip.file('assets/characters.md', exportCharacters(project))
  zip.file('assets/environments.md', exportEnvironments(project))
  zip.file('assets/props.md', exportProps(project))

  const coverMd = exportCover(project)
  if (coverMd) {
    zip.file('prompts/00-cover.md', coverMd)
  }

  project.chapters.forEach((chapter, chapIdx) => {
    const chapNum = String(chapIdx + 1).padStart(2, '0')
    const chapSlug = chapter.title.replace(/[<>:"/\\|?*\s]/g, '-').slice(0, 20)
    chapter.pagePrompts.forEach(prompt => {
      const num = String(prompt.pageNumber).padStart(2, '0')
      const slug = prompt.title.replace(/[<>:"/\\|?*\s]/g, '-').slice(0, 30)
      zip.file(`prompts/${chapNum}-${chapSlug}/${num}-page-${slug}.md`, exportPagePrompt(prompt))
    })
  })

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `${safeTitle}-comic-files.zip`)
}
