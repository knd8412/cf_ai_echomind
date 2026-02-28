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

    // Serve the UI to the browser
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(getHTML(), { headers: { "Content-Type": "text/html" } });
    }

    // Handle the AI processing
    if (url.pathname === "/summarize" && request.method === "POST") {
      try {
        let text = "";
        const contentType = request.headers.get("content-type") || "";

        // Check if the input is audio (from the Record button) or JSON
        if (contentType.includes("audio") || contentType.includes("webm")) {
          const audioData = await request.arrayBuffer();
          // Use Whisper to turn audio into text
          const whisperRes = await env.AI.run('@cf/openai/whisper', { 
            audio: [...new Uint8Array(audioData)] 
          });
          text = whisperRes.text;
        } else {
          const body = await request.json();
          text = body.text;
        }

        if (!text) throw new Error("No text detected");

        // Save to Memory (Durable Object)
        const id = env.SESSION_STATE.idFromName("global-user");
        const session = env.SESSION_STATE.get(id);
        await session.fetch(request.url, {
          method: "POST",
          body: JSON.stringify({ entry: text })
        });

        // Generate Summary with Llama 3.3
        const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
          messages: [
            { role: "system", content: "You are EchoMind. Summarize this journal entry concisely." },
            { role: "user", content: text }
          ]
        });

        // Extract the .response correctly to avoid "undefined"
        return new Response(JSON.stringify({ 
          text: text, 
          summary: aiResponse.response || aiResponse 
        }), {
          headers: { "Content-Type": "application/json" }
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};

// 3. The Frontend HTML/JS
function getHTML() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>EchoMind AI</title>
      <style>
        body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f2f5; margin: 0; }
        .card { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 90%; max-width: 500px; }
        button { background: #0070f3; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; transition: background 0.2s; }
        button:hover { background: #0056b3; }
        #status { margin: 15px 0; color: #666; font-style: italic; font-size: 0.9rem; }
        .output { margin-top: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #0070f3; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>EchoMind AI</h1>
        <p>Record your thoughts. Llama 3.3 will summarize them.</p>
        <button id="recBtn" onclick="toggleRecording()">🎤 Start Recording</button>
        <div id="status">Ready...</div>
        <div id="result"></div>
      </div>
      <script>
        let mediaRecorder;
        let chunks = [];

        async function toggleRecording() {
          const btn = document.getElementById('recBtn');
          if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            chunks = [];
            mediaRecorder.ondataavailable = e => chunks.push(e.data);
            mediaRecorder.onstop = sendData;
            mediaRecorder.start();
            btn.innerText = "🛑 Stop & Process";
            document.getElementById('status').innerText = "Recording...";
          } else {
            mediaRecorder.stop();
            btn.innerText = "🎤 Start Recording";
          }
        }

        async function sendData() {
          document.getElementById('status').innerText = "AI is thinking...";
          const blob = new Blob(chunks, { type: 'audio/webm' });
          
          try {
            const response = await fetch('/summarize', {
              method: 'POST',
              body: blob,
              headers: { 'Content-Type': 'audio/webm' }
            });
            const data = await response.json();
            
            document.getElementById('result').innerHTML = \`
              <div class="output">
                <strong>Transcribed:</strong> \${data.text || "No text detected"}
              </div>
              <div class="output">
                <strong>Summary:</strong> \${data.summary || "No summary generated"}
              </div>
            \`;
            document.getElementById('status').innerText = "Done!";
          } catch (err) {
            document.getElementById('status').innerText = "Error: " + err.message;
          }
        }
      </script>
    </body>
    </html>
  `;
}