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

# ---- Exact file/folder icon overrides (best signal wins)
CUSTOM_ICONS = {
    "BillboardNumberOne.html": "🎵",
    "HockeyStats.html": "🏒",
    "RealCityOrNot.html": "🌆",
    "SoccerStats.html": "⚽",
    "WeightGame.html": "⚖️",
    "binaryDLE.html": "💾",
    "CanPrices.html": "🥫",
    "CityPop.html": "🏙️",
    "polygon_guess.html": "🔷",
    "truth_or_bologna.html": "🤔",
    "Acrostic-Poem-Builder.html": "📝",
    "create_a_wordle.html": "🟩",
    "fry-speak-check-300.html": "🗣️",
    "haiku-checker.html": "🌸",
    "PWIM_Shareable_Link_Annotator.html": "🖼️",
    "RAFT_Randomizer.html": "🎲",
    "word_scrambler_maker.html": "🔤",
    "10frames.html": "🧮",
    "magic-square-generator.html": "🔢",
    "Math_Questions_Generator.html": "❓",
    "dice_roller.html": "🎲",
    "Random_Card.html": "🃏",
    "attendance_maker.html": "✅",
    "draw_from_memory.html": "🧠",
    "ELA6_practice_site.html": "📖",
    "grade5_science.html": "🔬",
    "pitch_higher_quiz.html": "🎼",
    "QR_Creator.html": "🔳",
    "random_group_maker_offline.html": "👥",
    "rorschach.html": "🖼️",
    "scattergories.html": "💡",
    "science6_practice_site.html": "🧪",
    "word_cloud_builder.html": "☁️",
    "WordSearchGenerator.html": "🔎",
    "anti-dots-and-boxes.html": "◻️",
    "antiSOS.html": "🆘",
    "Ataxx_Clone.html": "⚔️",
    "black-hole.html": "🕳️",
    "bomb_hunt_minesweeper.html": "💣",
    "bridgit.html": "🌉",
    "classic_minesweeper.html": "💣",
    "dots-and-boxes.html": "◼️",
    "HexaSudoku.html": "🔢",
    "HexVariants.html": "⬡",
    "hold-the-line.html": "📏",
    "NIM.html": "🪙",
    "Obstruction.html": "🚧",
    "ShikakuBlanks.html": "▭",
    "tetromino-battleship.html": "🚢",
    "exact-four-10x10.html": "4️⃣",
    "expandable-tic-tac-toe-4inarow.html": "❌",
    "order-and-chaos.html": "🔀",
    "row_call.html": "📣",
    "antiSimon.html": "🔁",
    "CrazyJezzball.html": "⚪",
    "drop67.html": "🎲",
    "ghost_vs_pacman.html": "👻",
    "LineDraw.html": "✏️",
    "pong.html": "🏓",
    "SIM.html": "🧠",
    "Wheel_Of_Fortune.html": "🎡",
    "word-ladder.html": "🪜",
    "Typing_Test.html": "⌨️",
    "Rotate_Tetris.html": "🧱",
    "Tetris_Left_to_Right.html": "🧱",
    "Tetris_No_Rotate.html": "🧱",
    "Tetris_Random.html": "🧱",
    "Tetris_Reverse_Gravity.html": "🧱",
    "Tetris_Right_to_Left.html": "🧱",
    "DLE_and_ThisOrThat_Games": "🟩",
    "Math_Games": "➗",
    "Misc": "🛠️",
    "Misc_Games": "🎮",
    "Tetris_Games": "🧱",
}

