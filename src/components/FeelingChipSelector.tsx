import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../config/theme';
import { FeelingChip, FEELING_CHIPS } from '../services/gentleDays.service';
import * as Haptics from 'expo-haptics';

interface FeelingChipSelectorProps {
  selectedChips: FeelingChip[];
  onChipToggle: (chip: FeelingChip) => void;
  disabled?: boolean;
}

export default function FeelingChipSelector({
  selectedChips,
  onChipToggle,
  disabled = false,
}: FeelingChipSelectorProps) {
  const handleChipPress = (chip: FeelingChip) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChipToggle(chip);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chipContainer}
      >
        {FEELING_CHIPS.map((chip) => {
          const isSelected = selectedChips.includes(chip.id);
          return (
            <TouchableOpacity
              key={chip.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                disabled && styles.chipDisabled,
              ]}
              onPress={() => handleChipPress(chip.id)}
              disabled={disabled}
              accessible={true}
              accessibilityLabel={chip.label}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={styles.emoji}>{chip.emoji}</Text>
              <Text
                style={[
                  styles.chipLabel,
                  isSelected && styles.chipLabelSelected,
                  disabled && styles.chipLabelDisabled,
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
  },
  chipLabelSelected: {
    color: theme.colors.surface,
  },
  chipLabelDisabled: {
    color: theme.colors.textLight,
  },
  emoji: {
    fontSize: theme.typography.fontSize.base,
  },
});

