const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

/**
 * POST /api/tts
 * Body: { text: string, voice?: string }
 * Returns: audio/wav stream
 */
router.post('/', async (req, res) => {
  const { text, voice } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text required' });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
  }

  // Truncate very long texts to avoid TTS timeout (Groq limit ~500 chars for TTS)
  const truncated = text.trim().slice(0, 800);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'playai-tts',
        input: truncated,
        voice: voice || 'Arista-PlayAI',
        response_format: 'wav',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[TTS] Groq error:', response.status, errText);

      // If playai-tts fails, try fallback model
      if (response.status === 400 || response.status === 404) {
        return res.status(502).json({ error: 'TTS model unavailable', detail: errText });
      }
      return res.status(502).json({ error: 'TTS failed', detail: errText });
    }

    res.set('Content-Type', 'audio/wav');
    res.set('Cache-Control', 'no-store');
    response.body.pipe(res);
  } catch (err) {
    console.error('[TTS] error:', err);
    res.status(500).json({ error: 'TTS internal error' });
  }
});

module.exports = router;
