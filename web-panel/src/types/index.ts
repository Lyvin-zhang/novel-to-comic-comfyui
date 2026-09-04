// ============ 项目元信息 ============
export interface ProjectMeta {
  title: string
  artStyle: ArtStyle
  tone: Tone
  layout: LayoutType
  aspectRatio: AspectRatio
  pageCount: number
  language: string
  preset: PresetName | 'none'
  createdAt: string
  updatedAt: string
}

export type ArtStyle = 'manga' | 'ligne-claire' | 'realistic' | 'ink-brush' | 'chalk' | 'minimalist'
export type Tone = 'neutral' | 'warm' | 'dramatic' | 'romantic' | 'energetic' | 'vintage' | 'action'
export type LayoutType = 'standard' | 'cinematic' | 'dense' | 'splash' | 'mixed' | 'webtoon' | 'four-panel'
export type AspectRatio = '3:4' | '4:3' | '16:9' | '9:16' | '1:1'
export type PresetName = 'ohmsha' | 'wuxia' | 'shoujo' | 'concept-story' | 'four-panel'

// ============ 分镜 ============
export interface StoryboardPage {
  id: string
  pageNumber: number
  slug: string
  title: string
  layout: LayoutType
  narrativeLayer: 'main' | 'narrator' | 'mixed'
  coreMessage: string
  panels: Panel[]
  pageHook: string
  visualPrompt: string
}

export interface Panel {
  id: string
  panelNumber: number
  size: string // e.g. "1/2 page", "1/3 page"
  position: string // e.g. "Top", "Bottom-Left"
  scene: string
  camera: CameraAngle
  characters: StoryboardAssetRef[]  // 角色资产引用（含自定义ID）
  environment: StoryboardAssetRef    // 环境资产引用（含自定义ID）
  props: StoryboardAssetRef[]        // 道具资产引用（含自定义ID）
  lighting: string
  colorTone: string
  action: string
  textElements: TextElement[]
}

/**
 * 分镜中的资产引用结构
 * assetId 是基于 项目+章节+类型+名称 生成的确定性唯一ID
 * 用于与 Step 3 定义的全局资产自动匹配
 */
export interface StoryboardAssetRef {
  assetId: string      // 生成的唯一ID，如 char_a1b2c3d4
  name: string         // 资产名称
  description: string  // 在分镜中的描述（姿势/表情/动作/作用等）
}

export type CameraAngle = 'eye-level' | 'bird-eye' | 'low-angle' | 'close-up' | 'wide-shot' | 'over-shoulder' | 'medium-shot' | 'extreme-close-up'

export interface PanelCharacter {
  characterId: string // CHAR-XX
  pose: string
  expression: string
  action: string
  positionInFrame: string
}

export interface TextElement {
  id: string
  type: 'dialogue' | 'narration' | 'thought' | 'caption'
  content: string
  speaker?: string // character id for dialogue
  position?: string
}

// ============ 资产 ============
export interface CharacterAsset {
  id: string // CHAR-01
  name: string
  role: string
  age: string
  appearance: CharacterAppearance
  costume: CharacterCostume
  expressionRange: ExpressionRange
  ageVariants?: AgeVariant[]
  visualReferenceNotes: string
  referenceSheetPrompt: string
  standingPosePrompt: string
  firstAppearance: string
  recurringChapters: number[]
  recurringPages: number[]
  generated: boolean
  imagePath: string
}

export interface CharacterAppearance {
  faceShape: string
  hair: string
  eyes: string
  build: string
  distinguishingFeatures: string
}

export interface CharacterCostume {
  defaultOutfit: string
  colorPalette: string
  accessories: string
}

export interface ExpressionRange {
  neutral: string
  happy: string
  thinking: string
  determined: string
  custom: string
}

export interface AgeVariant {
  label: string
  description: string
}

export interface EnvironmentAsset {
  id: string // ENV-01
  name: string
  type: 'interior' | 'exterior' | 'fantasy' | 'sci-fi' | 'historical'
  description: EnvironmentDescription
  colorPalette: ColorPalette
  comfyPrompt: string
  negativePrompt: string
  generationParams: GenerationParams
  firstAppearance: string
  recurringChapters: number[]
  recurringPages: number[]
  generated: boolean
  imagePath: string
}

export interface EnvironmentDescription {
  location: string
  architecture: string
  keyProps: string
  atmosphere: string
  cameraNotes: string
}

export interface PropAsset {
  id: string // PROP-01
  name: string
  type: string
  description: PropDescription
  colorPalette: ColorPalette
  comfyPrompt: string
  negativePrompt: string
  generationParams: GenerationParams
  ownerWielder: string
  firstAppearance: string
  recurringChapters: number[]
  recurringPages: number[]
  generated: boolean
  imagePath: string
  needsMultiAngle: boolean
  referenceSheetPrompt?: string
}

export interface PropDescription {
  form: string
  details: string
  function: string
  specialTraits: string
  scaleReference: string
}

export interface ColorPalette {
  dominant: string
  secondary: string
  accent: string
  lighting: string
}

export interface GenerationParams {
  aspectRatio: string
  background: string
  recommendedNodes: string
  notes: string
}

// ============ 页面提示词 ============
export interface PagePrompt {
  id: string
  pageNumber: number
  title: string
  layout: LayoutType
  aspect: AspectRatio
  artStyle: ArtStyle
  tone: Tone
  panelCount: number
  assetReferences: AssetReferences
  panelLayout: PanelLayoutConfig
  panels: PromptPanel[]
  positivePrompt: string
  negativePrompt: string
  workflowNotes: WorkflowNotes
  postCompositing: PostCompositingItem[]
  generated: boolean
}

export interface AssetReferences {
  characters: AssetRefItem[]
  environments: AssetRefItem[]
  props: AssetRefItem[]
}

export interface AssetRefItem {
  assetId: string
  file: string
  role: string
  weight: string
  panels?: string
}

export interface PanelLayoutConfig {
  layoutType: string
  gutter: string
  border: string
  description: string
}

export interface PromptPanel {
  id: string
  panelNumber: number
  size: string
  position: string
  scene: string
  camera: string
  characters: string
  props: string
  environment: string
  lighting: string
  textElements: string
  action: string
}

export interface WorkflowNotes {
  baseModel: string
  ipadapter: string
  controlNet: string
  lora: string
  sampler: string
  cfg: string
  resolution: string
  assetStrategy: string
}

export interface PostCompositingItem {
  label: string
  done: boolean
}

// ============ 封面提示词（项目级） ============
export interface CoverPrompt {
  title: string
  aspect: AspectRatio
  artStyle: ArtStyle
  tone: Tone
  positivePrompt: string
  negativePrompt: string
  workflowNotes: WorkflowNotes
  typographyNotes: string
  postCompositing: PostCompositingItem[]
  generated: boolean
}

// ============ 章节 ============
export interface Chapter {
  id: string
  chapterNumber: number
  title: string
  novelText: string
  storyboard: StoryboardPage[]
  pagePrompts: PagePrompt[]
  createdAt: string
  updatedAt: string
}

// ============ 项目整体 ============
export interface ComicProject {
  meta: ProjectMeta
  chapters: Chapter[]
  characters: CharacterAsset[]
  environments: EnvironmentAsset[]
  props: PropAsset[]
  cover?: CoverPrompt | null
}

// ============ 步骤状态 ============
export interface StepStatus {
  step: number
  title: string
  completed: boolean
  description: string
}

// ============ 项目摘要（用于项目列表） ============
export interface ProjectSummary {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  artStyle: string
  tone: string
  pageCount: number
  characterCount: number
  completedSteps: number
}
