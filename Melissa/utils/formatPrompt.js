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

module.exports = { formatPrompt };