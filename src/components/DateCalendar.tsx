import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../config/theme';
import { Ionicons } from '@expo/vector-icons';
import { DateNight } from '../services/dateNight.service';

interface DateCalendarProps {
  dateNights: DateNight[];
  onDateSelect?: (dateNight: DateNight) => void;
  selectedDate?: DateNight;
}

export default function DateCalendar({ dateNights, onDateSelect, selectedDate }: DateCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get days in current month
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const startDayOfWeek = monthStart.getDay();

  // Group date nights by date - only show upcoming, non-completed dates
  const datesWithEvents = useMemo(() => {
    const map = new Map<string, DateNight[]>();
    const now = new Date();
    
    dateNights.forEach(night => {
      // Skip completed dates and dates without valid dates
      if (night.completed || !night.date) {
        return;
      }
      
      try {
        const date = night.date?.toDate ? night.date.toDate() : new Date(night.date);
        if (isNaN(date.getTime())) return; // Skip invalid dates
        
        // Only show upcoming dates (or today's dates) on the calendar
        // If date is in the past and not today, skip it
        const isToday = date.toDateString() === now.toDateString();
        const isFuture = date > now;
        
        if (!isToday && !isFuture) {
          return; // Skip past dates (completed or not)
        }
        
        // Use consistent date key format (year-month-day)
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(night);
      } catch (e) {
        console.warn('Error parsing date in calendar:', e);
      }
    });
    return map;
  }, [dateNights]);

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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isDateToday = (day: number) => {
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    const currentDay = day;
    const currentMonthIndex = currentMonth.getMonth();
    const currentYear = currentMonth.getFullYear();
    
    const isToday = currentDay === todayDate &&
                    currentMonthIndex === todayMonth &&
                    currentYear === todayYear;
    
    return isToday;
  };

  const hasDateNight = (day: number) => {
    // Ensure consistent date key format matching the map keys
    const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${day}`;
    return datesWithEvents.has(dateKey);
  };

  const getDateNightForDay = (day: number): DateNight | null => {
    // Ensure consistent date key format matching the map keys
    const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${day}`;
    const events = datesWithEvents.get(dateKey);
    return events && events.length > 0 ? events[0] : null;
  };

  const isDateUpcoming = (day: number) => {
    const today = new Date();
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    // Check if date is in the future
    const isFuture = checkDate > today;
    
    // Check if it has an event
    const hasEvent = hasDateNight(day);
    
    // Check if it's not today
    const isToday = isDateToday(day);
    
    return isFuture && hasEvent && !isToday;
  };

  const renderDay = (day: number, index: number) => {
    const hasEvent = hasDateNight(day);
    const isToday = isDateToday(day);
    const isUpcoming = isDateUpcoming(day);
    const dateNight = getDateNightForDay(day);
    const isSelected = selectedDate?.id === dateNight?.id;

    // Priority: Today should ALWAYS be highlighted, even if selected or has event
    // Today's highlight takes highest priority - always visible
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          // Today's highlight is always applied first - ALWAYS visible
          isToday && styles.todayCell,
          // Event background only if not today
          hasEvent && !isToday && !isUpcoming && !isSelected && styles.dayWithEvent,
          // Upcoming highlight only if not today
          isUpcoming && !isToday && !isSelected && styles.upcomingCell,
          // Regular dates without events get a subtle background
          !hasEvent && !isToday && !isUpcoming && !isSelected && styles.dayCellRegular,
          // Selected style (but today's border remains visible)
          isSelected && !isToday && styles.selectedDay,
          // If today is selected, use special combined style
          isToday && isSelected && styles.todaySelectedCell,
        ]}
        onPress={() => {
          if (dateNight && onDateSelect) {
            onDateSelect(dateNight);
          } else if (isToday && !hasEvent) {
            // Allow clicking today even if no event - could open "add event" modal
            // For now, just allow it to be visible and clickable
          }
        }}
        disabled={!hasEvent && !isToday}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dayText,
          // Today text style - always applied if today
          isToday && !isSelected && styles.todayText,
          // Upcoming text only if not today
          isUpcoming && !isToday && !isSelected && styles.upcomingText,
          // Selected text (white) only if not today
          isSelected && !isToday && styles.selectedDayText,
          // If today is selected, use selected text style (white) but keep today's background
          isToday && isSelected && styles.todaySelectedText,
          // Event text only if not today or selected
          hasEvent && !isToday && !isUpcoming && !isSelected && styles.dayTextWithEvent,
        ]}>
          {day}
        </Text>
        {hasEvent && (
          <View style={[
            styles.eventDot,
            isToday && !isSelected && styles.eventDotToday,
            isToday && isSelected && styles.eventDotTodaySelected,
            isUpcoming && !isToday && !isSelected && styles.eventDotUpcoming,
            isSelected && !isToday && styles.eventDotSelected,
          ]} />
        )}
      </TouchableOpacity>
    );
  };

  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <View style={styles.container}>
      {/* Month Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <View style={styles.monthContainer}>
          <Text style={styles.monthText}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <Text style={styles.eventsCount}>
            {dateNights.filter(night => {
              if (night.completed || !night.date) return false;
              try {
                const date = night.date?.toDate ? night.date.toDate() : new Date(night.date);
                const now = new Date();
                const isToday = date.toDateString() === now.toDateString();
                const isFuture = date > now;
                return (isToday || isFuture) &&
                       date.getMonth() === currentMonth.getMonth() &&
                       date.getFullYear() === currentMonth.getFullYear();
              } catch {
                return false;
              }
            }).length} upcoming dates this month
          </Text>
        </View>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Ionicons name="chevron-forward" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Week Day Headers */}
      <View style={styles.weekHeader}>
        {weekDays.map(day => (
          <View key={day} style={styles.weekDay}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <View key={index} style={styles.dayCell} />;
          }
          return renderDay(day, index);
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.secondary }]} />
          <Text style={styles.legendText}>Upcoming dates</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.eventDot]} />
          <Text style={styles.legendText}>Date booked</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  navButton: {
    padding: theme.spacing.xs,
  },
  monthContainer: {
    alignItems: 'center',
    flex: 1,
  },
  monthText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  eventsCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text,
    marginTop: 2,
    fontWeight: theme.typography.fontWeight.medium,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: theme.spacing.xs,
  },
  dayCellRegular: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
  },
  dayText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
  dayWithEvent: {
    backgroundColor: theme.colors.primary + '25', // More vibrant primary background for booked dates
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  dayTextWithEvent: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  todayCell: {
    backgroundColor: theme.colors.primary + '60', // More vibrant primary background for today
    borderRadius: theme.borderRadius.sm,
    borderWidth: 3, // Thicker border for better visibility
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    // Force today to always be visible
    zIndex: 10,
  },
  todayText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.base + 2, // Larger for better visibility
  },
  todaySelectedCell: {
    // When today is selected, use vibrant solid primary background
    backgroundColor: theme.colors.primary, // Solid primary when selected
    borderWidth: 3,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 10,
  },
  todaySelectedText: {
    color: '#fff',
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.base + 1,
  },
  eventDotTodaySelected: {
    backgroundColor: '#fff',
  },
  upcomingCell: {
    backgroundColor: theme.colors.secondary + '30', // More vibrant secondary color for upcoming dates
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.secondary,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  upcomingText: {
    color: theme.colors.secondary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  selectedDay: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: theme.typography.fontWeight.bold,
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  eventDotToday: {
    backgroundColor: theme.colors.primary,
  },
  eventDotUpcoming: {
    backgroundColor: theme.colors.secondary,
  },
  eventDotSelected: {
    backgroundColor: '#fff',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

