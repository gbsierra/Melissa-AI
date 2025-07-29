import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import Mic from '../components/MicModal';
import { HelloWave } from '../components/HelloWave';

import { useSavedRecipes } from '../hooks/useSavedRecipes';
import { useRetryCooldown } from '../hooks/useRetryCooldown';
import { useRecipeGenerator } from '../hooks/useRecipeGenerator';
import { usePhotoManager } from '../hooks/usePhotoManager';
import { MAX_PHOTOS } from '../constants/constants';

import { SavedRecipesList } from '../components/SavedRecipesList';
import { LoadingOverlay } from '../components/LoadingOverlay';


export default function HomeScreen() {
  const router = useRouter();

  // Recipe Generation user inputs
  const [query, setQuery] = useState('');
  const [servings, setServings] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [cookware, setCookware] = useState('');

  const [loading, setLoading] = useState(false); // loading?
  const [retryCooldown, setRetryCooldown] = useState<number | null>(null); 
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null); 
  const [micVisible, setMicVisible] = useState(false); // mic modal visable?

  const { savedRecipes, loadSavedRecipes, deleteRecipe } = useSavedRecipes();

  // Load recipes from AsyncStorage on page enter
  useEffect(() => {
    loadSavedRecipes();
  }, []);

  // Starts cooldown timer if 'retryCooldown' is active
  useRetryCooldown(retryCooldown, setRetryCooldown, setQuotaMessage);
  
  // Manages photo selection and deletion
  const {
    photoUris,
    pickCameraPhoto,
    removePhoto,
  } = usePhotoManager(MAX_PHOTOS); // 2 is max photo limit

  // Generates recipe based on user input 
  const { handleGenerate } = useRecipeGenerator(
    query,
    servings === '' ? null : parseInt(servings, 10),
    difficulty,
    cookware,
    photoUris,
    setRetryCooldown,
    setQuotaMessage,
    setLoading
  );

  // Func for when Mic finishes and returns transcript
  const onMicTranscript = (text: string) => {
    setMicVisible(false); // hides mic modal
    if (text && text.trim() !== '') {
      setQuery(text); // update query with spoken input
    }
  };

  const isDisabled = (!query && photoUris.length === 0) || loading || !!retryCooldown;
  const buttonStyle = [styles.button, isDisabled ? { opacity: 0.5 } : null];

 return (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <SafeAreaView style={styles.safe}>
        <HelloWave />

        {/* Hero Section */}
        <View style={styles.hero}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logo}
          />
          <Text style={styles.subtitle}>Your AI Kitchen Companion</Text>
        </View>

        {/* Input Section */}
        <View style={styles.inputCard}>
          {/* Top Input Row */}
          <View style={styles.inputWrapper}>
            {/* Text Input */}
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
            {/* Microphone button */}
            <TouchableOpacity
              style={styles.micButton}
              onPress={() => setMicVisible(true)}
            >
              <FontAwesome name="microphone" size={20} color="#FF6347" />
            </TouchableOpacity>
          </View>

          {/* Servings & Difficulty Row */}
          <View style={styles.sideBySideRow}>
            <View style={styles.halfInput}>
              <TextInput
                style={styles.servingsInput}
                placeholder="Servings?"
                value={servings}
                onChangeText={setServings}
                keyboardType="numeric"
                placeholderTextColor="#aaa"
              />
            </View>
            <View style={styles.halfInput}>
              <TextInput
                style={styles.input}
                placeholder="Difficulty (e.g. easy)"
                value={difficulty}
                onChangeText={setDifficulty}
                placeholderTextColor="#aaa"
              />
            </View>
          </View>

          {/* Cookware Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Specified cookware (e.g. pan, wok, grill...)"
              value={cookware}
              onChangeText={setCookware}
              placeholderTextColor="#aaa"
            />
          </View>

          {/* Photo Upload Button */}
          <TouchableOpacity style={styles.photoButton} onPress={pickCameraPhoto}>
            <Text style={styles.photoText}>📸 Add Ingredient Requirement</Text>
          </TouchableOpacity>

          {/* Loading Spinner & Overlay */}
          <LoadingOverlay visible={loading} text="Generating your recipe..." />

        </View>

        {/* Display Ingredient Photos */}
        {photoUris.length > 0 && (
          <View style={styles.photoContainer}>
            {photoUris.map((uri, index) => (
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
          </View>
        )}

        {/* Generate Button with Haptic */}
        <Pressable
          style={buttonStyle}
          disabled={isDisabled}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            handleGenerate();
          }}
        >
          <Text style={styles.buttonText}>🍳 Generate Recipe</Text>
        </Pressable>

        {/* Retry/Quota Cooldown Message */}
        {quotaMessage && (
          <Text style={styles.busyMessage}>{quotaMessage}</Text>
        )}

        {/* Saved Recipes with Swipe & Animation */}
        <View style={{ maxHeight: 200, position: 'relative' }}>
          <SavedRecipesList savedRecipes={savedRecipes} deleteRecipe={deleteRecipe} />
        </View>

        {/* Footer */}
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: '#777', textAlign: 'center' }}>
            Melissa is your AI-powered kitchen companion, blending on-device voice, text, and images to spark culinary creativity.
          </Text>
          <Text style={{ fontSize: 12, color: '#aaa', marginTop: 10 }}>
            © {new Date().getFullYear()} Melissa App. All rights reserved.
          </Text>
        </View>

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
  </TouchableWithoutFeedback>
);
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    paddingHorizontal: 16,
    paddingVertical: -20,
    backgroundColor: '#FFF9F5' 
  },
  container: { 
    flex: 1,
    padding: 10
  },
  hero: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 250,
    height: 100,
    alignSelf: 'center',
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
    marginBottom: 12,
    alignSelf: 'stretch',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  inputOverlayWrapper: {
    position: 'relative',
    overflow: 'hidden',
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
  busyMessage: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 15,
    color: '#FF6347',
    fontStyle: 'italic',
  },
  sideBySideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  halfInput: {
    flex: 1,
    marginRight: 10,
  },
});