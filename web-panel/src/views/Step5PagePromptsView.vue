<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import { sharedNegativePrompt, artStyles, tones } from '@/data/styles'
import type { PagePrompt, AssetRefItem, PromptPanel, PostCompositingItem, CoverPrompt, AspectRatio, ArtStyle, Tone } from '@/types'
import StepGuide from '@/components/StepGuide.vue'
import AIActionBar from '@/components/AIActionBar.vue'
import { useMessage, useDialog } from 'naive-ui'

const store = useProjectStore()
const selectedId = ref<string | null>(null)
const showCover = ref(false)

const chapters = computed(() => store.project.chapters)
const currentChapter = computed(() => store.currentChapter)
const pagePrompts = computed(() => currentChapter.value?.pagePrompts || [])

const message = useMessage()
const dialog = useDialog()

function confirmDelete(title: string, content: string, onDelete: () => void, successMsg: string) {
  dialog.warning({
    title,
    content,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      onDelete()
      message.success(successMsg)
    },
  })
}

function handleImportPagePrompts(data: unknown) {
  if (!currentChapter.value) {
    message.error('请先选择一个章节')
    return
  }
  const count = store.importPagePrompts(data, currentChapter.value.id)
  if (count > 0) {
    message.success(`已导入 ${count} 页提示词到「${currentChapter.value.title}」`)
    selectedId.value = null
  } else {
    message.error('导入失败，JSON 格式不正确')
  }
}

const selectedPrompt = computed(() => pagePrompts.value.find(p => p.id === selectedId.value)!)

function switchChapter(id: string) {
  store.switchChapter(id)
  selectedId.value = null
}

function addPrompt() {
  const p = store.addPagePrompt()
  selectedId.value = p.id
}

function selectPrompt(id: string) { selectedId.value = id; showCover.value = false }
function closeDetail() { selectedId.value = null; showCover.value = false }

function update(field: keyof PagePrompt, value: unknown) {
  if (selectedPrompt.value) store.updatePagePrompt(selectedPrompt.value.id, { [field]: value })
}

function updateWorkflow(field: keyof PagePrompt['workflowNotes'], value: string) {
  if (selectedPrompt.value) {
    store.updatePagePrompt(selectedPrompt.value.id, {
      workflowNotes: { ...selectedPrompt.value.workflowNotes, [field]: value },
    })
  }
}

function updatePanelLayout(field: keyof PagePrompt['panelLayout'], value: string) {
  if (selectedPrompt.value) {
    store.updatePagePrompt(selectedPrompt.value.id, {
      panelLayout: { ...selectedPrompt.value.panelLayout, [field]: value },
    })
  }
}

// 资产下拉选项：与 Step 3 定义的全局资产联动；支持手输（tag 模式）
const characterOptions = computed(() =>
  store.project.characters.map(c => ({ label: `${c.id} · ${c.name || '未命名'}`, value: c.id }))
)
const environmentOptions = computed(() =>
  store.project.environments.map(e => ({ label: `${e.id} · ${e.name || '未命名'}`, value: e.id }))
)
const propOptions = computed(() =>
  store.project.props.map(p => ({ label: `${p.id} · ${p.name || '未命名'}`, value: p.id }))
)

// 资产引用操作
function addAssetRef(type: 'characters' | 'environments' | 'props') {
  if (!selectedPrompt.value) return
  const newRef: AssetRefItem = { assetId: '', file: '', role: '', weight: '0.7-0.9', panels: '' }
  const refs = { ...selectedPrompt.value.assetReferences }
  refs[type] = [...refs[type], newRef]
  update('assetReferences', refs)
}

// 选择资产：写入 assetId，并在资产已有图片路径时自动带入文件字段
function selectAssetRef(type: 'characters' | 'environments' | 'props', idx: number, assetId: string) {
  if (!selectedPrompt.value) return
  const source = type === 'characters' ? store.project.characters
    : type === 'environments' ? store.project.environments
    : store.project.props
  const asset = source.find(a => a.id === assetId)
  const patch: Partial<AssetRefItem> = { assetId: assetId || '' }
  if (asset && asset.imagePath) patch.file = asset.imagePath
  updateAssetRef(type, idx, patch)
}

