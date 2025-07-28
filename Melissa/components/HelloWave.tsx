import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

export function HelloWave() {
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(17);
  const translateY = useSharedValue(80);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(12.5, { duration: 250 }),
        withTiming(0, { duration: 250 })
      ),
      4,
      false,
      () => {
        // Fade out when done
        opacity.value = withTiming(0, { duration: 400 });
        translateY.value = withTiming(200, { duration: 130 });
      }
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={styles.text}>👋</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 42,
    lineHeight: 66,
    marginTop: 2,
  },
});