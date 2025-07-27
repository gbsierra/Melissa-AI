import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

const configureAudioModeForSpeaker = async () => {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: 1,
    interruptionModeAndroid: 1,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
};

const recordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: 2,
    audioEncoder: 3,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.caf',
    audioQuality: 0,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

interface MicProps {
  onTranscript: (transcript: string) => void;
  onCancel: () => void; // lets modal control modal visibility
}

export default function Mic({ onTranscript, onCancel }: MicProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const wasCancelled = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (recording) {
        recording
          .stopAndUnloadAsync()
          .catch((err) => console.warn('Recording cleanup failed:', err));
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      await configureAudioModeForSpeaker();
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Speech.speak("I couldn't start recording. Mic permissions?");
        return;
      }
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording', error);
      Speech.speak("I couldn't start recording. Mic permissions?");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setLoading(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error('Recording URI is null');

      if (!wasCancelled.current) {
        const result = await sendToBackend(uri);
        onTranscript(result);
        await Speech.speak(`Got it. You said: ${result}`);
      }
    } catch (error) {
      if (!wasCancelled.current) {
        console.error('Stop failed:', error);
        await Speech.speak("Hmm... I couldn't catch that. Wanna try again?");
        onTranscript('');
      }
    } finally {
      wasCancelled.current = false;
      setLoading(false);
      setRecording(null);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleCancel = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    if (isRecording) {
      wasCancelled.current = true;
      stopRecording();
    } else {
      onCancel(); // 🔙 Hide the modal passed from index.tsx
    }
  };

  async function sendToBackend(audioUri: string): Promise<string> {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      name: 'input.m4a',
      type: 'audio/m4a',
    } as any);

    try {
      const response = await fetch('http://10.0.0.23:3001/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Server error:', response.status, text);
        return '';
      }

      const data = await response.json();
      return data.transcript || '';
    } catch (error) {
      console.error('Failed to send audio:', error);
      return '';
    }
  }

  return (
    <View style={styles.container}>
      {isRecording && (
        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
      )}

      <TouchableOpacity
        style={[styles.micButton, loading && { opacity: 0.5 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          toggleRecording();
        }}
        disabled={loading}
      >
        <FontAwesome name="microphone" size={28} color="#fff" />
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator style={{ marginTop: 20 }} size="small" color="#FF6347" />
      )}

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  micButton: {
    backgroundColor: '#FF6347',
    padding: 35,
    borderRadius: 60,
  },
  pulseCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,99,71,0.3)',
    position: 'absolute',
    top: -30,
    zIndex: -1,
  },
  cancelButton: {
    marginTop: 50,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    bottom: -100,
  },
  cancelText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});