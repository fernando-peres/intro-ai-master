# List recipes
default:
    @just --list

# Serve the repo over HTTP (presentation decks need it for ES modules)
serve port="8000":
    @echo "Deck 06: http://localhost:{{port}}/presentation/06/"
    @echo "Deck 07: http://localhost:{{port}}/presentation/07/"
    uv run python -m http.server {{port}}

# Record a deck to MP4 in its export/ folder (opens Chrome; keep the window open until it finishes)
record deck="07":
    pnpm --dir presentation/tools install --ignore-workspace --silent
    node presentation/tools/record-deck.mjs {{deck}}

# Run the all-apps terminal dashboard (every service, the deck and the html pages)
tui:
    uv run all-apps
