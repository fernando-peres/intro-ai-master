# guardrails_html

Builds `html/guardrails.html`, one tab per guardrails notebook (01 overview, 02 input, 03 execution, 04 output), from the notebooks' cells and **saved outputs**. Re-run a notebook first, then rebuild:

```bash
python scripts/guardrails_html/build.py scripts/guardrails_html/template.html notebooks/guardrails_01_overview.ipynb notebooks/guardrails_02_input.ipynb notebooks/guardrails_03_execution.ipynb notebooks/guardrails_04_output.ipynb
```

Standard library only. Each notebook is keyed by the word after its number (`guardrails_02_input` → `input`).

How the template reads the notebooks:

- **Sections** are the markdown cells that start with `---` and a `# ` heading. Each one's concept text, `## Explain` bullets and code are picked up automatically.
- **Cells** are found by content, scoped to their section (`b.cell("def redact_pii", "Stage 1: Input")` in `template.html`), so adding cells doesn't break the page. Renaming a snippet it looks for does: that tab then shows a "Not run yet" box, and the browser console names the missing snippet.
- **Values** (counts, answers, tool calls, log rows) come from the saved outputs. A few fixed values (`REFUND_LIMIT`, `max_tool_calls`, the regexes used for highlighting) are read from the notebook's own source.
- Each section's player scenes are defined in `SPEC` in `template.html`.
