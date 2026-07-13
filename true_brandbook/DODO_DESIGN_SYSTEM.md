# Dodo Pizza — Consolidated Design System for On-Brand Layout Generation

*Synthesized from brandbook.dodopizza.info (public brand book) and shift.dodobrands.io (Design Shift, the authoritative internal design system). Where the two disagree, Shift wins — it is the living spec. Many Shift topic pages are index hubs with no concrete values; the load-bearing numbers below come from a small set of spec pages, flagged inline.*

---

## 1. Brand essence & tone of voice

**Positioning line:** *"We'll take care of the pizza while you take care of what's important."* Communication splits into **Function** (products, app UI, SMS, kiosks — simple, clear, direct) and **Emotion** (social, campaigns — warm, caring, witty). [shift: /brand, /digital-ad-layouts, /producing]

**Voice:** open, honest, plain, conversational, modern, witty-but-never-sarcastic, humble-not-boastful — "a real person, not an idealized image." Core value formula **ДОДОК** = Accessibility, Responsiveness, Trust, Openness, Quality. Address the customer with the formal "you." Laugh *with* people, never *at* them. [brandbook /en, /digital-en; shift /producing]

**How to describe food — DO:** concrete, sensory, measurable attributes as if briefing a kitchen — *crispy, stretchy, fresh, firm, golden, hot, flavourful*. Use real product/recipe names (Margarita, Double Pepperoni, Hawaiian). [shift: /communication-standards, /graphic-design, /digital-ad-layouts]

**How to describe food — DON'T:** abstract/luxury words (*exquisite, refined, sophisticated, delicate, bold, legendary*), sensual/hedonistic framing (*forbidden pleasure, treat yourself*), aggressive hype (*Bomb!, Explosive!, Buy now 3-2-1!*), "secret ingredients," or sacralizing the recipe. No fine print / tiny-font tricks. [brandbook /en; shift /communication-standards, /digital-ad-layouts]

**Framing:** pizza is **everyday and convenient**, not indulgence or reward — rational contentment and time-saving over escapism. **One message per layout.** [shift /communication-standards, /digital-ad-layouts]

**People:** real and diverse (all incomes, jobs, ages, ethnicities, body types) shown as **active decision-makers** in recognizable everyday contexts (office lunch, dinner with friends), natural relaxed poses, genuine restrained emotion ("fulfillment, not sensual pleasure; joy, not wild fun"). Avoid idealized/over-groomed models, staged posing, subjects looking at the lens. [shift /communication-standards, /menu, /producing]

**Hard bans:** politics, religion, controversial/mourning topics; alcohol/tobacco/vape/gambling/betting partners; warfare, graphic violence, realistic blood; fantasy worlds, unrealistic physics, escapist scenes; "creativity for creativity's sake." [shift /communication-standards, /digital-ad-layouts]

---

## 2. Color

**Authoritative palette** — from the Shift Visual Style spec page (/topic/infoplanning), the one page that exposed a full hex list.

### Primary
| Role | Name | Hex | Notes |
|---|---|---|---|
| **Hero brand** | Fiery / Burnt Orange | **`#FF4E00`** | RGB 255,78,0 · Pantone 1505 · CMYK 0,75,100,0. The signature color. Aim to be "**maximally orange**." |

> **Hex conflict — resolved.** Public brand-book pages repeatedly cite **`#FF6900`** (RGB 255,105,0, Pantone 1505U). The authoritative Shift color spec and the MENA/graphic-design specs both give **`#FF4E00`** (RGB 255,78,0), and the /en/brand page explicitly says to use `#FF4E00`. **Use `#FF4E00`.** Treat `#FF6900` as legacy. [shift /brand, /infoplanning, /graphic-design vs. brandbook /en, /design, /digital-en]

### Neutrals
| Name | Hex | Use |
|---|---|---|
| Black | `#000000` | Text, plates |
| White | `#FFFFFF` | Text on dark/orange, surfaces |
| Light Beige / Cream | `#FBF3E6` | Warm background (RU) |
| Beige (MENA) | `#F9F1E6` (≈`#FAF0E1`) | MENA background |
| Misty White / Light Gray | `#F2F2F6` | Neutral surface |
| Old-price Grey | `#949598` (≈`#96969B` MENA) | Struck-through prices only |

