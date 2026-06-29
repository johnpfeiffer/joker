# joker

Remember 2023.

## Goal

Joker is a local React app that demonstrates feedback loops for chat. The user cannot change the prompt: each request starts from `tell me a new joke`. Responses are stored in the browser with optional immutable thumbs up or thumbs down feedback, and later requests include the full stored history.

## Local Setup

Install dependencies:

```bash
cd app
npm install
```

The app expects the documented chat backend endpoint from `KERNEL/IMPORT/CHAT_API.md`:

```text
POST /links/chat
```

The frontend sends:

```json
{"message":"prompt text","previousInteractionId":"optional-prior-id"}
```

The backend response should include `message` and may include `interactionId`. Joker stores the interaction id and echoes it on the next request. The prompt asks the model to return JSON only inside the backend `message` field:

```json
{"text":"your joke"}
```

Run the frontend:

```bash
cd app
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173/`.

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
