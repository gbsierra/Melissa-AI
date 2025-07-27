import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '../types/recipe';

export const useSavedRecipes = () => {
      const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
    
  const loadSavedRecipes = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('savedRecipes');
      const parsed: Recipe[] = stored ? JSON.parse(stored) : [];
      setSavedRecipes(parsed);
    } catch (err) {
      console.error('❌ Failed to load saved recipes:', err);
    }
  }, [setSavedRecipes]);

  const deleteRecipe = useCallback(async (indexToDelete: number) => {
    try {
      const existing = await AsyncStorage.getItem('savedRecipes');
      const recipes = existing ? JSON.parse(existing) : [];
      const updated = recipes.filter((_: unknown, index: number) => index !== indexToDelete);
      await AsyncStorage.setItem('savedRecipes', JSON.stringify(updated));
      setSavedRecipes(updated);
    } catch (err) {
      console.error('❌ Delete failed:', err);
      alert('Error deleting recipe.');
    }
  }, [setSavedRecipes]);

  return { savedRecipes, loadSavedRecipes, deleteRecipe };
};