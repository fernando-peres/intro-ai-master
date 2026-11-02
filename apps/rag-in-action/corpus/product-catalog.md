---
id: product-catalog
title: Product Catalog
department: Product
owner: Rita Sales
updated: 2026-02-03-14-30-00
tags: [products, coldbox, tracking, api]
related: [pricing-tiers, shipping-slas, glossary]
---

# Product Catalog

Nimbus sells three services and one piece of hardware. Prices live in [Pricing tiers](pricing-tiers.md); delivery promises live in [Shipping SLAs](shipping-slas.md).

## ColdBox sensor

ColdBox is the reusable sensor that rides inside every parcel. It logs temperature every 30 seconds and humidity every 2 minutes, and uploads its log over LTE-M when the van stops. The battery lasts 21 days. A ColdBox that is not returned within 30 days is billed at **€38** to the customer.

The current hardware is **ColdBox v3** (released 2025-09). v2 units are still in service but cannot report humidity.

## Services

### Same-Day Chill

Pickup before 11:00, delivery the same day within one metropolitan area. Temperature band 2–8 °C.

### Next-Day Chill

Delivery the next working day anywhere in mainland Portugal and Spain. Temperature band 2–8 °C.

### Frost

Frozen goods kept at −25 °C to −18 °C. Always routed through Hub South in Seville, so it adds one day to the delivery time.

## Nimbus Track API

Customers query live parcel status and the ColdBox temperature log through the **Nimbus Track API** (REST, JSON). The rate limit is 600 requests per minute per API key. Webhooks fire on `picked_up`, `out_of_band` and `delivered`.
