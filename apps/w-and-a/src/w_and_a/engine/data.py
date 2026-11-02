"""Pebble & Pine, an online home-goods shop that does not exist. Every fact here is invented,
so a correct answer about it can only come from a tool."""

SHOP = "Pebble & Pine"

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

PRESETS: tuple[str, ...] = (
    "Why is order 1042 late, and what can you offer me?",
    "How did the return window change between 2025 and 2026?",
    "I bought 3 lamps at €49.90 each with the 15% spring discount. What did I pay?",
)
