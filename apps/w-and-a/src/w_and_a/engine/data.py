"""Pebble & Pine, an online home-goods shop that does not exist. Every fact here is invented,
so a correct answer about it can only come from a tool."""

from dataclasses import dataclass

SHOP = "Pebble & Pine"
#: The date every model is told it is today; the order dates are set around it.
TODAY = "2026-11-02"

ORDERS: dict[str, dict] = {
    "1042": {
        "order_id": "1042",
        "status": "delayed",
        "items": ["Oak floor lamp", "Linen cushion cover (x2)"],
        "total_eur": 189.70,
        "ship_to_city": "Porto",
        "ordered": "2026-10-24",
        "promised_delivery": "2026-10-30",
        "expected_delivery": "2026-11-05",
        "delay_reason": "Storm Ilda closed the Porto hub for two days; parcels are moving again.",
    },
    "1043": {
        "order_id": "1043",
        "status": "delivered",
        "items": ["Ceramic table lamp"],
        "total_eur": 64.00,
        "ship_to_city": "Lisbon",
        "ordered": "2026-10-20",
        "promised_delivery": "2026-10-25",
        "delivered": "2026-10-24",
    },
    "1044": {
        "order_id": "1044",
        "status": "processing",
        "items": ["Wool throw", "Pine side table"],
        "total_eur": 238.50,
        "ship_to_city": "Coimbra",
        "ordered": "2026-11-01",
        "promised_delivery": "2026-11-07",
    },
}

POLICIES: list[dict] = [
    {
        "id": "returns-2026",
        "keywords": "return refund window days money back",
        "title": "Returns policy (from 2026-01-01)",
        "text": "Return any item within 30 days of delivery for a full refund. Return shipping "
        "is free for orders over €50. Refunds are paid within 5 working days.",
    },
    {
        "id": "returns-2025",
        "keywords": "return refund window days old previous",
        "title": "Returns policy (2025, replaced on 2026-01-01)",
        "text": "Items could be returned within 14 days of delivery. The customer paid return "
        "shipping (€5.90). Refunds were paid within 10 working days.",
    },
    {
        "id": "delivery-delays",
        "keywords": "late delay delayed compensation offer voucher discount storm weather apology",
        "title": "Late deliveries",
        "text": "If an order arrives more than 3 days after the promised date, the customer gets "
        "a 15% voucher on the order total, or free express shipping on the next order. Weather "
        "delays are covered too.",
    },
    {
        "id": "shipping",
        "keywords": "delivery shipping express how long days",
        "title": "Shipping times",
        "text": "Standard shipping takes 3 to 6 working days in mainland Portugal. Express "
        "shipping takes 1 to 2 working days and costs €7.50.",
    },
    {
        "id": "warranty",
        "keywords": "warranty broken defect repair guarantee",
        "title": "Warranty",
        "text": "Lamps and furniture carry a 3-year warranty against manufacturing defects. "
        "Textiles carry 1 year.",
    },
    {
        "id": "discounts",
        "keywords": "discount spring sale lamp price voucher",
        "title": "Spring discount",
        "text": "The spring discount takes 15% off each lamp's price. It does not stack with "
        "other vouchers.",
    },
]

WEATHER: dict[str, dict] = {
    "porto": {"city": "Porto", "today": "heavy rain, wind gusts to 70 km/h", "temp_c": 13},
    "lisbon": {"city": "Lisbon", "today": "cloudy, light showers", "temp_c": 17},
    "coimbra": {"city": "Coimbra", "today": "rain easing in the afternoon", "temp_c": 15},
}


@dataclass(frozen=True)
class Preset:
    """An example question, asked in every chat. Each one is the best fit for one mode."""

    question: str
    #: The mode this question was chosen to show off (a key of `modes.MODES`).
    best: str
    #: The lesson of the question, in one line.
    takeaway: str
    #: What each chat does with it, keyed by chat key (`MODE_KEYS`).
    watch: dict[str, str]


#: The chats a preset can run in: the two chatbot variants, then the other four modes.
MODE_KEYS = ("chatbot_scripted", "chatbot_llm", "prompt", "workflow", "agent", "agentic")

PRESETS: tuple[Preset, ...] = (
    Preset(
        "Write a short, friendly apology for a late delivery.",
        "prompt",
        "No private data needed: one manual call is enough.",
        {
            "chatbot_scripted": "“late delivery” trips the order rule: it asks for an id.",
            "chatbot_llm": "Writes it well: no shop data is needed.",
            "prompt": "One call, a good answer. Nothing more was needed.",
            "workflow": "Classify → no tool fits → draft: two calls for one call's work.",
            "agent": "No tool needed: the same text, at a higher price.",
            "agentic": "A plan, handoffs and a review for one paragraph: more steps, more drift.",
        },
    ),
    Preset(
        "What's the status of order 1043?",
        "workflow",
        "Known steps: a workflow is cheap and does the same thing every time.",
        {
            "chatbot_scripted": "A rule finds the id and a template answers.",
            "chatbot_llm": "It can't see orders: it says so.",
            "prompt": "It can't see orders: it hands the work back to you.",
            "workflow": "Classify → look up → draft. Correct, cheap, the same every time.",
            "agent": "Same answer, more tokens: the freedom wasn't needed.",
            "agentic": "Same answer, about five model calls.",
        },
    ),
    Preset(
        "Can I still return the lamp from order 1043, and who pays shipping?",
        "agent",
        "It needs two lookups the path didn't plan: only the agent gets both.",
        {
            "chatbot_scripted": "The first rule wins: it gives the order status, not returns.",
            "chatbot_llm": "No order, no policy: generic advice.",
            "prompt": "No order, no policy: generic advice.",
            "workflow": "One route only: it gets the policy or the order, never both.",
            "agent": "It looks up the order *and* the policy: yes, in time; shipping is free.",
            "agentic": "The lead splits the two questions between two specialists.",
        },
    ),
    Preset(
        "Where is order 1045? It's the wool throw going to Coimbra.",
        "agent",
        "A step fails: the agent changes course; the workflow just reports the error.",
        {
            "chatbot_scripted": "The lookup fails: “check the number”.",
            "chatbot_llm": "It can't check, so it can't notice the wrong id.",
            "prompt": "It can't check, so it can't notice the wrong id.",
            "workflow": "The lookup fails and the path ends: “no such order”.",
            "agent": "Sees the error, searches by item and city, finds 1044.",
            "agentic": "The orders specialist recovers the same way.",
        },
    ),
    Preset(
        "Orders 1042 and 1044: where is each, any weather risk, and what will I be owed?",
        "agent",
        "Many parts: one agent copes. A team costs twice as much, and facts can slip in handoffs.",
        {
            "chatbot_scripted": "The first id wins; the rest is ignored.",
            "chatbot_llm": "It can't do any part of it.",
            "prompt": "It asks you for every fact it would need.",
            "workflow": "The path takes the first id only: 1044 is skipped.",
            "agent": "One loop, six tools, every part answered.",
            "agentic": "Plan → two specialists → reviewer: about twice the tokens of the agent.",
        },
    ),
)
