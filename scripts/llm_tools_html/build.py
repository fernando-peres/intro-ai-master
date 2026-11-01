"""Inject llm_tools_01.ipynb cells and saved outputs into the HTML template (see README.md)."""
import html
import json
import re
import sys
from pathlib import Path

out_path = Path(__file__).resolve().parents[2] / "html" / "tools.html"
nb_path, tpl_path = sys.argv[1:3]
nb = json.load(open(nb_path))
cells, outs = {}, {}
for i, c in enumerate(nb["cells"]):
    cells[i] = "".join(c["source"])
    items = []
    for o in c.get("outputs", []):
        h = o.get("data", {}).get("text/html")
        if h:
            h = "".join(h)
            m = re.search(r"<b[^>]*>(.*?)</b>\n(.*)</div>", h, re.S)
            if m:
                items.append({"title": html.unescape(m[1]), "body": html.unescape(m[2])})
            else:
                items.append({"html": h})
        elif o.get("text"):
            items.append({"stream": "".join(o["text"])})
    if items:
        outs[i] = items
data = json.dumps({"cells": cells, "outs": outs}, ensure_ascii=False).replace("</", "<\\/")
tpl = open(tpl_path).read()
assert "/*__NB__*/" in tpl
out_path.parent.mkdir(exist_ok=True)
open(out_path, "w").write(tpl.replace("/*__NB__*/null", data))
print("ok", out_path, len(data))
