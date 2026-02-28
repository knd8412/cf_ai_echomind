// The Durable Object for "Memory" remains the same
export class SessionObject {
  constructor(state) { this.state = state; }
  async fetch(request) {
    let memory = await this.state.storage.get("history") || [];
    if (request.method === "POST") {
      const { entry } = await request.json();
      memory.push(entry);
      if (memory.length > 5) memory.shift();
      await this.state.storage.put("history", memory);
    }
    return new Response(JSON.stringify({ memory }));
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. FRONTEND: Serve a simple UI when someone visits the URL
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(getHTML(), { headers: { "Content-Type": "text/html" } });
    }

    // 2. BACKEND: Process Voice/Text
    if (url.pathname === "/summarize" && request.method === "POST") {
      try {
        const contentType = request.headers.get("content-type");
        let text = "";

        // Support for Voice (Audio) or JSON text
        if (contentType.includes("audio")) {
          const audioData = await request.arrayBuffer();
          const whisperRes = await env.AI.run('@cf/openai/whisper', { audio: [...new Uint8Array(audioData)] });
          text = whisperRes.text;
        } else {
          const body = await request.json();
          text = body.text;
        }

        const id = env.SESSION_STATE.idFromName("global-session");
        const session = env.SESSION_STATE.get(id);
        await session.fetch(request.url, { method: "POST", body: JSON.stringify({ entry: text }) });

        const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
          messages: [
            { role: "system", content: "You are EchoMind. Summarize this journal entry concisely." },
            { role: "user", content: text }
          ]
        });

        return new Response(JSON.stringify({ text, summary: aiResponse.response }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }
    return new Response("Not Found", { status: 404 });
  }
};

// Simple HTML Template for the Browser
function getHTML() {
  return `
    <!DOCTYPE html>
    <style>
      body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; line-height: 1.6; background: #f4f4f9; }
      .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      button { background: #0070f3; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
      #status { margin-top: 20px; color: #666; font-style: italic; }
    </style>
    <div class="card">
      <h1>EchoMind AI</h1>
      <p>Record your thoughts. Llama 3.3 will summarize them.</p>
      <button onclick="startRecording()" id="recBtn">🎤 Start Recording</button>
      <div id="status">Ready...</div>
      <div id="result" style="margin-top:20px; white-space: pre-wrap;"></div>
    </div>
    <script>
      let mediaRecorder;
      async function startRecording() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        let chunks = [];
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          document.getElementById('status').innerText = "Processing with Workers AI...";
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const res = await fetch('/summarize', { method: 'POST', body: blob, headers: {'Content-Type': 'audio/webm'} });
          const data = await res.json();
          document.getElementById('result').innerHTML = "<b>Transcribed:</b> " + data.text + "\\n\\n<b>Summary:</b> " + data.summary;
          document.getElementById('status').innerText = "Done!";
        };
        mediaRecorder.start();
        document.getElementById('recBtn').innerText = "🛑 Stop & Process";
        document.getElementById('recBtn').onclick = () => { mediaRecorder.stop(); };
      }
    </script>
  `;
}