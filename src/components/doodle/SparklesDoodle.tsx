import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../config/theme';
import { Ionicons } from '@expo/vector-icons';

interface SparklesDoodleProps {
    style?: ViewStyle | ViewStyle[];
    color?: string;
    size?: number;
}

export const SparklesDoodle: React.FC<SparklesDoodleProps> = ({
    style,
    color = theme.colors.doodlePurple,
    size = 16
}) => {
    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <Ionicons name="sparkles" size={size} color={color} style={{ opacity: 0.8 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    }
});
