// components/LoginModal.tsx
import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function LoginModal({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');

  const handleGoogleLogin = () => {
    // Add Google OAuth logic
  };

  const handleAppleLogin = () => {
    // Add Apple OAuth logic
  };

  const handleEmailSubmit = () => {
    // Send magic link or passcode
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.heading}>Log In</Text>

          <TouchableOpacity style={styles.buttonGoogle} onPress={handleGoogleLogin}>
            <Text style={styles.buttonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonApple} onPress={handleAppleLogin}>
            <Text style={styles.buttonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TouchableOpacity style={styles.buttonEmail} onPress={handleEmailSubmit}>
            <Text style={styles.buttonText}>Send Login Link</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonGoogle: {
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 6,
    width: '100%',
    marginBottom: 10,
  },
  buttonApple: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 6,
    width: '100%',
    marginBottom: 10,
  },
  buttonEmail: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 6,
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  cancel: {
    marginTop: 20,
    color: '#888',
    textAlign: 'center',
  },
});