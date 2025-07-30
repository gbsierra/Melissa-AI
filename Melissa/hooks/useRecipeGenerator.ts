import { useCallback } from 'react';
import { router } from 'expo-router';
import { Recipe } from '../types/recipe';

export const useRecipeGenerator = (
  query: string,
  servings: number | null,
  difficulty: string,
  cookware: string,
  photoUris: string[],
  setRetryCooldown: React.Dispatch<React.SetStateAction<number | null>>,
  setQuotaMessage: (msg: string | null) => void,
  setLoading: (val: boolean) => void
) => {
  // Helper func - Determines mode based on user input and image presence
  const determineMode = (text: string, imageFlag: string): 'fusion' | 'image-only' | 'text-only' => {
    if (text && imageFlag) return 'fusion';
    if (imageFlag) return 'image-only';
    if (text) return 'text-only';
    return 'text-only';
  };

  // Trigger recipe generation
  const handleGenerate = useCallback(async () => {
    setLoading(true);

    try {
      // create formData with necessary fields
      const formData = new FormData();
      formData.append('query', query);                                                        // query - text or voice input
      formData.append('servings', servings !== null ? servings.toString() : 'not provided');  // servings
      formData.append('difficulty', difficulty);                                              // difficulty
      formData.append('cookware', cookware);                                                  // cookware
      const mode = determineMode(query, photoUris.length > 0 ? 'has-images' : '');             
      formData.append('mode', mode);                                                          // mode
      photoUris                                                                               // photos
        .filter(uri => uri.startsWith('file://'))
        .forEach((uri, index) => {
          formData.append('photos', {
            uri,
            type: 'image/jpeg',
            name: `ingredient_${index + 1}.jpg`,
          } as unknown as Blob);
        });
      
      // fetch backend endpoint to generate recipe
      const response = await fetch('http://10.0.0.23:3001/api/recipes/generate-recipe', {
        method: 'POST',
        body: formData, //passing to be serialized into req.body and req.files
      });

      if (!response.ok) {
        const text = await response.text();

        // Handle Gemini busy delay
        const match = text.match(/retryDelay"\s*:\s*"(\d+)s"/);
        if (match) {
          const seconds = parseInt(match[1]);
          setRetryCooldown(seconds);
          setQuotaMessage(
            seconds < 60
              ? `⚠️ Melissa is busy. Please wait ${seconds} seconds.`
              : `⚠️ Melissa is busy. Please wait about ${Math.ceil(seconds / 60)} minutes.`
          );
          return;
        }

        // Handle quota limit
        if (text.toLowerCase().includes('quota')) {
          setRetryCooldown(60);
          setQuotaMessage('⚠️ Gemini quota exceeded. Please wait a minute.');
          return;
        }

        throw new Error(`Gemini failed: ${text}`);
      }

      const recipe: Recipe = await response.json();

      router.push({
        pathname: '/recipe',
        params: {
            dishName: recipe.dishName, // ✅ was recipe.title
            ingredients: JSON.stringify(recipe.ingredients),
            instructions: JSON.stringify(recipe.instructions),
            servings,
            text: query,
            difficulty,
            cookware,
            photos: JSON.stringify(photoUris),
        },
        });
    } catch (err) {
      console.error('❌ handleGenerate failed:', err);
    } finally {
      setLoading(false);
    }
  }, [query, servings, difficulty, cookware, photoUris]);

  return { handleGenerate };
};