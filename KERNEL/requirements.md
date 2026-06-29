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

