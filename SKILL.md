---
name: novel-to-comic-comfyui
description: Convert novels/stories into comic production materials with multi-chapter support. Generate storyboards (per chapter), global asset prompts (characters/environments/props shared across chapters), and per-page composition prompts for Krea2 (7-module composition rules, primary path) or ComfyUI workflows. Use when user asks to "小说转漫画", "novel to comic", "漫画分镜", "comic script", "generate comic assets", "Krea2 comic", "ComfyUI comic", or provides a story and wants comic production materials.
version: 2.1.0
metadata:
  source: derived from baoyu-comic (JimLiu/baoyu-skills), customized for asset-based workflow; Krea2 prompt composition rules merged from image-prompt-builder
  changelog: v2.1.0 — merged Krea2 prompt composition rules (7-module structure, composition vocabulary, character turnaround mode) from image-prompt-builder, style system unchanged; v2.0.0 — multi-chapter structure, global shared assets, project dashboard
---

# Novel to Comic — Krea2 / ComfyUI Asset Workflow (v2.1)

Convert a novel or story into complete comic production materials with **multi-chapter support**. Each chapter has its own novel text, storyboard, and page composition prompts. Characters, environments, and props are **global assets shared across all chapters**. The Agent produces all text and prompts; the user generates all images in **Krea2** (primary path — follow `references/krea2-prompt-rules.md`) or their own **ComfyUI** workflow.

## Core Concepts

### Projects & Chapters

