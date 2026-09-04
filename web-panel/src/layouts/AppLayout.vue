<script setup lang="ts">
import { ref, inject, computed, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useProjectStore } from '@/stores/project'
import { artStyles, tones } from '@/data/styles'

const router = useRouter()
const route = useRoute()
const store = useProjectStore()
const message = useMessage()

const isDark = inject<Ref<boolean>>('isDark')!
const toggleTheme = inject<() => void>('toggleTheme')!

const currentArtStyleLabel = computed(() => {
  const style = artStyles.find(s => s.value === store.project.meta.artStyle)
  return style?.label || store.project.meta.artStyle
})

const currentToneLabel = computed(() => {
  const tone = tones.find(t => t.value === store.project.meta.tone)
  return tone?.label || store.project.meta.tone
})

const isProjectListPage = computed(() => route.path === '/')
const currentStep = computed(() => (route.meta.step as number) || 0)

const navItems = computed(() => {
  if (isProjectListPage.value) {
    return [{ path: '/', label: '项目列表', step: -1, completed: false, description: '管理所有漫画项目' }]
  }
  return [
    { path: '/', label: '返回项目列表', step: -1, completed: false, description: '' },
    { path: '/dashboard', label: '项目总览', step: 0, completed: false, description: '项目概览与进度' },
    ...store.stepStatus.map(s => ({
      path: `/step${s.step}`,
      label: s.title,
      step: s.step,
      completed: s.completed,
      description: s.description,
    })),
  ]
})

function goTo(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- 侧边栏 -->
    <aside class="w-60 flex-shrink-0 flex flex-col sidebar-float">
      <div class="p-4 border-b" :style="{ borderColor: 'var(--app-border)' }">
        <h1 class="text-base font-bold" :style="{ color: 'var(--app-text)' }">漫画工作流</h1>
        <p class="text-xs mt-0.5" :style="{ color: 'var(--app-text-secondary)' }">Novel to Comic · ComfyUI</p>
      </div>

      <nav class="flex-1 overflow-y-auto py-2">
        <div
          v-for="item in navItems"
          :key="item.path + item.step"
          class="mx-2 my-1 px-3 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2.5"
          :class="(item.step === -1 && isProjectListPage) || currentStep === item.step ? 'font-semibold' : ''"
          :style="{
            background: (item.step === -1 && isProjectListPage) || currentStep === item.step ? 'var(--sidebar-active)' : 'transparent',
            color: (item.step === -1 && isProjectListPage) || currentStep === item.step ? 'var(--app-primary)' : 'var(--app-text)',
          }"
          @click="goTo(item.path)"
        >
          <div
            v-if="item.step >= 1"
            class="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
            :style="{
              background: item.completed ? 'var(--app-primary)' : (currentStep === item.step ? 'var(--app-primary)' : 'var(--app-border)'),
              color: item.completed || currentStep === item.step ? '#fff' : 'var(--app-text-secondary)',
            }"
          >
            {{ item.completed ? '✓' : item.step }}
          </div>
          <div v-else class="w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
            {{ item.step === 0 ? '▦' : '←' }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm truncate">{{ item.label }}</div>
            <div v-if="item.description" class="text-xs truncate" :style="{ color: 'var(--app-text-secondary)' }">{{ item.description }}</div>
          </div>
        </div>
      </nav>

      <div v-if="!isProjectListPage" class="p-3 border-t" :style="{ borderColor: 'var(--app-border)' }">
        <div class="text-xs mb-2" :style="{ color: 'var(--app-text-secondary)' }">
          进度：{{ store.completedSteps }} / 6 步
        </div>
        <div class="h-1.5 rounded-full overflow-hidden" :style="{ background: 'var(--app-border)' }">
          <div
            class="h-full rounded-full transition-all"
            :style="{ width: `${(store.completedSteps / 6) * 100}%`, background: 'var(--app-primary)' }"
          />
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 顶栏 -->
      <header class="h-14 flex-shrink-0 flex items-center justify-between px-5 header-float">
        <div v-if="!isProjectListPage" class="flex items-center gap-3">
          <input
            v-model="store.project.meta.title"
            class="bg-transparent border-none outline-none text-base font-semibold w-56"
            :style="{ color: 'var(--app-text)' }"
            placeholder="项目标题"
            @blur="store.save()"
          />
          <span class="text-xs px-2.5 py-1 rounded-full font-medium" :style="{ background: 'var(--sidebar-active)', color: 'var(--app-primary)' }">
            {{ currentArtStyleLabel }} · {{ currentToneLabel }}
          </span>
        </div>
        <div v-else class="text-base font-semibold">项目管理</div>

        <div class="flex items-center gap-2">
          <n-button size="small" quaternary @click="toggleTheme">
            {{ isDark ? '☀️' : '🌙' }}
          </n-button>
        </div>
      </header>

      <!-- 内容 -->
      <main class="flex-1 overflow-hidden p-5">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>
