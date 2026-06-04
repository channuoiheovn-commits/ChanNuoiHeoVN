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
    components
  } = useCalendarContext();
  const currentMonthText = dayjs(currentDate).calendar(calendar).locale(calendar === 'jalali' && !isValidJalaliLocale(locale) ? 'en' : locale).format(monthCaptionFormat === 'full' ? 'MMMM' : 'MMM');
  const handlePress = () => setCalendarView(calendarView === 'month' ? 'day' : 'month');
  if (components !== null && components !== void 0 && components.MonthSelector) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, components.MonthSelector({
      text: currentMonthText,
      isOpen: calendarView === 'month',
      onPress: disableMonthPicker ? () => {} : handlePress
    }));
  }
  return /*#__PURE__*/React.createElement(Pressable, {
    disabled: disableMonthPicker,
    onPress: handlePress,
    testID: "btn-month",
    accessibilityRole: "button",
    accessibilityLabel: currentMonthText
  }, /*#__PURE__*/React.createElement(View, {
    style: styles === null || styles === void 0 ? void 0 : styles.month_selector,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.month_selector
  }, /*#__PURE__*/React.createElement(Text, {
    style: styles === null || styles === void 0 ? void 0 : styles.month_selector_label,
    className: classNames === null || classNames === void 0 ? void 0 : classNames.month_selector_label
  }, currentMonthText)));
};
export default /*#__PURE__*/memo(MonthButton);
//# sourceMappingURL=month-button.js.map