# ---- Keyword rules (longest keyword match wins)
ICON_RULES = [
    # Exact-ish education terms
    ("attendance", "✅"),
    ("science", "🔬"),
    ("experiment", "🧪"),
    ("weather", "⛅"),
    ("climate", "🌦️"),
    ("coding", "💻"),
    ("computer", "💻"),
    ("binary", "💾"),
    ("algorithm", "⚙️"),
    ("input_output", "🔁"),
    ("input-output", "🔁"),
    ("input output", "🔁"),

    # Math
    ("divisibility", "➗"),
    ("decimal", "🔢"),
    ("fraction", "➗"),
    ("algebra", "🧮"),
    ("polygon", "🔷"),
    ("cartesian", "📍"),
    ("operations", "➕"),
    ("pedmas", "🧮"),
    ("number", "🔢"),
    ("count", "🔢"),
    ("math", "➗"),
    ("dice", "🎲"),

    # Literacy / language
    ("spelling", "✎"),
    ("acrostic", "📝"),
    ("haiku", "🌸"),
    ("wordsearch", "🔎"),
    ("word_search", "🔎"),
    ("wordle", "🟩"),
    ("word", "🔤"),
    ("reading", "📖"),
    ("writing", "✍️"),
    ("ela", "🕮"),
    ("vocab", "🧠"),
    ("poem", "📝"),
    ("scrambler", "🔤"),
    ("raft", "📝"),

    # Media / creation tools
    ("word_cloud", "☁️"),
    ("cloud", "☁️"),
    ("qr_creator", "🔳"),
    ("qrcode", "🔳"),
    ("qr", "🔳"),
    ("image", "🖼️"),
    ("annotator", "🖍️"),
    ("generator", "⚙️"),
    ("creator", "🛠️"),
    ("builder", "🧰"),
    ("tool", "🛠️"),
    ("randomizer", "🎲"),

    # Games / logic
    ("tetris", "🧱"),
    ("tetromino", "🧱"),
    ("hangman", "🪓"),
    ("maze", "🧩"),
    ("sudoku", "🔢"),
    ("shikaku", "▭"),
    ("minesweeper", "💣"),
    ("battleship", "🚢"),
    ("tictactoe", "❌"),
    ("tic_tac_toe", "❌"),
    ("tic-tac-toe", "❌"),
    ("chess", "♔"),
    ("knight", "♞"),
    ("card", "🃏"),
    ("deck", "🃏"),
    ("game", "🎮"),
    ("play", "🎮"),
    ("puzzle", "🧩"),
    ("simon", "🔁"),
    ("fortune", "🎡"),
    ("pacman", "👻"),
    ("ghost", "👻"),
    ("pong", "🏓"),

    # Stats / themed quizzes
    ("billboard", "🎵"),
    ("pitch", "🎼"),
    ("hockey", "🏒"),
    ("soccer", "⚽"),
    ("city", "🌆"),
    ("weight", "⚖️"),
    ("time", "⏰"),
    ("clock", "⏰"),

    # Site / repo
    ("index", "🏠"),
]
DEFAULT_FOLDER_ICON = "📁"
DEFAULT_FILE_ICON = "📄"

TOP_LEVEL_CATEGORIES = {
    "Math_Games": "Math & Numeracy",
    "DLE_and_ThisOrThat_Games": "Quizzes & Quick Play",
    "Misc": "Tools & Classroom Utilities",
    "Misc_Games": "Games & Puzzles",
    "Tetris_Games": "Games & Puzzles",
}

CATEGORY_ORDER = [
    "Math & Numeracy",
    "Literacy & Language",
    "Science & Study",
    "Tools & Classroom Utilities",
    "Quizzes & Quick Play",
    "Games & Puzzles",
    "Other",
]

CATEGORY_ICONS = {
    "Math & Numeracy": "➗",
    "Literacy & Language": "📖",
    "Science & Study": "🔬",
    "Tools & Classroom Utilities": "🛠️",
    "Quizzes & Quick Play": "🟩",
    "Games & Puzzles": "🎮",
    "Other": "📁",
}


def category_for_top_folder(name: str) -> str:
    if name in TOP_LEVEL_CATEGORIES:
        return TOP_LEVEL_CATEGORIES[name]
    low = name.casefold()
    if "math" in low:
        return "Math & Numeracy"
    if any(k in low for k in ["ela", "reading", "writing", "word", "spelling"]):
        return "Literacy & Language"
    if any(k in low for k in ["science", "study"]):
        return "Science & Study"
    if any(k in low for k in ["tool", "misc", "generator", "maker"]):
        return "Tools & Classroom Utilities"
    if any(k in low for k in ["game", "tetris", "chess", "maze", "puzzle"]):
        return "Games & Puzzles"
    return "Other"


def icon_for(name: str, is_dir: bool) -> str:
    base = Path(name).name
    if base in CUSTOM_ICONS:
        return CUSTOM_ICONS[base]

    low = name.lower()
    matches = [(key, icon) for key, icon in ICON_RULES if key in low]
    if matches:
        matches.sort(key=lambda x: len(x[0]), reverse=True)
        return matches[0][1]

    return DEFAULT_FOLDER_ICON if is_dir else DEFAULT_FILE_ICON


