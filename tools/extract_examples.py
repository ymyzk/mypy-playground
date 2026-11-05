"""Extract playground examples from CrossHair's support_treemap.svg.

Usage: python tools/extract_examples.py support_treemap.svg > examples.json

Each example: {id, source, verdict (fill color name), title}.
"""
import html
import json
import re
import sys
from urllib.parse import unquote_plus

COLORS = {
    "#3fa650": "green",
    "#e8b400": "yellow",
    "#d5503a": "red",
    "#222222": "black",
    "#c9ced6": "?",
}

ANCHOR = re.compile(r'<a href="([^"]*)"[^>]*>(.*?)</a>', re.S)


def extract(svg: str):
    out = []
    for href, body in ANCHOR.findall(svg):
        marker = "crosshair-web.org/?source="
        if marker not in href:
            continue
        source = unquote_plus(html.unescape(href.split("source=", 1)[1]))
        fill = re.search(r"fill='(#[0-9a-fA-F]{6})'", body)
        title = re.search(r"<title>(.*?)</title>", body, re.S)
        out.append(
            {
                "id": len(out),
                "source": source,
                "verdict": COLORS.get(fill.group(1).lower(), fill.group(1)) if fill else None,
                "title": html.unescape(title.group(1)) if title else None,
            }
        )
    return out


if __name__ == "__main__":
    with open(sys.argv[1]) as f:
        json.dump(extract(f.read()), sys.stdout, indent=1)
