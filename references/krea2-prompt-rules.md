# Krea2 Prompt Composition Rules

Prompt composition rules for **Krea2 (Krea 2 / Krea2-turbo)**, merged from the `image-prompt-builder` skill and adapted to this skill's style system. Use these rules when writing prompts for the Krea2 generation path — panel images in Step 5, asset images in Step 3, and character turnaround sheets.

**Style vocabulary authority**: all style and mood tags come from THIS skill's style system (`page-prompt-template.md` → Style Tag Reference / Tone Tag Reference). The source skill's xianxia/fantasy defaults do NOT apply here — project artStyle and tone decide the tags.

## Output format

- Single English paragraph, short comma-separated phrases; roughly **350–600 words** for a full image prompt (a sparse panel may drop to ~200 words, but all 7 modules must still be present in order)
- No Chinese, no titles, no explanations, no tables, no lists, no line breaks
- No separate negative-prompt block and no parameter settings — evasion phrases are appended at the END of the paragraph as `no ...` clauses

## The 7-module structure (strict order, comma-separated)

```
[Camera & Composition], [Subject + Action], [Pose], [Lighting], [Scene], [Texture & Detail], [Style & Mood], [evasion clauses]
```

### Module 1: Camera & Composition (put first — Krea2 weights earlier words higher)

- Pick **3–4 terms, never more than 5**. Must contain exactly **1 camera angle/shot type + 1 composition rule + 1 lens parameter**; never combine conflicting lens terms.
- For composition vocabulary, prefer `references/camera-composition-library.txt` (Chinese shot/composition terms from the storyboard must be converted to their English entries there).
- For depth, prioritize `layered composition, foreground framing`.

**Composition conflict control**:
- Never combine `low angle shot` with `high angle shot`
- Never combine `shallow depth of field` with `deep depth of field`
- Never combine `symmetrical composition` with `dynamic composition` unless the user explicitly wants a collision
- Never combine `centered composition` with strong `negative space` unless deliberate blank framing is intended

**Camera angle**: `low angle shot, low vantage point` / `high angle shot, high vantage point` / `dutch angle` / `eye-level shot` / `bird's-eye view` / `worm's-eye view`

**Shot type**: `extreme wide shot` / `wide shot` / `medium shot` / `medium close-up` / `close-up` / `extreme close-up`

**Composition rules**: `rule-of-thirds composition` / `symmetrical composition` / `dynamic composition` / `leading lines` / `negative space` / `layered composition` / `foreground framing` / `diagonal composition` / `centered composition`

**Lens parameters** (very well recognized by Krea2): `shot on 85mm lens f/1.4` (portrait) / `shot on 35mm lens f/2` (environmental portrait) / `anamorphic lens` (cinematic, suits 16:9) / `shallow depth of field` / `deep depth of field` / `bokeh`

**Narrative framing extras**: `subject placed on lower third` / `epic framing` / `sweeping panoramic frame` / `sharp focus on subject, soft blurred foreground`

### Module 2: Subject + Action

Who is in the panel and what they do: identity, age vibe, costume, hairstyle, action. Embed the appearance/costume description from the project's `characters.md` for every CHAR- asset in the panel — never invent new appearance details.

### Module 3: Pose

Body orientation, posture, limb language. Example: `contrapposto pose, body slightly turned, head facing forward, arms relaxed at sides`.

### Module 4: Lighting

Main light direction, hardness, color temperature, special light effects. Take them from the storyboard panel's lighting field plus the project tone's lighting tags (Tone Tag Reference).

### Module 5: Scene

Foreground / midground / background. Embed the matching ENV- asset description from `environments.md`. One-off backgrounds may be described inline.

### Module 6: Texture & Detail

Detail and material quality tags, tuned to the project's art style. Generic high-frequency words: `ultra-high detail, intricate textures, floating dust particles, subtle fabric weave, sharp focus`. Use `PBR rendering, subsurface scattering, skin pore detail` only for the `realistic` style; use `clean linework, flat colors` wording for line-art styles.

### Module 7: Style & Mood

Strictly from this skill's style system:
- **1 main style tag group** from `page-prompt-template.md` → Style Tag Reference, matching the project's `artStyle`
- **1 mood tag group** from Tone Tag Reference, matching the project's `tone`
- Keep only 1 main style + at most 1 auxiliary phrase; never stack synonyms (they dilute each other)

### Module 8 (appended): evasion clauses