### Product-line sub-palettes (positioning tiers)
| Tier | Base | Full ramp (from MENA graphic-design spec) |
|---|---|---|
| **For You** (yellow) | `#FFC805` / `#FFC600` | `#FFEBA5`, `#FFD542`, `#FFB200` |
| **For Friends** (green) | `#B9D246` / `#BAD149` | `#D2E478`, `#A6BA40`, `#72841B` |
| **For Family** (orange) | `#FF4E00` | `#FF9042`, `#FF8028`, `#F84A00` |

### Accents (category-specific — drinks, desserts, seasonal only)
Sky Blue `#50D7FF` · Berry/Blueberry Purple `#675BD8` · Neon Lime `#D1FE3C` · Pastel Pink `#FCE3F8` · Azure Blue `#0578FE`. [shift /infoplanning]

### Usage rules
- **Text-on-color:** white text on orange/dark; black text on light; orange allowed as accent text. [shift /infoplanning]
- **Buttons & price plates:** pill-shaped, **no stroke/outline**, built only from the white/black/orange trio. Dark bg → orange plate + white text, or white plate + orange text. Light bg → orange or black plate + white text. [shift /infoplanning]
- Combine colors by **contrast** (lightness / warmth / saturation / complementary), not arbitrary swatches. Warm colors advance, cool recede. Full-saturation primary clashes are "too tense" for food ads. [shift /producing, /keyvisual-compilation]
- Once a palette is harmonious, **don't add unrelated chromatic colors** — only black may be added. [shift /graphic-design, /producing]
- **Region matters:** MENA and Kids Parties carry their own palettes — don't assume one global set. [shift /smm, /dubai]

---

## 3. Typography

**Important distinction the sources make:**
- **Dodo Rounded** (proprietary rounded sans, 80–90+ languages incl. full Cyrillic) is the **corporate font for body / UI / captions / everything except legal**, across all markets. [brandbook /en, /design, /digital-en; shift /digital-ad-layouts]
- **Headlines/accents** use a heavier display face: **Dodo Rounded Black**, or the **regional headline font**:
  - **Rooftop** — Russia, Belarus, Western Europe. Weights: **Extrabold** (headlines), **Medium** (subheads), **Ultra Condensed Regular** (legal). [shift /infoplanning]
  - **TT Interphases Pro** (Black/Bold/Demibold) — Kazakhstan Cyrillic, paired with Rooftop bilingually. [shift /infoplanning]
  - **MENA:** Rooftop Extrabold/Bold/Medium; secondary TTHoves, TTHoves Cond, Grenette; **Ropa Arabic** for Arabic; MENA sets text/titles **uppercase**. [shift /graphic-design]

> The public brand book advertises "Dodo Rounded, single corporate font"; Shift reveals the real headline layer is Rooftop (regional). Both are correct at different layers. **Roboto seen on the brandbook website is site chrome, NOT a brand font.** [brandbook /digital-en]

### Hierarchy (four roles — consistent across every Shift page)
**Heading → Subline → Caption → Legal.** [shift /make-basic-layouts, /digital-ad-layouts, /menu, /infoplanning]

| Role | Rules |
|---|---|
| **Heading** (largest) | Max **4 lines** (optimal 2). Single word → **bold**; multi-line → **weight ~500** (bold is too heavy multi-line). Case: lowercase-with-initial-cap, OR **ALL CAPS only for 1–2 lines** with character width **compressed to 55–65%**. Line-spacing **80–90%** for 1–2 lines, **100%** for 3+. Letter-spacing −25 to 0 (tighter for short/large). |
| **Subline** (sablaine) | Medium or slightly thinner. Lowercase with initial cap, **no trailing period**. Line-spacing ~**85%**. **Left-aligned or centered only — never right-aligned** (max 3 lines if centered). Gap to heading slightly larger than heading's internal line-spacing. |
| **Caption** | Third tier, smaller, same rules. "New/Novelty" captions **always sit on a plate/pill** and may be fully capitalized. |
| **Legal (ligal)** | Regular-style **ALL CAPS**, character width **compressed to 40%**, **85% opacity** over photos, justified with auto-hyphenation, last line not justified. Set in Rooftop Ultra Condensed / Dodo Rounded. |

**Prices:** hero ("beacon") price **1.5–2×** headline size; standard prices **70–80%**; premium items often omit price. "от"/currency symbol at **2/3 digit height, top-aligned, no superscript**; use U+2212 minus for discounts. [shift /infoplanning]

