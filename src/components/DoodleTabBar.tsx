import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../config/theme';

export const DoodleTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();
    // Position tab bar above the home indicator / navigation bar
    // Use at least 16px on devices without a home indicator
    const bottomOffset = Math.max(insets.bottom, 16);

    return (
        <View style={[styles.container, { bottom: bottomOffset }]}>
            <BlurView intensity={80} tint="light" style={styles.blurContainer}>
                <View style={styles.tabContainer}>
                    {state.routes
                        .filter(route => ['index', 'moods', 'date-nights', 'games'].includes(route.name))
                        .map((route, index) => {
                            // Find the original index in the state.routes array to check focus correctly
                            const originalIndex = state.routes.findIndex(r => r.key === route.key);
                            const { options } = descriptors[route.key];
                            const isFocused = state.index === originalIndex;

                            const onPress = () => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            };

                            const onLongPress = () => {
                                navigation.emit({
                                    type: 'tabLongPress',
                                    target: route.key,
                                });
                            };

                            return (
                                <TouchableOpacity
                                    key={route.key}
                                    accessibilityRole="button"
                                    accessibilityState={isFocused ? { selected: true } : {}}
                                    accessibilityLabel={options.tabBarAccessibilityLabel}
                                    testID={options.tabBarButtonTestID}
                                    onPress={onPress}
                                    onLongPress={onLongPress}
                                    style={styles.tabButton}
                                >
                                    {isFocused ? (
                                        <View style={styles.activeTabBackground}>
                                            <Ionicons
                                                name={getIconName(route.name, true) as any}
                                                size={theme.components.tabBar.iconSize}
                                                color="#FFFFFF"
                                            />
                                        </View>
                                    ) : (
                                        <Ionicons
                                            name={getIconName(route.name, false) as any}
                                            size={28}
                                            color={theme.colors.textSecondary}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                </View>
            </BlurView>
        </View>
    );
};

// Helper to get icon names based on route
const getIconName = (routeName: string, focused: boolean) => {
    switch (routeName) {
        case 'index':
            return focused ? 'home' : 'home-outline';
        case 'moods':
            return focused ? 'heart' : 'heart-outline';
        case 'date-nights':
            return focused ? 'calendar' : 'calendar-outline';
        case 'games':
            return focused ? 'game-controller' : 'game-controller-outline';
        case 'settings':
            return focused ? 'person' : 'person-outline';
        default:
            return 'help-outline';
    }
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    blurContainer: {
        width: '100%',
        maxWidth: theme.components.tabBar.maxWidth,
        borderRadius: 50,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(232, 224, 240, 0.6)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
            },
            android: {
                elevation: 10,
                backgroundColor: 'rgba(255,255,255,0.9)',
            },
        }),
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    activeTabBackground: {
        backgroundColor: theme.colors.primary,
        width: theme.components.tabBar.activeSize,
        height: theme.components.tabBar.activeSize,
        borderRadius: theme.components.tabBar.activeSize / 2,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: 1.1 }],
        ...Platform.select({
            ios: {
                shadowColor: '#7f13ec',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
});
