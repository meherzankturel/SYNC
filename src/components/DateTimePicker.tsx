import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { theme } from '../config/theme';
import { Ionicons } from '@expo/vector-icons';

interface DateTimePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time';
  minimumDate?: Date;
}

export function DateTimePicker({
  label,
  value,
  onChange,
  mode = 'date',
  minimumDate,
}: DateTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const formatDisplay = (date: Date): string => {
    if (mode === 'date') {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } else {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

  const handleConfirm = () => {
    onChange(tempValue);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setShowPicker(false);
  };

  // Date picker state
  const [currentMonth, setCurrentMonth] = useState(new Date(tempValue));

  if (mode === 'date') {
    // Calendar month navigation
    const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentMonth(prev => {
        const newDate = new Date(prev);
        if (direction === 'prev') {
          newDate.setMonth(newDate.getMonth() - 1);
        } else {
          newDate.setMonth(newDate.getMonth() + 1);
        }
        return newDate;
      });
    };

    // Get days in current month
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const startDayOfWeek = monthStart.getDay();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const renderCalendarDay = (day: number | null, index: number) => {
      if (day === null) {
        return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
      }

      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = tempValue.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();
      const isDisabled = minimumDate ? date < minimumDate : false;

      return (
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDayCell,
            isSelected && styles.calendarDaySelected,
            isToday && !isSelected && styles.calendarDayToday,
            isDisabled && styles.calendarDayDisabled,
          ]}
          onPress={() => {
            if (!isDisabled) {
              setTempValue(date);
            }
          }}
          disabled={isDisabled}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.calendarDayTextSelected,
            isToday && !isSelected && styles.calendarDayTextToday,
            isDisabled && styles.calendarDayTextDisabled,
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    };

    // Generate calendar days
    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    return (
      <>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setTempValue(value);
            setCurrentMonth(new Date(value));
            setShowPicker(true);
          }}
        >
          <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.buttonText}>{formatDisplay(value)}</Text>
          <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity onPress={handleCancel}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.pickerContainer}
                contentContainerStyle={styles.pickerContentContainer}
              >
                {/* Quick options */}
                <View style={styles.quickOptions}>
                  <TouchableOpacity
                    style={styles.quickOption}
                    onPress={() => {
                      const today = new Date();
                      if (!minimumDate || today >= minimumDate) {
                        setTempValue(today);
                        setCurrentMonth(today);
                      }
                    }}
                  >
                    <Text style={styles.quickOptionText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickOption}
                    onPress={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setTempValue(tomorrow);
                      setCurrentMonth(tomorrow);
                    }}
                  >
                    <Text style={styles.quickOptionText}>Tomorrow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickOption}
                    onPress={() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      setTempValue(nextWeek);
                      setCurrentMonth(nextWeek);
                    }}
                  >
                    <Text style={styles.quickOptionText}>Next Week</Text>
                  </TouchableOpacity>
                </View>

                {/* Calendar */}
                <View style={styles.calendarContainer}>
                  {/* Month Header */}
                  <View style={styles.calendarMonthHeader}>
                      <TouchableOpacity
                      style={styles.calendarNavButton}
                      onPress={() => navigateMonth('prev')}
                    >
                      <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.calendarMonthText}>
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </Text>
                    <TouchableOpacity
                      style={styles.calendarNavButton}
                      onPress={() => navigateMonth('next')}
                    >
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
                      </TouchableOpacity>
                  </View>

                  {/* Week Day Headers */}
                  <View style={styles.calendarWeekHeader}>
                    {weekDays.map(day => (
                      <View key={day} style={styles.calendarWeekDay}>
                        <Text style={styles.calendarWeekDayText}>{day}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Calendar Grid */}
                  <View style={styles.calendarGrid}>
                    {calendarDays.map((day, index) => renderCalendarDay(day, index))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={handleCancel}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Time picker
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);

  // Initialize selected hour/minute when picker opens
  useEffect(() => {
    if (showPicker && mode === 'time') {
      const currentHour = tempValue.getHours();
      const currentMinute = tempValue.getMinutes();
      setSelectedHour(currentHour);
      setSelectedMinute(currentMinute);
      
      // Scroll hour picker
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({
          y: Math.max(0, currentHour * 60 - 100),
          animated: false,
        });
      }, 100);

      // Scroll minute picker
      setTimeout(() => {
        const minuteIndex = Math.floor(currentMinute / 5);
        minuteScrollRef.current?.scrollTo({
          y: Math.max(0, minuteIndex * 50 - 100),
          animated: false,
        });
      }, 150);
    }
  }, [showPicker, mode]);

  // Update tempValue when hour or minute changes
  useEffect(() => {
    if (showPicker && mode === 'time') {
      const newDate = new Date(tempValue);
      newDate.setHours(selectedHour, selectedMinute, 0, 0);
      setTempValue(newDate);
    }
  }, [selectedHour, selectedMinute, showPicker, mode]);

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          setTempValue(value);
          setShowPicker(true);
        }}
      >
        <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.buttonText}>{formatDisplay(value)}</Text>
        <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerWrapper}>
              {/* Scrollable Time Picker - Wheel Style */}
              <View style={styles.timePickerContainer}>
                {/* Hour Scroller (12-hour format with AM/PM) */}
                <View style={styles.scrollerContainer}>
                  <Text style={styles.scrollerLabel}>Hour</Text>
                  <ScrollView
                    ref={hourScrollRef}
                    style={styles.timeScroller}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={60}
                    decelerationRate="fast"
                    contentContainerStyle={styles.scrollerContent}
                    onMomentumScrollEnd={(event) => {
                      const offsetY = event.nativeEvent.contentOffset.y;
                      const hourIndex = Math.round((offsetY + 100) / 60);
                      const clampedHour = Math.max(0, Math.min(23, hourIndex));
                      setSelectedHour(clampedHour);
                    }}
                    onScrollEndDrag={(event) => {
                      const offsetY = event.nativeEvent.contentOffset.y;
                      const hourIndex = Math.round((offsetY + 100) / 60);
                      const clampedHour = Math.max(0, Math.min(23, hourIndex));
                      setSelectedHour(clampedHour);
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour24 = i;
                      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                      const period = hour24 >= 12 ? 'PM' : 'AM';
                      const isSelected = selectedHour === hour24;

                    return (
                      <TouchableOpacity
                          key={i}
                          style={[
                            styles.scrollTimeOption,
                            isSelected && styles.scrollTimeOptionSelected,
                          ]}
                          onPress={() => {
                            setSelectedHour(hour24);
                            // Scroll to position
                            setTimeout(() => {
                              hourScrollRef.current?.scrollTo({
                                y: Math.max(0, hour24 * 60 - 100),
                                animated: true,
                              });
                            }, 50);
                      }}
                    >
                      <Text
                        style={[
                              styles.scrollTimeText,
                              isSelected && styles.scrollTimeTextSelected,
                        ]}
                      >
                            {hour12} {period}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                  </ScrollView>
              </View>

                {/* Minute Scroller (5-minute increments) */}
                <View style={styles.scrollerContainer}>
                  <Text style={styles.scrollerLabel}>Minute</Text>
                  <ScrollView
                    ref={minuteScrollRef}
                    style={styles.timeScroller}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={50}
                    decelerationRate="fast"
                    contentContainerStyle={styles.scrollerContent}
                    onMomentumScrollEnd={(event) => {
                      const offsetY = event.nativeEvent.contentOffset.y;
                      const minuteIndex = Math.round((offsetY + 100) / 50);
                      const clampedIndex = Math.max(0, Math.min(11, minuteIndex));
                      setSelectedMinute(clampedIndex * 5);
                    }}
                    onScrollEndDrag={(event) => {
                      const offsetY = event.nativeEvent.contentOffset.y;
                      const minuteIndex = Math.round((offsetY + 100) / 50);
                      const clampedIndex = Math.max(0, Math.min(11, minuteIndex));
                      setSelectedMinute(clampedIndex * 5);
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const minute = i * 5;
                      const isSelected = selectedMinute === minute;
                      
                  return (
                    <TouchableOpacity
                          key={i}
                      style={[
                            styles.scrollTimeOption,
                            isSelected && styles.scrollTimeOptionSelected,
                      ]}
                      onPress={() => {
                            setSelectedMinute(minute);
                            // Scroll to position
                            setTimeout(() => {
                              minuteScrollRef.current?.scrollTo({
                                y: Math.max(0, i * 50 - 100),
                                animated: true,
                              });
                            }, 50);
                      }}
                    >
                      <Text
                        style={[
                              styles.scrollTimeText,
                              isSelected && styles.scrollTimeTextSelected,
                        ]}
                      >
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                  </ScrollView>
                </View>
              </View>

              {/* Selected time display */}
              <View style={styles.selectedTimeDisplay}>
                <Text style={styles.selectedTimeText}>
                  {formatDisplay(tempValue)}
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleCancel}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirm}
              >
                <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
  },
  buttonText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  pickerContainer: {
    maxHeight: 400,
  },
  pickerContentContainer: {
    padding: theme.spacing.md,
  },
  timePickerWrapper: {
    maxHeight: 400,
    padding: theme.spacing.md,
    justifyContent: 'center',
  },
  quickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  quickOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.divider,
  },
  quickOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  quickOptionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
  },
  quickOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  dateOption: {
    width: '14%',
    aspectRatio: 1,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dateOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  dateOptionDisabled: {
    opacity: 0.3,
  },
  dateOptionDay: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  dateOptionDaySelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  dateOptionDayPast: {
    color: theme.colors.textLight,
  },
  dateOptionDayDisabled: {
    color: theme.colors.textLight,
  },
  dateOptionDate: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
  },
  dateOptionDateSelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  dateOptionDatePast: {
    color: theme.colors.textLight,
  },
  dateOptionDateDisabled: {
    color: theme.colors.textLight,
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  calendarContainer: {
    marginTop: theme.spacing.md,
  },
  calendarMonthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  calendarNavButton: {
    padding: theme.spacing.xs,
  },
  calendarMonthText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  calendarWeekDay: {
    flex: 1,
    alignItems: 'center',
  },
  calendarWeekDayText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: theme.spacing.xs,
  },
  calendarDayText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
  },
  calendarDaySelected: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  calendarDayToday: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: theme.typography.fontWeight.bold,
  },
  calendarDayTextToday: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  calendarDayTextDisabled: {
    color: theme.colors.textLight,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  timeOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.divider,
    minWidth: 60,
    alignItems: 'center',
  },
  timeOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  timeOptionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
  },
  timeOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  modalActions: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.divider,
  },
  modalButtonConfirm: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonTextCancel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
  },
  modalButtonTextConfirm: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#fff',
  },
  timePickerContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    height: 300,
  },
  scrollerContainer: {
    flex: 1,
  },
  scrollerLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  timeScroller: {
    flex: 1,
  },
  scrollerContent: {
    paddingVertical: 100,
  },
  scrollTimeOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  scrollTimeOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
  },
  scrollTimeText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  scrollTimeTextSelected: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  selectedTimeDisplay: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.md,
  },
  selectedTimeText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
});

