import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { WobblyCard } from './index';

interface DoodleDateCardProps {
    title: string;
    date: Date;
    categoryIcon: string;
    categoryColor: string;
    description?: string;
    isUpcoming: boolean;
    image?: string; // Optional image
    onEdit: () => void;
    onDelete: () => void;
    onComplete?: () => void;
    onAction?: () => void; // FaceTime or actions
    userReview?: any;
    partnerReview?: any;
    allMediaItems?: Array<{ uri: string; type: 'image' | 'video' }>;
    onMediaPress?: (items: Array<{ uri: string; type: 'image' | 'video' }>, index: number) => void;
}

export const DoodleDateCard: React.FC<DoodleDateCardProps> = ({
    title,
    date,
    categoryIcon,
    categoryColor,
    description,
    isUpcoming,
    image,
    onEdit,
    onDelete,
    onComplete,
    onAction,
    userReview,
    partnerReview,
    allMediaItems,
    onMediaPress
}) => {
    const handwritingFont = Platform.OS === 'ios' ? 'Noteworthy-Bold' : 'sans-serif-medium';

    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
        <View style={{ marginBottom: 24, paddingHorizontal: 4 }}>
            <WobblyCard
                backgroundColor="#ffffff"
                borderColor="#000"
                style={{ padding: 0 }}
                rotate='0deg' // Less wobble on the card itself to match clean look
            >
                <View style={styles.content}>
                    {/* Header Row */}
                    <View style={styles.headerRow}>
                        <Text style={[styles.statusText, { fontFamily: handwritingFont }]}>
                            {isUpcoming ? 'Coming up!' : (
                                // If past, maybe show "Last week" or "Past"
                                'Past Date'
                            )}
                        </Text>
                        <Ionicons name={categoryIcon as any} size={28} color={theme.colors.primary} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title} numberOfLines={2}>{title}</Text>

                    {/* Date */}
                    <Text style={styles.dateText}>
                        {formatDate(date)} • {formatTime(date)}
                    </Text>

                    {/* Review Stars for Past Dates */}
                    {!isUpcoming && (userReview || partnerReview) && (
                        <View style={styles.reviewSummary}>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Ionicons
                                        key={star}
                                        name={star <= (userReview?.rating || partnerReview?.rating || 0) ? 'star' : 'star-outline'}
                                        size={16}
                                        color={star <= (userReview?.rating || partnerReview?.rating || 0) ? '#FFD700' : '#ccc'}
                                    />
                                ))}
                            </View>
                            {(userReview?.emoji || partnerReview?.emoji) && (
                                <Text style={styles.emojiBadge}>{userReview?.emoji || partnerReview?.emoji}</Text>
                            )}
                        </View>
                    )}

                    {/* Image or Media Block */}
                    <View style={styles.imageContainer}>
                        {allMediaItems && allMediaItems.length > 1 ? (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.mediaScroll}
                            >
                                {allMediaItems.map((item, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        onPress={() => onMediaPress?.(allMediaItems, idx)}
                                        activeOpacity={0.8}
                                    >
                                        <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} resizeMode="cover" />
                                        {item.type === 'video' && (
                                            <View style={styles.playIconOverlay}>
                                                <Ionicons name="play" size={20} color="#fff" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        ) : (allMediaItems && allMediaItems.length === 1) || image ? (
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => {
                                    if (allMediaItems && allMediaItems.length === 1) {
                                        onMediaPress?.(allMediaItems, 0);
                                    }
                                }}
                                disabled={!allMediaItems || allMediaItems.length === 0}
                                style={{ width: '100%', height: '100%' }}
                            >
                                <Image
                                    source={{ uri: allMediaItems?.[0]?.uri || image }}
                                    style={styles.image}
                                    resizeMode="cover"
                                />
                                {allMediaItems?.[0]?.type === 'video' && (
                                    <View style={[styles.playIconOverlay, { right: 0 }]}>
                                        <Ionicons name="play" size={48} color="#fff" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <View style={[styles.imagePlaceholder, { backgroundColor: '#333' }]}>
                                <View style={{ position: 'absolute', top: 20, right: 40, width: 2, height: 2, backgroundColor: '#FFF' }} />
                                <View style={{ position: 'absolute', top: 50, left: 30, width: 2, height: 2, backgroundColor: '#FFF' }} />
                                <View style={{ position: 'absolute', top: 30, left: 80, width: 3, height: 3, backgroundColor: '#FFF' }} />
                                <Ionicons name={categoryIcon as any} size={64} color="rgba(255,255,255,0.2)" />
                            </View>
                        )}
                    </View>

                    {/* Footer Row */}
                    <View style={styles.footerRow}>
                        <TouchableOpacity onPress={onDelete}>
                            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onEdit}>
                            <Text style={[styles.detailsLink, { fontFamily: handwritingFont }]}>
                                {isUpcoming ? 'Details' : (userReview ? 'Edit Review' : 'Add Memory')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </WobblyCard>
        </View>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusText: {
        color: '#A020F0', // Purple
        fontSize: 18,
        transform: [{ rotate: '-2deg' }]
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    imageContainer: {
        width: '100%',
        height: 180,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        marginBottom: 12,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailsLink: {
        fontSize: 18,
        color: '#000',
        textDecorationLine: 'underline',
        textDecorationColor: '#A020F0',
        textDecorationStyle: 'solid',
    },
    reviewSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
    },
    emojiBadge: {
        fontSize: 18,
    },
    mediaScroll: {
        paddingRight: 20,
    },
    mediaThumbnail: {
        width: 140,
        height: 180,
        marginRight: 10,
        borderRadius: 16,
        backgroundColor: '#eee',
    },
    playIconOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 10,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
    }
});
