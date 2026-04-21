import base64
import html
import os
import re
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import streamlit as st

PUBLISH_DIR = Path(__file__).resolve().parent / "publish"
_ALLOWED_PAGES = frozenset(["index", *[f"topic-{i}" for i in range(1, 10)]])
_ALLOWED_FILES = frozenset(
    ["index.html", *[f"topic-{i}.html" for i in range(1, 10)], "styles.css", "video-player.js"]
)


def _strip_query_and_fragment(url: str) -> str:
    u = urlparse(url)
    return urlunparse(u._replace(query="", fragment=""))


def _canonical_app_url() -> str:
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


def _assets_base_url() -> str:
    """Optional public base for diagram PNGs (e.g. raw.githubusercontent.com/.../publish)."""
    v = os.environ.get("OPHTHAL_ASSETS_BASE_URL", "").strip().rstrip("/")
    if v:
        return v
    try:
        if hasattr(st, "secrets") and st.secrets.get("OPHTHAL_ASSETS_BASE_URL"):
            return str(st.secrets["OPHTHAL_ASSETS_BASE_URL"]).strip().rstrip("/")
    except Exception:
        pass
    return ""


def _mime_for_asset(rel: str) -> str:
    lower = rel.lower()
    if lower.endswith(".png"):
        return "image/png"
    if lower.endswith((".jpg", ".jpeg")):
        return "image/jpeg"
    if lower.endswith(".gif"):
        return "image/gif"
    if lower.endswith(".webp"):
        return "image/webp"
    if lower.endswith(".svg"):
        return "image/svg+xml"
    return "application/octet-stream"


def _rewrite_image_src_for_streamlit(raw: str) -> str:
    """Browser loads st.html in Streamlit origin; relative assets/... URLs 404.
    Either prefix OPHTHAL_ASSETS_BASE_URL (e.g. raw GitHub base) or embed as data: from disk.
    """
    assets_base = _assets_base_url()

    def repl(m: re.Match[str]) -> str:
        rel = m.group(1)
        if not rel.startswith("assets/"):
            return m.group(0)
        if assets_base:
            url = f"{assets_base}/{rel}"
            return f'src="{html.escape(url, quote=True)}"'
        path = PUBLISH_DIR / rel
        if not path.is_file():
            return m.group(0)
        b64 = base64.b64encode(path.read_bytes()).decode("ascii")
        mime = _mime_for_asset(rel)
        return f'src="data:{mime};base64,{b64}"'

    return re.sub(r'src=\"(assets/[^\"]+)\"', repl, raw)


def _prepare_html(raw: str, *, iframe: bool, canonical_base: str = "") -> str:
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

    raw = _rewrite_image_src_for_streamlit(raw)

    base = canonical_base or _canonical_app_url()

    def _rewrite_href_attr(m: re.Match) -> str:
        stem = Path(m.group(1)).stem
        if not iframe:
            return f'href="?page={stem}"'
        dest = _url_with_page_param(base, stem)
        safe = html.escape(dest, quote=True)
        return (
            f'href="{safe}" onclick="window.top.location.assign(this.href); return false;"'
        )

    raw = re.sub(r'href=\"([^\"]+\.html)\"', _rewrite_href_attr, raw)
    return raw


def _emit_html_bundle(raw_source: str) -> None:
    """Prefer st.html (main DOM); fall back to components.html for older Streamlit."""
    content_main = _prepare_html(raw_source, iframe=False)
    content_iframe = _prepare_html(raw_source, iframe=True)

    try:
        st.html(content_main, width="stretch", unsafe_allow_javascript=True)
        return
    except (AttributeError, TypeError):
        pass

    try:
        st.html(content_main, width="stretch")
        return
    except (AttributeError, TypeError):
        pass

    import streamlit.components.v1 as components

    components.html(content_iframe, height=1200, scrolling=True)


st.set_page_config(page_title="Ophthalmology Section I", layout="wide")

page = _get_page_param()
html_name = _html_filename_for_page(page)
_emit_html_bundle(_read_publish_file(html_name))