@dataclass
class Node:
    name: str
    rel_path: str
    files: List[Tuple[str, str]] = field(default_factory=list)
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
    if not exts_norm:
        exts_norm = [".html"]

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if not should_exclude_dir(d, exclude_dirs)]

        for fn in filenames:
            p = Path(dirpath) / fn
            rel = p.relative_to(root).as_posix()
            lower_rel = rel.casefold()
            lower_fn = fn.casefold()

            if p.suffix.casefold() not in exts_norm:
                continue
            if "/" not in rel:
                continue
            if hide_all_index_html and lower_rel.endswith("/index.html"):
                continue
            if hide_root_index_html and lower_rel == "index.html":
                continue
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


def slugify(s: str) -> str:
    out = []
    for ch in s.lower():
        if ch.isalnum():
            out.append(ch)
        elif ch in " _-/":
            out.append("-")
    slug = "".join(out)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-") or "section"


def render_files(files: List[Tuple[str, str]]) -> str:
    files_sorted = sorted(files, key=lambda x: x[0].casefold())
    lis = []
    for name, relpath in files_sorted:
        icon = icon_for(relpath, False)
        lis.append(
            f'<li><a href="{esc(relpath)}" target="_blank" rel="noopener noreferrer">'
            f'<span class="icon">{esc(icon)}</span><span>{esc(name)}</span></a></li>'
        )
    return "<ul>\n" + "\n".join(lis) + "\n</ul>"


def render_dir(node: Node, open_by_default: bool = False) -> str:
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


def render_sidebar(tree: Node) -> str:
    grouped: Dict[str, List[str]] = {cat: [] for cat in CATEGORY_ORDER}
    for folder_name in sorted(tree.dirs.keys(), key=lambda s: s.casefold()):
        category = category_for_top_folder(folder_name)
        grouped.setdefault(category, []).append(folder_name)

    sections: List[str] = []
    for cat in CATEGORY_ORDER:
        folder_names = grouped.get(cat, [])
        if not folder_names:
            continue
        cat_icon = CATEGORY_ICONS.get(cat, "📁")
        items = []
        for folder_name in folder_names:
            anchor = slugify(folder_name)
            icon = icon_for(folder_name, True)
            count = count_in_subtree(tree.dirs[folder_name])
            items.append(
                f'<li><a href="#{esc(anchor)}"><span class="icon">{esc(icon)}</span>'
                f'{esc(folder_name)} <span class="muted">({count})</span></a></li>'
            )
        sections.append(
            f'<div class="side-group"><h3><span class="icon">{esc(cat_icon)}</span>{esc(cat)}</h3><ul>'
            + "".join(items) + "</ul></div>"
        )
    return "\n".join(sections)


def render_main_sections(tree: Node) -> str:
    grouped: Dict[str, List[str]] = {}
    for folder_name in sorted(tree.dirs.keys(), key=lambda s: s.casefold()):
        grouped.setdefault(category_for_top_folder(folder_name), []).append(folder_name)

    blocks: List[str] = []
    for cat in CATEGORY_ORDER:
        folder_names = grouped.get(cat, [])
        if not folder_names:
            continue
        cat_icon = CATEGORY_ICONS.get(cat, "📁")
        folder_blocks = []
        for folder_name in folder_names:
            folder_node = tree.dirs[folder_name]
            folder_blocks.append(
                f'<section class="folder-block" id="{esc(slugify(folder_name))}">'
                f'<h2><span class="icon">{esc(icon_for(folder_name, True))}</span>{esc(folder_name)} '
                f'<span class="muted">({count_in_subtree(folder_node)})</span></h2>'
                f'{render_dir(folder_node, open_by_default=True)}'
                f'</section>'
            )
        blocks.append(
            f'<section class="category-block"><div class="category-heading"><span class="icon">{esc(cat_icon)}</span>'
            f'<span>{esc(cat)}</span></div>'
            + "".join(folder_blocks) + "</section>"
        )
    return "\n".join(blocks)


