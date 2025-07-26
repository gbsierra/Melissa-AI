import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function IngredientModal({ visible, onClose, ingredient }) {
  const suggestions = {
    'Soy sauce': ['Tamari', 'Worcestershire sauce', 'Miso paste'],
    'Chili oil': ['Sriracha', 'Red pepper flakes'],
    'Vinegar': ['Lemon juice', 'Lime juice', 'Apple cider vinegar'],
    // Expand as needed!
  };

  const options = suggestions[ingredient.name] || ['No alternatives available'];

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title}>🧂 {ingredient.name}</Text>
          <TouchableOpacity onPress={() => {/* remove logic */}}>
            <Text style={styles.option}>❌ Remove Ingredient</Text>
          </TouchableOpacity>
          <Text style={styles.sub}>Suggested Substitutes:</Text>
          {options.map((alt, i) => (
            <TouchableOpacity key={i}>
              <Text style={styles.alt}>🔄 {alt}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>⬅ Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center' },
  modal: { margin: 20, padding: 20, backgroundColor: '#fff', borderRadius: 10 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  sub: { marginTop: 10, fontWeight: '600' },
  option: { marginVertical: 8, color: '#FF6347', fontWeight: '500' },
  alt: { marginVertical: 4, color: '#444' },
  close: { marginTop: 20, textAlign: 'center', color: '#888' },
});