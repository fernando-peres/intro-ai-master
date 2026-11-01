# llm_tools_html

Builds `html/tools.html` from `notebooks/llm_tools_01.ipynb`: the page shows the notebook's cells and **saved outputs**, so re-run the notebook first, then rebuild.

```bash
python scripts/llm_tools_html/build.py notebooks/llm_tools_01.ipynb scripts/llm_tools_html/template.html
```

Standard library only. The template finds notebook cells by content (`cellOf` in `template.html`), so adding cells doesn't break it, but renaming a snippet it looks for (e.g. `def get_temperature(`) does: the page then shows an error in the browser console.
