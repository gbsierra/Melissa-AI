import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';

export const usePhotoManager = (maxPhotos: number = 2) => {
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pickCameraPhoto = useCallback(async () => {
    if (photoUris.length >= maxPhotos) {
      alert(`Maximum of ${maxPhotos} photos allowed.`);
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result.canceled && result.assets?.length) {
        setPhotoUris(prev => [...prev, result.assets[0].uri]);
      }
    } catch (err) {
      setError('Failed to capture photo');
      console.error('📷 Camera error:', err);
    }
  }, [photoUris, maxPhotos]);

  const pickGalleryPhoto = useCallback(async () => {
    if (photoUris.length >= maxPhotos) {
      alert(`Maximum of ${maxPhotos} photos allowed.`);
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      if (!result.canceled && result.assets?.length) {
        setPhotoUris(prev => [...prev, result.assets[0].uri]);
      }
    } catch (err) {
      setError('Failed to select photo');
      console.error('🖼 Gallery error:', err);
    }
  }, [photoUris, maxPhotos]);

  const removePhoto = useCallback((index: number) => {
    setPhotoUris(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearPhotos = useCallback(() => {
    setPhotoUris([]);
  }, []);

  return {
    photoUris,
    error,
    pickCameraPhoto,
    pickGalleryPhoto,
    removePhoto,
    clearPhotos,
  };
};