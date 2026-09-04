/**
 * HTTP API 客户端
 * 与 Node.js + SQLite 后端通信
 */

const API_BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export interface ProjectSummary {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  artStyle?: string
  tone?: string
  pageCount?: number
  characterCount?: number
}

export interface ProjectData {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  data: any
}

export const api = {
  // 项目列表
  getProjects: () => request<ProjectSummary[]>('/projects'),

  // 获取单个项目
  getProject: (id: string) => request<ProjectData>(`/projects/${id}`),

  // 创建项目
  createProject: (payload: { id: string; title: string; createdAt: string; updatedAt: string; data: any }) =>
    request<{ success: boolean; id: string }>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // 更新项目
  updateProject: (id: string, payload: { title: string; updatedAt: string; data: any }) =>
    request<{ success: boolean }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // 删除项目
  deleteProject: (id: string) =>
    request<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' }),

  // 当前项目 ID
  getCurrentProjectId: () => request<{ id: string | null }>('/meta/current-project'),
  setCurrentProjectId: (id: string | null) =>
    request<{ success: boolean }>('/meta/current-project', {
      method: 'PUT',
      body: JSON.stringify({ id }),
    }),
}
