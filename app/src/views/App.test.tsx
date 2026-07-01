import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App";
import { PRIORITY_ORDER_STORAGE_KEY, STORAGE_KEY } from "../controllers/useJokeChat";
import { STATIC_PROMPT } from "../prompts/jokePrompt";

describe("Joker MVP", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests a joke from the fixed prompt and stores the response", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: '{"text":"A stored joke.","style":["pun"],"subject":["food"]}',
        interactionId: "turn-1",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderApp();

    expect(screen.getByText("Remember how LLM chat worked in 2023...")).toBeInTheDocument();
    expect(screen.getByText(STATIC_PROMPT)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Get new joke" }));

    expect(await screen.findByText("A stored joke.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(fetchMock.mock.calls[0][0]).toBe("/links/chat");
    expect(body.message).toContain(`User prompt: ${STATIC_PROMPT}`);

    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toContain("A stored joke.");
      expect(window.localStorage.getItem(STORAGE_KEY)).toContain("pun");
      expect(window.localStorage.getItem(STORAGE_KEY)).toContain("turn-1");
    });
  });

  it("locks previous feedback and sends it with the next joke request", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: '{"text":"First joke.","style":["one-liner"],"subject":["science"]}',
          interactionId: "turn-1",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: '{"text":"Second joke.","style":["wordplay"],"subject":["language"]}',
          interactionId: "turn-2",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    renderApp();

    await user.click(screen.getByRole("button", { name: "Get new joke" }));
    expect(await screen.findByText("First joke.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Thumbs up" }));

    expect(screen.getByText("ツ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thumbs up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Thumbs down" })).toBeDisabled();

    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toContain("thumbs-up");
    });

    await user.click(screen.getByRole("button", { name: "Get new joke" }));
    expect(await screen.findByText("Second joke.")).toBeInTheDocument();

    const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(secondBody.message).toContain("Positive rated jokes");
    expect(secondBody.message).toContain('"text": "First joke."');
    expect(secondBody.message).toContain('"one-liner"');
    expect(secondBody.previousInteractionId).toBe("turn-1");
  });

  it("previews the next full prompt in an expandable inspection area", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Prompt inspection" }));

    expect(
      screen.getByLabelText(
        "Highest signal examples in the feedback loop get the early attention priority",
      ),
    ).toBeInTheDocument();
    const promptInspection = screen.getByTestId("prompt-inspection-text");
    expect(promptInspection).toHaveTextContent("Return JSON only with this shape");
    expect(promptInspection).toHaveTextContent('"style": ["one or two tags from:');
    expect(promptInspection).not.toHaveStyle({ overflow: "auto" });
    expect(promptInspection).not.toHaveStyle({ maxHeight: "260px" });
  });

  it("loads previous responses from local storage", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: "stored-response",
          prompt: STATIC_PROMPT,
          text: "Already here.",
          style: ["deadpan"],
          subject: ["work"],
          createdAt: "2026-06-28T19:00:00.000Z",
          rating: "thumbs-down",
        },
      ]),
    );

    renderApp();

    expect(screen.getByText("Already here.")).toBeInTheDocument();
    expect(screen.getByText("=(")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thumbs down" })).toBeDisabled();
  });

  it("defaults to chronological view and toggles to preference view with priority ranks", () => {
    seedResponses();

    renderApp();

    expect(screen.getByRole("button", { name: "Chronological view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("First stored.")).toBeInTheDocument();
    expect(screen.getByText("Second stored.")).toBeInTheDocument();
    expect(appearsBefore(screen.getByText("Second stored."), screen.getByText("First stored."))).toBe(
      true,
    );
    expect(screen.queryByText("#1")).not.toBeInTheDocument();
    expect(screen.queryByText("Unrated")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Preference view" }));

    expect(screen.getByRole("button", { name: "Preference view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  it("persists preference drag ordering and updates prompt inspection", async () => {
    const user = userEvent.setup();
    seedResponses();

    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Preference view" }));
    fireEvent.dragStart(screen.getByTestId("joke-card-second"));
    fireEvent.dragOver(screen.getByTestId("joke-card-first"));
    fireEvent.drop(screen.getByTestId("joke-card-first"));

    await waitFor(() => {
      expect(window.localStorage.getItem(PRIORITY_ORDER_STORAGE_KEY)).toBe(
        JSON.stringify(["second", "first"]),
      );
    });

    await user.click(screen.getByRole("button", { name: "Prompt inspection" }));

    const prompt = screen.getByTestId("prompt-inspection-text").textContent ?? "";
    const priorityContext = prompt.slice(prompt.indexOf("User priority ordered jokes"));
    expect(priorityContext.indexOf("Second stored.")).toBeLessThan(
      priorityContext.indexOf("First stored."),
    );
    expect(prompt).toContain('"rating": null');
    expect(prompt).toContain('"priorityRank": 1');
  });
});

function renderApp() {
  render(
    <ThemeProvider theme={createTheme()}>
      <CssBaseline />
      <App />
    </ThemeProvider>,
  );
}

function seedResponses() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      {
        id: "first",
        prompt: STATIC_PROMPT,
        text: "First stored.",
        style: ["deadpan"],
        subject: ["work"],
        createdAt: "2026-06-28T19:00:00.000Z",
        rating: "thumbs-up",
      },
      {
        id: "second",
        prompt: STATIC_PROMPT,
        text: "Second stored.",
        style: ["wordplay"],
        subject: ["language"],
        createdAt: "2026-06-28T20:00:00.000Z",
      },
    ]),
  );
}

function appearsBefore(first: HTMLElement, second: HTMLElement): boolean {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}
