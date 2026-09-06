# Validation

Validation artifacts for the derived specification.

## Dependency Baseline Validation

Validated on 2026-09-06 using Node.js 24.20.0 and the exact package versions in `app/package.json`:

- Clean `npm ci`: successful; npm audit reported zero vulnerabilities.
- `npm test`: all 33 tests across 5 files passed on Vitest 5.0.0.
- `npm run build`: TypeScript 7.0.2 checking and Vite 8.2.2 production bundling passed.
- Production preview browser check: prompt inspection expands, Rankings toggles, reset dialog opens and cancels, and footer links render on MUI 9.4.0.

Chat requests are mocked in automated tests. Live backend joke generation was not tested in the local production preview.

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
| `/ai/chat` request shape and interaction id continuity | `llm.test.ts`, `App.test.tsx` |
| JSON-only structured LLM response parsing | `chat.test.ts`, `llm.test.ts`, `App.test.tsx` |
| Browser local storage persistence | `chat.test.ts`, `App.test.tsx` |
| Frontend build health | `npm run build` |
