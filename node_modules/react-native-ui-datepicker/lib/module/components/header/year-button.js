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
    components
  } = useCalendarContext();
  const years = getYearRange(currentYear);
  const isYearView = calendarView === 'year';
  const year = formatNumber(parseInt(dayjs(currentDate).calendar(calendar).format('YYYY')), numerals);
  const yearRange = `${formatNumber(years[0] || 0, numerals)} - ${formatNumber(years[years.length - 1] || 0, numerals)}`;
  const label = isYearView ? yearRange : year;
  const handlePress = () => {
    setCalendarView(isYearView ? 'day' : 'year');
    onChangeYear(getDateYear(currentDate));
  };
  if (components !== null && components !== void 0 && components.YearSelector) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, components.YearSelector({
      year,
      yearRange,
      isOpen: isYearView,
      onPress: disableYearPicker ? () => {} : handlePress
    }));
  }
  return /*#__PURE__*/React.createElement(Pressable, {
    disabled: disableYearPicker,
    onPress: handlePress,
    testID: "btn-year",
    accessibilityRole: "button",
    accessibilityLabel: dayjs(currentDate).calendar(calendar).format('YYYY')
  }, /*#__PURE__*/React.createElement(View, {
    style: [defaultStyles.container, styles === null || styles === void 0 ? void 0 : styles.year_selector],
    className: classNames === null || classNames === void 0 ? void 0 : classNames.year_selector
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles === null || styles === void 0 ? void 0 : styles.year_selector_label,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.year_selector_label
  }, label)));
};
export default /*#__PURE__*/memo(YearButton);
const defaultStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});
//# sourceMappingURL=year-button.js.map