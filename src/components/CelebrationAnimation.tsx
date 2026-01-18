import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
  emoji: string;
}

const celebrationEmojis = ['✨', '⭐', '🎉', '💫', '🌟', '🎊', '💖', '✨'];

export function CelebrationAnimation({ visible, onComplete }: { visible: boolean; onComplete?: () => void }) {
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible) {
      // Create particles
      particlesRef.current = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: new Animated.Value(width / 2),
        y: new Animated.Value(height / 2),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(0),
        rotation: new Animated.Value(0),
        emoji: celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)],
      }));

      // Animate particles
      const animations = particlesRef.current.map((particle) => {
        const angle = (Math.PI * 2 * particle.id) / particlesRef.current.length;
        const distance = 150 + Math.random() * 100;

        return Animated.parallel([
          Animated.sequence([
            Animated.parallel([
              Animated.spring(particle.scale, {
                toValue: 1,
                tension: 50,
                friction: 3,
                useNativeDriver: true,
              }),
              Animated.timing(particle.rotation, {
                toValue: 2,
                duration: 2000,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(particle.x, {
                toValue: width / 2 + Math.cos(angle) * distance,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(particle.y, {
                toValue: height / 2 + Math.sin(angle) * distance,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 1500,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]);
      });

      animationRef.current = Animated.parallel(animations);
      animationRef.current.start(() => {
        if (onComplete) {
          onComplete();
        }
      });

      return () => {
        if (animationRef.current) {
          animationRef.current.stop();
        }
      };
    } else {
      // Reset particles
      particlesRef.current.forEach((particle) => {
        particle.x.setValue(width / 2);
        particle.y.setValue(height / 2);
        particle.opacity.setValue(0);
        particle.scale.setValue(0);
        particle.rotation.setValue(0);
      });
    }
  }, [visible]);

  if (!visible) return null;

  const renderParticle = (particle: Particle) => {
    const spin = particle.rotation.interpolate({
      inputRange: [0, 2],
      outputRange: ['0deg', '720deg'],
    });

    return (
      <Animated.View
        key={particle.id}
        style={[
          styles.particle,
          {
            transform: [
              { translateX: particle.x },
              { translateY: particle.y },
              { scale: particle.scale },
              { rotate: spin },
            ],
            opacity: particle.opacity,
          },
        ]}
      >
        <View style={styles.emojiContainer}>
          <Ionicons name="sparkles" size={24} color={theme.colors.accent} />
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {particlesRef.current.map((particle) => renderParticle(particle))}
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
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
  },
  emojiContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

