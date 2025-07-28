import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useIngredientSuggestions } from '../hooks/useIngredientSuggestions';

type Ingredient = {
  name: string;
  amount?: string;
};

type IngredientModalProps = {
  visible: boolean;
  onClose: () => void;
  ingredient: Ingredient;
  onSwap?: (originalName: string, substituteName: string) => void;
};

export default function IngredientModal({
  visible,
  onClose,
  ingredient,
  onSwap,
}: IngredientModalProps) {
  const { suggestions, loading } = useIngredientSuggestions(ingredient.name);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title}>🧂 {ingredient.name}</Text>
          <Text style={styles.sub}>Suggested Substitutes:</Text>

          {loading ? (
            <ActivityIndicator size="small" color="#888" style={{ marginVertical: 8 }} />
          ) : (
            suggestions.map((alt, i) => (
              <TouchableOpacity key={i} onPress={() => onSwap?.(ingredient.name, alt)}>
                <Text style={styles.alt}>🔄 {alt}</Text>
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>⬅ Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
  },
  modal: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  sub: {
    marginTop: 10,
    fontWeight: '600',
  },
  option: {
    marginVertical: 8,
    color: '#FF6347',
    fontWeight: '500',
  },
  alt: {
    marginVertical: 4,
    color: '#444',
  },
  close: {
    marginTop: 20,
    textAlign: 'center',
    color: '#888',
  },
});