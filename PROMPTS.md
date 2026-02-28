# AI Prompts Used

The following prompts were used to assist in the architectural design and code generation for this project.

### Backend Logic & AI Integration
* "Create a Cloudflare Worker script that takes a base64 encoded audio string and sends it to the Cloudflare Workers AI Whisper model for transcription."
* "Write a prompt for Llama 3.3 that takes a journal transcript and returns a JSON object containing a 'summary', a 'mood' (e.g., Happy, Anxious), and 'tags'."

### Infrastructure & Config
* "Generate a `wrangler.toml` file that includes bindings for a D1 database named 'JOURNAL_DB' and an AI binding."
* "How do I structure a Cloudflare Workflow to handle a multi-step process: transcription -> LLM analysis -> D1 storage?"

### Frontend Interaction
* "Write a React hook for Cloudflare Pages that handles the MediaRecorder API to record 30 seconds of audio and POSTs it to a worker."