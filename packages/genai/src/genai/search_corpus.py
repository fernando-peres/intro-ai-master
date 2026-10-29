"""A small company-policy corpus for comparing keyword search with embedding search.

The documents deliberately describe the same idea in different words (PTO, vacation, leave) so
that an exact-word match misses what a vector match finds. The keyword ranking is naive on purpose.
"""

import re
import threading
from dataclasses import dataclass
from typing import Literal

import numpy as np

from genai.sentence_vectors import SentenceEncoder
from genai.vectors import cosine_scores, top_indices

Category = Literal["hr", "finance", "support", "it", "travel"]


@dataclass(frozen=True)
class Document:
    id: str
    title: str
    category: Category
    text: str


DOCUMENTS = (
    Document(
        "hr-pto",
        "Paid time off",
        "hr",
        "Full-time staff accrue PTO every month and can book it with their manager's approval.",
    ),
    Document(
        "hr-vacation",
        "Annual vacation",
        "hr",
        "Every employee gets twenty-five vacation days a year, plus public holidays.",
    ),
    Document(
        "hr-parental",
        "Parental leave",
        "hr",
        "New parents may take sixteen weeks of paid leave in the year after a birth or adoption.",
    ),
    Document(
        "hr-remote",
        "Hybrid working",
        "hr",
        "Employees may work from home up to three days per week if the team agrees on anchor days.",
    ),
    Document(
        "hr-sick",
        "Sick days",
        "hr",
        "If you are unwell, tell your manager early; a doctor's note is due after a week.",
    ),
    Document(
        "hr-review",
        "Performance reviews",
        "hr",
        "Managers meet each report twice a year to discuss goals, feedback and promotion.",
    ),
    Document(
        "hr-onboarding",
        "Onboarding",
        "hr",
        "New hires follow a four-week plan with a buddy, a laptop on day one and weekly check-ins.",
    ),
    Document(
        "fin-expense",
        "Expense claims",
        "finance",
        "Submit receipts within thirty days; claims with no receipt pay at most fifty euros.",
    ),
    Document(
        "fin-perdiem",
        "Daily allowance",
        "finance",
        "While travelling, staff receive a per diem that covers meals and small incidentals.",
    ),
    Document(
        "fin-card",
        "Company cards",
        "finance",
        "Corporate cards are issued to managers and may be used only for business purchases.",
    ),
    Document(
        "fin-invoice",
        "Supplier invoices",
        "finance",
        "Invoices are paid net forty-five days after approval by the budget owner.",
    ),
    Document(
        "fin-budget",
        "Annual budgeting",
        "finance",
        "Each department submits a budget request in October; the board signs off in December.",
    ),
    Document(
        "fin-payroll",
        "Payroll dates",
        "finance",
        "Salaries are paid on the twenty-fifth of every month, or the previous working day.",
    ),
    Document(
        "fin-approval",
        "Spending approval",
        "finance",
        "Purchases above five thousand euros need a second signature from a director.",
    ),
    Document(
        "sup-refund",
        "Refunds",
        "support",
        "Customers can return a product within thirty days and get their money back in full.",
    ),
    Document(
        "sup-shipping",
        "Delivery times",
        "support",
        "Standard parcels arrive in three to five working days; express orders arrive next day.",
    ),
    Document(
        "sup-password",
        "Customer sign-in",
        "support",
        "If a customer forgets their password, send a reset link; never ask them to say it aloud.",
    ),
    Document(
        "sup-escalate",
        "Escalation",
        "support",
        "Hand an angry customer to a team lead after the second unresolved contact.",
    ),
    Document(
        "sup-warranty",
        "Warranty",
        "support",
        "Hardware is covered for two years against manufacturing faults but not against accidents.",
    ),
    Document(
        "sup-hours",
        "Support hours",
        "support",
        "The help desk answers phones from eight to six on weekdays and chat all weekend.",
    ),
    Document(
        "sup-tone",
        "Tone of voice",
        "support",
        "Write short, friendly replies; apologise once, then fix the problem.",
    ),
    Document(
        "it-boot",
        "Device will not start",
        "it",
        "If your laptop fails to boot, hold the power button for ten seconds, then call IT.",
    ),
    Document(
        "it-vpn",
        "VPN access",
        "it",
        "Connect to the VPN before opening internal tools from outside the office network.",
    ),
    Document(
        "it-mfa",
        "Two-factor sign-in",
        "it",
        "Every account needs a second factor; set up the authenticator app during onboarding.",
    ),
    Document(
        "it-software",
        "Installing software",
        "it",
        "Request new applications through the portal; unapproved programs are removed overnight.",
    ),
    Document(
        "it-backup",
        "Backups",
        "it",
        "Files saved in the shared drive are backed up nightly; files on the desktop are not.",
    ),
    Document(
        "it-phishing",
        "Suspicious email",
        "it",
        "Forward anything that looks like phishing to security and delete the original.",
    ),
    Document(
        "it-printer",
        "Printing",
        "it",
        "Badge in at any floor printer to release your documents; unclaimed jobs vanish later.",
    ),
    Document(
        "tr-flights",
        "Booking flights",
        "travel",
        "Book flights at least two weeks ahead through the travel portal and choose economy class.",
    ),
    Document(
        "tr-hotel",
        "Hotels",
        "travel",
        "Stay at a listed partner hotel; the nightly rate is capped at one hundred fifty euros.",
    ),
    Document(
        "tr-rail",
        "Train journeys",
        "travel",
        "For trips under four hours, take the train instead of a plane.",
    ),
    Document(
        "tr-visa",
        "Visas",
        "travel",
        "Check entry rules early; the office handles visa applications for work trips abroad.",
    ),
    Document(
        "tr-car",
        "Rental cars",
        "travel",
        "Hire a car only when public transport is unavailable, and refuel it before returning.",
    ),
    Document(
        "tr-insurance",
        "Travel insurance",
        "travel",
        "All business trips are covered automatically; keep the policy number on your phone.",
    ),
    Document(
        "tr-delay",
        "Delays and cancellations",
        "travel",
        "If a flight is cancelled, rebook through the portal and keep every receipt for a claim.",
    ),
)


