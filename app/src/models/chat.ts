export const STATIC_PROMPT = "tell me a new joke";
export const MAX_JOKE_PARAGRAPHS = 3;
export const MAX_JOKE_SENTENCES = 12;

const PROMPT_CHAR_LIMIT = 8_000;
const PROMPT_HEADROOM = 400;

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

export function buildJokePrompt(history: ChatResponse[]): string {
  const prefix = [
    "You are a concise joke assistant.",
    "The user prompt is fixed and cannot be edited.",
    "Use prior jokes and feedback as context when present.",
    "Do not repeat prior jokes.",
    "If feedback is thumbs-up, lean toward that style. If feedback is thumbs-down, avoid that style.",
    `Limit your answer to at most ${MAX_JOKE_PARAGRAPHS} paragraphs or ${MAX_JOKE_SENTENCES} sentences, whichever is less.`,
    'Return JSON only with this shape: {"text":"your joke"}',
    `User prompt: ${STATIC_PROMPT}`,
  ].join("\n");

  if (history.length === 0) {
    return prefix;
  }

  const suffix = "\nPrevious jokes and user feedback:";
  const maxLength = PROMPT_CHAR_LIMIT - PROMPT_HEADROOM;
  const lines: string[] = [];

  for (const [index, response] of history.entries()) {
    const line = serializeHistoryResponse(response, index);
    const next = `${prefix}${suffix}\n${[...lines, line].join("\n")}`;
    if (next.length > maxLength) {
      break;
    }
    lines.push(line);
  }

  return `${prefix}${suffix}\n${lines.join("\n")}`;
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

function serializeHistoryResponse(response: ChatResponse, index: number): string {
  return JSON.stringify({
    index: index + 1,
    joke: compactText(response.content),
    feedback: response.rating ?? "unrated",
  });
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
