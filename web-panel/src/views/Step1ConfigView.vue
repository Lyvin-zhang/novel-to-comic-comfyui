<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useProjectStore } from '@/stores/project'
import { artStyles, tones, layouts, presets, aspectRatios } from '@/data/styles'
import type { ArtStyle, Tone, LayoutType, PresetName, AspectRatio } from '@/types'
import StepGuide from '@/components/StepGuide.vue'
import AIActionBar from '@/components/AIActionBar.vue'
import { formatStep1ForAI } from '@/utils/aiFormat'

const store = useProjectStore()
const message = useMessage()
const meta = computed(() => store.project.meta)
const chapters = computed(() => store.project.chapters)
const currentChapter = computed(() => store.currentChapter)

const copyForAI = computed(() => {
  if (!currentChapter.value) return ''
  return formatStep1ForAI(store.project, currentChapter.value)
})

const showAddChapter = ref(false)
const newChapterTitle = ref('')
const activeTab = ref<'style' | 'chapters'>('chapters')

// 章节原文编辑状态（点击保存才写入 store）
const editingTitle = ref('')
const editingText = ref('')
const isDirty = ref(false)

// 全局配置编辑状态（点击保存才写入 store）
const localMeta = ref<any>({})
const metaDirty = ref(false)

function loadChapterToEditor() {
  // 只有 currentChapter 有值时才加载，undefined 时保持当前内容，避免保存时序问题清空
  if (currentChapter.value) {
    editingTitle.value = currentChapter.value.title
    editingText.value = currentChapter.value.novelText
    isDirty.value = false
  }
}

function saveChapter() {
  if (!currentChapter.value) return
  store.updateChapter(currentChapter.value.id, {
    title: editingTitle.value,
    novelText: editingText.value,
  })
  isDirty.value = false
  message.success('章节已保存')
}

function onTitleChange(v: string) {
  editingTitle.value = v
  isDirty.value = true
}

function onTextChange(v: string) {
  editingText.value = v
  isDirty.value = true
}

// 全局配置：加载到本地编辑器
function loadMetaToEditor() {
  localMeta.value = { ...store.project.meta }
  metaDirty.value = false
}

// 全局配置：保存到 store
function saveMetaConfig() {
  store.updateMeta({ ...localMeta.value })
  metaDirty.value = false
  message.success('全局配置已保存')
}

// 全局配置：修改本地变量，不实时保存
function setArtStyle(v: ArtStyle) { localMeta.value.artStyle = v; metaDirty.value = true }
function setTone(v: Tone) { localMeta.value.tone = v; metaDirty.value = true }
function setLayout(v: LayoutType) { localMeta.value.layout = v; metaDirty.value = true }
function setAspect(v: AspectRatio) { localMeta.value.aspectRatio = v; metaDirty.value = true }
function setMetaTitle(v: string) { localMeta.value.title = v; metaDirty.value = true }
function setMetaLanguage(v: string) { localMeta.value.language = v; metaDirty.value = true }

function setPreset(v: PresetName | 'none') {
  localMeta.value.preset = v
  if (v !== 'none') {
    const preset = presets.find(p => p.value === v)
    if (preset) {
      localMeta.value.artStyle = preset.baseStyle
      localMeta.value.tone = preset.baseTone
    }
  }
  metaDirty.value = true
}

// 监听章节 ID 变化，切换章节时加载编辑器；保存时 ID 不变不会触发
watch(() => currentChapter.value?.id, () => {
  loadChapterToEditor()
}, { immediate: true })

// 切换到全局配置 Tab 时，加载最新配置到本地编辑器
watch(activeTab, (val) => {
  if (val === 'style') {
    loadMetaToEditor()
  }
})

// 切换章节时手动加载，确保时序正确
function switchChapter(id: string) {
  store.switchChapter(id)
}

const currentWordCount = computed(() => editingText.value.replace(/\s/g, '').length || 0)
const totalWordCount = computed(() => store.totalNovelChars)

function confirmAddChapter() {
  store.addChapter(newChapterTitle.value || undefined)
  showAddChapter.value = false
  newChapterTitle.value = ''
}

