# joker

Remember how LLM chat worked in 2023...

## Goal

Joker is a local React app that demonstrates feedback loops for chat. The user cannot change the prompt: each request starts from `tell me a new joke`. Responses are stored in the browser with optional immutable thumbs up or thumbs down feedback, style tags, and subject tags. Later requests include the highest-signal rated examples: liked jokes first, disliked jokes second, newest to oldest, capped at 12 examples.

## Local Setup

Install dependencies:

```bash
cd app
npm install
```

The app expects the chat backend endpoint required by `KERNEL/requirements.md`:

```text
POST /links/chat
```

The frontend sends:

```json
{"message":"prompt text","previousInteractionId":"optional-prior-id"}
```

The backend response should include `message` and may include `interactionId`. Joker stores the interaction id and echoes it on the next request. The prompt asks the model to return JSON only inside the backend `message` field:

```json
{
  "text": "the joke",
  "style": ["one or two tags from: pun, wordplay, one-liner, setup-punchline, knock-knock, observational, absurdist, dark, deadpan, story"],
  "subject": ["one or two tags describing the topic, e.g. animals, technology, food, work, relationships, science, language"]
}
```

Run the frontend:

```bash
cd app
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173/`. If you need a fixed URL for local validation, run Vite with `--host 127.0.0.1 --port 8080` and open `http://localhost:8080/`.

## Configuration

The defaults are:

```text
VITE_CHAT_API_BASE_URL=
VITE_CHAT_API_PATH=/links/chat
```

Leave `VITE_CHAT_API_BASE_URL` empty for same-origin production. Set it only when a local frontend is allowed to call a separately hosted chat backend.

## Test

```bash
cd app
npm test
npm run build
```
