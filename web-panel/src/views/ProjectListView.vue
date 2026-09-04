<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { useProjectStore } from '@/stores/project'
import { artStyles, tones } from '@/data/styles'

const router = useRouter()
const store = useProjectStore()
const message = useMessage()
const dialog = useDialog()

const showCreateModal = ref(false)
const newProjectTitle = ref('')
const showImportModal = ref(false)
const importText = ref('')
const importTitle = ref('')

// 英文 value 转中文 label + 英文（如：日漫 manga）
const artStyleLabel = (v: string) => {
  const s = artStyles.find(x => x.value === v)
  return s ? `${s.label} ${s.value}` : v
}
const toneLabel = (v: string) => {
  const t = tones.find(x => x.value === v)
  return t ? `${t.label} ${t.value}` : v
}

const sortedProjects = computed(() =>
  [...store.projectList].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
)

function openCreate() {
  newProjectTitle.value = ''
  showCreateModal.value = true
}

async function confirmCreate() {
  const id = await store.createProject(newProjectTitle.value || undefined)
  message.success('项目已创建')
  showCreateModal.value = false
  router.push('/dashboard')
}

async function openProject(id: string) {
  const ok = await store.switchProject(id)
  if (ok) {
    router.push('/dashboard')
  } else {
    message.error('无法打开项目')
  }
}

function confirmDelete(id: string, title: string) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除项目「${title}」吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await store.deleteProject(id)
      message.success('项目已删除')
    },
  })
}

function openImport() {
  importText.value = ''
  importTitle.value = ''
  showImportModal.value = true
}

async function confirmImport() {
  if (!importText.value.trim()) {
    message.warning('请粘贴 JSON 内容')
    return
  }
  const id = await store.importJSONAsNewProject(importText.value, importTitle.value || undefined)
  if (id) {
    message.success('项目导入成功')
    showImportModal.value = false
    router.push('/dashboard')
  } else {
    message.error('JSON 格式不正确，请检查')
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return iso
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- 头部 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">漫画项目</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--app-text-secondary)' }">
          管理你的漫画项目，每个项目独立走完整的 6 步工作流
        </p>
      </div>
      <div class="flex gap-2">
        <n-button @click="openImport">导入 JSON</n-button>
        <n-button type="primary" @click="openCreate">+ 新建项目</n-button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="sortedProjects.length === 0" class="app-surface p-16 text-center">
      <div class="text-5xl mb-4">📚</div>
      <h3 class="text-lg font-semibold mb-2">还没有项目</h3>
      <p class="text-sm mb-6" :style="{ color: 'var(--app-text-secondary)' }">
        创建第一个漫画项目，开始小说转漫画的工作流
      </p>
      <div class="flex justify-center gap-3">
        <n-button type="primary" @click="openCreate">+ 新建项目</n-button>
        <n-button @click="openImport">导入 JSON</n-button>
      </div>
    </div>

    <!-- 项目列表 -->
    <div v-else class="grid grid-cols-2 gap-4">
      <div
        v-for="proj in sortedProjects"
        :key="proj.id"
        class="app-surface p-5 cursor-pointer transition-all hover:shadow-lg group"
        @click="openProject(proj.id)"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-base truncate">{{ proj.title }}</h3>
          </div>
          <div class="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="btn-delete" @click.stop="confirmDelete(proj.id, proj.title)">删除</button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mb-3">
          <n-tag size="small" :bordered="false">{{ artStyleLabel(proj.artStyle) }}</n-tag>
          <n-tag size="small" :bordered="false" type="info">{{ toneLabel(proj.tone) }}</n-tag>
          <n-tag size="small" :bordered="false" type="success">{{ proj.pageCount }} 页</n-tag>
          <n-tag size="small" :bordered="false" type="warning">{{ proj.characterCount }} 角色</n-tag>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">进度</span>
              <span class="text-xs font-medium">{{ proj.completedSteps }}/6</span>
            </div>
            <div class="h-1.5 rounded-full overflow-hidden" :style="{ background: 'var(--app-border)' }">
              <div
                class="h-full rounded-full transition-all"
                :style="{ width: `${(proj.completedSteps / 6) * 100}%`, background: 'var(--app-primary)' }"
              />
            </div>
          </div>
        </div>

        <div class="mt-3 pt-3 border-t flex items-center justify-between" :style="{ borderColor: 'var(--app-border)' }">
          <span class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">
            更新于 {{ formatDate(proj.updatedAt) }}
          </span>
          <span class="text-xs font-medium" :style="{ color: 'var(--app-primary)' }">打开 &rsaquo;</span>
        </div>
      </div>
    </div>

    <!-- 新建项目模态框 -->
    <n-modal v-model:show="showCreateModal" preset="card" title="新建项目" style="width: 480px">
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium block mb-2">项目名称</label>
          <n-input
            v-model:value="newProjectTitle"
            placeholder="给你的漫画项目起个名字"
            @keyup.enter="confirmCreate"
          />
        </div>
        <n-alert type="info" :show-icon="true">
          创建后将进入 Step 1 风格配置，你可以在那里输入小说并选择艺术风格。
        </n-alert>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" @click="confirmCreate">创建</n-button>
        </div>
      </template>
    </n-modal>

    <!-- 导入项目模态框 -->
    <n-modal v-model:show="showImportModal" preset="card" title="导入项目 JSON" style="width: 560px">
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium block mb-2">项目名称（可选）</label>
          <n-input v-model:value="importTitle" placeholder="留空则使用 JSON 中的标题" />
        </div>
        <div>
          <label class="text-sm font-medium block mb-2">JSON 内容</label>
          <n-input
            v-model:value="importText"
            type="textarea"
            :rows="8"
            placeholder='{"meta": {...}, "storyboard": [...]}'
          />
        </div>
        <p class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">
          可以是之前从面板导出的项目 JSON，也可以是用配套 skill 在 AI 工具中生成的项目数据。
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showImportModal = false">取消</n-button>
          <n-button type="primary" @click="confirmImport">导入</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>