def keywords(text: str) -> list[str]:
    """Distinct lowercase `[a-z0-9]+` words in order of appearance; no stemming, on purpose."""
    return list(dict.fromkeys(re.findall(r"[a-z0-9]+", text.lower())))


def jaccard(a: list[str], b: list[str]) -> float:
    """Shared words divided by all distinct words in either list."""
    left, right = set(a), set(b)
    union = left | right
    return len(left & right) / len(union) if union else 0.0


@dataclass(frozen=True)
class Hit:
    id: str
    score: float
    #: Words the query and document have in common; empty for the semantic ranking.
    shared: list[str]


@dataclass(frozen=True)
class SearchResult:
    query_tokens: list[str]
    query_vector: list[float]
    semantic: list[Hit]
    keyword: list[Hit]


class SearchIndex:
    """Embeds the corpus on the first search and keeps the vectors for every later one."""

    def __init__(self, encoder: SentenceEncoder, documents: tuple[Document, ...] = DOCUMENTS):
        self._encoder = encoder
        self._documents = documents
        self._matrix: np.ndarray | None = None
        self._lock = threading.Lock()

    def _embed(self) -> np.ndarray:
        with self._lock:
            if self._matrix is None:
                vectors = self._encoder.encode([d.text for d in self._documents], normalize=True)
                self._matrix = np.array([v.vector for v in vectors], dtype=np.float64)
            return self._matrix

    def search(self, query: str, *, top_k: int) -> SearchResult:
        matrix = self._embed()
        query_vector = self._encoder.encode([query], normalize=True)[0].vector
        scores = cosine_scores(matrix, np.ones(len(matrix)), np.array(query_vector))
        semantic = [
            Hit(self._documents[i].id, round(float(scores[i]), 4), [])
            for i in top_indices(scores, k=top_k, exclude=set())
        ]
        tokens = keywords(query)
        overlaps = [
            (jaccard(tokens, keywords(d.text)), [t for t in tokens if t in keywords(d.text)], d)
            for d in self._documents
        ]
        ranked = sorted((o for o in overlaps if o[0] > 0), key=lambda o: -o[0])[:top_k]
        keyword = [Hit(d.id, round(score, 4), shared) for score, shared, d in ranked]
        return SearchResult(tokens, query_vector, semantic, keyword)
