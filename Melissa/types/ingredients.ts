// Represents a single ingredient, either as a plain string (e.g. "salt")
// or as a richer object with optional name, item alias, and amount (e.g. { name: "ground cinnamon", amount: "½ tsp" })
export type IngredientItem =
  | string
  | {
      name?: string;     // Display name for the ingredient (e.g. "ground cinnamon")
      item?: string;     // Alternate alias used in backend or parsing logic
      amount?: string;   // Optional quantity associated with the ingredient
    };

// Groups related ingredients under a named category (e.g. "Dry Ingredients")
export type IngredientGroup = {
  group: string;             // Label for the group (e.g. "Spices", "Wet Ingredients")
  items: IngredientItem[];   // List of ingredients, either strings or objects
};

// Standardized ingredient object used in UI components like IngredientModal,
// always has a name, and optionally has an amount
export type Ingredient = {
  name: string;              // Display name (guaranteed to exist)
  amount?: string;           // Optional quantity (e.g. "1 tbsp")
};