// 1. The Durable Object for "Memory" (State)
export class SessionObject {
  constructor(state) {
    this.state = state;
  }
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

// 2. The Main Worker (Logic & UI)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Serve the UI to the browser instead of plain text
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(getHTML(), { headers: { "Content-Type": "text/html" } });
    }

    // Handle the AI processing
    if (url.pathname === "/summarize" && request.method === "POST") {
      try {
        let text = "";
        let sessionId = "default-user";
        const contentType = request.headers.get("content-type") || "";

        // Detect if input is raw audio from the record button or standard JSON
        if (contentType.includes("audio") || contentType.includes("webm")) {
          const audioData = await request.arrayBuffer();
          
          // FIX 1: Use Array.from instead of the spread syntax to prevent stack overflow errors
          const whisperRes = await env.AI.run('@cf/openai/whisper', {
            audio: Array.from(new Uint8Array(audioData))
          });
          text = whisperRes.text;
        } else {
          const body = await request.json();
          text = body.text;
          sessionId = body.sessionId || sessionId;
        }

        // 1. Get Memory from Durable Object
        const id = env.SESSION_STATE.idFromName(sessionId || "default-user");
        const session = env.SESSION_STATE.get(id);
        
        // Update memory
        await session.fetch(request.url, {
          method: "POST",
          body: JSON.stringify({ entry: text })
        });

        // FIX 2: Use the exact Cloudflare Llama 3.3 model ID
        const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: [
            { role: "system", content: "You are EchoMind. Summarize this journal entry and note the user's mood." },
            { role: "user", content: text }
          ]
        });

        return new Response(JSON.stringify({ 
          text: text, 
          summary: aiResponse.response || aiResponse 
        }), {
          headers: { "Content-Type": "application/json" }
        });

      } catch (e) {
        // Return a cleaner error response to the frontend to prevent silent UI failures
        return new Response(JSON.stringify({ 
          error: e.message, 
          text: "Error during processing", 
          summary: e.message 
        }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};

// 3. The Frontend UI (Fixes the "undefined" UI issues)
function getHTML() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>EchoMind AI</title>
      <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8f9fa; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); width: 100%; max-width: 450px; }
        button { background: #0070f3; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; }
        #status { margin: 10px 0; color: #888; font-style: italic; font-size: 0.85rem; }
        .box { margin-top: 15px; padding: 12px; background: #f1f3f5; border-radius: 6px; border-left: 4px solid #0070f3; font-size: 0.95rem; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>EchoMind AI</h1>
        <p>Record your thoughts. Llama 3.3 will summarize them.</p>
        <button id="btn" onclick="run()">Start Recording</button>
        <div id="status">Ready...</div>
        <div id="out"></div>
      </div>
      <script>
        let rec; let bits = [];
        async function run() {
          const b = document.getElementById('btn');
          if (!rec || rec.state === 'inactive') {
            const s = await navigator.mediaDevices.getUserMedia({ audio: true });
            rec = new MediaRecorder(s);
            bits = [];
            rec.ondataavailable = e => bits.push(e.data);
            rec.onstop = upload;
            rec.start();
            b.innerText = "Stop & Process";
            document.getElementById('status').innerText = "Recording...";
          } else {
            rec.stop();
            b.innerText = "Start Recording";
          }
        }
        async function upload() {
          document.getElementById('status').innerText = "AI Processing...";
          const blob = new Blob(bits, { type: 'audio/webm' });
          const r = await fetch('/summarize', { method: 'POST', body: blob, headers: {'Content-Type': 'audio/webm'} });
          const d = await r.json();
          document.getElementById('out').innerHTML = \`
            <div class="box"><strong>Transcribed:</strong> \${d.text || "No text detected"}</div>
            <div class="box"><strong>Summary:</strong> \${d.summary || "No summary generated"}</div>
          \`;
          document.getElementById('status').innerText = "Done!";
        }
      </script>
    </body>
    </html>
  `;
}