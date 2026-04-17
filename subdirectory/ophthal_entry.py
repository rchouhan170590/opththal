import html
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

PUBLISH_DIR = Path(__file__).resolve().parent / "publish"
_ALLOWED_PAGES = frozenset(["index", *[f"topic-{i}" for i in range(1, 10)]])
_ALLOWED_HTML = frozenset(
    ["index.html", *[f"topic-{i}.html" for i in range(1, 10)]]
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


@st.cache_resource
def _publish_http_base() -> str:
    publish = PUBLISH_DIR.resolve()
    if not publish.is_dir():
        raise FileNotFoundError(publish)

    class _Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(publish), **kwargs)

    server = ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
    port = server.server_address[1]
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{port}"


def _iframe_embed_html(base_url: str, html_name: str) -> str:
    if html_name not in _ALLOWED_HTML:
        html_name = "index.html"
    url = f"{base_url}/{html_name}"
    safe_url = html.escape(url, quote=True)
    return (
        f'<iframe src="{safe_url}" '
        'style="width:100%;height:1200px;border:0;display:block" '
        'title="Ophthalmology content" loading="lazy"></iframe>'
    )


st.set_page_config(page_title="Ophthalmology Section I", layout="wide")

page = _get_page_param()
html_name = _html_filename_for_page(page)
base = _publish_http_base()
components.html(
    _iframe_embed_html(base, html_name),
    height=1220,
    scrolling=False,
)
