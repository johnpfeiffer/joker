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
| History included in later LLM calls | `chat.test.ts`, `llm.test.ts`, `App.test.tsx` |
| `/links/chat` request shape and interaction id continuity | `llm.test.ts`, `App.test.tsx` |
| JSON-only LLM response parsing | `chat.test.ts`, `llm.test.ts`, `App.test.tsx` |
| Browser local storage persistence | `chat.test.ts`, `App.test.tsx` |
| Frontend build health | `npm run build` |
