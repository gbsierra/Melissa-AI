import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Button,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Mic from '../components/Mic';

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [servings, setServings] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryCooldown, setRetryCooldown] = useState<number | null>(null);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [micVisible, setMicVisible] = useState(false);

  useEffect(() => {
    const loadSavedRecipes = async () => {
      try {
        const stored = await AsyncStorage.getItem('savedRecipes');
        const parsed: Recipe[] = stored ? JSON.parse(stored) : [];
        setSavedRecipes(parsed);
      } catch (err) {
        console.error('❌ Failed to load saved recipes:', err);
      }
    };
    loadSavedRecipes();
  }, []);

  useEffect(() => {
    if (retryCooldown === null) return;
    const timer = setInterval(() => {
      setRetryCooldown(prev => {
        if (prev && prev > 1) return prev - 1;
        setQuotaMessage(null);
        return null;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [retryCooldown]);

  const handleGenerate = async () => {
    if (retryCooldown) return;

    setLoading(true);
    try {
      const formData = new FormData();

      // Append basic fields
      formData.append('query', query);
      formData.append('servings', servings.toString());

      // Safely determine mode and guarantee it’s a string
      const mode = determineMode(query, photoUris.length > 0 ? 'has-images' : '');
      formData.append('mode', mode);

      // Append image files (0–2 supported)
      photoUris
        .filter(uri => typeof uri === 'string' && uri.startsWith('file://'))
        .forEach((uri, index) => {
          formData.append(`image${index + 1}`, {
            uri,
            type: 'image/jpeg',
            name: `ingredient_${index + 1}.jpg`,
          } as unknown as Blob); // 👈 TypeScript fix for React Native FormData
        });

      // Send to backend
      const response = await fetch('http://10.0.0.23:3001/api/recipes/generate-recipe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        const match = text.match(/retryDelay"\s*:\s*"(\d+)s"/);
        if (match) {
          const seconds = parseInt(match[1]);
          const minutes = Math.ceil(seconds / 60);
          setRetryCooldown(seconds);
          const message =
            seconds < 60
              ? `⚠️ Melissa is busy. Please wait ${seconds} seconds.`
              : `⚠️ Melissa is busy. Please wait about ${minutes} minutes.`;
          setQuotaMessage(message);
          return;
        }

        if (text.toLowerCase().includes('quota')) {
          setRetryCooldown(60);
          setQuotaMessage('⚠️ Gemini quota exceeded. Please wait a minute.');
          return;
        }

        throw new Error(`Gemini failed: ${text}`);
      }

      // Handle recipe response
      const recipe = await response.json();
      router.push({
        pathname: '/recipe',
        params: {
          dishName: recipe.title,
          ingredients: JSON.stringify(recipe.ingredients),
          instructions: JSON.stringify(recipe.steps),
          servings,
          text: query,
          photos: JSON.stringify(photoUris),
        },
      });
    } catch (error) {
      console.error('Error in handleGenerate:', error);
    } finally {
      setLoading(false);
    }
  };

function determineMode(text: string, imageFlag: string): 'fusion' | 'image-only' | 'text-only' {
  if (text && imageFlag) return 'fusion';
  if (imageFlag) return 'image-only';
  if (text) return 'text-only';
  return 'text-only';
}

  const handlePickImage = async () => {
    if (photoUris.length >= 2) {
      alert('Maximum of 2 photos allowed.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setPhotoUris(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleDeletePhoto = (index: number) => {
    setPhotoUris(prev => prev.filter((_, i) => i !== index));
  };

  // Callback when Mic finishes and returns transcript
  const onMicTranscript = (text: string) => {
    setMicVisible(false);
    if (text && text.trim() !== '') {
      setQuery(text);
    }
  };

  const isDisabled = (!query && photoUris.length === 0) || loading || !!retryCooldown;
  const buttonStyle = [styles.button, isDisabled ? { opacity: 0.5 } : null];

  type Recipe = {
    dishName?: string;
    ingredients?: string[];
    instructions?: string[];
    servings?: number;
    prompt?: string | null;
    photo?: string | null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.logo}>👨‍🍳 Melissa</Text>
          <Text style={styles.subtitle}>Your AI Kitchen Companion</Text>
        </View>

        {/* Input Section */}
        <View style={styles.inputCard}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Dish, genre, or ingredients..."
              value={query}
              onChangeText={(text) => {
                if (text === 'Spoken transcript from mic') return;
                setQuery(text);
              }}
              placeholderTextColor="#aaa"
            />
            {/* Mic button triggers modal */}
            <TouchableOpacity
              style={styles.micButton}
              onPress={() => setMicVisible(true)}
            >
              <FontAwesome name="microphone" size={20} color="#FF6347" />
            </TouchableOpacity>
          </View>

          <View style={styles.servingsWrapper}>
            <TextInput
              style={styles.servingsInput}
              placeholder="How many servings?"
              value={servings}
              onChangeText={setServings}
              keyboardType="numeric"
              placeholderTextColor="#aaa"
            />
          </View>
        </View>

        {/* Photo Upload Button */}
        <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
          <Text style={styles.photoText}>📸 Add Ingredient Image</Text>
        </TouchableOpacity>

        {/* Display photos with delete button */}
        {photoUris.length > 0 && (
          <View style={styles.photoContainer}>
            {photoUris.map((uri, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri }} style={styles.photoThumbnail} />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(index)}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Generate Button */}
        <Pressable
          style={buttonStyle}
          disabled={isDisabled}
          onPress={handleGenerate}
        >
          <Text style={styles.buttonText}>🍳 Generate Recipe</Text>
        </Pressable>

        {/* Loading Spinner */}
        {loading && (
          <View style={styles.spinnerWrapper}>
            <ActivityIndicator size="large" color="#FF6347" />
            <Text style={styles.spinnerText}>Generating your recipe...</Text>
          </View>
        )}
        {/* Retry/Quota Cooldown Message */}
        {quotaMessage && (
          <Text style={styles.busyMessage}>{quotaMessage}</Text>
        )}

        {/* Saved Recipes */}
        {savedRecipes.length > 0 && (
          <View style={{ marginTop: 30 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
              📁 Saved Recipes
            </Text>

            {savedRecipes.map((recipe: Recipe, index: number) => (
              <TouchableOpacity
                key={index}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  backgroundColor: '#fff',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#eee',
                }}
                onPress={() =>
                  router.push({
                    pathname: '/recipe',
                    params: {
                      dishName: recipe.dishName ?? '',
                      ingredients: JSON.stringify(recipe.ingredients ?? []),
                      instructions: JSON.stringify(recipe.instructions ?? []),
                      servings: String(recipe.servings ?? ''),
                      text: recipe.prompt ?? '',
                      photo: recipe.photo ?? '',
                    },
                  })
                }
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FF6347' }}>
                  {recipe.dishName || 'Untitled Dish'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Mic Modal */}
        <Modal visible={micVisible} animationType="slide" transparent={false}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Mic onTranscript={onMicTranscript} />
            <Button title="Cancel" onPress={() => setMicVisible(false)} />
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9F5' },
  container: { flex: 1, padding: 24 },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF6347',
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginTop: 6,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#222',
  },
  micButton: {
    marginLeft: 8,
  },
  servingsWrapper: {
    marginTop: 12,
  },
  servingsInput: {
    fontSize: 16,
    color: '#222',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  photoButton: {
    backgroundColor: '#FFEBE5',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  photoText: {
    color: '#FF6347',
    fontWeight: '500',
    fontSize: 16,
  },
  photoContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  photoThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF6347',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#FF6347',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  spinnerWrapper: { marginTop: 20, alignItems: 'center' },
  spinnerText: { marginTop: 10, fontSize: 16, color: '#555' },
  busyMessage: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 15,
    color: '#FF6347',
    fontStyle: 'italic',
  },
});