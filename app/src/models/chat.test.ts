import { describe, expect, it } from "vitest";
import {
  createChatResponse,
  parseJokeResponse,
  parseStoredResponses,
  rateChatResponse,
  truncateJokeResponse,
  type ChatResponse,
} from "./chat";
import { STATIC_PROMPT } from "../prompts/jokePrompt";

describe("chat model", () => {
  it("creates responses with optional feedback unset", () => {
    const response = createChatResponse(
      {
        prompt: STATIC_PROMPT,
        content: "  A tidy punchline.  ",
        interactionId: "turn-1",
      },
      "2026-06-28T19:00:00.000Z",
      "response-1",
    );

    expect(response).toEqual({
      id: "response-1",
      prompt: STATIC_PROMPT,
      content: "A tidy punchline.",
      createdAt: "2026-06-28T19:00:00.000Z",
      interactionId: "turn-1",
    });
  });

  it("keeps previous feedback immutable after first rating", () => {
    const response = makeResponse({ rating: "thumbs-up" });

    expect(rateChatResponse(response, "thumbs-down")).toBe(response);
  });

  it("sets feedback when a response has not been rated", () => {
    const response = makeResponse();

    expect(rateChatResponse(response, "thumbs-down")).toEqual({
      ...response,
      rating: "thumbs-down",
    });
  });

  it("parses direct, fenced, and embedded JSON joke responses", () => {
    expect(parseJokeResponse('{"text":"Direct joke."}')).toEqual({ text: "Direct joke." });
    expect(parseJokeResponse('```json\n{"text":"Fenced joke."}\n```')).toEqual({
      text: "Fenced joke.",
    });
    expect(parseJokeResponse('Sure: {"text":"Embedded joke."}')).toEqual({
      text: "Embedded joke.",
    });
  });

  it("rejects non-JSON joke responses", () => {
    expect(parseJokeResponse("A free-form joke.")).toBeNull();
    expect(parseJokeResponse('{"message":"missing text"}')).toBeNull();
  });

  it("truncates long parsed responses", () => {
    const response = truncateJokeResponse({
      text: [
        "One.",
        "Two.",
        "Three.",
        "Four.",
        "Five.",
        "Six.",
        "Seven.",
        "Eight.",
        "Nine.",
        "Ten.",
        "Eleven.",
        "Twelve.",
        "Thirteen.",
      ].join(" "),
    });

    expect(response.text).not.toContain("Thirteen.");
  });

  it("drops invalid local storage records", () => {
    const stored = JSON.stringify([
      makeResponse({ id: "valid" }),
      makeResponse({ id: "valid-with-interaction", interactionId: "turn-1" }),
      { id: "bad", content: "missing fields" },
      makeResponse({ id: "invalid-rating", rating: "maybe" as never }),
      makeResponse({ id: "invalid-interaction", interactionId: 123 as never }),
    ]);

    expect(parseStoredResponses(stored).map((response) => response.id)).toEqual([
      "valid",
      "valid-with-interaction",
    ]);
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
