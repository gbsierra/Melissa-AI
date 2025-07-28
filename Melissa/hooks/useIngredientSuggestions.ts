import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useIngredientSuggestions = (ingredientName: string) => {
  const [subs, setSubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true); // 👈 new

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!ingredientName) return;

      setLoading(true);
      const key = `subs-${ingredientName}`;
      const cached = await AsyncStorage.getItem(key);

      if (cached) {
        setSubs(JSON.parse(cached));
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://10.0.0.23:3001/api/ingredient/suggest/${encodeURIComponent(ingredientName)}`);
        const json = await response.json();
        const result = json.substitutes?.length ? json.substitutes : ['No alternatives available'];
        setSubs(result);
        await AsyncStorage.setItem(key, JSON.stringify(result));
      } catch (err) {
        console.warn('❌ Failed to fetch substitutes:', err);
        setSubs(['No alternatives available']);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [ingredientName]);

  return { suggestions: subs, loading };
};