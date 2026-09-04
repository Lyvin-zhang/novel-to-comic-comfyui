<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import { cameraAngles } from '@/data/styles'
import type { StoryboardPage, Panel, TextElement } from '@/types'
import StepGuide from '@/components/StepGuide.vue'
import AIActionBar from '@/components/AIActionBar.vue'
import { formatStep2ForAI } from '@/utils/aiFormat'
import { generateAssetId, type AssetType } from '@/utils/assetId'
import { useMessage, useDialog } from 'naive-ui'

const store = useProjectStore()
const selectedPageId = ref<string | null>(null)
const expandedPanels = ref<Set<string>>(new Set())

const chapters = computed(() => store.project.chapters)
const currentChapter = computed(() => store.currentChapter)
const storyboard = computed(() => currentChapter.value?.storyboard || [])

// 资产下拉选项：与 Step 3 定义的全局资产联动；支持手输（tag 模式），兼容资产尚未定义的情况
const characterOptions = computed(() =>
  store.project.characters.map(c => ({ label: `${c.id} · ${c.name || '未命名'}`, value: c.id }))
)
const environmentOptions = computed(() =>
  store.project.environments.map(e => ({ label: `${e.id} · ${e.name || '未命名'}`, value: e.id }))
)

const copyForAI = computed(() => formatStep2ForAI(store.project))

const message = useMessage()
const dialog = useDialog()

function confirmDeletePage(id: string, pageNumber: number) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除第 ${pageNumber} 页分镜吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      removePage(id)
      message.success('页面已删除')
    },
  })
}

function confirmDeletePanel(pageId: string, panelId: string, panelNumber: number) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除第 ${panelNumber} 格吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      removePanel(pageId, panelId)
      message.success('分格已删除')
    },
  })
}

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

function handleImportStoryboard(data: unknown) {
  if (!currentChapter.value) {
    message.error('请先选择一个章节')
    return
  }
  const count = store.importStoryboard(data, currentChapter.value.id)
  if (count > 0) {
    message.success(`已导入 ${count} 页分镜到「${currentChapter.value.title}」`)
    selectedPageId.value = null
  } else {
    message.error('导入失败，JSON 格式不正确')
  }
}

const selectedPage = computed(() => storyboard.value.find(p => p.id === selectedPageId.value)!)

function switchChapter(id: string) {
  store.switchChapter(id)
  selectedPageId.value = null
}

function selectPage(id: string) {
  selectedPageId.value = id
}

function addPage() {
  const page = store.addStoryboardPage()
  selectedPageId.value = page.id
}

function removePage(id: string) {
  store.removeStoryboardPage(id)
  if (selectedPageId.value === id) {
    selectedPageId.value = storyboard.value[0]?.id || null
  }
}

function addPanel(pageId: string) {
  store.addPanel(pageId)
}

function removePanel(pageId: string, panelId: string) {
  store.removePanel(pageId, panelId)
}

function togglePanel(panelId: string) {
  if (expandedPanels.value.has(panelId)) {
    expandedPanels.value.delete(panelId)
  } else {
    expandedPanels.value.add(panelId)
  }
}

function updatePage(page: StoryboardPage, field: keyof StoryboardPage, value: unknown) {
  store.updateStoryboardPage(page.id, { [field]: value })
}

function updatePanel(pageId: string, panel: Panel, field: keyof Panel, value: unknown) {
  store.updatePanel(pageId, panel.id, { [field]: value })
}

function addTextElement(pageId: string, panel: Panel) {
  const newEl: TextElement = {
    id: `text-${Date.now()}`,
    type: 'dialogue',
    content: '',
    speaker: '',
    position: '',
  }
  store.updatePanel(pageId, panel.id, { textElements: [...panel.textElements, newEl] })
}

function updateTextElement(pageId: string, panel: Panel, elId: string, patch: Partial<TextElement>) {
  const updated = panel.textElements.map(el => el.id === elId ? { ...el, ...patch } : el)
  store.updatePanel(pageId, panel.id, { textElements: updated })
}

