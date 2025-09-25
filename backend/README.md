# Backend

## Database Environments

### Local Development

1. Copy `.env.example` to `.env.development.local` and replace the placeholders with your real credentials. Make sure the password in `DATABASE_URL` is URL-encoded.
2. Install dependencies and prepare the database:
   ```bash
   npm i
   npm run db:generate
   npm run db:migrate:dev
   npm run db:seed:dev
   ```

### Staging

- For local staging tests, create `.env.staging.local` and set `DATABASE_URL` (and optional `SHADOW_DATABASE_URL`).
- In CI/CD, inject the `STAGE_DATABASE_URL` GitHub Secret so workflows can run `prisma migrate deploy` without committing credentials.

### Production (GitHub Deployments)

- In the GitHub repository settings, add a `PROD_DATABASE_URL` secret. The GitHub Actions workflow will run `prisma migrate deploy` using this value whenever migrations change on the `main` branch.

### Additional Notes

- Always URL-encode special characters in passwords (for example, replace `@` with `%40`).
- Shared hosts that require a dedicated shadow database can use the optional `SHADOW_DATABASE_URL` variable, following the pattern in `.env.example`.
