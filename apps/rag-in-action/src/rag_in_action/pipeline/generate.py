"""Augment and generate: put retrieved chunks into the prompt, ask the LLM, read its citations."""

import re

from genai.assistant import Assistant, Message
from rag_in_action.pipeline.retrieve import Hit

RAG_SYSTEM = (
    "You are the internal help assistant of Nimbus Logistics. Answer the question using ONLY "
    "the context blocks below. Cite every fact with the block id in square brackets, e.g. "
    "[shipping-slas#3]. If the context does not contain the answer, say you don't know."
)
PLAIN_SYSTEM = (
    "You are the internal help assistant of Nimbus Logistics. Answer the employee's question."
)
_CITATION = re.compile(r"\[([\w.-]+#\d+)\]")


def context_block(hit: Hit) -> str:
    r = hit.record
    head = f"[{r['chunk_id']}] {r['title']}" + (f" › {r['section']}" if r.get("section") else "")
    return f"{head}\n{r['text']}"


def build_messages(question: str, hits: list[Hit], *, rag: bool) -> list[Message]:
    if not rag:
        return [Message("system", PLAIN_SYSTEM), Message("user", question)]
    context = "\n\n---\n\n".join(context_block(h) for h in hits) or "(no context retrieved)"
    return [
        Message("system", RAG_SYSTEM),
        Message("user", f"Context:\n\n{context}\n\n---\n\nQuestion: {question}"),
    ]


def citations(answer: str) -> list[str]:
    """Distinct chunk ids cited as `[doc#n]`, in order of first appearance."""
    return list(dict.fromkeys(_CITATION.findall(answer)))


def answer(assistant: Assistant, messages: list[Message]) -> str:
    return assistant.reply(messages)
