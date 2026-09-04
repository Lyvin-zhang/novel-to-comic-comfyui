<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { useProjectStore } from '@/stores/project'

const router = useRouter()
const store = useProjectStore()
const message = useMessage()
const dialog = useDialog()

const showAddChapter = ref(false)
const newChapterTitle = ref('')
const editingChapterId = ref<string | null>(null)
const editingTitle = ref('')

const chapters = computed(() => store.project.chapters)

const totalStats = computed(() => ({
  chapters: store.project.chapters.length,
  pages: store.totalStoryboardPages,
  prompts: store.totalPagePrompts,
  characters: store.project.characters.length,
  environments: store.project.environments.length,
  props: store.project.props.length,
  words: store.totalNovelChars,
}))

function goToStep(step: number) {
  router.push(`/step${step}`)
}

function openChapterStep(chapterId: string, step: number) {
  store.switchChapter(chapterId)
  router.push(`/step${step}`)
}

function confirmAddChapter() {
  const chapter = store.addChapter(newChapterTitle.value || undefined)
  message.success(`已创建「${chapter.title}」`)
  showAddChapter.value = false
  newChapterTitle.value = ''
}

function startRenameChapter(id: string, title: string) {
  editingChapterId.value = id
  editingTitle.value = title
}

function confirmRename() {
  if (editingChapterId.value && editingTitle.value.trim()) {
    store.updateChapter(editingChapterId.value, { title: editingTitle.value.trim() })
    message.success('已重命名')
  }
  editingChapterId.value = null
}

