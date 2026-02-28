# PROMPTS.md

This project was developed with the assistance of AI to leverage Cloudflare's serverless ecosystem. Below are the 8 key prompts used to architect, build, and optimize the **EchoMind AI** application.

---

### 1. Initial Worker & AI Architecture
> "Create a Cloudflare Worker using JavaScript that integrates with Workers AI. The goal is to build an application called EchoMind that can summarize text entries using the Llama 3.3 model. Provide a basic structure for handling POST requests to a `/summarize` endpoint."

### 2. Implementing Stateful Memory (Durable Objects)
> "How can I implement persistent session memory in a Cloudflare Worker so the AI remembers previous context? Provide a `SessionObject` class using Durable Objects that stores the last 5 journal entries in `this.state.storage`."

### 3. Voice-to-Text Integration (Whisper)
> "Expand the Cloudflare Worker to support audio input. Add a transcription step using the `@cf/openai/whisper` model. The worker should be able to detect if the incoming request is a WebM audio blob, transcribe it, and then pass that text to the Llama summarization logic."

### 4. Advanced LLM Customization (Llama 3.3)
> "Configure the Llama 3.3 70B model with a specific system prompt. The AI should act as 'EchoMind,' a thoughtful journaling assistant. It should provide a concise summary of the user's input and attempt to analyze the user's current mood based on their tone."

### 5. Frontend UI & Browser Recording
> "Generate a single-file HTML/JavaScript frontend for this worker. It needs a clean, modern card layout. Include a 'Start Recording' button that uses the browser's MediaRecorder API to capture audio and sends it as a blob to the `/summarize` endpoint via fetch."

### 6. Troubleshooting "Undefined" AI Responses
> "I am receiving an 'undefined' value in the frontend when displaying the summary. My worker code returns the result of `env.AI.run`. Explain how the Llama 3.3 model structures its JSON response and show how to correctly extract the `.response` string."

### 7. Optimizing Binary Audio Handling (500 Errors)
> "The worker crashes with a 500 error when processing larger audio files in the Whisper model. Rewrite the binary conversion logic to use `Array.from(new Uint8Array(audioData))` instead of the spread operator to avoid 'Maximum call stack size exceeded' errors."

### 8. DevOps & Branching Workflow
> "How do I set up a professional development workflow on Cloudflare? Show me how to use a `develop` branch for Preview Deployments in Cloudflare so I can test my AI features on a staging URL before merging them into the `main` branch."

### 9.Debbuging
> "I have attached my file and the error that I am facing right now. find the issue and give me a fixed version with an explaination of what you have changed and why."