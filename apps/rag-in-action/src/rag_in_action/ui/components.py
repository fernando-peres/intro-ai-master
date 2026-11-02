"""HTML fragments for the step pages; every string from the corpus or the LLM is escaped."""

import html
import re
from pathlib import Path

import streamlit as st

from rag_in_action.pipeline.chunk import Chunk
from rag_in_action.pipeline.retrieve import Hit

_CSS = (Path(__file__).with_name("theme.css")).read_text()


def inject_css() -> None:
    st.html(f"<style>{_CSS}</style>")


def esc(text: str) -> str:
    return html.escape(text, quote=True)


def lead(text: str, flow: tuple[str, str, str] | None = None) -> None:
    st.html(f'<p class="lead">{text}</p>')
    if flow:
        a, op, b = (esc(x) for x in flow)
        st.html(
            f'<div class="flow"><span>{a}</span><i>→</i><span class="op">{op}</span>'
            f"<i>→</i><span>{b}</span></div>"
        )


def highlighted(body: str, chunks: list[Chunk]) -> str:
    """`body` with each chunk shaded (alternating) and overlaps marked; ids at chunk starts."""
    bounds = sorted({0, len(body), *(c.start for c in chunks), *(c.end for c in chunks)})
    starts = {c.start: c.index for c in chunks}
    out = []
    for a, b in zip(bounds, bounds[1:], strict=False):
        covering = [c for c in chunks if c.start <= a and b <= c.end]
        label = f"<sup>#{starts[a]}</sup>" if a in starts else ""
        text = esc(body[a:b])
        if not covering:
            out.append(f'{label}<span class="gap">{text}</span>')
        else:
            cls = "ov" if len(covering) > 1 else f"c{covering[0].index % 2}"
            ids = ", ".join(c.id for c in covering)
            out.append(f'{label}<span class="{cls}" title="{esc(ids)}">{text}</span>')
    return f'<div class="doc">{"".join(out)}</div>'


LEGEND = (
    '<div class="legend"><span><b style="background:rgba(217,116,46,.35)"></b>chunk</span>'
    '<span><b style="background:rgba(217,202,193,.25)"></b>next chunk</span>'
    '<span><b style="background:rgba(251,191,36,.45)"></b>overlap (in two chunks)</span>'
    '<span><b style="border:1px solid #554c42"></b>dropped whitespace</span></div>'
)


def chips(values: list[str], cls: str = "") -> str:
    return "".join(f'<span class="chip {cls}">{esc(str(v))}</span>' for v in values)


def bar(fraction: float) -> str:
    pct = max(0.0, min(1.0, fraction)) * 100
    return f'<div class="bar"><div style="width:{pct:.1f}%"></div></div>'


def chunk_card(chunk_id: str, where: str, body: str, extra: str = "") -> str:
    return (
        f'<div class="card"><div class="head"><span class="id">{esc(chunk_id)}</span>'
        f'<span class="where">{esc(where)}</span></div>'
        f'<div class="body">{esc(body)}</div>{extra}</div>'
    )


SOURCE_LABEL = {
    "dense": "dense · cosine",
    "keyword": "keyword · BM25",
    "hybrid": "hybrid · RRF",
    "link": "via link",
}


def hit_card(rank: int, hit: Hit, top: float) -> str:
    r = hit.record
    where = r["title"] + (f" › {r['section']}" if r.get("section") else "")
    d = hit.detail
    tags = chips([SOURCE_LABEL[hit.source]], "link" if hit.source == "link" else "src")
    tags += chips([f"cos {d['dense']:.3f}", f"bm25 {d['bm25']:.2f}"])
    tags += chips(d["terms"], "kw")
    fraction = hit.score if hit.source in ("dense", "link") else hit.score / (top or 1)
    extra = (
        f'<div class="head" style="margin-top:.5rem"><span class="score">#{rank} · '
        f'{hit.score:.3f}</span></div>{bar(fraction)}<div class="chips">{tags}</div>'
    )
    return chunk_card(r["chunk_id"], where, r["text"], extra)


_CITE = re.compile(r"\[([\w.-]+#\d+)\]")


def with_citations(answer: str) -> str:
    """Markdown answer with `[doc#n]` turned into badges; the rest stays Markdown."""
    return _CITE.sub(lambda m: f'<span class="cite">{esc(m.group(1))}</span>', answer)


def prompt_html(messages) -> str:
    parts = []
    for m in messages:
        body = esc(m.content)
        body = re.sub(r"(\[[\w.-]+#\d+\][^\n]*)", r'<span class="ctx">\1</span>', body)
        parts.append(f'<span class="role">{m.role.upper()}</span>\n{body}')
    return f'<div class="prompt">{"\n\n".join(parts)}</div>'
