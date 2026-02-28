# cf_ai_echomind

**EchoMind** is a smart, voice-powered journaling assistant built entirely on the Cloudflare ecosystem. It captures your thoughts via voice, transcribes them, and uses AI to summarize your day while maintaining a persistent memory of your previous entries.

## 🚀 Live Demo
[INSERT YOUR CLOUDFLARE PAGES/WORKER URL HERE]

## ✨ Features
* **Voice-to-Insights:** Uses OpenAI Whisper on Cloudflare Workers AI for high-accuracy transcription.
* **Contextual Memory:** Utilizes Cloudflare D1 (SQL) to remember past entries and provide continuity.
* **Intelligent Analysis:** Powered by Llama 3.3 to extract moods and key themes from your sessions.
* **Edge-Native:** Deployed on Cloudflare's global network for minimal latency.

## 🛠️ Tech Stack
* **Frontend:** Cloudflare Pages (React)
* **Backend:** Cloudflare Workers
* **Orchestration:** Cloudflare Workflows
* **Database:** Cloudflare D1
* **AI Models:** `@cf/meta/llama-3.3-70b-instruct`, `@cf/openai/whisper`

## 🛠️ Development Workflow
* We use GitHub Flow. The main branch is for stable production releases. All active development happens on the develop branch, which triggers automatic Preview Deployments on Cloudflare for testing.

## 📦 Getting Started
1. Clone the repo: `git clone https://github.com/your-username/cf_ai_echomind.git`
2. Install dependencies: `npm install`
3. Deploy to Cloudflare: `npx wrangler deploy`