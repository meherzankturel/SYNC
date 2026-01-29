import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../config/theme';
import { HeartDoodle } from './HeartDoodle';
import { SparklesDoodle } from './SparklesDoodle';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ResponsiveUtils } from '../../utils/responsive';

const { width } = Dimensions.get('window');

interface NoPartnerStateProps {
    title?: string;
    subtitle?: string;
    compact?: boolean;
}

export const NoPartnerState: React.FC<NoPartnerStateProps> = ({
    title = "Partner Up",
    subtitle = "Connect with your partner to share moods, memories, and stay close no matter the distance.",
    compact = false
}) => {
    const router = useRouter();

    const handleConnect = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/invite');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Background Doodles */}
            <HeartDoodle
                style={[
                    styles.doodleHeart,
                    { top: compact ? 20 : 80, left: '10%', transform: [{ rotate: '-15deg' }, { scale: 0.8 }] }
                ]}
                color={theme.colors.doodlePink}
                filled
            />
            <HeartDoodle
                style={[
                    styles.doodleHeart,
                    { top: compact ? 40 : 120, right: '15%', transform: [{ rotate: '10deg' }, { scale: 0.6 }] }
                ]}
                color={theme.colors.doodlePurple}
            />
            <SparklesDoodle
                style={[
                    styles.doodleSparkle,
                    { bottom: compact ? 100 : 200, left: '20%' }
                ]}
                color={theme.colors.accentGold}
            />

            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>

                <Text style={styles.subtitle}>
                    {subtitle}
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleConnect}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Connect Partner</Text>
                    <Ionicons name="arrow-forward" size={ResponsiveUtils.moderateScale(20)} color="#FFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        position: 'relative',
        minHeight: 400, // Ensure minimum height for doodles
    },
    content: {
        alignItems: 'center',
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
        padding: 32,
        borderRadius: 32,
        width: '100%',
        maxWidth: 400,
        // Glassmorphism-ish border
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    title: {
        fontFamily: theme.typography.fontFamily.rounded,
        fontSize: ResponsiveUtils.fontScale(32),
        color: theme.colors.text,
        marginBottom: ResponsiveUtils.verticalScale(12),
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: ResponsiveUtils.fontScale(16),
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: ResponsiveUtils.verticalScale(24),
        marginBottom: ResponsiveUtils.verticalScale(32),
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: ResponsiveUtils.verticalScale(16),
        paddingHorizontal: ResponsiveUtils.scale(32),
        borderRadius: ResponsiveUtils.moderateScale(16),
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        width: '100%',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontFamily: theme.typography.fontFamily.bold,
        fontSize: ResponsiveUtils.fontScale(18),
    },
    doodleHeart: {
        position: 'absolute',
        opacity: 0.6,
    },
    doodleSparkle: {
        position: 'absolute',
        opacity: 0.8,
    }
});
