# CODEX AI Frontend

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_API_URL` to the URL serving the application API. Leave it empty only when the API is served from the same origin.
4. Start the development server with `npm run dev`.

## Production check

Run `npm run lint` and `npm run build` before deployment.

The packaged project intentionally does not include a local environment file. Keep real environment values out of source control.
