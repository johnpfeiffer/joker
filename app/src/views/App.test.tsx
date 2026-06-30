import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App";
import { STORAGE_KEY } from "../controllers/useJokeChat";
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
    expect(secondBody.message).toContain('"text":"First joke."');
    expect(secondBody.message).toContain('"style":["one-liner"]');
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
    expect(screen.getByText(/Return JSON only with this shape/)).toBeInTheDocument();
    expect(screen.getByText(/"style": \["one or two tags from:/)).toBeInTheDocument();
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
});

function renderApp() {
  render(
    <ThemeProvider theme={createTheme()}>
      <CssBaseline />
      <App />
    </ThemeProvider>,
  );
}
