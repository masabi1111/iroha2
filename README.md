# iroha

This repository hosts the product blueprint for **iroha (いろは)** — a seasonal Japanese distance-learning platform.

## Contents
- [`docs/blueprint.md`](docs/blueprint.md): end-to-end architecture, schema, API, and roadmap.

Use this blueprint as the foundation for implementing the backend (NestJS), frontend (Next.js), and mobile (Flutter/React Native) clients.

## Web App Environment

The Next.js client expects the following environment variable when running locally:

```bash
export NEXT_PUBLIC_RETURN_URL="http://localhost:3000/payment/return"
```

This URL is shared with the payment provider to handle the browser return flow after checkout.
