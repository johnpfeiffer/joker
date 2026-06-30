import { orderResponsesByPriority, type ChatResponse } from "../models/chat";

export const STATIC_PROMPT = "tell me a new joke";
export const MAX_JOKE_PARAGRAPHS = 3;
export const MAX_JOKE_SENTENCES = 12;

const PROMPT_CHAR_LIMIT = 8_000;
const PROMPT_HEADROOM = 400;
const MAX_CONTEXT_JOKES = 12;
const MAX_PRIORITY_JOKES = 12;

export function buildJokePrompt(history: ChatResponse[], priorityOrder: string[] = []): string {
  const prefix = [
    "You are a concise joke assistant.",
    "The user prompt is fixed and cannot be edited.",
    "Use prior rated jokes and feedback as context when present.",
    "Do not repeat prior jokes.",
    "Produce more jokes matching the style and subject tags of Positive rated jokes.",
    "Avoid jokes matching the style and subject tags of Negative rated jokes.",
    "When multiple thumbs-down jokes share a tag, strongly avoid that tag.",
    `Limit your answer to at most ${MAX_JOKE_PARAGRAPHS} paragraphs or ${MAX_JOKE_SENTENCES} sentences, whichever is less.`,
    "Return JSON only with this shape:",
    "{",
    '  "text": "the joke",',
    '  "style": ["one or two tags from: pun, wordplay, one-liner, setup-punchline, knock-knock, observational, absurdist, dark, deadpan, story"],',
    '  "subject": ["one or two tags describing the topic, e.g. animals, technology, food, work, relationships, science, language"]',
    "}",
    `User prompt: ${STATIC_PROMPT}`,
  ].join("\n");

  const context = buildContext(history, priorityOrder);
  if (context.length === 0) {
    return prefix;
  }

  const maxLength = PROMPT_CHAR_LIMIT - PROMPT_HEADROOM;
  const lines: string[] = [];

  for (const line of context) {
    const next = `${prefix}\n${[...lines, line].join("\n")}`;
    if (next.length > maxLength) {
      break;
    }
    lines.push(line);
  }

  return `${prefix}\n${lines.join("\n")}`;
}

function buildContext(history: ChatResponse[], priorityOrder: string[]): string[] {
  const liked = latestFirst(history, "thumbs-up");
  const disliked = latestFirst(history, "thumbs-down");
  const selected = [...liked, ...disliked].slice(0, MAX_CONTEXT_JOKES);
  const prioritySelected = orderResponsesByPriority(history, priorityOrder).slice(
    0,
    MAX_PRIORITY_JOKES,
  );
  if (selected.length === 0 && prioritySelected.length === 0) {
    return [];
  }

  const lines: string[] = [];
  const positive = selected.filter((response) => response.rating === "thumbs-up");
  const negative = selected.filter((response) => response.rating === "thumbs-down");

  if (positive.length > 0) {
    lines.push("Positive rated jokes:");
    lines.push(...positive.map(serializeHistoryResponse));
  }

  if (negative.length > 0) {
    lines.push("Negative rated jokes:");
    lines.push(...negative.map(serializeHistoryResponse));
  }

  if (prioritySelected.length > 0) {
    lines.push("User priority ordered jokes:");
    lines.push(...prioritySelected.map(serializePriorityResponse));
  }

  return lines;
}

function latestFirst(history: ChatResponse[], rating: "thumbs-up" | "thumbs-down"): ChatResponse[] {
  return history
    .map((response, index) => ({ response, index }))
    .filter(({ response }) => response.rating === rating)
    .sort((left, right) => {
      const byTime = Date.parse(right.response.createdAt) - Date.parse(left.response.createdAt);
      return byTime || right.index - left.index;
    })
    .map(({ response }) => response);
}

function serializeHistoryResponse(response: ChatResponse): string {
  return JSON.stringify({
    text: compactText(response.text),
    style: response.style,
    subject: response.subject,
  });
}

function serializePriorityResponse(response: ChatResponse, index: number): string {
  return JSON.stringify({
    priorityRank: index + 1,
    rating: response.rating ?? null,
    text: compactText(response.text),
    style: response.style,
    subject: response.subject,
  });
}

function compactText(value: string): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}
