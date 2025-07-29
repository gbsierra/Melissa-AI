import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { FadeIn, FadeOut } from 'react-native-reanimated';

type LoadingOverlayProps = {
  visible: boolean;
  text?: string;
  style?: ViewStyle; // ✅ external layout control
};

export const LoadingOverlay = ({ visible, text, style }: LoadingOverlayProps) => {
  if (!visible) return null;

  return (
    <View style={[styles.loadingOverlay, style]}>
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={styles.loadingOverlay}
      >
        <ActivityIndicator size="large" color="#fff" />
        {text && <Text style={styles.spinnerText}>{text}</Text>}
      </Animated.View>
    </View>
  );
};

export const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 99, 71, 0.4)', // translucent tomato
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  spinnerText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});