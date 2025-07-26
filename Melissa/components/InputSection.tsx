import { View, TextInput, Button, Text } from 'react-native';
import { Audio } from 'expo-av';

export default function InputSection({ textQuery, setTextQuery, voiceTranscript, setVoiceTranscript }) {
  const recordVoice = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) return;

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
    await recording.startAsync();

    setTimeout(async () => {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      // Placeholder – replace with Whisper integration
      setVoiceTranscript("I want something spicy and quick");

    }, 4000); // Record for 4 seconds
  };

  return (
    <View style={{ marginVertical: 20 }}>
      <Text>📝 Text Prompt</Text>
      <TextInput
        value={textQuery}
        onChangeText={setTextQuery}
        placeholder="What do you want to cook?"
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />

      <Button title="🎙️ Record Voice (4s)" onPress={recordVoice} />
      {voiceTranscript && <Text style={{ marginTop: 10 }}>Transcript: {voiceTranscript}</Text>}
    </View>
  );
}