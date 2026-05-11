// ═══════════════════════════════════════════════
// FINSHALA BACKEND SERVER
// ═══════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Proxy Python API requests safely to internal Flask container port 5000
// We avoid app.use('/api') so Express doesn't strip the `/api` prefix before forwarding!
app.use(createProxyMiddleware({ 
  target: 'http://127.0.0.1:5000', 
  changeOrigin: true,
  pathFilter: (path, req) => {
    return path.startsWith('/api') && path !== '/api/health' && !path.startsWith('/api/llm/proxy');
  }
}));

app.use(express.json());

// API Routes (Future separate backend logic)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Finshala API is running' });
});

app.post('/api/llm/proxy', async (req, res) => {
  // Hackathon Proxy: Secure way to call HuggingFace without exposing key
  try {
    const { model, messages, prompt } = req.body;
    
    if (!process.env.HF_API_KEY) {
      return res.status(500).json({ error: 'Missing HuggingFace API Key' });
    }

    let url = `https://router.huggingface.co/models/${model}`;
    let payload = { inputs: prompt };

    if (messages) {
      url = `https://router.huggingface.co/v1/chat/completions`;
      payload = {
        model: model,
        messages: messages,
        max_tokens: 512,
        stream: false
      };
    }
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`HF API Error: ${response.status} - ${errText || response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Backend LLM Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend build in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(buildPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Finshala Backend running on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Ready for Railway at http://0.0.0.0:${PORT}`);
});