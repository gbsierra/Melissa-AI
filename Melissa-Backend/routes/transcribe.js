// routes/transcribe.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { runWhisper } = require('../services/whisperClient');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No audio file uploaded');

    const audioPath = path.join(__dirname, '..', 'uploads', req.file.filename);
    const transcript = await runWhisper(audioPath);

    res.json({ success: true, transcript });
  } catch (err) {
    console.error('Transcription error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;