import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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

  const handwritingFont = Platform.OS === 'ios' ? 'Noteworthy-Bold' : 'sans-serif-medium';

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

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
          isToday && styles.todayCell,
          isUpcoming && !isToday && styles.upcomingCell,
          hasEvent && !isToday && !isUpcoming && styles.availableCell,
          isSelected && !isToday && styles.selectedDay,
        ]}
        onPress={() => {
          if (dateNight && onDateSelect) {
            onDateSelect(dateNight);
          }
        }}
        disabled={!hasEvent && !isToday}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dayText,
          { fontFamily: handwritingFont },
          isToday && styles.todayText,
          isUpcoming && !isToday && styles.upcomingText,
          isSelected && !isToday && styles.selectedDayText,
          hasEvent && !isToday && !isUpcoming && styles.availableText,
        ]}>
          {day}
        </Text>
        {hasEvent && (
          <View style={[
            styles.eventDot,
            isToday && styles.eventDotToday,
            isUpcoming && styles.eventDotUpcoming,
            isSelected && styles.eventDotSelected,
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
          <Text style={[styles.monthText, { fontFamily: handwritingFont }]}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
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
        {weekDays.map((day, idx) => (
          <View key={`${day}-${idx}`} style={styles.weekDay}>
            <Text style={[styles.weekDayText, { fontFamily: handwritingFont }]}>{day}</Text>
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
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={[styles.legendText, { fontFamily: handwritingFont }]}>Today</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.secondary + '60' }]} />
          <Text style={[styles.legendText, { fontFamily: handwritingFont }]}>Upcoming</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary + '40' }]} />
          <Text style={[styles.legendText, { fontFamily: handwritingFont }]}>Available</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#000',
    padding: theme.spacing.md,
    // Organic shape for Doodle UI
    borderTopLeftRadius: 24,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 28,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
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
    marginVertical: 2,
  },
  dayText: {
    fontSize: 18,
    color: '#333',
  },
  todayCell: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    transform: [{ rotate: '-2deg' }],
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  upcomingCell: {
    backgroundColor: theme.colors.secondary + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.secondary,
  },
  upcomingText: {
    color: theme.colors.secondary,
  },
  availableCell: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: 12,
  },
  availableText: {
    color: theme.colors.primary,
  },
  selectedDay: {
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
  },
  selectedDayText: {
    fontWeight: 'bold',
  },
  eventDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  eventDotToday: {
    backgroundColor: '#fff',
  },
  eventDotUpcoming: {
    backgroundColor: theme.colors.secondary,
  },
  eventDotSelected: {
    backgroundColor: '#000',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#444',
  },
});

