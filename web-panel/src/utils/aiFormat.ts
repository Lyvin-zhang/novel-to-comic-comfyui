import type { ComicProject, Chapter } from '@/types'

/**
 * Step 1: 复制章节原文 + 全局风格配置 → AI 生成分镜
 */
export function formatStep1ForAI(project: ComicProject, chapter: Chapter): string {
  const meta = project.meta

  // 整理已有全局资产列表
  const existingCharacters = project.characters || []
  const existingEnvironments = project.environments || []
  const existingProps = project.props || []

  const assetListSection = `
【已有全局资产（可直接复用，不要重新定义）】
## 角色（已定义 ${existingCharacters.length} 个）
${existingCharacters.length > 0 ? existingCharacters.map(c => `- ${c.id}：${c.name}`).join('\n') : '（暂无）'}

## 环境（已定义 ${existingEnvironments.length} 个）
${existingEnvironments.length > 0 ? existingEnvironments.map(e => `- ${e.id}：${e.name}`).join('\n') : '（暂无）'}

## 道具（已定义 ${existingProps.length} 个）
${existingProps.length > 0 ? existingProps.map(p => `- ${p.id}：${p.name}`).join('\n') : '（暂无）'}
`

  return `=== 漫画分镜生成请求 ===

【项目配置】
标题：${meta.title}
艺术风格：${meta.artStyle}
色调：${meta.tone}
布局：${meta.layout}
画幅：${meta.aspectRatio}
预设：${meta.preset || '无'}
语言：${meta.language}

【当前章节】
章节编号：${chapter.chapterNumber}
章节标题：${chapter.title}
${assetListSection}
【小说原文】
${chapter.novelText || '（未填写原文）'}

【生成要求】
请按照 novel-to-comic-comfyui skill 的分镜模板，为以上章节生成逐页逐格的分镜脚本。
每页字段：pageNumber, title, layout, narrativeLayer, coreMessage, panels[], pageHook, visualPrompt
每格字段：panelNumber, size, position, scene, camera, characters[], environment, props[], lighting, colorTone, action, textElements[]

【重要：资产引用规则】
1. 已有资产复用：分镜中提到上方「已有全局资产」列表中的角色/环境/道具时，必须使用完全相同的名称和 assetId（直接从列表中复制）
2. 新资产：本章节新出现的资产，assetId 字段留空字符串 ""，导入面板时会自动根据名称生成确定性唯一ID
3. 资产引用结构：
   - characters 数组元素：{ "assetId": "", "name": "角色名称", "description": "姿势/表情/动作/画面位置描述" }
   - environment 对象：{ "assetId": "", "name": "场景名称", "description": "环境描述" }
   - props 数组元素：{ "assetId": "", "name": "道具名称", "description": "道具描述" }
4. 名称要准确一致，后续资产定义会通过名称和ID自动匹配
5. 不要在分镜中重新定义已有资产的详细设定，只引用名称和ID即可

输出 JSON 格式，顶层为 { "storyboard": [...] }，便于导入面板 Step 2。
`
}

/**
 * Step 2: 复制全部分镜 → AI 提取全局资产
 */