**Typographic detail:** guillemets « » for quotes; spaced em-dash U+2014; en-dash U+2013 in legal; thin space U+2009 before currency; protect prepositions from line-breaks; avoid orphans. [shift /brand]

**Web-generation fallback:** Dodo Rounded and Rooftop are proprietary and not web-served. For HTML output, use a **rounded-geometric sans stack** (e.g. Nunito / Baloo 2 / Varela Round / `system-ui` rounded) as a stand-in and keep the hierarchy rules exactly. State this substitution — do not claim the real fonts are present.

---

## 4. Logo & marks

**Mark:** 3D volumetric dodo-bird forming the letter **"D."** Variants: volumetric & flat; with/without descriptor; standalone **"D"**; **circular avatar** (rounded or gradient) for digital/social. Named lockups: **Main/Two-Lines** (default), **Tall** (vertical signage/flags), **Line** (horizontal banners/facade), **Wordmark** (tiny elongated objects), **Sign/bird** (social & special). RGB assets for screen, CMYK for print. Six languages (RU, EN, TR, KA, HY, AR). [brandbook /digital-en; shift /infoplanning, /graphic-design]

**Preferred approach (Shift):** **weave "Dodo" / "Dodo Pizza" into the headline/body copy** rather than dropping a standalone lockup; use the classic lockup only when integration is impossible; descriptor-only on packaging. [shift /infoplanning]

**Clear space:** ≥ **1/4 of the logo's height** on all sides. [shift /brand, /infoplanning]

**Placement/sizing:** logo is **mandatory on every layout** (statics and video). On MENA layouts it lives in the **footer, combined with supporting info into one block**; min size with bird = **15 mm**, below that simplify to the orange "D." Place in user-visible zones (e.g. top of OOH). Co-brand with a **multiplication sign ×**, Dodo Pizza listed first, equal visual weight. [shift /graphic-design, /digital-ad-layouts, /infoplanning]

**Don'ts:** don't shrink to illegibility or blow up disproportionately; don't cover more than **1/3 of adjacent text**; **never crop at layout edges**; don't break the single recognizable image when localizing; don't right-align. [shift /infoplanning]

---

## 5. Layout & composition

**Rectangular-module system** (the single strongest, most-repeated layout rule). The ad format is a rectangle subdivided into smaller stacked rectangles **without remainder**, all aligned to a **left flag** (left edges). [shift /graphic-design, /digital-ad-layouts, /menu, /producing]

**Alignment:** **left-aligned or center-aligned ONLY — never right-aligned, never justified** (except legal). Centering is discouraged for headings/body (creates imbalance); reserve it for short sublines/captions. Alignment must be **perfect or a deliberately obvious gap — never "almost aligned."** [shift /menu, /infoplanning, /producing]

**Margins / safe-field (concrete):**
- Safe-field / margin width = **longest layout dimension ÷ 25** (ultra-narrow formats **÷ 50**). [shift /brand, /infoplanning]
- **Never place text flush to format edges** (print crop risk). [all layout pages]
- **Critical whitespace law:** internal spacing between blocks must be **smaller than** the block-to-edge margin — if inner spacing exceeds outer margin the layout "falls apart." [shift /menu, /digital-ad-layouts, /producing]
- **Bottom margin slightly larger than top** (visual-weight balance). [shift /graphic-design, /menu, /producing]

**Hierarchy & reading order:** rank meaning first via **"informational planning" — a 3-step prioritization algorithm** (decide primary/secondary/tertiary before styling). Place blocks in natural **left-to-right, top-to-bottom** order (EN/RU/TR); big heading → subline → caption/details → legal. Never make the eye hunt. Hierarchy is also driven by **scale**, especially price. [shift /make-basic-layouts, /infoplanning, /digital-ad-layouts]

**Proximity & counter-space:** related blocks (heading+subline) stay close but not merged; counter-space both separates and unites. Elements should **clearly overlap or sit at a clear distance** — avoid near-touching "crackling" contacts. [shift /digital-ad-layouts, /graphic-design]

**Product proportions:** use a **300 ml paper cup** as the size reference for all products. Overlap items for a "solid" composition (smaller item in front partially overlapping larger; drinks overlap the non-filling edge of sandwiches; a "floating stack" works for pizza boxes). Product should **occupy the majority of the frame.** [shift /menu, /graphic-design, /producing]

