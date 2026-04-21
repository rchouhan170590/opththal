#!/usr/bin/env python3
"""
One-off / repeatable: extract inline SVGs from topic-*.html diagram-wrap blocks,
write PNGs under assets/topic-N/, replace SVG with <img> in the HTML files.
Requires: rsvg-convert (librsvg) on PATH.
"""
from __future__ import annotations

import html as html_lib
import re
import subprocess
import sys
import tempfile
from pathlib import Path

PUBLISH = Path(__file__).resolve().parent
DIAGRAM_BLOCK = re.compile(
    r'(<div class="diagram-wrap">\s*<h3>)(?P<title>[^<]+)(</h3>\s*)'
    r'(?P<svg><svg\b.*?</svg>)(\s*</div>)',
    re.DOTALL | re.IGNORECASE,
)
SVG_OPEN = re.compile(
    r"<svg\b[^>]*\bwidth=\"(\d+)\"[^>]*\bheight=\"(\d+)\"",
    re.IGNORECASE,
)
SVG_OPEN_ALT = re.compile(
    r"<svg\b[^>]*\bheight=\"(\d+)\"[^>]*\bwidth=\"(\d+)\"",
    re.IGNORECASE,
)


def slugify(title: str) -> str:
    t = html_lib.unescape(title.strip())
    for ch in ("—", "–", "−"):
        t = t.replace(ch, "-")
    t = re.sub(r"[^\w\s-]+", "", t, flags=re.UNICODE)
    t = re.sub(r"[-\s]+", "-", t)
    return t.strip("-").lower()


def parse_wh(svg: str) -> tuple[str, str]:
    m = SVG_OPEN.search(svg)
    if m:
        return m.group(1), m.group(2)
    m = SVG_OPEN_ALT.search(svg)
    if m:
        return m.group(2), m.group(1)
    vb = re.search(r'viewBox="0\s+0\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)"', svg)
    if vb:
        return str(int(float(vb.group(1)))), str(int(float(vb.group(2))))
    return "640", "480"


def svg_to_png(svg_path: Path, png_path: Path) -> None:
    subprocess.run(
        ["rsvg-convert", "-o", str(png_path), str(svg_path)],
        check=True,
        capture_output=True,
        text=True,
    )


def process_file(html_path: Path) -> None:
    stem = html_path.stem  # topic-1
    if not stem.startswith("topic-"):
        return
    text = html_path.read_text(encoding="utf-8")
    assets_dir = PUBLISH / "assets" / stem
    assets_dir.mkdir(parents=True, exist_ok=True)

    def repl(m: re.Match[str]) -> str:
        title = m.group("title")
        svg_body = m.group("svg")
        slug = slugify(title)
        if not slug:
            slug = "diagram"
        base = slug
        n = 1
        while (assets_dir / f"{slug}.png").exists():
            n += 1
            slug = f"{base}-{n}"

        png_path = assets_dir / f"{slug}.png"
        svg_xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg_body.strip() + "\n"
        try:
            with tempfile.NamedTemporaryFile(
                mode="w",
                suffix=".svg",
                delete=False,
                encoding="utf-8",
            ) as tmp:
                tmp.write(svg_xml)
                tmp_path = Path(tmp.name)
            try:
                svg_to_png(tmp_path, png_path)
            finally:
                tmp_path.unlink(missing_ok=True)
        except subprocess.CalledProcessError as e:
            print(e.stderr, file=sys.stderr)
            raise
        w, h = parse_wh(svg_body)
        alt = html_lib.escape(html_lib.unescape(title.strip()))
        rel = f"assets/{stem}/{slug}.png"
        img = (
            f'<img class="diagram-img" src="{rel}" alt="{alt}" '
            f'width="{w}" height="{h}" loading="lazy" />'
        )
        return m.group(1) + title + m.group(3) + img + m.group(5)

    new_text, n = DIAGRAM_BLOCK.subn(repl, text)
    if n == 0:
        print(f"No diagram-wrap SVG blocks in {html_path.name}", file=sys.stderr)
        return
    html_path.write_text(new_text, encoding="utf-8")
    print(f"{html_path.name}: replaced {n} SVG(s) → assets/{stem}/")


def main() -> None:
    for p in sorted(PUBLISH.glob("topic-*.html")):
        process_file(p)


if __name__ == "__main__":
    main()
