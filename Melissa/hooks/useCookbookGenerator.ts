import { useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import type { Recipe } from '../types/recipe';

export function useCookbookGenerator() {
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateCookbook = async (recipes: Recipe[]) => {
    setLoading(true);
    try {
      const res = await fetch('http://10.0.0.23:3001/api/cookbook/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipes }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ HTTP ${res.status}: ${errorText}`);
        Alert.alert('Error', `Cookbook generation failed: ${res.status}`);
        return null;
      }

      const { base64pdf } = await res.json();
      if (!base64pdf) {
        Alert.alert('Error', 'Missing PDF content from server.');
        return null;
      }

      const fileUri = `${FileSystem.cacheDirectory}cookbook.pdf`;
      await FileSystem.writeAsStringAsync(fileUri, base64pdf, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setPdfUri(fileUri);
      return fileUri;
    } catch (err) {
      console.error('❌ Cookbook generation failed:', err);
      Alert.alert('Error', 'Failed to generate cookbook.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    pdfUri,
    loading,
    generateCookbook,
  };
}
