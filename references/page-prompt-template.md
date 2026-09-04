# Page Composition Prompt Template (ComfyUI-Friendly)

## Purpose

Generate a per-page composition prompt that references pre-made assets (characters, environments, props) and instructs ComfyUI to assemble a complete comic page. This is the final handoff to the ComfyUI workflow.

## File Naming

```
prompts/{chapter-number}-{chapter-slug}/NN-page-{slug}.md
```

Example: `prompts/01-the-arrival/01-page-arrival.md`, `prompts/00-cover.md` (cover is project-level)

Chapter slug is a short kebab-case version of the chapter title.

## Document Format

```markdown
---
chapter: "Chapter 1: [Chapter Title]"
page: 01
title: [short page title]
layout: [standard / cinematic / dense / splash / mixed / webtoon / four-panel]
aspect: [3:4 / 4:3 / 16:9 / 9:16]
art_style: [manga / ligne-claire / realistic / ink-brush / chalk / minimalist]
tone: [neutral / warm / dramatic / romantic / energetic / vintage / action]
panel_count: [N]
---

# Chapter 1 — [Chapter Title] · Page 01 — [Title]

## Asset References

### Character Assets (IPAdapter / Reference)
| Asset ID | File | Role on This Page | Weight |
|----------|------|-------------------|--------|
| CHAR-01 | assets/characters/[name].png | [what they do] | 0.7-0.9 |
| CHAR-02 | assets/characters/[name].png | [what they do] | 0.7-0.9 |

### Environment Assets (IPAdapter / Background)
| Asset ID | File | Used In Panels | Weight |
|----------|------|----------------|--------|
| ENV-01 | assets/environments/[scene].png | Panels [1,3] | 0.6-0.8 |

### Prop Assets
| Asset ID | File | Used In Panels | Notes |
|----------|------|----------------|-------|
| PROP-01 | assets/props/[item].png | Panel [2] | [held by / on table / etc.] |

---

## Panel Layout

**Layout Type**: [grid / irregular / splash / webtoon scroll]
**Gutter**: [white / black / none], [width in px or relative]
**Border**: [clean black 1-2px / thick / rounded / none]

### Panel 1 — [Size: e.g., 1/2 page, Position: Top]
- **Scene**: [time, location, ENV-ID]
- **Camera**: [angle — bird's eye / low / eye-level / close-up / wide / over-shoulder]
- **Characters**: [CHAR-ID: pose, expression, action, position in frame]
- **Props**: [PROP-ID: where, how used]
- **Environment**: [what's visible, depth layers]
- **Lighting**: [source, direction, quality, color]
- **Text Elements**:
  - Dialogue bubble: "[line]" — speaker: [CHAR-ID], position: [top-left / etc.]
  - Narrator box: 「[text]」 — position: [top / bottom]
  - Sound effect: [SFX text] — style: [bold / shaky / large]
- **Action/Motion**: [what's happening, movement direction]

### Panel 2 — [Size, Position]
...

### Panel N — ...

**Page Hook**: [cliffhanger / transition to next page]

---

## ComfyUI Positive Prompt

```
[STYLE TAG], comic page, [panel count] panels, [layout type] layout,
[GLOBAL STYLE ELEMENTS — lineart, coloring, rendering],

[PANEL 1 DESCRIPTION — scene, characters, action, camera, lighting],
[PANEL 2 DESCRIPTION],
...

