<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import type { CharacterAsset, EnvironmentAsset, PropAsset } from '@/types'
import StepGuide from '@/components/StepGuide.vue'
import AIActionBar from '@/components/AIActionBar.vue'
import { useMessage, useDialog } from 'naive-ui'

const store = useProjectStore()
const activeTab = ref<'characters' | 'environments' | 'props'>('characters')
const selectedId = ref<string | null>(null)

const selectedCharacter = computed(() => store.project.characters.find(c => c.id === selectedId.value)!)
const selectedEnvironment = computed(() => store.project.environments.find(e => e.id === selectedId.value)!)
const selectedProp = computed(() => store.project.props.find(p => p.id === selectedId.value)!)

const isCharTab = computed(() => activeTab.value === 'characters')
const isEnvTab = computed(() => activeTab.value === 'environments')
const isPropTab = computed(() => activeTab.value === 'props')

const message = useMessage()
const dialog = useDialog()

// 「出现章节」多选选项：取自项目章节列表
const chapterOptions = computed(() =>
  store.project.chapters.map(c => ({ label: c.title || `第 ${c.chapterNumber} 章`, value: c.chapterNumber }))
)

function confirmDeleteAsset(type: string, name: string, onDelete: () => void) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除${type}「${name}」吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      onDelete()
      closeDetail()
      message.success(`${type}已删除`)
    },
  })
}

function handleImportAssets(data: unknown) {
  const result = store.importAssets(data)
  if (result.characters > 0 || result.environments > 0 || result.props > 0) {
    message.success(`已导入：角色 ${result.characters} · 环境 ${result.environments} · 道具 ${result.props}`)
    selectedId.value = null
  } else {
    message.error('导入失败，JSON 格式不正确')
  }
}

function addCharacter() {
  const c = store.addCharacter()
  selectedId.value = c.id
}
function addEnvironment() {
  const e = store.addEnvironment()
  selectedId.value = e.id
}
function addProp() {
  const p = store.addProp()
  selectedId.value = p.id
}

function selectItem(id: string) { selectedId.value = id }
function closeDetail() { selectedId.value = null }

// 角色更新
function updateChar(field: keyof CharacterAsset, value: unknown) {
  if (selectedCharacter.value) store.updateCharacter(selectedCharacter.value.id, { [field]: value })
}
function updateCharAppearance(field: keyof CharacterAsset['appearance'], value: string) {
  if (selectedCharacter.value) {
    store.updateCharacter(selectedCharacter.value.id, {
      appearance: { ...selectedCharacter.value.appearance, [field]: value },
    })
  }
}
function updateCharCostume(field: keyof CharacterAsset['costume'], value: string) {
  if (selectedCharacter.value) {
    store.updateCharacter(selectedCharacter.value.id, {
      costume: { ...selectedCharacter.value.costume, [field]: value },
    })
  }
}
function updateCharExpression(field: keyof CharacterAsset['expressionRange'], value: string) {
  if (selectedCharacter.value) {
    store.updateCharacter(selectedCharacter.value.id, {
      expressionRange: { ...selectedCharacter.value.expressionRange, [field]: value },
    })
  }
}

// 环境更新
function updateEnv(field: keyof EnvironmentAsset, value: unknown) {
  if (selectedEnvironment.value) store.updateEnvironment(selectedEnvironment.value.id, { [field]: value })
}
function updateEnvDesc(field: keyof EnvironmentAsset['description'], value: string) {
  if (selectedEnvironment.value) {
    store.updateEnvironment(selectedEnvironment.value.id, {
      description: { ...selectedEnvironment.value.description, [field]: value },
    })
  }
}
function updateEnvPalette(field: keyof EnvironmentAsset['colorPalette'], value: string) {
  if (selectedEnvironment.value) {
    store.updateEnvironment(selectedEnvironment.value.id, {
      colorPalette: { ...selectedEnvironment.value.colorPalette, [field]: value },
    })
  }
}
function updateEnvParams(field: keyof EnvironmentAsset['generationParams'], value: string) {
  if (selectedEnvironment.value) {
    store.updateEnvironment(selectedEnvironment.value.id, {
      generationParams: { ...selectedEnvironment.value.generationParams, [field]: value },
    })
  }
}