**Fast vs slow zones:** match information density to viewer contact time — **fast zones** (a glance) carry only the single most necessary, simple message; **slow zones** can hold detail. [shift /make-basic-layouts, /channels-and-media]

**Signature detail:** **rounded corners everywhere** — buttons, icons, bars, plates, QR codes. Arrows drawn as smooth curves, no creases. [shift /digital-ad-layouts]

**Per-format:** grids and safe zones are **format-specific** (TV menu, cashier display, OOH, packaging, in-app stories all differ) — don't apply one universal grid. Check the layout on a mockup and, where possible, the real surface. [shift /editorial-policy, /work-with-files]

**Mandatory elements on every promo layout:** one key message/CTA · logo · required legal info · partner copyrights where relevant. [shift /digital-ad-layouts]

---

## 6. Imagery

**Core principle — honest, un-retouched, real:** "honest photos without Photoshop." Show the product **exactly as the customer receives it**; never inflate expectations. [brandbook /en; shift /graphic-design, /digital-ad-layouts, /producing]

**Product is the hero:** large, occupying most of the frame, shown **hot and alive** — steam, stretching/melting cheese, "plastic" pull slices, real crumbs, sauce drips/drops, condensation on cold drinks, **opened packaging with fillings visible**, drink lids open, hands not obscuring it. [shift /infoplanning, /digital-ad-layouts]

**Imperfection is a feature:** slightly crumpled (not torn) paper, natural wrinkles, imperfect vegetables, uneven meat beat sterile styling. Sit food on **parchment / kraft or familiar mass-market dishware — never floating in air.** [shift /infoplanning, /communication-standards]

**Background:** must contrast the product by **lightness / temperature / saturation** but stay simple and non-busy; homogeneous behind text for readability. Branded surface cues: white speckled tables (**internal** comms), orange furniture/tables/chairs (**external** comms), light wood, aluminum/kitchen surfaces, or monochrome backdrop with shadow. [shift /brand, /infoplanning, /producing]

**Six prebuilt textures**, chosen by product type: **kraft cardboard** (base product cards), **crumb** (combos/simple), **water** (refreshing drinks), **metal** (premium/tech), **sky** (seasonal/fresh), **orange table** (pizzeria context / high brand visibility). [shift /infoplanning]

**People / lifestyle:** candid, in-motion, real context, **subjects not looking at the camera**; natural light; diverse charismatic real people (real chefs/guests) with contextual props (backpack+books, laptop+notepad, yoga mat). No studio setups, no posing, restrained genuine emotion. [shift /menu, /producing, /communication-standards]

**Retouching — three distinct pipelines, don't use one recipe:** [shift /retouching]
- **Catalog:** full rigor — RAW develop, crop, **per-ingredient masks**, color-correct, contrast/volume, blemish retouch, remove unwanted elements, sharpen, refine shape & shadows.
- **Layout / Key Visual:** art-directed — add **"reflexes" (reflected highlights) in Photoshop** so product sits believably in the composition.
- **SMM/social:** lightest touch, "simple and natural."
- Universal cap: **moderate only — don't "overcook" the picture**; keep natural colors, shadows, light. Add steam to hot food, crumbs to sliced product where it reads true. [shift /digital-ad-layouts, /producing]

**Illustration & other:** rounded-corner icon system and 3D asset library (gifts, rewards, order fulfillment) for abstract concepts; pop-culture collab KVs are an established format (Cyberpunk, Batman, Dune, Honkai); dodo-bird mascot for launches, promos, kids' events. Pull elements from the **current Elements Library**, not old layouts. QR codes: rounded corners, **print only**. [brandbook /digital-en; shift /infoplanning, /digital-ad-layouts]

**AVOID:** cold geometrically-perfect pizza, floating/fantasy compositions, heavy post-processing (blur/glare/effects), collages, pretentious restaurant staging, excessive decor/packaging, dark-wood interiors without brand elements, over-saturated "plastic" food. [shift /brand, /graphic-design, /infoplanning, /communication-standards]

---

## 7. Master DO / DON'T list (consolidated, deduped)

