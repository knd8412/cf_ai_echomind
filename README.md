# 🎙️ cf_ai_echomind

### *Intelligent Voice Journaling with Persistent AI Memory*

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Llama 3.3](https://img.shields.io/badge/AI-Llama_3.3-blue?style=for-the-badge)](https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct/)

**EchoMind AI** is a full-stack, voice-enabled journaling application built entirely on the Cloudflare ecosystem. It allows users to capture spoken thoughts, transcribes them using **Whisper**, and generates high-reasoning summaries and mood analysis via **Llama 3.3**—all while maintaining a rolling history of the session through **Durable Objects**.

---

## 🚀 Live Demo
**Production URL:** [https://cf-ai-echomind.k-nadarkhani.workers.dev](https://cf-ai-echomind.k-nadarkhani.workers.dev)

---

## ✨ Key Features
* **Voice-to-Text Transcription**: Native browser audio capture processed through the `@cf/openai/whisper` model.
* **Intelligent Summarization**: Deep reasoning and mood detection powered by `@cf/meta/llama-3.3-70b-instruct`.
* **Stateful Coordination**: Utilizes **Durable Objects** to maintain a persistent history of the last 5 entries, providing context for the AI.
* **Zero-Latency UI**: A lightweight Vanilla JS frontend served directly from the edge via the Worker.

---

## 🛠️ The Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Orchestration** | Cloudflare Workers | Handles routing, UI serving, and AI coordination. |
| **State/Memory** | Durable Objects | Manages persistent journal history (`SessionObject`). |
| **Transcription** | OpenAI Whisper | Converts WebM audio blobs to text. |
| **Inference** | Llama 3.3 70B | Generates summaries and analyzes sentiment. |
| **Frontend** | HTML5 / JS | Captures audio via MediaRecorder API. |

---

## 🧠 How It Works
1.  **Capture**: User records audio; the browser generates a WebM blob.
2.  **Processing**: The Worker receives the blob and runs `@cf/openai/whisper` to transcribe the speech.
3.  **Memory**: The transcript is sent to a **Durable Object** to be stored in the user's session history.
4.  **Analysis**: The transcript is passed to **Llama 3.3**, which returns a concise summary and mood assessment.
5.  **Output**: The final result is rendered in a clean, modern UI card.

---

## 💻 Local Development

1.  **Clone & Install**:
    ```bash
    git clone [https://github.com/knd8412/cf_ai_echomind.git](https://github.com/knd8412/cf_ai_echomind.git)
    npm install
    ```
2.  **Wrangler Configuration**:
    Ensure your `wrangler.toml` includes the `SESSION_STATE` Durable Object binding and the `AI` binding.
3.  **Run Locally**:
    ```bash
    npx wrangler dev
    ```
4.  **Deploy**:
    ```bash
    npx wrangler deploy
    ```