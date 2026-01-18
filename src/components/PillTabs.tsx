import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../config/theme';
import { Ionicons } from '@expo/vector-icons';

interface Tab {
    key: string;
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
}

interface PillTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (key: string) => void;
}

export default function PillTabs({ tabs, activeTab, onTabChange }: PillTabsProps) {
    return (
        <View style={styles.container}>
            {tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, isActive && styles.tabActive]}
                        onPress={() => onTabChange(tab.key)}
                        activeOpacity={0.8}
                    >
                        {tab.icon && (
                            <Ionicons
                                name={tab.icon}
                                size={16}
                                color={isActive ? theme.colors.text : theme.colors.textSecondary}
                                style={styles.icon}
                            />
                        )}
                        <Text style={[styles.label, isActive && styles.labelActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.pill,
        padding: 4,
        gap: 4,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: theme.borderRadius.pill,
    },
    tabActive: {
        backgroundColor: theme.colors.primary,
    },
    icon: {
        marginRight: 6,
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    labelActive: {
        color: theme.colors.text,
    },
});
