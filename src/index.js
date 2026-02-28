export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Basic Health Check
    if (url.pathname === "/") {
      return new Response("EchoMind AI API is running! Send a POST request to /summarize", { status: 200 });
    }

    // 2. The AI Summarization Endpoint
    if (url.pathname === "/summarize" && request.method === "POST") {
      try {
        const { text } = await request.json();

        if (!text) {
          return new Response("Missing text for summarization", { status: 400 });
        }

        // Call Llama 3.3 on Workers AI
        const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
          messages: [
            { role: "system", content: "You are EchoMind, a helpful journaling assistant. Summarize the user's entry and identify their mood." },
            { role: "user", content: text }
          ]
        });

        return new Response(JSON.stringify(response), {
          headers: { "Content-Type": "application/json" }
        });

      } catch (e) {
        return new Response(e.message, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};