function removeTextElement(pageId: string, panel: Panel, elId: string) {
  store.updatePanel(pageId, panel.id, { textElements: panel.textElements.filter(el => el.id !== elId) })
}

function addPanelCharacter(pageId: string, panel: Panel) {
  store.updatePanel(pageId, panel.id, {
    characters: [...panel.characters, { assetId: '', name: '', description: '' }],
  })
}

function updatePanelCharacter(pageId: string, panel: Panel, idx: number, patch: Record<string, string>) {
  const projectId = store.project.meta.title || 'default'
  const updated = panel.characters.map((c, i) => {
    if (i !== idx) return c
    const merged = { ...c, ...patch }
    // 当名称变化时自动生成 assetId
    if (patch.name !== undefined && patch.name.trim()) {
      merged.assetId = generateAssetId(projectId, 'global', 'character', patch.name)
    }
    return merged
  })
  store.updatePanel(pageId, panel.id, { characters: updated })
}

function removePanelCharacter(pageId: string, panel: Panel, idx: number) {
  store.updatePanel(pageId, panel.id, { characters: panel.characters.filter((_, i) => i !== idx) })
}

function updatePanelEnvironment(pageId: string, panel: Panel, patch: Record<string, string>) {
  const projectId = store.project.meta.title || 'default'
  const current = panel.environment || { assetId: '', name: '', description: '' }
  const merged = { ...current, ...patch }
  // 当名称变化时自动生成 assetId
  if (patch.name !== undefined && patch.name.trim()) {
    merged.assetId = generateAssetId(projectId, 'global', 'environment', patch.name)
  }
  store.updatePanel(pageId, panel.id, { environment: merged })
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 顶部标题 -->
    <div class="flex-shrink-0 mb-4">
      <h2 class="page-title">Step 2 · 分镜脚本</h2>
      <p class="page-subtitle">按章节逐页逐格编辑分镜：布局、场景、机位、角色动作表情、对话、环境、灯光、页面钩子</p>
    </div>

    <!-- 内容区 -->
    <div class="flex-1 overflow-hidden">
      <div class="h-full flex gap-3">
        <!-- 左侧页面列表 - 浮动卡片 -->
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
      <div class="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 class="font-semibold text-sm">页面列表</h3>
        <n-button size="tiny" type="primary" @click="addPage">+ 新增页</n-button>
      </div>
      <div class="flex-1 overflow-y-auto space-y-2 pr-1">
        <div
          v-for="page in storyboard"
          :key="page.id"
          class="p-3 rounded-lg cursor-pointer transition-all group shadow-sm hover:shadow-md"
          :style="{
            background: selectedPageId === page.id ? 'var(--app-primary-lighter)' : 'var(--app-surface)',
            border: `1px solid ${selectedPageId === page.id ? 'var(--app-primary)' : 'var(--app-border)'}`,
          }"
          @click="selectPage(page.id)"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">第 {{ page.pageNumber }} 页</span>
            <button
              class="btn-delete-icon opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop="confirmDeletePage(page.id, page.pageNumber)"
            >✕</button>
          </div>
          <div class="text-xs mt-1 truncate" :style="{ color: 'var(--app-text-secondary)' }">
            {{ page.title || '未命名' }}
          </div>
          <div class="text-xs mt-1" :style="{ color: 'var(--app-text-secondary)' }">
            {{ page.panels.length }} 格 · {{ page.layout }}
          </div>
        </div>
        <div v-if="storyboard.length === 0" class="text-center py-8 text-sm" :style="{ color: 'var(--app-text-secondary)' }">
          暂无分镜页面<br/>点击「新增页」开始
        </div>
            </div>
          </div>
        </div>

        <!-- 中间页面详情 - 浮动卡片 -->
        <div class="flex-1 min-w-0 h-full">
          <div class="app-surface p-5 h-full overflow-y-auto shadow-lg">
            <div v-if="!selectedPage" class="text-center py-12">
              <div class="text-4xl mb-4">📄</div>
              <h3 class="font-semibold mb-2">选择或创建一个分镜页面</h3>
              <p class="text-sm" :style="{ color: 'var(--app-text-secondary)' }">
                从左侧选择页面，或点击「新增页」创建第一页
              </p>
              <n-button class="mt-4" type="primary" @click="addPage">创建第一页</n-button>
            </div>

            <div v-else class="space-y-4">
              <!-- 页面基本信息 -->
              <div class="app-surface p-5">
          <div class="grid grid-cols-4 gap-4">
            <div>
              <label class="text-xs font-medium block mb-1">页面标题</label>
              <n-input
                :value="selectedPage.title"
                size="small"
                @update:value="(v: string) => updatePage(selectedPage, 'title', v)"
              />
            </div>
            <div>
              <label class="text-xs font-medium block mb-1">布局</label>
              <n-select
                :value="selectedPage.layout"
                size="small"
                :options="[
                  { label: '标准网格', value: 'standard' },
                  { label: '电影感', value: 'cinematic' },
                  { label: '密集', value: 'dense' },
                  { label: '跨页大图', value: 'splash' },
                  { label: '混合', value: 'mixed' },
                  { label: '条漫', value: 'webtoon' },
                  { label: '四格', value: 'four-panel' },
                ]"
                @update:value="(v: string) => updatePage(selectedPage, 'layout', v)"
              />
            </div>
            <div>
              <label class="text-xs font-medium block mb-1">叙事层</label>
              <n-select
                :value="selectedPage.narrativeLayer"
                size="small"
                :options="[
                  { label: '主线叙事', value: 'main' },
                  { label: '旁白层', value: 'narrator' },
                  { label: '混合', value: 'mixed' },
                ]"
                @update:value="(v: string) => updatePage(selectedPage, 'narrativeLayer', v)"
              />
            </div>
            <div>
              <label class="text-xs font-medium block mb-1">Slug</label>
              <n-input
                :value="selectedPage.slug"
                size="small"
                @update:value="(v: string) => updatePage(selectedPage, 'slug', v)"
              />
            </div>
          </div>
          <div class="mt-4">
            <label class="text-xs font-medium block mb-1">核心信息（这一页传达什么）</label>
            <n-input
              :value="selectedPage.coreMessage"
              size="small"
              @update:value="(v: string) => updatePage(selectedPage, 'coreMessage', v)"
            />
          </div>
        </div>

        <!-- 面板列表 -->
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-sm">面板（{{ selectedPage.panels.length }} 格）</h3>
          <n-button size="small" @click="addPanel(selectedPage.id)">+ 新增格</n-button>
        </div>

        <div
          v-for="panel in selectedPage.panels"
          :key="panel.id"
          class="app-surface overflow-hidden"
        >
          <!-- 面板标题栏 -->
          <div
            class="flex items-center justify-between p-4 cursor-pointer"
            :style="{ background: 'var(--code-bg)' }"
            @click="togglePanel(panel.id)"
          >
            <div class="flex items-center gap-3">
              <span class="font-medium text-sm">格 {{ panel.panelNumber }}</span>
              <span class="text-xs px-2 py-0.5 rounded" :style="{ background: 'var(--app-surface)' }">{{ panel.size }}</span>
              <span class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">{{ panel.position }}</span>
              <span class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">{{ panel.scene || '未设置场景' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="btn-delete"
                @click.stop="confirmDeletePanel(selectedPage.id, panel.id, panel.panelNumber)"
              >删除</button>
              <span class="text-sm" :style="{ color: 'var(--app-text-secondary)' }">
                {{ expandedPanels.has(panel.id) ? '▲' : '▼' }}
              </span>
            </div>
          </div>

          <!-- 面板编辑区 -->
          <div v-if="expandedPanels.has(panel.id)" class="p-4 space-y-4">
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="text-xs font-medium block mb-1">尺寸</label>
                <n-input
                  :value="panel.size"
                  size="small"
                  placeholder="如 1/2 page, 1/3 page"
                  @update:value="(v: string) => updatePanel(selectedPage.id, panel, 'size', v)"
                />
              </div>
              <div>
                <label class="text-xs font-medium block mb-1">位置</label>
                <n-input
                  :value="panel.position"
                  size="small"
                  placeholder="如 Top, Bottom-Left"
                  @update:value="(v: string) => updatePanel(selectedPage.id, panel, 'position', v)"
                />
              </div>
              <div>
                <label class="text-xs font-medium block mb-1">机位</label>
                <n-select
                  :value="panel.camera"
                  size="small"
                  :options="cameraAngles.map(c => ({ label: c.label, value: c.value }))"
                  @update:value="(v: string) => updatePanel(selectedPage.id, panel, 'camera', v)"
                />
              </div>
            </div>

            <div>
              <label class="text-xs font-medium block mb-1">场景（时间、地点）</label>
              <n-input
                :value="panel.scene"
                size="small"
                placeholder="如：傍晚，王座大厅"
                @update:value="(v: string) => updatePanel(selectedPage.id, panel, 'scene', v)"
              />
            </div>

            <!-- 角色 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-medium">角色（{{ panel.characters.length }}）</label>
                <button class="btn-default" style="height:24px; padding:0 8px; font-size:11px;" @click="addPanelCharacter(selectedPage.id, panel)">+ 添加角色</button>
              </div>
              <div v-for="(char, idx) in panel.characters" :key="idx" class="mb-2 p-2 rounded" :style="{ background: 'var(--code-bg)' }">
                <div class="grid grid-cols-12 gap-2 items-center">
                  <div class="col-span-3">
                    <n-input
                      :value="char.name"
                      size="tiny"
                      placeholder="角色名称"
                      @update:value="(v: string) => updatePanelCharacter(selectedPage.id, panel, idx, { name: v })"
                    />
                  </div>
                  <div class="col-span-6">
                    <n-input
                      :value="char.description"
                      size="tiny"
                      placeholder="姿势/表情/动作/画面位置描述"
                      @update:value="(v: string) => updatePanelCharacter(selectedPage.id, panel, idx, { description: v })"
                    />
                  </div>
                  <div class="col-span-2">
                    <span class="text-[10px] font-mono px-1.5 py-1 rounded block truncate" :style="{ background: 'var(--app-surface)', color: 'var(--app-text-secondary)' }" :title="char.assetId">{{ char.assetId || '自动生成' }}</span>
                  </div>
                  <div class="col-span-1 flex justify-end">
                    <button class="btn-delete-icon" @click="confirmDelete('删除角色', '确定要删除这个角色吗？', () => removePanelCharacter(selectedPage.id, panel, idx), '角色已删除')">✕</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-medium block mb-1">环境</label>
                <div class="grid grid-cols-12 gap-2 items-center">
                  <div class="col-span-4">
                    <n-input
                      :value="panel.environment?.name || ''"
                      size="small"
                      placeholder="环境名称"
                      @update:value="(v: string) => updatePanelEnvironment(selectedPage.id, panel, { name: v })"
                    />
                  </div>
                  <div class="col-span-6">
                    <n-input
                      :value="panel.environment?.description || ''"
                      size="small"
                      placeholder="环境描述"
                      @update:value="(v: string) => updatePanelEnvironment(selectedPage.id, panel, { description: v })"
                    />
                  </div>
                  <div class="col-span-2">
                    <span class="text-[10px] font-mono px-1.5 py-1 rounded block truncate" :style="{ background: 'var(--app-surface)', color: 'var(--app-text-secondary)' }" :title="panel.environment?.assetId">{{ panel.environment?.assetId || '自动生成' }}</span>
                  </div>
                </div>
              </div>
              <div>
                <label class="text-xs font-medium block mb-1">灯光</label>
                <n-input
                  :value="panel.lighting"
                  size="small"
                  @update:value="(v: string) => updatePanel(selectedPage.id, panel, 'lighting', v)"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-medium block mb-1">色调</label>
                <n-input
                  :value="panel.colorTone"
                  size="small"
                  @update:value="(v: string) => updatePanel(selectedPage.id, panel, 'colorTone', v)"
                />
              </div>
              <div>
                <label class="text-xs font-medium block mb-1">动作/运动</label>
                <n-input
                  :value="panel.action"
                  size="small"
                  @update:value="(v: string) => updatePanel(selectedPage.id, panel, 'action', v)"
                />
              </div>
            </div>

            <!-- 文字元素 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-medium">文字元素（对话/旁白/想法/说明）</label>
                <n-button size="tiny" @click="addTextElement(selectedPage.id, panel)">+ 添加文字</n-button>
              </div>
              <div v-for="el in panel.textElements" :key="el.id" class="flex gap-2 mb-2 items-start">
                <n-select
                  :value="el.type"
                  size="small"
                  class="w-28 flex-shrink-0"
                  :options="[
                    { label: '对话', value: 'dialogue' },
                    { label: '旁白', value: 'narration' },
                    { label: '想法', value: 'thought' },
                    { label: '说明', value: 'caption' },
                  ]"
                  @update:value="(v: string) => updateTextElement(selectedPage.id, panel, el.id, { type: v as TextElement['type'] })"
                />
                <n-input
                  :value="el.content"
                  size="small"
                  placeholder="文字内容"
                  class="flex-1"
                  @update:value="(v: string) => updateTextElement(selectedPage.id, panel, el.id, { content: v })"
                />
                <n-input
                  :value="el.speaker"
                  size="small"
                  placeholder="说话者"
                  class="w-24"
                  @update:value="(v: string) => updateTextElement(selectedPage.id, panel, el.id, { speaker: v })"
                />
                <button class="btn-delete-icon" @click="confirmDelete('删除文字', '确定要删除这段文字吗？', () => removeTextElement(selectedPage.id, panel, el.id), '文字已删除')">✕</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 页面钩子 + 视觉提示词 -->
        <div class="app-surface p-5 space-y-4">
          <div>
            <label class="text-xs font-medium block mb-1">页面钩子（页末悬念/过渡到下一页）</label>
            <n-input
              :value="selectedPage.pageHook"
              size="small"
              @update:value="(v: string) => updatePage(selectedPage, 'pageHook', v)"
            />
          </div>
          <div>
            <label class="text-xs font-medium block mb-1">视觉提示词摘要（将在 Step 5 扩展为完整 ComfyUI 提示词）</label>
            <n-input
              :value="selectedPage.visualPrompt"
              type="textarea"
              :rows="3"
              @update:value="(v: string) => updatePage(selectedPage, 'visualPrompt', v)"
            />
          </div>
        </div>
          </div>
        </div>
        </div>

        <!-- 右侧操作指引 -->
        <div class="w-64 flex-shrink-0 h-full overflow-y-auto">
          <StepGuide
            :step-number="2"
            step-title="分镜脚本"
            what-to-do="选择章节，逐页逐格编辑分镜：每页布局、每格场景/机位/角色动作表情/对话/环境/灯光/页面钩子。"
            input-for-a-i="当前章节的完整分镜脚本"
            ai-generates="全局资产定义（角色/环境/道具）"
            backfill-to="Step 3 · 资产定义（导入 JSON）"
            next-step="Step 3 · 资产管理"
            next-route="/step3"
            :copy-text="copyForAI"
            copy-label="复制分镜给 AI"
            copy-hint="AI 将提取全局资产（角色/环境/道具）"
            compact
          />
          <div class="mt-3">
            <AIActionBar
              :on-import="handleImportStoryboard"
              import-label="导入分镜 JSON"
              import-hint="导入到当前章节，替换现有分镜"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
