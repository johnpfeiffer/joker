# Architecture

## System Design

```mermaid
flowchart LR
  U["User"] --> V["React/MUI view"]
  V --> C["useJokeChat controller"]
  C --> M["chat model"]
  C --> S["localStorage"]
  C --> L["LLM service"]
  L --> A["Chat backend<br/>/links/chat"]
  A --> G["Gemini provider"]
```

The domain model in `app/src/models/chat.ts` owns response shape, prompt construction, JSON response parsing, truncation, and feedback immutability. The controller in `app/src/controllers/useJokeChat.ts` handles browser persistence and UI state. The service in `app/src/services/llm.ts` sends documented `/links/chat` requests shaped as `{message, previousInteractionId}` and accepts backend `message` output only when it can be parsed as `{"text":"..."}`.

## User Journey

```mermaid
flowchart TD
  A["Open Vite local dev URL"] --> B["See fixed prompt"]
  B --> C["Request new joke"]
  C --> D["Chat backend returns message and interactionId"]
  D --> E["Browser stores response and interactionId"]
  E --> F{"Rate response?"}
  F -->|"Thumbs up/down"| G["Store immutable feedback"]
  F -->|"Skip"| H["Leave response unrated"]
  G --> I["Request another joke"]
  H --> I
  I --> J["Prompt includes all prior jokes and feedback"]
```

## Kernel Trace

`INV-001` is implemented by `ChatResponse.rating?: UserRating`. It is optional when a response is created and immutable after the first thumbs up or thumbs down rating.
