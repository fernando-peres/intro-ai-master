"""Inject the evals notebooks' cells and saved outputs into the HTML template (see README.md).

Usage: python build.py <template.html> <notebook.ipynb> [<notebook.ipynb> ...]
Writes html/evals.html at the repo root.
Each notebook is keyed by the words after the number in its name: evals_03_judge_loop -> "judge_loop".
"""
import html, json, re, sys
from pathlib import Path

out_path = Path(__file__).resolve().parents[2] / "html" / "evals.html"
tpl_path, *nb_paths = sys.argv[1:]
assert nb_paths, __doc__
TONES = {"#15803d": "pass", "#c2410c": "fail"}


def load(path):
    nb = json.load(open(path, encoding="utf-8"))
    cells, outs, md = {}, {}, []
    for i, c in enumerate(nb["cells"]):
        cells[i] = "".join(c["source"])
        if c["cell_type"] == "markdown":
            md.append(i)
        items = []
        for o in c.get("outputs", []):
            h = o.get("data", {}).get("text/html")
            if h:
                h = "".join(h)
                m = re.search(r'<b style="color:(#\w+)">(.*?)</b>\n(.*)</div>', h, re.S)
                if m:  # card(): a titled box; its accent colour gives the tone
                    items.append({"title": html.unescape(m[2]), "body": html.unescape(m[3]), "tone": TONES.get(m[1], "")})
                elif h.lstrip().startswith("<table"):  # show_table(): keep rows as text
                    rows = []
                    for tr in re.findall(r"<tr>(.*?)</tr>", h, re.S):
                        rows.append([html.unescape(v) for v in re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", tr, re.S)])
                    items.append({"table": rows})
                else:
                    items.append({"html": h})
            elif o.get("text"):
                items.append({"stream": "".join(o["text"])})
            elif o.get("output_type") == "error":
                items.append({"error": f"{o.get('ename')}: {o.get('evalue')}"})
        if items:
            outs[i] = items
    return {"file": str(Path(path).as_posix()), "cells": cells, "md": md, "outs": outs}


data = {}
for p in nb_paths:
    m = re.match(r"evals_\d+_(\w+)$", Path(p).stem)
    assert m, f"unexpected notebook name: {p}"
    data[m[1]] = load(p)

payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
tpl = open(tpl_path, encoding="utf-8").read()
assert "/*__NB__*/null" in tpl
out_path.parent.mkdir(exist_ok=True)
open(out_path, "w", encoding="utf-8").write(tpl.replace("/*__NB__*/null", payload))
print("ok", out_path, ", ".join(data), len(payload))
