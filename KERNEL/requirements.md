# Goal

Demonstrating 2023-style feedback loops for chat

## MVP

A web app with a static prompt the user cannot change that sends to an LLM and gets a response.

The initial prompt is "tell me a new joke" 

The browser should store each response and if the User provided feedback.

Each further call to the LLM should include all of the previous jokes and the user feedback - this should inform the LLM prompt to give new (and better) jokes.

