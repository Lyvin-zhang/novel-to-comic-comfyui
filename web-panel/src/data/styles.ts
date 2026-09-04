import type { ArtStyle, Tone, LayoutType, PresetName, AspectRatio } from '@/types'

export interface StyleOption {
  value: ArtStyle
  label: string
  labelEn: string
  description: string
  tags: string
  features: string[]
  bestFor: string[]
}

export const artStyles: StyleOption[] = [
  {
    value: 'manga',
    label: '日漫',
    labelEn: 'Manga',
    description: '日本漫画风格，大眼睛、表情丰富、赛璐璐着色、网点纸',
    tags: 'manga style, anime, cel shading, clean lineart, screentone, flat colors',
    features: ['干净流畅的线条 (1.5-2px)', '大眼睛表情丰富', '5-7头身比例', '速度线与动效', '网点纸氛围'],
    bestFor: ['少年/动作', '恋爱', '日常', '科普教程', '青春题材'],
  },
  {
    value: 'ligne-claire',
    label: '清线',
    labelEn: 'Ligne Claire',
    description: '丁丁历险记风格，粗轮廓线、平涂色、无阴影',
    tags: 'ligne claire, clean bold outlines, flat colors, no shading, Tintin style',
    features: ['清晰粗轮廓线', '平涂色彩无渐变', '无阴影或极简阴影', '简洁几何感', '欧洲漫画传统'],
    bestFor: ['传记/历史', '日常', '旅行', '低幼向'],
  },
  {
    value: 'realistic',
    label: '写实',
    labelEn: 'Realistic',
    description: '写实漫画风格，细腻渲染、软阴影、电影感',
    tags: 'realistic comic, detailed rendering, soft shading, cinematic lighting',
    features: ['细腻人物渲染', '软阴影与渐变', '电影级光影', '真实比例', '场景细节丰富'],
    bestFor: ['历史传记', '悬疑', '科幻', '成人向剧情'],
  },
  {
    value: 'ink-brush',
    label: '水墨',
    labelEn: 'Ink Brush',
    description: '中国水墨毛笔风格，sumi-e笔触、宣纸纹理、水墨晕染',
    tags: 'ink brush style, sumi-e, brush strokes, rice paper texture, ink wash',
    features: ['毛笔笔触变化', '水墨晕染层次', '宣纸纹理质感', '留白意境', '东方美学'],
    bestFor: ['武侠/仙侠', '历史', '诗词意境', '东方奇幻'],
  },
  {
    value: 'chalk',
    label: '粉笔',
    labelEn: 'Chalk',
    description: '粉笔绘画风格，黑板质感、粗糙线条、纹理丰富',
    tags: 'chalk drawing, textured, hand-drawn, blackboard style, rough lines',
    features: ['粉笔粗糙纹理', '黑板深色背景', '手绘感强', '色彩柔和', '怀旧氛围'],
    bestFor: ['教育科普', '怀旧故事', '手绘感创作'],
  },
  {
    value: 'minimalist',
    label: '极简',
    labelEn: 'Minimalist',
    description: '极简风格，简单形状、有限调色板、干净线条',
    tags: 'minimalist comic, simple shapes, limited palette, flat colors, clean lines',
    features: ['简单几何形状', '有限调色板', '干净线条', '大量留白', '扁平化设计'],
    bestFor: ['四格漫画', '概念故事', '现代都市', '抽象主题'],
  },
]

export interface ToneOption {
  value: Tone
  label: string
  description: string
  tags: string
  colorHint: string
}

export const tones: ToneOption[] = [
  { value: 'neutral', label: '中性', description: '平衡自然，适合叙事和科普', tags: 'neutral lighting, balanced colors, natural mood', colorHint: '#9CA3AF' },
  { value: 'warm', label: '温暖', description: '金色暖光，舒适治愈', tags: 'warm lighting, golden hour, orange and amber tones, cozy atmosphere', colorHint: '#F59E0B' },
  { value: 'dramatic', label: '戏剧', description: '高对比深阴影，紧张电影感', tags: 'dramatic lighting, high contrast, deep shadows, cinematic, tense atmosphere', colorHint: '#7C3AED' },
  { value: 'romantic', label: '浪漫', description: '柔光粉彩，梦幻氛围', tags: 'soft lighting, pastel colors, dreamy atmosphere, warm glow', colorHint: '#EC4899' },
  { value: 'energetic', label: '活力', description: '亮色动态角度，速度线高能量', tags: 'bright colors, dynamic angles, speed lines, vibrant, high energy', colorHint: '#10B981' },
  { value: 'vintage', label: '复古', description: '棕褐色调，旧纸怀旧感', tags: 'sepia tones, aged paper, faded colors, retro, nostalgic', colorHint: '#A16207' },
  { value: 'action', label: '动作', description: '动态运动，速度线戏剧角度', tags: 'dynamic motion, speed lines, dramatic angles, intense, high contrast', colorHint: '#DC2626' },
]

export interface LayoutOption {
  value: LayoutType
  label: string
  description: string
  panelRange: string
  bestFor: string
}

