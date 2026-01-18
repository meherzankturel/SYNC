import React from 'react';
import { View, Text, StyleSheet, Image, ImageBackground } from 'react-native';
import { theme } from '../config/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface MomentCardProps {
    title: string;
    date?: string;
    imageUrl?: string;
}

export default function MomentCard({ title, date, imageUrl }: MomentCardProps) {
    const placeholderImage = 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400';

    return (
        <View style={styles.container}>
            <ImageBackground
                source={{ uri: imageUrl || placeholderImage }}
                style={styles.image}
                imageStyle={styles.imageStyle}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(20, 11, 16, 0.8)']}
                    style={styles.overlay}
                >
                    <Text style={styles.label}>MOMENT OF THE DAY</Text>
                    <Text style={styles.title}>{title}</Text>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: theme.borderRadius['2xl'],
        overflow: 'hidden',
        ...theme.shadows.md,
    },
    image: {
        height: 200,
        justifyContent: 'flex-end',
    },
    imageStyle: {
        borderRadius: theme.borderRadius['2xl'],
    },
    overlay: {
        padding: theme.spacing.lg,
        paddingTop: theme.spacing['2xl'],
    },
    label: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        letterSpacing: 2,
        marginBottom: theme.spacing.xs,
    },
    title: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: '700',
        color: theme.colors.text,
    },
});
