import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import Modal from 'react-native-modal';

type Tier = {
  name: string;
  price: string;
  features: string[];
  productId?: string; // optional for Free
};

const tiers: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    features: [
      'Basic access',
      'Limited quota',
      'No image uploads',
    ],
  },
  {
    name: 'Pro',
    price: '$4.99 / month',
    features: [
      'Microphone access',
      'Ability to specify servings, difficulty, cookware',
      'Upload up to 2 images per request',
      'Adjust & Save recipes',
      'Up to 5 suggested ingredient substitutes',
    ],
    productId: 'pro_monthly',
  },
  {
    name: 'Elite',
    price: '$9.99 / month',
    features: [
      'Everything in Pro',
      'Upload up to 4 images per request',
      'Unlimited suggested ingredient ubstitutes',
      'Personalized food magazines',

    ],
    productId: 'elite_monthly',
  },
];

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onPurchase: (productId: string) => void;
};

const PremiumModal = ({ isVisible, onClose, onPurchase }: Props) => {
  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Upgrade Your Experience</Text>
        <FlatList
          data={tiers}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.tierName}>{item.name}</Text>
              <Text style={styles.price}>{item.price}</Text>
              {item.features.map((f, i) => (
                <Text key={i} style={styles.feature}>• {f}</Text>
              ))}
              {item.productId ? (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    if (item.productId) {
                        onPurchase(item.productId);
                    }
                    }}
                >
                  <Text style={styles.buttonText}>Choose {item.name}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.freeLabel}>Current Plan</Text>
              )}
            </View>
          )}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  card: { marginBottom: 20 },
  tierName: { fontSize: 18, fontWeight: 'bold' },
  price: { fontSize: 16, color: '#888', marginBottom: 8 },
  feature: { fontSize: 14, color: '#555' },
  button: {
    marginTop: 10,
    backgroundColor: '#FF6347',
    padding: 10,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', textAlign: 'center' },
  freeLabel: { marginTop: 10, fontStyle: 'italic', color: '#444' },
});

export default PremiumModal;