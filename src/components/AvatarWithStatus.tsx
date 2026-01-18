import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { theme } from '../config/theme';

interface AvatarWithStatusProps {
    imageUrl?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isOnline?: boolean;
    showStatus?: boolean;
    mood?: string;
    moodEmoji?: string;
}

const SIZES = {
    sm: { avatar: 32, status: 10, emoji: 14 },
    md: { avatar: 48, status: 14, emoji: 18 },
    lg: { avatar: 64, status: 16, emoji: 22 },
    xl: { avatar: 80, status: 20, emoji: 28 },
};

export default function AvatarWithStatus({
    imageUrl,
    name,
    size = 'md',
    isOnline = false,
    showStatus = true,
    mood,
    moodEmoji,
}: AvatarWithStatusProps) {
    const dimensions = SIZES[size];
    const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

    return (
        <View style={[styles.container, { width: dimensions.avatar, height: dimensions.avatar }]}>
            {/* Avatar Ring */}
            <View
                style={[
                    styles.ring,
                    {
                        width: dimensions.avatar,
                        height: dimensions.avatar,
                        borderRadius: dimensions.avatar / 2,
                    },
                ]}
            >
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={[
                            styles.image,
                            {
                                width: dimensions.avatar - 6,
                                height: dimensions.avatar - 6,
                                borderRadius: (dimensions.avatar - 6) / 2,
                            },
                        ]}
                    />
                ) : (
                    <View
                        style={[
                            styles.placeholder,
                            {
                                width: dimensions.avatar - 6,
                                height: dimensions.avatar - 6,
                                borderRadius: (dimensions.avatar - 6) / 2,
                            },
                        ]}
                    >
                        <Text style={[styles.initials, { fontSize: dimensions.avatar / 3 }]}>
                            {initials}
                        </Text>
                    </View>
                )}
            </View>

            {/* Status Indicator */}
            {showStatus && (
                <View
                    style={[
                        styles.statusDot,
                        {
                            width: dimensions.status,
                            height: dimensions.status,
                            borderRadius: dimensions.status / 2,
                            backgroundColor: isOnline ? theme.colors.online : theme.colors.offline,
                            right: 0,
                            bottom: 0,
                        },
                    ]}
                />
            )}

            {/* Mood Emoji Badge */}
            {moodEmoji && (
                <View
                    style={[
                        styles.moodBadge,
                        {
                            right: -4,
                            top: -4,
                        },
                    ]}
                >
                    <Text style={{ fontSize: dimensions.emoji }}>{moodEmoji}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    ring: {
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
    },
    image: {
        backgroundColor: theme.colors.surface,
    },
    placeholder: {
        backgroundColor: theme.colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: {
        color: theme.colors.text,
        fontWeight: '600',
    },
    statusDot: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    moodBadge: {
        position: 'absolute',
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: 2,
    },
});