function confirmDeleteChapter(id: string, title: string) {
  if (chapters.value.length <= 1) {
    message.warning('至少保留一个章节')
    return
  }
  dialog.warning({
    title: '确认删除章节',
    content: `确定要删除「${title}」吗？该章的分镜和页面提示词都会被删除，且不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      store.removeChapter(id)
      message.success('章节已删除')
    },
  })
}

function chapterWordCount(text: string): number {
  return text.replace(/\s/g, '').length
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch { return iso }
}
</script>

<template>
  <div class="h-full overflow-y-auto">
    <div class="max-w-5xl mx-auto space-y-6">
    <!-- 项目标题区 -->
    <div class="app-surface p-6">
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold">{{ store.project.meta.title }}</h1>
          <p class="text-sm mt-2" :style="{ color: 'var(--app-text-secondary)' }">
            {{ store.project.meta.artStyle }} · {{ store.project.meta.tone }} · {{ store.project.meta.layout }} · {{ store.project.meta.aspectRatio }}
          </p>
        </div>
        <div class="flex gap-2">
          <n-button @click="goToStep(1)">项目配置</n-button>
          <n-button type="primary" @click="showAddChapter = true">+ 新建章节</n-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-4 gap-4">
      <div class="app-surface p-4 text-center">
        <div class="text-3xl font-bold" :style="{ color: 'var(--app-primary)' }">{{ totalStats.chapters }}</div>
        <div class="text-xs mt-1" :style="{ color: 'var(--app-text-secondary)' }">章节</div>
      </div>
      <div class="app-surface p-4 text-center">
        <div class="text-3xl font-bold">{{ totalStats.pages }}</div>
        <div class="text-xs mt-1" :style="{ color: 'var(--app-text-secondary)' }">分镜页数</div>
      </div>
      <div class="app-surface p-4 text-center">
        <div class="text-3xl font-bold">{{ totalStats.prompts }}</div>
        <div class="text-xs mt-1" :style="{ color: 'var(--app-text-secondary)' }">页面提示词</div>
      </div>
      <div class="app-surface p-4 text-center">
        <div class="text-3xl font-bold">{{ totalStats.words }}</div>
        <div class="text-xs mt-1" :style="{ color: 'var(--app-text-secondary)' }">原文总字数</div>
      </div>
    </div>

    <!-- 工作流进度 -->
    <div class="app-surface p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold">工作流进度</h3>
        <span class="text-sm" :style="{ color: 'var(--app-text-secondary)' }">{{ store.completedSteps }} / 6 步完成</span>
      </div>
      <div class="grid grid-cols-6 gap-2">
        <div
          v-for="step in store.stepStatus"
          :key="step.step"
          class="p-3 rounded-lg text-center cursor-pointer transition-all hover:opacity-80"
          :style="{ background: step.completed ? 'var(--sidebar-active)' : 'var(--code-bg)' }"
          @click="goToStep(step.step)"
        >
          <div
            class="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-semibold mb-2"
            :style="{
              background: step.completed ? 'var(--app-primary)' : 'var(--app-border)',
              color: step.completed ? '#fff' : 'var(--app-text-secondary)',
            }"
          >
            {{ step.completed ? '✓' : step.step }}
          </div>
          <div class="text-xs font-medium">{{ step.title }}</div>
        </div>
      </div>
    </div>

    <!-- 章节列表 -->
    <div class="app-surface p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold">章节列表</h3>
        <n-button size="small" type="primary" @click="showAddChapter = true">+ 新建章节</n-button>
      </div>

      <div v-if="chapters.length === 0" class="text-center py-12">
        <div class="text-4xl mb-3">📖</div>
        <p class="text-sm" :style="{ color: 'var(--app-text-secondary)' }">还没有章节，点击「新建章节」开始</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="chapter in chapters"
          :key="chapter.id"
          class="border rounded-lg p-4 transition-all hover:shadow-md"
          :style="{ borderColor: 'var(--app-border)' }"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0">
              <div v-if="editingChapterId === chapter.id" class="flex gap-2">
                <n-input
                  :value="editingTitle"
                  size="small"
                  class="flex-1"
                  @keyup.enter="confirmRename"
                  @blur="confirmRename"
                  @update:value="editingTitle = $event"
                />
              </div>
              <h4 v-else class="font-semibold text-base">{{ chapter.title }}</h4>
              <div class="flex gap-3 mt-1.5 text-xs" :style="{ color: 'var(--app-text-secondary)' }">
                <span>{{ chapterWordCount(chapter.novelText) }} 字</span>
                <span>{{ chapter.storyboard.length }} 页分镜</span>
                <span>{{ chapter.pagePrompts.length }} 页提示词</span>
                <span>更新于 {{ formatDate(chapter.updatedAt) }}</span>
              </div>
            </div>
            <div class="flex gap-1 ml-4">
              <button class="btn-default" @click="startRenameChapter(chapter.id, chapter.title)">重命名</button>
              <button class="btn-delete" @click="confirmDeleteChapter(chapter.id, chapter.title)">删除</button>
            </div>
          </div>

          <!-- 章节进度条 -->
          <div class="mb-3">
            <div class="h-1.5 rounded-full overflow-hidden flex" :style="{ background: 'var(--app-border)' }">
              <div
                v-if="chapter.novelText"
                class="h-full"
                :style="{ width: '16.6%', background: '#6366f1' }"
                title="原文已输入"
              />
              <div
                v-if="chapter.storyboard.length > 0"
                class="h-full"
                :style="{ width: '16.6%', background: '#8b5cf6' }"
                title="分镜已完成"
              />
              <div
                v-if="chapter.pagePrompts.length > 0"
                class="h-full"
                :style="{ width: '16.6%', background: '#a78bfa' }"
                title="提示词已完成"
              />
            </div>
          </div>

          <!-- 快速操作 -->
          <div class="flex gap-2 flex-wrap">
            <n-button size="small" @click="openChapterStep(chapter.id, 1)">
              📝 编辑原文
            </n-button>
            <n-button
              size="small"
              :type="chapter.storyboard.length > 0 ? 'primary' : 'default'"
              @click="openChapterStep(chapter.id, 2)"
            >
              🎬 分镜 ({{ chapter.storyboard.length }})
            </n-button>
            <n-button
              size="small"
              :type="chapter.pagePrompts.length > 0 ? 'primary' : 'default'"
              @click="openChapterStep(chapter.id, 5)"
            >
              🎨 页面提示词 ({{ chapter.pagePrompts.length }})
            </n-button>
            <n-button size="small" @click="openChapterStep(chapter.id, 6)">
              🖼️ 生成状态
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 全局资产概览 -->
    <div class="app-surface p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold">全局资产（跨章节共享）</h3>
        <n-button size="small" @click="goToStep(3)">管理资产 →</n-button>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="p-4 rounded-lg text-center" :style="{ background: 'var(--code-bg)' }">
          <div class="text-2xl font-bold">{{ store.project.characters.length }}</div>
          <div class="text-xs mt-1" :style="{ color: 'var(--app-text-secondary)' }">角色</div>
        </div>
        <div class="p-4 rounded-lg text-center" :style="{ background: 'var(--code-bg)' }">
          <div class="text-2xl font-bold">{{ store.project.environments.length }}</div>
          <div class="text-xs mt-1" :style="{ color: 'var(--app-text-secondary)' }">环境</div>
        </div>
        <div class="p-4 rounded-lg text-center" :style="{ background: 'var(--code-bg)' }">
          <div class="text-2xl font-bold">{{ store.project.props.length }}</div>
          <div class="text-xs mt-1" :style="{ color: 'var(--app-text-secondary)' }">道具</div>
        </div>
      </div>
    </div>

    <!-- 新建章节模态框 -->
    <n-modal v-model:show="showAddChapter" preset="card" title="新建章节" style="width: 480px">
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium block mb-2">章节标题</label>
          <n-input
            v-model:value="newChapterTitle"
            placeholder="如：第一章 初入江湖"
            @keyup.enter="confirmAddChapter"
          />
        </div>
        <n-alert type="info" :show-icon="true">
          每个章节独立管理原文、分镜和页面提示词。角色、环境、道具等资产全局共享。
        </n-alert>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showAddChapter = false">取消</n-button>
          <n-button type="primary" @click="confirmAddChapter">创建</n-button>
        </div>
      </template>
    </n-modal>
    </div>
  </div>
</template>