[CONSISTENCY TAGS — maintain character appearances, color palette],
[QUALITY TAGS — highly detailed, clean lineart, etc.]
```

## ComfyUI Negative Prompt

```
[shared negative prompt — see below]
```

## ComfyUI Workflow Notes

### Recommended Node Setup
- **Base model**: [model name / checkpoint]
- **IPAdapter**: character assets at weight [0.7-0.9], environment at [0.6-0.8]
- **ControlNet**: [lineart / depth / openpose / none] — [purpose]
- **LoRA**: [style LoRA name] at weight [0.6-1.0]
- **Sampler**: [e.g., DPM++ 2M Karras, 20-30 steps]
- **CFG**: [5-8]
- **Resolution**: [width x height matching aspect ratio]

### Asset Reference Strategy
- Characters: use IPAdapter (face/character reference) or Reference node
- Environments: use IPAdapter (style/content) or as background layer
- Props: composite in post or use IPAdapter with low weight
- If ControlNet available: use layout sketch as control for panel positions

### Post-Compositing
- [ ] Dialogue bubbles added in post (ComfyUI text is unreliable)
- [ ] Sound effects added in post
- [ ] Panel borders/gutters added in post if not generated cleanly
- [ ] Color grading / tone adjustment to match [tone]

---

## Generation Tips

1. **Generate page background first** (no characters) using ENV asset as reference, then composite characters
2. **Or generate full page** with character IPAdapter references — test which gives better consistency
3. **Dialogue text**: do NOT rely on ComfyUI to render readable text. Plan to add bubbles in post (Photoshop/Procreate/ComicDraw)
4. **Panel borders**: if generation messes up borders, generate panels separately and composite in post
5. **Style LoRA**: if you have a style LoRA matching the chosen art style, use it at 0.6-0.8
6. **Batch**: generate 2-3 variants per page, pick the best composition
```

## Shared Negative Prompt

```
text, letters, numbers, watermark, signature, blurry, low quality,
distorted, deformed, extra limbs, missing limbs, bad anatomy,
bad hands, extra fingers, fused fingers, cropped, jpeg artifacts,
ugly, duplicate, morbid, mutilated, out of frame, mutation,
3d render, realistic photo, photograph, (text in bubbles:1.3)
```

## Style Tag Reference

| Art Style | ComfyUI Style Tags |
|-----------|-------------------|
| manga | `manga style, anime, cel shading, clean lineart, screentone, flat colors` |
| ligne-claire | `ligne claire, clean bold outlines, flat colors, no shading, Tintin style` |
| realistic | `realistic comic, detailed rendering, soft shading, cinematic lighting` |
| ink-brush | `ink brush style, sumi-e, brush strokes, rice paper texture, ink wash` |
| chalk | `chalk drawing, textured, hand-drawn, blackboard style, rough lines` |
| minimalist | `minimalist comic, simple shapes, limited palette, flat colors, clean lines` |

## Tone Tag Reference

| Tone | ComfyUI Mood Tags |
|------|-------------------|
| neutral | `neutral lighting, balanced colors, natural mood` |
| warm | `warm lighting, golden hour, orange and amber tones, cozy atmosphere` |
| dramatic | `dramatic lighting, high contrast, deep shadows, cinematic, tense atmosphere` |
| romantic | `soft lighting, pastel colors, dreamy atmosphere, warm glow` |
| energetic | `bright colors, dynamic angles, speed lines, vibrant, high energy` |
| vintage | `sepia tones, aged paper, faded colors, retro, nostalgic` |
| action | `dynamic motion, speed lines, dramatic angles, intense, high contrast` |

## Aspect Ratio → Resolution Guide

| Aspect | ComfyUI Resolution (SD1.5) | ComfyUI Resolution (SDXL) |
|--------|---------------------------|--------------------------|
| 3:4 (portrait) | 512x680 | 832x1216 |
| 4:3 (landscape) | 680x512 | 1216x832 |
| 16:9 (widescreen) | 768x432 | 1344x768 |
| 9:16 (vertical) | 432x768 | 768x1344 |
| 1:1 (square) | 512x512 | 1024x1024 |

## Example: Complete Page Prompt

