import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  AiProviderConfigurationError,
  requestAiCompletion,
} from "./aiProvider.js";

const originalEnvironment = {
  AI_PROVIDERS: process.env.AI_PROVIDERS,
  AI_API_KEY: process.env.AI_API_KEY,
  AI_MODEL: process.env.AI_MODEL,
  AI_BASE_URL: process.env.AI_BASE_URL,
};
const originalFetch = globalThis.fetch;

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  globalThis.fetch = originalFetch;
});

function configureProviders(providers) {
  process.env.AI_PROVIDERS = JSON.stringify(providers);
  delete process.env.AI_API_KEY;
  delete process.env.AI_MODEL;
  delete process.env.AI_BASE_URL;
}

function completion(content) {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

test("uses the next provider when the first provider returns an error", async () => {
  configureProviders([
    {
      name: "primary",
      baseUrl: "https://primary.example/v1",
      apiKey: "primary-secret",
      model: "primary-model",
    },
    {
      name: "backup",
      baseUrl: "https://backup.example/v1",
      apiKey: "backup-secret",
      model: "backup-model",
    },
  ]);
  const attempts = [];
  globalThis.fetch = async (url, options) => {
    attempts.push({ url, options });
    if (attempts.length === 1) return new Response(null, { status: 503 });
    return completion("Backup answer");
  };

  const answer = await requestAiCompletion({
    messages: [{ role: "user", content: "Question" }],
    maxTokens: 100,
    temperature: 0.2,
  });

  assert.equal(answer, "Backup answer");
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0].url, "https://primary.example/v1/chat/completions");
  assert.equal(attempts[1].url, "https://backup.example/v1/chat/completions");
  assert.equal(attempts[1].options.headers.Authorization, "Bearer backup-secret");
});

test("falls back when a provider returns unusable content", async () => {
  configureProviders([
    {
      name: "primary",
      baseUrl: "https://primary.example/v1",
      apiKey: "primary-secret",
      model: "primary-model",
    },
    {
      name: "backup",
      baseUrl: "https://backup.example/v1",
      apiKey: "backup-secret",
      model: "backup-model",
    },
  ]);
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    return completion(attempts === 1 ? "" : "Valid answer");
  };

  const answer = await requestAiCompletion({
    messages: [],
    maxTokens: 100,
    temperature: 0.2,
  });

  assert.equal(answer, "Valid answer");
  assert.equal(attempts, 2);
});

test("preserves the legacy single-provider environment configuration", async () => {
  delete process.env.AI_PROVIDERS;
  process.env.AI_API_KEY = "legacy-secret";
  process.env.AI_MODEL = "legacy-model";
  process.env.AI_BASE_URL = "https://legacy.example/v1";
  let requestUrl;
  globalThis.fetch = async (url) => {
    requestUrl = url;
    return completion("Legacy answer");
  };

  const answer = await requestAiCompletion({
    messages: [],
    maxTokens: 100,
    temperature: 0.2,
  });

  assert.equal(answer, "Legacy answer");
  assert.equal(requestUrl, "https://legacy.example/v1/chat/completions");
});

test("rejects malformed provider configuration instead of silently skipping it", async () => {
  process.env.AI_PROVIDERS = "{not-json";

  await assert.rejects(
    requestAiCompletion({ messages: [], maxTokens: 100, temperature: 0.2 }),
    AiProviderConfigurationError,
  );
});
