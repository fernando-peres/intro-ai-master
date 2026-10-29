"""FastAPI application."""

from fastapi import FastAPI

from algo_server.embeddings_routes import router as embeddings_router
from algo_server.genai_routes import router as genai_router
from algo_server.toy_routes import router as toy_router

app = FastAPI(title="algo-server")
app.include_router(genai_router)
app.include_router(toy_router)
app.include_router(embeddings_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
