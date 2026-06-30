import { MAX_JOKE_PARAGRAPHS, MAX_JOKE_SENTENCES } from "../prompts/jokePrompt";

export const RATINGS = ["thumbs-up", "thumbs-down"] as const;
export type UserRating = (typeof RATINGS)[number];

export interface ChatResponse {
  id: string;
  prompt: string;
  text: string;
  style: string[];
  subject: string[];
  createdAt: string;
  interactionId?: string;
  rating?: UserRating;
}

export interface NewChatResponseInput {
  prompt: string;
  text: string;
  style: string[];
  subject: string[];
  interactionId?: string;
}

export interface ParsedJokeResponse {
  text: string;
  style: string[];
  subject: string[];
}

export function createChatResponse(
  input: NewChatResponseInput,
  nowIso: string,
  id: string,
): ChatResponse {
  const style = readTagList(input.style);
  const subject = readTagList(input.subject);
  if (!style || !subject) {
    throw new Error("Chat response requires style and subject tags");
  }

  return {
    id,
    prompt: input.prompt,
    text: input.text.trim(),
    style,
    subject,
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
  const data = parseJsonCandidate(rawMessage) as
    | { text?: unknown; style?: unknown; subject?: unknown }
    | null;
  if (!data) {
    return null;
  }

  const text = typeof data.text === "string" ? data.text.trim() : "";
  const style = readTagList(data.style);
  const subject = readTagList(data.subject);
  if (!text || !style || !subject) {
    return null;
  }

  return truncateJokeResponse({ text, style, subject });
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

  return { ...response, text };
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

    return parsed.map(toChatResponse).filter((response): response is ChatResponse => Boolean(response));
  } catch {
    return [];
  }
}

export function parseStoredPriorityOrder(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const seen = new Set<string>();
    return parsed.filter((id): id is string => {
      if (typeof id !== "string" || !id.trim() || seen.has(id)) {
        return false;
      }

      seen.add(id);
      return true;
    });
  } catch {
    return [];
  }
}

export function orderResponsesByPriority(
  responses: ChatResponse[],
  priorityOrder: string[],
): ChatResponse[] {
  const byId = new Map(responses.map((response) => [response.id, response]));
  const ordered: ChatResponse[] = [];
  const orderedIds = new Set<string>();

  for (const id of priorityOrder) {
    const response = byId.get(id);
    if (response && !orderedIds.has(id)) {
      ordered.push(response);
      orderedIds.add(id);
    }
  }

  for (const response of responses) {
    if (!orderedIds.has(response.id)) {
      ordered.push(response);
    }
  }

  return ordered;
}

export function movePriorityResponse(
  responses: ChatResponse[],
  priorityOrder: string[],
  draggedId: string,
  targetId: string,
): string[] {
  if (draggedId === targetId) {
    return orderResponsesByPriority(responses, priorityOrder).map((response) => response.id);
  }

  const orderedIds = orderResponsesByPriority(responses, priorityOrder).map(
    (response) => response.id,
  );
  const sourceIndex = orderedIds.indexOf(draggedId);
  const targetIndex = orderedIds.indexOf(targetId);
  if (sourceIndex === -1 || targetIndex === -1) {
    return orderedIds;
  }

  const next = [...orderedIds];
  const [dragged] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, dragged);
  return next;
}

function toChatResponse(value: unknown): ChatResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const rating = candidate.rating;
  const style = readTagList(candidate.style);
  const subject = readTagList(candidate.subject);
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.prompt !== "string" ||
    typeof candidate.text !== "string" ||
    !style ||
    !subject ||
    typeof candidate.createdAt !== "string" ||
    (candidate.interactionId !== undefined && typeof candidate.interactionId !== "string") ||
    (rating !== undefined && rating !== "thumbs-up" && rating !== "thumbs-down")
  ) {
    return null;
  }

  return {
    id: candidate.id,
    prompt: candidate.prompt,
    text: candidate.text,
    style,
    subject,
    createdAt: candidate.createdAt,
    ...(candidate.interactionId ? { interactionId: candidate.interactionId } : {}),
    ...(rating ? { rating } : {}),
  };
}

function readTagList(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const tags = normalizeTags(value);
  return tags.length > 0 ? tags : null;
}

function normalizeTags(values: unknown[]): string[] {
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => compactText(value).toLowerCase())
    .filter(Boolean)
    .slice(0, 2);
}
