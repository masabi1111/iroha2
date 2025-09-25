# Backend

## Database Connection (Remote MySQL)

1. In the hosting panel, add the server/client IP to the Remote MySQL allowlist.
2. Create a local `.env` (do **NOT** commit):
   ```env
   DATABASE_URL="mysql://u331221487_mmasabi:Musabi%400594332524@srv1725.hstgr.io:3306/u331221487_irohaDB?sslaccept=accept"
   ```
3. Run:
   ```bash
   npm i
   npm run db:generate
   npm run db:migrate   # first time (or use db:deploy on production)
   npm run db:seed
   ```

**Notes**

- If SSL errors occur, keep `?sslaccept=accept` (switch to strict later).
- On shared hosts that block shadow DB, set `SHADOW_DATABASE_URL` or run `db:deploy` using generated migrations.
