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
        text: "  A tidy punchline.  ",
        style: ["one-liner"],
        subject: ["work"],
        interactionId: "turn-1",
      },
      "2026-06-28T19:00:00.000Z",
      "response-1",
    );

    expect(response).toEqual({
      id: "response-1",
      prompt: STATIC_PROMPT,
      text: "A tidy punchline.",
      style: ["one-liner"],
      subject: ["work"],
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

  it("refuses to create responses without style and subject tags", () => {
    expect(() =>
      createChatResponse(
        {
          prompt: STATIC_PROMPT,
          text: "No tags.",
          style: [],
          subject: ["work"],
        },
        "2026-06-28T19:00:00.000Z",
        "response-1",
      ),
    ).toThrow("style and subject tags");
  });

  it("parses direct, fenced, and embedded JSON joke responses", () => {
    expect(
      parseJokeResponse('{"text":"Direct joke.","style":["pun"],"subject":["food"]}'),
    ).toEqual({ text: "Direct joke.", style: ["pun"], subject: ["food"] });
    expect(
      parseJokeResponse('```json\n{"text":"Fenced joke.","style":["deadpan"],"subject":["work"]}\n```'),
    ).toEqual({
      text: "Fenced joke.",
      style: ["deadpan"],
      subject: ["work"],
    });
    expect(
      parseJokeResponse('Sure: {"text":"Embedded joke.","style":["wordplay"],"subject":["language"]}'),
    ).toEqual({
      text: "Embedded joke.",
      style: ["wordplay"],
      subject: ["language"],
    });
  });

  it("rejects non-JSON joke responses", () => {
    expect(parseJokeResponse("A free-form joke.")).toBeNull();
    expect(parseJokeResponse('{"message":"missing text"}')).toBeNull();
    expect(parseJokeResponse('{"text":"missing tags"}')).toBeNull();
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
      style: ["story"],
      subject: ["science"],
    });

    expect(response.text).not.toContain("Thirteen.");
  });

  it("drops invalid local storage records and normalizes accepted tags", () => {
    const stored = JSON.stringify([
      makeResponse({ id: "valid", style: [" Deadpan "], subject: [" Work "] }),
      makeResponse({ id: "valid-with-interaction", interactionId: "turn-1" }),
      { id: "bad", content: "missing fields" },
      {
        id: "legacy-v1",
        prompt: STATIC_PROMPT,
        content: "No tags.",
        createdAt: "2026-06-28T19:00:00.000Z",
      },
      makeResponse({ id: "invalid-rating", rating: "maybe" as never }),
      makeResponse({ id: "invalid-interaction", interactionId: 123 as never }),
      makeResponse({ id: "invalid-style", style: [] }),
      makeResponse({ id: "invalid-subject", subject: [] }),
    ]);

    const responses = parseStoredResponses(stored);

    expect(responses.map((response) => response.id)).toEqual(["valid", "valid-with-interaction"]);
    expect(responses[0].style).toEqual(["deadpan"]);
    expect(responses[0].subject).toEqual(["work"]);
  });
});

function makeResponse(overrides: Partial<ChatResponse> = {}): ChatResponse {
  return {
    id: "response-1",
    prompt: STATIC_PROMPT,
    text: "Why did the test cross the road?",
    style: ["one-liner"],
    subject: ["technology"],
    createdAt: "2026-06-28T19:00:00.000Z",
    ...overrides,
  };
}
