import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Dimensions,
  Easing,
  PanResponder,
} from 'react-native';

interface HeroActionsScrollerProps {
  onCreate: () => void;
  onLogin: () => void;
  onUpgrade: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const HeroActionsScroller: React.FC<HeroActionsScrollerProps> = ({
  onCreate,
  onLogin,
  onUpgrade,
}) => {
  const translateX = useRef(new Animated.Value(screenWidth)).current;
  const currentOffset = useRef(screenWidth);
  const scrollDistance = screenWidth + 400;

  const animateLoop = () => {
    Animated.timing(translateX, {
      toValue: -scrollDistance,
      duration: 19000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        currentOffset.current = screenWidth;
        translateX.setValue(currentOffset.current);
        animateLoop();
      }
    });
  };

  useEffect(() => {
    animateLoop();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateX.stopAnimation((value) => {
          currentOffset.current = value;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const newOffset = currentOffset.current + gestureState.dx;
        translateX.setValue(newOffset);
      },
      onPanResponderRelease: (_, gestureState) => {
        currentOffset.current += gestureState.dx;

        // ⛑ If it's off the left edge, reset
        if (currentOffset.current < -scrollDistance) {
          currentOffset.current = screenWidth;
        } else {
          // Otherwise clamp within bounds
          currentOffset.current = Math.max(-scrollDistance, Math.min(screenWidth, currentOffset.current));
        }

        translateX.setValue(currentOffset.current);
        animateLoop();
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
        <TouchableOpacity onPress={onCreate} style={[styles.btnBase, styles.cookbookBtn]}>
          <Text style={styles.btnText}>📖 Create Cookbook</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onLogin} style={[styles.btnBase, styles.loginBtn]}>
          <Text style={styles.btnText}>🔐 Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onUpgrade} style={[styles.btnBase, styles.premiumBtn]}>
          <Text style={styles.btnText}>💎 Upgrade</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    paddingVertical: 9,
  },
  row: {
    flexDirection: 'row',
  },
  btnBase: {
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 160,
    marginRight: 15,
  },
  btnText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  cookbookBtn: {
    backgroundColor: '#FF6347',
  },
  loginBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF6347',
  },
  premiumBtn: {
    backgroundColor: '#FFD700',
  },
});

export default HeroActionsScroller;