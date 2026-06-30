import { describe, expect, it, vi } from "vitest";
import { type ChatResponse } from "../models/chat";
import { STATIC_PROMPT } from "../prompts/jokePrompt";
import { CHAT_API_PATH, readAssistantMessage, readInteractionId, requestJoke } from "./llm";

describe("llm service", () => {
  it("posts the static prompt to the documented chat endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: '{"text":"A fresh joke.","style":["pun"],"subject":["food"]}',
        interactionId: "turn-1",
      }),
    });

    const result = await requestJoke(
      [],
      [],
      {
        baseUrl: "",
        path: CHAT_API_PATH,
      },
      fetcher,
    );

    expect(fetcher).toHaveBeenCalledWith(CHAT_API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: expect.any(String),
    });
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body).toEqual({
      message: expect.stringContaining(`User prompt: ${STATIC_PROMPT}`),
    });
    expect(result).toEqual({
      prompt: expect.stringContaining(STATIC_PROMPT),
      joke: {
        text: "A fresh joke.",
        style: ["pun"],
        subject: ["food"],
      },
      interactionId: "turn-1",
    });
  });

  it("includes previous jokes, immutable feedback, and previous interaction id", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: '{"text":"Next joke.","style":["deadpan"],"subject":["work"]}',
        interactionId: "turn-2",
      }),
    });

    await requestJoke(
      [makeResponse({ text: "Old joke", interactionId: "turn-1", rating: "thumbs-down" })],
      [],
      {
        baseUrl: "https://example.com",
        path: CHAT_API_PATH,
      },
      fetcher,
    );

    expect(fetcher.mock.calls[0][0]).toBe("https://example.com/links/chat");
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.message).toContain('"text":"Old joke"');
    expect(body.message).toContain("Negative rated jokes");
    expect(body.previousInteractionId).toBe("turn-1");
  });

  it("reads documented and fallback assistant messages", () => {
    expect(readAssistantMessage({ message: "Documented shape" })).toBe("Documented shape");
    expect(readAssistantMessage({ choices: [{ message: { content: "OpenAI shape" } }] })).toBe(
      "OpenAI shape",
    );
    expect(readAssistantMessage({ response: "Simple shape" })).toBe("Simple shape");
    expect(readAssistantMessage({ text: "Text shape" })).toBe("Text shape");
  });

  it("reads documented interaction ids", () => {
    expect(readInteractionId({ interactionId: " turn-1 " })).toBe("turn-1");
    expect(readInteractionId({ interactionId: 123 })).toBe("");
  });
});

function makeResponse(overrides: Partial<ChatResponse> = {}): ChatResponse {
  return {
    id: "response-1",
    prompt: STATIC_PROMPT,
    text: "Old joke",
    style: ["deadpan"],
    subject: ["work"],
    createdAt: "2026-06-28T19:00:00.000Z",
    ...overrides,
  };
}
