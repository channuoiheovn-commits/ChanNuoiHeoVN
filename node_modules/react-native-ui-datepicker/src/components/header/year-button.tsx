import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCalendarContext } from '../../calendar-context';
import { formatNumber, getDateYear, getYearRange } from '../../utils';
import dayjs from 'dayjs';

const YearButton = () => {
  const {
    currentDate,
    calendarView,
    setCalendarView,
    currentYear,
    onChangeYear,
    styles,
    classNames,
    disableYearPicker,
    calendar = 'gregory',
    numerals = 'latn',
    components,
  } = useCalendarContext();

  const years = getYearRange(currentYear);
  const isYearView = calendarView === 'year';

  const year = formatNumber(
    parseInt(dayjs(currentDate).calendar(calendar).format('YYYY')),
    numerals
  );
  const yearRange = `${formatNumber(years[0] || 0, numerals)} - ${formatNumber(years[years.length - 1] || 0, numerals)}`;
  const label = isYearView ? yearRange : year;

  const handlePress = () => {
    setCalendarView(isYearView ? 'day' : 'year');
    onChangeYear(getDateYear(currentDate));
  };

  if (components?.YearSelector) {
    return (
      <>
        {components.YearSelector({
          year,
          yearRange,
          isOpen: isYearView,
          onPress: disableYearPicker ? () => {} : handlePress,
        })}
      </>
    );
  }

  return (
    <Pressable
      disabled={disableYearPicker}
      onPress={handlePress}
      testID="btn-year"
      accessibilityRole="button"
      accessibilityLabel={dayjs(currentDate).calendar(calendar).format('YYYY')}
    >
      <View
        style={[defaultStyles.container, styles?.year_selector]}
        className={classNames?.year_selector}
      >
        <Text
          style={styles?.year_selector_label}
          className={classNames?.year_selector_label}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

export default memo(YearButton);

const defaultStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
