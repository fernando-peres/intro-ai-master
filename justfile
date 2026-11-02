# List recipes
default:
    @just --list

# Serve the repo over HTTP (presentation decks need it for ES modules)
serve port="8000":
    @echo "Deck 06: http://localhost:{{port}}/presentation/06/"
    uv run python -m http.server {{port}}

# Run the all-apps terminal dashboard (every service, the deck and the html pages)
tui:
    uv run all-apps
