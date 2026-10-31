# Site assistant AI providers

The site assistant and FAQ draft summarizer support up to three providers that
use the OpenAI-compatible chat completions API. Providers are tried in the
configured order. The next provider is tried when a provider times out, returns
an error, or produces an invalid or empty response. A valid response ends the
chain.

Configure `AI_PROVIDERS` as a JSON array in the frontend's server environment
(for example, in the hosting provider's environment-variable settings):

```json
[
  {
    "name": "Primary",
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "set-this-in-your-host-environment",
    "model": "your-primary-model"
  },
  {
    "name": "Fallback",
    "baseUrl": "https://api.example.com/v1",
    "apiKey": "set-this-in-your-host-environment",
    "model": "your-fallback-model"
  }
]
```

Use the provider's API base URL; the application appends
`/chat/completions`. A full chat completions URL is also accepted. Use HTTPS
for remote providers. Local HTTP endpoints are allowed only on localhost for
development. Keep API keys in the host's secret environment settings, never in
client-side variables such as `NEXT_PUBLIC_*`, source code, or this file.

When `AI_PROVIDERS` is set, it replaces the legacy single-provider settings.
If it is not set, the app continues to use `AI_API_KEY`, `AI_MODEL`, and the
optional `AI_BASE_URL` as a single-provider configuration.

Each provider attempt times out after eight seconds. Requests can be sent to
later providers in the list, so configure only providers you trust to process
visitor questions. The privacy policy describes this behavior.
