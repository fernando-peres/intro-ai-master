# blocks: the interactive notes app

**Status:** Implemented
**Project:** `apps/blocks`

## Purpose

Give students one place, deployable to Streamlit Community Cloud, to open the interactive HTML notes that accompany the course: one self-contained page per building block of a GenAI system.

## Access

Every page sits behind a login page (`ui/auth.py`, the same gate as `apps/w-and-a`); deep links land on it too. Credentials default to `student` / `novaims` and are overridden by `APP_USER` / `APP_PASSWORD` (environment or Streamlit Cloud secrets). The session stays logged in until the browser tab closes or **Log out** (sidebar bottom) is pressed.

## Pages

`st.navigation` is hidden; the sidebar draws the header, **Home**, a **Blocks** group with one link per block, and **Log out**. The sidebar is Streamlit's own: resizable by dragging its right edge, hidden and shown with its collapse arrow.

- **Home** (`/home`, the default page): a short introduction and a grid of cards, three per row. Each card shows the block's title and summary and an **Open** button that switches to its page.
- **Block** (`/<slug>`): `html/<slug>.html` rendered with `st.components.v1.html` in a 1100 px scrolling iframe. The file is read once per process (`st.cache_data`). The iframe allows scripts and same-origin, so each page's JavaScript and `localStorage` work. Streamlit's static serving is not used because it serves `.html` as plain text.

## Registry

`blocks.py` holds `BLOCKS`, in teaching order: `tools`, `context`, `mcp`, `guardrails`, `evals`, `observability`, `experiments`. Each entry has a slug (the HTML file stem and the URL path), a title, a Material icon and the card summary. `tests/test_pages.py` fails if the registry and the files in `html/` disagree.

## Shared files

The HTML files are also linked from `presentation/06/index.html` (`../../apps/blocks/src/blocks/html/<slug>.html`), so the deck and the app show the same pages.