export const layouts: LayoutOption[] = [
  { value: 'standard', label: '标准网格', description: '经典漫画网格，3-5格，节奏稳定', panelRange: '3-5 格/页', bestFor: '叙事、对话场景' },
  { value: 'cinematic', label: '电影感', description: '宽幅面板，电影式构图', panelRange: '2-4 格/页', bestFor: '大场景、氛围渲染' },
  { value: 'dense', label: '密集', description: '多格小面板，信息量大', panelRange: '6-9 格/页', bestFor: '快节奏、信息密集' },
  { value: 'splash', label: '跨页大图', description: '单格整页，关键瞬间', panelRange: '1 格/页', bestFor: '高潮、重要时刻' },
  { value: 'mixed', label: '混合', description: '大小形状各异的面板', panelRange: '3-6 格/页', bestFor: '节奏变化、视觉趣味' },
  { value: 'webtoon', label: '条漫', description: '纵向滚动，全宽面板', panelRange: '不限', bestFor: '移动端阅读' },
  { value: 'four-panel', label: '四格', description: '2x2网格，起承转合', panelRange: '4 格/页', bestFor: '搞笑、短篇、段子' },
]

export interface PresetOption {
  value: PresetName | 'none'
  label: string
  description: string
  baseStyle: ArtStyle
  baseTone: Tone
  specialRules: string[]
  suitableGenres: string[]
}

export const presets: PresetOption[] = [
  { value: 'none', label: '不使用预设', description: '自由组合艺术风格和色调', baseStyle: 'manga', baseTone: 'neutral', specialRules: [], suitableGenres: ['自定义'] },
  {
    value: 'ohmsha',
    label: 'Ohmsha 科普',
    description: '日漫+中性，视觉隐喻、道具揭示',
    baseStyle: 'manga',
    baseTone: 'neutral',
    specialRules: ['大量视觉隐喻（神经网络=发光节点等）', '道具/概念揭示面板', '技术图表风格化展示', '友好教育向角色设计'],
    suitableGenres: ['科普', '教育', '技术', '知识漫画'],
  },
  {
    value: 'wuxia',
    label: '武侠',
    description: '水墨+动作，气效果、战斗视觉语言',
    baseStyle: 'ink-brush',
    baseTone: 'action',
    specialRules: ['气/能量效果可视化（内气/外气/气 clash）', '能量颜色按正邪分类', '冲击瞬间5要素（速度线/碎片/冲击波/尘云/衣物后飘）', '速度分级视觉处理', '环境战斗破坏效果', '漂浮粒子与水墨雾气'],
    suitableGenres: ['武侠', '仙侠', '玄幻', '修仙', '古风'],
  },
  {
    value: 'shoujo',
    label: '少女漫',
    description: '日漫+浪漫，装饰元素、眼部细节',
    baseStyle: 'manga',
    baseTone: 'romantic',
    specialRules: ['大眼睛高光细节', '花朵/星光/丝带装饰元素', '柔和粉彩配色', '情绪抽象背景', '华丽对话框设计'],
    suitableGenres: ['恋爱', '言情', '少女', '校园', '治愈'],
  },
  {
    value: 'concept-story',
    label: '概念故事',
    description: '日漫+温暖，视觉符号系统、成长弧光',
    baseStyle: 'manga',
    baseTone: 'warm',
    specialRules: ['贯穿全文的视觉符号系统', '角色成长弧光的视觉化呈现', '象征物反复出现并演变', '温暖金色调贯穿', '概念与叙事交织'],
    suitableGenres: ['成长', '治愈', '日常', '奇幻', '温情'],
  },
  {
    value: 'four-panel',
    label: '四格漫画',
    description: '极简+中性，起承转合结构、黑白+点缀色',
    baseStyle: 'minimalist',
    baseTone: 'neutral',
    specialRules: ['严格2x2四格结构', '起承转合节奏', '黑白为主+单一点缀色', '简洁角色设计', ' punchline 在第四格'],
    suitableGenres: ['搞笑', '日常', '吐槽', '短篇', '段子'],
  },
]

export interface AspectOption {
  value: AspectRatio
  label: string
  description: string
  sd15: string
  sdxl: string
}

export const aspectRatios: AspectOption[] = [
  { value: '3:4', label: '3:4 竖版', description: '标准漫画页，肖像方向', sd15: '512x680', sdxl: '832x1216' },
  { value: '4:3', label: '4:3 横版', description: '风景方向，适合宽场景', sd15: '680x512', sdxl: '1216x832' },
  { value: '16:9', label: '16:9 宽屏', description: '电影宽屏', sd15: '768x432', sdxl: '1344x768' },
  { value: '9:16', label: '9:16 竖屏', description: '条漫/移动端', sd15: '432x768', sdxl: '768x1344' },
  { value: '1:1', label: '1:1 方形', description: '社交媒体方图', sd15: '512x512', sdxl: '1024x1024' },
]

export const cameraAngles = [
  { value: 'eye-level', label: '平视' },
  { value: 'bird-eye', label: '俯视' },
  { value: 'low-angle', label: '仰视' },
  { value: 'close-up', label: '特写' },
  { value: 'extreme-close-up', label: '大特写' },
  { value: 'wide-shot', label: '远景' },
  { value: 'medium-shot', label: '中景' },
  { value: 'over-shoulder', label: '过肩' },
]

export const sharedNegativePrompt = `text, letters, numbers, watermark, signature, blurry, low quality,
distorted, deformed, extra limbs, missing limbs, bad anatomy,
bad hands, extra fingers, fused fingers, cropped, jpeg artifacts,
ugly, duplicate, morbid, mutilated, out of frame, mutation,
3d render, realistic photo, photograph, (text in bubbles:1.3)`
