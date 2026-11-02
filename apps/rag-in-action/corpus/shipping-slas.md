---
id: shipping-slas
title: Shipping SLAs
department: Operations
owner: Marta Quintela
updated: 2026-03-20-10-15-00
tags: [sla, delivery, credits, operations]
related: [product-catalog, returns-policy, incident-2026-03-postmortem]
---

# Shipping SLAs

These are the delivery promises Nimbus makes for each service in the [Product catalog](product-catalog.md).

## Delivery windows

| Service | Promise | Cut-off |
|---|---|---|
| Same-Day Chill | Same day by 20:00 | Pickup before 11:00 |
| Next-Day Chill | Next working day by 18:00 | Pickup before 17:00 |
| Frost | Second working day by 18:00 | Pickup before 15:00 |

## Temperature excursions

An **excursion** is any period of more than 10 consecutive minutes outside the service's temperature band, as recorded by ColdBox. A parcel with an excursion counts as not intact for the IAR, even when it arrives on time.

## Service credits

When Nimbus misses an SLA, the customer gets a credit on the next invoice:

- Late by up to 4 hours: **15 %** of the shipment price.
- Late by more than 4 hours: **40 %**.
- Temperature excursion: **100 %**, and the customer may also file a claim under the [Returns policy](returns-policy.md).

Credits are capped at 100 % of the shipment price and are applied automatically within 5 working days. They do not apply during a declared **force majeure** event, such as a national strike or a red weather warning.
