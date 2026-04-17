import html
import os
import re
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import streamlit as st
import streamlit.components.v1 as components

PUBLISH_DIR = Path(__file__).resolve().parent / "publish"
_ALLOWED_PAGES = frozenset(["index", *[f"topic-{i}" for i in range(1, 10)]])
_ALLOWED_FILES = frozenset(
    ["index.html", *[f"topic-{i}.html" for i in range(1, 10)], "styles.css", "video-player.js"]
)


def _strip_query_and_fragment(url: str) -> str:
    u = urlparse(url)
    return urlunparse(u._replace(query="", fragment=""))


def _canonical_app_url() -> str:
    """Base URL of this app (scheme + host + path), no query. Used for link targets in iframes."""
    for key in ("OPHTHAL_PUBLIC_URL", "OPHTHAL_PUBLIC_ORIGIN"):
        v = os.environ.get(key, "").strip()
        if v:
            return _strip_query_and_fragment(v.rstrip("/"))
    try:
        if hasattr(st, "secrets") and st.secrets.get("OPHTHAL_PUBLIC_URL"):
            return _strip_query_and_fragment(str(st.secrets["OPHTHAL_PUBLIC_URL"]).strip())
    except Exception:
        pass
    ctx = getattr(st, "context", None)
    raw = getattr(ctx, "url", None) if ctx else None
    if isinstance(raw, str) and raw.strip():
        return _strip_query_and_fragment(raw.strip())
    return "http://localhost:8501"


def _url_with_page_param(canonical_base: str, page_stem: str) -> str:
    u = urlparse(canonical_base)
    pairs = dict(parse_qsl(u.query, keep_blank_values=True))
    pairs["page"] = page_stem
    path = u.path or "/"
    return urlunparse(u._replace(path=path, query=urlencode(pairs)))


def _get_page_param() -> str:
    page = st.query_params.get("page", "index")
    if isinstance(page, list):
        page = page[0] if page else "index"
    if not page:
        page = "index"
    return page if page in _ALLOWED_PAGES else "index"


def _html_filename_for_page(page: str) -> str:
    return "index.html" if page == "index" else f"{page}.html"


def _read_publish_file(name: str) -> str:
    if name not in _ALLOWED_FILES:
        raise ValueError("Unsupported file")
    path = PUBLISH_DIR / name
    if not path.is_file():
        raise FileNotFoundError(path)
    return path.read_text(encoding="utf-8")


def _prepare_html(raw: str, canonical_base: str) -> str:
    css = _read_publish_file("styles.css")
    raw = raw.replace(
        '<link rel="stylesheet" href="styles.css">',
        f"<style>\n{css}\n</style>",
        1,
    )
    if '<script src="video-player.js"></script>' in raw:
        js = _read_publish_file("video-player.js")
        raw = raw.replace(
            '<script src="video-player.js"></script>',
            f"<script>\n{js}\n</script>",
            1,
        )

    def _rewrite_href_attr(m: re.Match) -> str:
        stem = Path(m.group(1)).stem
        dest = _url_with_page_param(canonical_base, stem)
        safe = html.escape(dest, quote=True)
        # Top-level navigation from Streamlit's srcdoc iframe blocks target=_top; user-activated
        # assign() to the real app URL works on streamlit.app and local dev.
        return f'href="{safe}" onclick="window.top.location.assign(this.href); return false;"'

    raw = re.sub(r'href=\"([^\"]+\.html)\"', _rewrite_href_attr, raw)
    return raw


st.set_page_config(page_title="Ophthalmology Section I", layout="wide")

page = _get_page_param()
html_name = _html_filename_for_page(page)
base = _canonical_app_url()
html_content = _prepare_html(_read_publish_file(html_name), base)

components.html(html_content, height=1200, scrolling=True)
