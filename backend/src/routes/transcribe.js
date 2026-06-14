const express = require('express');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Multer: almacena el audio en memoria (buffer), max 25MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'video/webm'];
    // Aceptar cualquier audio/* y video/webm (Chrome lo graba como video/webm)
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(null, true); // aceptar igual y dejar que Groq decida
    }
  },
});

/**
 * POST /api/transcribe
 * Recibe un archivo de audio (multipart/form-data, campo "audio")
 * Lo envía a Groq Whisper y devuelve { text: '...' }
 */
router.post('/', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo de audio' });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY no configurada' });
    }

    // Determinar extensión según mimetype
    const mimeToExt = {
      'audio/webm': 'webm',
      'video/webm': 'webm',
      'audio/mp4': 'mp4',
      'audio/m4a': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
    };
    const ext = mimeToExt[req.file.mimetype] || 'webm';
    const filename = `audio.${ext}`;

    // Armar FormData para Groq
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename,
      contentType: req.file.mimetype,
    });
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'json');
    form.append('language', 'es');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error('Groq Whisper error:', groqRes.status, errBody);
      return res.status(502).json({ error: 'Error al transcribir audio', detail: errBody });
    }

    const data = await groqRes.json();
    const text = data.text?.trim() || '';

    res.json({ text });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
