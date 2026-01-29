import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../config/theme';
import { Ionicons } from '@expo/vector-icons';

interface HeartDoodleProps {
    style?: ViewStyle | ViewStyle[];
    color?: string;
    filled?: boolean;
    size?: number;
}

export const HeartDoodle: React.FC<HeartDoodleProps> = ({
    style,
    color = theme.colors.doodlePink,
    filled = true,
    size = 24
}) => {
    if (filled) {
        // Simple shape heart or icon
        return (
            <View style={[styles.container, { width: size, height: size }, style]}>
                <Ionicons name="heart" size={size} color={color} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <Ionicons name="heart-outline" size={size} color={color} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    }
});
