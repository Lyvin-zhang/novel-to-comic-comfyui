<script setup lang="ts">
import { ref } from 'vue'
import { useMessage } from 'naive-ui'

const props = defineProps<{
  copyText?: string
  copyLabel?: string
  copyHint?: string
  onImport?: (data: unknown) => void
  importLabel?: string
  importHint?: string
}>()

const message = useMessage()
const showImportModal = ref(false)
const importText = ref('')

async function copyToClipboard() {
  if (!props.copyText) return
  try {
    await navigator.clipboard.writeText(props.copyText)
    message.success('已复制到剪贴板，直接粘贴给 AI 即可')
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = props.copyText
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    message.success('已复制到剪贴板')
  }
}

function openImportModal() {
  importText.value = ''
  showImportModal.value = true
}

function confirmImport() {
  if (!importText.value.trim()) {
    message.warning('请粘贴 JSON 内容')
    return
  }
  try {
    const data = JSON.parse(importText.value)
    props.onImport?.(data)
    showImportModal.value = false
    importText.value = ''
  } catch (e) {
    message.error('JSON 解析失败，请检查格式')
  }
}
</script>

<template>
  <div class="app-surface p-4">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3 flex-wrap">
        <!-- 一键复制给 AI -->
        <button v-if="copyText" class="btn-copy" @click="copyToClipboard">
          📋 {{ copyLabel || '复制给 AI' }}
        </button>

        <!-- 导入 JSON -->
        <button v-if="onImport" class="btn-primary" @click="openImportModal">
          📥 {{ importLabel || '导入 JSON' }}
        </button>
      </div>

      <!-- 提示文字 -->
      <div class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">
        <span v-if="copyHint">{{ copyHint }}</span>
        <span v-if="copyHint && importHint"> · </span>
        <span v-if="importHint">{{ importHint }}</span>
      </div>
    </div>
  </div>

  <!-- 导入 JSON 模态框 -->
  <n-modal v-model:show="showImportModal" preset="card" title="粘贴 JSON 导入" style="width: 640px">
    <p class="text-sm mb-3" :style="{ color: 'var(--app-text-secondary)' }">
      将 AI 生成的 JSON 内容粘贴到下方，点击导入即可。导入将替换当前选中章节/全局的对应数据。
    </p>
    <n-input
      v-model:value="importText"
      type="textarea"
      placeholder='例如：{ "storyboard": [ { "pageNumber": 1, "title": "...", "panels": [...] } ] }'
      :rows="14"
      style="font-family: 'JetBrains Mono', Consolas, monospace; font-size: 12px;"
    />
    <template #footer>
      <div class="flex justify-end gap-2">
        <button class="btn-default" @click="showImportModal = false">取消</button>
        <button class="btn-primary" @click="confirmImport">导入</button>
      </div>
    </template>
  </n-modal>
</template>