// 道具更新
function updateProp(field: keyof PropAsset, value: unknown) {
  if (selectedProp.value) store.updateProp(selectedProp.value.id, { [field]: value })
}
function updatePropDesc(field: keyof PropAsset['description'], value: string) {
  if (selectedProp.value) {
    store.updateProp(selectedProp.value.id, {
      description: { ...selectedProp.value.description, [field]: value },
    })
  }
}
function updatePropPalette(field: keyof PropAsset['colorPalette'], value: string) {
  if (selectedProp.value) {
    store.updateProp(selectedProp.value.id, {
      colorPalette: { ...selectedProp.value.colorPalette, [field]: value },
    })
  }
}
function updatePropParams(field: keyof PropAsset['generationParams'], value: string) {
  if (selectedProp.value) {
    store.updateProp(selectedProp.value.id, {
      generationParams: { ...selectedProp.value.generationParams, [field]: value },
    })
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 顶部标题 -->
    <div class="flex-shrink-0 mb-4">
      <h2 class="page-title">Step 3 · 资产定义</h2>
      <p class="page-subtitle">编辑/确认全局资产（角色/环境/道具），每个资产定义外观、配色、ComfyUI 生成提示词，跨所有章节共享</p>
    </div>

    <!-- 内容区 -->
    <div class="flex-1 overflow-hidden">
      <div class="h-full flex gap-3">
        <!-- 左侧：Tab + 资产列表 + 新增按钮 - 浮动卡片 -->
        <div class="w-60 flex-shrink-0 h-full">
          <div class="app-surface p-4 h-full flex flex-col overflow-hidden shadow-lg">
            <n-tabs v-model:value="activeTab" type="line" size="small" class="flex-shrink-0">
              <n-tab name="characters" :tab="`角色 ${store.project.characters.length}`" />
              <n-tab name="environments" :tab="`环境 ${store.project.environments.length}`" />
              <n-tab name="props" :tab="`道具 ${store.project.props.length}`" />
            </n-tabs>
            <div class="flex-1 overflow-y-auto space-y-2 pr-1 mt-2">
        <!-- 角色卡片 -->
        <div v-if="activeTab === 'characters'">
          <div
            v-for="char in store.project.characters"
            :key="char.id"
            class="app-surface p-3 cursor-pointer transition-all hover:shadow-md shadow-sm"
            :style="{ borderColor: selectedId === char.id ? 'var(--app-primary)' : 'var(--app-border)' }"
            @click="selectItem(char.id)"
          >
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded" :style="{ background: 'var(--code-bg)' }">{{ char.id }}</span>
              <n-tag :type="char.generated ? 'success' : 'default'" size="tiny">{{ char.generated ? '已生成' : '待生成' }}</n-tag>
            </div>
            <div class="font-medium text-sm mt-2">{{ char.name }}</div>
            <div class="text-xs mt-1 truncate" :style="{ color: 'var(--app-text-secondary)' }">{{ char.role || '未设定角色' }}</div>
          </div>
          <div v-if="store.project.characters.length === 0" class="text-center py-8 text-xs" :style="{ color: 'var(--app-text-secondary)' }">
            暂无角色<br/>点击下方新增
          </div>
        </div>

        <!-- 环境卡片 -->
        <div v-else-if="activeTab === 'environments'">
          <div
            v-for="env in store.project.environments"
            :key="env.id"
            class="app-surface p-3 cursor-pointer transition-all hover:shadow-md shadow-sm"
            :style="{ borderColor: selectedId === env.id ? 'var(--app-primary)' : 'var(--app-border)' }"
            @click="selectItem(env.id)"
          >
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded" :style="{ background: 'var(--code-bg)' }">{{ env.id }}</span>
              <n-tag :type="env.generated ? 'success' : 'default'" size="tiny">{{ env.generated ? '已生成' : '待生成' }}</n-tag>
            </div>
            <div class="font-medium text-sm mt-2">{{ env.name }}</div>
            <div class="text-xs mt-1" :style="{ color: 'var(--app-text-secondary)' }">{{ env.type }}</div>
            <div class="text-xs mt-1 truncate" :style="{ color: 'var(--app-text-secondary)' }">{{ env.description?.location || '—' }}</div>
          </div>
          <div v-if="store.project.environments.length === 0" class="text-center py-8 text-xs" :style="{ color: 'var(--app-text-secondary)' }">
            暂无环境<br/>点击下方新增
          </div>
        </div>

        <!-- 道具卡片 -->
        <div v-else>
          <div
            v-for="prop in store.project.props"
            :key="prop.id"
            class="app-surface p-3 cursor-pointer transition-all hover:shadow-md shadow-sm"
            :style="{ borderColor: selectedId === prop.id ? 'var(--app-primary)' : 'var(--app-border)' }"
            @click="selectItem(prop.id)"
          >
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded" :style="{ background: 'var(--code-bg)' }">{{ prop.id }}</span>
              <n-tag :type="prop.generated ? 'success' : 'default'" size="tiny">{{ prop.generated ? '已生成' : '待生成' }}</n-tag>
            </div>
            <div class="font-medium text-sm mt-2">{{ prop.name }}</div>
            <div class="text-xs mt-1" :style="{ color: 'var(--app-text-secondary)' }">{{ prop.type || '未设置类型' }}</div>
            <div class="text-xs mt-1 truncate" :style="{ color: 'var(--app-text-secondary)' }">持有者：{{ prop.ownerWielder || '—' }}</div>
          </div>
          <div v-if="store.project.props.length === 0" class="text-center py-8 text-xs" :style="{ color: 'var(--app-text-secondary)' }">
            暂无道具<br/>点击下方新增
          </div>
        </div>
      </div>
      <!-- 新增按钮 -->
      <div class="flex-shrink-0 mt-2">
        <n-button v-if="isCharTab" type="primary" size="small" block @click="addCharacter">+ 新增角色</n-button>
        <n-button v-if="isEnvTab" type="primary" size="small" block @click="addEnvironment">+ 新增环境</n-button>
        <n-button v-if="isPropTab" type="primary" size="small" block @click="addProp">+ 新增道具</n-button>
      </div>
          </div>
        </div>

        <!-- 中间详情编辑区 - 浮动卡片 -->
        <div class="flex-1 min-w-0 h-full">
          <div class="app-surface p-5 h-full overflow-y-auto shadow-lg">
            <div v-if="!selectedId" class="text-center py-12">
              <div class="text-4xl mb-4">🎨</div>
              <h3 class="font-semibold mb-2">选择一个资产进行编辑</h3>
              <p class="text-sm" :style="{ color: 'var(--app-text-secondary)' }">从左侧选择资产，或点击下方按钮新增</p>
            </div>

            <!-- 角色详情 -->
            <div v-else-if="activeTab === 'characters' && selectedCharacter" class="space-y-4">
          <div class="app-surface p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold">{{ selectedCharacter.id }} · {{ selectedCharacter.name }}</h3>
              <div class="flex gap-2">
                <button class="btn-delete" @click="confirmDeleteAsset('角色', selectedCharacter.name, () => store.removeCharacter(selectedCharacter.id))">删除</button>
                <n-button size="small" @click="closeDetail">关闭</n-button>
              </div>
            </div>
            <div class="grid grid-cols-4 gap-4">
              <div>
                <label class="text-xs font-medium block mb-1">名称</label>
                <n-input :value="selectedCharacter.name" size="small" @update:value="(v: string) => updateChar('name', v)" />
              </div>
              <div>
                <label class="text-xs font-medium block mb-1">角色定位</label>
                <n-input :value="selectedCharacter.role" size="small" placeholder="主角/反派/导师..." @update:value="(v: string) => updateChar('role', v)" />
              </div>
              <div>
                <label class="text-xs font-medium block mb-1">年龄</label>
                <n-input :value="selectedCharacter.age" size="small" @update:value="(v: string) => updateChar('age', v)" />
              </div>
              <div>
                <label class="text-xs font-medium block mb-1">首次出场</label>
                <n-input :value="selectedCharacter.firstAppearance" size="small" @update:value="(v: string) => updateChar('firstAppearance', v)" />
              </div>
            </div>
            <div class="mt-4">
              <label class="text-xs font-medium block mb-1">出现章节（跨章共享资产，勾选其出现的章节）</label>
              <n-select
                :value="selectedCharacter.recurringChapters || []"
                multiple
                size="small"
                placeholder="选择该角色出现的章节"
                :options="chapterOptions"
                @update:value="(v: number[]) => updateChar('recurringChapters', v)"
              />
            </div>
          </div>

          <div class="app-surface p-5">
            <h4 class="font-medium mb-3">外观</h4>
            <div class="grid grid-cols-3 gap-4">
              <div><label class="text-xs block mb-1">脸型</label><n-input :value="selectedCharacter.appearance.faceShape" size="small" @update:value="(v: string) => updateCharAppearance('faceShape', v)" /></div>
              <div><label class="text-xs block mb-1">发型</label><n-input :value="selectedCharacter.appearance.hair" size="small" @update:value="(v: string) => updateCharAppearance('hair', v)" /></div>
              <div><label class="text-xs block mb-1">眼睛</label><n-input :value="selectedCharacter.appearance.eyes" size="small" @update:value="(v: string) => updateCharAppearance('eyes', v)" /></div>
              <div><label class="text-xs block mb-1">体型</label><n-input :value="selectedCharacter.appearance.build" size="small" @update:value="(v: string) => updateCharAppearance('build', v)" /></div>
              <div class="col-span-2"><label class="text-xs block mb-1">辨识特征</label><n-input :value="selectedCharacter.appearance.distinguishingFeatures" size="small" @update:value="(v: string) => updateCharAppearance('distinguishingFeatures', v)" /></div>
            </div>
          </div>

          <div class="app-surface p-5">
            <h4 class="font-medium mb-3">服装</h4>
            <div class="grid grid-cols-3 gap-4">
              <div class="col-span-2"><label class="text-xs block mb-1">默认服装</label><n-input :value="selectedCharacter.costume.defaultOutfit" size="small" @update:value="(v: string) => updateCharCostume('defaultOutfit', v)" /></div>
              <div><label class="text-xs block mb-1">配色</label><n-input :value="selectedCharacter.costume.colorPalette" size="small" @update:value="(v: string) => updateCharCostume('colorPalette', v)" /></div>
              <div class="col-span-3"><label class="text-xs block mb-1">配饰</label><n-input :value="selectedCharacter.costume.accessories" size="small" @update:value="(v: string) => updateCharCostume('accessories', v)" /></div>
            </div>
          </div>

          <div class="app-surface p-5">
            <h4 class="font-medium mb-3">表情范围</h4>
            <div class="grid grid-cols-3 gap-4">
              <div><label class="text-xs block mb-1">中性</label><n-input :value="selectedCharacter.expressionRange.neutral" size="small" @update:value="(v: string) => updateCharExpression('neutral', v)" /></div>
              <div><label class="text-xs block mb-1">开心</label><n-input :value="selectedCharacter.expressionRange.happy" size="small" @update:value="(v: string) => updateCharExpression('happy', v)" /></div>
              <div><label class="text-xs block mb-1">思考</label><n-input :value="selectedCharacter.expressionRange.thinking" size="small" @update:value="(v: string) => updateCharExpression('thinking', v)" /></div>
              <div><label class="text-xs block mb-1">坚定</label><n-input :value="selectedCharacter.expressionRange.determined" size="small" @update:value="(v: string) => updateCharExpression('determined', v)" /></div>
              <div class="col-span-2"><label class="text-xs block mb-1">其他（故事特定情绪）</label><n-input :value="selectedCharacter.expressionRange.custom" size="small" @update:value="(v: string) => updateCharExpression('custom', v)" /></div>
            </div>
          </div>

          <div class="app-surface p-5">
            <h4 class="font-medium mb-3">ComfyUI 提示词</h4>
            <div class="space-y-4">
              <div>
                <label class="text-xs font-medium block mb-1">参考表提示词（正面/3/4侧面/表情表）</label>
                <n-input :value="selectedCharacter.referenceSheetPrompt" type="textarea" :rows="4" @update:value="(v: string) => updateChar('referenceSheetPrompt', v)" />
              </div>
              <div>
                <label class="text-xs font-medium block mb-1">中立站姿提示词（用于 IPAdapter 引用）</label>
                <n-input :value="selectedCharacter.standingPosePrompt" type="textarea" :rows="3" @update:value="(v: string) => updateChar('standingPosePrompt', v)" />
              </div>
              <div>
                <label class="text-xs font-medium block mb-1">视觉参考备注</label>
                <n-input :value="selectedCharacter.visualReferenceNotes" type="textarea" :rows="2" @update:value="(v: string) => updateChar('visualReferenceNotes', v)" />
              </div>
            </div>
          </div>
        </div>

        <!-- 环境详情 -->
        <div v-else-if="activeTab === 'environments' && selectedEnvironment" class="space-y-4">
          <div class="app-surface p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold">{{ selectedEnvironment.id }} · {{ selectedEnvironment.name }}</h3>
              <div class="flex gap-2">
                <button class="btn-delete" @click="confirmDeleteAsset('环境', selectedEnvironment.name, () => store.removeEnvironment(selectedEnvironment.id))">删除</button>
                <n-button size="small" @click="closeDetail">关闭</n-button>
              </div>
            </div>
            <div class="grid grid-cols-4 gap-4">
              <div><label class="text-xs block mb-1">名称</label><n-input :value="selectedEnvironment.name" size="small" @update:value="(v: string) => updateEnv('name', v)" /></div>
              <div>
                <label class="text-xs block mb-1">类型</label>
                <n-select :value="selectedEnvironment.type" size="small" :options="[
                  { label: '室内', value: 'interior' }, { label: '室外', value: 'exterior' },
                  { label: '奇幻', value: 'fantasy' }, { label: '科幻', value: 'sci-fi' }, { label: '历史', value: 'historical' },
                ]" @update:value="(v: string) => updateEnv('type', v)" />
              </div>
              <div><label class="text-xs block mb-1">首次出场</label><n-input :value="selectedEnvironment.firstAppearance" size="small" @update:value="(v: string) => updateEnv('firstAppearance', v)" /></div>
              <div><label class="text-xs block mb-1">图片路径</label><n-input :value="selectedEnvironment.imagePath" size="small" @update:value="(v: string) => updateEnv('imagePath', v)" /></div>
            </div>
            <div class="mt-4">
              <label class="text-xs font-medium block mb-1">出现章节</label>
              <n-select
                :value="selectedEnvironment.recurringChapters || []"
                multiple
                size="small"
                placeholder="选择该环境出现的章节"
                :options="chapterOptions"
                @update:value="(v: number[]) => updateEnv('recurringChapters', v)"
              />
            </div>
          </div>

          <div class="app-surface p-5">
            <h4 class="font-medium mb-3">场景描述</h4>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="text-xs block mb-1">位置（时间/天气）</label><n-input :value="selectedEnvironment.description.location" size="small" @update:value="(v: string) => updateEnvDesc('location', v)" /></div>
              <div><label class="text-xs block mb-1">建筑结构</label><n-input :value="selectedEnvironment.description.architecture" size="small" @update:value="(v: string) => updateEnvDesc('architecture', v)" /></div>
              <div><label class="text-xs block mb-1">关键道具</label><n-input :value="selectedEnvironment.description.keyProps" size="small" @update:value="(v: string) => updateEnvDesc('keyProps', v)" /></div>
              <div><label class="text-xs block mb-1">氛围</label><n-input :value="selectedEnvironment.description.atmosphere" size="small" @update:value="(v: string) => updateEnvDesc('atmosphere', v)" /></div>
              <div class="col-span-2"><label class="text-xs block mb-1">机位备注</label><n-input :value="selectedEnvironment.description.cameraNotes" size="small" @update:value="(v: string) => updateEnvDesc('cameraNotes', v)" /></div>
            </div>
          </div>

          <div class="app-surface p-5">
            <h4 class="font-medium mb-3">配色</h4>
            <div class="grid grid-cols-4 gap-4">
              <div><label class="text-xs block mb-1">主色</label><n-input :value="selectedEnvironment.colorPalette.dominant" size="small" @update:value="(v: string) => updateEnvPalette('dominant', v)" /></div>
              <div><label class="text-xs block mb-1">辅色</label><n-input :value="selectedEnvironment.colorPalette.secondary" size="small" @update:value="(v: string) => updateEnvPalette('secondary', v)" /></div>
              <div><label class="text-xs block mb-1">点缀</label><n-input :value="selectedEnvironment.colorPalette.accent" size="small" @update:value="(v: string) => updateEnvPalette('accent', v)" /></div>
              <div><label class="text-xs block mb-1">灯光</label><n-input :value="selectedEnvironment.colorPalette.lighting" size="small" @update:value="(v: string) => updateEnvPalette('lighting', v)" /></div>
            </div>
          </div>

          <div class="app-surface p-5">
            <h4 class="font-medium mb-3">ComfyUI 提示词</h4>
            <div class="space-y-4">
              <div>
                <label class="text-xs font-medium block mb-1">正向提示词（无角色，干净背景）</label>
                <n-input :value="selectedEnvironment.comfyPrompt" type="textarea" :rows="5" @update:value="(v: string) => updateEnv('comfyPrompt', v)" />
              </div>
              <div>
                <label class="text-xs font-medium block mb-1">负向提示词</label>
                <n-input :value="selectedEnvironment.negativePrompt" type="textarea" :rows="3" @update:value="(v: string) => updateEnv('negativePrompt', v)" />
              </div>
            </div>
          </div>

          <div class="app-surface p-5">
            <h4 class="font-medium mb-3">生成参数</h4>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="text-xs block mb-1">画幅</label><n-input :value="selectedEnvironment.generationParams.aspectRatio" size="small" @update:value="(v: string) => updateEnvParams('aspectRatio', v)" /></div>
              <div><label class="text-xs block mb-1">背景</label><n-input :value="selectedEnvironment.generationParams.background" size="small" @update:value="(v: string) => updateEnvParams('background', v)" /></div>
              <div><label class="text-xs block mb-1">推荐节点</label><n-input :value="selectedEnvironment.generationParams.recommendedNodes" size="small" @update:value="(v: string) => updateEnvParams('recommendedNodes', v)" /></div>
              <div><label class="text-xs block mb-1">备注</label><n-input :value="selectedEnvironment.generationParams.notes" size="small" @update:value="(v: string) => updateEnvParams('notes', v)" /></div>
            </div>
          </div>
        </div>

        <!-- 道具详情 -->
        <div v-else-if="activeTab === 'props' && selectedProp" class="space-y-4">
          <div class="app-surface p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold">{{ selectedProp.id }} · {{ selectedProp.name }}</h3>
              <div class="flex gap-2">
                <button class="btn-delete" @click="confirmDeleteAsset('道具', selectedProp.name, () => store.removeProp(selectedProp.id))">删除</button>
                <n-button size="small" @click="closeDetail">关闭</n-button>
              </div>
            </div>
            <div class="grid grid-cols-4 gap-4">
              <div><label class="text-xs block mb-1">名称</label><n-input :value="selectedProp.name" size="small" @update:value="(v: string) => updateProp('name', v)" /></div>
              <div><label class="text-xs block mb-1">类型</label><n-input :value="selectedProp.type" size="small" placeholder="武器/工具/车辆..." @update:value="(v: string) => updateProp('type', v)" /></div>
              <div><label class="text-xs block mb-1">持有者</label><n-input :value="selectedProp.ownerWielder" size="small" @update:value="(v: string) => updateProp('ownerWielder', v)" /></div>
              <div><label class="text-xs block mb-1">首次出场</label><n-input :value="selectedProp.firstAppearance" size="small" @update:value="(v: string) => updateProp('firstAppearance', v)" /></div>
            </div>
            <div class="mt-4">
              <label class="text-xs font-medium block mb-1">出现章节</label>
              <n-select
                :value="selectedProp.recurringChapters || []"
                multiple
                size="small"
                placeholder="选择该道具出现的章节"
                :options="chapterOptions"
                @update:value="(v: number[]) => updateProp('recurringChapters', v)"
              />
            </div>
          </div>

          <div class="app-surface p-5">
            <h4 class="font-medium mb-3">道具描述</h4>
            <div class="grid grid-cols-2 gap-4">
              <div><label class="text-xs block mb-1">形态（形状/尺寸/材质）</label><n-input :value="selectedProp.description.form" size="small" @update:value="(v: string) => updatePropDesc('form', v)" /></div>
              <div><label class="text-xs block mb-1">细节（纹理/雕刻/磨损）</label><n-input :value="selectedProp.description.details" size="small" @update:value="(v: string) => updatePropDesc('details', v)" /></div>
              <div><label class="text-xs block mb-1">功能</label><n-input :value="selectedProp.description.function" size="small" @update:value="(v: string) => updatePropDesc('function', v)" /></div>
              <div><label class="text-xs block mb-1">特性（发光/变形/动画）</label><n-input :value="selectedProp.description.specialTraits" size="small" @update:value="(v: string) => updatePropDesc('specialTraits', v)" /></div>
              <div class="col-span-2"><label class="text-xs block mb-1">比例参考（相对角色大小）</label><n-input :value="selectedProp.description.scaleReference" size="small" @update:value="(v: string) => updatePropDesc('scaleReference', v)" /></div>
            </div>
          </div>

          <div class="app-surface p-5">
            <h4 class="font-medium mb-3">配色</h4>
            <div class="grid grid-cols-4 gap-4">
              <div><label class="text-xs block mb-1">主材质色</label><n-input :value="selectedProp.colorPalette.dominant" size="small" @update:value="(v: string) => updatePropPalette('dominant', v)" /></div>
              <div><label class="text-xs block mb-1">次材质色</label><n-input :value="selectedProp.colorPalette.secondary" size="small" @update:value="(v: string) => updatePropPalette('secondary', v)" /></div>
              <div><label class="text-xs block mb-1">点缀/发光</label><n-input :value="selectedProp.colorPalette.accent" size="small" @update:value="(v: string) => updatePropPalette('accent', v)" /></div>
              <div><label class="text-xs block mb-1">磨损/污渍</label><n-input :value="selectedProp.colorPalette.lighting" size="small" @update:value="(v: string) => updatePropPalette('lighting', v)" /></div>
            </div>
          </div>

          <div class="app-surface p-5">
            <h4 class="font-medium mb-3">ComfyUI 提示词</h4>
            <div class="space-y-4">
              <div>
                <label class="text-xs font-medium block mb-1">正向提示词（白色/简单背景，便于合成）</label>
                <n-input :value="selectedProp.comfyPrompt" type="textarea" :rows="4" @update:value="(v: string) => updateProp('comfyPrompt', v)" />
              </div>
              <div>
                <label class="text-xs font-medium block mb-1">负向提示词</label>
                <n-input :value="selectedProp.negativePrompt" type="textarea" :rows="3" @update:value="(v: string) => updateProp('negativePrompt', v)" />
              </div>
              <div v-if="selectedProp.needsMultiAngle">
                <label class="text-xs font-medium block mb-1">多角度参考表提示词</label>
                <n-input :value="selectedProp.referenceSheetPrompt" type="textarea" :rows="3" @update:value="(v: string) => updateProp('referenceSheetPrompt', v)" />
              </div>
              <n-checkbox :checked="selectedProp.needsMultiAngle" @update:checked="(v: boolean) => updateProp('needsMultiAngle', v)">
                需要多角度参考表
              </n-checkbox>
            </div>
          </div>
        </div>
          </div>
        </div>

        <!-- 右侧操作指引 -->
        <div class="w-64 flex-shrink-0 h-full overflow-y-auto">
          <StepGuide
            :step-number="3"
            step-title="资产定义"
            what-to-do="编辑/确认全局资产（角色/环境/道具）。每个资产定义外观、配色、ComfyUI 生成提示词。资产跨所有章节共享。"
            input-for-a-i="全局资产定义（角色/环境/道具）"
            ai-generates="每个资产的 ComfyUI 生成提示词和参考图"
            backfill-to="Step 4 · 资产生成（导入 JSON）"
            next-step="Step 4 · 资产生成"
            next-route="/step4"
            compact
          />
          <div class="mt-3">
            <AIActionBar
              :on-import="handleImportAssets"
              import-label="导入资产 JSON"
              import-hint="导入全局资产，替换现有资产"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
