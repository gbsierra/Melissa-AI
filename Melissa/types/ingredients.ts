export type IngredientItem = string | {
  name?: string;
  item?: string;
  amount?: string;
};

export type IngredientGroup = {
  group: string;
  items: IngredientItem[];
};