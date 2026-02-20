#!/usr/bin/env python3
# """
# make_indexGen.py
# Scan a directory (and subdirectories) and generate a static HTML index page.
# 
# - Subdirectories are listed BEFORE files within each folder.
# - Output file defaults to: indexGen.html
# - ✅ Root-level files are EXCLUDED by default (only files inside subfolders are listed).
# - ✅ Optional filter to hide files with "nsfw" anywhere in the filename: --hide-nsfw
# 
# Usage examples:
#   python make_indexGen.py
#   python make_indexGen.py --root .
#   python make_indexGen.py --root "C:\Users\you\Documents\website"
#   python make_indexGen.py --ext .html --ext .pdf
#   python make_indexGen.py --exclude-dir .git --exclude-dir node_modules
#   python make_indexGen.py --hide-nsfw
# 
# Notes:
# - Links are relative paths. Opening indexGen.html locally will open local files in a browser.
# - If you host the folder on a web server / GitHub Pages, the same relative links work there too.
# """

from __future__ import annotations
import argparse
import os
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple


# ---- Icons (simple keyword matching)
ICON_RULES = [
    ("tetris", "🧱"),
    ("hangman", "🪓"),
    ("ELA", "🕮"),
    ("maze", "🧩"),
    ("qr", "🔳"),
    ("spell", "✎"),
    ("qrcode", "🔳"),
    ("wordle", "🟩"),
    ("numdle", "🟩"),
    ("dle", "🟩"),
    ("card", "🃏"),
    ("deck", "🃏"),
    ("clock", "⏰"),
    ("time", "⏰"),
    ("math", "➗"),
    ("pitch", "🎵"),
    ("chess", "♔"),
    ("game", "🎮"),
    ("play", "🎮"),
    ("index", "🏠"),
]
DEFAULT_FOLDER_ICON = "📁"
DEFAULT_FILE_ICON = "📄"


def icon_for(name: str, is_dir: bool) -> str:
    low = name.lower()
    for key, icon in ICON_RULES:
        if key in low:
            return icon
    return DEFAULT_FOLDER_ICON if is_dir else DEFAULT_FILE_ICON


@dataclass
class Node:
    name: str
    rel_path: str
    files: List[Tuple[str, str]] = field(default_factory=list)  # (filename, relpath)
    dirs: Dict[str, "Node"] = field(default_factory=dict)


def get_or_create_dir(parent: Node, dir_name: str, full_rel: str) -> Node:
    if dir_name not in parent.dirs:
        parent.dirs[dir_name] = Node(name=dir_name, rel_path=full_rel)
    return parent.dirs[dir_name]


def add_file_to_tree(tree: Node, rel_file_path: str) -> None:
    parts = [p for p in rel_file_path.replace("\\", "/").split("/") if p]
    fname = parts.pop()
    node = tree
    accum = ""
    for d in parts:
        accum = f"{accum}/{d}" if accum else d
        node = get_or_create_dir(node, d, accum)
    node.files.append((fname, rel_file_path.replace("\\", "/")))


def count_in_subtree(node: Node) -> int:
    total = len(node.files)
    for child in node.dirs.values():
        total += count_in_subtree(child)
    return total


def prune_empty_dirs(node: Node) -> None:
    for name in list(node.dirs.keys()):
        child = node.dirs[name]
        prune_empty_dirs(child)
        if count_in_subtree(child) == 0:
            del node.dirs[name]


def should_exclude_dir(dirname: str, exclude_dirs: List[str]) -> bool:
    d = dirname.casefold()
    return any(d == x.casefold() for x in exclude_dirs)


def normalize_ext(ext: str) -> str:
    e = ext.strip()
    if not e:
        return ""
    if not e.startswith("."):
        e = "." + e
    return e.casefold()


def build_tree(
    root: Path,
    exts: List[str],
    exclude_dirs: List[str],
    hide_root_index_html: bool,
    hide_all_index_html: bool,
    hide_nsfw_anywhere: bool,
) -> Node:
    tree = Node(name="", rel_path="")

    exts_norm = [normalize_ext(e) for e in exts if normalize_ext(e)]
    # If user didn't provide --ext at all, default to .html
    if not exts_norm:
        exts_norm = [".html"]

    for dirpath, dirnames, filenames in os.walk(root):
        # prevent walking excluded dirs
        dirnames[:] = [d for d in dirnames if not should_exclude_dir(d, exclude_dirs)]

        for fn in filenames:
            p = Path(dirpath) / fn
            rel = p.relative_to(root).as_posix()
            lower_rel = rel.casefold()
            lower_fn = fn.casefold()

            # Only include selected extensions
            if p.suffix.casefold() not in exts_norm:
                continue

            # 🚫 Exclude ROOT-level files (no subfolder)
            # i.e., "file.html" should be skipped, but "folder/file.html" is allowed
            if "/" not in rel:
                continue

            # Optional index.html hiding rules
            if hide_all_index_html and lower_rel.endswith("/index.html"):
                continue
            if hide_root_index_html and lower_rel == "index.html":
                continue

            # Optional NSFW filter
            if hide_nsfw_anywhere and ("nsfw" in lower_fn):
                continue

            add_file_to_tree(tree, rel)

    prune_empty_dirs(tree)
    return tree


def esc(s: str) -> str:
    return (
        s.replace("&", "&amp;")
         .replace("<", "&lt;")
         .replace(">", "&gt;")
         .replace('"', "&quot;")
    )