function updateAssetRef(type: 'characters' | 'environments' | 'props', idx: number, patch: Partial<AssetRefItem>) {
  if (!selectedPrompt.value) return
  const refs = { ...selectedPrompt.value.assetReferences }
  refs[type] = refs[type].map((r, i) => i === idx ? { ...r, ...patch } : r)
  update('assetReferences', refs)
}

function removeAssetRef(type: 'characters' | 'environments' | 'props', idx: number) {
  if (!selectedPrompt.value) return
  const refs = { ...selectedPrompt.value.assetReferences }
  refs[type] = refs[type].filter((_, i) => i !== idx)
  update('assetReferences', refs)
}

// 面板操作
function addPanel() {
  if (!selectedPrompt.value) return
  const newPanel: PromptPanel = {
    id: `panel-${Date.now()}`,
    panelNumber: selectedPrompt.value.panels.length + 1,
    size: '', position: '', scene: '', camera: '',
    characters: '', props: '', environment: '', lighting: '',
    textElements: '', action: '',
  }
  update('panels', [...selectedPrompt.value.panels, newPanel])
  update('panelCount', selectedPrompt.value.panels.length + 1)
}

function updatePanel(idx: number, field: keyof PromptPanel, value: string) {
  if (!selectedPrompt.value) return
  const panels = selectedPrompt.value.panels.map((p, i) => i === idx ? { ...p, [field]: value } : p)
  update('panels', panels)
}

function removePanel(idx: number) {
  if (!selectedPrompt.value) return
  const panels = selectedPrompt.value.panels.filter((_, i) => i !== idx).map((p, i) => ({ ...p, panelNumber: i + 1 }))
  update('panels', panels)
  update('panelCount', panels.length)
}

// 后期清单
function togglePostItem(idx: number) {
  if (!selectedPrompt.value) return
  const items = selectedPrompt.value.postCompositing.map((item, i) => i === idx ? { ...item, done: !item.done } : item)
  update('postCompositing', items)
}

function addPostItem() {
  if (!selectedPrompt.value) return
  const newItem: PostCompositingItem = { label: '', done: false }
  update('postCompositing', [...selectedPrompt.value.postCompositing, newItem])
}

function updatePostItem(idx: number, label: string) {
  if (!selectedPrompt.value) return
  const items = selectedPrompt.value.postCompositing.map((item, i) => i === idx ? { ...item, label } : item)
  update('postCompositing', items)
}

function removePostItem(idx: number) {
  if (!selectedPrompt.value) return
  update('postCompositing', selectedPrompt.value.postCompositing.filter((_, i) => i !== idx))
}

function fillNegativePrompt() {
  update('negativePrompt', sharedNegativePrompt)
}

// ============ 封面（项目级） ============
function addCover() {
  store.addCover()
  showCover.value = true
  selectedId.value = null
}

function openCover() {
  showCover.value = true
  selectedId.value = null
}

function updateCover(field: keyof CoverPrompt, value: unknown) {
  store.updateCover({ [field]: value } as Partial<CoverPrompt>)
}

function updateCoverWorkflow(field: keyof CoverPrompt['workflowNotes'], value: string) {
  if (!store.project.cover) return
  store.updateCover({ workflowNotes: { ...store.project.cover.workflowNotes, [field]: value } })
}

function confirmRemoveCover() {
  dialog.warning({
    title: '删除封面提示词',
    content: '确定要删除项目封面提示词吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      store.removeCover()
      message.success('封面已删除')
    },
  })
}

