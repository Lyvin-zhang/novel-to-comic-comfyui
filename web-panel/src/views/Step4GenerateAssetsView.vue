<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import StepGuide from '@/components/StepGuide.vue'
import AIActionBar from '@/components/AIActionBar.vue'
import { formatStep4ForAI } from '@/utils/aiFormat'
import { useMessage } from 'naive-ui'

const store = useProjectStore()
const message = useMessage()
const selectedChapterId = ref<string | null>(store.currentChapter?.id || null)

const chapters = computed(() => store.project.chapters)
const selectedChapter = computed(() => chapters.value.find(c => c.id === selectedChapterId.value) || chapters.value[0])

const copyForAI = computed(() => {
  if (!selectedChapter.value) return ''
  return formatStep4ForAI(store.project, selectedChapter.value)
})

async function handleCopy() {
  if (!copyForAI.value) return
  try {
    await navigator.clipboard.writeText(copyForAI.value)
    message.success('已复制到剪贴板，直接粘贴给 AI 即可')
  } catch {
    message.error('复制失败')
  }
}

const allAssets = computed(() => [
  ...store.project.characters.map(c => ({ type: '角色', id: c.id, name: c.name, generated: c.generated, imagePath: c.imagePath, toggle: () => store.toggleCharacterGenerated(c.id), updatePath: (v: string) => store.updateCharacter(c.id, { imagePath: v }) })),
  ...store.project.environments.map(e => ({ type: '环境', id: e.id, name: e.name, generated: e.generated, imagePath: e.imagePath, toggle: () => store.toggleEnvironmentGenerated(e.id), updatePath: (v: string) => store.updateEnvironment(e.id, { imagePath: v }) })),
  ...store.project.props.map(p => ({ type: '道具', id: p.id, name: p.name, generated: p.generated, imagePath: p.imagePath, toggle: () => store.togglePropGenerated(p.id), updatePath: (v: string) => store.updateProp(p.id, { imagePath: v }) })),
])

const generatedCount = computed(() => allAssets.value.filter(a => a.generated).length)
const allGenerated = computed(() => allAssets.value.length > 0 && allAssets.value.every(a => a.generated))
const characterAssets = computed(() => allAssets.value.filter(a => a.type === '角色'))
const environmentAssets = computed(() => allAssets.value.filter(a => a.type === '环境'))
const propAssets = computed(() => allAssets.value.filter(a => a.type === '道具'))
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 顶部标题 -->
    <div class="flex-shrink-0 mb-4">
      <h2 class="page-title">Step 4 · 资产生成</h2>
      <p class="page-subtitle">追踪全局资产的图片生成状态，复制 ComfyUI 提示词去生成，回来标记已生成并填写图片路径</p>
    </div>

    <!-- 内容区 -->
    <div class="flex-1 overflow-hidden">
      <div class="h-full flex gap-3">
        <!-- 左侧：进度+统计+命名规范 - 浮动卡片 -->
        <div class="w-60 flex-shrink-0 h-full">
          <div class="app-surface p-4 h-full flex flex-col gap-3 overflow-y-auto shadow-lg">
            <!-- 生成进度 -->
            <div class="shadow-sm">
              <h3 class="section-title mb-3">生成进度</h3>
        <div class="text-2xl font-bold mb-2" :style="{ color: allGenerated ? 'var(--app-success)' : 'var(--app-primary)' }">
          {{ generatedCount }}<span class="text-sm font-normal" :style="{ color: 'var(--app-text-secondary)' }"> / {{ allAssets.length }} 个</span>
        </div>
        <div class="h-2 rounded-full overflow-hidden" :style="{ background: 'var(--app-border)' }">
          <div
            class="h-full rounded-full transition-all"
            :style="{ width: `${allAssets.length ? (generatedCount / allAssets.length) * 100 : 0}%`, background: allGenerated ? 'var(--app-success)' : 'var(--app-primary)' }"
          />
        </div>
        <div v-if="allGenerated" class="mt-3 text-xs font-medium" :style="{ color: 'var(--app-success)' }">
          ✓ 所有资产已生成完成
        </div>
      </div>

      <!-- 资产分类统计 -->
      <div class="app-surface p-4 shadow-sm">
        <h3 class="section-title mb-3">资产分类</h3>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :style="{ background: 'var(--app-primary)' }"></span>
              <span class="text-xs">角色</span>
            </div>
            <span class="text-xs font-medium">{{ characterAssets.length }} 个</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :style="{ background: 'var(--app-success)' }"></span>
              <span class="text-xs">环境</span>
            </div>
            <span class="text-xs font-medium">{{ environmentAssets.length }} 个</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :style="{ background: 'var(--app-warning)' }"></span>
              <span class="text-xs">道具</span>
            </div>
            <span class="text-xs font-medium">{{ propAssets.length }} 个</span>
          </div>
        </div>
      </div>

      <!-- 命名规范 -->
      <div class="app-surface p-4 shadow-sm">
        <h3 class="section-title mb-2">命名规范</h3>
        <div class="code-block text-[10px] leading-relaxed">