def render_files(files: List[Tuple[str, str]]) -> str:
    files_sorted = sorted(files, key=lambda x: x[0].casefold())
    lis = []
    for name, relpath in files_sorted:
        icon = icon_for(relpath, False)
        lis.append(
            f'<li><a href="{esc(relpath)}" target="_blank" rel="noopener noreferrer">'
            f'<span class="icon">{esc(icon)}</span>{esc(name)}</a></li>'
        )
    return "<ul>\n" + "\n".join(lis) + "\n</ul>"


def render_dir(node: Node, open_by_default: bool = False) -> str:
    # ✅ Subdirectories BEFORE files inside this folder
    dir_names = sorted(node.dirs.keys(), key=lambda s: s.casefold())
    files_html = render_files(node.files) if node.files else ""

    children = []
    for dn in dir_names:
        children.append(render_dir(node.dirs[dn], open_by_default=False))

    nested_parts = []
    if children:
        nested_parts.append("\n".join(children))
    if files_html:
        nested_parts.append(files_html)

    nested_html = "\n".join(nested_parts) if nested_parts else ""

    total = count_in_subtree(node)
    icon = icon_for(node.name, True)
    open_attr = " open" if open_by_default else ""
    return (
        f'<details{open_attr}>'
        f'<summary><span class="icon">{esc(icon)}</span>{esc(node.name)} '
        f'<span class="muted">({total})</span></summary>'
        f'<div class="nested">{nested_html}</div>'
        f'</details>'
    )


def render_page(root: Path, tree: Node, out_file: str) -> str:
    now = datetime.now()
    formatted = now.strftime("%B %d, %Y")
    title = f"jwesters website"

    # Root-level: only folders (files are excluded by design)
    top_folder_names = sorted(tree.dirs.keys(), key=lambda s: s.casefold())
    top_folders_html = "\n".join(render_dir(tree.dirs[name], open_by_default=False) for name in top_folder_names)

    status = "No matching files found." if (count_in_subtree(tree) == 0) else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{esc(title)}</title>
<style>
  :root {{ color-scheme: light; }}
  body {{ font-family: Arial, sans-serif; padding: 28px; background:#f7f7f7; }}
  h1 {{ margin: 0 0 8px; font-size: 22px; }}
  p  {{ margin: 0 0 18px; color:#333; }}
  .panel {{ background:#fff; border-radius:12px; padding:18px 18px 10px; box-shadow: 0 4px 14px rgba(0,0,0,.06); }}
  details {{ margin: 10px 0; border: 1px solid #eee; border-radius: 10px; background:#fafafa; }}
  summary {{ cursor:pointer; padding: 10px 12px; font-weight: 700; user-select:none; list-style:none; }}
  summary::-webkit-details-marker {{ display:none; }}
  summary::before {{ content:"▸"; display:inline-block; width: 18px; color:#666; }}
  details[open] summary::before {{ content:"▾"; }}
  ul {{ list-style:none; padding: 0 0 10px 0; margin: 0; }}
  li {{ padding: 6px 12px; }}
  a {{ text-decoration:none; color:#0066cc; }}
  a:hover {{ text-decoration:underline; }}
  .muted {{ color:#777; font-weight:400; margin-left:6px; font-size: 0.9em; }}
  .icon {{ display:inline-block; width: 22px; }}
  .nested {{ padding-left: 14px; padding-bottom: 8px; }}
  .footer {{ margin-top: 14px; font-size: 0.95em; color:#666; }}
</style>
</head>
<body>
  <h1>{esc(title)}</h1><p><br>
  <div class="panel">
    <div id="status" class="muted">{esc(status)}</div>

    {top_folders_html}
    <p><br>
    <b>Generated: {esc(formatted)}</b>
  </div><p>
  <p><br><a href="https://github.com/jwesters/website">jwesters github repo</font><br>
</body>
</html>
"""


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate indexGen.html for a folder tree.")
    ap.add_argument("--root", default=".", help="Root folder to scan (default: current folder).")
    ap.add_argument("--out", default="indexGen.html", help="Output HTML filename (default: indexGen.html).")
    ap.add_argument("--ext", action="append", default=[], help="File extension to include (repeatable). Default: .html")
    ap.add_argument("--exclude-dir", action="append", default=[".git", "node_modules"], help="Directory name to skip (repeatable).")
    ap.add_argument("--hide-root-index-html", action="store_true", help='Hide only "index.html" in the root folder. (Root files are excluded anyway.)')
    ap.add_argument("--hide-all-index-html", action="store_true", help='Hide every ".../index.html".')
    ap.add_argument("--hide-nsfw", action="store_true", help='Hide files where "nsfw" appears anywhere in the filename.')

    args = ap.parse_args()

    root = Path(args.root).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        raise SystemExit(f"Root folder does not exist or is not a directory: {root}")

    tree = build_tree(
        root=root,
        exts=args.ext,
        exclude_dirs=args.exclude_dir,
        hide_root_index_html=args.hide_root_index_html,
        hide_all_index_html=args.hide_all_index_html,
        hide_nsfw_anywhere=args.hide_nsfw,
    )

    html_text = render_page(root, tree, args.out)
    out_path = root / args.out
    out_path.write_text(html_text, encoding="utf-8")

    print(f"Wrote: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
