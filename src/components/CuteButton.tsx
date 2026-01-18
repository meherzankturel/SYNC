import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../config/theme';
import * as Haptics from 'expo-haptics';

interface CuteButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'soft' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    style?: ViewStyle;
    textStyle?: TextStyle;
    gradient?: boolean;        // Use gradient background
    bouncy?: boolean;          // Enable bouncy press animation
    glow?: boolean;            // Add glow effect
    fullWidth?: boolean;
}

/**
 * A cute, bouncy button component with gradient support and jelly animations.
 * The heart of the Cozy Cloud Love interaction design.
 */
export const CuteButton: React.FC<CuteButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    style,
    textStyle,
    gradient = true,
    bouncy = true,
    glow = false,
    fullWidth = false,
}) => {
    const scaleValue = useRef(new Animated.Value(1)).current;
    const pressedValue = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        if (disabled || loading) return;

        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: 0.95,
                useNativeDriver: true,
                ...theme.animations.spring.jelly,
            }),
            Animated.timing(pressedValue, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: 1,
                useNativeDriver: true,
                ...theme.animations.spring.bouncy,
            }),
            Animated.timing(pressedValue, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePress = () => {
        if (!disabled && !loading) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }
    };

    // Get size styles
    const getSizeStyles = () => {
        const sizes = {
            small: {
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.borderRadius.lg,
                fontSize: theme.typography.fontSize.sm,
            },
            medium: {
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
                borderRadius: theme.borderRadius.xl,
                fontSize: theme.typography.fontSize.base,
            },
            large: {
                paddingHorizontal: theme.spacing.xl,
                paddingVertical: theme.spacing.lg,
                borderRadius: theme.borderRadius['2xl'],
                fontSize: theme.typography.fontSize.lg,
            },
        };
        return sizes[size];
    };

    // Get variant styles
    const getVariantStyles = () => {
        const variants = {
            primary: {
                backgroundColor: theme.colors.primary,
                textColor: theme.colors.textOnPrimary,
                gradientColors: theme.gradients.button,
            },
            secondary: {
                backgroundColor: theme.colors.secondary,
                textColor: theme.colors.text,
                gradientColors: theme.gradients.warmth,
            },
            soft: {
                backgroundColor: theme.colors.primaryLight,
                textColor: theme.colors.primary,
                gradientColors: ['#F0D5EB', '#FFE5D9'],
            },
            outline: {
                backgroundColor: 'transparent',
                textColor: theme.colors.primary,
                borderColor: theme.colors.primary,
                borderWidth: 2,
            },
            ghost: {
                backgroundColor: 'transparent',
                textColor: theme.colors.textSecondary,
            },
        };
        return variants[variant];
    };

    const sizeStyles = getSizeStyles();
    const variantStyles = getVariantStyles();

    const buttonContent = (
        <>
            {icon && iconPosition === 'left' && <>{icon}</>}
            {loading ? (
                <ActivityIndicator
                    color={variantStyles.textColor}
                    size={size === 'small' ? 'small' : 'small'}
                />
            ) : (
                <Text
                    style={[
                        styles.text,
                        {
                            fontSize: sizeStyles.fontSize,
                            color: variantStyles.textColor,
                            marginLeft: icon && iconPosition === 'left' ? 8 : 0,
                            marginRight: icon && iconPosition === 'right' ? 8 : 0,
                        },
                        textStyle,
                    ]}
                >
                    {title}
                </Text>
            )}
            {icon && iconPosition === 'right' && <>{icon}</>}
        </>
    );

    const shadowStyle = glow ? theme.shadows.glow : theme.shadows.lifted;

    // Gradient button
    if (gradient && variant !== 'outline' && variant !== 'ghost' && 'gradientColors' in variantStyles) {
        return (
            <Animated.View
                style={[
                    { transform: [{ scale: bouncy ? scaleValue : 1 }] },
                    disabled && styles.disabled,
                    glow && shadowStyle,
                    fullWidth && styles.fullWidth,
                    style,
                ]}
            >
                <TouchableOpacity
                    onPress={handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={disabled || loading}
                    activeOpacity={1}
                >
                    <LinearGradient
                        colors={variantStyles.gradientColors as [string, string, ...string[]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                            styles.button,
                            {
                                paddingHorizontal: sizeStyles.paddingHorizontal,
                                paddingVertical: sizeStyles.paddingVertical,
                                borderRadius: sizeStyles.borderRadius,
                            },
                        ]}
                    >
                        {buttonContent}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    // Solid/outline button
    return (
        <Animated.View
            style={[
                { transform: [{ scale: bouncy ? scaleValue : 1 }] },
                disabled && styles.disabled,
                fullWidth && styles.fullWidth,
                style,
            ]}
        >
            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={1}
                style={[
                    styles.button,
                    {
                        paddingHorizontal: sizeStyles.paddingHorizontal,
                        paddingVertical: sizeStyles.paddingVertical,
                        borderRadius: sizeStyles.borderRadius,
                        backgroundColor: variantStyles.backgroundColor,
                        borderColor: 'borderColor' in variantStyles ? variantStyles.borderColor : undefined,
                        borderWidth: 'borderWidth' in variantStyles ? variantStyles.borderWidth : 0,
                    },
                    variant !== 'ghost' && variant !== 'outline' && shadowStyle,
                ]}
            >
                {buttonContent}
            </TouchableOpacity>
        </Animated.View>
    );
};

/**
 * A pill-shaped tag/chip button for selections
 */
export const PillButton: React.FC<{
    label: string;
    selected?: boolean;
    onPress: () => void;
    emoji?: string;
    color?: string;
    disabled?: boolean;
}> = ({
    label,
    selected = false,
    onPress,
    emoji,
    color = theme.colors.primary,
    disabled = false,
}) => {
        const scaleValue = useRef(new Animated.Value(1)).current;

        const handlePressIn = () => {
            Animated.spring(scaleValue, {
                toValue: 0.92,
                useNativeDriver: true,
                ...theme.animations.spring.jelly,
            }).start();
        };

        const handlePressOut = () => {
            Animated.spring(scaleValue, {
                toValue: 1,
                useNativeDriver: true,
                ...theme.animations.spring.bouncy,
            }).start();
        };

        const handlePress = () => {
            if (!disabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress();
            }
        };

        return (
            <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                <TouchableOpacity
                    onPress={handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={disabled}
                    activeOpacity={1}
                    style={[
                        styles.pill,
                        {
                            backgroundColor: selected ? `${color}20` : theme.colors.surfaceSoft,
                            borderColor: selected ? color : theme.colors.border,
                        },
                        disabled && styles.disabled,
                    ]}
                >
                    {emoji && <Text style={styles.pillEmoji}>{emoji}</Text>}
                    <Text
                        style={[
                            styles.pillText,
                            { color: selected ? color : theme.colors.textSecondary },
                            selected && { fontWeight: '600' },
                        ]}
                    >
                        {label}
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    disabled: {
        opacity: 0.5,
    },
    fullWidth: {
        width: '100%',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        gap: 6,
    },
    pillEmoji: {
        fontSize: 16,
    },
    pillText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default CuteButton;
