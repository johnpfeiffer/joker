# Architecture

## System Design

```mermaid
flowchart LR
  U["User"] --> V["React/MUI view"]
  V --> C["useJokeChat controller"]
  C --> M["chat model"]
  C --> P["joke prompt builder"]
  C --> S["localStorage"]
  C --> L["LLM service"]
  L --> P
  L --> A["Chat backend<br/>/links/chat"]
  A --> G["Gemini provider"]
```

The domain model in `app/src/models/chat.ts` owns response shape, JSON response parsing, truncation, tag validation, storage validation, and feedback immutability. The prompt builder in `app/src/prompts/jokePrompt.ts` owns the fixed prompt contract, structured response instructions, rated-history selection, and prompt inspection text. The controller in `app/src/controllers/useJokeChat.ts` handles browser persistence, UI state, and next-prompt derivation. The service in `app/src/services/llm.ts` sends documented `/links/chat` requests shaped as `{message, previousInteractionId}` and accepts backend `message` output only when it can be parsed as structured joke JSON with `text`, `style`, and `subject`.

## User Journey

```mermaid
flowchart TD
  A["Open Vite local dev URL"] --> B["See fixed prompt"]
  B --> K["Optionally expand prompt inspection"]
  K --> C["Request new joke"]
  C --> D["Chat backend returns text, style, subject, and interactionId"]
  D --> E["Browser stores response, tags, and interactionId"]
  E --> F{"Rate response?"}
  F -->|"Thumbs up/down"| G["Store immutable feedback<br/>ツ or =("]
  F -->|"Skip"| H["Leave response unrated"]
  G --> I["Request another joke"]
  H --> I
  I --> J["Prompt includes up to 12 rated examples<br/>liked first, disliked second"]
```

## Kernel Trace

`INV-001` is implemented by `ChatResponse.rating?: UserRating`. It is optional when a response is created and immutable after the first thumbs up or thumbs down rating.

`INV-002` is implemented by required `ChatResponse.style` and `ChatResponse.subject` tag arrays. LLM responses and local storage records without non-empty tag arrays are rejected.
