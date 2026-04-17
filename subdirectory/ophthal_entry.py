import re
from pathlib import Path

import streamlit as st

PUBLISH_DIR = Path(__file__).resolve().parent / "publish"
_ALLOWED_PAGES = frozenset(["index", *[f"topic-{i}" for i in range(1, 10)]])
_ALLOWED_FILES = frozenset(
    ["index.html", *[f"topic-{i}.html" for i in range(1, 10)], "styles.css", "video-player.js"]
)


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


def _prepare_html(raw: str) -> str:
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
        # Same-document query navigation (works in the real page, not inside an iframe).
        return f'href="?page={stem}"'

    raw = re.sub(r'href=\"([^\"]+\.html)\"', _rewrite_href_attr, raw)
    return raw


st.set_page_config(page_title="Ophthalmology Section I", layout="wide")

page = _get_page_param()
html_name = _html_filename_for_page(page)
html_content = _prepare_html(_read_publish_file(html_name))

# Not iframed (unlike components.html). Prevents loading streamlit.app inside the component iframe,
# which caused duplicated chrome and blank/flashing content when clicking topics.
st.html(html_content, width="stretch", unsafe_allow_javascript=True)
