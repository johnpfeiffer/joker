import { useEffect, useMemo, useState } from "react";
import {
  createChatResponse,
  parseStoredResponses,
  rateChatResponse,
  type ChatResponse,
  type UserRating,
} from "../models/chat";
import { requestJoke } from "../services/llm";

export const STORAGE_KEY = "joker.chatResponses.v1";

interface JokeChatState {
  responses: ChatResponse[];
  isLoading: boolean;
  error: string;
  latestResponse?: ChatResponse;
  requestNextJoke: () => Promise<void>;
  rateResponse: (id: string, rating: UserRating) => void;
}

export function useJokeChat(): JokeChatState {
  const [responses, setResponses] = useState<ChatResponse[]>(() =>
    parseStoredResponses(getStorage()?.getItem(STORAGE_KEY) ?? null),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const latestResponse = useMemo(
    () => responses[responses.length - 1],
    [responses],
  );

  useEffect(() => {
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(responses));
  }, [responses]);

  async function requestNextJoke() {
    setIsLoading(true);
    setError("");

    try {
      const result = await requestJoke(responses);
      const response = createChatResponse(
        {
          prompt: result.prompt,
          content: result.joke,
          interactionId: result.interactionId,
        },
        new Date().toISOString(),
        createId(),
      );
      setResponses((current) => [...current, response]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Joke request failed");
    } finally {
      setIsLoading(false);
    }
  }

  function rateResponse(id: string, rating: UserRating) {
    setResponses((current) =>
      current.map((response) =>
        response.id === id ? rateChatResponse(response, rating) : response,
      ),
    );
  }

  return {
    responses,
    isLoading,
    error,
    latestResponse,
    requestNextJoke,
    rateResponse,
  };
}

function getStorage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

function createId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `response-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
