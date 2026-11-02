#!/usr/bin/env python3
"""Inline src/ into one self-contained HTML file.

    python3 build.py                  write docs/index.html (open it in a browser, or serve it with GitHub Pages)
    python3 build.py --check          exit 1 if docs/index.html is out of date with src/
    python3 build.py --artifact PATH  also write the bare page body used for a claude.ai artifact
"""
import argparse
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "docs" / "index.html"

FAVICON = (
    "data:image/svg+xml,"
    "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E"
    "%3Crect width='64' height='64' rx='14' fill='%23070a1c'/%3E"
    "%3Cpath d='M12 8 L36 32' stroke='%23ff9d3b' stroke-width='9' stroke-linecap='round' opacity='.55'/%3E"
    "%3Ccircle cx='39' cy='36' r='14' fill='%238d8278'/%3E"
    "%3Ccircle cx='35' cy='32' r='3.5' fill='%23564c46'/%3E"
    "%3Crect x='20' y='50' width='30' height='6' rx='2' fill='%23f5efdf'/%3E"
    "%3C/svg%3E"
)


def page() -> str:
    """The page as authored: head elements first, then the body markup and scripts."""
    html = (SRC / "index.html").read_text(encoding="utf-8")
    css = (SRC / "style.css").read_text(encoding="utf-8")
    html = html.replace('<link rel="stylesheet" href="style.css">', "<style>\n" + css + "</style>")

    def inline(m: re.Match) -> str:
        js = (SRC / m.group(1)).read_text(encoding="utf-8")
        if "</script" in js:
            sys.exit(f"{m.group(1)} contains </script")
        return "<script>\n" + js + "</script>"

    html = re.sub(r'<script src="([\w.]+\.js)"></script>', inline, html)
    if re.search(r'<script src="(?!https?:)', html):
        sys.exit("unresolved local script")
    return html


def standalone(body: str) -> str:
    head, sep, rest = body.partition("<canvas")
    if not sep:
        sys.exit("src/index.html must contain the <canvas> element")
    head = head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
    return (
        '<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        f'<link rel="icon" href="{FAVICON}">\n'
        + head.rstrip() + "\n</head>\n<body>\n" + sep + rest.rstrip() + "\n</body>\n</html>\n"
    )


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="fail if docs/index.html is stale")
    ap.add_argument("--artifact", metavar="PATH", help="write the bare page for a claude.ai artifact")
    args = ap.parse_args()

    body = page()
    built = standalone(body)
    if args.check:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != built:
            sys.exit("docs/index.html is out of date: run python3 build.py")
        print("docs/index.html is up to date")
        return
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(built, encoding="utf-8")
    print(f"docs/index.html {len(built.encode('utf-8')) / 1024:.1f} KB")
    if args.artifact:
        pathlib.Path(args.artifact).write_text(body, encoding="utf-8")
        print(f"artifact page -> {args.artifact}")


if __name__ == "__main__":
    main()
