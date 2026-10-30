---
target: Artifact search network graph (bRnPz)
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/fernandoperes/__code__/fernando/intro-ai-master/apps/harness-content/harness-sigmma.pen#bRnPz"
timestamp: 2026-10-30T14-49-28Z
slug: harness-sigmma-pen-brnpz
---
# Critique — Artifact search network graph (pen node bRnPz, harness-sigmma.pen)
Method: degraded single-context (no sub-agent tool). Detector run on HTML export of the frame.

## Design Health Score: 22/40 (Acceptable)
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Query "evaluation" has no visible effect in the graph |
| 2 | Match System / Real World | 2 | LOUVAIN / FORCEATLAS2 / WEBGL jargon; legend "#eval" conflates community with tag |
| 3 | User Control and Freedom | 3 | No back-step through focus history |
| 4 | Consistency and Standards | 2 | Two filter idioms; focus chips purple while onboarding community is blue |
| 5 | Error Prevention | 2 | Depth All + Hide others on 11k nodes unguarded |
| 6 | Recognition Rather Than Recall | 3 | "MIN TAG USE 3" lacks unit |
| 7 | Flexibility and Efficiency | 2 | No keyboard node traversal |
| 8 | Aesthetic and Minimalist Design | 2 | 3 toolbar rows ~25 controls; label collisions; card occludes cluster |
| 9 | Error Recovery | 1 | No empty / layout-running / overload / WebGL states |
| 10 | Help and Documentation | 2 | Communities unexplained |

## Priority Issues
1. [P1] Toolbar overload — keep rows 1–2 identical to Table view; move Depth/Color by/Show/Min tag use into Communities panel "Graph" section. ($impeccable distill)
2. [P1] Tag labels illegible/colliding — halo/plate, collision avoidance, card anchored to sparse side or docked. ($impeccable polish)
3. [P1] Selection and search have no graph consequence — highlight selected node's edges + tags, ring search matches, match count. ($impeccable polish)
4. [P2] Missing states — empty focus, layout running, overload cap, WebGL fallback. ($impeccable harden)
5. [P2] Contrast/size floor — gc-d-ink3 fails AA (3.5–3.9:1) system-wide; 7.5/8px text below incumbent 8.5 floor. ($impeccable typeset)

## Persona Red Flags
- Alex: no keyboard node traversal; Depth/Color by no shortcuts; Save search scope unclear.
- Sam: canvas-only, Table view must be the accessible equivalent; math/safety hues close; icon-only zoom controls.

## Minor Observations
Legend naming, footer jargon, "1 hop" copy, unit on min tag use, background blur cost, thousands separators in legend counts.

## Detector
189 findings: low-contrast 75, undersized/tiny text 96, cramped-padding 26 (mostly false positive), overused-font Inter 1 (false positive, incumbent).
