const { spawn } = require('child_process');
const path = require('path');

function runWhisper(audioPath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'whisperClient.py');

    // ✅ Use Python from your virtual environment
    const pythonPath = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe'); // Windows-specific

    console.log('Running Whisper with:', pythonPath, pythonScript);
    const process = spawn(pythonPath, [pythonScript, audioPath]);

    let transcript = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      transcript += data.toString();
    });

    process.stderr.on('data', (err) => {
      errorOutput += err.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(transcript.trim());
      } else {
        reject(new Error(`Whisper failed: ${errorOutput}`));
      }
    });
  });
}

module.exports = { runWhisper };