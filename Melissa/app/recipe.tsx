import { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { SuggestedSubstitutes } from '../components/SuggestedSubstitutes';

import { Recipe } from '../types/recipe';
import type { IngredientItem, IngredientGroup } from '../types/ingredients';

import { MAX_PHOTOS } from '../constants/constants';

import { LoadingOverlay } from '../components/LoadingOverlay';
import Mic from '../components/MicModal';
import { useIngredientSuggestions } from '../hooks/useIngredientSuggestions';



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

  // Retrieve and parsing recipe from LocalSearchParams
  const params = useLocalSearchParams();
  const recipeText = typeof params.text === 'string' ? params.text : params.text?.[0] ?? '';
  //const safePhoto = typeof params.photos === 'string' ? params.photos : params.photos?.[0] ?? '';
  const recipeDishName = typeof params.dishName === 'string' ? params.dishName : params.dishName?.[0] ?? '';
  const recipeServings =
  typeof params.servings === 'string'
    ? parseInt(params.servings.trim())
    : Array.isArray(params.servings) && typeof params.servings[0] === 'string'
    ? parseInt(params.servings[0].trim())
    : typeof params.servings === 'number'
    ? params.servings
    : undefined;
  const safeIngredients = typeof params.ingredients === 'string' ? params.ingredients : params.ingredients?.[0] ?? '[]';
  const safeInstructions = typeof params.instructions === 'string' ? params.instructions : params.instructions?.[0] ?? '[]';
  const [parsedIngredients, setParsedIngredients] = useState<IngredientGroup[]>(() => {
    try {
      const parsed = JSON.parse(safeIngredients);
      if (Array.isArray(parsed)) {
        if (parsed.every(i => typeof i === 'string')) {
          return [{ group: 'Ingredients', items: parsed }];
        } else if (parsed.every(i => Array.isArray(i.items))) {
          return parsed as IngredientGroup[];
        }
      }
      return [];
    } catch {
      return [];
    }
  });
  const [parsedInstructions, setParsedInstructions] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(safeInstructions);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  //
  const [adjustText, setAdjustText] = useState('');
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<{ name: string; amount: string } | null>(null);
  const [loading, setLoading] = useState(false); // loading?
  const [micVisible, setMicVisible] = useState(false); // mic modal visable?
  const [retryCooldown, setRetryCooldown] = useState<number | null>(null);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);
  

  const handlePickAdditionalPhoto = async () => {
    if (additionalPhotos.length >= MAX_PHOTOS) {
      alert(`You can only add up to ${MAX_PHOTOS} ingredient photos.`);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setAdditionalPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleAdjustRecipe = async () => {
    if (!adjustText && (!additionalPhotos || additionalPhotos.length === 0)) {
      alert('Please enter a prompt or add one or more photos to adjust the recipe.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      formData.append('dishName', recipeDishName);
      formData.append('servings', String(recipeServings));
      formData.append('ingredients', JSON.stringify(parsedIngredients));
      formData.append('instructions', JSON.stringify(parsedInstructions));
      formData.append('adjustmentPrompt', adjustText);

      // Append each photo
      additionalPhotos?.forEach((photoUri, index) => {
        const fileName = photoUri.split('/').pop() ?? `ingredient-${index + 1}.jpg`;
        formData.append('photos', {
          uri: photoUri,
          name: fileName,
          type: 'image/jpeg',
        } as any);
      });

      const response = await fetch('http://10.0.0.23:3001/api/recipes/adjust-recipe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.ingredients) setParsedIngredients(data.ingredients);
      if (data.instructions) setParsedInstructions(data.instructions);

      setAdjustText('');
      setAdditionalPhotos([]); // Clear array
      setLoading(false);
    } catch (err) {
      console.error('🔧 Recipe adjustment failed:', err);
      alert('Unable to adjust recipe at this time.');
    }
  };

  const removePhoto = (index: number) => {
    setAdditionalPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Func for when Mic finishes and returns transcript
  const onMicTranscript = (text: string) => {
    setMicVisible(false); // hides mic modal
    if (text && text.trim() !== '') {
      setAdjustText(text); // update query with spoken input
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      
      <ScrollView style={styles.container}>
        
        {/* Recipe Header*/}
        <View style={styles.recipeCard}>
          
          <Text style={styles.dishTitle}>{recipeDishName}</Text>
          {/*<Text style={styles.detailLine}>Servings: {recipeServings}</Text>*/}

          <View style={styles.aiTagContainer}>
            <Text style={styles.subtleNote}>-Melissa AI-generated recipe</Text>
          </View>
          {/*<Text style={styles.recipeBody}>{recipeText}</Text>*/}

          {/* Loading Spinner & Overlay*/}
          <LoadingOverlay visible={loading} />

        </View>

        {/* Ingredients */}
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

          {/* Loading Spinner & Overlay*/}
          <LoadingOverlay visible={loading} />

        </View>

        {/* Instructions */}
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

          {/* Loading Spinner & Overlay*/}
          <LoadingOverlay visible={loading} />

        </View>
        
        {/* Adjust Recipe */}
        <View style={styles.section}>
          <Text style={styles.title}>🔧 Adjust Recipe</Text>
          
          {/* Input */}
          <View style={styles.inputWrapper}>
            
            {/* Text Input */}
            <TextInput
              style={styles.input}
              placeholder="Ask Melissa for recipe adjustment..."
              value={adjustText}
              onChangeText={(text) => {
                if (text === 'Spoken transcript from mic') return;
                setAdjustText(text);
              }}
              placeholderTextColor="#aaa"
            />
            
            {/* Microphone button */}
            <TouchableOpacity
              style={styles.micButton}
              onPress={() => setMicVisible(true)}
            >
              <FontAwesome name="microphone" size={20} color="#FF6347" />
            </TouchableOpacity>

          </View>

          {/* Add Ingredient Photo Button*/}
          <TouchableOpacity style={styles.photoButton} onPress={handlePickAdditionalPhoto}>
            <Text style={styles.photoText}>📸 Add Ingredient Requirement</Text>
          </TouchableOpacity>

          {/* Additional Photos taken */}
          {additionalPhotos.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}
            >
              {additionalPhotos.map((uri, index) => (
                <View key={uri} style={styles.photoWrapper}>
                  <Image source={{ uri }} style={styles.photoThumbnail} />
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Apply Adjustments Button*/}
          <TouchableOpacity
            style={[styles.adjustButton, !(adjustText || additionalPhotos) && styles.disabled]}
            onPress={handleAdjustRecipe}
          >
            <Text style={styles.adjustText}>🔧 Apply Adjustments</Text>
          </TouchableOpacity>

          {/* Loading Spinner & Overlay*/}
          <LoadingOverlay visible={loading} />

        </View>
        
        {/* Footer Buttons */}
        <View style={styles.footerActions}>
          {/* Save Recipe */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() =>
              saveRecipe({
                dishName: recipeDishName,
                servings: recipeServings,
                ingredients: parsedIngredients,
                instructions: parsedInstructions,
                prompt: recipeText,
                //photo: safePhotos,
              })
            }
          >
            <Text style={styles.saveText}>💾 Save Recipe</Text>
          </TouchableOpacity>

          {/* Return Home */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
            <Text style={styles.backText}>🏠 Return Home</Text>
          </TouchableOpacity>

          {/* Loading Spinner & Overlay*/}
          <LoadingOverlay visible={loading} />
        </View>

      </ScrollView>
      
      {/* Suggested Substitutes Modal */}
      {selectedIngredient && (
        <SuggestedSubstitutes
          selectedIngredient={selectedIngredient}
          parsedIngredients={parsedIngredients}
          setParsedIngredients={setParsedIngredients}
          onClose={() => setSelectedIngredient(null)}
          loading={loading}
          setLoading={setLoading}
        />
      )}

      {/* Mic Modal */}
      <Modal visible={micVisible} animationType="slide" transparent={false}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Mic
            onTranscript={onMicTranscript}
            onCancel={() => setMicVisible(false)}
          />
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safe: { 
    flex: 1, 
    backgroundColor: '#FFF9F5'
  },
  container: { 
    padding: 20 
  },
  header: { 
    fontSize: 24, 
    fontWeight: '700', 
    marginBottom: 20, 
    color: '#FF6347' 
  },
  photoWrapper: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  image: { 
    width: 120, 
    height: 120, 
    borderRadius: 10 
  },
  imageSmall: { 
  width: 100, 
    height: 100, 
    borderRadius: 10, 
    marginTop: 10 
  },
  photoLabel: { 
    fontSize: 12, 
    marginTop: 5, 
    color: '#555' 
  },
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
  title: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 5, 
    color: '#444' 
  },
  content: { 
    fontSize: 15, 
    color: '#333', 
    marginBottom: 6 
  },
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
    padding: 4,
    fontSize: 15,
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
    marginBottom: 20
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
  adjustButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  adjustText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
    photoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 12,
    justifyContent: 'flex-start',
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#f44',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    gap: 3,
    paddingVertical: 11
  },
  dishTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtleNote: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  detailLine: {
    fontSize: 14,
    marginBottom: 10,
  },
  recipeBody: {
    fontSize: 16,
    lineHeight: 22,
  },
  aiTagContainer: {
    position: 'absolute',
    bottom: 8,
    right: 12,
  },
  recipeCard: {
    padding: 18,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
    margin: 11,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 99, 71, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  spinnerText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  micButton: {
    alignSelf: 'flex-end',
    marginLeft: 5
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 5,
    justifyContent: 'space-between'
  }
});