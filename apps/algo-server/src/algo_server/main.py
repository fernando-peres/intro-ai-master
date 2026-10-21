"""FastAPI application."""

from fastapi import FastAPI

from algo_server.genai_routes import router as genai_router

app = FastAPI(title="algo-server")
app.include_router(genai_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
