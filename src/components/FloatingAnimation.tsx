import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface FloatingAnimationProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    duration?: number;         // Animation duration in ms
    distance?: number;         // Float distance in pixels
    delay?: number;            // Start delay in ms
    enabled?: boolean;         // Enable/disable animation
    type?: 'float' | 'breathe' | 'pulse' | 'bob';
}

/**
 * Wrapper component that adds a gentle floating/breathing animation to its children.
 * Perfect for creating a dreamy, living UI feel.
 */
export const FloatingAnimation: React.FC<FloatingAnimationProps> = ({
    children,
    style,
    duration = 3000,
    distance = 6,
    delay = 0,
    enabled = true,
    type = 'float',
}) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!enabled) {
            animatedValue.setValue(0);
            scaleValue.setValue(1);
            return;
        }

        const startAnimation = () => {
            if (type === 'float' || type === 'bob') {
                // Gentle up and down floating
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(animatedValue, {
                            toValue: 1,
                            duration: duration / 2,
                            useNativeDriver: true,
                        }),
                        Animated.timing(animatedValue, {
                            toValue: 0,
                            duration: duration / 2,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            } else if (type === 'breathe') {
                // Scale breathing effect
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(scaleValue, {
                            toValue: 1.03,
                            duration: duration / 2,
                            useNativeDriver: true,
                        }),
                        Animated.timing(scaleValue, {
                            toValue: 1,
                            duration: duration / 2,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            } else if (type === 'pulse') {
                // Subtle pulse with opacity
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(scaleValue, {
                            toValue: 1.05,
                            duration: duration / 2,
                            useNativeDriver: true,
                        }),
                        Animated.timing(scaleValue, {
                            toValue: 0.98,
                            duration: duration / 2,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            }
        };

        const timer = setTimeout(startAnimation, delay);
        return () => clearTimeout(timer);
    }, [enabled, type, duration, delay]);

    const translateY = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -distance],
    });

    const getTransformStyle = () => {
        switch (type) {
            case 'float':
            case 'bob':
                return { transform: [{ translateY }] };
            case 'breathe':
            case 'pulse':
                return { transform: [{ scale: scaleValue }] };
            default:
                return {};
        }
    };

    return (
        <Animated.View style={[style, getTransformStyle()]}>
            {children}
        </Animated.View>
    );
};

/**
 * Hook for creating custom floating animations
 */
export const useFloatingAnimation = (duration = 3000, distance = 6) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: duration / 2,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: duration / 2,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [duration]);

    const translateY = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -distance],
    });

    return { translateY, animatedValue };
};

/**
 * Hook for creating breathing/scale animations
 */
export const useBreathingAnimation = (duration = 2000, minScale = 1, maxScale = 1.03) => {
    const scaleValue = useRef(new Animated.Value(minScale)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleValue, {
                    toValue: maxScale,
                    duration: duration / 2,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleValue, {
                    toValue: minScale,
                    duration: duration / 2,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [duration, minScale, maxScale]);

    return { scale: scaleValue };
};

export default FloatingAnimation;
