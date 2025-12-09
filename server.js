const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 3000;
const app = express();

const templatePath = path.join(__dirname, 'templates', 'prompt-template.txt');
const promptTemplate = fs.readFileSync(templatePath, 'utf8');

app.use(express.json({ limit: '512kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/generate', async (req, res) => {
  const { apiKey, model = 'openrouter/auto', description = '' } = req.body || {};
  const resolvedKey = (apiKey || process.env.OPENROUTER_API_KEY || '').trim();
  const sanitizedDescription = description.trim();

  if (!resolvedKey) {
    return res.status(400).json({ error: 'An OpenRouter API key is required.' });
  }

  if (!sanitizedDescription) {
    return res.status(400).json({ error: 'Please provide a description of the plugin you want.' });
  }

  const prompt = promptTemplate.replace('{{spec}}', sanitizedDescription);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolvedKey}`,
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'WP Plugin Generator'
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'You are an expert WordPress plugin developer. Output only valid WordPress plugin code with clear comments.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `OpenRouter error: ${errorText}` });
    }

    const data = await response.json();
    const pluginCode = data?.choices?.[0]?.message?.content?.trim();

    if (!pluginCode) {
      return res.status(502).json({ error: 'No plugin code returned. Try again with more detail.' });
    }

    res.json({ pluginCode });
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }

    console.error('Generation failed:', error);
    res.status(500).json({ error: 'Unexpected server error. Check logs and try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`WordPress plugin generator listening on http://localhost:${PORT}`);
});
