import { MAX_JOKE_PARAGRAPHS, MAX_JOKE_SENTENCES } from "../prompts/jokePrompt";

export const RATINGS = ["thumbs-up", "thumbs-down"] as const;
export type UserRating = (typeof RATINGS)[number];

export interface ChatResponse {
  id: string;
  prompt: string;
  content: string;
  createdAt: string;
  interactionId?: string;
  rating?: UserRating;
}

export interface NewChatResponseInput {
  prompt: string;
  content: string;
  interactionId?: string;
}

export interface ParsedJokeResponse {
  text: string;
}

export function createChatResponse(
  input: NewChatResponseInput,
  nowIso: string,
  id: string,
): ChatResponse {
  return {
    id,
    prompt: input.prompt,
    content: input.content.trim(),
    createdAt: nowIso,
    ...(input.interactionId ? { interactionId: input.interactionId } : {}),
  };
}

export function rateChatResponse(
  response: ChatResponse,
  rating: UserRating,
): ChatResponse {
  if (response.rating) {
    return response;
  }

  return {
    ...response,
    rating,
  };
}

export function parseJokeResponse(rawMessage: string): ParsedJokeResponse | null {
  const data = parseJsonCandidate(rawMessage) as { text?: unknown } | null;
  if (!data) {
    return null;
  }

  const text = typeof data.text === "string" ? data.text.trim() : "";
  if (!text) {
    return null;
  }

  return truncateJokeResponse({ text });
}

export function truncateJokeResponse(response: ParsedJokeResponse): ParsedJokeResponse {
  const paragraphs = response.text.split(/\n+/).filter((paragraph) => paragraph.trim());
  let text =
    paragraphs.length > MAX_JOKE_PARAGRAPHS
      ? paragraphs.slice(0, MAX_JOKE_PARAGRAPHS).join("\n")
      : response.text;

  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  if (sentences.length > MAX_JOKE_SENTENCES) {
    text = sentences.slice(0, MAX_JOKE_SENTENCES).join("").trim();
  }

  return { text };
}

function compactText(value: string): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function tryParseJson(value: string): unknown {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function parseJsonCandidate(message: string): unknown {
  const text = compactText(message);
  const direct = tryParseJson(text);
  if (direct) {
    return direct;
  }

  const fenced = String(message ?? "").match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    const parsed = tryParseJson(fenced[1].trim());
    if (parsed) {
      return parsed;
    }
  }

  const original = String(message ?? "");
  const firstBrace = original.indexOf("{");
  const lastBrace = original.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return tryParseJson(original.slice(firstBrace, lastBrace + 1));
  }

  return null;
}

export function parseStoredResponses(value: string | null): ChatResponse[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isChatResponse);
  } catch {
    return [];
  }
}

function isChatResponse(value: unknown): value is ChatResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const rating = candidate.rating;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.prompt === "string" &&
    typeof candidate.content === "string" &&
    typeof candidate.createdAt === "string" &&
    (candidate.interactionId === undefined || typeof candidate.interactionId === "string") &&
    (rating === undefined || rating === "thumbs-up" || rating === "thumbs-down")
  );
}
