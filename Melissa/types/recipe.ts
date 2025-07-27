
export type Recipe = {
  dishName?: string;
  ingredients?: string[];
  instructions?: string[];
  servings?: number;
  prompt?: string | null;
  photo?: string | null;
};