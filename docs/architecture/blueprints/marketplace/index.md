# Marketplace Domain Blueprints

Technical implementation blueprints for the Marketplace domain.

## Blueprints

- [Availability Management](./availability-management.md) - Worker availability date ranges and date blocking with automatic locking
- [Geo-Availability](./geo-availability.md) - Distance-based worker filtering using zip codes and Haversine formula for radius calculations
- [Optimistic Concurrency](./optimistic-concurrency.md) - Optimistic concurrency approach for worker availability with final availability check at checkout to prevent double-booking
- [Saved Searches & Alerts](./saved-searches-alerts.md) - Saved search criteria with timezone-aware alerts (daily digest and instant notifications)
- [Worker Search Engine](./worker-search-engine.md) - Comprehensive worker search with filters, privacy controls, and performance optimization
