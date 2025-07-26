const genAI = require('../services/geminiClient');
const { formatPrompt } = require('../../Melissa/utils/formatPrompt');
const { callFallbackAPI } = require('../services/fallbackClient');

function safeParse(text, source) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.warn(`❗ Failed to parse ${source} response:\n`, text);
    return null;
  }
}

function extractRecipeFromMarkdown(text) {
  const titleMatch = text.match(/\*\*(.*?)\*\*/);
  const ingredientsMatch = text.match(/\*\*Ingredients:\*\*\n([\s\S]+?)\n\n/);
  const stepsMatch = text.match(/\*\*Instructions:\*\*\n([\s\S]+?)(\n\n|\n\*\*|$)/);

  return {
    title: titleMatch?.[1]?.trim() || 'Untitled',
    ingredients: ingredientsMatch?.[1]?.trim().split('\n').map(i => i.replace(/^\*+\s*/, '').trim()),
    steps: stepsMatch?.[1]?.trim().split('\n').map(s => s.replace(/^\d+\.\s*/, '').trim()),
  };
}

async function generateRecipe(req, res) {
  const {
    imageTags = [],
    voiceText = '',
    manualText = '',
    query = '',
    mode = '',
    servings = ''
  } = req.body || {};

  // Log everything for sanity
  console.log('[Melissa] 🔍 Incoming body:', req.body);
  console.log('[Melissa] 📂 Incoming files:', req.files);
  console.log(`[Melissa] 🍳 Mode selected: ${mode}`);

  if (!mode) {
    return res.status(400).json({ error: 'Missing input mode (image-only, voice-only, fusion, or text-only)' });
  }

  const prompt = formatPrompt(imageTags, voiceText || manualText || query || '', mode, servings);
  console.log('[Melissa] 🧠 Formatted Prompt:\n', prompt);

  let input;

  if (mode === 'image-only' || mode === 'fusion') {
    const image1 = req.files?.image1?.[0];
    if (!image1 || !image1.buffer) {
      console.error('[Melissa] 🖼 No image1 buffer found');
      return res.status(400).json({ error: 'Missing Image: image1 not uploaded correctly.' });
    }

    console.log(`[Melissa] 🖼 image1 received: ${image1.originalname}, ${image1.size} bytes`);

    const imagePart = {
      inlineData: {
        data: image1.buffer.toString('base64'),
        mimeType: image1.mimetype || 'image/jpeg',
      },
    };

    input = [{ text: prompt }, imagePart];
  } else {
    input = prompt;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(input);
    const responseText = result.response.text().replace(/```json|```/g, '').trim();

    const recipe = safeParse(responseText, 'Gemini') || extractRecipeFromMarkdown(responseText);
    if (!recipe) throw new Error('Gemini returned invalid recipe format');

    console.log('[Melissa] ✅ Gemini recipe:', recipe);
    return res.json(recipe);
  } catch (err) {
    const errMsg = err?.message?.toLowerCase?.() || '';
    const isQuota = errMsg.includes('quota');

    console.warn('⚠️ Gemini failed:', err.message);
    if (isQuota) {
      console.warn('💡 Detected quota error — using fallback API.');
    }

    try {
      const fallbackText = await callFallbackAPI(prompt);
      if (!fallbackText || fallbackText.statusCode === 403) {
        console.error('❌ Fallback API failed or unauthorized');
        return res.status(500).json({ error: 'Gemini failed and fallback API is unavailable.' });
      }

      const fallbackRecipe = safeParse(fallbackText.body || fallbackText, 'Fallback');
      if (!fallbackRecipe) {
        return res.status(500).json({ error: 'Fallback API returned invalid recipe format.' });
      }

      console.log('[Melissa] 🔄 Fallback recipe:', fallbackRecipe);
      return res.json(fallbackRecipe);
    } catch (fallbackErr) {
      console.error('❌ Fallback parse failed:', fallbackErr.message);
      return res.status(500).json({ error: 'Fallback API parse failed unexpectedly.' });
    }
  }
}

module.exports = { generateRecipe };