export function formatStep2ForAI(project: ComicProject): string {
  const meta = project.meta
  const chaptersData = project.chapters.map(c => ({
    chapterNumber: c.chapterNumber,
    title: c.title,
    pages: c.storyboard
  }))
  return `=== 漫画资产提取请求 ===

【项目配置】
标题：${meta.title}
艺术风格：${meta.artStyle}
色调：${meta.tone}

【全部分镜（按章节）】
${JSON.stringify(chaptersData, null, 2)}

【生成要求】
请从以上分镜中提取全局资产，资产跨所有章节共享，只需定义一次。

【重要：资产ID规则】
- 分镜中每个角色/环境/道具都已包含 assetId 字段（格式如 char_a1b2c3d4, env_e5f6g7h8, prop_i9j0k1l2）
- 你生成的资产 JSON 中，id 字段必须与分镜中对应的 assetId 完全一致
- 绝对不要自己生成 CHAR-01, ENV-01, PROP-01 这样的编号
- 同一个名称的资产在不同分格中出现时，assetId 必须相同
- 按 assetId 去重，只定义一次

- 只定义出现 2+ 格或视觉上重要的资产，一次性背景细节不用定义
- 角色字段：id(必须使用分镜中的assetId), name, role, age, appearance{faceShape,hair,eyes,build,distinguishingFeatures}, costume{defaultOutfit,colorPalette,accessories}, expressionRange{neutral,happy,thinking,determined,custom}, visualReferenceNotes, referenceSheetPrompt, standingPosePrompt, firstAppearance, recurringChapters(章节编号数组), recurringPages(页码数组)
- 环境字段：id(必须使用分镜中的assetId), name, type(interior/exterior/fantasy/sci-fi/historical), description{location,architecture,keyProps,atmosphere,cameraNotes}, colorPalette{dominant,secondary,accent,lighting}, comfyPrompt, negativePrompt, generationParams{aspectRatio,background,recommendedNodes,notes}, firstAppearance, recurringChapters, recurringPages
- 道具字段：id(必须使用分镜中的assetId), name, type, description{form,details,function,specialTraits,scaleReference}, colorPalette, comfyPrompt, negativePrompt, generationParams, ownerWielder, firstAppearance, recurringChapters, recurringPages, needsMultiAngle
- comfyPrompt 为英语生成提示词（Krea2 走 7 模块结构，ComfyUI 走标签式），用于生成独立资产图片
输出 JSON 格式：{ "characters": [], "environments": [], "props": [] }，便于导入面板 Step 3。
`
}

/**
 * Step 4: 复制资产图片 + 当前章节分镜 → AI 生成页面提示词
 */
export function formatStep4ForAI(project: ComicProject, chapter: Chapter): string {
  const meta = project.meta
  return `=== 漫画页面提示词生成请求 ===

【项目配置】
标题：${meta.title}
艺术风格：${meta.artStyle}
色调：${meta.tone}
布局：${meta.layout}
画幅：${meta.aspectRatio}

【当前章节】
章节编号：${chapter.chapterNumber}
章节标题：${chapter.title}

【全局资产（含图片路径）】
## 角色
${JSON.stringify(project.characters, null, 2)}

## 环境
${JSON.stringify(project.environments, null, 2)}

## 道具
${JSON.stringify(project.props, null, 2)}

【本章分镜】
${JSON.stringify(chapter.storyboard, null, 2)}

【生成要求】
请为以上章节的每页生成页面构图提示词，逐页输出。
每页字段：pageNumber, title, layout, aspect, artStyle, tone, panelCount, assetReferences, panelLayout{layoutType,gutter,border,description}, panels[], positivePrompt, negativePrompt, workflowNotes, postCompositing[]
- assetReferences 结构：{ characters: [{assetId, file, role, weight, panels?}], environments: [{assetId, file, panels?, weight}], props: [{assetId, file, panels?, role?}] }，assetId 必须使用上方全局资产中的 id 字段（格式如 char_a1b2c3d4, env_e5f6g7h8, prop_i9j0k1l2），不要自己生成新ID
- positivePrompt 用英语：ComfyUI 走标签式（风格标签、面板描述、一致性提醒、质量标签）；Krea2 走 7 模块单段结构（构图镜头置顶，见 krea2-prompt-rules）
- negativePrompt 使用共享负向提示词（low quality, blurry, deformed, text, watermark 等）
- workflowNotes 字段：{baseModel, ipadapter, controlNet, lora, sampler, cfg, resolution, assetStrategy}；ComfyUI 建议权重（角色 0.7-0.9，环境 0.6-0.8），Krea2 改为标注参考图
- postCompositing 数组项：{label, done}，至少包含对话气泡、音效文字、面板边框
- 不要在正向提示词中包含对话文字，所有文字后期添加
输出 JSON 格式：{ "pagePrompts": [...] }，便于导入面板 Step 5。
`
}
