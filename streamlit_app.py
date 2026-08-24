# -*- coding: utf-8 -*-
"""Streamlit deployment wrapper for the customer repurchase analyzer."""

from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components


ROOT = Path(__file__).resolve().parent


@st.cache_data(show_spinner=False)
def build_app_html() -> str:
    """Inline local CSS and JavaScript so they work inside Streamlit's iframe."""
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    javascript = (ROOT / "app.js").read_text(encoding="utf-8")

    html = html.replace(
        '<link rel="stylesheet" href="styles.css">',
        f"<style>\n{css}\n</style>",
    )
    html = html.replace(
        '<script src="app.js"></script>',
        f"<script>\n{javascript}\n</script>",
    )
    return html


st.set_page_config(
    page_title="顧客回購分析與名單篩選系統",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
      html, body, [data-testid="stAppViewContainer"] { background: #f4f6fb; }
      [data-testid="stHeader"], [data-testid="stToolbar"], footer { display: none; }
      .block-container { max-width: 1500px; padding: .5rem 1rem 1rem; }
      iframe { display: block; border: 0; width: 100%; }
    </style>
    """,
    unsafe_allow_html=True,
)

components.html(build_app_html(), height=1900, scrolling=True)
