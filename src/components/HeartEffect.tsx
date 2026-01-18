import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HeartEffectProps {
    trigger: number; // Increment this to trigger new hearts
    duration?: number; // How long hearts should float (in ms)
    heartCount?: number; // Number of hearts to show (default: 15-20 for multiple, 1 for single)
    singleHeart?: boolean; // If true, show only 1 heart per trigger
}

interface Heart {
    id: number;
    x: Animated.Value;
    y: Animated.Value;
    scale: Animated.Value;
    opacity: Animated.Value;
    rotation: Animated.Value;
    emoji: string; // Store emoji per heart
}

const HEART_EMOJIS = ['💖', '❤️', '💕', '💗', '💓', '💝', '💞', '💟'];

export default function HeartEffect({ trigger, duration = 3000, heartCount, singleHeart = false }: HeartEffectProps) {
    const [hearts, setHearts] = useState<Heart[]>([]);
    const heartIdCounter = useRef(0);
    const lastTriggerRef = useRef(0);

    useEffect(() => {
        if (trigger > 0 && trigger !== lastTriggerRef.current) {
            lastTriggerRef.current = trigger;
            
            // Determine how many hearts to show
            let heartsToShow: number;
            if (singleHeart) {
                heartsToShow = 1;
            } else if (heartCount !== undefined) {
                heartsToShow = heartCount;
            } else {
                // Default: 15-20 hearts for multiple effects
                heartsToShow = Math.floor(Math.random() * 6) + 15;
            }
            
            const newHearts: Heart[] = [];
            
            for (let i = 0; i < heartsToShow; i++) {
                const heartId = heartIdCounter.current++;
                const x = new Animated.Value(Math.random() * SCREEN_WIDTH);
                const y = new Animated.Value(SCREEN_HEIGHT + 50); // Start below screen
                const scale = new Animated.Value(0);
                const opacity = new Animated.Value(0);
                const rotation = new Animated.Value(0);
                const emoji = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];

                newHearts.push({
                    id: heartId,
                    x,
                    y,
                    scale,
                    opacity,
                    rotation,
                    emoji,
                });

                // Random horizontal drift
                const horizontalDrift = (Math.random() - 0.5) * 100;
                const finalX = x._value + horizontalDrift;

                // Random size variation
                const sizeMultiplier = Math.random() * 0.5 + 0.5; // 0.5x to 1x size

                // Animate heart
                Animated.parallel([
                    // Float upward
                    Animated.timing(y, {
                        toValue: -100,
                        duration: duration + Math.random() * 1000,
                        useNativeDriver: true,
                    }),
                    // Scale in and out
                    Animated.sequence([
                        Animated.timing(scale, {
                            toValue: sizeMultiplier,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(scale, {
                            toValue: sizeMultiplier * 0.8,
                            duration: duration - 200,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Fade in and out
                    Animated.sequence([
                        Animated.timing(opacity, {
                            toValue: 0.9,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: duration - 200,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Rotate slightly
                    Animated.timing(rotation, {
                        toValue: Math.random() * 20 - 10, // -10 to 10 degrees
                        duration: duration,
                        useNativeDriver: true,
                    }),
                    // Horizontal drift
                    Animated.timing(x, {
                        toValue: finalX,
                        duration: duration,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    // Remove heart after animation
                    setHearts(prev => prev.filter(h => h.id !== heartId));
                });
            }
            
            // Add new hearts to state
            setHearts(prev => [...prev, ...newHearts]);
        }
    }, [trigger, duration, singleHeart, heartCount]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {hearts.map((heart) => (
                <Animated.View
                    key={heart.id}
                    style={[
                        styles.heartContainer,
                        {
                            transform: [
                                { translateX: heart.x },
                                { translateY: heart.y },
                                { scale: heart.scale },
                                { rotate: heart.rotation.interpolate({
                                    inputRange: [-10, 10],
                                    outputRange: ['-10deg', '10deg'],
                                }) },
                            ],
                            opacity: heart.opacity,
                        },
                    ]}
                >
                    <Text style={styles.heart}>{heart.emoji}</Text>
                </Animated.View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    heartContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heart: {
        fontSize: 30,
        textShadowColor: 'rgba(255, 107, 107, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
});

