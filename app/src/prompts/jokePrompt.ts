import type { ChatResponse } from "../models/chat";

export const STATIC_PROMPT = "tell me a new joke";
export const MAX_JOKE_PARAGRAPHS = 3;
export const MAX_JOKE_SENTENCES = 12;

const PROMPT_CHAR_LIMIT = 8_000;
const PROMPT_HEADROOM = 400;

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
