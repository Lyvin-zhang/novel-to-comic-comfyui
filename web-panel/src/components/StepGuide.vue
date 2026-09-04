<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'

const props = defineProps<{
  stepNumber: number
  stepTitle: string
  whatToDo: string
  inputForAI?: string
  aiGenerates?: string
  backfillTo?: string
  userAction?: string
  nextStep: string
  nextRoute: string
  isFinal?: boolean
  compact?: boolean
  collapsible?: boolean
  copyText?: string
  copyLabel?: string
  copyHint?: string
}>()

const router = useRouter()
const message = useMessage()
const isUserStep = computed(() => !!props.userAction)
const expanded = ref(false)

function goNext() {
  router.push(props.nextRoute)
}

function toggleExpand() {
  expanded.value = !expanded.value
}

async function handleCopy() {
  if (!props.copyText) return
  try {
    await navigator.clipboard.writeText(props.copyText)
    message.success('已复制到剪贴板')
  } catch {
    message.error('复制失败，请手动复制')
  }
}
</script>

<template>
  <!-- 可折叠横向模式：默认只占一行，点击展开详情 -->
  <div v-if="collapsible" class="app-surface overflow-hidden">
    <!-- 收起/展开头部 -->
    <div class="px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-opacity-50 transition-colors" @click="toggleExpand">
      <div
        class="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
        :style="{ background: 'var(--app-primary)', color: '#fff', boxShadow: 'var(--shadow-primary)' }"
      >{{ stepNumber }}</div>
      <div class="flex-1 min-w-0 flex items-center gap-3">
        <span class="text-sm font-semibold flex-shrink-0">{{ stepTitle }}</span>
        <span class="text-xs truncate" :style="{ color: 'var(--app-text-secondary)' }">{{ whatToDo }}</span>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <n-button size="tiny" text @click.stop="toggleExpand">
          {{ expanded ? '收起' : '详情' }}
        </n-button>
        <n-button size="tiny" type="primary" @click.stop="goNext">
          <template v-if="isFinal">总览</template>
          <template v-else>下一步</template>
        </n-button>
      </div>
    </div>

    <!-- 展开内容 -->
    <div v-if="expanded" class="border-t px-4 py-3 space-y-3" :style="{ borderColor: 'var(--app-border)', background: 'var(--app-surface-hover)' }">
      <!-- 这一步做什么 -->
      <div>
        <div class="flex items-center gap-1.5 mb-1">
          <div class="w-4 h-4 rounded flex items-center justify-center text-[10px]" :style="{ background: 'var(--app-primary-lighter)', color: 'var(--app-primary)' }">✓</div>
          <span class="text-xs font-semibold">这一步做什么</span>
        </div>
        <p class="text-xs leading-relaxed pl-5.5" :style="{ color: 'var(--app-text-secondary)' }">{{ whatToDo }}</p>
      </div>

      <!-- AI 辅助步骤 -->
      <template v-if="!isUserStep">
        <div class="border-t pt-3" :style="{ borderColor: 'var(--app-border)' }">
          <div class="flex items-center gap-1.5 mb-2">
            <div class="w-4 h-4 rounded flex items-center justify-center text-[10px]" :style="{ background: 'var(--app-primary-lighter)', color: 'var(--app-primary)' }">→</div>
            <span class="text-xs font-semibold">填完后怎么用</span>
          </div>
          <div class="space-y-2 pl-5.5">
            <div class="flex gap-2">
              <span class="text-[10px] font-mono w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5" :style="{ background: 'var(--app-primary)', color: '#fff' }">1</span>
              <div class="text-xs leading-relaxed">
                <span class="font-medium">拿这些找 AI：</span>
                <span :style="{ color: 'var(--app-text-secondary)' }">{{ inputForAI }}</span>
              </div>
            </div>
            <div class="flex gap-2">
              <span class="text-[10px] font-mono w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5" :style="{ background: 'var(--app-primary)', color: '#fff' }">2</span>
              <div class="text-xs leading-relaxed">
                <span class="font-medium">让 AI 生成：</span>
                <span :style="{ color: 'var(--app-text-secondary)' }">{{ aiGenerates }}</span>
              </div>
            </div>
            <div class="flex gap-2">
              <span class="text-[10px] font-mono w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5" :style="{ background: 'var(--app-primary)', color: '#fff' }">3</span>
              <div class="text-xs leading-relaxed">
                <span class="font-medium">回填到：</span>
                <span :style="{ color: 'var(--app-text-secondary)' }">{{ backfillTo }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 用户操作步骤 -->
      <template v-else>
        <div class="border-t pt-3" :style="{ borderColor: 'var(--app-border)' }">
          <div class="flex items-center gap-1.5 mb-1">
            <div class="w-4 h-4 rounded flex items-center justify-center text-[10px]" :style="{ background: 'var(--app-primary-lighter)', color: 'var(--app-primary)' }">●</div>
            <span class="text-xs font-semibold">你需要做什么</span>
          </div>
          <p class="text-xs leading-relaxed pl-5.5" :style="{ color: 'var(--app-text-secondary)' }">{{ userAction }}</p>
        </div>
      </template>
    </div>
  </div>

  <!-- 紧凑模式：窄栏专用 -->
  <div v-else-if="compact" class="app-surface overflow-hidden">
    <div class="px-3 py-2.5 flex items-center gap-2.5 border-b" :style="{ borderColor: 'var(--app-border)', background: 'var(--app-surface-hover)' }">
      <div
        class="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
        :style="{ background: 'var(--app-primary)', color: '#fff', boxShadow: 'var(--shadow-primary)' }"
      >{{ stepNumber }}</div>
      <div class="flex-1 min-w-0">
        <div class="text-xs font-semibold truncate">{{ stepTitle }}</div>
        <div class="text-[10px] mt-0.5" :style="{ color: 'var(--app-text-tertiary)' }">
          {{ isUserStep ? '用户操作' : 'AI 辅助' }}
        </div>
      </div>
    </div>

    <div class="p-3 space-y-3">
      <div>
        <div class="flex items-center gap-1.5 mb-1.5">
          <div class="w-4 h-4 rounded flex items-center justify-center text-[10px]" :style="{ background: 'var(--app-primary-lighter)', color: 'var(--app-primary)' }">✓</div>
          <span class="text-[11px] font-semibold">这一步做什么</span>
        </div>
        <p class="text-[11px] leading-relaxed pl-5.5" :style="{ color: 'var(--app-text-secondary)' }">{{ whatToDo }}</p>
      </div>

      <template v-if="!isUserStep">
        <div class="border-t pt-3" :style="{ borderColor: 'var(--app-border)' }">
          <div class="flex items-center gap-1.5 mb-2">
            <div class="w-4 h-4 rounded flex items-center justify-center text-[10px]" :style="{ background: 'var(--app-primary-lighter)', color: 'var(--app-primary)' }">→</div>
            <span class="text-[11px] font-semibold">填完后怎么用</span>
          </div>
          <div class="space-y-2 pl-5.5">
            <div class="flex gap-2">
              <span class="text-[10px] font-mono w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5" :style="{ background: 'var(--app-primary)', color: '#fff' }">1</span>
              <div class="text-[11px] leading-relaxed">
                <span class="font-medium">拿这些找 AI：</span>
                <span :style="{ color: 'var(--app-text-secondary)' }">{{ inputForAI }}</span>
              </div>
            </div>
            <div class="flex gap-2">
              <span class="text-[10px] font-mono w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5" :style="{ background: 'var(--app-primary)', color: '#fff' }">2</span>
              <div class="text-[11px] leading-relaxed">
                <span class="font-medium">让 AI 生成：</span>
                <span :style="{ color: 'var(--app-text-secondary)' }">{{ aiGenerates }}</span>
              </div>
            </div>
            <div class="flex gap-2">
              <span class="text-[10px] font-mono w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5" :style="{ background: 'var(--app-primary)', color: '#fff' }">3</span>
              <div class="text-[11px] leading-relaxed">
                <span class="font-medium">回填到：</span>
                <span :style="{ color: 'var(--app-text-secondary)' }">{{ backfillTo }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="border-t pt-3" :style="{ borderColor: 'var(--app-border)' }">
          <div class="flex items-center gap-1.5 mb-1.5">
            <div class="w-4 h-4 rounded flex items-center justify-center text-[10px]" :style="{ background: 'var(--app-primary-lighter)', color: 'var(--app-primary)' }">●</div>
            <span class="text-[11px] font-semibold">你需要做什么</span>
          </div>
          <p class="text-[11px] leading-relaxed pl-5.5" :style="{ color: 'var(--app-text-secondary)' }">{{ userAction }}</p>
        </div>
      </template>

      <div class="border-t pt-3 space-y-2" :style="{ borderColor: 'var(--app-border)' }">
        <div v-if="copyText" class="text-[10px] text-center" :style="{ color: 'var(--app-text-tertiary)' }">
          {{ copyHint || '复制内容给 AI 生成下一步数据' }}
        </div>
        <button v-if="copyText" class="btn-copy" style="width:100%;" @click="handleCopy">
          📋 {{ copyLabel || '复制给 AI' }}
        </button>
        <div class="text-[10px] text-center" :style="{ color: 'var(--app-text-tertiary)' }">
          <template v-if="isFinal">完成后可导出全部文件</template>
          <template v-else>下一步：{{ nextStep }}</template>
        </div>
        <button class="btn-primary" style="width:100%;" @click="goNext">
          <template v-if="isFinal">查看总览</template>
          <template v-else>下一步</template>
        </button>
      </div>
    </div>
  </div>

  <!-- 完整模式 -->
  <div v-else class="app-surface overflow-hidden">
    <div class="px-5 py-3 flex items-center justify-between border-b" :style="{ borderColor: 'var(--app-border)', background: 'var(--app-surface-hover)' }">
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
          :style="{ background: 'var(--app-primary)', color: '#fff', boxShadow: 'var(--shadow-primary)' }"
        >{{ stepNumber }}</div>
        <div>
          <span class="font-semibold text-sm">{{ stepTitle }}</span>
          <div class="text-[11px] mt-0.5" :style="{ color: 'var(--app-text-tertiary)' }">
            {{ isUserStep ? '用户操作步骤' : 'AI 辅助步骤' }}
          </div>
        </div>
      </div>
    </div>

    <div class="p-5 space-y-4">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <div class="w-5 h-5 rounded flex items-center justify-center text-xs" :style="{ background: 'var(--app-primary-lighter)', color: 'var(--app-primary)' }">✓</div>
          <span class="text-sm font-semibold">这一步做什么</span>
        </div>
        <p class="text-sm pl-7" :style="{ color: 'var(--app-text-secondary)' }">{{ whatToDo }}</p>
      </div>

      <template v-if="!isUserStep">
        <div class="border-t pt-4" :style="{ borderColor: 'var(--app-border)' }">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-5 h-5 rounded flex items-center justify-center text-xs" :style="{ background: 'var(--app-primary-lighter)', color: 'var(--app-primary)' }">→</div>
            <span class="text-sm font-semibold">填完后怎么用</span>
          </div>
          <div class="pl-7 space-y-2.5">
            <div class="flex gap-2.5">
              <span class="text-xs font-mono w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" :style="{ background: 'var(--app-primary)', color: '#fff' }">1</span>
              <div class="text-sm">
                <span class="font-medium">拿着这些去找 AI：</span>
                <span :style="{ color: 'var(--app-text-secondary)' }">{{ inputForAI }}</span>
              </div>
            </div>
            <div class="flex gap-2.5">
              <span class="text-xs font-mono w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" :style="{ background: 'var(--app-primary)', color: '#fff' }">2</span>
              <div class="text-sm">
                <span class="font-medium">让 AI 生成：</span>
                <span :style="{ color: 'var(--app-text-secondary)' }">{{ aiGenerates }}</span>
              </div>
            </div>
            <div class="flex gap-2.5">
              <span class="text-xs font-mono w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5" :style="{ background: 'var(--app-primary)', color: '#fff' }">3</span>
              <div class="text-sm">
                <span class="font-medium">回填到：</span>
                <span :style="{ color: 'var(--app-text-secondary)' }">{{ backfillTo }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="border-t pt-4" :style="{ borderColor: 'var(--app-border)' }">
          <div class="flex items-center gap-2 mb-1.5">
            <div class="w-5 h-5 rounded flex items-center justify-center text-xs" :style="{ background: 'var(--app-primary-lighter)', color: 'var(--app-primary)' }">●</div>
            <span class="text-sm font-semibold">你需要做什么</span>
          </div>
          <p class="text-sm pl-7" :style="{ color: 'var(--app-text-secondary)' }">{{ userAction }}</p>
        </div>
      </template>

      <div class="border-t pt-4 space-y-3" :style="{ borderColor: 'var(--app-border)' }">
        <div v-if="copyText" class="flex items-center justify-between">
          <span class="text-xs" :style="{ color: 'var(--app-text-secondary)' }">{{ copyHint || '复制内容给 AI 生成下一步数据' }}</span>
          <n-button size="small" type="error" @click="handleCopy">
            <template #icon>📋</template>
            {{ copyLabel || '复制给 AI' }}
          </n-button>
        </div>
        <div class="flex items-center justify-between">
          <div class="text-sm" :style="{ color: 'var(--app-text-secondary)' }">
            <template v-if="isFinal">完成后可导出全部 Markdown 文件</template>
            <template v-else>下一步：<span class="font-medium" :style="{ color: 'var(--app-text)' }">{{ nextStep }}</span></template>
          </div>
          <n-button size="small" type="primary" @click="goNext">
            <template v-if="isFinal">查看总览</template>
            <template v-else>下一步</template>
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>
