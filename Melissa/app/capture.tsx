import { useState } from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function CaptureScreen() {
  const [photo, setPhoto] = useState<string | null>(null);
  const router = useRouter();

  const handleCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📷 Snap an ingredient</Text>
      <Button title="Open Camera" onPress={handleCamera} />
      {photo && (
        <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
      )}
      <Button
        title="Generate Recipe"
        disabled={!photo}
        onPress={() => router.push({ pathname: '/recipe', params: { photo } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 18, marginBottom: 10 },
  image: { width: '100%', height: 300, marginVertical: 20, borderRadius: 8 },
});