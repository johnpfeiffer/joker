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
8. Every accepted chat response has required `style` and `subject` tag arrays traced to `INV-002`.
9. Every LLM request includes the fixed prompt contract and, when available, only rated historical jokes.
10. Historical prompt examples are ordered liked first, then disliked, with each group reverse chronological.
11. Historical prompt examples are capped at 12 total jokes and unrated jokes are omitted.
12. LLM responses are accepted only when the assistant message contains parseable JSON shaped with `text`, `style`, and `subject`.
13. The UI exposes an expandable prompt inspection preview of the next full prompt.
14. The hardcoded prompt and prompt inspection controls expose hover tooltip descriptions.
15. When the backend returns an `interactionId`, the browser stores it and sends the latest stored id as `previousInteractionId` on the next request.

## Invariant Trace

| Kernel invariant | Derived predicate |
| --- | --- |
| `INV-001` | `ChatResponse.rating` is absent, `thumbs-up`, or `thumbs-down`; `rateChatResponse` does not alter already-rated responses. |
| `INV-002` | `ChatResponse.style` and `ChatResponse.subject` are required non-empty tag arrays; parsers reject responses and storage records without them. |
