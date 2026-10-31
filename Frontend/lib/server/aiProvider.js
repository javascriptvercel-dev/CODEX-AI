const MAX_PROVIDERS = 3;
const PROVIDER_TIMEOUT_MS = 8_000;

export class AiProviderConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AiProviderConfigurationError";
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateProvider(provider, index) {
  if (
    !provider ||
    !isNonEmptyString(provider.name) ||
    !isNonEmptyString(provider.apiKey) ||
    !isNonEmptyString(provider.model) ||
    !isNonEmptyString(provider.baseUrl)
  ) {
    throw new AiProviderConfigurationError(
      `AI_PROVIDERS entry ${index + 1} must include name, apiKey, model, and baseUrl.`,
    );
  }

  let url;
  try {
    url = new URL(provider.baseUrl.trim());
  } catch {
    throw new AiProviderConfigurationError(
      `AI_PROVIDERS entry ${index + 1} has an invalid baseUrl.`,
    );
  }

  const isLocalHttp =
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (!isLocalHttp && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new AiProviderConfigurationError(
      `AI_PROVIDERS entry ${index + 1} must use an HTTPS baseUrl without credentials, query parameters, or fragments.`,
    );
  }

  return {
    name: provider.name.trim().replace(/[\r\n]/g, " ").slice(0, 60),
    apiKey: provider.apiKey.trim(),
    model: provider.model.trim(),
    endpoint: url.href.replace(/\/+$/, "").endsWith("/chat/completions")
      ? url.href.replace(/\/+$/, "")
      : `${url.href.replace(/\/+$/, "")}/chat/completions`,
  };
}

function getProviders() {
  const configuredProviders = process.env.AI_PROVIDERS?.trim();
  if (configuredProviders) {
    let parsed;
    try {
      parsed = JSON.parse(configuredProviders);
    } catch {
      throw new AiProviderConfigurationError(
        "AI_PROVIDERS must be a valid JSON array.",
      );
    }

    if (
      !Array.isArray(parsed) ||
      parsed.length === 0 ||
      parsed.length > MAX_PROVIDERS
    ) {
      throw new AiProviderConfigurationError(
        `AI_PROVIDERS must contain between 1 and ${MAX_PROVIDERS} providers.`,
      );
    }
    return parsed.map(validateProvider);
  }

  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim();
  if (!apiKey || !model) {
    throw new AiProviderConfigurationError(
      "Configure AI_PROVIDERS or both AI_API_KEY and AI_MODEL.",
    );
  }

  return [
    validateProvider(
      {
        name: "primary",
        apiKey,
        model,
        baseUrl: process.env.AI_BASE_URL?.trim() || "https://api.openai.com/v1",
      },
      0,
    ),
  ];
}

export async function requestAiCompletion({
  messages,
  maxTokens,
  temperature,
  parseContent = (content) => {
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("The provider returned no content.");
    }
    return content.trim();
  },
}) {
  const providers = getProviders();

  for (const provider of providers) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      PROVIDER_TIMEOUT_MS,
    );

    try {
      const response = await fetch(provider.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error(
          `[site-assistant] AI provider "${provider.name}" returned status ${response.status}; trying the next provider.`,
        );
        continue;
      }

      let result;
      try {
        result = await response.json();
      } catch {
        console.error(
          `[site-assistant] AI provider "${provider.name}" returned invalid JSON; trying the next provider.`,
        );
        continue;
      }

      try {
        return parseContent(result?.choices?.[0]?.message?.content);
      } catch {
        console.error(
          `[site-assistant] AI provider "${provider.name}" returned unusable content; trying the next provider.`,
        );
      }
    } catch (error) {
      const reason = error?.name === "AbortError" ? "timed out" : "request failed";
      console.error(
        `[site-assistant] AI provider "${provider.name}" ${reason}; trying the next provider.`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("All configured AI providers failed.");
}
