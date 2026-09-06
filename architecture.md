# Architecture

## System Design

```mermaid
flowchart LR
  U["User"] --> V["React/MUI view"]
  V --> FOOT["Footer<br/>built-by + LinkedIn/GitHub source links"]
  V --> C["useJokeChat controller"]
  C --> M["chat model"]
  C --> P["joke prompt builder"]
  C --> S["localStorage<br/>responses + priority order"]
  C --> L["LLM service"]
  L --> P
  L --> A["Chat backend<br/>/ai/chat"]
  A --> G["Gemini provider"]
```

The `Footer` component (`app/src/components/Footer.tsx`) is a pure presentational "Built by John Pfeiffer" line with LinkedIn and GitHub source-link icons (`@mui/icons-material`), rendered once in `App.tsx` below the main content; the GitHub link points at this repository. The UI runs on MUI 9.4.0 (upgraded from v7); `Stack` layout props (`alignItems`, `justifyContent`, `gap`) use `sx` per the v9 removal of system props.

The domain model in `app/src/models/chat.ts` owns response shape, JSON response parsing, truncation, tag validation, storage validation, feedback immutability, and deterministic priority ordering. The prompt builder in `app/src/prompts/jokePrompt.ts` owns the fixed prompt contract, structured response instructions, rated-history selection, priority-ordered context selection, and prompt inspection text. The controller in `app/src/controllers/useJokeChat.ts` handles browser persistence for responses and priority order, UI state, and next-prompt derivation. The service in `app/src/services/llm.ts` sends documented `/ai/chat` requests shaped as `{message, previousInteractionId}` and accepts backend `message` output only when it can be parsed as structured joke JSON with `text`, `style`, and `subject`.

## User Journey

```mermaid
flowchart TD
  A["Open Vite local dev URL"] --> B["See fixed prompt"]
  A --> FOOT["Footer: built by John Pfeiffer + source links"]
  B --> K["Optionally expand prompt inspection"]
  K --> C["Request new joke"]
  C --> D["Chat backend returns text, style, subject, and interactionId"]
  D --> E["Browser stores response, tags, and interactionId"]
  E --> L{"Choose view?"}
  L -->|"Chronological"| M["Show jokes newest first"]
  L -->|"Preference"| N["Show effective prompt-priority order<br/>positive, unrated, negative"]
  N --> O["Drag jokes to persist priority order"]
  O --> P["Prompt inspection updates immediately<br/>with full highlighted JSON"]
  M --> F{"Rate response?"}
  P --> F{"Rate response?"}
  F -->|"Thumbs up/down"| G["Store immutable feedback<br/>ツ or =("]
  F -->|"Skip"| H["Leave response unrated"]
  G --> I["Request another joke"]
  H --> I
  I --> J["Prompt includes up to 12 rated examples<br/>and top 12 priority-ordered jokes"]
```

## Kernel Trace

`INV-001` is implemented by `ChatResponse.rating?: UserRating`. It is optional when a response is created and immutable after the first thumbs up or thumbs down rating.

`INV-002` is implemented by required `ChatResponse.style` and `ChatResponse.subject` tag arrays. LLM responses and local storage records without non-empty tag arrays are rejected.

V3 priority is implemented as a separate browser-persisted `priorityOrder` list. Before manual ordering, preference view defaults to thumbs-up jokes, unrated jokes, then thumbs-down jokes, newest first within each group. Dragging in preference view changes only the order used for priority context; it does not change `ChatResponse.rating`. The prompt builder emits rating-selected examples and priority-ordered examples as separate labeled sections, using pretty-printed JSON for prompt inspection readability.
