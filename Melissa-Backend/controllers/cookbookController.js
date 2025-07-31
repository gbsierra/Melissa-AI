const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const genAI = require('../services/geminiClient');
const { callFallbackAPI } = require('../services/fallbackClient');
const { formatCookbookPrompt, formatLatexValidationPrompt } = require('../utils/formatPrompt');

async function generateCookbook(req, res) {
  const { recipes = [] } = req.body;

  if (!recipes.length) {
    return res.status(400).json({ error: 'No recipes provided.' });
  }

  console.log('\n[Cookbook-Backend] 🧠 Generating LaTeX cookbook with', recipes.length, 'recipes');

  const prompt = formatCookbookPrompt(recipes);
  console.log('\n🔍 Prompt sent to Gemini:\n', prompt.slice(0, 2000), '...');

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent(prompt);
    let latex = result.response.text().replace(/^```latex\s*|```$/g, '').trim();

    console.log('\n📄 Gemini LaTeX Output (raw):\n', latex.slice(0, 2000), '...');

    if (!latex.includes('\\documentclass')) {
      throw new Error('Gemini response does not contain valid LaTeX document');
    }

    // Run validation/fix pass
    const validatorPrompt = formatLatexValidationPrompt(latex);
    const validator = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const validated = await validator.generateContent(validatorPrompt);
    latex = validated.response.text().replace(/^```latex\s*|```$/g, '').trim();

    console.log('\n✅ Post-validated LaTeX:\n', latex.slice(0, 2000), '...');

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cookbook-'));
    const texPath = path.join(tmpDir, 'cookbook.tex');
    const pdfPath = path.join(tmpDir, 'cookbook.pdf');

    fs.writeFileSync(texPath, latex);
    console.log(`📝 LaTeX written to: ${texPath}`);
    console.log(`📂 Compiling PDF in: ${tmpDir}`);

    try {
      const compileLog = execSync(`pdflatex -interaction=nonstopmode -halt-on-error -output-directory=${tmpDir} ${texPath}`, {
        encoding: 'utf-8'
      });
      //console.log('✅ pdflatex compile output:\n', compileLog);
    } catch (compileErr) {
      console.error('❌ pdflatex failed:\n', compileErr.stdout?.toString() || compileErr.message);
      const logPath = path.join(tmpDir, 'cookbook.log');
      if (fs.existsSync(logPath)) {
        const log = fs.readFileSync(logPath, 'utf-8');
        console.error('🪵 pdflatex log:\n', log.slice(0, 2000));
      }
      return res.status(500).json({ error: 'LaTeX compilation failed. See logs.' });
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64pdf = pdfBuffer.toString('base64');
    fs.rmSync(tmpDir, { recursive: true, force: true });

    return res.json({ base64pdf });

  } catch (err) {
    console.error('⚠️ Gemini LaTeX generation failed:', err.message);
    return res.status(500).json({ error: 'Failed to generate cookbook PDF.' });
  }
}

module.exports = { generateCookbook };
