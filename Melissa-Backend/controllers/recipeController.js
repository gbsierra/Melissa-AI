const genAI = require('../services/geminiClient');
const { formatPrompt, formatAdjustmentPrompt } = require('../utils/formatPrompt');
const { callFallbackAPI } = require('../services/fallbackClient');

//
function safeParse(text, source) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.warn(`❗ Failed to parse ${source} response:\n`, text);
    return null;
  }
}

//
function extractRecipeFromMarkdown(text) {
  const titleMatch = text.match(/\*\*(.*?)\*\*/);
  const ingredientsMatch = text.match(/\*\*Ingredients:\*\*\n([\s\S]+?)\n\n/);
  const stepsMatch = text.match(/\*\*Instructions:\*\*\n([\s\S]+?)(\n\n|\n\*\*|$)/);

  return {
    title: titleMatch?.[1]?.trim() || 'Untitled',
    ingredients: ingredientsMatch?.[1]?.trim().split('\n').map(i => i.replace(/^\*+\s*/, '').trim()),
    instructions: stepsMatch?.[1]?.trim().split('\n').map(s => s.replace(/^\d+\.\s*/, '').trim()),
  };
}

//
function normalizeRecipe(raw, prompt = '', servings = '') {
  return {
    dishName: raw.title ?? 'Untitled',
    ingredients: raw.ingredients ?? [],
    instructions: raw.instructions ?? raw.steps ?? [],
    servings: servings ? parseInt(servings) : null,
    prompt,
    photo: null,
  };
}

//
async function generateRecipe(req, res) {
  const {
    query = '',
    mode = '',
    servings = '',
    difficulty = '',
    cookware = ''
  } = req.body || {};

  console.log(`\n[Melissa-Backend] 🍳 Mode selected: ${mode}`);

  if (!mode) {
    return res.status(400).json({ error: 'Missing input mode (image-only, text-only, or fusion)' });
  }

  const prompt = formatPrompt(query || '', mode, servings, difficulty, cookware);
  console.log('[Melissa-Backend] 🧠 Formatted Prompt:\n', prompt);

  let input;

  if (mode === 'image-only' || mode === 'fusion') {

    const imageFiles = req.files;

    if (!Array.isArray(imageFiles) || imageFiles.length === 0) {
      return res.status(400).json({ error: 'No valid images uploaded.' });
    }
    if (imageFiles.length > process.env.MAX_PHOTOS) {
      console.warn(`⚠️ Too many images: received ${imageFiles.length}, max allowed is ${MAX_PHOTOS}`);
    }

    const imageParts = imageFiles.map((file, idx) => {
      console.log(`[Melissa-Backend] Image ${idx + 1} received: ${file.originalname}, ${file.size} bytes`);
      return {
        inlineData: {
          data: file.buffer.toString('base64'),
          mimeType: file.mimetype || 'image/jpeg',
        },
      };
    });

    input = [{ text: prompt }, ...imageParts];
  } else {
    input = prompt;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(input);
    const responseText = result.response.text().replace(/```json|```/g, '').trim();

    const rawRecipe = safeParse(responseText, 'Gemini') || extractRecipeFromMarkdown(responseText);
    if (!rawRecipe) throw new Error('Gemini returned invalid recipe format');

    const recipe = normalizeRecipe(rawRecipe, prompt, servings);
    console.log('\n[Melissa-Backend] Recipe Output Received!');
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

      const rawFallback = safeParse(fallbackText.body || fallbackText, 'Fallback');
      if (!rawFallback) {
        return res.status(500).json({ error: 'Fallback API returned invalid recipe format.' });
      }

      const fallbackRecipe = normalizeRecipe(rawFallback, prompt, servings);
      console.log('[Melissa] 🔄 Fallback normalized recipe:', fallbackRecipe);
      return res.json(fallbackRecipe);
    } catch (fallbackErr) {
      console.error('❌ Fallback parse failed:', fallbackErr.message);
      return res.status(500).json({ error: 'Fallback API parse failed unexpectedly.' });
    }
  }
}

// Function to adjustRecipe from given input
async function adjustRecipe(req, res) {
  const {
    dishName,
    servings,
    ingredients,
    instructions,
    adjustmentPrompt,
  } = req.body || {};

  const files = req.files || []; // multiple uploaded photos
  const ingredientPhotos = files.map(file => file.buffer); // array of Buffers
  console.log('\n[Melissa-Backend] ✏️ Adjustment prompt:', adjustmentPrompt);
  console.log('[Melissa-Backend] 📷 Additional photos:', files.map(f => f.originalname).join(', '));

  const parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
  const parsedInstructions = typeof instructions === 'string' ? JSON.parse(instructions) : instructions;

  const prompt = formatAdjustmentPrompt(dishName, servings, parsedIngredients, parsedInstructions, adjustmentPrompt, ingredientPhotos);
  console.log('[Melissa-Backend] 🧠 Formatted Prompt:\n', prompt);

  const input = ingredientPhotos.length > 0
    ? [
        { text: prompt },
        ...ingredientPhotos.map(buffer => ({
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: 'image/jpeg',
          },
        })),
      ]
    : prompt;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(input);
    const responseText = result.response.text().replace(/```json|```/g, '').trim();

    const raw = safeParse(responseText, 'Gemini') || extractRecipeFromMarkdown(responseText);
    if (!raw) throw new Error('Gemini returned invalid recipe format');

    const updated = normalizeRecipe(raw, adjustmentPrompt, servings);
    console.log('[Melissa] ✅ Adjustment response:', updated);
    return res.json(updated);
  } catch (err) {
    console.error('❌ Failed to adjust recipe:', err.message);
    return res.status(500).json({ error: 'Adjustment failed' });
  }
}

module.exports = { generateRecipe, adjustRecipe };