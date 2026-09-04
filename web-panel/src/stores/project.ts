import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ComicProject, ProjectMeta, ProjectSummary, StoryboardPage, Panel,
  CharacterAsset, EnvironmentAsset, PropAsset, PagePrompt, Chapter, CoverPrompt,
  LayoutType, AspectRatio, ArtStyle, Tone, StoryboardAssetRef,
} from '@/types'
import { api } from '@/utils/api'
import { generateAssetId, createAssetRef, type AssetType } from '@/utils/assetId'

function createDefaultMeta(): ProjectMeta {
  return {
    title: '未命名漫画',
    artStyle: 'manga',
    tone: 'neutral',
    layout: 'standard',
    aspectRatio: '3:4',
    pageCount: 0,
    language: 'zh',
    preset: 'none',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function createChapter(num: number, title?: string): Chapter {
  return {
    id: `chap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    chapterNumber: num,
    title: title || `第 ${num} 章`,
    novelText: '',
    storyboard: [],
    pagePrompts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function createDefaultProject(): ComicProject {
  return {
    meta: createDefaultMeta(),
    chapters: [],
    characters: [],
    environments: [],
    props: [],
  }
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// 旧项目数据迁移：把顶层的 novelText/storyboard/pagePrompts 搬到第一章
function migrateProject(data: any): ComicProject {
  if (data.chapters && Array.isArray(data.chapters)) {
    // 已经是新结构，确保每章都有必需字段
    data.chapters = data.chapters.map((c: any, i: number) => ({
      id: c.id || genId('chap'),
      chapterNumber: c.chapterNumber || i + 1,
      title: c.title || `第 ${i + 1} 章`,
      novelText: c.novelText || '',
      storyboard: c.storyboard || [],
      pagePrompts: c.pagePrompts || [],
      createdAt: c.createdAt || new Date().toISOString(),
      updatedAt: c.updatedAt || new Date().toISOString(),
    }))
    return data as ComicProject
  }
  // 旧结构迁移
  const chapter = createChapter(1, '第 1 章')
  chapter.novelText = data.novelText || ''
  chapter.storyboard = data.storyboard || []
  chapter.pagePrompts = data.pagePrompts || []
  return {
    meta: data.meta || createDefaultMeta(),
    chapters: [chapter],
    characters: data.characters || [],
    environments: data.environments || [],
    props: data.props || [],
  }
}

function toSummary(project: ComicProject, id: string, completedSteps: number): ProjectSummary {
  const totalPages = project.chapters.reduce((sum, c) => sum + c.storyboard.length, 0)
  return {
    id,
    title: project.meta.title,
    createdAt: project.meta.createdAt,
    updatedAt: project.meta.updatedAt,
    artStyle: project.meta.artStyle,
    tone: project.meta.tone,
    pageCount: totalPages,
    characterCount: project.characters.length,
    completedSteps,
  }
}

export const useProjectStore = defineStore('project', () => {
  const project = ref<ComicProject>(createDefaultProject())
  const projectList = ref<ProjectSummary[]>([])
  const currentProjectId = ref<string | null>(null)
  const currentChapterId = ref<string | null>(null)
  const loaded = ref(false)

  // ============ 当前章节 ============
  const currentChapter = computed(() =>
    project.value.chapters.find(c => c.id === currentChapterId.value) || null
  )

  function ensureChapter() {
    if (!currentChapterId.value || !currentChapter.value) {
      if (project.value.chapters.length > 0) {
        currentChapterId.value = project.value.chapters[0].id
      }
    }
    return currentChapter.value
  }

  // ============ 持久化（HTTP API -> SQLite） ============
  async function save() {
    if (!currentProjectId.value) {
      console.warn('save() skipped: currentProjectId is null')
      return
    }
    try {
      project.value.meta.updatedAt = new Date().toISOString()
      await api.updateProject(currentProjectId.value, {
        title: project.value.meta.title,
        updatedAt: project.value.meta.updatedAt,
        data: project.value,
      })
      refreshSummary()
      // 同步更新项目列表到后端（项目列表由后端统一管理，这里只更新本地）
    } catch (e) {
      console.error('Failed to save project:', e)
    }
  }

  function refreshSummary() {
    if (!currentProjectId.value) return
    const idx = projectList.value.findIndex(p => p.id === currentProjectId.value)
    if (idx !== -1) {
      projectList.value[idx] = toSummary(project.value, currentProjectId.value, completedSteps.value)
    }
  }

  async function load() {
    try {
      // 从后端 API 加载项目列表
      const list = await api.getProjects()
      if (list && Array.isArray(list)) {
        projectList.value = list.map(p => ({
          id: p.id,
          title: p.title,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          artStyle: p.artStyle || 'manga',
          tone: p.tone || 'neutral',
          pageCount: p.pageCount || 0,
          characterCount: p.characterCount || 0,
          completedSteps: 0,
        }))
      }

      // 加载当前项目 ID
      const current = await api.getCurrentProjectId()
      if (current.id) {
        const projectData = await api.getProject(current.id)
        if (projectData) {
          try {
            project.value = migrateProject(projectData.data)
            currentProjectId.value = current.id
            if (project.value.chapters.length > 0) {
              currentChapterId.value = project.value.chapters[0].id
            }
          } catch {
            project.value = createDefaultProject()
            currentProjectId.value = null
          }
        }
      }
    } catch (e) {
      console.error('Failed to load project data:', e)
    } finally {
      loaded.value = true
    }
  }

  // ============ 项目管理 ============
  async function createProject(title?: string): Promise<string> {
    const id = genId('proj')
    const newProject = createDefaultProject()
    newProject.meta.title = title || `未命名漫画 ${projectList.value.length + 1}`
    newProject.meta.createdAt = new Date().toISOString()
    newProject.meta.updatedAt = new Date().toISOString()

    project.value = newProject
    currentProjectId.value = id
    currentChapterId.value = null

    // 保存到后端
    await api.createProject({
      id,
      title: newProject.meta.title,
      createdAt: newProject.meta.createdAt,
      updatedAt: newProject.meta.updatedAt,
      data: newProject,
    })
    await api.setCurrentProjectId(id)

    // 更新本地项目列表
    const summary = toSummary(newProject, id, 0)
    projectList.value.unshift(summary)

    return id
  }

  async function switchProject(id: string): Promise<boolean> {
    try {
      const projectData = await api.getProject(id)
      if (!projectData) return false
      project.value = migrateProject(projectData.data)
      currentProjectId.value = id
      currentChapterId.value = project.value.chapters[0]?.id || null
      await api.setCurrentProjectId(id)
      return true
    } catch {
      return false
    }
  }

  async function deleteProject(id: string) {
    await api.deleteProject(id)
    projectList.value = projectList.value.filter(p => p.id !== id)
    if (currentProjectId.value === id) {
      currentProjectId.value = null
      currentChapterId.value = null
      project.value = createDefaultProject()
      await api.setCurrentProjectId(null)
    }
  }

  async function duplicateProject(id: string): Promise<string | null> {
    try {
      const projectData = await api.getProject(id)
      if (!projectData) return null
      const source = migrateProject(projectData.data)
      const newId = genId('proj')
      source.meta.title = `${source.meta.title} 副本`
      source.meta.createdAt = new Date().toISOString()
      source.meta.updatedAt = new Date().toISOString()

      await api.createProject({
        id: newId,
        title: source.meta.title,
        createdAt: source.meta.createdAt,
        updatedAt: source.meta.updatedAt,
        data: source,
      })

      const summary = toSummary(source, newId, 0)
      projectList.value.unshift(summary)
      return newId
    } catch {
      return null
    }
  }

  async function renameProject(id: string, title: string) {
    const idx = projectList.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      projectList.value[idx].title = title
      projectList.value[idx].updatedAt = new Date().toISOString()
    }
    if (currentProjectId.value === id) {
      project.value.meta.title = title
      await save()
    } else {
      try {
        const projectData = await api.getProject(id)
        if (projectData) {
          const p = migrateProject(projectData.data)
          p.meta.title = title
          p.meta.updatedAt = new Date().toISOString()
          await api.updateProject(id, {
            title,
            updatedAt: p.meta.updatedAt,
            data: p,
          })
        }
      } catch { /* ignore */ }
    }
  }

  const hasCurrentProject = computed(() => currentProjectId.value !== null)

  // ============ 章节管理 ============
  function addChapter(title?: string): Chapter {
    const num = project.value.chapters.length + 1
    const chapter = createChapter(num, title)
    project.value.chapters.push(chapter)
    currentChapterId.value = chapter.id
    save()
    return chapter
  }

  async function updateChapter(id: string, patch: Partial<Chapter>) {
    const idx = project.value.chapters.findIndex(c => c.id === id)
    if (idx !== -1) {
      project.value.chapters[idx] = { ...project.value.chapters[idx], ...patch, updatedAt: new Date().toISOString() }
      await save()
    }
  }

  function removeChapter(id: string) {
    project.value.chapters = project.value.chapters.filter(c => c.id !== id)
    project.value.chapters.forEach((c, i) => { c.chapterNumber = i + 1 })
    if (currentChapterId.value === id) {
      currentChapterId.value = project.value.chapters[0]?.id || null
    }
    save()
  }

  function switchChapter(id: string) {
    if (project.value.chapters.find(c => c.id === id)) {
      currentChapterId.value = id
    }
  }

  // ============ 元信息 ============
  function updateMeta(patch: Partial<ProjectMeta>) {
    project.value.meta = { ...project.value.meta, ...patch }
    save()
  }

  // ============ 步骤状态 ============
  const totalStoryboardPages = computed(() =>
    project.value.chapters.reduce((sum, c) => sum + c.storyboard.length, 0)
  )
  const totalPagePrompts = computed(() =>
    project.value.chapters.reduce((sum, c) => sum + c.pagePrompts.length, 0)
  )
  const totalNovelChars = computed(() =>
    project.value.chapters.reduce((sum, c) => sum + c.novelText.replace(/\s/g, '').length, 0)
  )

  const stepStatus = computed(() => [
    {
      step: 1,
      title: '项目配置',
      completed: totalNovelChars.value > 0 && !!project.value.meta.title && project.value.chapters.length > 0,
      description: '项目配置 + 章节管理，输入各章原文',
    },
    {
      step: 2,
      title: '分镜脚本',
      completed: totalStoryboardPages.value > 0,
      description: '按章节逐页逐格编写分镜',
    },
    {
      step: 3,
      title: '资产定义',
      completed: project.value.characters.length > 0 || project.value.environments.length > 0 || project.value.props.length > 0,
      description: '全局角色/环境/道具资产定义',
    },
    {
      step: 4,
      title: '资产生成',
      completed: (project.value.characters.length + project.value.environments.length + project.value.props.length) > 0
        && [...project.value.characters, ...project.value.environments, ...project.value.props].every(a => a.generated),
      description: '在 ComfyUI 中生成全局资产图片',
    },
    {
      step: 5,
      title: '页面提示词',
      completed: totalPagePrompts.value > 0,
      description: '按章节生成页面构图提示词',
    },
    {
      step: 6,
      title: '页面生成',
      completed: totalPagePrompts.value > 0 && project.value.chapters.every(c => c.pagePrompts.every(p => p.generated)),
      description: '在 ComfyUI 中生成页面，后期处理',
    },
  ])

  const completedSteps = computed(() => stepStatus.value.filter(s => s.completed).length)

  // ============ 分镜操作（基于当前章节） ============
  function addStoryboardPage(): StoryboardPage {
    const chapter = ensureChapter()
    if (!chapter) return {} as StoryboardPage
    const page: StoryboardPage = {
      id: genId('page'),
      pageNumber: chapter.storyboard.length + 1,
      slug: `page-${chapter.storyboard.length + 1}`,
      title: `第 ${chapter.storyboard.length + 1} 页`,
      layout: project.value.meta.layout,
      narrativeLayer: 'main',
      coreMessage: '',
      panels: [],
      pageHook: '',
      visualPrompt: '',
    }
    chapter.storyboard.push(page)
    project.value.meta.pageCount = totalStoryboardPages.value
    save()
    return page
  }

  function updateStoryboardPage(id: string, patch: Partial<StoryboardPage>) {
    const chapter = ensureChapter()
    if (!chapter) return
    const idx = chapter.storyboard.findIndex(p => p.id === id)
    if (idx !== -1) {
      chapter.storyboard[idx] = { ...chapter.storyboard[idx], ...patch }
      save()
    }
  }

  function removeStoryboardPage(id: string) {
    const chapter = ensureChapter()
    if (!chapter) return
    chapter.storyboard = chapter.storyboard.filter(p => p.id !== id)
    chapter.storyboard.forEach((p, i) => { p.pageNumber = i + 1 })
    project.value.meta.pageCount = totalStoryboardPages.value
    save()
  }

  /** 清空当前章节所有分镜 */
  function clearStoryboard() {
    const chapter = ensureChapter()
    if (!chapter) return
    chapter.storyboard = []
    project.value.meta.pageCount = totalStoryboardPages.value
    save()
  }

  function addPanel(pageId: string): Panel {
    const chapter = ensureChapter()
    if (!chapter) return {} as Panel
    const page = chapter.storyboard.find(p => p.id === pageId)
    if (!page) return {} as Panel
    const panel: Panel = {
      id: genId('panel'),
      panelNumber: page.panels.length + 1,
      size: '1/3 page',
      position: '',
      scene: '',
      camera: 'eye-level',
      characters: [],
      environment: { assetId: '', name: '', description: '' },
      props: [],
      lighting: '',
      colorTone: '',
      action: '',
      textElements: [],
    }
    page.panels.push(panel)
    save()
    return panel
  }

  function updatePanel(pageId: string, panelId: string, patch: Partial<Panel>) {
    const chapter = ensureChapter()
    if (!chapter) return
    const page = chapter.storyboard.find(p => p.id === pageId)
    if (!page) return
    const idx = page.panels.findIndex(p => p.id === panelId)
    if (idx !== -1) {
      page.panels[idx] = { ...page.panels[idx], ...patch }
      save()
    }
  }

  function removePanel(pageId: string, panelId: string) {
    const chapter = ensureChapter()
    if (!chapter) return
    const page = chapter.storyboard.find(p => p.id === pageId)
    if (!page) return
    page.panels = page.panels.filter(p => p.id !== panelId)
    page.panels.forEach((p, i) => { p.panelNumber = i + 1 })
    save()
  }

  // ============ 角色操作 ============
  function addCharacter(): CharacterAsset {
    const num = project.value.characters.length + 1
    const char: CharacterAsset = {
      id: `CHAR-${String(num).padStart(2, '0')}`,
      name: `角色 ${num}`,
      role: '', age: '',
      appearance: { faceShape: '', hair: '', eyes: '', build: '', distinguishingFeatures: '' },
      costume: { defaultOutfit: '', colorPalette: '', accessories: '' },
      expressionRange: { neutral: '', happy: '', thinking: '', determined: '', custom: '' },
      visualReferenceNotes: '', referenceSheetPrompt: '', standingPosePrompt: '',
      firstAppearance: '', recurringChapters: [], recurringPages: [], generated: false, imagePath: '',
    }
    project.value.characters.push(char)
    save()
    return char
  }

  function updateCharacter(id: string, patch: Partial<CharacterAsset>) {
    const idx = project.value.characters.findIndex(c => c.id === id)
    if (idx !== -1) { project.value.characters[idx] = { ...project.value.characters[idx], ...patch }; save() }
  }

  function removeCharacter(id: string) {
    project.value.characters = project.value.characters.filter(c => c.id !== id)
    save()
  }

  // ============ 环境操作 ============
  function addEnvironment(): EnvironmentAsset {
    const num = project.value.environments.length + 1
    const env: EnvironmentAsset = {
      id: `ENV-${String(num).padStart(2, '0')}`,
      name: `场景 ${num}`, type: 'interior',
      description: { location: '', architecture: '', keyProps: '', atmosphere: '', cameraNotes: '' },
      colorPalette: { dominant: '', secondary: '', accent: '', lighting: '' },
      comfyPrompt: '', negativePrompt: '',
      generationParams: { aspectRatio: '16:9', background: '无角色', recommendedNodes: '', notes: '' },
      firstAppearance: '', recurringChapters: [], recurringPages: [], generated: false, imagePath: '',
    }
    project.value.environments.push(env)
    save()
    return env
  }

  function updateEnvironment(id: string, patch: Partial<EnvironmentAsset>) {
    const idx = project.value.environments.findIndex(e => e.id === id)
    if (idx !== -1) { project.value.environments[idx] = { ...project.value.environments[idx], ...patch }; save() }
  }

  function removeEnvironment(id: string) {
    project.value.environments = project.value.environments.filter(e => e.id !== id)
    save()
  }

  // ============ 道具操作 ============
  function addProp(): PropAsset {
    const num = project.value.props.length + 1
    const prop: PropAsset = {
      id: `PROP-${String(num).padStart(2, '0')}`,
      name: `道具 ${num}`, type: '',
      description: { form: '', details: '', function: '', specialTraits: '', scaleReference: '' },
      colorPalette: { dominant: '', secondary: '', accent: '', lighting: '' },
      comfyPrompt: '', negativePrompt: '',
      generationParams: { aspectRatio: '1:1', background: '白色背景', recommendedNodes: '', notes: '' },
      ownerWielder: '', firstAppearance: '', recurringChapters: [], recurringPages: [], generated: false, imagePath: '',
      needsMultiAngle: false,
    }
    project.value.props.push(prop)
    save()
    return prop
  }

  function updateProp(id: string, patch: Partial<PropAsset>) {
    const idx = project.value.props.findIndex(p => p.id === id)
    if (idx !== -1) { project.value.props[idx] = { ...project.value.props[idx], ...patch }; save() }
  }

  function removeProp(id: string) {
    project.value.props = project.value.props.filter(p => p.id !== id)
    save()
  }

  /** 清空所有全局资产（角色/环境/道具） */
  function clearAssets() {
    project.value.characters = []
    project.value.environments = []
    project.value.props = []
    save()
  }

  // ============ 页面提示词操作（基于当前章节） ============
  function addPagePrompt(): PagePrompt {
    const chapter = ensureChapter()
    if (!chapter) return {} as PagePrompt
    const num = chapter.pagePrompts.length + 1
    const prompt: PagePrompt = {
      id: genId('prompt'), pageNumber: num, title: `第 ${num} 页`,
      layout: project.value.meta.layout, aspect: project.value.meta.aspectRatio,
      artStyle: project.value.meta.artStyle, tone: project.value.meta.tone, panelCount: 0,
      assetReferences: { characters: [], environments: [], props: [] },
      panelLayout: { layoutType: '', gutter: 'white, 10px', border: 'clean black 2px', description: '' },
      panels: [], positivePrompt: '', negativePrompt: '',
      workflowNotes: {
        baseModel: '', ipadapter: '角色 0.7-0.9, 环境 0.6-0.8', controlNet: '', lora: '',
        sampler: 'DPM++ 2M Karras, 25 steps', cfg: '6.5', resolution: '', assetStrategy: '',
      },
      postCompositing: [
        { label: '对话气泡（后期添加）', done: false },
        { label: '音效文字（后期添加）', done: false },
        { label: '面板边框/装订线', done: false },
        { label: '色彩校正/色调调整', done: false },
      ],
      generated: false,
    }
    chapter.pagePrompts.push(prompt)
    save()
    return prompt
  }

  function updatePagePrompt(id: string, patch: Partial<PagePrompt>) {
    const chapter = ensureChapter()
    if (!chapter) return
    const idx = chapter.pagePrompts.findIndex(p => p.id === id)
    if (idx !== -1) { chapter.pagePrompts[idx] = { ...chapter.pagePrompts[idx], ...patch }; save() }
  }

  function removePagePrompt(id: string) {
    const chapter = ensureChapter()
    if (!chapter) return
    chapter.pagePrompts = chapter.pagePrompts.filter(p => p.id !== id)
    chapter.pagePrompts.forEach((p, i) => { p.pageNumber = i + 1 })
    save()
  }

  /** 清空当前章节所有页面提示词 */
  function clearPagePrompts() {
    const chapter = ensureChapter()
    if (!chapter) return
    chapter.pagePrompts = []
    save()
  }

  // ============ 封面提示词（项目级） ============
  function addCover(): CoverPrompt {
    const cover: CoverPrompt = {
      title: `${project.value.meta.title} - 封面`,
      aspect: project.value.meta.aspectRatio,
      artStyle: project.value.meta.artStyle,
      tone: project.value.meta.tone,
      positivePrompt: '',
      negativePrompt: '',
      workflowNotes: {
        baseModel: '', ipadapter: '角色 0.7-0.9', controlNet: '', lora: '',
        sampler: 'DPM++ 2M Karras, 25 steps', cfg: '6.5', resolution: '', assetStrategy: '',
      },
      typographyNotes: '',
      postCompositing: [
        { label: '标题排版（后期添加）', done: false },
        { label: '作者/系列名（后期添加）', done: false },
      ],
      generated: false,
    }
    project.value.cover = cover
    save()
    return cover
  }

  function updateCover(patch: Partial<CoverPrompt>) {
    if (!project.value.cover) return
    project.value.cover = { ...project.value.cover, ...patch }
    save()
  }

  function removeCover() {
    project.value.cover = null
    save()
  }

  function toggleCoverGenerated() {
    if (!project.value.cover) return
    project.value.cover.generated = !project.value.cover.generated
    save()
  }

  // ============ 生成状态 ============
  function toggleCharacterGenerated(id: string) {
    const char = project.value.characters.find(c => c.id === id)
    if (char) { char.generated = !char.generated; save() }
  }
  function toggleEnvironmentGenerated(id: string) {
    const env = project.value.environments.find(e => e.id === id)
    if (env) { env.generated = !env.generated; save() }
  }
  function togglePropGenerated(id: string) {
    const prop = project.value.props.find(p => p.id === id)
    if (prop) { prop.generated = !prop.generated; save() }
  }
  function togglePagePromptGenerated(id: string) {
    const chapter = ensureChapter()
    if (!chapter) return
    const prompt = chapter.pagePrompts.find(p => p.id === id)
    if (prompt) { prompt.generated = !prompt.generated; save() }
  }

  // ============ JSON 导入导出 ============
  function exportJSON(): string {
    return JSON.stringify(project.value, null, 2)
  }

  function importJSON(json: string): boolean {
    try {
      const data = migrateProject(JSON.parse(json))
      if (!data.meta || !Array.isArray(data.chapters)) return false
      project.value = data
      currentChapterId.value = data.chapters[0]?.id || null
      save()
      return true
    } catch { return false }
  }

  async function importJSONAsNewProject(json: string, title?: string): Promise<string | null> {
    try {
      const data = migrateProject(JSON.parse(json))
      if (!data.meta || !Array.isArray(data.chapters)) return null
      const id = await createProject(title || data.meta.title || '导入的项目')
      project.value = data
      project.value.meta.title = title || data.meta.title || '导入的项目'
      currentChapterId.value = data.chapters[0]?.id || null
      await save()
      return id
    } catch { return null }
  }

  // === 工具函数 ===
  function normalizeTextType(type: unknown): 'dialogue' | 'narration' | 'thought' | 'caption' {
    const t = String(type || '').toLowerCase().trim()
    const map: Record<string, 'dialogue' | 'narration' | 'thought' | 'caption'> = {
      'dialogue': 'dialogue',
      'dialog': 'dialogue',
      'speech': 'dialogue',
      'narration': 'narration',
      'narrator': 'narration',
      'narrative': 'narration',
      'thought': 'thought',
      'thinking': 'thought',
      'inner': 'thought',
      'caption': 'caption',
      'description': 'caption',
      'note': 'caption',
      'sfx': 'caption',
      'sound': 'caption',
    }
    return map[t] || 'dialogue'
  }

  // === 按步骤导入 ===

  /** 导入分镜到指定章节（替换该章现有分镜） */
  function importStoryboard(data: unknown, chapterId?: string): number {
    const targetId = chapterId || currentChapterId.value
    const chapter = project.value.chapters.find(c => c.id === targetId)
    if (!chapter) return 0
    const projectId = project.value.meta.title || 'default'
    const raw = (data as { storyboard?: unknown[] })?.storyboard || (Array.isArray(data) ? data : [])
    if (!Array.isArray(raw)) return 0

    // 辅助函数：将输入转换为 StoryboardAssetRef（自动生成自定义ID）
    const toAssetRef = (input: any, type: AssetType, defaultName: string): StoryboardAssetRef => {
      if (typeof input === 'string') {
        return createAssetRef(projectId, 'global', type, input || defaultName, '')
      }
      if (input && typeof input === 'object') {
        const name = input.name || defaultName
        const assetId = input.assetId || input.id || generateAssetId(projectId, 'global', type, name)
        return {
          assetId,
          name,
          description: input.description || input.pose || input.action || input.role || '',
        }
      }
      return createAssetRef(projectId, 'global', type, defaultName, '')
    }

    const pages: StoryboardPage[] = raw.map((p: any, i) => ({
      id: genId('page'),
      pageNumber: p.pageNumber || i + 1,
      title: p.title || `第 ${i + 1} 页`,
      slug: p.slug || `page-${i + 1}`,
      layout: p.layout || 'standard',
      narrativeLayer: p.narrativeLayer || 'main',
      coreMessage: p.coreMessage || '',
      pageHook: p.pageHook || '',
      visualPrompt: p.visualPrompt || '',
      panels: Array.isArray(p.panels) ? p.panels.map((pn: any, j: number) => ({
        id: genId('panel'),
        panelNumber: pn.panelNumber || j + 1,
        size: pn.size || '1/3 page',
        position: pn.position || '',
        scene: pn.scene || '',
        camera: pn.camera || 'eye level',
        environment: toAssetRef(pn.environment, 'environment', `场景 ${j + 1}`),
        lighting: pn.lighting || '',
        colorTone: pn.colorTone || '',
        action: pn.action || '',
        characters: Array.isArray(pn.characters) ? pn.characters.map((c: any, k: number) =>
          toAssetRef(c, 'character', `角色 ${k + 1}`)
        ) : [],
        props: Array.isArray(pn.props) ? pn.props.map((pr: any, k: number) =>
          toAssetRef(pr, 'prop', `道具 ${k + 1}`)
        ) : [],
        textElements: Array.isArray(pn.textElements) ? pn.textElements.map((t: any, k: number) => ({
          id: genId('text'),
          type: normalizeTextType(t.type),
          content: t.content || '',
          speaker: t.speaker || '',
          position: t.position || '',
        })) : [],
      })) : [],
    }))
    chapter.storyboard = pages
    chapter.updatedAt = new Date().toISOString()
    save()
    return pages.length
  }

  /** 导入全局资产（替换现有资产） */
  function importAssets(data: unknown): { characters: number; environments: number; props: number } {
    const raw = data as { characters?: unknown[]; environments?: unknown[]; props?: unknown[] }
    const projectId = project.value.meta.title || 'default'

    const characters: CharacterAsset[] = (raw.characters || []).map((c: any, i: number) => ({
      id: c.id || generateAssetId(projectId, 'global', 'character', c.name || `角色 ${i + 1}`),
      name: c.name || `角色 ${i + 1}`,
      role: c.role || '',
      age: c.age || '',
      appearance: {
        faceShape: c.appearance?.faceShape || c.faceShape || '',
        hair: c.appearance?.hair || c.hair || '',
        eyes: c.appearance?.eyes || c.eyes || '',
        build: c.appearance?.build || c.build || '',
        distinguishingFeatures: c.appearance?.distinguishingFeatures || c.distinguishingFeatures || '',
      },
      costume: {
        defaultOutfit: c.costume?.defaultOutfit || c.costume || c.defaultOutfit || '',
        colorPalette: c.costume?.colorPalette || c.costumeColor || '',
        accessories: c.costume?.accessories || c.accessories || '',
      },
      expressionRange: {
        neutral: c.expressionRange?.neutral || '',
        happy: c.expressionRange?.happy || '',
        thinking: c.expressionRange?.thinking || '',
        determined: c.expressionRange?.determined || '',
        custom: c.expressionRange?.custom || '',
      },
      ageVariants: Array.isArray(c.ageVariants) ? c.ageVariants : undefined,
      visualReferenceNotes: c.visualReferenceNotes || '',
      referenceSheetPrompt: c.referenceSheetPrompt || c.comfyPrompt || '',
      standingPosePrompt: c.standingPosePrompt || '',
      firstAppearance: c.firstAppearance || '',
      recurringChapters: Array.isArray(c.recurringChapters) ? c.recurringChapters : [],
      recurringPages: Array.isArray(c.recurringPages) ? c.recurringPages : [],
      generated: false,
      imagePath: '',
    }))

    const environments: EnvironmentAsset[] = (raw.environments || []).map((e: any, i: number) => ({
      id: e.id || generateAssetId(projectId, 'global', 'environment', e.name || `环境 ${i + 1}`),
      name: e.name || `环境 ${i + 1}`,
      type: (e.type as EnvironmentAsset['type']) || 'interior',
      description: {
        location: e.description?.location || e.location || '',
        architecture: e.description?.architecture || e.architecture || '',
        keyProps: e.description?.keyProps || e.keyProps || '',
        atmosphere: e.description?.atmosphere || e.atmosphere || '',
        cameraNotes: e.description?.cameraNotes || '',
      },
      colorPalette: {
        dominant: e.colorPalette?.dominant || e.dominantColor || '',
        secondary: e.colorPalette?.secondary || '',
        accent: e.colorPalette?.accent || '',
        lighting: e.colorPalette?.lighting || e.lighting || '',
      },
      comfyPrompt: e.comfyPrompt || '',
      negativePrompt: e.negativePrompt || '',
      generationParams: {
        aspectRatio: e.generationParams?.aspectRatio || '16:9',
        background: e.generationParams?.background || '无角色',
        recommendedNodes: e.generationParams?.recommendedNodes || '',
        notes: e.generationParams?.notes || '',
      },
      firstAppearance: e.firstAppearance || '',
      recurringChapters: Array.isArray(e.recurringChapters) ? e.recurringChapters : [],
      recurringPages: Array.isArray(e.recurringPages) ? e.recurringPages : [],
      generated: false,
      imagePath: '',
    }))

    const props: PropAsset[] = (raw.props || []).map((p: any, i: number) => ({
      id: p.id || generateAssetId(projectId, 'global', 'prop', p.name || `道具 ${i + 1}`),
      name: p.name || `道具 ${i + 1}`,
      type: p.type || '',
      description: {
        form: p.description?.form || p.form || '',
        details: p.description?.details || p.details || '',
        function: p.description?.function || p.function || '',
        specialTraits: p.description?.specialTraits || '',
        scaleReference: p.description?.scaleReference || '',
      },
      colorPalette: {
        dominant: p.colorPalette?.dominant || p.dominantColor || '',
        secondary: p.colorPalette?.secondary || '',
        accent: p.colorPalette?.accent || '',
        lighting: p.colorPalette?.lighting || '',
      },
      comfyPrompt: p.comfyPrompt || '',
      negativePrompt: p.negativePrompt || '',
      generationParams: {
        aspectRatio: p.generationParams?.aspectRatio || '1:1',
        background: p.generationParams?.background || '白色背景',
        recommendedNodes: p.generationParams?.recommendedNodes || '',
        notes: p.generationParams?.notes || '',
      },
      ownerWielder: p.ownerWielder || p.owner || '',
      firstAppearance: p.firstAppearance || '',
      recurringChapters: Array.isArray(p.recurringChapters) ? p.recurringChapters : [],
      recurringPages: Array.isArray(p.recurringPages) ? p.recurringPages : [],
      generated: false,
      imagePath: '',
      needsMultiAngle: p.needsMultiAngle || false,
      referenceSheetPrompt: p.referenceSheetPrompt || undefined,
    }))

    project.value.characters = characters
    project.value.environments = environments
    project.value.props = props
    save()
    return { characters: characters.length, environments: environments.length, props: props.length }
  }

  /** 导入页面提示词到指定章节（替换该章现有提示词） */
  function importPagePrompts(data: unknown, chapterId?: string): number {
    const targetId = chapterId || currentChapterId.value
    const chapter = project.value.chapters.find(c => c.id === targetId)
    if (!chapter) return 0
    const raw = (data as { pagePrompts?: unknown[] })?.pagePrompts || (Array.isArray(data) ? data : [])
    if (!Array.isArray(raw)) return 0
    const prompts: PagePrompt[] = raw.map((p: any, i: number) => ({
      id: genId('prompt'),
      pageNumber: p.pageNumber || i + 1,
      title: p.title || `第 ${i + 1} 页`,
      layout: (p.layout as LayoutType) || project.value.meta.layout,
      aspect: (p.aspect as AspectRatio) || project.value.meta.aspectRatio,
      artStyle: (p.artStyle as ArtStyle) || project.value.meta.artStyle,
      tone: (p.tone as Tone) || project.value.meta.tone,
      panelCount: p.panelCount || (Array.isArray(p.panels) ? p.panels.length : 0),
      assetReferences: {
        characters: Array.isArray(p.assetReferences?.characters) ? p.assetReferences.characters : (Array.isArray(p.assetRefs) ? p.assetRefs : []),
        environments: Array.isArray(p.assetReferences?.environments) ? p.assetReferences.environments : [],
        props: Array.isArray(p.assetReferences?.props) ? p.assetReferences.props : [],
      },
      panelLayout: {
        layoutType: p.panelLayout?.layoutType || p.layout || '',
        gutter: p.panelLayout?.gutter || 'white, 10px',
        border: p.panelLayout?.border || 'clean black 2px',
        description: p.panelLayout?.description || '',
      },
      panels: Array.isArray(p.panels) ? p.panels : [],
      positivePrompt: p.positivePrompt || '',
      negativePrompt: p.negativePrompt || '',
      workflowNotes: {
        baseModel: p.workflowNotes?.baseModel || p.workflowNotes?.model || '',
        ipadapter: p.workflowNotes?.ipadapter || p.workflowNotes?.ipAdapter || '角色 0.7-0.9, 环境 0.6-0.8',
        controlNet: p.workflowNotes?.controlNet || p.workflowNotes?.controlnet || '',
        lora: p.workflowNotes?.lora || '',
        sampler: p.workflowNotes?.sampler || 'DPM++ 2M Karras, 25 steps',
        cfg: p.workflowNotes?.cfg || '6.5',
        resolution: p.workflowNotes?.resolution || '',
        assetStrategy: p.workflowNotes?.assetStrategy || '',
      },
      postCompositing: Array.isArray(p.postCompositing) ? p.postCompositing : [
        { label: '对话气泡（后期添加）', done: false },
        { label: '音效文字（后期添加）', done: false },
        { label: '面板边框/装订线', done: false },
        { label: '色彩校正/色调调整', done: false },
      ],
      generated: false,
    }))
    chapter.pagePrompts = prompts
    chapter.updatedAt = new Date().toISOString()
    save()
    return prompts.length
  }

  // ============ 导出/导入（用于备份和迁移） ============

  // 导出当前项目为 JSON 文件下载
  function exportProject(): void {
    if (!currentProjectId.value) return
    try {
      const data = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        projectId: currentProjectId.value,
        data: JSON.parse(JSON.stringify(project.value)),
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeTitle = project.value.meta.title.replace(/[\\/:*?"<>|]/g, '_')
      a.download = `${safeTitle}_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed:', e)
    }
  }

  // 从 JSON 文件内容导入项目
  async function importProject(jsonString: string): Promise<string | null> {
    try {
      const parsed = JSON.parse(jsonString)
      // 支持带版本号的导出格式，也支持直接的项目数据
      const projectData = parsed.data || parsed
      const migrated = migrateProject(projectData)
      const newId = genId('proj')
      migrated.meta.createdAt = new Date().toISOString()
      migrated.meta.updatedAt = new Date().toISOString()
      migrated.meta.title = `${migrated.meta.title} (导入)`

      project.value = migrated
      currentProjectId.value = newId
      currentChapterId.value = migrated.chapters[0]?.id || null

      // 保存到后端
      await api.createProject({
        id: newId,
        title: migrated.meta.title,
        createdAt: migrated.meta.createdAt,
        updatedAt: migrated.meta.updatedAt,
        data: migrated,
      })
      await api.setCurrentProjectId(newId)

      const summary = toSummary(migrated, newId, 0)
      projectList.value.unshift(summary)

      return newId
    } catch (e) {
      console.error('Import failed:', e)
      return null
    }
  }

  return {
    project, projectList, currentProjectId, currentChapterId, currentChapter,
    loaded, hasCurrentProject, stepStatus, completedSteps,
    totalStoryboardPages, totalPagePrompts, totalNovelChars,
    load, save, exportProject, importProject,
    createProject, switchProject, deleteProject, duplicateProject, renameProject,
    addChapter, updateChapter, removeChapter, switchChapter,
    updateMeta,
    addStoryboardPage, updateStoryboardPage, removeStoryboardPage,
    addPanel, updatePanel, removePanel,
    addCharacter, updateCharacter, removeCharacter,
    addEnvironment, updateEnvironment, removeEnvironment,
    addProp, updateProp, removeProp,
    addPagePrompt, updatePagePrompt, removePagePrompt,
    addCover, updateCover, removeCover, toggleCoverGenerated,
    toggleCharacterGenerated, toggleEnvironmentGenerated, togglePropGenerated, togglePagePromptGenerated,
    exportJSON, importJSON, importJSONAsNewProject,
    importStoryboard, importAssets, importPagePrompts,
  }
})
