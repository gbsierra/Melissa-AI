import { useEffect, useState } from 'react';
import { Ingredient, IngredientGroup } from '../types/ingredients';
import IngredientModal from './IngredientModal';
import { useSuggestAmountForSwap } from '../hooks/useSuggestAmountForSwap';

export type Props = {
  selectedIngredient: Ingredient | null;
  parsedIngredients: IngredientGroup[];
  setParsedIngredients: (updated: IngredientGroup[]) => void;
  onClose: () => void;
  loading: boolean;
  setLoading: (val: boolean) => void;
};

export const SuggestedSubstitutes = ({
  selectedIngredient,
  parsedIngredients,
  setParsedIngredients,
  onClose,
  loading,
  setLoading,
}: Props) => {
  const { suggestAmount } = useSuggestAmountForSwap(setLoading);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!selectedIngredient?.name) return;

      setLoading(true);
      try {
        const response = await fetch(
          `http://10.0.0.23:3001/api/ingredient/suggest/${encodeURIComponent(selectedIngredient.name)}`
        );

        const data = await response.json();
        const list = data.substitutes?.length ? data.substitutes : ['No alternatives available'];
        setSuggestions(list);
      } catch (err) {
        console.warn('❌ Failed to fetch substitutes:', err);
        setSuggestions(['No alternatives available']);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [selectedIngredient]);

  const handleSwap = async (originalName: string, substituteName: string) => {
    const { adjustedAmount } = await suggestAmount(originalName, substituteName);

    const updated = parsedIngredients.map(group => {
      const updatedItems = Array.isArray(group.items)
        ? group.items.map(item => {
            const name = typeof item === 'object' ? item.name ?? item.item : item;

            if (name === originalName) {
              const newName = adjustedAmount;
              return typeof item === 'string'
                ? newName
                : { ...item, name: newName, amount: undefined };
            }

            return item;
          })
        : [];

      return { ...group, items: updatedItems };
    });

    setParsedIngredients(updated);
    onClose();
  };

  return selectedIngredient ? (
    <IngredientModal
      visible={true}
      onClose={onClose}
      ingredient={selectedIngredient}
      onSwap={handleSwap}
      loading={loading}
      suggestions={suggestions} // Optional: if IngredientModal shows them
    />
  ) : null;
};