"""Print name, size, design tokens and text of nodes in a Pencil `.pen` file.

Read-only. Usage: python3 -I pen-nodes.py [--tree[=DEPTH]] <file.pen> <nodeId> [<nodeId> ...]
`--tree` prints the layout tree (type, name, size, layout, colors, type styles) instead.
"""

import json
import sys

TREE_KEYS = (
    "width", "height", "layout", "gap", "padding", "fill", "stroke", "strokeWidth",
    "cornerRadius", "fontFamily", "fontSize", "fontWeight", "letterSpacing", "lineHeight",
    "justifyContent", "alignItems", "textGrowth",
)  # fmt: skip


def _index(node: dict, path: list[str], out: dict) -> None:
    out[node.get("id")] = (node, path)
    for child in node.get("children") or []:
        if isinstance(child, dict):
            _index(child, [*path, node.get("name") or "?"], out)


def _collect(node: dict, texts: list[str], tokens: set[str]) -> None:
    for value in node.values():
        if isinstance(value, str) and value.startswith("$"):
            tokens.add(value)
    if node.get("type") == "text":
        content = node.get("content") or node.get("text")
        if isinstance(content, str):
            texts.append(content.strip().replace("\n", " / "))
    for child in node.get("children") or []:
        if isinstance(child, dict):
            _collect(child, texts, tokens)


def _tree(node: dict, depth: int, max_depth: int) -> None:
    props = " ".join(f"{key}={node[key]}" for key in TREE_KEYS if key in node)
    text = node.get("content") if node.get("type") == "text" else None
    label = f" «{text[:60]}»" if isinstance(text, str) else ""
    print(f"{'  ' * depth}[{node.get('type')}] {node.get('name') or ''} {props}{label}")
    if depth < max_depth:
        for child in node.get("children") or []:
            if isinstance(child, dict):
                _tree(child, depth + 1, max_depth)


def main() -> None:
    args = sys.argv[1:]
    tree_depth = None
    if args and args[0].startswith("--tree"):
        _, _, depth = args.pop(0).partition("=")
        tree_depth = int(depth or 99)
    path, *ids = args
    with open(path) as f:
        doc = json.load(f)
    index: dict = {}
    for child in doc["children"]:
        _index(child, [], index)
    for node_id in ids:
        if node_id not in index:
            print(f"\n### {node_id} | MISSING")
            continue
        node, parents = index[node_id]
        if tree_depth is not None:
            print(f"\n### {node_id}")
            _tree(node, 0, tree_depth)
            continue
        texts: list[str] = []
        tokens: set[str] = set()
        _collect(node, texts, tokens)
        size = f"{node.get('width')}x{node.get('height')}"
        print(f"\n### {node_id} | {node.get('name')} | {size} | parent: {'/'.join(parents[-2:])}")
        print("tokens:", " ".join(sorted(tokens)))
        print("text:", " | ".join(texts))


if __name__ == "__main__":
    main()
