/**
 * @typedef {'image-only' | 'voice-only' | 'fusion' | 'text-only'} InputMode
 */

/**
 * @param {string[]} imageTags
 * @param {string} query
 * @param {InputMode} mode
 * @param {string | number} [servings] // Optional servings input
 * @returns {string}
 */
function formatPrompt(imageTags, query, mode, servings, difficulty, cookware) {
  const servingsLine = servings ? ` Approximately ${servings} servings.` : '';
  const difficultyLine = difficulty ? ` Desired difficulty is "${difficulty}".` : '';
  const cookwareLine = cookware ? ` Must use: ${cookware}.` : '';

  const formatHint = ` Respond strictly with a JSON object like:
    {
      "title": "Dish Name",
      "ingredients": [
        { "group": "Group Name", 
         "items": ["ingredient 1", "ingredient 2"] 
        }
      ],
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
    Return *only* the JSON. No markdown, no commentary, no explanation.`;

  switch (mode) {
    case 'image-only':
      return `Input modality: visual tags. Tags detected: ${imageTags.join(', ')}. Task: generate a recipe.${servingsLine}${difficultyLine}${cookwareLine}${formatHint}`;
    case 'voice-only':
      return `Input modality: voice transcript. Transcript received: "${query}". Task: generate a recipe.${servingsLine}${difficultyLine}${cookwareLine}${formatHint}`;
    case 'fusion':
      return `Input modality: fusion. Tags detected: ${imageTags.join(', ')}. Transcript received: "${query}". Task: generate a recipe that integrates both inputs.${servingsLine}${difficultyLine}${cookwareLine}${formatHint}`;
    case 'text-only':
      return `Input modality: textual request. User input: "${query}". Task: generate a recipe.${servingsLine}${difficultyLine}${cookwareLine}${formatHint}`;
    default:
      throw new Error(`Invalid mode: ${mode}`);
  }
}

/**
 * @param {string} dishName
 * @param {string | number} servings
 * @param {Array<{ group: string, items: (string | { name?: string, item?: string, amount?: string })[] }>} ingredients
 * @param {string[]} instructions
 * @param {string} adjustmentPrompt
 * @param {boolean} hasPhoto
 * @returns {string}
 */
function formatAdjustmentPrompt(dishName, servings, ingredients, instructions, adjustmentPrompt, hasPhoto) {
  const servingsLine = servings ? ` Approximately ${servings} servings.` : '';
  //const photoLine = hasPhoto ? ' Ingredient image included.' : '';
  
  const formatHint = ` Respond strictly with a JSON object like: {"title":"Dish Name","ingredients":[{"group":"Group Name","items":["ingredient 1","ingredient 2"]}],"steps":["Step 1","Step 2"]} Return *only* the JSON.`;

  const ingredientLines = Array.isArray(ingredients)
    ? ingredients.map(group =>
        `${group.group}: ${group.items.map(i =>
          typeof i === 'string'
            ? i
            : `${i.name ?? i.item}${i.amount ? ` (${i.amount})` : ''}`
        ).join(', ')}`
      ).join(' | ')
    : 'Ingredients unavailable.';

  const instructionLines = Array.isArray(instructions)
    ? instructions.map((step, i) => `${i + 1}. ${step}`).join(' | ')
    : 'Instructions unavailable.';

  return `Input modality: Recipe adjustment for Dish: "${dishName}".${servingsLine} Ingredients: ${ingredientLines}. Instructions: ${instructionLines}. Don't change anything besides Adjustment request: "${adjustmentPrompt}".${formatHint}`;
}

/**
 * @param {string} originalName - Name of the original ingredient to be replaced
 * @param {string} substituteName - Name of the substitute ingredient
 * @returns {string} - Formatted prompt for AI substitution logic
 */
function formatSubstitutionAmountPrompt(originalName, substituteName) {
  return `You're a culinary assistant helping with ingredient substitutions.

  Given "${originalName}", suggest the precise quantity of "${substituteName}" needed to match its role in a recipe. Adjust based on flavor intensity, acidity, and typical usage.

  Respond only in structured JSON, NO MARKDOWN, NO TRIPLE BACKTICKS:
  {
    "amount": "just the numeric portion, e.g. ½",
    "unit": "measurement unit, e.g. tsp, tbsp, cup",
    "ingredient": "name of the substituted ingredient, e.g. ground star anise"
  }`;
}

/**
 * Generates a prompt asking for widely available substitutes for a given ingredient.
 * @param {string} ingredient - The ingredient to be substituted
 * @returns {string} - AI-ready prompt string
 */
function formatSubstitutionListPrompt(ingredient) {
  return `You're a culinary assistant. Suggest three widely available substitutes for "${ingredient}". Reply with JSON: { "substitutes": ["Alt1", "Alt2", "Alt3"] }`;
}

module.exports = { formatPrompt, formatAdjustmentPrompt, formatSubstitutionAmountPrompt, formatSubstitutionListPrompt };