import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../config/theme';
import { Ionicons } from '@expo/vector-icons';

interface TimezoneCardProps {
    city: string;
    time: string;
    weather?: string;
    temperature?: string;
    icon?: 'moon' | 'sunny' | 'cloudy' | 'rainy';
}

export default function TimezoneCard({
    city,
    time,
    weather,
    temperature,
    icon = 'moon',
}: TimezoneCardProps) {
    const getIconName = (): keyof typeof Ionicons.glyphMap => {
        switch (icon) {
            case 'sunny':
                return 'sunny';
            case 'cloudy':
                return 'cloudy';
            case 'rainy':
                return 'rainy';
            default:
                return 'moon';
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.city}>{city.toUpperCase()}</Text>
                <Ionicons
                    name={getIconName()}
                    size={16}
                    color={theme.colors.textSecondary}
                />
            </View>

            <Text style={styles.time}>{time}</Text>

            {(weather || temperature) && (
                <Text style={styles.weather}>
                    {weather}{temperature ? ` · ${temperature}` : ''}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
    },
    city: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: '600',
        color: theme.colors.primary,
        letterSpacing: 1,
    },
    time: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: 4,
    },
    weather: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
});
