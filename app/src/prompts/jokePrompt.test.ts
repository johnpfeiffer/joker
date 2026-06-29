import { describe, expect, it } from "vitest";
import type { ChatResponse } from "../models/chat";
import { STATIC_PROMPT, buildJokePrompt } from "./jokePrompt";

describe("joke prompt", () => {
  it("uses the fixed static prompt inside a JSON response contract", () => {
    const prompt = buildJokePrompt([]);

    expect(prompt).toContain(`User prompt: ${STATIC_PROMPT}`);
    expect(prompt).toContain('Return JSON only with this shape: {"text":"your joke"}');
    expect(prompt).not.toContain("Previous jokes and user feedback");
  });

  it("includes all previous jokes and feedback in later prompts", () => {
    const prompt = buildJokePrompt([
      makeResponse({ content: "First joke", rating: "thumbs-up" }),
      makeResponse({ id: "response-2", content: "Second joke" }),
    ]);

    expect(prompt).toContain(STATIC_PROMPT);
    expect(prompt).toContain('"joke":"First joke"');
    expect(prompt).toContain('"feedback":"thumbs-up"');
    expect(prompt).toContain('"joke":"Second joke"');
    expect(prompt).toContain('"feedback":"unrated"');
  });
});

function makeResponse(overrides: Partial<ChatResponse> = {}): ChatResponse {
  return {
    id: "response-1",
    prompt: STATIC_PROMPT,
    content: "Why did the test cross the road?",
    createdAt: "2026-06-28T19:00:00.000Z",
    ...overrides,
  };
}
