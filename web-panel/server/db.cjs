/**
 * SQLite 数据库封装（规范化拆表版）
 * 数据库文件保存在 data/app.db，可直接复制迁移。
 *
 * 表结构（把原先 projects.data 的 JSON 大字段拆成多张表）：
 *   projects         项目元信息（标题 + 全局风格配置）
 *   chapters         章节（原文、编号、标题）
 *   storyboard_pages 分镜页（每页一行，panels 以 JSON 存储）
 *   characters       全局角色资产
 *   environments     全局环境资产
 *   props            全局道具资产
 *   page_prompts     页面构图提示词（每页一行）
 *   meta             键值元数据（当前项目 ID 等）
 *
 * 对外 API 契约与拆表前保持一致（getAll / getById / create / update / delete / metaOps），
 * 由本层负责把规范化的表数据组装回完整项目对象，或把项目对象拆解写回各表。
 */
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// 确保 data 目录存在
const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'app.db')
const db = new Database(dbPath)

// 启用 WAL 模式，提高并发性能
db.pragma('journal_mode = WAL')
// 启用外键约束，保证级联删除生效
db.pragma('foreign_keys = ON')

// 初始化表
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    art_style TEXT NOT NULL DEFAULT 'manga',
    tone TEXT NOT NULL DEFAULT 'neutral',
    layout TEXT NOT NULL DEFAULT 'standard',
    aspect_ratio TEXT NOT NULL DEFAULT '3:4',
    language TEXT NOT NULL DEFAULT 'zh',
    preset TEXT NOT NULL DEFAULT 'none',
    page_count INTEGER NOT NULL DEFAULT 0,
    cover TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    novel_text TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_chapters_project ON chapters(project_id);

  CREATE TABLE IF NOT EXISTS storyboard_pages (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    slug TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    layout TEXT NOT NULL DEFAULT 'standard',
    narrative_layer TEXT NOT NULL DEFAULT 'main',
    core_message TEXT NOT NULL DEFAULT '',
    page_hook TEXT NOT NULL DEFAULT '',
    visual_prompt TEXT NOT NULL DEFAULT '',
    panels TEXT NOT NULL DEFAULT '[]'
  );
  CREATE INDEX IF NOT EXISTS idx_storyboard_chapter ON storyboard_pages(chapter_id);

  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT '',
    age TEXT NOT NULL DEFAULT '',
    appearance TEXT NOT NULL DEFAULT '{}',
    costume TEXT NOT NULL DEFAULT '{}',
    expression_range TEXT NOT NULL DEFAULT '{}',
    age_variants TEXT NOT NULL DEFAULT '[]',
    visual_reference_notes TEXT NOT NULL DEFAULT '',
    reference_sheet_prompt TEXT NOT NULL DEFAULT '',
    standing_pose_prompt TEXT NOT NULL DEFAULT '',
    first_appearance TEXT NOT NULL DEFAULT '',
    recurring_chapters TEXT NOT NULL DEFAULT '[]',
    recurring_pages TEXT NOT NULL DEFAULT '[]',
    generated INTEGER NOT NULL DEFAULT 0,
    image_path TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);

  CREATE TABLE IF NOT EXISTS environments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'interior',
    description TEXT NOT NULL DEFAULT '{}',
    color_palette TEXT NOT NULL DEFAULT '{}',
    comfy_prompt TEXT NOT NULL DEFAULT '',
    negative_prompt TEXT NOT NULL DEFAULT '',
    generation_params TEXT NOT NULL DEFAULT '{}',
    first_appearance TEXT NOT NULL DEFAULT '',
    recurring_chapters TEXT NOT NULL DEFAULT '[]',
    recurring_pages TEXT NOT NULL DEFAULT '[]',
    generated INTEGER NOT NULL DEFAULT 0,
    image_path TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_environments_project ON environments(project_id);

  CREATE TABLE IF NOT EXISTS props (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '{}',
    color_palette TEXT NOT NULL DEFAULT '{}',
    comfy_prompt TEXT NOT NULL DEFAULT '',
    negative_prompt TEXT NOT NULL DEFAULT '',
    generation_params TEXT NOT NULL DEFAULT '{}',
    owner_wielder TEXT NOT NULL DEFAULT '',
    first_appearance TEXT NOT NULL DEFAULT '',
    recurring_chapters TEXT NOT NULL DEFAULT '[]',
    recurring_pages TEXT NOT NULL DEFAULT '[]',
    generated INTEGER NOT NULL DEFAULT 0,
    image_path TEXT NOT NULL DEFAULT '',
    needs_multi_angle INTEGER NOT NULL DEFAULT 0,
    reference_sheet_prompt TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_props_project ON props(project_id);

  CREATE TABLE IF NOT EXISTS page_prompts (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    layout TEXT NOT NULL DEFAULT 'standard',
    aspect TEXT NOT NULL DEFAULT '3:4',
    art_style TEXT NOT NULL DEFAULT 'manga',
    tone TEXT NOT NULL DEFAULT 'neutral',
    panel_count INTEGER NOT NULL DEFAULT 0,
    asset_references TEXT NOT NULL DEFAULT '{}',
    panel_layout TEXT NOT NULL DEFAULT '{}',
    panels TEXT NOT NULL DEFAULT '[]',
    positive_prompt TEXT NOT NULL DEFAULT '',
    negative_prompt TEXT NOT NULL DEFAULT '',
    workflow_notes TEXT NOT NULL DEFAULT '{}',
    post_compositing TEXT NOT NULL DEFAULT '[]',
    generated INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_page_prompts_chapter ON page_prompts(chapter_id);

  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

// 兼容旧库：若 projects 表缺少 cover 列则补齐（CREATE TABLE IF NOT EXISTS 不会加列）
{
  const cols = db.prepare('PRAGMA table_info(projects)').all().map(c => c.name)
  if (!cols.includes('cover')) {
    db.exec(`ALTER TABLE projects ADD COLUMN cover TEXT NOT NULL DEFAULT ''`)
  }
}

// 兼容旧库：若三张资产表缺少 recurring_chapters 列则补齐
{
  for (const table of ['characters', 'environments', 'props']) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name)
    if (!cols.includes('recurring_chapters')) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN recurring_chapters TEXT NOT NULL DEFAULT '[]'`)
    }
  }
}

// ---------- JSON 字段安全解析 ----------
function parseJSON(text, fallback) {
  try {
    const v = JSON.parse(text)
    return v === null || v === undefined ? fallback : v
  } catch {
    return fallback
  }
}
function toJSON(value) {
  return JSON.stringify(value === undefined ? null : value)
}

// ============ 写入：把完整项目对象拆解到各表 ============

const stmts = {
  insertProject: db.prepare(`
    INSERT INTO projects (id, title, art_style, tone, layout, aspect_ratio, language, preset, page_count, cover, created_at, updated_at)
    VALUES (@id, @title, @art_style, @tone, @layout, @aspect_ratio, @language, @preset, @page_count, @cover, @created_at, @updated_at)
  `),
  insertChapter: db.prepare(`
    INSERT INTO chapters (id, project_id, chapter_number, title, novel_text, created_at, updated_at)
    VALUES (@id, @project_id, @chapter_number, @title, @novel_text, @created_at, @updated_at)
  `),
  insertStoryboardPage: db.prepare(`
    INSERT INTO storyboard_pages (id, chapter_id, page_number, slug, title, layout, narrative_layer, core_message, page_hook, visual_prompt, panels)
    VALUES (@id, @chapter_id, @page_number, @slug, @title, @layout, @narrative_layer, @core_message, @page_hook, @visual_prompt, @panels)
  `),
  insertCharacter: db.prepare(`
    INSERT INTO characters (id, project_id, name, role, age, appearance, costume, expression_range, age_variants, visual_reference_notes, reference_sheet_prompt, standing_pose_prompt, first_appearance, recurring_chapters, recurring_pages, generated, image_path)
    VALUES (@id, @project_id, @name, @role, @age, @appearance, @costume, @expression_range, @age_variants, @visual_reference_notes, @reference_sheet_prompt, @standing_pose_prompt, @first_appearance, @recurring_chapters, @recurring_pages, @generated, @image_path)
  `),
  insertEnvironment: db.prepare(`
    INSERT INTO environments (id, project_id, name, type, description, color_palette, comfy_prompt, negative_prompt, generation_params, first_appearance, recurring_chapters, recurring_pages, generated, image_path)
    VALUES (@id, @project_id, @name, @type, @description, @color_palette, @comfy_prompt, @negative_prompt, @generation_params, @first_appearance, @recurring_chapters, @recurring_pages, @generated, @image_path)
  `),
  insertProp: db.prepare(`
    INSERT INTO props (id, project_id, name, type, description, color_palette, comfy_prompt, negative_prompt, generation_params, owner_wielder, first_appearance, recurring_chapters, recurring_pages, generated, image_path, needs_multi_angle, reference_sheet_prompt)
    VALUES (@id, @project_id, @name, @type, @description, @color_palette, @comfy_prompt, @negative_prompt, @generation_params, @owner_wielder, @first_appearance, @recurring_chapters, @recurring_pages, @generated, @image_path, @needs_multi_angle, @reference_sheet_prompt)
  `),
  insertPagePrompt: db.prepare(`
    INSERT INTO page_prompts (id, chapter_id, page_number, title, layout, aspect, art_style, tone, panel_count, asset_references, panel_layout, panels, positive_prompt, negative_prompt, workflow_notes, post_compositing, generated)
    VALUES (@id, @chapter_id, @page_number, @title, @layout, @aspect, @art_style, @tone, @panel_count, @asset_references, @panel_layout, @panels, @positive_prompt, @negative_prompt, @workflow_notes, @post_compositing, @generated)
  `),
}

/** 把完整项目对象写入各表（调用方需保证 projects 行尚不存在） */
function writeProjectData(id, createdAt, updatedAt, data) {
  const meta = data.meta || {}
  stmts.insertProject.run({
    id,
    title: meta.title || '',
    art_style: meta.artStyle || 'manga',
    tone: meta.tone || 'neutral',
    layout: meta.layout || 'standard',
    aspect_ratio: meta.aspectRatio || '3:4',
    language: meta.language || 'zh',
    preset: meta.preset || 'none',
    page_count: typeof meta.pageCount === 'number' ? meta.pageCount : 0,
    cover: toJSON(data.cover || null),
    created_at: createdAt,
    updated_at: updatedAt,
  })

  // 章节 + 分镜 + 页面提示词
  for (const chapter of data.chapters || []) {
    stmts.insertChapter.run({
      id: chapter.id,
      project_id: id,
      chapter_number: chapter.chapterNumber || 1,
      title: chapter.title || '',
      novel_text: chapter.novelText || '',
      created_at: chapter.createdAt || createdAt,
      updated_at: chapter.updatedAt || updatedAt,
    })

    for (const page of chapter.storyboard || []) {
      stmts.insertStoryboardPage.run({
        id: page.id,
        chapter_id: chapter.id,
        page_number: page.pageNumber || 0,
        slug: page.slug || '',
        title: page.title || '',
        layout: page.layout || 'standard',
        narrative_layer: page.narrativeLayer || 'main',
        core_message: page.coreMessage || '',
        page_hook: page.pageHook || '',
        visual_prompt: page.visualPrompt || '',
        panels: toJSON(page.panels || []),
      })
    }

    for (const prompt of chapter.pagePrompts || []) {
      stmts.insertPagePrompt.run({
        id: prompt.id,
        chapter_id: chapter.id,
        page_number: prompt.pageNumber || 0,
        title: prompt.title || '',
        layout: prompt.layout || 'standard',
        aspect: prompt.aspect || '3:4',
        art_style: prompt.artStyle || 'manga',
        tone: prompt.tone || 'neutral',
        panel_count: prompt.panelCount || 0,
        asset_references: toJSON(prompt.assetReferences || {}),
        panel_layout: toJSON(prompt.panelLayout || {}),
        panels: toJSON(prompt.panels || []),
        positive_prompt: prompt.positivePrompt || '',
        negative_prompt: prompt.negativePrompt || '',
        workflow_notes: toJSON(prompt.workflowNotes || {}),
        post_compositing: toJSON(prompt.postCompositing || []),
        generated: prompt.generated ? 1 : 0,
      })
    }
  }

  // 全局资产
  for (const c of data.characters || []) {
    stmts.insertCharacter.run({
      id: c.id, project_id: id,
      name: c.name || '', role: c.role || '', age: c.age || '',
      appearance: toJSON(c.appearance || {}),
      costume: toJSON(c.costume || {}),
      expression_range: toJSON(c.expressionRange || {}),
      age_variants: toJSON(c.ageVariants || []),
      visual_reference_notes: c.visualReferenceNotes || '',
      reference_sheet_prompt: c.referenceSheetPrompt || '',
      standing_pose_prompt: c.standingPosePrompt || '',
      first_appearance: c.firstAppearance || '',
      recurring_chapters: toJSON(c.recurringChapters || []),
      recurring_pages: toJSON(c.recurringPages || []),
      generated: c.generated ? 1 : 0,
      image_path: c.imagePath || '',
    })
  }

  for (const e of data.environments || []) {
    stmts.insertEnvironment.run({
      id: e.id, project_id: id,
      name: e.name || '', type: e.type || 'interior',
      description: toJSON(e.description || {}),
      color_palette: toJSON(e.colorPalette || {}),
      comfy_prompt: e.comfyPrompt || '',
      negative_prompt: e.negativePrompt || '',
      generation_params: toJSON(e.generationParams || {}),
      first_appearance: e.firstAppearance || '',
      recurring_chapters: toJSON(e.recurringChapters || []),
      recurring_pages: toJSON(e.recurringPages || []),
      generated: e.generated ? 1 : 0,
      image_path: e.imagePath || '',
    })
  }

  for (const p of data.props || []) {
    stmts.insertProp.run({
      id: p.id, project_id: id,
      name: p.name || '', type: p.type || '',
      description: toJSON(p.description || {}),
      color_palette: toJSON(p.colorPalette || {}),
      comfy_prompt: p.comfyPrompt || '',
      negative_prompt: p.negativePrompt || '',
      generation_params: toJSON(p.generationParams || {}),
      owner_wielder: p.ownerWielder || '',
      first_appearance: p.firstAppearance || '',
      recurring_chapters: toJSON(p.recurringChapters || []),
      recurring_pages: toJSON(p.recurringPages || []),
      generated: p.generated ? 1 : 0,
      image_path: p.imagePath || '',
      needs_multi_angle: p.needsMultiAngle ? 1 : 0,
      reference_sheet_prompt: p.referenceSheetPrompt || '',
    })
  }
}

// ============ 读取：把各表数据组装回完整项目对象 ============

function readProjectData(projectId, projectRow) {
  const chapterRows = db.prepare('SELECT * FROM chapters WHERE project_id = ? ORDER BY chapter_number, rowid').all(projectId)
  const storyboardStmt = db.prepare('SELECT * FROM storyboard_pages WHERE chapter_id = ? ORDER BY page_number, rowid')
  const pagePromptStmt = db.prepare('SELECT * FROM page_prompts WHERE chapter_id = ? ORDER BY page_number, rowid')

  const chapters = chapterRows.map((ch) => ({
    id: ch.id,
    chapterNumber: ch.chapter_number,
    title: ch.title,
    novelText: ch.novel_text,
    storyboard: storyboardStmt.all(ch.id).map((p) => ({
      id: p.id,
      pageNumber: p.page_number,
      slug: p.slug,
      title: p.title,
      layout: p.layout,
      narrativeLayer: p.narrative_layer,
      coreMessage: p.core_message,
      panels: parseJSON(p.panels, []),
      pageHook: p.page_hook,
      visualPrompt: p.visual_prompt,
    })),
    pagePrompts: pagePromptStmt.all(ch.id).map((p) => ({
      id: p.id,
      pageNumber: p.page_number,
      title: p.title,
      layout: p.layout,
      aspect: p.aspect,
      artStyle: p.art_style,
      tone: p.tone,
      panelCount: p.panel_count,
      assetReferences: parseJSON(p.asset_references, {}),
      panelLayout: parseJSON(p.panel_layout, {}),
      panels: parseJSON(p.panels, []),
      positivePrompt: p.positive_prompt,
      negativePrompt: p.negative_prompt,
      workflowNotes: parseJSON(p.workflow_notes, {}),
      postCompositing: parseJSON(p.post_compositing, []),
      generated: !!p.generated,
    })),
    createdAt: ch.created_at,
    updatedAt: ch.updated_at,
  }))

  const characters = db.prepare('SELECT * FROM characters WHERE project_id = ? ORDER BY rowid').all(projectId).map((c) => ({
    id: c.id,
    name: c.name, role: c.role, age: c.age,
    appearance: parseJSON(c.appearance, {}),
    costume: parseJSON(c.costume, {}),
    expressionRange: parseJSON(c.expression_range, {}),
    ageVariants: parseJSON(c.age_variants, []),
    visualReferenceNotes: c.visual_reference_notes,
    referenceSheetPrompt: c.reference_sheet_prompt,
    standingPosePrompt: c.standing_pose_prompt,
    firstAppearance: c.first_appearance,
    recurringChapters: parseJSON(c.recurring_chapters, []),
    recurringPages: parseJSON(c.recurring_pages, []),
    generated: !!c.generated,
    imagePath: c.image_path,
  }))

  const environments = db.prepare('SELECT * FROM environments WHERE project_id = ? ORDER BY rowid').all(projectId).map((e) => ({
    id: e.id,
    name: e.name, type: e.type,
    description: parseJSON(e.description, {}),
    colorPalette: parseJSON(e.color_palette, {}),
    comfyPrompt: e.comfy_prompt,
    negativePrompt: e.negative_prompt,
    generationParams: parseJSON(e.generation_params, {}),
    firstAppearance: e.first_appearance,
    recurringChapters: parseJSON(e.recurring_chapters, []),
    recurringPages: parseJSON(e.recurring_pages, []),
    generated: !!e.generated,
    imagePath: e.image_path,
  }))

  const props = db.prepare('SELECT * FROM props WHERE project_id = ? ORDER BY rowid').all(projectId).map((p) => ({
    id: p.id,
    name: p.name, type: p.type,
    description: parseJSON(p.description, {}),
    colorPalette: parseJSON(p.color_palette, {}),
    comfyPrompt: p.comfy_prompt,
    negativePrompt: p.negative_prompt,
    generationParams: parseJSON(p.generation_params, {}),
    ownerWielder: p.owner_wielder,
    firstAppearance: p.first_appearance,
    recurringChapters: parseJSON(p.recurring_chapters, []),
    recurringPages: parseJSON(p.recurring_pages, []),
    generated: !!p.generated,
    imagePath: p.image_path,
    needsMultiAngle: !!p.needs_multi_angle,
    referenceSheetPrompt: p.reference_sheet_prompt || undefined,
  }))

  return {
    meta: {
      title: projectRow.title,
      artStyle: projectRow.art_style,
      tone: projectRow.tone,
      layout: projectRow.layout,
      aspectRatio: projectRow.aspect_ratio,
      pageCount: projectRow.page_count,
      language: projectRow.language,
      preset: projectRow.preset,
      createdAt: projectRow.created_at,
      updatedAt: projectRow.updated_at,
    },
    chapters,
    characters,
    environments,
    props,
    cover: projectRow.cover ? parseJSON(projectRow.cover, null) : null,
  }
}

// ============ 项目操作（对外契约与拆表前一致） ============

const projectOps = {
  // 获取所有项目（返回元数据 + 常用汇总字段）
  getAll() {
    const rows = db.prepare(`
      SELECT p.id, p.title, p.created_at, p.updated_at, p.art_style, p.tone, p.page_count,
             (SELECT COUNT(*) FROM characters c WHERE c.project_id = p.id) AS character_count
      FROM projects p
      ORDER BY p.updated_at DESC
    `).all()
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      artStyle: r.art_style,
      tone: r.tone,
      pageCount: r.page_count,
      characterCount: r.character_count,
    }))
  },

  // 获取单个项目完整数据
  getById(id) {
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
    if (!row) return null
    return {
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      data: readProjectData(row.id, row),
    }
  },

  // 创建项目
  create(id, title, createdAt, updatedAt, data) {
    const tx = db.transaction(() => {
      // 确保 meta.title 与顶层 title 一致
      const d = data && data.meta ? data : { ...(data || {}), meta: { ...(data?.meta || {}), title } }
      if (d.meta) d.meta.title = title
      writeProjectData(id, createdAt, updatedAt, d)
    })
    tx()
  },

  // 更新项目（整体替换：先级联删除旧数据，再重写）
  update(id, title, updatedAt, data) {
    const tx = db.transaction(() => {
      const existing = db.prepare('SELECT created_at FROM projects WHERE id = ?').get(id)
      const createdAt = existing ? existing.created_at : updatedAt
      db.prepare('DELETE FROM projects WHERE id = ?').run(id)
      const d = data && data.meta ? data : { ...(data || {}), meta: { ...(data?.meta || {}), title } }
      if (d.meta) d.meta.title = title
      writeProjectData(id, createdAt, updatedAt, d)
    })
    tx()
  },

  // 删除项目（外键级联删除所有子表数据）
  delete(id) {
    db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  },
}

// ============ 元数据操作（当前项目 ID 等） ============

const metaOps = {
  get(key) {
    const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key)
    return row ? row.value : null
  },
  set(key, value) {
    db.prepare(`
      INSERT INTO meta (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value)
  },
}

module.exports = { db, projectOps, metaOps, dbPath }
