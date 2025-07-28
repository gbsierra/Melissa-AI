import type { IngredientGroup } from './ingredients';

export type Recipe = {
  dishName?: string;
  ingredients?: IngredientGroup[];
  instructions?: string[];
  servings?: number;
  prompt?: string | null;
  photo?: string | null;
};