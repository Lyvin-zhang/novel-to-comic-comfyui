<script setup lang="ts">
import { onMounted, ref, provide } from 'vue'
import { NConfigProvider, NMessageProvider, NDialogProvider, darkTheme, zhCN, dateZhCN, NSpin } from 'naive-ui'
import AppLayout from '@/layouts/AppLayout.vue'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
const isDark = ref(false)
const loading = ref(true)

provide('isDark', isDark)

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('comic-theme', isDark.value ? 'dark' : 'light')
}

provide('toggleTheme', toggleTheme)

onMounted(async () => {
  const saved = localStorage.getItem('comic-theme')
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  // 等待 IndexedDB 数据加载完成，避免刷新后显示空项目
  await store.load()
  loading.value = false
})
</script>

<template>
  <NConfigProvider :theme="isDark ? darkTheme : null" :locale="zhCN" :date-locale="dateZhCN">
    <NMessageProvider>
      <NDialogProvider>
        <div v-if="loading" class="h-screen w-screen flex items-center justify-center">
          <NSpin size="large" />
        </div>
        <AppLayout v-else />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