- **Project**: The top-level container. Holds global style config, all chapters, and all global assets.
- **Chapter**: Each chapter is an independent unit with its own:
  - Novel text (paste the chapter's content here)
  - Storyboard (panel-by-panel script for this chapter only)
  - Page composition prompts (Krea2 / ComfyUI prompts for this chapter's pages)
- New projects start with one default chapter ("Chapter 1"). Add more chapters as needed.

### Global vs Chapter-Scoped

| Content | Scope | Where defined |
|---------|-------|---------------|
| Art style / tone / layout / aspect ratio | Global (project) | Step 1 |
| Characters / Environments / Props | Global (shared across chapters) | Step 3 |
| Novel text | Per-chapter | Step 1 (chapter management) |
| Storyboard | Per-chapter | Step 2 |
| Page composition prompts | Per-chapter | Step 5 |
| Page generation status | Per-chapter | Step 6 |

### Project Dashboard

After creating or opening a project, land on the **Project Dashboard** which shows:
- Project overview (chapter count, total pages, total words, asset counts)
- 6-step workflow progress
- Chapter list with per-chapter progress and quick-jump buttons
- Global asset summary

From the dashboard, the user can jump directly into any step or any chapter.

## User Input Tools

When this skill prompts the user, follow this tool-selection rule (priority order):

1. **Prefer built-in user-input tools** exposed by the current agent runtime — e.g., `AskUserQuestion`, `request_user_input`, `clarify`, `ask_user`, or any equivalent.
2. **Fallback**: if no such tool exists, emit a numbered plain-text message and ask the user to reply with the chosen number/answer for each question.
3. **Batching**: if the tool supports multiple questions per call, combine all applicable questions into a single call; if only single-question, ask them one at a time in priority order.

## Web Panel Import Format (JSON schema)

The companion web panel (web-panel/) accepts AI-generated drafts via its "导入 JSON" actions. When the user asks for panel-importable output, follow these exact schemas (field names are normalized on import, but producing them directly avoids drift).

**Step 2 — Storyboard** (`top-level { "storyboard": [...] }` or a bare array, imported into the selected chapter):
```json
{ "storyboard": [
  { "pageNumber": 1, "title": "...", "slug": "page-1", "layout": "standard",
    "narrativeLayer": "main|narrator|mixed", "coreMessage": "...",
    "panels": [
      { "panelNumber": 1, "size": "1/3 page", "position": "Top",
        "scene": "...", "camera": "eye-level", "environment": "ENV-01",
        "lighting": "...", "colorTone": "...", "action": "...",
        "characters": [ { "characterId": "CHAR-01", "pose": "...", "expression": "...", "action": "...", "positionInFrame": "..." } ],
        "textElements": [ { "type": "dialogue|narration|thought|caption", "content": "...", "speaker": "CHAR-01", "position": "" } ] }
    ],
    "pageHook": "...", "visualPrompt": "..." }
] }
```

**Step 3 — Global assets** (`{ "characters": [], "environments": [], "props": [] }`, replaces existing assets):
- characters: `id (CHAR-XX), name, role, age, appearance{faceShape,hair,eyes,build,distinguishingFeatures}, costume{defaultOutfit,colorPalette,accessories}, expressionRange{neutral,happy,thinking,determined,custom}, ageVariants?, visualReferenceNotes, referenceSheetPrompt, standingPosePrompt, firstAppearance, recurringChapters[], recurringPages[], needsMultiAngle?(props only)`
- environments: `id (ENV-XX), name, type(interior/exterior/fantasy/sci-fi/historical), description{location,architecture,keyProps,atmosphere,cameraNotes}, colorPalette{dominant,secondary,accent,lighting}, comfyPrompt, negativePrompt, generationParams{aspectRatio,background,recommendedNodes,notes}, firstAppearance, recurringChapters[], recurringPages[]`
- props: `id (PROP-XX), name, type, description{form,details,function,specialTraits,scaleReference}, colorPalette, comfyPrompt, negativePrompt, generationParams, ownerWielder, firstAppearance, recurringChapters[], recurringPages[], needsMultiAngle, referenceSheetPrompt?`
- Note: `generated`/`imagePath` are reset on import; the user fills them in Step 4.

**Step 5 — Page prompts** (`{ "pagePrompts": [...] }` or a bare array, imported into the selected chapter):
```json
{ "pagePrompts": [
  { "pageNumber": 1, "title": "...", "layout": "standard", "aspect": "3:4",
    "artStyle": "manga", "tone": "neutral", "panelCount": 4,
    "assetReferences": {
      "characters": [ { "assetId": "CHAR-01", "file": "path/to/img.png", "role": "...", "weight": "0.8", "panels": "1,2" } ],
      "environments": [ { "assetId": "ENV-01", "file": "...", "panels": "1", "weight": "0.7" } ],
      "props": [ { "assetId": "PROP-01", "file": "...", "panels": "3", "role": "..." } ] },
    "panelLayout": { "layoutType": "grid", "gutter": "white, 10px", "border": "clean black 2px", "description": "..." },
    "panels": [ { "panelNumber": 1, "size": "...", "position": "...", "scene": "...", "camera": "...", "characters": "...", "props": "...", "environment": "...", "lighting": "...", "textElements": "", "action": "..." } ],
    "positivePrompt": "...", "negativePrompt": "...",
    "workflowNotes": { "baseModel": "...", "ipadapter": "...", "controlNet": "...", "lora": "...", "sampler": "...", "cfg": "...", "resolution": "...", "assetStrategy": "..." },
    "postCompositing": [ { "label": "对话气泡（后期添加）", "done": false } ] }
] }
```

`assetReferences` aliases `assetRefs` on import; `workflowNotes` accepts `model`/`ipAdapter`/`controlnet` aliases. Asset IDs must match the project's CHAR-/ENV-/PROP- IDs so the panel's dropdown linking resolves them.

## Workflow Overview

```
Create Project
       │
       ▼
Project Dashboard (overview + chapter list)
       │
       ▼
Step 1: Project Config + Chapter Management
       │  (global art style/tone/layout/aspect; create chapters, paste per-chapter novel text)
       ▼
Step 2: Generate Storyboard (per chapter)
       │  (panel-by-panel script: scene, camera, action, dialogue, narration)
       ▼
Step 3: Extract & Define Global Assets (shared across chapters)
       │  ├─ Characters  → assets/characters.md  + generation prompts
       │  ├─ Environments → assets/environments.md + generation prompts
       │  └─ Props       → assets/props.md       + generation prompts
       ▼
Step 4: User Generates Assets (Krea2 / ComfyUI)  ⬅── user action (Agent waits)
       │
       ▼
Step 5: Generate Page Composition Prompts (per chapter)
       │  (each page references global assets, describes panel layout,
       │   gives Krea2 7-module prompts or ComfyUI positive/negative prompt + workflow notes)
       ▼
Step 6: User Generates Pages (Krea2 / ComfyUI)  ⬅── user action (per chapter)
       │
       ▼
Done: Post-production (dialogue bubbles, SFX, borders) done by user
```

**Key principle**: The Agent never generates images. It produces structured text and prompts. All image generation happens in the user's Krea2 or ComfyUI workflow.

**Chapter principle**: Storyboards and page prompts are per-chapter. Assets are global and shared. When working on Step 2, 5, or 6, always specify which chapter is being processed.

## Progress Checklist

```
Comic Progress:
- [ ] Step 1: Project config + chapter management (engine chosen, chapters created, novel text pasted)
- [ ] Step 2: Generate storyboard (per chapter) → storyboard.md
- [ ] Step 3: Define global assets
  - [ ] 3.1 Characters (assets/characters.md)
  - [ ] 3.2 Environments (assets/environments.md)
  - [ ] 3.3 Props (assets/props.md)
- [ ] Step 4: User generates assets (Krea2 / ComfyUI)  [USER ACTION]
- [ ] Step 5: Generate page composition prompts (per chapter) → prompts/
- [ ] Step 6: User generates pages (Krea2 / ComfyUI)    [USER ACTION]
- [ ] Complete: deliver all text materials
```

## Output File Structure

```
{project-dir}/
├── storyboard.md              # Step 2: all chapters' panel-by-panel scripts (organized by chapter)
├── assets/
│   ├── characters.md          # Step 3.1: global character definitions + generation prompts
│   ├── environments.md        # Step 3.2: global scene/background definitions + generation prompts
│   └── props.md               # Step 3.3: global prop/item definitions + generation prompts
└── prompts/
    ├── 00-cover.md            # Step 5: cover composition prompt (project-level)
    ├── 01-{chapter-slug}/     # Step 5: Chapter 1's page prompts
    │   ├── 01-page-{slug}.md
    │   ├── 02-page-{slug}.md
    │   └── ...
    ├── 02-{chapter-slug}/     # Step 5: Chapter 2's page prompts
    └── ...
```

## Step 1: Project Config + Chapter Management

### 1a. Global Style Configuration

Confirm with the user (batch questions if possible):

| Question | Options | Default |
|----------|---------|---------|
| Generation engine | krea2, comfyui | krea2 |
| Art style | manga, ligne-claire, realistic, ink-brush, chalk, minimalist | manga |
| Tone | neutral, warm, dramatic, romantic, energetic, vintage, action | auto-detect from story |
| Layout | standard, cinematic, dense, splash, mixed, webtoon, four-panel | standard |
| Aspect ratio | 3:4 (portrait), 4:3 (landscape), 16:9, 9:16 (webtoon), 1:1 (square) | 3:4 |
| Target language | zh, en, ja, etc. | user's language |
| Preset (optional) | ohmsha, wuxia, shoujo, concept-story, four-panel | none |

**Generation engine** decides how Step 3 asset prompts and Step 5 page prompts are written:
- `krea2` — follow `references/krea2-prompt-rules.md`: single-paragraph 7-module prompts, composition vocabulary from `references/camera-composition-library.txt`, character turnaround sheet mode for reference sheets. Workflow notes should list resolution/aspect and post-production items instead of ComfyUI nodes.
- `comfyui` — follow `references/page-prompt-template.md` with positive/negative prompts, IPAdapter weights, and workflow notes as before.

**Style vocabulary authority (both engines)**: style and mood tags always come from this skill's style system (`page-prompt-template.md` → Style Tag Reference / Tone Tag Reference), driven by the project's artStyle and tone. Never borrow foreign style defaults from other sources.

**Presets** combine art + tone + special rules. See `references/presets/` for details. If a preset is chosen, load its file and follow its rules.

**Style compatibility**: see `references/auto-selection.md` (if available) for content-signal → style recommendations. When in doubt, recommend based on story genre:

| Genre | Recommended Style | Tone |
|-------|------------------|------|
| Shonen/action | manga | action / energetic |
| Romance | manga / shoujo preset | romantic / warm |
| Wuxia/xianxia | ink-brush / wuxia preset | dramatic |
| Sci-fi | manga / realistic | dramatic / neutral |
| Slice of life | ligne-claire / manga | warm / neutral |
| Comedy | manga / four-panel preset | energetic |
| Biography/history | realistic / ligne-claire | vintage / neutral |

### 1b. Chapter Management

Create and manage chapters. Each chapter holds its own novel text.

**For each chapter**:
- Assign chapter number and title (e.g., "Chapter 1: The Arrival")
- Paste the chapter's novel/story text
- Identify chapter-specific: key scenes, key characters appearing, key locations, key props
- Note the chapter's narrative beat (setup / rising action / climax / resolution / transition)

**Chapter creation guidance**:
- For long novels, split by natural chapter breaks in the source material
- For short stories, one chapter may suffice
- Each chapter should roughly correspond to 5-20 comic pages (adjust based on content density)
- Estimate pages per chapter: ~150-250 words of novel per standard comic page (dialogue-heavy scenes may be fewer)

**Review gate**: Show the chapter list + global style config to the user for approval before proceeding to Step 2.

## Step 2: Generate Storyboard (Per Chapter)

Create `storyboard.md` using `references/storyboard-template.md`. The storyboard is organized **by chapter** — each chapter has its own section containing its pages.

**Work on one chapter at a time.** Always state which chapter is being processed.

For each page within a chapter:
- Assign a layout (vary layouts for rhythm — not every page should be identical)
- Break into panels (3-5 per page standard, fewer for cinematic/splash, more for dense)
- For each panel specify: scene, camera angle, characters (pose/expression/action), environment, lighting, text elements (dialogue/narration/SFX), and page hook
- Include a `Visual Prompt` summary per page (will be expanded in Step 5)

**Storyboard quality bar**:
- Every panel must be visually drawable — no abstract descriptions like "they had a deep conversation"
- Dialogue must be concrete and in-character
- Camera angles must vary (don't use eye-level medium shot for every panel)
- Page endings should hook into the next page (or next chapter for chapter endings)
- Note which assets (CHAR-/ENV-/PROP-) appear in each panel for Step 3 cross-referencing
- For chapter-ending pages, include a hook that bridges to the next chapter

**Review gate**: Show each chapter's storyboard to the user for approval before proceeding to Step 3. If the user wants changes, revise the storyboard. Process chapters sequentially or in batches as the user prefers.

## Step 3: Extract & Define Global Assets (Shared Across Chapters)

**Scan ALL chapters' approved storyboards** to extract recurring assets. Assets are **global** — defined once and shared across all chapters. Only define assets that appear in **2+ panels across any chapter** or are visually significant. One-off background details can be described inline in page prompts.

### 3.1 Characters

Create `assets/characters.md` using `references/character-template.md`.

For each character:
- Assign ID: `CHAR-01`, `CHAR-02`, etc.
- Define appearance (face, hair, eyes, build, distinguishing features)
- Define costume (default outfit, color palette, accessories)
- Define expression range (neutral, happy, thinking, determined, plus story-specific emotions)
- Note age variants if the story spans significant time
- Note which chapters the character appears in (in the panel: the 出现章节 multi-select → `recurringChapters`; in markdown docs: list chapter numbers)
- Write a character reference sheet prompt (front view, 3/4 view, expression sheet)
- Write a prompt for the character in a neutral standing pose (for consistency reference)

**Character prompt format**: follow the template's "Reference Sheet Prompt" section. Add style tags from `references/page-prompt-template.md` → "Style Tag Reference". If the generation engine is `krea2`, write the reference sheet in **turnaround sheet mode** (`references/krea2-prompt-rules.md` → fixed verbatim opening + 8 coverage rules).

### 3.2 Environments

Create `assets/environments.md` using `references/environment-template.md`.

For each recurring location:
- Assign ID: `ENV-01`, `ENV-02`, etc.
- Define type (interior/exterior/fantasy/sci-fi/historical)
- Describe architecture, key props, atmosphere, lighting
- Define color palette and lighting direction
- Write a prompt for the empty environment (no characters)
- Note which chapters/pages/panels use it (chapters → `recurringChapters` in the panel)

**Environment prompt format**: follow the template. Key: generate environments **without characters** so they can be used as clean backgrounds or consistency references. For the `krea2` engine, apply the 7-module structure from `references/krea2-prompt-rules.md` (Module 2 subject becomes "empty scene, no people").

### 3.3 Props

Create `assets/props.md` using `references/prop-template.md`.

For each significant recurring object:
- Assign ID: `PROP-01`, `PROP-02`, etc.
- Define type, form, materials, details, function
- Define color palette
- Write a generation prompt (white/simple background for easy compositing)
- Note owner/wielder and which chapters/pages use it (chapters → `recurringChapters` in the panel)
- For props needing multiple angles, generate a reference sheet prompt

**Review gate**: show all three asset documents to the user. Confirm asset list is complete and prompts look right before the user generates them.

## Step 4: User Generates Assets (Krea2 / ComfyUI)

This is a **user action**. The Agent:
1. Delivers `assets/characters.md`, `assets/environments.md`, `assets/props.md`
2. Reminds the user: generate assets and save them as files (paths will be referenced in Step 5)
3. Waits for the user to confirm assets are ready (or asks for the asset file paths)

**Recommended asset file naming** (tell the user):
```
assets/images/
├── characters/
│   ├── char-01-{name}.png
│   ├── char-01-{name}-sheet.png   (reference sheet, optional)
│   └── ...
├── environments/
│   ├── env-01-{scene}.png
│   └── ...
└── props/
    ├── prop-01-{item}.png
    └── ...
```

## Step 5: Generate Page Composition Prompts (Per Chapter)

Once assets are generated, create one file per page in `prompts/{chapter-number}-{chapter-slug}/` using `references/page-prompt-template.md` (ComfyUI path) or `references/krea2-prompt-rules.md` (Krea2 path).

**Work on one chapter at a time.** Always state which chapter is being processed.

For each page within a chapter:
1. **List asset references** — every character, environment, and prop used on this page, with file path and suggested IPAdapter weight
2. **Describe panel layout** — panel count, sizes, positions, gutter/border style
3. **Break down each panel** — scene, camera, characters (pose/expression/action), props, lighting, text elements, motion
4. **Write the positive prompt** — structured by panel, with style tags, consistency reminders, quality tags
5. **Write the negative prompt** (ComfyUI path only) — use the shared negative prompt from the template
6. **Add workflow notes** — ComfyUI: recommended model, IPAdapter weights, ControlNet suggestions, LoRA, sampler/CFG, resolution, post-production items. Krea2: aspect ratio, reference images (the generated asset files) to attach, and post-production items

**Engine-specific page prompt format**:
- `krea2` — one single English paragraph per panel image, built with the **7-module structure** from `references/krea2-prompt-rules.md` (Camera & Composition first), composition terms from `references/camera-composition-library.txt`. For multi-panel pages, produce one prompt per panel (panels are composited into the page layout in post), or one prompt for the whole page when the layout is splash/single-panel.
- `comfyui` — the positive/negative pair plus IPAdapter-referenced asset files as before.

**Critical rules for page prompts**:
- **Never expect the model to render readable text.** All dialogue, narration boxes, and SFX must be marked for post-production. The prompt should not include dialogue text, and Krea2 prompts must carry the no-text/no-bubble evasion clauses.
- **Reference assets explicitly.** ComfyUI: by file path, plugged into IPAdapter/Reference nodes. Krea2: embed the asset's visual description and tell the user which generated asset image to attach as reference.
- **Panel layout must be unambiguous.** Describe panel sizes and positions so the user can create a layout sketch if needed.
- **Maintain consistency.** Include explicit reminders to match character appearances and environment style.
- **Weights are starting points** (ComfyUI path). Suggest IPAdapter weights (characters 0.7-0.9, environments 0.6-0.8) but note the user should tune.
- **Chapter context.** For the first page of a chapter, include chapter transition context. For the last page, include chapter-ending hook.

**Cover page**: create `prompts/00-cover.md` at the project level with the same structure but a single splash composition. Include title typography notes (to be added in post).

## Step 6: User Generates Pages (Krea2 / ComfyUI, Per Chapter)

User action. The Agent delivers all `prompts/` files. The user, **per chapter**:
1. Sets up the generation workflow — ComfyUI: IPAdapter for character/environment references; Krea2: attach the generated asset images as references
2. Plugs in each page's prompt(s)
3. Generates pages (2-3 variants recommended per page)
4. Adds dialogue bubbles, SFX, and panel borders in post-production

The Agent is available for revisions: regenerate a page prompt, adjust an asset, or tweak the storyboard. Process chapters in any order the user prefers.

## Style Catalog

### Art Styles (6)
Full definitions in `references/art-styles/`:
- `ligne-claire` — clean bold outlines, flat colors, no shading (Tintin style)
- `manga` — anime/manga style, cel shading, screentone
- `realistic` — detailed rendering, soft shading, cinematic
- `ink-brush` — sumi-e brush strokes, ink wash, rice paper texture
- `chalk` — chalk drawing, textured, blackboard style
- `minimalist` — simple shapes, limited palette, clean lines

### Tones (7)
Full definitions in `references/tones/`:
- `neutral`, `warm`, `dramatic`, `romantic`, `energetic`, `vintage`, `action`

### Presets (5)
Full definitions in `references/presets/`:
- `ohmsha` — manga + neutral, visual metaphors, gadget reveals
- `wuxia` — ink-brush + action, qi effects, combat visuals
- `shoujo` — manga + romantic, decorative elements, eye details
- `concept-story` — manga + warm, visual symbol system, growth arc
- `four-panel` — minimalist + neutral, 起承转合 structure, B&W + spot color

### Layouts (7)
Full definitions in `references/layouts/`:
- `standard` — 3-5 panels, grid with variation
- `cinematic` — wide panels, film-like composition
- `dense` — many small panels, information-heavy
- `splash` — one full-page image, key moments
- `mixed` — varying panel sizes and shapes
- `webtoon` — vertical scroll, full-width panels
- `four-panel` — 2x2 grid, 起承转合

## Language Handling

Use the user's language for:
- Chapter titles and novel text
- Storyboard scene descriptions and dialogue
- Asset definitions
- Explanatory notes in prompt files

Use English for:
- All generation prompts — Krea2 single-paragraph prompts and ComfyUI positive/negative prompts (models respond best to English tags)
- Technical terms (IPAdapter, ControlNet, sampler, CFG, Krea2, etc.)

## References

### Core Templates
- `references/storyboard-template.md` — Step 2 storyboard format (chapter-organized)
- `references/character-template.md` — Step 3.1 character asset format
- `references/environment-template.md` — Step 3.2 environment asset format
- `references/prop-template.md` — Step 3.3 prop asset format
- `references/page-prompt-template.md` — Step 5 page composition prompt format (includes style/tone tags, resolution guide, negative prompt, full example)
- `references/base-prompt.md` — generic comic page visual guidelines

### Prompt Composition (Krea2 engine)
- `references/krea2-prompt-rules.md` — Krea2 7-module prompt structure, composition vocabulary rules, evasion clauses, character turnaround sheet mode
- `references/camera-composition-library.txt` — Chinese↔English shot type / camera angle / composition vocabulary for the Camera & Composition module

### Style Definitions
- `references/art-styles/` — 6 art style definitions
- `references/tones/` — 7 tone definitions
- `references/presets/` — 5 preset definitions with special rules
- `references/layouts/` — 7 layout definitions

## Important Notes

- This skill produces **text only**. No image generation is performed by the Agent.
- **Multi-chapter**: Storyboards and page prompts are per-chapter; assets are global and shared across chapters.
- **Generation engine** (`krea2` default / `comfyui`) is chosen in Step 1 and decides prompt format for Steps 3 and 5.
- All generation prompts are in English with structured tags.
- Dialogue and text are always added in post-production — never rely on the model for readable text.
- Asset prompts generate standalone images; page prompts reference those assets (ComfyUI: IPAdapter/ControlNet by file path; Krea2: attach the generated asset image as reference).
- The user drives Steps 4 and 6; the Agent produces materials and waits for confirmation.
- Revise storyboard → assets → prompts in that order. Changing the storyboard may require updating asset definitions and page prompts.
- When working on Step 2, 5, or 6, always specify which chapter is being processed.
- v1.x project data (single-chapter flat structure) is backward-compatible: existing storyboard/page prompts are treated as Chapter 1.
