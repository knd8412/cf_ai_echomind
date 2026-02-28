// This is the Durable Object class that handles "Memory"
export class SessionObject {
  constructor(state, env) {
    this.state = state;
  }

  async fetch(request) {
    // Retrieve existing memory or start fresh
    let memory = await this.state.storage.get("history") || [];
    
    if (request.method === "POST") {
      const { entry } = await request.json();
      memory.push(entry);
      // Keep only the last 5 entries to save space
      if (memory.length > 5) memory.shift();
      await this.state.storage.put("history", memory);
      return new Response(JSON.stringify({ memory }));
    }

    return new Response(JSON.stringify({ memory }));
  }
}

// This is your main Worker
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("EchoMind AI is active. Send voice transcripts to /summarize", { status: 200 });
    }

    if (url.pathname === "/summarize" && request.method === "POST") {
      try {
        const { text, sessionId } = await request.json();

        // 1. Get Memory from Durable Object
        const id = env.SESSION_STATE.idFromName(sessionId || "default-user");
        const session = env.SESSION_STATE.get(id);
        
        // Update memory
        await session.fetch(request.url, {
          method: "POST",
          body: JSON.stringify({ entry: text })
        });

        // 2. Run AI Analysis with Llama 3.3
        const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
          messages: [
            { role: "system", content: "You are EchoMind. Summarize this journal entry and note the user's mood." },
            { role: "user", content: text }
          ]
        });

        return new Response(JSON.stringify(aiResponse), {
          headers: { "Content-Type": "application/json" }
        });

      } catch (e) {
        return new Response(e.message, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};