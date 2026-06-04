import React, { memo } from 'react';
import dayjs from 'dayjs';
import { Pressable, Text, View } from 'react-native';
import { useCalendarContext } from '../../calendar-context';
import { isValidJalaliLocale } from '../../utils';

const MonthButton = () => {
  const {
    currentDate,
    calendarView,
    setCalendarView,
    calendar = 'gregory',
    locale,
    styles,
    classNames,
    disableMonthPicker,
    monthCaptionFormat,
    components,
  } = useCalendarContext();

  const currentMonthText = dayjs(currentDate)
    .calendar(calendar)
    .locale(
      calendar === 'jalali' && !isValidJalaliLocale(locale) ? 'en' : locale
    )
    .format(monthCaptionFormat === 'full' ? 'MMMM' : 'MMM');

  const handlePress = () =>
    setCalendarView(calendarView === 'month' ? 'day' : 'month');

  if (components?.MonthSelector) {
    return (
      <>
        {components.MonthSelector({
          text: currentMonthText,
          isOpen: calendarView === 'month',
          onPress: disableMonthPicker ? () => {} : handlePress,
        })}
      </>
    );
  }

  return (
    <Pressable
      disabled={disableMonthPicker}
      onPress={handlePress}
      testID="btn-month"
      accessibilityRole="button"
      accessibilityLabel={currentMonthText}
    >
      <View
        style={styles?.month_selector}
        className={classNames?.month_selector}
      >
        <Text
          style={styles?.month_selector_label}
          className={classNames?.month_selector_label}
        >
          {currentMonthText}
        </Text>
      </View>
    </Pressable>
  );
};

export default memo(MonthButton);
