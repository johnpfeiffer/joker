# Validation

Validation artifacts for the derived specification.

## Automated Checks

From `app/`:

```bash
npm test
npm run build
```

## Covered Obligations

| Obligation | Check |
| --- | --- |
| Static initial prompt | `chat.test.ts`, `llm.test.ts`, `App.test.tsx` |
| Optional feedback per response | `chat.test.ts` |
| Immutable prior feedback | `chat.test.ts`, `App.test.tsx` |
| Required style and subject tags | `chat.test.ts`, `llm.test.ts`, `App.test.tsx` |
| Rated-only history included in later LLM calls | `jokePrompt.test.ts`, `llm.test.ts`, `App.test.tsx` |
| Liked-then-disliked reverse chronological prompt order | `jokePrompt.test.ts` |
| Prompt history capped at 12 examples | `jokePrompt.test.ts` |
| Prompt inspection preview | `App.test.tsx` |
| `/links/chat` request shape and interaction id continuity | `llm.test.ts`, `App.test.tsx` |
| JSON-only structured LLM response parsing | `chat.test.ts`, `llm.test.ts`, `App.test.tsx` |
| Browser local storage persistence | `chat.test.ts`, `App.test.tsx` |
| Frontend build health | `npm run build` |
