# Database and security deployment notes

## Important architecture note

The application now refuses to start unless PostgreSQL is reachable and application data can be loaded from PostgreSQL. JSON-file persistence was removed. However, existing application services still mutate a process-local cache and write a PostgreSQL snapshot after changes. This transitional implementation is **single-instance only** and is not safe for horizontal scaling or concurrent multi-instance writes. A full follow-up migration should convert `server/application/services.ts` and `server/presentation/apiRoutes.ts` to await the `pgRepository.ts` CRUD methods directly, and remove `pgSync.ts` snapshot persistence.

Do not deploy multiple application instances until that repository refactor is completed.

## Initial database setup

1. Copy `.env.example` to `.env` and configure `DATABASE_URL`, `APP_URL`, and the other real secrets.
2. Run `npm run db:migrate`.
3. Configure an administrator using environment variables `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 14 characters), and `ADMIN_MOBILE`, then run `npm run db:bootstrap-admin`.
4. Set all other real service secrets (such as payment and AI credentials) in the environment.
5. Start the app with `npm run dev` or `npm start`.

The seed migration disables the built-in sample administrator/staff/customer accounts. Do not re-enable fixed demo credentials. Keep `.env` out of source control.

## Authentication changes

- Authentication now uses random, server-side sessions stored in PostgreSQL. Only a hash of the session identifier is stored in `user_sessions`.
- The browser cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` in production. Logout revokes the session in the database.
- Browser JavaScript no longer stores the session secret in `localStorage`.
- Session cookies are protected by same-origin checks for state-changing API requests.
- Password hashing uses PBKDF2-SHA-512 with a stronger work factor for new passwords; legacy hashes remain verifiable so users can log in and change their passwords.
- Admin permissions are checked server-side. Database administration routes require SuperAdmin.

## Operational requirements

- Serve production traffic over HTTPS and set `APP_URL` to the public HTTPS origin.
- Use a database role with only the privileges the application needs; do not connect as PostgreSQL superuser.
- Keep PostgreSQL certificate verification enabled. If the provider requires a CA, configure that CA rather than disabling verification.
- Configure backups, monitoring, and a shared rate-limit store before scaling.
- The request body limit is 1 MB; store large product images in object storage instead of sending them as base64 JSON.
- Run tests and build checks against a staging database before production deployment.