assets/images/
├── characters/
│   └── char-01.png
├── environments/
│   └── env-01.png
└── props/
    └── prop-01.png
        </div>
      </div>
          </div>
        </div>

        <!-- 中间：复制AI+资产清单 - 浮动卡片 -->
        <div class="flex-1 min-w-0 h-full">
          <div class="app-surface p-5 h-full flex flex-col gap-3 overflow-hidden shadow-lg">
            <!-- 复制给 AI -->
            <div class="flex-shrink-0">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div class="flex items-center gap-3 flex-wrap">
              <div class="flex items-center gap-2">
                <label class="text-xs font-medium">生成哪一章：</label>
                <n-select
                  v-model:value="selectedChapterId"
                  size="small"
                  class="w-40"
                  :options="chapters.map(c => ({ label: c.title, value: c.id }))"
                />
              </div>
              <n-button type="primary" size="small" @click="handleCopy">
                <template #icon>📋</template>
                复制资产+分镜给 AI
              </n-button>
            </div>
            <div class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">
              AI 将生成该章页面提示词，到 Step 5 导入
            </div>
          </div>
        </div>

        <!-- 资产清单 -->
        <div class="app-surface p-5 flex-1 overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="section-title mb-0">资产清单</h3>
            <span class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">
              勾选标记已生成，填写图片路径
            </span>
          </div>
          <div v-if="allAssets.length === 0" class="text-center py-12">
            <div class="text-4xl mb-3">🎨</div>
            <p class="text-sm" :style="{ color: 'var(--app-text-secondary)' }">
              暂无资产<br/>请先在 Step 3 中定义角色、环境、道具资产
            </p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="asset in allAssets"
              :key="asset.id"
              class="flex items-center gap-3 p-3 rounded-lg transition-all border"
              :style="{
                background: asset.generated ? 'var(--app-primary-lighter)' : 'transparent',
                borderColor: asset.generated ? 'var(--app-primary)' : 'var(--app-border)',
              }"
            >
              <n-checkbox :checked="asset.generated" @update:checked="asset.toggle" />
              <span class="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0" :style="{ background: 'var(--code-bg)' }">{{ asset.id }}</span>
              <n-tag size="small" :type="asset.type === '角色' ? 'info' : asset.type === '环境' ? 'success' : 'warning'">{{ asset.type }}</n-tag>
              <span class="font-medium text-sm flex-1 truncate">{{ asset.name }}</span>
              <n-input
                :value="asset.imagePath"
                size="small"
                placeholder="图片路径"
                class="w-48"
                @update:value="asset.updatePath"
              />
              <n-tag :type="asset.generated ? 'success' : 'default'" size="small">
                {{ asset.generated ? '已生成' : '待生成' }}
              </n-tag>
            </div>
          </div>
        </div>
          </div>
        </div>

        <!-- 右侧操作指引 -->
        <div class="w-64 flex-shrink-0 h-full overflow-y-auto">
          <StepGuide
            :step-number="4"
            step-title="资产生成"
            what-to-do="追踪全局资产的图片生成状态。复制 Step 3 中每个资产的 ComfyUI 提示词，去 ComfyUI 生成图片，保存后回到这里标记「已生成」并填写图片路径。"
            input-for-a-i="每个资产的 ComfyUI 生成提示词"
            ai-generates="资产图片（角色/环境/道具参考图）"
            backfill-to="Step 5 · 页面提示词（引用资产图片）"
            next-step="Step 5 · 页面提示词"
            next-route="/step5"
            :copy-text="copyForAI"
            copy-label="复制资产提示词给 AI"
            copy-hint="在 ComfyUI 中生成资产图片"
            compact
          />
        </div>
      </div>
    </div>
  </div>
</template>
