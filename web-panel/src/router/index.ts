import { createRouter, createWebHashHistory } from 'vue-router'
import { useProjectStore } from '@/stores/project'

const routes = [
  { path: '/', name: 'projects', component: () => import('@/views/ProjectListView.vue'), meta: { title: '项目列表' } },
  { path: '/dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { step: 0, title: '项目首页', requiresProject: true } },
  { path: '/step1', name: 'step1', component: () => import('@/views/Step1ConfigView.vue'), meta: { step: 1, title: '风格配置', requiresProject: true } },
  { path: '/step2', name: 'step2', component: () => import('@/views/Step2StoryboardView.vue'), meta: { step: 2, title: '分镜脚本', requiresProject: true } },
  { path: '/step3', name: 'step3', component: () => import('@/views/Step3AssetsView.vue'), meta: { step: 3, title: '资产定义', requiresProject: true } },
  { path: '/step4', name: 'step4', component: () => import('@/views/Step4GenerateAssetsView.vue'), meta: { step: 4, title: '资产生成', requiresProject: true } },
  { path: '/step5', name: 'step5', component: () => import('@/views/Step5PagePromptsView.vue'), meta: { step: 5, title: '页面提示词', requiresProject: true } },
  { path: '/step6', name: 'step6', component: () => import('@/views/Step6GeneratePagesView.vue'), meta: { step: 6, title: '页面生成', requiresProject: true } },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const store = useProjectStore()
  if (to.meta.requiresProject && !store.hasCurrentProject) {
    return { path: '/' }
  }
})