### DO
1. Lead with **`#FF4E00`** as the dominant color; aim "maximally orange." *(shift /infoplanning)*
2. **One message / one CTA per layout.** *(shift /digital-ad-layouts)*
3. Build on **rectangular modules**, subdivided without remainder, **left-flag aligned**. *(shift, all layout pages)*
4. Align **perfectly** or leave a **deliberate obvious gap**. *(shift /menu)*
5. Margins = **longest side ÷ 25** (÷50 ultra-narrow); keep text off the edges. *(shift /infoplanning)*
6. **Inner spacing < edge margin; bottom margin > top.** *(shift /menu, /producing)*
7. Hierarchy first via 3-step informational planning: **Heading → Subline → Caption → Legal**. *(shift /make-basic-layouts)*
8. Headline max 4 lines; single word bold, multi-line ~500; ALL-CAPS compressed **55–65%**; line-spacing **80–90%** short / 100% long. *(shift /digital-ad-layouts, /infoplanning)*
9. Sublines: no trailing period; left or center only. *(shift /menu)*
10. Product = **hero**, majority of frame, hot/alive, opened, on parchment/dishware; contrast against a simple background. *(shift /infoplanning, /graphic-design)*
11. Scale price for hierarchy (hero 1.5–2×, standard 70–80%). *(shift /infoplanning)*
12. **Rounded corners** on all buttons/icons/plates; pill price plates, no stroke, white/black/orange only. *(shift /digital-ad-layouts, /infoplanning)*
13. Real sensory copy (crispy, hot, stretchy, golden) + real recipe names. *(shift /communication-standards)*
14. Diverse real people, active, candid, not facing camera. *(shift /communication-standards, /menu)*
15. Include logo + required legal on every promo; prefer weaving "Dodo" into copy over a standalone lockup; keep ≥1/4-height clear space when a lockup is used. *(shift /infoplanning, /digital-ad-layouts)*
16. Use Dodo Rounded for body; Rooftop Extrabold (or Dodo Rounded Black) for headlines. *(shift /infoplanning)*
17. Pick a texture by product type (kraft/crumb/water/metal/sky/orange-table). *(shift /infoplanning)*

### DON'T
1. Don't use `#FF6900` (legacy) — use `#FF4E00`. *(shift /brand)*
2. Don't **right-align or justify** (except legal). *(shift /infoplanning)*
3. Don't set text flush to edges; don't let inner spacing exceed the edge margin. *(shift /menu, /producing)*
4. Don't "almost align." *(shift /menu)*
5. Don't put multiple competing messages on one layout. *(shift /digital-ad-layouts)*
6. Don't set multi-line headings bold, exceed 4 heading lines, or ALL-CAPS without 55–65% compression. *(shift /digital-ad-layouts)*
7. Don't end a subline with a period; don't strand it far from its heading. *(shift /menu)*
8. Don't show cold geometric pizza, floating/fantasy food, collages, or over-processed ("overcooked") imagery. *(shift /graphic-design, /infoplanning)*
9. Don't use studio/staged shots, over-groomed models, or subjects facing the camera. *(shift /producing)*
10. Don't use abstract/luxury words, hedonistic/sensual framing, aggressive hype, or "secret ingredients." *(shift /communication-standards)*
11. Don't touch politics/religion/controversy; no alcohol/tobacco/gambling; no fine print. *(shift /communication-standards)*
12. Don't add strokes to buttons/plates or add unrelated chromatic colors beyond the defined set. *(shift /infoplanning, /graphic-design)*
13. Don't crop the logo at edges, shrink to illegibility, or cover >1/3 of adjacent text. *(shift /infoplanning)*
14. Don't overload a fast/glanceable zone with slow-zone detail. *(shift /make-basic-layouts)*
15. Don't treat Roboto as a brand font. *(brandbook /digital-en)*

---

## 8. PROMPT-READY ART-DIRECTION BLOCK