```
no text, no logo, no watermark, no speech bubbles, no captions, no lettering, no word balloons, no distorted anatomy, no extra limbs, no duplicated elements, no low-resolution artifacts, no cropped subject
```

The `no speech bubbles / no captions / no lettering / no word balloons` clauses are mandatory in this workflow — all dialogue and narration is added in post-production, never rendered by the model.

## Purpose-specific core keywords

| Purpose | Must-include keywords |
|---|---|
| Comic panel / anime-illustration look | `complete character design, clean cel shading, neat linework, vivid emotional atmosphere` |
| Cover / key visual / concept splash | `complete worldbuilding sense, grand scene scale, epic cinematic composition, immersive environmental detail` |

## Self-check (all must pass before output)

1. Single English paragraph, ~350–600 words, no Chinese/titles/explanations
2. Strict 7-module order, Camera & Composition at the front
3. 3–4 composition terms (≤5), containing shot type + composition rule + lens parameter, no conflicts
4. Project asset descriptions (character appearance/costume, environment) embedded into the correct modules
5. Style module uses exactly the project's artStyle tags + tone tags; no extra stacked style words
6. Evasion clauses appended at the end, including the no-text/no-bubble clauses
7. The prompt contains no dialogue text and never asks the model to render readable lettering

---

## Character turnaround sheet mode (for Step 3.1 reference sheets)

When generating a character reference sheet in Krea2, start with this **fixed opening — verbatim, never modified**:

```
Adopt a professional character concept design sheet layout with a custom split-screen structure, the canvas is divided into two major regional sections: the left area is two vertically stacked equal-size square independent panels, the right area is three horizontally arranged equal-height vertical long independent panels; left top panel is a refined close-up front portrait of the character's full face, left bottom panel is a detailed close-up back view of the character's head showing the full back hair and rear head contour, right first vertical panel is front-view full-body standing pose, right second vertical is side-view full-body standing pose, right third vertical panel is back-view full-body standing pose with the entire back design clearly visible. All panels adopt standard sharp right-angle rectangular borders, with completely straight panel edges, no rounded corners, no circular framing, no oval cropping, no arched or curved panel cutting, presenting a neat and standardized concept sheet layout.
```

Then extend the same paragraph (total ~350–600 words) covering ALL of the following:

1. **Cross-panel consistency**: same outfit, same hairstyle, same color palette, consistent skin tone and unified character proportions, no difference in design details between all views
2. **Head close-ups**: front face panel complete with facial features, expression, skin and eye texture details; back head panel fully displays back hair layering, rear head contour, hair tail structure and back head decoration details
3. **Full-body standing poses**: neutral standing pose, arms relaxed, natural anatomy, full body visible head to toe, no limb distortion, natural standing posture in all three full-body panels
4. **Costume from every angle**: complete front/side/back clothing structure, natural fabric folds, accessory position, clear readable back outfit design, consistent ornament placement across all panels
5. **Layout & borders**: custom five-view layout, left two stacked head panels + right three vertical full-body panels, equal-size independent panels, clean neutral background, all panels use sharp right-angle rectangles, strictly no rounded corners or curved panel edges
6. **Single character, single design**: only one character, no alternate outfit, no extra character, no extra props changing between panels
7. **Clean background**: clean neutral studio background only, no scene narrative, no environment replacement, no decorative clutter
8. **Rendering quality**: high-definition, ultra-detailed, professional character sheet rendering, clear texture, soft studio lighting, sharp line art

Character details (appearance, costume, palette) are taken from the CHAR- entry in `characters.md`. The single rendering style keyword must match the project's artStyle (choose ONE of concept art / anime / realistic equivalents per the Style Tag Reference).

Mandatory closing constraints (append verbatim):

```
no text, no logo, no watermark, no labels, no distorted anatomy, no extra limbs, no inconsistent clothing between panels, no cropped feet or head, no clutter, no low-resolution artifacts, no rounded corners, no circular crop, no oval crop, no curved panel edges, no arched framing, no extra character, no scene background
```

Turnaround self-check:
1. The fixed opening is used verbatim, unmodified
2. One single English paragraph, ~350–600 words
3. Layout strictly: top-left face close-up, bottom-left back-of-head close-up, right side front/side/back full-body
4. All panels are sharp right-angle rectangles — no rounded/curved/circular cropping
5. Outfit, hairstyle, palette, accessories identical across all five views
6. Character complete, uncut, no distortion, no clutter, no text/watermarks
7. Single character, single design, no scene narrative
8. Directly usable in Krea2
