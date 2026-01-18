import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { theme } from '../config/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ActivityCardProps {
    title: string;
    subtitle?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    imageUrl?: string;
    badge?: string;
    onPress?: () => void;
    size?: 'small' | 'medium' | 'large';
    showPlayButton?: boolean;
}

export default function ActivityCard({
    title,
    subtitle,
    icon,
    iconColor = theme.colors.primary,
    imageUrl,
    badge,
    onPress,
    size = 'medium',
    showPlayButton = false,
}: ActivityCardProps) {
    const isLarge = size === 'large';
    const isSmall = size === 'small';

    const content = (
        <>
            {/* Badge */}
            {badge && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}

            {/* Icon */}
            {icon && !imageUrl && (
                <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                    <Ionicons name={icon} size={isSmall ? 20 : 24} color={iconColor} />
                </View>
            )}

            {/* Play Button (for featured cards) */}
            {showPlayButton && (
                <View style={styles.playButton}>
                    <Ionicons name="play" size={24} color={theme.colors.text} />
                </View>
            )}

            {/* Content */}
            <View style={[styles.content, isLarge && styles.contentLarge]}>
                <Text style={[styles.title, isLarge && styles.titleLarge]} numberOfLines={2}>
                    {title}
                </Text>
                {subtitle && (
                    <Text style={styles.subtitle} numberOfLines={2}>
                        {subtitle}
                    </Text>
                )}
            </View>
        </>
    );

    const cardStyle = [
        styles.card,
        isLarge && styles.cardLarge,
        isSmall && styles.cardSmall,
    ];

    if (imageUrl) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
                <ImageBackground
                    source={{ uri: imageUrl }}
                    style={cardStyle}
                    imageStyle={styles.cardImage}
                >
                    <LinearGradient
                        colors={['transparent', 'rgba(20, 11, 16, 0.8)']}
                        style={styles.imageOverlay}
                    >
                        {content}
                    </LinearGradient>
                </ImageBackground>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.9}>
            {content}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius['2xl'],
        padding: theme.spacing.md,
        minHeight: 100,
    },
    cardLarge: {
        minHeight: 180,
        padding: 0,
        overflow: 'hidden',
    },
    cardSmall: {
        minHeight: 80,
        padding: theme.spacing.sm,
    },
    cardImage: {
        borderRadius: theme.borderRadius['2xl'],
    },
    imageOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius['2xl'],
    },
    badge: {
        position: 'absolute',
        top: theme.spacing.md,
        left: theme.spacing.md,
        backgroundColor: theme.colors.primary + '40',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
    },
    badgeText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: '600',
        color: theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.sm,
    },
    playButton: {
        position: 'absolute',
        top: theme.spacing.md,
        right: theme.spacing.md,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        marginTop: 'auto',
    },
    contentLarge: {
        paddingBottom: theme.spacing.sm,
    },
    title: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
    },
    titleLarge: {
        fontSize: theme.typography.fontSize.xl,
    },
    subtitle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
});
