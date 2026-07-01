import { describe, expect, it } from "vitest";
import type { ChatResponse } from "../models/chat";
import { STATIC_PROMPT, buildJokePrompt } from "./jokePrompt";

describe("joke prompt", () => {
  it("uses the fixed static prompt inside a JSON response contract", () => {
    const prompt = buildJokePrompt([]);

    expect(prompt).toContain(`User prompt: ${STATIC_PROMPT}`);
    expect(prompt).toContain('"text": "the joke"');
    expect(prompt).toContain('"style": ["one or two tags from:');
    expect(prompt).toContain('"subject": ["one or two tags describing the topic');
    expect(prompt).not.toContain("Positive rated jokes:");
    expect(prompt).not.toContain("Negative rated jokes:");
    expect(prompt).not.toContain("User priority ordered jokes:");
  });

  it("includes only rated jokes grouped by sentiment in reverse chronological order", () => {
    const prompt = buildJokePrompt([
      makeResponse({
        id: "liked-old",
        text: "Liked old",
        rating: "thumbs-up",
        createdAt: "2026-06-28T19:00:00.000Z",
      }),
      makeResponse({
        id: "ignored-unrated",
        text: "Unrated joke",
        createdAt: "2026-06-28T20:00:00.000Z",
      }),
      makeResponse({
        id: "disliked-new",
        text: "Disliked new",
        rating: "thumbs-down",
        createdAt: "2026-06-28T21:00:00.000Z",
      }),
      makeResponse({
        id: "liked-new",
        text: "Liked new",
        rating: "thumbs-up",
        createdAt: "2026-06-28T22:00:00.000Z",
      }),
    ]);

    expect(prompt).toContain("Positive rated jokes");
    expect(prompt).toContain("Negative rated jokes");
    const ratingContext = prompt.slice(0, prompt.indexOf("User priority ordered jokes"));
    expect(ratingContext).not.toContain("Unrated joke");
    expect(prompt.indexOf("Liked new")).toBeLessThan(prompt.indexOf("Liked old"));
    expect(prompt.indexOf("Liked old")).toBeLessThan(prompt.indexOf("Disliked new"));
    expect(prompt).toContain('"style": [');
    expect(prompt).toContain('"one-liner"');
    expect(prompt).toContain('"subject": [');
    expect(prompt).toContain('"technology"');
  });

  it("limits historical context to 12 rated jokes", () => {
    const history = Array.from({ length: 14 }, (_, index) =>
      makeResponse({
        id: `response-${index}`,
        text: `Rated joke ${index}`,
        rating: "thumbs-up",
        createdAt: `2026-06-28T${String(index).padStart(2, "0")}:00:00.000Z`,
      }),
    );

    const prompt = buildJokePrompt(history);

    const ratingContext = prompt.slice(0, prompt.indexOf("User priority ordered jokes"));
    expect(ratingContext).toContain("Rated joke 13");
    expect(ratingContext).toContain("Rated joke 2");
    expect(ratingContext).not.toContain('"text": "Rated joke 1"');
    expect(ratingContext).not.toContain('"text": "Rated joke 0"');
  });

  it("sends a separate top 12 priority-ordered list including unrated jokes", () => {
    const prompt = buildJokePrompt(
      [
        makeResponse({
          id: "first",
          text: "First chronological",
          rating: "thumbs-up",
          createdAt: "2026-06-28T19:00:00.000Z",
        }),
        makeResponse({
          id: "second",
          text: "Second chronological unrated",
          createdAt: "2026-06-28T20:00:00.000Z",
        }),
        makeResponse({
          id: "third",
          text: "Third chronological",
          rating: "thumbs-down",
          createdAt: "2026-06-28T21:00:00.000Z",
        }),
      ],
      ["second", "first"],
    );

    expect(prompt).toContain("Positive rated jokes");
    expect(prompt).toContain("Negative rated jokes");
    expect(prompt).toContain("User priority ordered jokes");
    expect(prompt.indexOf("User priority ordered jokes")).toBeGreaterThan(
      prompt.indexOf("Negative rated jokes"),
    );
    const priorityContext = prompt.slice(prompt.indexOf("User priority ordered jokes"));
    expect(priorityContext.indexOf('"priorityRank": 1')).toBeLessThan(
      priorityContext.indexOf('"priorityRank": 2'),
    );
    expect(priorityContext.indexOf("Second chronological unrated")).toBeLessThan(
      priorityContext.indexOf("First chronological"),
    );
    expect(prompt).toContain('"rating": null');
    expect(prompt).toContain('"rating": "thumbs-up"');
    expect(prompt).toContain('"rating": "thumbs-down"');
  });

  it("uses chronological order for unprioritized jokes and caps priority context at 12", () => {
    const history = Array.from({ length: 14 }, (_, index) =>
      makeResponse({
        id: `response-${index}`,
        text: `Priority joke ${index}`,
        createdAt: `2026-06-28T${String(index).padStart(2, "0")}:00:00.000Z`,
      }),
    );

    const prompt = buildJokePrompt(history, ["response-13"]);

    expect(prompt).toContain("Priority joke 13");
    expect(prompt).toContain("Priority joke 0");
    expect(prompt).toContain("Priority joke 10");
    expect(prompt).not.toContain('"text": "Priority joke 11"');
    expect(prompt).not.toContain('"text": "Priority joke 12"');
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