function deleteChapter(id: string) {
  store.removeChapter(id)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 顶部标题 + Tab -->
    <div class="flex-shrink-0 mb-4">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h2 class="page-title">Step 1 · 项目配置</h2>
          <p class="page-subtitle">管理章节原文，配置项目全局风格</p>
        </div>
      </div>
      <n-tabs v-model:value="activeTab" type="line" size="medium">
        <n-tab name="chapters" tab="📚 章节管理" />
        <n-tab name="style" tab="🎨 全局风格配置" />
      </n-tabs>
    </div>

    <!-- 内容区（内部滚动） -->
    <div class="flex-1 overflow-hidden pr-1">
      <!-- 章节管理 Tab - 三列布局 -->
      <div v-if="activeTab === 'chapters'" class="h-full flex gap-4">
        <!-- 左侧：章节列表 -->
        <div class="w-60 flex-shrink-0 h-full">
          <div class="app-surface p-4 h-full flex flex-col overflow-hidden">
            <div class="flex items-center justify-between mb-3 flex-shrink-0">
              <h3 class="section-title mb-0">章节列表</h3>
              <n-button size="tiny" type="primary" @click="showAddChapter = true">+ 新建</n-button>
            </div>
            <div class="text-xs mb-3 flex-shrink-0" :style="{ color: 'var(--app-text-secondary)' }">
              共 {{ chapters.length }} 章 · {{ totalWordCount }} 字
            </div>
            <div class="space-y-2 flex-1 overflow-y-auto pr-1">
              <div
                v-for="chapter in chapters"
                :key="chapter.id"
                class="chapter-card group"
                :class="{ active: currentChapter?.id === chapter.id }"
                @click="switchChapter(chapter.id)"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">{{ chapter.title }}</div>
                    <div class="text-xs mt-1" :style="{ color: 'var(--app-text-secondary)' }">
                      {{ chapter.novelText.replace(/\s/g, '').length }} 字 · {{ chapter.storyboard?.length || 0 }} 页
                    </div>
                  </div>
                  <button
                    class="btn-delete opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
                    @click.stop="deleteChapter(chapter.id)"
                  >删除</button>
                </div>
              </div>
              <div v-if="chapters.length === 0" class="text-center py-8 text-xs" :style="{ color: 'var(--app-text-tertiary)' }">
                暂无章节，点击「新建」创建
              </div>
            </div>
          </div>
        </div>

        <!-- 中间：原文编辑器 -->
        <div class="flex-1 min-w-0 h-full">
          <div class="app-surface p-5 h-full flex flex-col overflow-hidden">
            <template v-if="currentChapter">
              <div class="flex items-center justify-between mb-3 flex-shrink-0">
                <div class="flex items-center gap-3 flex-1">
                  <n-input
                    :value="editingTitle"
                    size="small"
                    class="w-56"
                    placeholder="章节标题"
                    @update:value="onTitleChange"
                  />
                  <n-tag v-if="isDirty" size="small" type="warning" :bordered="false">未保存</n-tag>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">{{ currentWordCount }} 字</span>
                  <n-button size="small" type="primary" :disabled="!isDirty" @click="saveChapter">保存</n-button>
                </div>
              </div>
              <div class="flex-1 min-h-0">
                <n-input
                  :value="editingText"
                  type="textarea"
                  placeholder="粘贴本章小说或故事原文在这里..."
                  :style="{ height: '100%' }"
                  :textarea-props="{ style: 'resize: none' }"
                  @update:value="onTextChange"
                />
              </div>
              <p class="text-xs mt-3 flex-shrink-0" :style="{ color: 'var(--app-text-secondary)' }">
                提示：长篇小说按章节分别输入。编辑完成后点击「保存」按钮才会写入项目数据。
              </p>
            </template>
            <div v-else class="flex-1 flex items-center justify-center">
              <div class="text-center">
                <div class="text-4xl mb-3">📖</div>
                <p class="text-sm font-medium" :style="{ color: 'var(--app-text-secondary)' }">请先选择或创建一个章节</p>
                <n-button size="small" type="primary" class="mt-3" @click="showAddChapter = true">+ 新建章节</n-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：操作指引 -->
        <div class="w-64 flex-shrink-0 h-full overflow-y-auto">
          <StepGuide
            :step-number="1"
            step-title="章节管理"
            what-to-do="创建章节、粘贴每章小说原文。长篇小说按自然章节拆分，每章独立管理。编辑完成后点击「保存」按钮。"
            input-for-a-i="当前章节的小说原文 + 全局风格配置"
            ai-generates="该章节的分镜脚本（storyboard）"
            backfill-to="Step 2 · 分镜（导入 JSON 到当前章节）"
            next-step="Step 2 · 分镜"
            next-route="/step2"
            :compact="true"
            :copy-text="copyForAI"
            copy-label="复制原文+风格给 AI"
            copy-hint="AI 将生成分镜脚本，然后到 Step 2 导入"
          />
        </div>
      </div>

      <!-- 全局风格配置 Tab - 全宽多列网格，紧凑布局 -->
      <div v-else class="h-full overflow-y-auto pr-1 space-y-2">
        <div class="app-surface p-3" :style="{ borderLeft: '4px solid var(--app-primary)' }">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-base">🌐</span>
              <span class="text-sm font-semibold">项目全局配置</span>
              <span v-if="metaDirty" class="text-xs px-2 py-0.5 rounded-full" :style="{ background: '#fef3c7', color: '#92400e' }">未保存</span>
            </div>
            <n-button type="primary" size="small" :disabled="!metaDirty" @click="saveMetaConfig">保存配置</n-button>
          </div>
          <p class="text-xs mt-1 ml-7" :style="{ color: 'var(--app-text-secondary)' }">
            以下风格配置对项目内所有章节生效，修改后点击右上角保存。
          </p>
        </div>

        <!-- 项目信息(1列) + 预设(2列) + 画面比例(1列) - 四列紧凑布局 -->
        <div class="grid grid-cols-4 gap-3">
          <!-- 项目信息 - 占1列，最左边 -->
          <div class="app-surface p-3">
            <h3 class="section-title !text-sm !mb-2">⚙️ 项目信息</h3>
            <div class="space-y-2">
              <div>
                <label class="text-[11px] font-medium block mb-1" :style="{ color: 'var(--app-text-secondary)' }">项目标题</label>
                <n-input :value="localMeta.title" @update:value="(v: string) => setMetaTitle(v)" size="small" />
              </div>
              <div>
                <label class="text-[11px] font-medium block mb-1" :style="{ color: 'var(--app-text-secondary)' }">目标语言</label>
                <n-select
                  :value="localMeta.language"
                  size="small"
                  :options="[
                    { label: '中文', value: 'zh' },
                    { label: 'English', value: 'en' },
                    { label: '日本語', value: 'ja' },
                  ]"
                  @update:value="(v: string) => setMetaLanguage(v)"
                />
              </div>
            </div>
          </div>

          <!-- 预设 - 占2列 -->
          <div class="app-surface p-3 col-span-2">
            <h3 class="section-title !text-[15px] !mb-1">🎨 预设（可选）</h3>
            <p class="section-desc !text-[11px] !mb-2">自动设置艺术风格 + 色调，选择后仍可手动调整。</p>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="preset in presets"
                :key="preset.value"
                class="p-2.5 rounded-lg border-2 cursor-pointer transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                :style="{
                  borderColor: localMeta.preset === preset.value ? 'var(--app-primary)' : 'var(--app-border)',
                  background: localMeta.preset === preset.value ? 'var(--app-primary-lighter)' : 'var(--app-surface)',
                }"
                @click="setPreset(preset.value as PresetName | 'none')"
              >
                <div class="flex items-center justify-between mb-0.5">
                  <span class="font-semibold text-sm">{{ preset.label }}</span>
                  <span v-if="localMeta.preset === preset.value" class="text-xs" :style="{ color: 'var(--app-primary)' }">✓</span>
                </div>
                <div class="text-[11px]" :style="{ color: 'var(--app-text-secondary)' }">{{ preset.description }}</div>
                <div class="text-[11px] mt-1 font-mono" :style="{ color: 'var(--app-primary)' }">{{ preset.baseStyle }} + {{ preset.baseTone }}</div>
              </div>
            </div>
          </div>

          <!-- 画面比例 - 占1列 -->
          <div class="app-surface p-3">
            <h3 class="section-title !text-[15px] !mb-2">📏 画面比例</h3>
            <div class="grid grid-cols-2 gap-1.5">
              <div
                v-for="ar in aspectRatios"
                :key="ar.value"
                class="p-2.5 rounded-lg border-2 cursor-pointer text-center transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                :style="{
                  borderColor: localMeta.aspectRatio === ar.value ? 'var(--app-primary)' : 'var(--app-border)',
                  background: localMeta.aspectRatio === ar.value ? 'var(--app-primary-lighter)' : 'var(--app-surface)',
                }"
                @click="setAspect(ar.value as AspectRatio)"
              >
                <div class="text-sm font-medium">{{ ar.label }}</div>
              </div>
            </div>
            <div class="mt-2 text-[11px]" :style="{ color: 'var(--app-text-secondary)' }">
              SDXL：{{ aspectRatios.find(a => a.value === localMeta.aspectRatio)?.sdxl }}
            </div>
          </div>
        </div>

        <!-- 艺术风格 + 色调 + 布局 - 三列紧凑布局 -->
        <div class="grid grid-cols-3 gap-3">
          <div class="app-surface p-3">
            <h3 class="section-title !text-[15px] !mb-2">🖌️ 艺术风格</h3>
            <div class="grid grid-cols-2 gap-1.5">
              <div
                v-for="style in artStyles"
                :key="style.value"
                class="p-2 rounded-lg cursor-pointer transition-all border shadow-sm hover:shadow-md hover:-translate-y-0.5"
                :style="{
                  background: localMeta.artStyle === style.value ? 'var(--app-primary-lighter)' : 'var(--app-surface)',
                  borderColor: localMeta.artStyle === style.value ? 'var(--app-primary)' : 'var(--app-border)',
                }"
                @click="setArtStyle(style.value as ArtStyle)"
              >
                <div class="flex items-center justify-between mb-0.5">
                  <div class="flex items-baseline gap-1.5">
                    <span class="text-sm font-medium">{{ style.label }}</span>
                    <span class="text-[10px] font-mono" :style="{ color: 'var(--app-text-tertiary)' }">{{ style.value }}</span>
                  </div>
                  <span v-if="localMeta.artStyle === style.value" class="text-xs" :style="{ color: 'var(--app-primary)' }">✓</span>
                </div>
                <div class="text-[11px] leading-tight line-clamp-2" :style="{ color: 'var(--app-text-secondary)' }">{{ style.description }}</div>
              </div>
            </div>
          </div>

          <div class="app-surface p-3">
            <h3 class="section-title !text-[15px] !mb-2">🎭 色调</h3>
            <div class="grid grid-cols-2 gap-1.5">
              <div
                v-for="tone in tones"
                :key="tone.value"
                class="p-2 rounded-lg cursor-pointer transition-all border shadow-sm hover:shadow-md hover:-translate-y-0.5"
                :style="{
                  background: localMeta.tone === tone.value ? 'var(--app-primary-lighter)' : 'var(--app-surface)',
                  borderColor: localMeta.tone === tone.value ? 'var(--app-primary)' : 'var(--app-border)',
                }"
                @click="setTone(tone.value as Tone)"
              >
                <div class="flex items-center justify-between mb-0.5">
                  <div class="flex items-baseline gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full flex-shrink-0 inline-block" :style="{ background: tone.colorHint }"></span>
                    <span class="text-sm font-medium">{{ tone.label }}</span>
                    <span class="text-[10px] font-mono" :style="{ color: 'var(--app-text-tertiary)' }">{{ tone.value }}</span>
                  </div>
                  <span v-if="localMeta.tone === tone.value" class="text-xs" :style="{ color: 'var(--app-primary)' }">✓</span>
                </div>
                <div class="text-[11px] leading-tight line-clamp-2" :style="{ color: 'var(--app-text-secondary)' }">{{ tone.description }}</div>
              </div>
            </div>
          </div>

          <div class="app-surface p-3">
            <h3 class="section-title !text-[15px] !mb-2">📐 布局</h3>
            <div class="grid grid-cols-2 gap-1.5">
              <div
                v-for="layout in layouts"
                :key="layout.value"
                class="p-2 rounded-lg cursor-pointer transition-all border-2 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                :style="{
                  borderColor: localMeta.layout === layout.value ? 'var(--app-primary)' : 'var(--app-border)',
                  background: localMeta.layout === layout.value ? 'var(--app-primary-lighter)' : 'var(--app-surface)',
                }"
                @click="setLayout(layout.value as LayoutType)"
              >
                <div class="flex items-center justify-between mb-0.5">
                  <div class="flex items-baseline gap-1.5">
                    <span class="text-sm font-medium">{{ layout.label }}</span>
                    <span class="text-[10px] font-mono" :style="{ color: 'var(--app-text-tertiary)' }">{{ layout.panelRange }}</span>
                  </div>
                  <span v-if="localMeta.layout === layout.value" class="text-xs" :style="{ color: 'var(--app-primary)' }">✓</span>
                </div>
                <div class="text-[11px] leading-tight line-clamp-2" :style="{ color: 'var(--app-text-secondary)' }">{{ layout.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建章节模态框 -->
    <n-modal v-model:show="showAddChapter" preset="card" title="新建章节" style="width: 480px">
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium block mb-2">章节标题</label>
          <n-input v-model:value="newChapterTitle" placeholder="如：第二章 风云再起" @keyup.enter="confirmAddChapter" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showAddChapter = false">取消</n-button>
          <n-button type="primary" @click="confirmAddChapter">创建</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>