const currentStyleTags = computed(() => {
  if (!selectedPrompt.value) return ''
  const style = artStyles.find(s => s.value === selectedPrompt.value!.artStyle)
  const tone = tones.find(t => t.value === selectedPrompt.value!.tone)
  return [style?.tags, tone?.tags].filter(Boolean).join(', ')
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 顶部标题 -->
    <div class="flex-shrink-0 mb-4">
      <h2 class="page-title">Step 5 · 页面提示词</h2>
      <p class="page-subtitle">按章节编辑每页的构图提示词：引用资产图片、描述面板布局、正负提示词、工作流备注</p>
    </div>

    <!-- 内容区 -->
    <div class="flex-1 overflow-hidden">
      <div class="h-full flex gap-3">
        <!-- 左侧：页面列表 -->
        <div class="w-60 flex-shrink-0 h-full">
          <div class="app-surface p-4 h-full flex flex-col overflow-hidden shadow-lg">
            <!-- 章节选择器 -->
            <div class="mb-3 flex-shrink-0">
              <label class="text-xs font-medium block mb-1.5">当前章节</label>
              <n-select
                :value="currentChapter?.id"
                size="small"
                :options="chapters.map(c => ({ label: c.title, value: c.id }))"
                @update:value="switchChapter"
              />
            </div>

            <!-- 封面入口（项目级） -->
            <div class="mb-2 flex-shrink-0">
              <div
                class="app-surface p-3 cursor-pointer transition-all hover:shadow-md shadow-sm"
                :style="{ borderColor: showCover ? 'var(--app-primary)' : 'var(--app-border)', borderStyle: 'dashed' }"
                @click="store.project.cover ? openCover() : addCover()"
              >
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded" :style="{ background: 'var(--code-bg)' }">00</span>
                  <n-tag v-if="store.project.cover" :type="store.project.cover.generated ? 'success' : 'default'" size="tiny">{{ store.project.cover.generated ? '已出图' : '待出图' }}</n-tag>
                </div>
                <div class="font-medium text-sm mt-2">封面（项目级）</div>
                <div class="text-xs mt-1" :style="{ color: 'var(--app-text-secondary)' }">
                  {{ store.project.cover ? '点击编辑 00-cover' : '点击创建封面提示词' }}
                </div>
              </div>
            </div>

            <!-- 页面列表 -->
            <div class="flex-1 overflow-y-auto space-y-2 pr-1">
              <div
                v-for="prompt in pagePrompts"
                :key="prompt.id"
                class="app-surface p-3 cursor-pointer transition-all hover:shadow-md shadow-sm"
                :style="{ borderColor: selectedId === prompt.id ? 'var(--app-primary)' : 'var(--app-border)' }"
                @click="selectPrompt(prompt.id)"
              >
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-mono px-1.5 py-0.5 rounded" :style="{ background: 'var(--code-bg)' }">第 {{ prompt.pageNumber }} 页</span>
                  <n-tag :type="prompt.generated ? 'success' : 'default'" size="tiny">{{ prompt.generated ? '已出图' : '待出图' }}</n-tag>
                </div>
                <div class="font-medium text-sm mt-2 truncate">{{ prompt.title }}</div>
                <div class="text-xs mt-1" :style="{ color: 'var(--app-text-secondary)' }">
                  {{ prompt.panelCount }} 格 · {{ prompt.artStyle }} · {{ prompt.layout }}
                </div>
              </div>
              <div v-if="pagePrompts.length === 0" class="text-center py-8 text-xs" :style="{ color: 'var(--app-text-secondary)' }">
                暂无页面提示词<br/>点击下方新增
              </div>
            </div>

            <!-- 新增按钮 -->
            <div class="flex-shrink-0 mt-2">
              <button class="btn-primary" style="width:100%;" @click="addPrompt">+ 新增页面提示词</button>
            </div>
          </div>
        </div>

        <!-- 中间：详情编辑器 -->
        <div class="flex-1 min-w-0 h-full">
          <div class="app-surface p-5 h-full overflow-y-auto shadow-lg">
            <!-- 封面编辑器（项目级） -->
            <div v-if="showCover && store.project.cover" class="space-y-4">
              <div class="app-surface p-5">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold">00 · 封面（项目级，单幅大图构图）</h3>
                  <div class="flex gap-2">
                    <button class="btn-delete" @click="confirmRemoveCover">删除</button>
                    <button class="btn-default" @click="closeDetail">关闭</button>
                  </div>
                </div>
                <div class="grid grid-cols-4 gap-4">
                  <div class="col-span-2"><label class="text-xs block mb-1">封面标题</label><n-input :value="store.project.cover.title" size="small" @update:value="(v: string) => updateCover('title', v)" /></div>
                  <div>
                    <label class="text-xs block mb-1">画幅</label>
                    <n-select :value="store.project.cover.aspect" size="small" :options="[
                      { label: '3:4 竖版', value: '3:4' }, { label: '4:3 横版', value: '4:3' },
                      { label: '16:9 宽屏', value: '16:9' }, { label: '9:16 竖屏', value: '9:16' }, { label: '1:1 方形', value: '1:1' },
                    ]" @update:value="(v: AspectRatio) => updateCover('aspect', v)" />
                  </div>
                  <div>
                    <label class="text-xs block mb-1">艺术风格</label>
                    <n-select :value="store.project.cover.artStyle" size="small" :options="artStyles.map(s => ({ label: s.label, value: s.value }))" @update:value="(v: ArtStyle) => updateCover('artStyle', v)" />
                  </div>
                  <div>
                    <label class="text-xs block mb-1">色调</label>
                    <n-select :value="store.project.cover.tone" size="small" :options="tones.map(t => ({ label: t.label, value: t.value }))" @update:value="(v: Tone) => updateCover('tone', v)" />
                  </div>
                </div>
              </div>

              <div class="app-surface p-5">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-semibold">封面提示词（单幅大图构图）</h3>
                  <button class="btn-default" @click="updateCover('negativePrompt', sharedNegativePrompt)">填充共享负向提示词</button>
                </div>
                <div class="space-y-4">
                  <div>
                    <label class="text-xs font-medium block mb-1">正向提示词（Krea2 7 模块结构 / ComfyUI 标签式）</label>
                    <n-input :value="store.project.cover.positivePrompt" type="textarea" :rows="8" placeholder="单幅大图构图：主视觉角色 + 标志性场景 + 风格/色调标签..." @update:value="(v: string) => updateCover('positivePrompt', v)" />
                  </div>
                  <div>
                    <label class="text-xs font-medium block mb-1">负向提示词</label>
                    <n-input :value="store.project.cover.negativePrompt" type="textarea" :rows="4" placeholder="text, letters, numbers, watermark, ..." @update:value="(v: string) => updateCover('negativePrompt', v)" />
                  </div>
                </div>
              </div>

              <div class="app-surface p-5">
                <h3 class="font-semibold mb-3">工作流备注</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div><label class="text-xs block mb-1">基础模型 / 引擎</label><n-input :value="store.project.cover.workflowNotes.baseModel" size="small" @update:value="(v: string) => updateCoverWorkflow('baseModel', v)" /></div>
                  <div><label class="text-xs block mb-1">IPAdapter / 参考图</label><n-input :value="store.project.cover.workflowNotes.ipadapter" size="small" @update:value="(v: string) => updateCoverWorkflow('ipadapter', v)" /></div>
                  <div><label class="text-xs block mb-1">采样器 / 步数</label><n-input :value="store.project.cover.workflowNotes.sampler" size="small" @update:value="(v: string) => updateCoverWorkflow('sampler', v)" /></div>
                  <div><label class="text-xs block mb-1">CFG</label><n-input :value="store.project.cover.workflowNotes.cfg" size="small" @update:value="(v: string) => updateCoverWorkflow('cfg', v)" /></div>
                  <div><label class="text-xs block mb-1">分辨率</label><n-input :value="store.project.cover.workflowNotes.resolution" size="small" placeholder="如 832x1216 (SDXL 3:4)" @update:value="(v: string) => updateCoverWorkflow('resolution', v)" /></div>
                  <div><label class="text-xs block mb-1">LoRA</label><n-input :value="store.project.cover.workflowNotes.lora" size="small" @update:value="(v: string) => updateCoverWorkflow('lora', v)" /></div>
                </div>
              </div>

              <div class="app-surface p-5">
                <h3 class="font-semibold mb-3">标题排版备注（后期添加）</h3>
                <n-input :value="store.project.cover.typographyNotes" type="textarea" :rows="2" placeholder="书名字体、位置、配色建议——由用户后期添加，不要让模型渲染文字" @update:value="(v: string) => updateCover('typographyNotes', v)" />
                <div class="flex items-center justify-between mt-4 pt-4" :style="{ borderTop: '1px solid var(--app-border)' }">
                  <span class="text-sm">封面已生成</span>
                  <n-checkbox :checked="store.project.cover.generated" @update:checked="() => store.toggleCoverGenerated()" />
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else-if="!selectedPrompt" class="h-full flex items-center justify-center">
              <div class="text-center">
                <div class="text-4xl mb-4">🎨</div>
                <h3 class="font-semibold mb-2">选择或创建页面提示词</h3>
                <p class="text-sm" :style="{ color: 'var(--app-text-secondary)' }">从左侧选择，或点击下方按钮新增</p>
              </div>
            </div>

            <!-- 页面提示词编辑器 -->
            <div v-else class="space-y-4">
              <!-- 基本信息 -->
              <div class="app-surface p-5">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-semibold">第 {{ selectedPrompt.pageNumber }} 页 — {{ selectedPrompt.title }}</h3>
                  <div class="flex gap-2">
                    <button class="btn-delete" @click="confirmDelete('删除页面提示词', `确定要删除第 ${selectedPrompt.pageNumber} 页的提示词吗？`, () => { store.removePagePrompt(selectedPrompt.id); closeDetail() }, '页面提示词已删除')">删除</button>
                    <button class="btn-default" @click="closeDetail">关闭</button>
                  </div>
                </div>
                <div class="grid grid-cols-4 gap-4">
                  <div><label class="text-xs block mb-1">页面标题</label><n-input :value="selectedPrompt.title" size="small" @update:value="(v: string) => update('title', v)" /></div>
                  <div>
                    <label class="text-xs block mb-1">布局</label>
                    <n-select :value="selectedPrompt.layout" size="small" :options="[
                      { label: '标准网格', value: 'standard' }, { label: '电影感', value: 'cinematic' },
                      { label: '密集', value: 'dense' }, { label: '跨页大图', value: 'splash' },
                      { label: '混合', value: 'mixed' }, { label: '条漫', value: 'webtoon' }, { label: '四格', value: 'four-panel' },
                    ]" @update:value="(v: string) => update('layout', v)" />
                  </div>
                  <div>
                    <label class="text-xs block mb-1">画幅</label>
                    <n-select :value="selectedPrompt.aspect" size="small" :options="[
                      { label: '3:4 竖版', value: '3:4' }, { label: '4:3 横版', value: '4:3' },
                      { label: '16:9 宽屏', value: '16:9' }, { label: '9:16 竖屏', value: '9:16' }, { label: '1:1 方形', value: '1:1' },
                    ]" @update:value="(v: string) => update('aspect', v)" />
                  </div>
                  <div>
                    <label class="text-xs block mb-1">艺术风格</label>
                    <n-select :value="selectedPrompt.artStyle" size="small" :options="artStyles.map(s => ({ label: s.label, value: s.value }))" @update:value="(v: string) => update('artStyle', v)" />
                  </div>
                  <div>
                    <label class="text-xs block mb-1">色调</label>
                    <n-select :value="selectedPrompt.tone" size="small" :options="tones.map(t => ({ label: t.label, value: t.value }))" @update:value="(v: string) => update('tone', v)" />
                  </div>
                  <div><label class="text-xs block mb-1">面板数量</label><n-input :value="String(selectedPrompt.panelCount)" size="small" disabled /></div>
                </div>
                <div class="mt-3 text-xs" :style="{ color: 'var(--app-text-secondary)' }">
                  当前风格标签：<code class="px-1.5 py-0.5 rounded" :style="{ background: 'var(--code-bg)' }">{{ currentStyleTags }}</code>
                </div>
              </div>

              <!-- 资产引用 -->
              <div class="app-surface p-5">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-semibold">资产引用（IPAdapter / Reference）</h3>
                </div>

                <!-- 角色 -->
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium">角色资产</span>
                    <button class="btn-default" style="height:24px; padding:0 8px; font-size:11px;" @click="addAssetRef('characters')">+ 添加</button>
                  </div>
                  <div v-for="(ref, idx) in selectedPrompt.assetReferences.characters" :key="idx" class="grid grid-cols-12 gap-2 mb-2 items-center">
                    <n-select :value="ref.assetId || null" size="tiny" filterable tag placeholder="选择或输入" :options="characterOptions" class="col-span-2" @update:value="(v: string) => selectAssetRef('characters', idx, v || '')" />
                    <n-input :value="ref.file" size="tiny" placeholder="文件路径" class="col-span-4" @update:value="(v: string) => updateAssetRef('characters', idx, { file: v })" />
                    <n-input :value="ref.role" size="tiny" placeholder="角色/作用" class="col-span-3" @update:value="(v: string) => updateAssetRef('characters', idx, { role: v })" />
                    <n-input :value="ref.weight" size="tiny" placeholder="权重" class="col-span-2" @update:value="(v: string) => updateAssetRef('characters', idx, { weight: v })" />
                    <button class="btn-delete-icon col-span-1" @click="removeAssetRef('characters', idx)">✕</button>
                  </div>
                  <div v-if="selectedPrompt.assetReferences.characters.length === 0" class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">暂无角色引用</div>
                </div>

                <!-- 环境 -->
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium">环境资产</span>
                    <button class="btn-default" style="height:24px; padding:0 8px; font-size:11px;" @click="addAssetRef('environments')">+ 添加</button>
                  </div>
                  <div v-for="(ref, idx) in selectedPrompt.assetReferences.environments" :key="idx" class="grid grid-cols-12 gap-2 mb-2 items-center">
                    <n-select :value="ref.assetId || null" size="tiny" filterable tag placeholder="选择或输入" :options="environmentOptions" class="col-span-2" @update:value="(v: string) => selectAssetRef('environments', idx, v || '')" />
                    <n-input :value="ref.file" size="tiny" placeholder="文件路径" class="col-span-4" @update:value="(v: string) => updateAssetRef('environments', idx, { file: v })" />
                    <n-input :value="ref.panels" size="tiny" placeholder="用于哪些格" class="col-span-3" @update:value="(v: string) => updateAssetRef('environments', idx, { panels: v })" />
                    <n-input :value="ref.weight" size="tiny" placeholder="权重 0.6-0.8" class="col-span-2" @update:value="(v: string) => updateAssetRef('environments', idx, { weight: v })" />
                    <button class="btn-delete-icon col-span-1" @click="removeAssetRef('environments', idx)">✕</button>
                  </div>
                  <div v-if="selectedPrompt.assetReferences.environments.length === 0" class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">暂无环境引用</div>
                </div>

                <!-- 道具 -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium">道具资产</span>
                    <button class="btn-default" style="height:24px; padding:0 8px; font-size:11px;" @click="addAssetRef('props')">+ 添加</button>
                  </div>
                  <div v-for="(ref, idx) in selectedPrompt.assetReferences.props" :key="idx" class="grid grid-cols-12 gap-2 mb-2 items-center">
                    <n-select :value="ref.assetId || null" size="tiny" filterable tag placeholder="选择或输入" :options="propOptions" class="col-span-2" @update:value="(v: string) => selectAssetRef('props', idx, v || '')" />
                    <n-input :value="ref.file" size="tiny" placeholder="文件路径" class="col-span-4" @update:value="(v: string) => updateAssetRef('props', idx, { file: v })" />
                    <n-input :value="ref.panels" size="tiny" placeholder="用于哪些格" class="col-span-3" @update:value="(v: string) => updateAssetRef('props', idx, { panels: v })" />
                    <n-input :value="ref.role" size="tiny" placeholder="备注" class="col-span-2" @update:value="(v: string) => updateAssetRef('props', idx, { role: v })" />
                    <button class="btn-delete-icon col-span-1" @click="removeAssetRef('props', idx)">✕</button>
                  </div>
                  <div v-if="selectedPrompt.assetReferences.props.length === 0" class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">暂无道具引用</div>
                </div>
              </div>

              <!-- 面板布局 -->
              <div class="app-surface p-5">
                <h3 class="font-semibold mb-3">面板布局</h3>
                <div class="grid grid-cols-3 gap-4 mb-4">
                  <div><label class="text-xs block mb-1">布局类型</label><n-input :value="selectedPrompt.panelLayout.layoutType" size="small" placeholder="grid / irregular / splash" @update:value="(v: string) => updatePanelLayout('layoutType', v)" /></div>
                  <div><label class="text-xs block mb-1">装订线</label><n-input :value="selectedPrompt.panelLayout.gutter" size="small" placeholder="white, 10px" @update:value="(v: string) => updatePanelLayout('gutter', v)" /></div>
                  <div><label class="text-xs block mb-1">边框</label><n-input :value="selectedPrompt.panelLayout.border" size="small" placeholder="clean black 2px" @update:value="(v: string) => updatePanelLayout('border', v)" /></div>
                </div>
                <div><label class="text-xs block mb-1">布局描述（面板尺寸/位置，用于 ControlNet 布局草图）</label>
                  <n-input :value="selectedPrompt.panelLayout.description" type="textarea" :rows="2" @update:value="(v: string) => updatePanelLayout('description', v)" />
                </div>
              </div>

              <!-- 逐格分解 -->
              <div class="app-surface p-5">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-semibold">逐格分解（{{ selectedPrompt.panels.length }} 格）</h3>
                  <button class="btn-default" style="height:28px; padding:0 12px; font-size:12px;" @click="addPanel">+ 新增格</button>
                </div>
                <div v-for="(panel, idx) in selectedPrompt.panels" :key="panel.id" class="mb-4 p-3 rounded-lg" :style="{ background: 'var(--code-bg)' }">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium">格 {{ panel.panelNumber }}</span>
                    <button class="btn-delete" @click="confirmDelete('删除分格', `确定要删除第 ${panel.panelNumber} 格吗？`, () => removePanel(idx), '分格已删除')">删除</button>
                  </div>
                  <div class="grid grid-cols-4 gap-2">
                    <n-input :value="panel.size" size="tiny" placeholder="尺寸 如 1/2 page" @update:value="(v: string) => updatePanel(idx, 'size', v)" />
                    <n-input :value="panel.position" size="tiny" placeholder="位置 如 Top" @update:value="(v: string) => updatePanel(idx, 'position', v)" />
                    <n-input :value="panel.camera" size="tiny" placeholder="机位" @update:value="(v: string) => updatePanel(idx, 'camera', v)" />
                    <n-input :value="panel.scene" size="tiny" placeholder="场景" @update:value="(v: string) => updatePanel(idx, 'scene', v)" />
                    <n-input :value="panel.characters" size="tiny" placeholder="角色（姿势/表情/动作）" @update:value="(v: string) => updatePanel(idx, 'characters', v)" />
                    <n-input :value="panel.props" size="tiny" placeholder="道具" @update:value="(v: string) => updatePanel(idx, 'props', v)" />
                    <n-input :value="panel.environment" size="tiny" placeholder="环境" @update:value="(v: string) => updatePanel(idx, 'environment', v)" />
                    <n-input :value="panel.lighting" size="tiny" placeholder="灯光" @update:value="(v: string) => updatePanel(idx, 'lighting', v)" />
                    <n-input :value="panel.action" size="tiny" placeholder="动作/运动" class="col-span-2" @update:value="(v: string) => updatePanel(idx, 'action', v)" />
                    <n-input :value="panel.textElements" size="tiny" placeholder="文字元素（标记为后期添加）" class="col-span-2" @update:value="(v: string) => updatePanel(idx, 'textElements', v)" />
                  </div>
                </div>
                <div v-if="selectedPrompt.panels.length === 0" class="text-center py-6 text-sm" :style="{ color: 'var(--app-text-secondary)' }">暂无面板，点击「新增格」添加</div>
              </div>

              <!-- 正负提示词（放在一起） -->
              <div class="app-surface p-5">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-semibold">ComfyUI 提示词</h3>
                  <button class="btn-default" style="height:28px; padding:0 12px; font-size:12px;" @click="fillNegativePrompt">填充共享负向提示词</button>
                </div>
                <div class="space-y-4">
                  <div>
                    <label class="text-xs font-medium block mb-1">正向提示词（Positive Prompt）</label>
                    <n-input :value="selectedPrompt.positivePrompt" type="textarea" :rows="8" placeholder="[风格标签], comic page, [面板数] panels, [布局] layout, ..." @update:value="(v: string) => update('positivePrompt', v)" />
                  </div>
                  <div>
                    <label class="text-xs font-medium block mb-1">负向提示词（Negative Prompt）</label>
                    <n-input :value="selectedPrompt.negativePrompt" type="textarea" :rows="4" placeholder="text, letters, numbers, watermark, ..." @update:value="(v: string) => update('negativePrompt', v)" />
                  </div>
                </div>
                <n-alert v-if="!selectedPrompt.positivePrompt.includes('text')" type="info" class="mt-3" :show-icon="true">
                  提示：正向提示词中不应包含对话文字内容——所有文字（对话/旁白/SFX）都在后期添加。
                </n-alert>
              </div>

              <!-- 工作流备注 -->
              <div class="app-surface p-5">
                <h3 class="font-semibold mb-3">ComfyUI 工作流备注</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div><label class="text-xs block mb-1">基础模型（Checkpoint）</label><n-input :value="selectedPrompt.workflowNotes.baseModel" size="small" placeholder="如 anime checkpoint" @update:value="(v: string) => updateWorkflow('baseModel', v)" /></div>
                  <div><label class="text-xs block mb-1">IPAdapter 权重</label><n-input :value="selectedPrompt.workflowNotes.ipadapter" size="small" @update:value="(v: string) => updateWorkflow('ipadapter', v)" /></div>
                  <div><label class="text-xs block mb-1">ControlNet</label><n-input :value="selectedPrompt.workflowNotes.controlNet" size="small" placeholder="lineart / depth / openpose / none" @update:value="(v: string) => updateWorkflow('controlNet', v)" /></div>
                  <div><label class="text-xs block mb-1">LoRA</label><n-input :value="selectedPrompt.workflowNotes.lora" size="small" placeholder="风格 LoRA 名称及权重" @update:value="(v: string) => updateWorkflow('lora', v)" /></div>
                  <div><label class="text-xs block mb-1">采样器</label><n-input :value="selectedPrompt.workflowNotes.sampler" size="small" @update:value="(v: string) => updateWorkflow('sampler', v)" /></div>
                  <div><label class="text-xs block mb-1">CFG</label><n-input :value="selectedPrompt.workflowNotes.cfg" size="small" @update:value="(v: string) => updateWorkflow('cfg', v)" /></div>
                  <div><label class="text-xs block mb-1">分辨率</label><n-input :value="selectedPrompt.workflowNotes.resolution" size="small" placeholder="如 832x1216 (SDXL 3:4)" @update:value="(v: string) => updateWorkflow('resolution', v)" /></div>
                  <div><label class="text-xs block mb-1">资产引用策略</label><n-input :value="selectedPrompt.workflowNotes.assetStrategy" size="small" @update:value="(v: string) => updateWorkflow('assetStrategy', v)" /></div>
                </div>
              </div>

              <!-- 后期清单 -->
              <div class="app-surface p-5">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="font-semibold">后期制作清单</h3>
                  <button class="btn-default" style="height:28px; padding:0 12px; font-size:12px;" @click="addPostItem">+ 添加项</button>
                </div>
                <div class="space-y-2">
                  <div v-for="(item, idx) in selectedPrompt.postCompositing" :key="idx" class="flex items-center gap-3">
                    <n-checkbox :checked="item.done" @update:checked="() => togglePostItem(idx)" />
                    <n-input :value="item.label" size="small" class="flex-1" @update:value="(v: string) => updatePostItem(idx, v)" />
                    <button class="btn-delete-icon" @click="confirmDelete('删除后期项', '确定要删除这个后期制作项吗？', () => removePostItem(idx), '后期项已删除')">✕</button>
                  </div>
                </div>
              </div>

              <!-- 生成状态 -->
              <div class="app-surface p-5">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-semibold">生成状态</h3>
                    <p class="text-xs mt-1" :style="{ color: 'var(--app-text-secondary)' }">在 ComfyUI 中生成此页面后标记为已生成</p>
                  </div>
                  <n-checkbox :checked="selectedPrompt.generated" @update:checked="() => update('generated', !selectedPrompt.generated)">
                    <span class="text-sm">此页面已生成</span>
                  </n-checkbox>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：操作指引 -->
        <div class="w-64 flex-shrink-0 h-full overflow-y-auto">
          <StepGuide
            :step-number="5"
            step-title="页面提示词"
            what-to-do="选择章节，编辑/确认每页的构图提示词：引用资产图片、描述面板布局、正负提示词、工作流备注。"
            input-for-a-i="当前章节的分镜脚本 + 全局资产图片（角色/环境/道具参考图）"
            ai-generates="每页的构图提示词（页面布局、面板描述、正负提示词、引用资产）"
            backfill-to="Step 5 · 页面提示词（导入 JSON 到当前章节）"
            next-step="Step 6 · 页面生成"
            next-route="/step6"
            compact
          />
          <div class="mt-3">
            <AIActionBar
              :on-import="handleImportPagePrompts"
              import-label="导入页面提示词 JSON"
              import-hint="导入到当前章节，替换现有提示词"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