```markdown
---
page: 03
title: The Confrontation
layout: cinematic
aspect: 3:4
art_style: manga
tone: dramatic
panel_count: 3
---

# Page 03 — The Confrontation

## Asset References

### Character Assets
| Asset ID | File | Role | Weight |
|----------|------|------|--------|
| CHAR-01 | assets/characters/hero.png | Confronting antagonist | 0.85 |
| CHAR-02 | assets/characters/villain.png | Standing defiant | 0.85 |

### Environment Assets
| Asset ID | File | Panels | Weight |
|----------|------|--------|--------|
| ENV-02 | assets/environments/throne-room.png | All panels | 0.7 |

### Prop Assets
| Asset ID | File | Panels | Notes |
|----------|------|--------|-------|
| PROP-03 | assets/props/glowing-sword.png | Panel 3 | Held by CHAR-01 |

---

## Panel Layout

**Layout**: 3 panels — top half (wide), bottom split into two equal panels
**Gutter**: white, 10px
**Border**: clean black 2px

### Panel 1 — 1/2 page, Top
- Scene: throne room, evening, ENV-02
- Camera: wide shot, eye-level
- Characters: CHAR-01 enters from left, CHAR-02 on throne right
- Lighting: dramatic backlight from tall windows, silhouettes
- Text: Narrator box 「三年后，他们终于再次相遇。」 top
- Action: CHAR-01 walking forward, cloak billowing

### Panel 2 — 1/4 page, Bottom-Left
- Scene: same, ENV-02
- Camera: close-up on CHAR-01's face
- Characters: CHAR-01 determined expression, eyes narrowed
- Lighting: side light, half face in shadow
- Text: Dialogue "你不该来这里。" — CHAR-02, off-panel
- Action: CHAR-01 grips sword hilt

### Panel 3 — 1/4 page, Bottom-Right
- Scene: same, ENV-02
- Camera: low angle, medium shot
- Characters: CHAR-01 draws PROP-03, glowing blue blade
- Lighting: sword glow illuminates face, blue cast
- Text: SFX "SNAP!" — bold, jagged
- Action: sword drawn, energy crackles

**Page Hook**: Sword fully drawn, glow intensifies — cut to next page

---

## ComfyUI Positive Prompt

manga style, anime comic page, 3 panels, cinematic layout,
clean lineart, cel shading, screentone, flat colors,

PANEL 1 (top half, wide): throne room interior, evening, tall windows with dramatic backlight,
hero character entering from left in dark cloak, villain on throne at right, silhouettes,
wide shot, eye-level camera,

PANEL 2 (bottom left, close-up): hero face close-up, determined expression, narrowed eyes,
side lighting, half face in shadow, gripping sword hilt,

PANEL 3 (bottom right, low angle): hero drawing glowing blue sword, energy crackling,
low angle medium shot, blue glow on face,

dramatic lighting, high contrast, deep shadows, tense atmosphere,
maintain consistent character appearances, dark throne room color palette,
highly detailed, clean lineart, manga quality
```

## ComfyUI Negative Prompt

text, letters, numbers, watermark, signature, blurry, low quality,
distorted, deformed, extra limbs, bad anatomy, bad hands, extra fingers,
3d render, photograph, (text in bubbles:1.3)

## ComfyUI Workflow Notes

- Base model: [your anime checkpoint]
- IPAdapter: CHAR-01 + CHAR-02 at 0.85, ENV-02 at 0.7
- ControlNet: lineart from layout sketch at 0.6
- LoRA: [your manga style LoRA] at 0.7
- Sampler: DPM++ 2M Karras, 25 steps
- CFG: 6.5
- Resolution: 832x1216 (SDXL 3:4)
- Post: add dialogue bubbles, narrator box, and SFX in post-production
```

## Key Principles for Page Prompts

1. **Asset references come first** — list every asset with ID, file, and weight before describing content
2. **Panel-by-panel breakdown** — each panel gets its own scene, camera, characters, lighting, text
3. **Positive prompt mirrors panel structure** — describe panels in order so the model understands layout
4. **Never expect readable text from ComfyUI** — all dialogue/narration/SFX marked for post-production
5. **Consistency tags** — explicitly remind the model to maintain character and environment consistency
6. **Weights are suggestions** — adjust IPAdapter weights based on your workflow testing
