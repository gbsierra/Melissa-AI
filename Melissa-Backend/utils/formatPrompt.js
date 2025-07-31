/**
 * @typedef {'image-only' | 'voice-only' | 'fusion' | 'text-only'} InputMode
 */

/**
 * @param {string} query
 * @param {InputMode} mode
 * @param {string | number} [servings] // Optional servings input
 * @returns {string}
 */
function formatPrompt(query, mode, servings, difficulty, cookware) {
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
    case 'text-only':
      return `Task: generate a recipe. User input: "${query}".${servingsLine}${difficultyLine}${cookwareLine}${formatHint}`;
    case 'image-only':
      return `Task: generate a recipe.${servingsLine}${difficultyLine}${cookwareLine}${formatHint}`; //images are appended in recipeController
    case 'fusion':
      return `Task: generate a recipe. User input: "${query}".${servingsLine}${difficultyLine}${cookwareLine}${formatHint}`; //images are appended in recipeController
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
  
  const formatHint = ` Respond strictly with a JSON object like: 
    {
      "title":"Dish Name",
      "ingredients":[
        {"group":"Group Name",
        "items":["ingredient 1","ingredient 2"]
        }
      ],
      "steps":["Step 1","Step 2"]
    } 
    Return *only* the JSON. No markdown, no commentary, no explanation.`;

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

  return `Task: recipe adjustment for Dish: "${dishName}".${servingsLine} Ingredients: ${ingredientLines}. Instructions: ${instructionLines}. Don't change anything besides Adjustment request: "${adjustmentPrompt}".${formatHint}`;
}

/**
 * @param {string} originalName - Name of the original ingredient to be replaced
 * @param {string} substituteName - Name of the substitute ingredient
 * @returns {string} - Formatted prompt for AI substitution logic
 */
function formatSubstitutionAmountPrompt(originalName, substituteName) {
  return `Task: Given "${originalName}", suggest the precise quantity of "${substituteName}" needed to match its role in a recipe. Adjust based on flavor intensity, acidity, and typical usage.
  Return *only* the JSON. No markdown, no commentary, no explanation:
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
  return `Task: Suggest three widely available substitutes for "${ingredient}". Return *only* the JSON. No markdown, no commentary, no explanation: { "substitutes": ["Alt1", "Alt2", "Alt3"] }`;
}

/**
 * @param {Recipe[]} recipes - List of user-selected recipes
 * @returns {string} - Prompt for generating a LaTeX cookbook
 */
function formatCookbookPrompt(recipes) {
  const escapeLatex = (str = '') =>
    String(str)
      .replace(/([\\%&${}_^~])/g, '\\$1')
      .replace(/#/g, '\\#')
      .replace(/[{}]/g, '\\$&');

  const recipeSummaries = recipes.map((r, i) => {
    const ingredients = Array.isArray(r.ingredients)
      ? r.ingredients
          .map((group) =>
            group?.group && Array.isArray(group.items)
              ? `${escapeLatex(group.group)}: ${group.items.map(escapeLatex).join(', ')}`
              : ''
          )
          .filter(Boolean)
          .join(' | ')
      : 'N/A';

    const instructions = Array.isArray(r.instructions)
      ? r.instructions.map(escapeLatex).join('. ')
      : 'N/A';

    return `Recipe ${i + 1}:
Title: ${escapeLatex(r.dishName)}
Ingredients: ${ingredients}
Instructions: ${instructions}`;
  }).join('\n\n');

  return `Generate a LaTeX document for a cookbook using \\documentclass{book} that compiles with pdflatex. Use only standard packages: geometry, titlesec, tocloft, enumitem, hyperref, xcolor[rgb], tcolorbox[most], fancyhdr, lmodern.

Requirements:
- Title page: "My Family Cookbook", subtitle "Timeless Recipes", author "Your Name", date "July 2025", text cover description (e.g., "Rustic table with recipe cards").
- Foreword: 100 words.
- Table of contents.
- Recipes in chapters (e.g., Breakfast, Dinner) with 1-sentence italic intros.
- Recipes in \\newtcolorbox{recipebox}[1]{breakable,colback=beige,colframe=brown,coltitle=white,title={#1},boxsep=5pt}.
- Ingredients in \\begin{itemize}, instructions in \\begin{enumerate}.
- Headers: \\fancyhead[LE]{My Family Cookbook}, \\fancyhead[RO]{\\leftmark}.
- Footer: \\fancyfoot[C]{\\thepage}.
- Add \\setlist[itemize]{noitemsep,topsep=0pt} and \\setlist[enumerate]{noitemsep,topsep=0pt}.
- Use only standard LaTeX commands, no external packages or images.
- Return only the LaTeX source.

Recipes:
${recipeSummaries}`;
}

/**
 * @param {string} latex - Raw LaTeX source to validate
 * @returns {string} - Prompt to fix LaTeX errors
 */
function formatLatexValidationPrompt(latex) {
  return `Fix this LaTeX document to compile with pdflatex using only standard packages: geometry, titlesec, tocloft, enumitem, hyperref, xcolor[rgb], tcolorbox[most], fancyhdr, lmodern.

Rules:
- Fix typos: \\fancyhe or \\cfoot to \\fancyhead or \\fancyfoot[C], \\newtcbenvironment to \\newtcolorbox.
- Use \\usepackage[most]{tcolorbox} for breakable option.
- Ensure tcolorbox uses coltitle for title color.
- Remove non-standard packages (e.g., fontenc).
- Add \\setlist[itemize]{noitemsep,topsep=0pt} and \\setlist[enumerate]{noitemsep,topsep=0pt} if missing.
- Fix mismatched \\begin{}/\\end{}.
- Keep document structure.
- Return only the fixed LaTeX source.

LaTeX source:
${latex}`;
}






export { formatPrompt, formatAdjustmentPrompt, formatSubstitutionAmountPrompt, formatSubstitutionListPrompt, formatCookbookPrompt, formatLatexValidationPrompt };