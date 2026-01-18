import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../config/theme';

interface CountdownTimerProps {
    targetDate: Date;
    title?: string;
    subtitle?: string;
}

interface TimeLeft {
    days: number;
    hours: number;
    mins: number;
    secs: number;
}

export default function CountdownTimer({ targetDate, title, subtitle }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, mins: 0, secs: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = targetDate.getTime() - new Date().getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    mins: Math.floor((difference / (1000 * 60)) % 60),
                    secs: Math.floor((difference / 1000) % 60),
                });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const formatNumber = (num: number) => num.toString().padStart(2, '0');

    return (
        <View style={styles.container}>
            {title && <Text style={styles.title}>{title}</Text>}

            <View style={styles.timerRow}>
                <View style={styles.timeBlock}>
                    <Text style={styles.timeValue}>{formatNumber(timeLeft.days)}</Text>
                    <Text style={styles.timeLabel}>DAYS</Text>
                </View>

                <Text style={styles.separator}>:</Text>

                <View style={styles.timeBlock}>
                    <Text style={styles.timeValue}>{formatNumber(timeLeft.hours)}</Text>
                    <Text style={styles.timeLabel}>HOURS</Text>
                </View>

                <Text style={styles.separator}>:</Text>

                <View style={styles.timeBlock}>
                    <Text style={styles.timeValue}>{formatNumber(timeLeft.mins)}</Text>
                    <Text style={styles.timeLabel}>MINS</Text>
                </View>
            </View>

            {subtitle && <Text style={styles.subtitle}>"{subtitle}"</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius['2xl'],
        padding: theme.spacing.lg,
        alignItems: 'center',
    },
    title: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        letterSpacing: 2,
        marginBottom: theme.spacing.md,
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeBlock: {
        alignItems: 'center',
        minWidth: 50,
    },
    timeValue: {
        fontSize: theme.typography.fontSize['4xl'],
        fontWeight: '300',
        color: theme.colors.text,
        letterSpacing: -1,
    },
    timeLabel: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: '500',
        color: theme.colors.textSecondary,
        marginTop: 4,
        letterSpacing: 1,
    },
    separator: {
        fontSize: theme.typography.fontSize['3xl'],
        fontWeight: '300',
        color: theme.colors.textMuted,
        marginHorizontal: theme.spacing.sm,
        paddingBottom: 20,
    },
    subtitle: {
        fontSize: theme.typography.fontSize.sm,
        fontStyle: 'italic',
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.md,
    },
});
