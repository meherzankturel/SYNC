import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';

const screenData = Dimensions.get('window');
const { width, height } = screenData;

interface Star {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
  initialY: number;
  initialScale: number;
}

export function AnimatedStars({ count = 30 }: { count?: number }) {
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    // Initialize stars
    starsRef.current = Array.from({ length: count }, (_, i) => {
      const initialY = Math.random() * height;
      const initialScale = 0.5 + Math.random() * 0.5;
      return {
        id: i,
        x: new Animated.Value(Math.random() * width),
        y: new Animated.Value(initialY),
        opacity: new Animated.Value(0.3 + Math.random() * 0.4),
        scale: new Animated.Value(initialScale),
        rotation: new Animated.Value(0),
        initialY,
        initialScale,
      };
    });

    // Animate stars
    starsRef.current.forEach((star) => {
      // Floating animation
      const floatAnimation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(star.y, {
              toValue: star.initialY + (Math.random() * 100 - 50),
              duration: 2000 + Math.random() * 3000,
              useNativeDriver: true,
            }),
            Animated.timing(star.opacity, {
              toValue: 0.3 + Math.random() * 0.7,
              duration: 2000 + Math.random() * 3000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(star.y, {
              toValue: star.initialY - (Math.random() * 100 - 50),
              duration: 2000 + Math.random() * 3000,
              useNativeDriver: true,
            }),
            Animated.timing(star.opacity, {
              toValue: 0.3 + Math.random() * 0.7,
              duration: 2000 + Math.random() * 3000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      // Rotation animation
      const rotationAnimation = Animated.loop(
        Animated.timing(star.rotation, {
          toValue: 1,
          duration: 3000 + Math.random() * 5000,
          useNativeDriver: true,
        })
      );

      // Pulsing animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(star.scale, {
            toValue: star.initialScale * 1.3,
            duration: 1500 + Math.random() * 1500,
            useNativeDriver: true,
          }),
          Animated.timing(star.scale, {
            toValue: star.initialScale * 0.8,
            duration: 1500 + Math.random() * 1500,
            useNativeDriver: true,
          }),
        ])
      );

      floatAnimation.start();
      rotationAnimation.start();
      pulseAnimation.start();
    });

    return () => {
      starsRef.current.forEach((star) => {
        star.x.stopAnimation();
        star.y.stopAnimation();
        star.opacity.stopAnimation();
        star.scale.stopAnimation();
        star.rotation.stopAnimation();
      });
    };
  }, [count]);

  const renderStar = (star: Star) => {
    const spin = star.rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        key={star.id}
        style={[
          styles.star,
          {
            transform: [
              { translateX: star.x },
              { translateY: star.y },
              { scale: star.scale },
              { rotate: spin },
            ],
            opacity: star.opacity,
          },
        ]}
      >
        <Ionicons name="star" size={8 + Math.random() * 6} color={theme.colors.primary} />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {starsRef.current.map((star) => renderStar(star))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
  },
});

