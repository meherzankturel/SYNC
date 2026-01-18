import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import { Input } from './Input';
import { Button } from './Button';
import { Manifestation } from '../services/manifestation.service';
import { DateTimePicker } from './DateTimePicker';
import * as Haptics from 'expo-haptics';

interface ManifestationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    type: 'shared' | 'individual';
    category?: 'travel' | 'relationship' | 'personal' | 'financial' | 'home' | 'career' | 'health' | 'other';
    targetDate?: Date;
    milestones?: string[];
    reminderEnabled: boolean;
    reminderTime?: string;
  }) => Promise<void>;
  editingManifestation?: Manifestation | null;
  loading?: boolean;
}

export default function ManifestationModal({
  visible,
  onClose,
  onSubmit,
  editingManifestation,
  loading = false,
}: ManifestationModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'shared' | 'individual'>('shared');
  const [category, setCategory] = useState<'travel' | 'relationship' | 'personal' | 'financial' | 'home' | 'career' | 'health' | 'other'>('other');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [milestones, setMilestones] = useState<string[]>(['']);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      if (editingManifestation) {
        setTitle(editingManifestation.title || '');
        setDescription(editingManifestation.description || '');
        setType(editingManifestation.type || 'shared');
        setCategory(editingManifestation.category || 'other');
        setTargetDate(
          editingManifestation.targetDate?.toDate
            ? editingManifestation.targetDate.toDate()
            : editingManifestation.targetDate
            ? new Date(editingManifestation.targetDate)
            : null
        );
        setMilestones(
          editingManifestation.milestones && editingManifestation.milestones.length > 0
            ? editingManifestation.milestones
            : ['']
        );
        setReminderEnabled(editingManifestation.reminderEnabled || false);
        setReminderTime(editingManifestation.reminderTime || '20:00');
      } else {
        // Reset for new manifestation
        setTitle('');
        setDescription('');
        setType('shared');
        setCategory('other');
        setTargetDate(null);
        setMilestones(['']);
        setReminderEnabled(false);
        setReminderTime('20:00');
      }
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, editingManifestation]);

  const handleAddMilestone = () => {
    setMilestones([...milestones, '']);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveMilestone = (index: number) => {
    if (milestones.length > 1) {
      const newMilestones = milestones.filter((_, i) => i !== index);
      setMilestones(newMilestones);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleMilestoneChange = (index: number, value: string) => {
    const newMilestones = [...milestones];
    newMilestones[index] = value;
    setMilestones(newMilestones);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your manifestation.');
      return;
    }

    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const validMilestones = milestones.filter((m) => m.trim().length > 0);

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      category,
      targetDate: targetDate || undefined,
      milestones: validMilestones.length > 0 ? validMilestones : undefined,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
    });
  };

  const handleOverlayPress = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        Keyboard.dismiss();
        onClose();
      }}
    >
      <Pressable style={styles.overlay} onPress={handleOverlayPress}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleAnim }],
                opacity: scaleAnim,
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.header}>
                  <Text style={styles.title}>
                    {editingManifestation ? 'Edit Manifestation' : 'New Manifestation'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      onClose();
                    }}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <Input
                  label="Title *"
                  placeholder="What are you manifesting?"
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                />

                <Input
                  label="Description"
                  placeholder="Add details about your goal..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  style={styles.textArea}
                />

                {/* Type Selection */}
                <View style={styles.section}>
                  <Text style={styles.label}>Type</Text>
                  <View style={styles.typeContainer}>
                    <TouchableOpacity
                      style={[styles.typeButton, type === 'shared' && styles.typeButtonActive]}
                      onPress={() => {
                        setType('shared');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Ionicons
                        name="people"
                        size={20}
                        color={type === 'shared' ? '#fff' : theme.colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.typeButtonText,
                          type === 'shared' && styles.typeButtonTextActive,
                        ]}
                      >
                        Shared
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, type === 'individual' && styles.typeButtonActive]}
                      onPress={() => {
                        setType('individual');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Ionicons
                        name="person"
                        size={20}
                        color={type === 'individual' ? '#fff' : theme.colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.typeButtonText,
                          type === 'individual' && styles.typeButtonTextActive,
                        ]}
                      >
                        Individual
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Category Selection */}
                <View style={styles.section}>
                  <Text style={styles.label}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
                    {[
                      { id: 'travel', label: 'Travel', icon: 'airplane', emoji: '✈️' },
                      { id: 'relationship', label: 'Relationship', icon: 'heart', emoji: '💕' },
                      { id: 'personal', label: 'Personal', icon: 'person', emoji: '⭐' },
                      { id: 'financial', label: 'Financial', icon: 'cash', emoji: '💰' },
                      { id: 'home', label: 'Home', icon: 'home', emoji: '🏠' },
                      { id: 'career', label: 'Career', icon: 'briefcase', emoji: '💼' },
                      { id: 'health', label: 'Health', icon: 'fitness', emoji: '💪' },
                      { id: 'other', label: 'Other', icon: 'star', emoji: '✨' },
                    ].map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryButton, category === cat.id && styles.categoryButtonActive]}
                        onPress={() => {
                          setCategory(cat.id as any);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                        <Text
                          style={[
                            styles.categoryButtonText,
                            category === cat.id && styles.categoryButtonTextActive,
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Target Date */}
                <View style={styles.section}>
                  {targetDate ? (
                    <>
                      <DateTimePicker
                        label="Target Date (Optional)"
                        value={targetDate}
                        onChange={(date) => {
                          setTargetDate(date);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        mode="date"
                        minimumDate={new Date()}
                      />
                      <TouchableOpacity
                        style={styles.clearDateButtonContainer}
                        onPress={() => {
                          setTargetDate(null);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                        <Text style={styles.clearDateText}>Clear date</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.label}>Target Date (Optional)</Text>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => {
                          setTargetDate(new Date());
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.dateButtonText}>Select target date</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* Milestones */}
                <View style={styles.section}>
                  <View style={styles.milestoneHeader}>
                    <Text style={styles.label}>Milestones (Optional)</Text>
                    <TouchableOpacity
                      onPress={handleAddMilestone}
                      style={styles.addMilestoneButton}
                    >
                      <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
                      <Text style={styles.addMilestoneText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                  {milestones.map((milestone, index) => (
                    <View key={index} style={styles.milestoneRow}>
                      <Input
                        placeholder={`Milestone ${index + 1}`}
                        value={milestone}
                        onChangeText={(value) => handleMilestoneChange(index, value)}
                        containerStyle={styles.milestoneInput}
                      />
                      {milestones.length > 1 && (
                        <TouchableOpacity
                          onPress={() => handleRemoveMilestone(index)}
                          style={styles.removeMilestoneButton}
                        >
                          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                {/* Reminder */}
                <View style={styles.section}>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                      <Text style={styles.label}>Daily Reminder</Text>
                      <Text style={styles.helperText}>Get notified to check in on your goals</Text>
                    </View>
                    <Switch
                      value={reminderEnabled}
                      onValueChange={setReminderEnabled}
                      trackColor={{ false: theme.colors.divider, true: theme.colors.primaryLight }}
                      thumbColor={reminderEnabled ? theme.colors.primary : theme.colors.textLight}
                    />
                  </View>
                  {reminderEnabled && (
                    <View style={styles.timePickerContainer}>
                      <Text style={styles.timeLabel}>Reminder Time</Text>
                      <View style={styles.timeInputContainer}>
                        <Input
                          value={reminderTime}
                          onChangeText={setReminderTime}
                          placeholder="HH:mm"
                          keyboardType="numeric"
                          containerStyle={styles.timeInput}
                        />
                        <Text style={styles.timeFormatHint}>(e.g., 20:00)</Text>
                      </View>
                    </View>
                  )}
                </View>

                <Button
                  title={editingManifestation ? 'Update Manifestation' : 'Create Manifestation'}
                  onPress={handleSubmit}
                  loading={loading}
                  variant="primary"
                  style={styles.submitButton}
                />
              </ScrollView>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Pressable>

    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
    ...theme.shadows.lg,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
  },
  typeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  dateButtonText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
  },
  clearDateButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  clearDateText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.medium,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  addMilestoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  addMilestoneText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  milestoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeMilestoneButton: {
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  timePickerContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  timeLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  timeInput: {
    flex: 1,
    marginBottom: 0,
  },
  timeFormatHint: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
  categoryContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  categoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.sm,
    minWidth: 80,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  categoryButtonText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: theme.typography.fontWeight.bold,
  },
});