```
DODO PIZZA LAYOUT RULES — obey all. Output HTML/CSS for a marketing layout (IG post/story, poster, promo).

COLOR
- Dominant color MUST be Dodo Orange #FF4E00. Lean orange-heavy. Never use #FF6900.
- Neutrals only: #000000, #FFFFFF, beige #FBF3E6, light gray #F2F2F6. Old/struck prices in #949598.
- Accents (#50D7FF #675BD8 #D1FE3C #FCE3F8 #0578FE) ONLY for drinks/desserts/seasonal. Add no other colors.
- Text on orange or dark = white; text on light = black. Orange allowed as accent text.

TYPE
- Rounded-geometric sans only (stand-in for proprietary Dodo Rounded/Rooftop): font stack e.g. "Nunito","Baloo 2","Varela Round",system-ui,sans-serif.
- Four tiers only: HEADING > SUBLINE > CAPTION > LEGAL.
- Heading: largest element, max 4 lines (aim 2). One word = 800 weight; multi-line = ~500. If ALL CAPS, scaleX 0.55–0.65 and only 1–2 lines. line-height 0.80–0.90 for 1–2 lines, 1.0 for 3+. letter-spacing -0.01em to -0.03em.
- Subline: 500 weight, sentence case, NO trailing period, line-height 0.85, left or center only.
- Legal: uppercase, condensed (scaleX 0.4), opacity 0.85, smallest.
- Prices: hero price 1.5–2× heading size; standard prices 70–80% of heading. Currency glyph at 2/3 digit height, top-aligned, no superscript.

LAYOUT
- Rectangular-module grid; subdivide the frame into stacked rectangles; align ALL text to the LEFT edge (left flag). Center-align allowed only for short sublines/captions. NEVER right-align or justify body text.
- Margin = longest side / 25. Never place text against the edge.
- Internal gaps between blocks MUST be smaller than the edge margin. Bottom margin slightly larger than top.
- Align exactly or leave an obvious gap — never "almost aligned".
- Reading order top-to-bottom, left-to-right: heading → subline → caption → legal.
- ONE message / one CTA. Cut everything secondary.
- Round ALL corners (buttons, plates, cards). Price/CTA = pill, NO border/stroke, filled with white/black/orange only.

PRODUCT / IMAGERY
- Product is the hero: it occupies the majority of the frame, shown hot and real — steam, cheese pull, crumbs, opened packaging, visible filling. On parchment/kraft or plain dishware; never floating.
- Background: simple, contrasts the product by lightness/temperature/saturation; never busy. Prefer orange, beige, kraft, or plain surface. Keep the zone behind text uniform.
- Natural, honest look — no heavy effects, no glossy CGI, no cold geometric pizza.
- People (if any): diverse, candid, in real context, not looking at camera.

COPY / TONE
- Honest, plain, warm, witty-not-sarcastic. Address customer as "you".
- Describe food with concrete sensory words (crispy, hot, stretchy, golden, fresh). Use real recipe names.
- FORBIDDEN: luxury/abstract words (exquisite, refined, delicate, bold), hedonistic framing (treat yourself), hype (Bomb!, Buy now!), fine print, politics/religion, "secret ingredients".

LOGO
- Include a Dodo mark or the word "Dodo"/"Dodo Pizza" woven into the copy. Clear space ≥ 1/4 its height. Never crop at edges, never cover >1/3 of adjacent text.
```

---

## 9. Recommended brandbook seed

Drop this into the app's stored brandbook. Values are the **real** Dodo values captured above; where a value was not published with exactness, it is omitted or marked, not invented.

