import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';

interface SyncLogoHeaderProps {
    onSettingsPress?: () => void;
    onLogoutPress?: () => void;
    onMapPress?: () => void;
    showButtons?: boolean;
    userProfileImage?: string | null;
}

export const SyncLogoHeader: React.FC<SyncLogoHeaderProps> = ({
    onSettingsPress,
    onLogoutPress,
    onMapPress,
    showButtons = true,
    userProfileImage,
}) => {
    return (
        <View style={styles.header}>
            {/* SYNC Logo */}
            <View style={styles.logoContainer}>
                <Image
                    source={require('../../assets/sync_logo_v2.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
            </View>

            {/* Header Buttons */}
            {showButtons && (
                <View style={styles.headerButtons}>
                    {onMapPress && (
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={onMapPress}
                        >
                            <Ionicons name="map-outline" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    )}
                    {onSettingsPress && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={onSettingsPress}
                            >
                                {userProfileImage ? (
                                    <Image
                                        source={{ uri: userProfileImage }}
                                        style={styles.profileIcon}
                                    />
                                ) : (
                                    <Ionicons name="person-circle-outline" size={26} color={theme.colors.text} />
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={onSettingsPress}
                            >
                                <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>
                    )}
                    {onLogoutPress && (
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={onLogoutPress}
                        >
                            <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'transparent',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoImage: {
        width: 100,
        height: 40,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 4,
    },
    headerButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: theme.colors.divider,
    },
});

export default SyncLogoHeader;
