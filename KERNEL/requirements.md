# Goal

Demonstrating 2023-style feedback loops for chat

## V1: MVP

A web app with a static prompt the user cannot change that sends to an LLM and gets a response.

The initial hardcoded prompt is "Tell me a new joke" 

The browser should store each response and if the User provided feedback.

Each further call to the LLM should include all of the previous jokes and the user feedback - this should inform the LLM prompt to give new (and better) jokes.

## V2

The title text should be expanded to "Remember how LLM chat worked in 2023..."

The feedback status at the top right of each joke (in a UI "lozenge") should be one of the following: Unrated , ツ, =(
- the use of ASCII art reduces the repetition 


Add a hover tooltip over the hard coded prompt "Early pattern of single User prompt, without multi-turn messages"

Jokes have a more defined structure/model of: "text", "style", "subject"

Each joke produced should include tags about the Style (pun, knock knock, etc.) and Subject, these are not initially displayed to the user. 

Update the prompt to require:
```
Return JSON only with this shape:
{
  "text": "the joke",
  "style": ["one or two tags from: pun, wordplay, one-liner, setup-punchline, knock-knock, observational, absurdist, dark, deadpan, story"],
  "subject": ["one or two tags describing the topic, e.g. animals, technology, food, work, relationships, science, language"]
}
```

The prompt context should send previously rated jokes in this order:

1. Liked jokes (reverse chronological aka most recent to oldest)
2. Disliked jokes (reverse chronological)

Have a max limit of at most 12 context/example/historical jokes, do not send unrated jokes.

Produce more jokes matching the style and subject tags of Positive (thumbs up)
Avoid jokes matching the style and subject tags of Negative (thumbs down)
- When multiple thumbs-down jokes share a tag, strongly avoid that tag.

Below the "get a new joke button" is an expandable section showing the next full prompt (i.e. "prompt inspection"):
- this should show (preview) the actual next prompt

Add a hover tooltip for the "prompt inspection" area: "Highest signal examples in the feedback loop get the early attention priority"


## V3

Clarification: Rating is the User Feedback. Separately, "Priority" has been the effective name for how examples are selected to be sent to the LLM.

Rating and priority are separate signals. Dragging a joke does not change its thumbs-up, thumbs-down, or unrated status.

Add a two-state view toggle above the created jokes:
- Chronological view
- Preference view

**Chronological view** shows jokes in reverse chronological order. (the same as the app has before)

**Preference view** shows jokes in effective prompt-priority order. Each joke card shows its effective prompt priority as a gray number on the right.
- it defaults to all of the positive jokes first, then unrated, then negative - each sorted reverse chronological
- new jokes are just added to the end

Users can drag and drop joke cards in preference view to set manual priority preferences. Manual priority is persisted in browser storage.

Prompt example selection based on Rating remains capped at 12 jokes.

Also send the User's top 12 priority-ordered jokes to the LLM as prompt context.

- this results in some duplication - fine for now
- this means the "priority-ordered" list will include Unrated jokes in the context

Ensure the prompt is updated with this clear delineation of two separate lists.

The prompt inspection preview must update immediately after priority changes.

### Fixes

Ensure that prompt inspection when it expands opens completely so it does not need a scroll bar

Make it pretty print the JSON output with color highlighting


