# Derived Specification

This directory records AI-derived interpretation of `/KERNEL/`. Kernel files remain authoritative.

## Requirements

1. The app presents the static prompt `tell me a new joke`; users cannot edit it.
2. The browser sends the prompt to the documented chat API at `/links/chat`.
3. The frontend uses the standard Vite local development server.
4. The browser stores every LLM response in `localStorage`.
5. Each stored response has optional feedback traced to `INV-001`.
6. Feedback can be absent, thumbs up, or thumbs down.
7. Once feedback is set for a response, it cannot be changed.
8. Every LLM request after the first includes all previous jokes and their feedback state.
9. LLM responses are accepted only when the assistant message contains parseable JSON shaped as `{"text":"..."}`.
10. When the backend returns an `interactionId`, the browser stores it and sends the latest stored id as `previousInteractionId` on the next request.

## Invariant Trace

| Kernel invariant | Derived predicate |
| --- | --- |
| `INV-001` | `ChatResponse.rating` is absent, `thumbs-up`, or `thumbs-down`; `rateChatResponse` does not alter already-rated responses. |
