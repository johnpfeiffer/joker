import { useEffect, useMemo, useState } from "react";
import {
  appendPriorityResponse,
  createChatResponse,
  movePriorityResponse,
  orderResponsesByPriority,
  parseStoredPriorityOrder,
  parseStoredResponses,
  rateChatResponse,
  type ChatResponse,
  type UserRating,
} from "../models/chat";
import { buildJokePrompt } from "../prompts/jokePrompt";
import { requestJoke } from "../services/llm";

export const STORAGE_KEY = "joker.chatResponses.v1";
export const PRIORITY_ORDER_STORAGE_KEY = "joker.priorityOrder.v1";

interface JokeChatState {
  responses: ChatResponse[];
  isLoading: boolean;
  error: string;
  latestResponse?: ChatResponse;
  nextPrompt: string;
  priorityResponses: ChatResponse[];
  requestNextJoke: () => Promise<void>;
  rateResponse: (id: string, rating: UserRating) => void;
  moveResponsePriority: (draggedId: string, targetId: string) => void;
}

export function useJokeChat(): JokeChatState {
  const [responses, setResponses] = useState<ChatResponse[]>(() =>
    parseStoredResponses(getStorage()?.getItem(STORAGE_KEY) ?? null),
  );
  const [priorityOrder, setPriorityOrder] = useState<string[]>(() =>
    parseStoredPriorityOrder(getStorage()?.getItem(PRIORITY_ORDER_STORAGE_KEY) ?? null),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const latestResponse = useMemo(
    () => responses[responses.length - 1],
    [responses],
  );
  const priorityResponses = useMemo(
    () => orderResponsesByPriority(responses, priorityOrder),
    [priorityOrder, responses],
  );
  const nextPrompt = useMemo(
    () => buildJokePrompt(responses, priorityOrder),
    [priorityOrder, responses],
  );

  useEffect(() => {
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(responses));
  }, [responses]);

  useEffect(() => {
    getStorage()?.setItem(PRIORITY_ORDER_STORAGE_KEY, JSON.stringify(priorityOrder));
  }, [priorityOrder]);

  async function requestNextJoke() {
    setIsLoading(true);
    setError("");

    try {
      const result = await requestJoke(responses, priorityOrder);
      const response = createChatResponse(
        {
          prompt: result.prompt,
          text: result.joke.text,
          style: result.joke.style,
          subject: result.joke.subject,
          interactionId: result.interactionId,
        },
        new Date().toISOString(),
        createId(),
      );
      setResponses((current) => [...current, response]);
      setPriorityOrder((current) => appendPriorityResponse(responses, current, response.id));
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

  function moveResponsePriority(draggedId: string, targetId: string) {
    setPriorityOrder((current) =>
      movePriorityResponse(responses, current, draggedId, targetId),
    );
  }

  return {
    responses,
    isLoading,
    error,
    latestResponse,
    nextPrompt,
    priorityResponses,
    requestNextJoke,
    rateResponse,
    moveResponsePriority,
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
