import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [servings, setServings] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryCooldown, setRetryCooldown] = useState<number | null>(null);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);

  const [savedRecipes, setSavedRecipes] = useState([]);
  useEffect(() => {
    const loadSavedRecipes = async () => {
      try {
        const stored = await AsyncStorage.getItem('savedRecipes');
        const parsed = stored ? JSON.parse(stored) : [];
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
      const response = await fetch('http://10.0.0.23:3001/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          servings,
          photoUrl: photoUri ?? '',
          mode: determineMode(query, photoUri)
        }),
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

      const recipe = await response.json();
      router.push({
        pathname: '/recipe',
        params: {
          dishName: recipe.title,
          ingredients: JSON.stringify(recipe.ingredients),
          instructions: JSON.stringify(recipe.steps),
          servings,
          text: query,
          photo: photoUri ?? '',
        },
      });

    } catch (error) {
      console.error('Error in handleGenerate:', error);
    } finally {
      setLoading(false);
    }
  };

  function determineMode(text, imageUri) {
    if (text && imageUri) {
      return 'fusion';
    } else if (imageUri) {
      return 'image-only';
    } else if (text) {
      return 'text-only';
    } else {
      return null;
    }
  }

  const handlePickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const isDisabled = (!query && !photoUri) || loading || !!retryCooldown;
  const buttonStyle = [styles.button, isDisabled ? { opacity: 0.5 } : null];

  return (
  <SafeAreaView style={styles.safe}>
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>👨‍🍳 Melissa</Text>
        <Text style={styles.subtitle}>Your AI Kitchen Companion</Text>
      </View>

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
          <TouchableOpacity
            style={styles.micButton}
            onPress={() => setQuery('Spoken transcript from mic')}
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

      <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
        <Text style={styles.photoText}>📸 Add Ingredient Image</Text>
      </TouchableOpacity>

      {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}

      <Pressable
        style={buttonStyle}
        disabled={isDisabled}
        onPress={handleGenerate}
      >
        <Text style={styles.buttonText}>🍳 Generate Recipe</Text>
      </Pressable>

      {loading && (
        <View style={styles.spinnerWrapper}>
          <ActivityIndicator size="large" color="#FF6347" />
          <Text style={styles.spinnerText}>Generating your recipe...</Text>
        </View>
      )}

      {quotaMessage && (
        <Text style={styles.busyMessage}>{quotaMessage}</Text>
      )}

      {/* ✅ Inject Saved Recipes Section */}
      {savedRecipes.length > 0 && (
        <View style={{ marginTop: 30 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            📁 Saved Recipes
          </Text>
          {savedRecipes.map((recipe, index) => (
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
                    dishName: recipe.dishName,
                    ingredients: JSON.stringify(recipe.ingredients),
                    instructions: JSON.stringify(recipe.instructions),
                    servings: recipe.servings,
                    text: recipe.prompt,
                    photo: recipe.photo,
                  },
                })
              }
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#FF6347' }}>
                {recipe.dishName || 'Untitled Dish'}
              </Text>
              {/*<Text style={{ fontSize: 14, color: '#555' }}>
                {recipe.servings} servings
              </Text>*/}
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  preview: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 20,
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