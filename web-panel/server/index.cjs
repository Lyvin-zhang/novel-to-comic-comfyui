/**
 * Node.js + Express 后端
 * 提供项目数据的 RESTful API
 * 数据库使用 SQLite，文件保存在 data/app.db
 */
const express = require('express')
const cors = require('cors')
const { projectOps, metaOps, dbPath } = require('./db.cjs')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', dbPath })
})

// ============ 项目 CRUD ============

// 获取项目列表
app.get('/api/projects', (req, res) => {
  try {
    const list = projectOps.getAll()
    res.json(list)
  } catch (e) {
    console.error('Get projects error:', e)
    res.status(500).json({ error: e.message })
  }
})

// 获取单个项目
app.get('/api/projects/:id', (req, res) => {
  try {
    const project = projectOps.getById(req.params.id)
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    res.json(project)
  } catch (e) {
    console.error('Get project error:', e)
    res.status(500).json({ error: e.message })
  }
})

// 创建项目
app.post('/api/projects', (req, res) => {
  try {
    const { id, title, createdAt, updatedAt, data } = req.body
    projectOps.create(id, title, createdAt, updatedAt, data)
    res.json({ success: true, id })
  } catch (e) {
    console.error('Create project error:', e)
    res.status(500).json({ error: e.message })
  }
})

// 更新项目
app.put('/api/projects/:id', (req, res) => {
  try {
    const { title, updatedAt, data } = req.body
    projectOps.update(req.params.id, title, updatedAt, data)
    res.json({ success: true })
  } catch (e) {
    console.error('Update project error:', e)
    res.status(500).json({ error: e.message })
  }
})

// 删除项目
app.delete('/api/projects/:id', (req, res) => {
  try {
    projectOps.delete(req.params.id)
    res.json({ success: true })
  } catch (e) {
    console.error('Delete project error:', e)
    res.status(500).json({ error: e.message })
  }
})

// ============ 元数据（当前项目 ID） ============

app.get('/api/meta/current-project', (req, res) => {
  try {
    const id = metaOps.get('currentProjectId')
    res.json({ id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/meta/current-project', (req, res) => {
  try {
    const { id } = req.body
    metaOps.set('currentProjectId', id || '')
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  console.log(`Database file: ${dbPath}`)
})
