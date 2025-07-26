import { View, Button, Image, Text, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function CameraSection({ setPhotoUri, photoUri }) {
  const openCamera = async () => {
    // Ask for camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Needed',
        'Melissa needs camera access to take ingredient photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  return (
    <View style={{ marginVertical: 20 }}>
      <Text style={{ fontSize: 16, marginBottom: 10 }}>📷 Ingredient Photo</Text>
      <Button title="Open Camera" onPress={openCamera} />
      {photoUri && (
        <Image
          source={{ uri: photoUri }}
          style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 8 }}
        />
      )}
    </View>
  );
}