import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';

interface MemoryStatsProps {
    averageRating: number;
    totalMemories: number;
}

export const MemoryStats: React.FC<MemoryStatsProps> = ({
    averageRating,
    totalMemories,
}) => {
    // Render star rating
    const renderStars = () => {
        const stars = [];
        const fullStars = Math.floor(averageRating);
        const hasHalfStar = averageRating % 1 >= 0.5;

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars.push(
                    <Ionicons
                        key={i}
                        name="star"
                        size={18}
                        color="#C25068"
                        style={{ marginHorizontal: 1 }}
                    />
                );
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars.push(
                    <Ionicons
                        key={i}
                        name="star-half"
                        size={18}
                        color="#C25068"
                        style={{ marginHorizontal: 1 }}
                    />
                );
            } else {
                stars.push(
                    <Ionicons
                        key={i}
                        name="star-outline"
                        size={18}
                        color="#D4A5B0"
                        style={{ marginHorizontal: 1 }}
                    />
                );
            }
        }
        return stars;
    };

    return (
        <View style={styles.container}>
            {/* Heart icon at top */}
            <View style={styles.iconContainer}>
                <Ionicons name="heart" size={32} color="#C25068" />
            </View>

            {/* Title */}
            <Text style={styles.title}>Memory Stats</Text>

            {/* Big rating number */}
            <Text style={styles.ratingNumber}>
                {averageRating > 0 ? averageRating.toFixed(1) : '—'}
            </Text>

            {/* Star rating */}
            <View style={styles.starsRow}>
                {renderStars()}
            </View>

            {/* Total count */}
            <Text style={styles.totalText}>
                {totalMemories} {totalMemories === 1 ? 'Date' : 'Dates'} Reviewed
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: theme.spacing.xl,
        alignItems: 'center',
        marginHorizontal: theme.spacing.lg,
        marginVertical: theme.spacing.xl,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    iconContainer: {
        marginBottom: theme.spacing.sm,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8B6B75',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.sm,
    },
    ratingNumber: {
        fontSize: 48,
        fontWeight: '700',
        color: '#C25068',
        lineHeight: 56,
    },
    starsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
    },
    totalText: {
        fontSize: 13,
        color: '#8B6B75',
        fontWeight: '500',
    },
});

export default MemoryStats;
