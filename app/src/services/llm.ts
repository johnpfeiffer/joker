import { parseJokeResponse, type ChatResponse, type ParsedJokeResponse } from "../models/chat";
import { buildJokePrompt } from "../prompts/jokePrompt";

export interface JokeClientConfig {
  baseUrl: string;
  path: string;
}

export interface JokeRequest {
  prompt: string;
  joke: ParsedJokeResponse;
  interactionId?: string;
}

export const CHAT_API_PATH = "/links/chat";

export const jokeClientConfig: JokeClientConfig = {
  baseUrl: readEnvString("VITE_CHAT_API_BASE_URL", ""),
  path: readEnvString("VITE_CHAT_API_PATH", CHAT_API_PATH),
};

export async function requestJoke(
  history: ChatResponse[],
  config: JokeClientConfig = jokeClientConfig,
  fetcher: typeof fetch = fetch,
): Promise<JokeRequest> {
  const prompt = buildJokePrompt(history);
  const previousInteractionId = latestInteractionId(history);
  const response = await fetcher(buildChatUrl(config), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: prompt,
      previousInteractionId,
    }),
  });

  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readChatError(data, response.status));
  }

  const rawMessage = readAssistantMessage(data);
  const parsed = parseJokeResponse(rawMessage);
  if (!parsed) {
    throw new Error('LLM response did not include JSON joke text shaped as {"text","style","subject"}');
  }

  const interactionId = readInteractionId(data);
  return {
    prompt,
    joke: parsed,
    ...(interactionId ? { interactionId } : {}),
  };
}

export function readAssistantMessage(data: unknown): string {
  if (typeof data === "string") {
    return data.trim();
  }

  if (typeof data !== "object" || data === null) {
    return "";
  }

  const candidate = data as Record<string, unknown>;
  const simpleText = firstString(candidate.message, candidate.response, candidate.content, candidate.text);
  if (simpleText) {
    return simpleText;
  }

  const choices = candidate.choices;
  if (!Array.isArray(choices)) {
    return "";
  }

  for (const choice of choices) {
    if (typeof choice !== "object" || choice === null) {
      continue;
    }

    const record = choice as Record<string, unknown>;
    const direct = firstString(record.text, record.content);
    if (direct) {
      return direct;
    }

    const message = record.message;
    if (typeof message === "object" && message !== null) {
      const messageText = firstString((message as Record<string, unknown>).content);
      if (messageText) {
        return messageText;
      }
    }
  }

  return "";
}

export function readInteractionId(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return "";
  }

  const value = (data as Record<string, unknown>).interactionId;
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function readChatError(data: unknown, status: number): string {
  if (typeof data === "object" && data !== null) {
    const error = (data as Record<string, unknown>).error;
    if (typeof error === "string" && error.trim()) {
      return error.trim();
    }
  }

  return `Chat failed (${status})`;
}

function latestInteractionId(history: ChatResponse[]): string | undefined {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const interactionId = history[index].interactionId?.trim();
    if (interactionId) {
      return interactionId;
    }
  }

  return undefined;
}

function buildChatUrl(config: JokeClientConfig): string {
  if (!config.baseUrl) {
    return config.path;
  }

  return `${config.baseUrl.replace(/\/+$/, "")}/${config.path.replace(/^\/+/, "")}`;
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function readEnvString(key: string, fallback: string): string {
  const env = import.meta.env as Record<string, unknown>;
  const value = env[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