```json
{
  "tokens": {
    "colors": {
      "primary": { "name": "Dodo Orange", "hex": "#FF4E00", "rgb": "255,78,0", "pantone": "1505", "role": "dominant brand color — use maximally" },
      "neutrals": {
        "black": "#000000",
        "white": "#FFFFFF",
        "beige": "#FBF3E6",
        "beigeMena": "#F9F1E6",
        "lightGray": "#F2F2F6",
        "oldPriceGray": "#949598"
      },
      "lines": {
        "forYouYellow":   { "base": "#FFC805", "ramp": ["#FFEBA5", "#FFD542", "#FFB200"] },
        "forFriendsGreen":{ "base": "#B9D246", "ramp": ["#D2E478", "#A6BA40", "#72841B"] },
        "forFamilyOrange":{ "base": "#FF4E00", "ramp": ["#FF9042", "#FF8028", "#F84A00"] }
      },
      "accents": {
        "skyBlue": "#50D7FF",
        "berryPurple": "#675BD8",
        "neonLime": "#D1FE3C",
        "pastelPink": "#FCE3F8",
        "azureBlue": "#0578FE",
        "usage": "drinks / desserts / seasonal only"
      },
      "legacyDoNotUse": "#FF6900",
      "textOnColor": { "onOrangeOrDark": "#FFFFFF", "onLight": "#000000" }
    },
    "typography": {
      "brandFonts": {
        "body": "Dodo Rounded",
        "headline": ["Dodo Rounded Black", "Rooftop Extrabold (RU/BY/EU)", "TT Interphases Pro (KZ)"],
        "note": "Proprietary; not web-served. Use rounded-sans fallback for HTML output."
      },
      "webFallbackStack": "\"Nunito\",\"Baloo 2\",\"Varela Round\",system-ui,sans-serif",
      "roles": ["heading", "subline", "caption", "legal"],
      "heading": { "maxLines": 4, "optimalLines": 2, "singleWordWeight": 800, "multiLineWeight": 500, "allCapsScaleX": [0.55, 0.65], "lineHeightShort": [0.80, 0.90], "lineHeightLong": 1.0, "letterSpacing": [-0.03, 0] },
      "subline": { "weight": 500, "case": "sentence", "trailingPeriod": false, "lineHeight": 0.85, "align": ["left", "center"] },
      "legal": { "case": "upper", "scaleX": 0.40, "opacity": 0.85, "justify": true },
      "price": { "heroMultipleOfHeading": [1.5, 2.0], "standardPercentOfHeading": [70, 80], "currencyHeight": "2/3 digit, top-aligned, no superscript" }
    },
    "spacing": {
      "marginRule": "longestSide / 25",
      "marginRuleNarrow": "longestSide / 50",
      "innerGapLessThanEdgeMargin": true,
      "bottomMarginGreaterThanTop": true,
      "textOffEdges": true,
      "grid": "rectangular modules, subdivide without remainder, left-flag aligned",
      "cornerStyle": "rounded (all buttons/plates/cards); price+CTA = pill, no stroke"
    },
    "logo": {
      "mark": "3D dodo-bird 'D'",
      "variants": ["Main/TwoLines", "Tall", "Line", "Wordmark", "Sign/bird", "circularAvatar"],
      "clearSpace": ">= 1/4 logo height",
      "minSizeWithBird": "15mm (below: use orange D only)",
      "preferred": "weave 'Dodo'/'Dodo Pizza' into copy; standalone lockup only when needed",
      "coBrand": "× separator, Dodo Pizza first, equal weight",
      "donts": ["never crop at edges", "never cover >1/3 of adjacent text", "no right-align", "never illegibly small or oversized"]
    }
  },
  "context": "Dodo Pizza. Honest, warm, plain, witty-not-sarcastic QSR brand: 'we say things as they are' and 'we'll take care of the pizza while you take care of what's important.' Every layout: ONE message/CTA, dominant Dodo Orange #FF4E00, rectangular left-flag module grid, strict Heading>Subline>Caption>Legal hierarchy set in a rounded sans. Product is the hero — hot, real, unretouched, opened packaging, occupying most of the frame on parchment/kraft or plain dishware against a simple contrasting background; never floating, cold, or over-processed. Rounded corners everywhere; pill CTAs with no stroke in white/black/orange. Copy uses concrete sensory words (crispy, hot, stretchy, golden) and real recipe names — never luxury/abstract words, hedonistic framing, hype, or fine print. People are diverse, real, candid, active, not facing camera. Margins = longest side / 25; text never touches edges; inner gaps smaller than edge margin; bottom margin larger than top. Left- or center-align only, never right-align. Include a Dodo mark or the word Dodo. No politics/religion, no alcohol/tobacco/gambling, no fantasy/escapism. Accents (sky blue, purple, lime, pink, azure) only for drinks/desserts/seasonal. Do NOT use legacy #FF6900."
}
```

---

**Source-confidence note:** exact hex codes and font weights come almost entirely from **two Shift spec pages** — `/topic/infoplanning` (Visual Style: full palette, Rooftop weights, margin ÷25 rule, price scaling, plate rules) and `/topic/graphic-design` (MENA: sub-palette ramps, 15 mm logo min, footer placement). The rectangular-module / alignment / whitespace / hierarchy rules are corroborated across many pages (`/graphic-design`, `/digital-ad-layouts`, `/menu`, `/producing`). Tone and imagery rules are corroborated across `/communication-standards`, `/producing`, `/digital-ad-layouts`, and the public brand book. The public brandbook.dodopizza.info pages contributed the legacy `#FF6900`, the "Dodo Rounded single font" framing, and logo-variant names, but **published no grid/margin/type-scale numbers** — those exist only on Shift. Nothing above is fabricated; gaps are flagged rather than filled.
