# Storyboard Template (v2.0 — Multi-Chapter)

## Storyboard Document Format

```markdown
---
title: "[Comic Title]"
topic: "[topic description]"
narrative_approach: "[chronological/thematic/character-focused]"
recommended_style: "[style name]"
recommended_layout: "[layout name or varies]"
aspect_ratio: "3:4"    # 3:4 (portrait), 4:3 (landscape), 16:9 (widescreen), 9:16 (webtoon)
language: "[zh/en/ja/etc.]"
chapter_count: [N]
total_page_count: [N]
generated: "YYYY-MM-DD HH:mm"
---

# [Comic Title] - Comic Storyboard

**Global Style**: [art style] / [tone] / [layout] / [aspect ratio]
**Asset References**: characters/ · environments/ · props/

---

## Cover (Project Level)

**Filename**: 00-cover-[slug].png
**Core Message**: [one-liner]

**Visual Design**:
- Title typography style
- Main visual composition
- Color scheme
- Subtitle / series notation

**Visual Prompt**:
[Detailed image generation prompt for cover]

---

# Chapter 1: [Chapter Title]

> Chapter novel text: [N] words · Narrative beat: [setup/rising action/climax/resolution/transition]

## Page 1 / [Chapter Page Count]

**Filename**: 01-page-[slug].png
**Layout**: [standard/cinematic/dense/splash/mixed/webtoon/four-panel]
**Narrative Layer**: [main / narrator / mixed]
**Core Message**: [What this page conveys]

### Panel Layout

**Panel Count**: X
**Layout Type**: [grid/irregular/splash]

#### Panel 1 (Size: 1/3 page, Position: Top)

**Scene**: [Time, location]
**Image Description**:
- Camera angle: [bird's eye / low angle / eye level / close-up / wide shot / over-the-shoulder / Dutch angle]
- Characters: [CHAR-01: pose, expression, action; CHAR-02: ...]
- Environment: [ENV-01: scene details, atmosphere]
- Props: [PROP-01: relevant objects]
- Lighting: [atmosphere description, light direction]
- Color tone: [palette reference]
- Motion: [action lines, speed lines, dynamic elements]

**Text Elements**:
- Dialogue bubble (oval): "Character line" — Speaker: [CHAR-01]
- Narrator box (rectangular): 「Narrator commentary」
- Caption bar: [Time/location info]
- Thought bubble (cloud): Character inner monologue
- SFX: [sound effect, e.g., BAM!, whoosh]

#### Panel 2 (Size: 1/3 page, Position: Middle)
...

#### Panel 3 (Size: 1/3 page, Position: Bottom)
...

**Page Hook**: [Cliffhanger or transition at page end. For chapter-ending pages, bridge to next chapter.]

**Visual Prompt**:
[Full page image generation prompt — will be expanded in Step 5]

---

## Page 2 / [Chapter Page Count]
...

---

# Chapter 2: [Chapter Title]

> Chapter novel text: [N] words · Narrative beat: [...]

## Page 1 / [Chapter Page Count]
...

---

# Chapter N: [Chapter Title]
...
```

## Chapter Structure Rules

- Each chapter starts with `# Chapter N: [Title]`
- Chapter header includes: word count, narrative beat
- Pages within a chapter use `## Page X / [Total]`
- Page numbering is per-chapter (resets at 1 for each chapter)
- Chapter-ending pages should include a hook bridging to the next chapter
- First page of a chapter should include chapter transition context

## Cover Design Principles

- Visual appeal reflecting the story's genre and tone
- Title typography matching the art style
- Composition hinting at core theme (key character, iconic symbol, central location)
- Series notation if part of a larger work

## Panel Composition Guidelines

| Panel Type | Recommended Count | Usage |
|-----------|-------------------|-------|
| Main narrative | 3-5 per page | Story progression |
| Establishing shot | 0-1 per page | New location, time jump |
| Close-up | 1-2 per page | Emphasis, reaction, detail |
| Splash (full/half) | Occasional | Major moments, chapter openings |
| Action sequence | 2-4 per page | Fight, chase, dynamic movement |

## Panel Size Reference

- **Full page (Splash)**: Major moments, chapter openings, key reveals
- **Half page**: Important scenes, turning points
- **1/3 page**: Standard narrative panels
- **1/4 or smaller**: Quick progression, sequential action, reaction shots

## Camera Angle Reference

| Angle | Effect | Usage |
|-------|--------|-------|
| Eye level | Neutral, natural | Standard dialogue |
| Low angle | Power, dominance | Hero shots, villains |
| High angle | Vulnerability, overview | Weak characters, establishing |
| Bird's eye | Chaos, scale | Battlefields, crowds |
| Close-up | Emotion, detail | Reactions, important objects |
| Wide shot | Environment, scale | Locations, action scenes |
| Over-the-shoulder | Conversation, POV | Dialogue scenes |
| Dutch angle | Tension, unease | Danger, disorientation |

## Text Element Design

| Text Type | Style | Usage |
|-----------|-------|-------|
| Character dialogue | Oval speech bubble | Main narrative speech |
| Narrator commentary | Rectangular box | Explanation, time passage, inner monologue |
| Caption bar | Edge-mounted rectangle | Time, location info |
| Thought bubble | Cloud shape | Character inner thoughts |
| SFX | Stylized lettering | Sound effects (impact, whoosh, etc.) |
| Shout/yell | Jagged bubble | Loud dialogue, anger |
| Whisper | Dashed bubble | Quiet dialogue, secrets |

## Storyboard Quality Checklist

- [ ] Every panel is visually drawable (no abstract descriptions)
- [ ] Dialogue is concrete and in-character
- [ ] Camera angles vary across panels
- [ ] Character poses and expressions are specified
- [ ] Environment and lighting are described
- [ ] Assets are tagged (CHAR-/ENV-/PROP-)
- [ ] Page endings hook into the next page
- [ ] Chapter endings bridge to the next chapter
- [ ] Text elements are marked for post-production (not in image prompt)
- [ ] Visual Prompt summary is included per page
