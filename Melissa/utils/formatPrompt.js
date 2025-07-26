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
function formatPrompt(imageTags, query, mode, servings) {
  const servingsLine = servings ? ` They want approximately ${servings} servings.` : '';

  const formatHint = ` Respond strictly with a JSON object like:
{
  "title": "Dish Name",
  "ingredients": [
    { "group": "Group Name", "items": ["ingredient 1", "ingredient 2"] }
  ],
  "steps": ["Step 1", "Step 2", "Step 3"]
}
Return *only* the JSON. No markdown, no commentary, no explanation.`;

  switch (mode) {
    case 'image-only':
      return `Based only on these visual ingredient tags: ${imageTags.join(', ')}, generate a suitable recipe.${servingsLine}${formatHint}`;
    case 'voice-only':
      return `The user said: "${query}". Generate a recipe based on this spoken input.${servingsLine}${formatHint}`;
    case 'fusion':
      return `The user provided a photo containing: ${imageTags.join(', ')} and also said: "${query}". Combine both sources of input to generate a personalized recipe.${servingsLine}${formatHint}`;
    case 'text-only':
      return `A user submitted this full recipe request: "${query}". Generate a recipe that best fulfills their request.${servingsLine}${formatHint}`;
    default:
      throw new Error(`Invalid mode: ${mode}`);
  }
}

module.exports = { formatPrompt };