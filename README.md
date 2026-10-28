# Shopfront Studio

create me a eshop

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/621871f7-56fa-5242-a07f-f52017d7d19a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Account database

The app uses SQLite for account data. Local development creates `data/cashvibe.sqlite` automatically.
Vercel's serverless filesystem is not durable, so production uses a hosted SQLite-compatible Turso
database. Create a Turso database and add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to the
Vercel project's Production environment variables, then redeploy. These values are server-only and
must not use the `VITE_` prefix.

To create the hosted database with the Turso CLI, run `turso db create cashvibe-auth`, then copy the
URL from `turso db show cashvibe-auth --url` and create a token with
`turso db tokens create cashvibe-auth`. The app creates its account tables automatically on first use.
