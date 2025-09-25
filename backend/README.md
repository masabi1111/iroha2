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

## Running the API and Tests

Set the following environment variables before starting the NestJS server:

- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `DATABASE_URL` (for Prisma models that need to reach a database)
- Optional: `PORT` (defaults to `3000`)

Install dependencies and build/run the server:

```bash
npm install
npm run build
npm start
```

For a faster developer loop you can run the TypeScript sources directly:

```bash
npm run start:dev
```

Tests:

```bash
npm test        # unit tests
npm run test:e2e
```

## Production DB via GitHub Secrets

### Adding the production secret

1. In GitHub → Settings → Secrets → Actions → **New repository secret**:
   - **Name**: `PROD_DATABASE_URL`
   - **Value example**: `mysql://u331221487_mmasabi:Musabi%400594332524@srv1725.hstgr.io:3306/u331221487_irohaDB?sslaccept=accept`
2. Passwords must be URL-encoded (for example, `@` becomes `%40`).
3. Allowlist the GitHub runner IP in your Hostinger **Remote MySQL** settings if required.

### Deploying production migrations

- Push a commit to `main` that modifies `backend/prisma/migrations/**` or trigger the "Deploy Prisma Migrations" workflow manually.
