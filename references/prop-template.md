# Prop / Item Asset Template

## Purpose

Define every recurring prop, weapon, tool, vehicle, or significant object in the comic, then produce a ComfyUI-ready generation prompt for each. These assets are generated standalone and later referenced by page composition prompts or composited into scenes.

## Asset Document Format

Create `assets/props.md` with the following structure:

```markdown
# Prop Assets - [Comic Title]

**Style**: [selected art style]
**Art Direction**: [overall visual direction]

---

## PROP-01: [Prop Name]

**Type**: weapon / tool / vehicle / furniture / magical item / document / food / other
**First Appearance**: Page [N], Panel [N]
**Recurring Pages**: [list of pages that reuse this prop]
**Owner/Wielder**: [character name, if applicable]

**Description**:
- Form: [shape, size, materials]
- Details: [surface texture, engravings, decorations, wear-and-tear]
- Function: [what it does, how it's used]
- Special Traits: [glowing, animated, transforms, etc.]
- Scale Reference: [compared to a person — e.g., "sword length reaches character's shoulder"]

**Color Palette**:
- Primary material: [hex / color name]
- Secondary material: [hex / color name]
- Accent / glow: [hex / color name, if applicable]
- Wear/dirt: [hex / color name]

**ComfyUI Prompt**:
```
[positive prompt — see format below]
```

**Negative Prompt**:
```
[negative prompt]
```

**Generation Parameters**:
- Aspect ratio: [1:1 for most props, 2:3 for long weapons, 16:9 for vehicles]
- Background: [white / transparent / simple grey — for easy compositing]
- Recommended nodes: [IPAdapter for style, ControlNet if precise shape needed]
- Notes: [e.g., "generate with transparent background for compositing", "multiple angles needed"]

---

## PROP-02: [Prop Name]
...
```

## ComfyUI Prompt Format for Props

Each prop prompt should follow this structure:

```
[STYLE TAG], [prop type], [detailed description], [materials and texture],
[color details], [lighting], [background], [camera angle], [quality tags]
```

### Example: Anime Style Sword

```
manga style, anime weapon design, katana with black lacquered scabbard,
curved blade with hamon line, gold tsuba with cherry blossom motif,
black silk handle wrap, silver blade with subtle blue edge,
studio lighting, white background, product shot, centered,
highly detailed, clean lineart, flat colors, no characters, prop asset
```

### Example: Ink-Brush Style Magical Item

```
ink-brush style, chinese ink painting, ancient jade pendant,
carved dragon motif, translucent green jade, red silk tassel,
gold clasp, subtle glowing aura, soft diffused lighting,
white background, centered composition, sumi-e brush strokes,
rice paper texture, no characters, prop asset
```

### Example: Realistic Style Vehicle

```
realistic style, vintage steam locomotive, brass fittings,
black iron boiler, wooden cabin, spinning wheels,
steam plume, warm golden lighting, neutral grey background,
3/4 view, highly detailed, industrial revolution era,
no characters, vehicle asset
```

## Negative Prompt Template

```
people, person, character, human, hands, face, text, watermark,
signature, blurry, low quality, distorted, deformed, extra parts,
cropped, jpeg artifacts, cluttered background
```

## Prop Types Guide

| Type | Typical Aspect | Key Details |
|------|---------------|-------------|
| Weapon | 2:3 or 1:2 | Blade shape, hilt, materials, wear, special effects |
| Tool / gadget | 1:1 | Function visible, buttons/levers, materials, size |
| Vehicle | 16:9 or 3:2 | Side/3/4 view, key features, scale, condition |
| Furniture | 4:3 | Style, materials, condition, context clues |
| Magical item | 1:1 | Glow effects, symbols, materials, aura |
| Document / book | 3:4 | Cover design, text hints, wear, age |
| Food / drink | 1:1 | Presentation, ingredients, steam/sizzle effects |
| Clothing / accessory | 1:1 or 2:3 | Fabric, pattern, color, wear, layering |

## Multi-Angle Props

For props that appear from different angles across pages, generate a reference sheet:

```
[STYLE TAG], prop reference sheet, [prop name],
multiple views: front view, side view, 3/4 view, close-up detail,
white background, clean labels, consistent lighting,
highly detailed, [style-specific tags]
```

## Consistency Rules

1. **Material consistency** — the same prop always uses the same materials and colors across all appearances
2. **Wear progression** — if a prop gets damaged over the story, define both "pristine" and "damaged" variants
3. **Scale reference** — note the prop's size relative to a character so it doesn't change scale between pages
4. **Glow/effect state** — if a prop has active/inactive states, define both prompts
5. **Owner association** — if a prop is tied to a character, note shared color palette elements

## Why Separate Prop Assets Matter

- Props generated standalone have cleaner detail and no character interference
- A well-designed prop asset can be composited into any scene
- IPAdapter referencing the prop image keeps it visually consistent across pages
- You can generate prop variants (damaged, upgraded, different angle) without regenerating whole pages
