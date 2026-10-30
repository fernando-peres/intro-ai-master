"""Domain services: every invariant and permission check lives here, not in routes.

Services flush but never commit; the route (one request = one transaction) commits.
"""
