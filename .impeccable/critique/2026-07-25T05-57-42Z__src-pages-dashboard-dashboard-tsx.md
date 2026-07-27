---
target: Dashboard (src/pages/Dashboard/Dashboard.tsx)
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-07-25T05-57-42Z
slug: src-pages-dashboard-dashboard-tsx
---
# Impeccable Critique — nxclip.ai Dashboard

Method: dual-agent (A: design review · B: detector + browser evidence)
Surface mode: Operate

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Date/platform selects and KPIs are static; publish gives no confirmation. Controls imply status they never report. |
| 2 | Match System / Real World | 3 | Strong gaming-creator vocabulary (clips/memes/retention, "why it worked"). |
| 3 | User Control and Freedom | 3 | Dialog has cancel/reset/dismiss; no undo on publish, Plan "Strategy ready" dead-ends. |
| 4 | Consistency and Standards | 2 | Violates own DESIGN.md: off-scale text-[8/9/10/11px], near-universal bold, invented amber palette, rounded-3xl (explicit Don't), raw neutral/white/black. |
| 5 | Error Prevention | 3 | Good guards: post disabled when empty, AI caption disabled without media, trim disabled for images. |
| 6 | Recognition Rather Than Recall | 3 | Labels/icons/selected states visible, but 8–9px labels strain recognition. |
| 7 | Flexibility and Efficiency | 2 | Filters and reuse/shortcut affordances exist in intent but are non-functional. |
| 8 | Aesthetic and Minimalist Design | 2 | Uniform bold weight + decorative glows + dense 8-section stack collapse hierarchy. |
| 9 | Error Recovery | 3 | Dialog errors excellent (inline, titled, dismissible); dashboard has no empty/error states, Firestore error only console.logs. |
| 10 | Help and Documentation | 2 | Plan tooltip + trim hint present; no onboarding/empty states on the dashboard itself. |
| **Total** | | **25/40** | **Acceptable (20–27)** |

## Design Specificity Verdict

**Split: authored in content/IA, category-interchangeable in visual execution.** The information architecture and copy are unmistakably gaming-creator (Valorant/CS2/Minecraft, retention/saves/reach, "why it worked," Platform Pulse, AI next-best-actions). But the visual system is a stock dark-SaaS dashboard executed with near-uniform font-bold/black and a wall of 8–11px labels. The "Luminous Creator-Tech" atmosphere DESIGN.md §10 makes central (mesh-gradient, noise-overlay, brand-text-gradient) appears NOWHERE on this page. It reads as a competent generic dashboard wearing gaming content, not a gaming product with an authored visual voice.

**Deterministic scan:** Impeccable detector on `src/pages/Dashboard` = CLEAN (0 findings, exit 0). Validated: scanning the parent `src/pages` returned 24 findings (e.g. `ai-color-palette` in AdminPanel/DesignSystem.tsx:44), zero of which touch the Dashboard tree — so the clean result is genuine, not a no-op. The detector agrees the Dashboard avoids the classic AI-slop palette/gradient tells; it simply cannot see the hierarchy, dead-control, and DESIGN.md-conformance issues the human review caught.

**Visual overlays:** None available. Assessment B's browser context had no auth token, so `/dashboard` redirected to `/login`; overlay injection was correctly skipped.

## Overall Impression

A dashboard with genuinely product-specific thinking and excellent modal craft, undermined by (1) a layer of decorative-but-dead controls that quietly teach users the surface is a mock, and (2) a refusal to use weight/size for rank, which flattens hierarchy despite the design system specifying exactly how to do it. Biggest single opportunity: make interactivity honest and let the type scale carry rank.

## What's Working

1. **Localization/RTL rigor.** `isAr` threaded with real care — `dir="ltr"` on numerals, Recharts axis reversal, tracking swaps, directional chevrons. Hard, easy to skip, done thoroughly.
2. **The live phone preview in CreatePostDialog** — device frame reflecting caption/tags/filter/overlay in real time. Content-specific and confidence-building; the strongest single decision in the surface.
3. **Skeleton fidelity.** DashboardSkeleton mirrors the real layout structurally (per-section shells, bar heights), minimizing layout shift; token-driven.

## Priority Issues

**[P0] Decorative-but-dead interactive elements.** KPI cards, date/platform filters, "Reuse strategy," "View details," and all Attention CTAs signal interactivity (cursor-pointer, hover-lift, glow) but have no handlers. Breaks Visibility of Status and trust; filters that change nothing make users distrust the numbers too. Fix: wire real handlers/navigation, or strip the interactive affordances until they work. → `harden`

**[P0] Off-scale, over-bold typography destroys hierarchy and legibility.** Pervasive text-[8/9/10/11px] (below the 13px scale floor), near-universal font-bold/black, page title text-2xl/900 where DESIGN specs 32px/600. The ui-text-* semantic classes are essentially unused. Uniform weight collapses rank; sub-12px labels are the core accessibility blocker. Fix: adopt semantic type classes, raise floor to 12–13px, reserve black for values. → `typeset`

**[P1] Colors and radii off the design system.** An invented amber warning family (no --warning token), raw neutral-950/white/black/rgba, rounded-3xl (an explicit DESIGN Don't). Un-tokenized amber can't be contrast-audited or theme-swapped. Fix: add a semantic --warning/--attention token, replace raw colors, remove rounded-3xl. → `colorize`

**[P1] No reassurance at the publish/commit boundary.** `Post now` only console.logs then closes silently; Plan's "Strategy ready" closes without persisting. Violates peak-end — the highest-stakes action ends in uncertainty. Fix: success confirmation, persist/route the post/plan, surface an error path. → `delight`

**[P2] Touch targets below 44px + a localization bug in impact styling.** Attention CTA h-7, reset h-6, perf tabs h-8 all under DESIGN §8.2's 44px. Separately, `item.impact === "High"` compares against a translated string, so under Arabic every badge falls through to the amber "medium" branch — the impact color-coding silently breaks in the exact RTL locale the rest of the code supports. Fix: raise touch heights; compare against a stable semantic key, not the localized label. → `audit`

## Persona Red Flags

**Alex (power user):** All 5 KPI cards are cursor-pointer with hover-lift but have no onClick/role/href — five dead clicks. Switching date to 30D/90D or platform to YouTube updates state but chart + every number are hardcoded — filters are theater. "Reuse strategy," "View details," and all four Attention CTAs have no handlers. Only "Full Analytics" and "Open Feed" actually navigate.

**Sam (accessibility):** Systematic sub-legible text (platform/game/impact badges text-[8px], eyebrow text-[9px]) below DESIGN's smallest size. Amber-on-amber (text-amber-500/80 on bg-amber-500/10) over dark almost certainly fails 4.5:1. KPI cards look interactive but aren't in tab order. "View details" is opacity-0 group-hover with no focus-within — unreachable by keyboard. Touch targets 24–36px. Bright spot: the dialog serves Sam well (role/tabIndex/aria-label dropzone, aria-pressed filters, sr-only description) — the rigor evaporates the moment you leave the modal.

## Minor Observations

- CreatePostDialog reads `process.env.GEMINI_API_KEY` client-side (lines 105, 180). Under Vite this is not injected, so the feature is effectively broken client-side; if a define ever exposed it, it would ship the key in the bundle. Route AI through the server proxy instead.
- `model: "gemini-3.6-flash"` referenced in the dialog; verify against real model ids.
- KPICard overrides padding/border/bg inline on top of the shared ui-dashboard-kpi-card class — DESIGN says don't.
- DESIGN §10 atmosphere (mesh-gradient, noise-overlay, brand-text-gradient) entirely unused — the "Luminous" identity is specced but not spent.
- `key={i}` index keys for AI actions and hashtags.
- KPI badge color driven by trend, not by good/bad — "3 items / Action" renders destructive-red, reading like an error not a nudge.

## Questions to Consider

1. The date-range and platform selectors change nothing. If they're roadmap theater, what does shipping non-functional controls next to your KPIs teach users about whether to trust the KPIs?
2. If you deleted every font-black and let the type scale carry rank, would the dashboard look less designed — or would it finally look like the Luminous system DESIGN.md specifies?
3. The modal treats Sam better than the dashboard does. Why does the accessibility discipline switch off the instant you leave the dialog, and which one is the team's real standard?
