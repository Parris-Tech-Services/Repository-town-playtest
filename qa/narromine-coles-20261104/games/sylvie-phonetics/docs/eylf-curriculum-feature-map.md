# EYLF V2.0 curriculum research and Sylvie Phonics feature map

This document ties **Australia’s nationally approved Early Years Learning Framework V2.0 (2022)**—*Belonging, Being & Becoming*—to **Sylvie’s Phonics Adventure** (`index.html`). It includes the contextual “Australian four-year-old / kindergarten-preschool” narrative you supplied, mapped into the same framework.

**Primary sources**

- Australian Government Department of Education (AGDE). (2022). *Belonging, Being and Becoming: The Early Years Learning Framework for Australia (V2.0)*. Available from the Australian Children’s Education and Care Quality Authority (ACECQA): [Approved learning frameworks](https://www.acecqa.gov.au/nqf/national-law-regulations/approved-learning-frameworks) (PDF titled *EYLF-2022-V2.0*).
- Supporting context: [Department of Education – Early Years Learning Framework](https://www.education.gov.au/early-childhood/resources/early-years-learning-framework).

**Important scope note**

The EYLF is written for **approved education and care services**, **educators**, and **approved providers** planning place-based programs. Sylvie Phonics is a **family-facing offline web app** focused on phonics, oral language, and early reading play. It can **align with** aspects of outcomes and practices—especially intentional teaching, play-based rehearsal, literacy, and adult partnership—but it does **not** replace a kindergarten program, NQS assessment, educator judgment, or community/cultural curriculum.

---

## 1. What the official EYLF V2.0 contains (research summary)

The Framework is organised into interdependent elements: **Vision** (Belonging, Being, Becoming), **eight Principles**, **seven Practices**, and **five Learning Outcomes**, all centred on children’s learning, development, and wellbeing (AGDE, 2022).

### 1.1 Vision: Belonging, Being & Becoming

- **Belonging**: shaping identity through relationships with people, places, cultures.
- **Being**: honouring children in the present; childhood as valuable in its own right.
- **Becoming**: learning and identity change through experience and transitions.

These ideas run across all outcomes; they are not separate “lesson topics.”

### 1.2 The five learning outcomes (official wording)

Per AGDE (2022), approved services use these outcomes:

1. Children have **a strong sense of identity**.
2. Children are **connected with and contribute to their world**.
3. Children have **a strong sense of wellbeing**.
4. Children are **confident and involved learners**.
5. Children are **effective communicators**.

Each outcome expands into **several outcome focus areas**, each with:

- Narrative explanation (why it matters pedagogically).
- Bullet lists headed **This is evident when children, for example:** …
- Parallel lists headed **Educators promote this learning for all children when they, for example:** …

This app mapping emphasises **child-facing affordances** and **parent/coach scaffolding**. Most **educator-only** bullets (staff meetings, displaying flags in a service, service policies, etc.) are noted as **out of product scope** but **partnership relevant** for families discussing kindy with educators.

### 1.3 The eight principles (official list)

From the Framework diagram (AGDE, 2022):

1. Secure, respectful and reciprocal relationships  
2. Partnerships  
3. Respect for diversity  
4. Aboriginal and Torres Strait Islander perspectives  
5. Equity, inclusion and high expectations  
6. Sustainability  
7. Critical reflection and ongoing professional learning  
8. Collaborative leadership and teamwork  

### 1.4 The seven practices (official list)

1. Holistic, integrated and interconnected approaches  
2. Responsiveness to children  
3. Play-based learning and intentionality  
4. Learning environments  
5. Cultural responsiveness  
6. Continuity of learning and transitions  
7. Assessment and evaluation for learning, development and wellbeing  

---


## 2. Your contextual narrative (“four-year-olds in Australia…”) — line-by-line mapping

Below, **each paragraph or bullet from your curriculum note** is mapped to **existing game modes / UI** or **planned / out-of-scope** items. Game `id`s match `GAMES` in `index.html`.

| Your line | Map to Sylvie Phonics |
|-----------|----------------------|
| *Four-year-olds in Australia follow a play-based curriculum (EYLF V2.0), typically delivered through preschool or kindergarten … focuses on five outcomes … using play to build literacy, numeracy, and social skills before school.* | **Cross-cutting:** Play-based rhythm via multiple games + **Today’s Path** (`daily`). **Literacy:** most modes (`letters`, `read`, `spy`, …). **Numeracy:** light touch (`count` counts *letters*, not maths objects—see gaps). **Social skills:** not simulated peer play—**partial** via parent prompts and turn-taking language in coach copy. |
| *Play-Based Learning: exploration, imaginative play, hands-on.* | **Existing:** `memory`, `blocks`, `build`, `story`, emoji “scenes”, `trace` canvas, `song`, `jump` (embodied metaphor). |
| *Belonging, Being & Becoming / identity & connection.* | **Partial:** personalised naming in copy; joyful low-stakes endings. **Gap:** cultural/family/community identity content not systematically represented—requires intentional content passes and educator/family-led discussion off-device. |
| *Wellbeing: physical health, fine motor, confidence, emotional regulation.* | **Existing partial:** encouragement, short sessions, gentle difficulty (`gentle` / `growing` / `brave`), success-focused feedback; **fine motor** via `trace`. **Gap:** gross motor, sleep/nutrition, regulation programs—coach could reference breaks (future optional “pause/stretch” strip). |
| *Communication: language, early literacy (stories/songs), numeracy through play.* | **Strong:** `read`, `story`, `song`, `clap`, oral prompts, speech (`spell` mic where supported), robot voice segmentation (`robotVoice`). **Numeracy-through-play:** weak in-app unless extended (see §6). |
| *Social & Emotional: independence, resilience, relationships.* | **Partial:** independence via tap/keyboard mastery; resilient messaging implicitly through retries. **Gap:** cooperative play, friendships—outside app. |
| *Intentional Teaching: educators guide play… problem-solving.* | **Existing:** Parent **Coach** screen, per-round coach lines/scripts, Parent assist vs child mode, scripted teaching order on home hero. Mimics intentional teaching role for **parents/caregivers**. |
| *Setting: long day care, sessional kindergartens.* | **Documentation / partnership only** — not a software feature. |
| *Qualified staff: university-qualified teachers.* | **Policy / sector** — not app feature. App supports **family–educator partnership** only indirectly via documentation. |
| *Terminology: Kindergarten (Vic, QLD, WA, SA, TAS), Preschool (NSW, ACT, NT), Prep…* | **Planned UX copy:** locale-friendly labels in Settings or FAQ (see §6). Currently `lang="en-AU"` only. |
| *Prep/Foundation / transition to formal curriculum.* | **Partial alignment:** phonics rehearsal supports transition readiness; **not** full school syllabus mapping. |
| *Literacy: songs, reading, engaging with words.* | **Existing:** `song`, `read`, `listen`, `rhyme`, `rhymePairs`, `letters`, `start`, etc. |
| *Numeracy: counting, sorting, patterns.* | **Thin:** `count` = count letters in a word (**print awareness**). **Gap:** sorting, repeating patterns (AB), number sense modes (§6). |
| *Physical: fine (cutting, drawing), gross motor.* | **Partial digital:** `trace` for drawing/trace; **jump** naming only (not full-body PT). Cutting/gross motor → **offline** + educator programs. |
| *Creative arts: painting, imaginative play.* | **Partial:** music/rhythm via `song`, drama-ish via mouth cues `video`; no paint canvas. Imaginative wrappers possible in copy/`story`. |
| *Victoria “Pre-Prep” / Free Kinder note.* | **Doc + optional string** for Victorian families in parent-facing appendix (§6). |

---

## 3. Principles → app alignment

| Principle | Where Sylvie aligns today | Typical gap / “new feature” idea |
|-----------|---------------------------|----------------------------------|
| **Secure, respectful, reciprocal relationships** | Warm tone; adult toggles (`adultMode` coach vs kid); no punitive scoring shaming wrong answers overtly long | No substitute for relational care in-service; optional “co-play” prompts for adult + child |
| **Partnerships** | Coach text encourages adult mediation; offline use supports home practice | Structured “talk with your educator” reminders; export/share session summary |
| **Respect for diversity** | AU English emphasis; adaptable at content level | Diverse imagery/text pipeline; home-language prompts in coach (**content**, not infra) |
| **Aboriginal and Torres Strait Islander perspectives** | Not embedded as dedicated content in current HTML | Respectful collaborations for stories/sounds/signs—not to be improvised; **planned** flagged for expert input |
| **Equity, inclusion, high expectations** | Large tap targets; keyboard help; robot voice blending support; themes | Adjustable timing; dyslexia-friendly fonts option; narration speed |
| **Sustainability** | Not thematic | Environmental print could include reduce/reuse messages sparingly (**content choice**) |
| **Critical reflection** | `review` retrains weaker items; implicit “stop after success” coach guidance | Explicit parent reflection prompts post-session (**copy**) |
| **Collaborative leadership** | Service-level practice | Out of scope for app codebase |

---

## 4. Practices → app alignment

| Practice | Existing features | Planned / deepen |
|---------|-------------------|------------------|
| **Holistic approaches** | Mixes oral, visual, motor (`trace`), story, sentence reading | Occasional “whole child” pause prompts (water, stretch) |
| **Responsiveness** | Gentle/growing/brave; choice counts vary; voice status | Adaptive difficulty using stored results (**future**) |
| **Play-based learning & intentionality** | Game framing + embedded coach scripting | Strong—core product thesis |
| **Learning environments** | Calm pastel UI; focus/dark mentions in CSS classes | Reduced motion preference API (**future**) |
| **Cultural responsiveness** | Depends on authored word/image lists | Content audit pipeline |
| **Continuity & transitions** | Offline file; repeatable daily ritual | Printable “skills practised” for kindy handover |
| **Assessment & evaluation** | `review`, round results persisted (see app state persistence) | Educator-readable summary PDF (**future**) |

---

## 5. Learning outcomes → feature map (official sub-headings only)

Official documents group each outcome under **several headings** (the bold outcome focus areas printed under each Learning Outcome). Those headings are mapped below. Exhaustive bullet-by-bullet mapping of **every** “evident when children” line appears in §5.6 as **clusters**—grouping synonymous evidence so maintenance stays tractable.

**Legend**

- ✅ **Solid in-app**: implemented as playable or visible behaviour.  
- 🟨 **Partial**: supported indirectly (e.g., only via adult, copy, or narrow affordance).  
- ⏳ **Planned**: credible next feature—in line with [`suggestions.md`](../suggestions.md) where noted.  
- ⛔ **Out of scope**: needs human/community context, not ethical to fake in-app.

---

### Outcome 1 — Children have a strong sense of identity

Official focus areas (AGDE, 2022):

1. Children feel safe, secure and supported  
2. Children develop emerging autonomy, inter-dependence, resilience and agency  
3. Children develop knowledgeable, confident self-identities and positive self-worth  
4. Children learn to interact with care, empathy and respect  

| Focus area | Sylvie mapping | Notes |
|-----------|----------------|-------|
| 1 Safe, secure, supported | 🟨 Predictable UI; short rounds; reassuring feedback; adult nearby assumed | Attachment & routines are **offline** |
| 2 Autonomy / agency / resilience | ✅ Child chooses taps; retries; exploration in `memory`, `jump`, `listen`; persistence encouraged in coach tips | Peer cooperation **⛔** |
| 3 Confident learner identity | 🟨 Praise on success; `review` reframes tricky words as garden work | Celebrate unique traits **needs content** |
| 4 Care, empathy, respect | ⛔ / 🟨 | No multi-child avatars—**coach** may model respectful language (**copy**) |

---

### Outcome 2 — Connected with and contribute to their world

Focus areas:

1. Connectedness / rights / citizenship  
2. Respond to diversity with respect  
3. Awareness of fairness  
4. Socially responsible / respect for environment  

| Focus area | Sylvie mapping | Notes |
|-----------|----------------|-------|
| 1 Citizenship / community | 🟨 `env` (**environmental print**) links symbols to everyday life ⏳ widen sign set | Voting, group projects **⛔** |
| 2 Diversity | ⏳ resource diversity audit | Partner with educators |
| 3 Fairness | ⛔ | Optional future stories **⏳** |
| 4 Environment | ⛔ thematic sustainability | Offline excursions |

---

### Outcome 3 — Strong sense of wellbeing

Focus areas:

1. Social, emotional, mental wellbeing  
2. Physical learning and wellbeing *(Framework PDF uses nuanced headings across pages)*  
3. Strategies for mental/physical health & personal safety *(combined narrative in Framework)*  

| Focus area | Sylvie mapping | Notes |
|-----------|----------------|-------|
| 1 Emotional wellbeing | ✅ low pressure design; ✅ positive feedback loops | Trauma-informed practice **service** responsibility |
| 2 Physical | 🟨 `trace` fine motor digitally; 🟨 `jump` playful movement prompt | Gross motor **offline** |
| 3 Safety / health routines | 🟨 optional future screen-time / posture reminders | Cybersafety educator duties—app can cite eSafety in docs |

---

### Outcome 4 — Confident and involved learners

Focus areas:

1. Growth mindset / dispositions (curiosity, persistence, imagination…)  
2. Problem solving, inquiry, experimentation  
3. Transfer & adapt learning across contexts  
4. Resource learning through people, places, tech, materials  

| Focus area | Sylvie mapping | Notes |
|-----------|----------------|-------|
| 1 Dispositions | ✅ exploratory games; ✅ retry loops; coach promotes effort | Narrated growth mindset snippets **⏳** |
| 2 Inquiry / problem solving | ✅ `listen`, `vowel`, `swap`, `digraph`, `g` as puzzle-like noticing | Extended STEM **⛔** |
| 3 Transfer | 🟨 `env`, `spy`, `hunt` bridge to household words (**content dependent**) | Home observation missions **coach copy ⏳** |
| 4 Resource learning via tech | ✅ offline-capable phonics suite; ✅ speech synthesis / mic where allowed | Guided family media plan **docs** |

---

### Outcome 5 — Effective communicators

Focus areas:

1. Verbal / non-verbal interaction for purposes  
2. Engage with texts; gain meaning  
3. Express ideas using range of media  
4. Symbols & pattern systems (incl. early literacy/math patterns)  

| Focus area | Sylvie mapping | Notes |
|-----------|----------------|-------|
| 1 Interaction | ✅ oral repetition; ✅ `song`; listening games | ATSI yarning/listening pedagogies **⛔ shallow** |
| 2 Texts & meaning | ✅ `read`, `story`, `song`, `rhyme` | Book corner **offline** |
| 3 Expression / media | 🟨 emojis/images; tracing as mark-making analogue | Proper arts studio **⛔** |
| 4 Symbols & patterns | ✅ letters ↔ sounds (`letters`, `start`); ✅ patterns in rhyme; 🟨 `count` as symbol length; ✅ `swap`/`digraph` pattern noticing | Explicit phoneme-box counters [**⏳** `suggestions.md` Issue 9-style] |

**Framework citation relevant to Sylvie**: Outcome 5 educator examples explicitly include *“play games that promote listening and following instructions, **e.g. I spy with my little eye***” — aligned with ✅ `spy` (AGDE, 2022, Outcome 5 exemplar educator practices).

---

## 5.6 Evidence statements grouped by curriculum theme (dense mapping)

The Framework lists dozens of granular “evident when children” bullets per outcome. Here each **cluster** lists representative official ideas (paraphrase or short quote themes) → app status.

### Outcome 1 — evidence clusters

| Cluster theme | Representative EYLF ideas | Sylvie |
|---------------|------------------------|--------|
| Routines / belonging cues | transitions, rituals, familiarity | 🟨 short ritual “Today’s Path” |
| Exploring identity via play | role play, initiating play | 🟨 story/tile reorder as micro-narrative; ⛔ no avatar role-play |
| Agency & choice | making choices; persistence | ✅ multiple modes; ✅ retries |
| pride / self-worth | sharing achievements | 🟨 celebration screens; 💬 encourage showing device to trusted adult |

### Outcome 2 — evidence clusters

| Cluster theme | Representative EYLF ideas | Sylvie |
|---------------|------------------------|--------|
| Group belonging | cooperating in groups | ⛔ |
| Community contribution | fairness, civic action | ⛔ |
| Diversity appreciation | multicultural events respect | ⏳ content |
| Sustainability & Country | caring for Country, biodiversity | ⛔ needs local programs |

### Outcome 3 — evidence clusters

| Cluster theme | Representative EYLF ideas | Sylvie |
|---------------|------------------------|--------|
| emotional regulation | self-soothing strategies | 🟨 calm UI; optional breathing text ⏳ |
| physical fundamentals | gross/fine motor, dance | 🟨/`trace`; ⛔ dance |
| healthy habits | hygiene, nutrition, sleep literacy | 🟨 doc-only reminders |
| digital wellbeing | posture, balanced tech | ⏳ parent tip lines |

### Outcome 4 — evidence clusters

| Cluster theme | Representative EYLF ideas | Sylvie |
|---------------|------------------------|--------|
| curiosity & imagination | imaginative investigation | ✅ many modes |
| scientific/mathematic reasoning | classify, hypothesise | 🟨 pattern games weak for math |
| documenting learning | revisit ideas | ✅ `review` |
| ICT investigation | purposeful digital tools | ✅ |

### Outcome 5 — evidence clusters

| Cluster theme | Representative EYLF ideas | Sylvie |
|---------------|------------------------|--------|
| listening / instructions | rhyme/sound patterns | ✅ `song`, `listen`, `spy` |
| print & multimodal texts | responding to visuals/audio | ✅ |
| rhyme & phonological awareness | sounds of language | ✅ broad coverage |
| early writing approximations | letter-like marks | 🟨 `trace` |
| maths language in comms | size/count vocabulary | 🟨 unless expanded |

---

## 6. Recently shipped alignment features (codified 2026)

Previously listed as P1–P5—they now exist in-repo as:

| Earlier ID | Implemented as |
|-----------|----------------|
| P1 | `patterns` (Pattern Peek) + `sort` (Sort & Snap) |
| P2 | `phonemeBoxes` (Sound Boxes) — ordered sound chips distinct from letter-count (`count`) |
| P3 | Settings **Micro-breaks** + full-screen wellbeing overlay between rounds |
| P4 | **Region label** picker + refreshed hero / today’s path copy lines |
| P5 | **Session recap** on win screen (`Copy`/`Print`; local-only) |

Also added: grown-up-only **O1–O5 chips** on game cards, **`speakLesson` + speech-rate slider**, **Large taps** sizing, **`content/bundle.json` hook** (+ schema + validator + `CONTRIBUTING.md`), richer **coach snippet** rotation, **`appendCoachTransfer`** on spy/hunt/env rounds, **`prefers-reduced-motion`** CSS tame for buttons/sparkles, and **`aria-label`s** on several choice grids.

Future ideas (still valid): draggable counters UX variation, ATSI-authored story packs reviewed by communities, richer numeracy strand beyond toy/food snaps.

---

## 7. Implemented game catalogue (canonical reference)

Listed as in `GAMES` inside `index.html` (updated ship 2026-05-03):

| id | Feature title |
|----|----------------|
| `start` | First Sound Garden |
| `letters` | Letter Lab |
| `trace` | Trace Letters |
| `memory` | Memory Match |
| `clap` | Clap Syllables |
| `listen` | Sound Safari |
| `vowel` | Vowel Garden |
| `build` | Build and Blend |
| `spell` | Say and Spell |
| `rhyme` | Rhyme Time |
| `digraph` | Digraph Peek |
| `swap` | Sound Swap Detective |
| `g` | Tricky G Detective |
| `read` | Tiny Reader |
| `story` | Story Builder |
| `video` | Watch and Learn |
| `spy` | I Spy Sound |
| `hunt` | Sound Hunt |
| `blocks` | Sound Blocks |
| `rhymePairs` | Rhyme Pairs |
| `song` | Sound Song |
| `jump` | Sound Jump |
| `count` | Word Counters *(letters-in-word cardinality)* |
| `phonemeBoxes` | Sound Boxes *(ordered phoneme chips for CVC words)* |
| `patterns` | Pattern Peek *(repeat-what-next with emoji rhythms)* |
| `sort` | Sort & Snap *(food vs toy classification)* |
| `env` | Environmental Print |
| `review` | Review Garden |
| *(pseudo)* `daily` | Today’s Path (mixed lesson incl. phonemeBoxes + patterns) |

Cross-cutting UX: Parent **Coach**, **Robot voice**, **speech-rate multiplier slider**, **region wording**, **micro-break cadence**, **large-tap sizing**, **`speakLesson` wrapper**, **`content/bundle.json` augmentation**, **`sessionLog` recap** on victories, bilingual-ready **`en-AU`** hook, **`eylfOutcomes`** tags on picker (coach-only).

---

## 8. Maintainer note

When adding modes or rewriting coach strings:

1. Update **§7** (`GAMES`).  
2. Add a row where relevant in §§3–6.  
3. For ATSI perspectives or multicultural stories, treat as **professional content authoring**—not ad-libbed by implementers without community guidance.

---

*Document generated to support curriculum transparency for Sylvie Phonics. Framework quotations and structure are attributable to AGDE (2022) as cited.*
