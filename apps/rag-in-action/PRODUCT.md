# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The course instructor, demoing RAG live in class on a projector; students repeat the steps on their own afterwards.

## Product Purpose

Make every stage of Retrieval-Augmented Generation visible and adjustable: load a Markdown corpus, chunk, enrich, embed, store in FAISS, then retrieve and generate in a chat that shows exactly what reached the model. Success is a student explaining why a chunking or retrieval choice changed an answer.

## Operating Context

Projected in a lecture room, driven by one person, one stage at a time. Runs locally (`uv run rag-in-action`); generation needs `OPENAI_API_KEY` in the repo-root `.env`, local MiniLM embeddings do not.

## Capabilities and Constraints

- Corpus: 10 authored Markdown files about the invented company Nimbus Logistics, with frontmatter, cross-links and a hand-written keyword index. Its facts are fictional and must stay labelled as such.
- Six chunking strategies, two embedders (local MiniLM, OpenAI), dense / keyword / hybrid retrieval.

## Brand Commitments

Part of the intro-ai course: reuse the ai-intro dark theme and the color buckets in `docs/branding.md`.

## Product Principles

- Show the real intermediate data, never a cartoon of it.
- One idea per screen, legible from the back of the room.
- Every control changes something visible on the same screen.

## Accessibility & Inclusion

Projector legibility: large type, contrast at least 4.5:1, color never the only signal.
