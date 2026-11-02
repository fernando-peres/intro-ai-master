# evals_html

Builds `html/evals.html`, one tab per evals notebook (01 LLM as a judge, 02 what judges check, 03 judge in the loop, 04 experiment), from the notebooks' cells and **saved outputs**. Re-run a notebook first, then rebuild:

```bash
python scripts/evals_html/build.py scripts/evals_html/template.html notebooks/evals_01_llm_judge.ipynb notebooks/evals_02_judge_scenarios.ipynb notebooks/evals_03_judge_loop.ipynb notebooks/evals_04_experiment.ipynb
```

Standard library only. Each notebook is keyed by the words after its number (`evals_03_judge_loop` → `judge_loop`).

How the template reads the notebooks:

- **Tabs** are defined in `SPEC` in `template.html`. Each names its cells by heading: a top-level part (`---` then `# ` heading) and optionally a `## ` heading range (`part: "Part 2", from: "10."`). Every tab shows a visual built from the saved outputs, then the notebook's own markdown, code and outputs in order.
- **Cells** are found by content within the tab (`b.find(cells, "def mentions_window")`), so adding cells doesn't break the page. Renaming a snippet it looks for does: that visual then shows a short error note, and the browser console names the missing snippet. A tab with no saved outputs shows a "Not run yet" box.
- **Values** (verdicts, pass rates, counts, intervals) come from the saved `card()` and `show_table()` outputs and printed lines. A card's tone (pass or fail) comes from its accent colour.
- The CSS and the markdown/highlighting helpers are shared with `scripts/guardrails_html/template.html` (copied, so each page stays self-contained).
