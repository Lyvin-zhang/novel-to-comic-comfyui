<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import StepGuide from '@/components/StepGuide.vue'

const store = useProjectStore()

const chapters = computed(() => store.project.chapters)
const currentChapter = computed(() => store.currentChapter)
const pagePrompts = computed(() => currentChapter.value?.pagePrompts || [])

const generatedCount = computed(() => pagePrompts.value.filter(p => p.generated).length)
const allGenerated = computed(() => pagePrompts.value.length > 0 && pagePrompts.value.every(p => p.generated))

function switchChapter(id: string) {
  store.switchChapter(id)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 顶部标题 -->
    <div class="flex-shrink-0 mb-4">
      <h2 class="page-title">Step 6 · 页面生成</h2>
      <p class="page-subtitle">按章节追踪漫画页面的生成状态，打开 Step 5 提示词去 ComfyUI 生成，回来标记已生成</p>
    </div>

    <!-- 内容区 -->
    <div class="flex-1 overflow-hidden">
      <div class="h-full flex gap-3">
        <!-- 左侧：章节+进度+提醒 -->
        <div class="w-60 flex-shrink-0 h-full">
          <div class="app-surface p-4 h-full flex flex-col gap-3 overflow-y-auto shadow-lg">
            <!-- 章节选择 -->
            <div class="app-surface p-4 shadow-sm">
              <h3 class="section-title mb-3">当前章节</h3>
              <n-select
                :value="currentChapter?.id"
                size="small"
                :options="chapters.map(c => ({ label: c.title, value: c.id }))"
                @update:value="switchChapter"
              />
              <div class="text-xs mt-2" :style="{ color: 'var(--app-text-secondary)' }">
                {{ pagePrompts.length }} 页提示词
              </div>
            </div>

            <!-- 生成进度 -->
            <div class="app-surface p-4 shadow-sm">
              <div class="flex items-center justify-between mb-3">
                <h3 class="section-title mb-0">生成进度</h3>
              </div>
              <div class="text-2xl font-bold mb-2" :style="{ color: allGenerated ? 'var(--app-success)' : 'var(--app-primary)' }">
                {{ generatedCount }}<span class="text-sm font-normal" :style="{ color: 'var(--app-text-secondary)' }"> / {{ pagePrompts.length }} 页</span>
              </div>
              <div class="h-2 rounded-full overflow-hidden" :style="{ background: 'var(--app-border)' }">
                <div
                  class="h-full rounded-full transition-all"
                  :style="{ width: `${pagePrompts.length ? (generatedCount / pagePrompts.length) * 100 : 0}%`, background: allGenerated ? 'var(--app-success)' : 'var(--app-primary)' }"
                />
              </div>
              <div v-if="allGenerated" class="mt-3 text-xs font-medium" :style="{ color: 'var(--app-success)' }">
                ✓ 所有页面已生成完成
              </div>
            </div>

            <!-- 重要提醒 -->
            <div class="app-surface p-4 shadow-sm" :style="{ borderLeft: '4px solid var(--app-warning)' }">
              <h3 class="section-title mb-2" :style="{ color: 'var(--app-warning)' }">⚠️ 重要提醒</h3>
              <ul class="text-xs space-y-1.5" :style="{ color: 'var(--app-text-secondary)' }">
                <li>• 不要指望 ComfyUI 渲染可读文字</li>
                <li>• 角色一致性依赖 IPAdapter 引用资产图片</li>
                <li>• 每页建议生成 2-3 个变体，挑选最佳</li>
                <li>• 面板边框混乱可先生成单格再后期拼接</li>
                <li>• 后期清单在 Step 5 页面详情中勾选</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 中间：页面清单 -->
        <div class="flex-1 min-w-0 h-full">
          <div class="app-surface p-5 h-full overflow-y-auto shadow-lg">
            <div class="mb-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="section-title mb-0">页面清单</h3>
                <span class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">
                  勾选标记已生成
                </span>
              </div>
              <div v-if="pagePrompts.length === 0" class="text-center py-12">
                <div class="text-4xl mb-3">📄</div>
                <p class="text-sm" :style="{ color: 'var(--app-text-secondary)' }">
                  暂无页面提示词<br/>请先在 Step 5 中创建页面构图提示词
                </p>
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="prompt in pagePrompts"
                  :key="prompt.id"
                  class="flex items-center gap-4 p-3 rounded-lg transition-all border"
                  :style="{
                    background: prompt.generated ? 'var(--app-primary-lighter)' : 'transparent',
                    borderColor: prompt.generated ? 'var(--app-primary)' : 'var(--app-border)',
                  }"
                >
                  <n-checkbox :checked="prompt.generated" @update:checked="() => store.togglePagePromptGenerated(prompt.id)" />
                  <span class="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0" :style="{ background: 'var(--code-bg)' }">第 {{ prompt.pageNumber }} 页</span>
                  <span class="font-medium text-sm flex-1 truncate">{{ prompt.title }}</span>
                  <span class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">{{ prompt.panelCount }} 格</span>
                  <n-tag :type="prompt.generated ? 'success' : 'default'" size="small">
                    {{ prompt.generated ? '已生成' : '待生成' }}
                  </n-tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧操作指引 -->
        <div class="w-64 flex-shrink-0 h-full overflow-y-auto">
          <StepGuide
            :step-number="6"
            step-title="页面生成"
            what-to-do="选择章节，追踪漫画页面的生成状态。打开 Step 5 中每页的构图提示词，去 ComfyUI 生成页面，回来标记「已生成」。"
            user-action="打开 Step 5 中每页的构图提示词，去 ComfyUI 生成漫画页面，生成完成后回到这里勾选「已生成」。全部完成后可查看项目总览。"
            next-step="项目总览"
            next-route="/dashboard"
            :is-final="true"
            compact
          />
        </div>
      </div>
    </div>
  </div>
</template>
