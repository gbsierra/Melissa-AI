import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import IngredientModal from '../components/IngredientModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '../types/recipe';

const saveRecipe = async (recipe: Recipe) => {
  try {
    const existing = await AsyncStorage.getItem('savedRecipes');
    const recipes = existing ? JSON.parse(existing) : [];
    recipes.push(recipe);
    await AsyncStorage.setItem('savedRecipes', JSON.stringify(recipes));
    alert('Recipe saved!');
  } catch (err) {
    console.error('❌ Save failed:', err);
    alert('Error saving recipe.');
  }
};

export default function RecipeScreen() {
  const params = useLocalSearchParams();
  const safeText = typeof params.text === 'string' ? params.text : params.text?.[0] ?? '';
  const safePhoto = typeof params.photo === 'string' ? params.photo : params.photo?.[0] ?? '';
  const safeDishName = typeof params.dishName === 'string' ? params.dishName : params.dishName?.[0] ?? '';
  const safeServings =
  typeof params.servings === 'string'
    ? parseInt(params.servings.trim())
    : Array.isArray(params.servings) && typeof params.servings[0] === 'string'
    ? parseInt(params.servings[0].trim())
    : typeof params.servings === 'number'
    ? params.servings
    : undefined;
  const safeIngredients = typeof params.ingredients === 'string' ? params.ingredients : params.ingredients?.[0] ?? '[]';
  const safeInstructions = typeof params.instructions === 'string' ? params.instructions : params.instructions?.[0] ?? '[]';

  const [adjustText, setAdjustText] = useState('');
  const [secondPhoto, setSecondPhoto] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<{ name: string; amount: string } | null>(null);

  const parsedIngredients = (() => {
    try {
      const parsed = JSON.parse(safeIngredients);
      if (Array.isArray(parsed)) {
        if (parsed.every(i => typeof i === 'string')) {
          return [{ group: 'Ingredients', items: parsed }];
        } else if (parsed.every(i => Array.isArray(i.items))) {
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  })();

  const parsedInstructions = Array.isArray(safeInstructions)
    ? safeInstructions
    : (() => {
        try {
          const parsed = JSON.parse(safeInstructions);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();

  const handlePickSecondImage = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setSecondPhoto(result.assets[0].uri);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>🧠 AI-Generated Recipe</Text>

        {safePhoto && (
          <View style={styles.photoWrapper}>
            <Image source={{ uri: safePhoto }} style={styles.image} />
            <Text style={styles.photoLabel}>🖼 Original Ingredient Photo</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.title}>📝 Your Prompt</Text>
          <Text style={styles.content}>{safeText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>🍽 Suggested Dish</Text>
          <Text style={styles.content}>{safeDishName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>🔢 Servings</Text>
          <Text style={styles.content}>
            <Text style={styles.content}>{safeServings}</Text>
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>🧺 Ingredients (tap to adjust)</Text>
          {Array.isArray(parsedIngredients) && parsedIngredients.length > 0 ? (
            parsedIngredients.map((group, index) => {
              const items = Array.isArray(group.items)
                ? group.items
                : typeof group === 'string'
                ? [group]
                : Array.isArray(group)
                ? group
                : [];

              return (
                <View key={index} style={{ marginBottom: 10 }}>
                  <Text style={styles.ingredientGroup}>
                    {group.group ?? `Group ${index + 1}`}
                  </Text>
                  {items.map((item: any, i: number) => {
                    const label =
                      typeof item === 'string'
                        ? item
                        : item?.item
                        ? `${item.item}${item.amount ? `: ${item.amount}` : ''}`
                        : item?.name
                        ? `${item.name}${item.amount ? `: ${item.amount}` : ''}`
                        : 'Unnamed ingredient';

                    return (
                      <TouchableOpacity
                        key={i}
                        style={styles.ingredientPill}
                        onPress={() => {
                          const name = typeof item === 'object' && item.name ? item.name : label;
                          const amount = typeof item === 'object' && item.amount ? item.amount : '';
                          setSelectedIngredient({ name, amount });
                          setModalVisible(true);
                        }}
                      >
                        <Text style={styles.ingredientText}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })
          ) : (
            <Text style={styles.content}>No ingredients available.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>📖 Instructions</Text>
          {Array.isArray(parsedInstructions) && parsedInstructions.length > 0 ? (
            parsedInstructions.map((step: any, index: number) => {
              const isString = typeof step === 'string';
              const text = isString
                ? step
                : step?.instruction || step?.description || 'No instruction provided';

              return (
                <Text key={index} style={styles.content}>
                  {index + 1}. {text}
                </Text>
              );
            })
          ) : (
            <Text style={styles.content}>No instructions available.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>🔧 Adjust Recipe</Text>
          <TextInput
            style={styles.input}
            placeholder="Ask to remove an ingredient or change something..."
            value={adjustText}
            onChangeText={setAdjustText}
          />
          <TouchableOpacity style={styles.photoButton} onPress={handlePickSecondImage}>
            <Text style={styles.photoText}>📸 Send Another Ingredient Photo</Text>
          </TouchableOpacity>
          {secondPhoto && <Image source={{ uri: secondPhoto }} style={styles.imageSmall} />}
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() =>
              saveRecipe({
                dishName: safeDishName,
                servings: safeServings,
                ingredients: parsedIngredients,
                instructions: parsedInstructions,
                prompt: safeText,
                photo: safePhoto,
              })
            }
          >
            <Text style={styles.saveText}>💾 Save Recipe</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
            <Text style={styles.backText}>🏠 Return Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {selectedIngredient && (
        <IngredientModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          ingredient={selectedIngredient}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9F5' },
  container: { padding: 20 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 20, color: '#FF6347' },

  photoWrapper: { alignItems: 'center', marginBottom: 10 },
  image: { width: 120, height: 120, borderRadius: 10 },
  imageSmall: { width: 100, height: 100, borderRadius: 10, marginTop: 10 },
  photoLabel: { fontSize: 12, marginTop: 5, color: '#555' },

  section: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8, color: '#444' },
  content: { fontSize: 15, color: '#333', marginBottom: 6 },

  ingredientGroup: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
  },
  ingredientPill: {
    backgroundColor: '#FFEBE5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginVertical: 4,
  },
  ingredientText: {
    color: '#FF6347',
    fontSize: 14,
    fontWeight: '500',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginTop: 10,
    color: '#333',
  },
  photoButton: {
    marginTop: 10,
    backgroundColor: '#FFEBE5',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoText: {
    color: '#FF6347',
    fontSize: 15,
    fontWeight: '500',
  },

  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  saveButton: {
    backgroundColor: '#FFEBE5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveText: {
    color: '#FF6347',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6347',
  },
  backText: {
    color: '#FF6347',
    fontSize: 16,
    fontWeight: '600',
  },
});