import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../config/theme';

interface GradientCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    gradient?: keyof typeof theme.gradients | string[];
    borderRadius?: number;
    padding?: number;
    shadow?: 'none' | 'sm' | 'md' | 'lg' | 'glow' | 'glowStrong';
    glowColor?: string;
    animated?: boolean;       // Enable subtle breathing animation
    borderGradient?: boolean; // Show gradient as border only
    borderWidth?: number;
}

/**
 * A beautiful gradient card component with optional glow and animations.
 * Core building block for the Cozy Cloud Love theme.
 */
export const GradientCard: React.FC<GradientCardProps> = ({
    children,
    style,
    gradient = 'card',
    borderRadius = theme.borderRadius.lg,
    padding = theme.spacing.md,
    shadow = 'md',
    glowColor,
    animated = false,
    borderGradient = false,
    borderWidth = 2,
}) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (animated) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleValue, {
                        toValue: 1.01,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleValue, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [animated]);

    // Get gradient colors
    const gradientColors: string[] = Array.isArray(gradient)
        ? gradient
        : (theme.gradients[gradient as keyof typeof theme.gradients] || theme.gradients.card);

    // Get shadow style
    const getShadowStyle = () => {
        if (shadow === 'none') return {};

        const shadowStyles: Record<string, object> = {
            sm: theme.shadows.sm,
            md: theme.shadows.md,
            lg: theme.shadows.lg,
            glow: {
                ...theme.shadows.glow,
                ...(glowColor && { shadowColor: glowColor }),
            },
            glowStrong: {
                ...theme.shadows.glowStrong,
                ...(glowColor && { shadowColor: glowColor }),
            },
        };

        return shadowStyles[shadow] || theme.shadows.md;
    };

    if (borderGradient) {
        // Gradient border effect
        return (
            <Animated.View
                style={[
                    { transform: [{ scale: animated ? scaleValue : 1 }] },
                    getShadowStyle(),
                    style,
                ]}
            >
                <LinearGradient
                    colors={gradientColors as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.gradientBorder,
                        { borderRadius, padding: borderWidth },
                    ]}
                >
                    <View
                        style={[
                            styles.innerCard,
                            {
                                borderRadius: borderRadius - borderWidth,
                                padding,
                                backgroundColor: theme.colors.surface,
                            },
                        ]}
                    >
                        {children}
                    </View>
                </LinearGradient>
            </Animated.View>
        );
    }

    // Standard gradient background
    return (
        <Animated.View
            style={[
                { transform: [{ scale: animated ? scaleValue : 1 }] },
                getShadowStyle(),
                style,
            ]}
        >
            <LinearGradient
                colors={gradientColors as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.card,
                    { borderRadius, padding },
                ]}
            >
                {children}
            </LinearGradient>
        </Animated.View>
    );
};

/**
 * A simple soft card without gradient (solid background with soft styling)
 */
export const SoftCard: React.FC<{
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
    shadow?: 'none' | 'sm' | 'md' | 'lg';
}> = ({
    children,
    style,
    backgroundColor = theme.colors.surface,
    borderRadius = theme.borderRadius.lg,
    padding = theme.spacing.md,
    shadow = 'sm',
}) => {
        const shadowStyle = shadow !== 'none' ? theme.shadows[shadow] : {};

        return (
            <View
                style={[
                    styles.softCard,
                    {
                        backgroundColor,
                        borderRadius,
                        padding,
                    },
                    shadowStyle,
                    style,
                ]}
            >
                {children}
            </View>
        );
    };

/**
 * A glowing orb card, perfect for featuring partner's mood
 */
export const GlowOrb: React.FC<{
    children: React.ReactNode;
    size?: number;
    glowColor?: string;
    backgroundColor?: string;
    animated?: boolean;
}> = ({
    children,
    size = 120,
    glowColor = theme.colors.accentCoral,
    backgroundColor = theme.colors.surface,
    animated = true,
}) => {
        const scaleValue = useRef(new Animated.Value(1)).current;
        const glowValue = useRef(new Animated.Value(0.3)).current;

        useEffect(() => {
            if (animated) {
                // Breathing animation
                Animated.loop(
                    Animated.parallel([
                        Animated.sequence([
                            Animated.timing(scaleValue, {
                                toValue: 1.05,
                                duration: 1500,
                                useNativeDriver: true,
                            }),
                            Animated.timing(scaleValue, {
                                toValue: 1,
                                duration: 1500,
                                useNativeDriver: true,
                            }),
                        ]),
                        Animated.sequence([
                            Animated.timing(glowValue, {
                                toValue: 0.5,
                                duration: 1500,
                                useNativeDriver: true,
                            }),
                            Animated.timing(glowValue, {
                                toValue: 0.3,
                                duration: 1500,
                                useNativeDriver: true,
                            }),
                        ]),
                    ])
                ).start();
            }
        }, [animated]);

        return (
            <Animated.View
                style={[
                    styles.glowOrb,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor,
                        transform: [{ scale: scaleValue }],
                        shadowColor: glowColor,
                        shadowOpacity: animated ? glowValue : 0.3,
                    },
                ]}
            >
                {children}
            </Animated.View>
        );
    };

const styles = StyleSheet.create({
    card: {
        overflow: 'hidden',
    },
    gradientBorder: {
        overflow: 'hidden',
    },
    innerCard: {
        overflow: 'hidden',
    },
    softCard: {
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    glowOrb: {
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 25,
        elevation: 10,
    },
});

export default GradientCard;