def render_page(root: Path, tree: Node, out_file: str) -> str:
    now = datetime.now()
    formatted = now.strftime("%B %d, %Y")
    title = "jwesters website"
    total_items = count_in_subtree(tree)
    status = "No matching files found." if total_items == 0 else f"{total_items} files indexed"

    sidebar_html = render_sidebar(tree)
    main_html = render_main_sections(tree)

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{esc(title)}</title>
<style>
  :root {{
    color-scheme: light;
    --bg:#f4f6f8;
    --panel:#ffffff;
    --panel-soft:#fafbfc;
    --border:#e4e8ee;
    --text:#1f2937;
    --muted:#667085;
    --link:#0b66d0;
    --shadow:0 8px 28px rgba(15, 23, 42, .08);
    --radius:18px;
  }}
  * {{ box-sizing:border-box; }}
  html {{ scroll-behavior:smooth; }}
  body {{ margin:0; font-family:Arial, sans-serif; color:var(--text); background:var(--bg); }}
  a {{ color:var(--link); text-decoration:none; }}
  a:hover {{ text-decoration:underline; }}
  .page {{ max-width:1500px; margin:0 auto; padding:24px; }}
  .hero {{ background:linear-gradient(135deg, #ffffff, #f8fbff); border:1px solid var(--border); border-radius:24px; box-shadow:var(--shadow); padding:24px; margin-bottom:20px; }}
  .hero h1 {{ margin:0 0 8px; font-size:30px; }}
  .hero p {{ margin:0; color:var(--muted); line-height:1.5; }}
  .layout {{ display:grid; grid-template-columns:320px minmax(0, 1fr); gap:20px; align-items:start; }}
  .sidebar {{ position:sticky; top:18px; background:var(--panel); border:1px solid var(--border); border-radius:var(--radius); box-shadow:var(--shadow); padding:18px; }}
  .sidebar h2 {{ margin:0 0 14px; font-size:18px; }}
  .side-group + .side-group {{ margin-top:14px; padding-top:14px; border-top:1px solid var(--border); }}
  .side-group h3 {{ margin:0 0 8px; font-size:14px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }}
  .side-group ul {{ list-style:none; margin:0; padding:0; }}
  .side-group li {{ margin:4px 0; }}
  .side-group a {{ display:block; padding:7px 8px; border-radius:10px; }}
  .side-group a:hover {{ background:#f3f7ff; text-decoration:none; }}
  .content {{ display:flex; flex-direction:column; gap:18px; }}
  .category-block {{ background:var(--panel); border:1px solid var(--border); border-radius:var(--radius); box-shadow:var(--shadow); padding:18px; }}
  .category-heading {{ display:flex; align-items:center; gap:10px; font-size:20px; font-weight:700; margin-bottom:14px; }}
  .folder-block + .folder-block {{ margin-top:14px; }}
  .folder-block h2 {{ margin:0 0 10px; font-size:18px; }}
  details {{ margin:10px 0; border:1px solid var(--border); border-radius:14px; background:var(--panel-soft); overflow:hidden; }}
  summary {{ cursor:pointer; padding:12px 14px; font-weight:700; user-select:none; list-style:none; }}
  summary::-webkit-details-marker {{ display:none; }}
  summary::before {{ content:"▸"; display:inline-block; width:18px; color:#666; }}
  details[open] summary::before {{ content:"▾"; }}
  ul {{ list-style:none; padding:0 0 10px 0; margin:0; }}
  li {{ padding:6px 12px; }}
  .muted {{ color:var(--muted); font-weight:400; margin-left:6px; font-size:.92em; }}
  .icon {{ display:inline-block; width:24px; text-align:center; margin-right:2px; }}
  .nested {{ padding:0 0 10px 16px; }}
  .footer {{ margin-top:18px; color:var(--muted); font-size:.95em; }}
  .footer a {{ font-weight:700; }}
  @media (max-width: 980px) {{
    .layout {{ grid-template-columns:1fr; }}
    .sidebar {{ position:static; }}
  }}
</style>
</head>
<body>
  <div class="page">
    <header class="hero">
      <h1>{esc(title)}</h1>
      <p>{esc(status)} · Browse by category in the sidebar or open a folder below.<br>
      Generated: <strong>{esc(formatted)}</strong></p>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <h2>Browse by category</h2>
        {sidebar_html}
      </aside>

      <main class="content">
        {main_html}
        <div class="footer"><a href="https://github.com/jwesters/website">jwesters github repo</a></div>
      </main>
    </div>
  </div>
</body>
</html>
'''


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
