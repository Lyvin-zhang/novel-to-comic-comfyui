# Environment / Background Asset Template

## Purpose

Define every recurring scene or background location in the comic, then produce a ComfyUI-ready generation prompt for each. These assets are generated standalone (no characters) and later referenced by page composition prompts via IPAdapter / Reference / ControlNet.

## Asset Document Format

Create `assets/environments.md` with the following structure:

```markdown
# Environment Assets - [Comic Title]

**Style**: [selected art style]
**Art Direction**: [overall visual direction]
**Consistency Key**: [shared visual elements across all scenes — e.g., "all interiors use warm tungsten lighting, wooden floors"]

---

## ENV-01: [Scene Name]

**Type**: interior / exterior / fantasy / sci-fi / historical
**First Appearance**: Page [N], Panel [N]
**Recurring Pages**: [list of pages that reuse this scene]

**Description**:
- Location: [where it is, time of day, weather]
- Architecture: [key structural elements — walls, windows, doors, furniture]
- Key Props: [notable objects in the scene]
- Atmosphere: [mood, lighting, color temperature]
- Camera Notes: [typical angles used for this scene]

**Color Palette**:
- Dominant: [hex / color name]
- Secondary: [hex / color name]
- Accent: [hex / color name]
- Lighting: [warm/cool, hard/soft, source direction]

**ComfyUI Prompt**:
```
[positive prompt — see format below]
```

**Negative Prompt**:
```
[negative prompt]
```

**Generation Parameters**:
- Aspect ratio: [e.g., 16:9 for wide backgrounds, 3:4 for vertical]
- Recommended nodes: [IPAdapter for style, ControlNet depth/lineart for layout]
- Notes: [anything special — e.g., "leave center empty for character placement"]

---

## ENV-02: [Scene Name]
...
```

## ComfyUI Prompt Format for Environments

Each environment prompt should follow this structure:

```
[STYLE TAG], [scene type], [location description], [time of day], [weather],
[architecture details], [key props], [lighting description], [color palette],
[atmosphere/mood], [camera angle], [composition], [quality tags]
```

### Example: Anime Style Interior

```
manga style, anime background, cozy bedroom interior, late afternoon, warm sunlight through window,
wooden desk with books and laptop, unmade bed with rumpled sheets, posters on wall,
soft golden hour lighting, warm orange and cream tones, shallow depth of field,
eye-level medium shot, centered composition, highly detailed, clean lineart, flat colors,
no characters, empty room, background asset
```

### Example: Ink-Brush Style Exterior

```
ink-brush style, chinese ink painting, mountain temple exterior, misty morning,
ancient stone stairs leading up to temple gate, pine trees, drifting fog,
soft diffused lighting, muted grey-green and sepia tones, atmospheric perspective,
wide establishing shot, low angle, sumi-e brush strokes, rice paper texture,
no characters, empty scene, background asset
```

## Negative Prompt Template

```
people, person, character, human, face, hands, text, watermark, signature,
blurry, low quality, distorted, deformed, extra limbs, cropped, jpeg artifacts
```

## Environment Types Guide

| Type | Typical Aspect | Key Elements |
|------|---------------|--------------|
| Interior room | 4:3 or 16:9 | Walls, floor, furniture, lighting source, windows |
| Exterior location | 16:9 | Sky, ground, buildings/vegetation, depth layers |
| Fantasy/sci-fi | varies | Unique architecture, magical/tech elements, atmosphere |
| Close-up detail | 1:1 | Specific prop or surface, texture, lighting |
| Establishing shot | 16:9 | Wide view, landmarks, sky, scale reference |

## Consistency Rules

1. **Shared palette** — all environments in the same story arc use a coordinated color palette
2. **Lighting logic** — define a consistent light source direction (e.g., "windows always on left")
3. **Recurring props** — if a prop appears in multiple scenes, define it separately in `props.md` and reference it
4. **Time of day** — mark each scene with time of day so lighting stays consistent across pages
5. **Empty center** — for backgrounds that will have characters composited in, leave the central action area uncluttered

## Why Separate Environment Assets Matter

- ComfyUI generates cleaner backgrounds without characters in the prompt
- You can reuse one environment asset across 5-10 pages, saving generation time
- IPAdapter can reference the environment image to maintain visual consistency
- Characters composited later won't have background style bleeding into them
