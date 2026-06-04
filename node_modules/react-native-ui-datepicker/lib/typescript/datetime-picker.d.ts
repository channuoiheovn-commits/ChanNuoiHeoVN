import type { DateType, DatePickerBaseProps, SingleChange, RangeChange, MultiChange } from './types';
export interface DatePickerSingleProps extends DatePickerBaseProps {
    mode: 'single';
    date?: DateType;
    onChange?: SingleChange;
}
export interface DatePickerRangeProps extends DatePickerBaseProps {
    mode: 'range';
    startDate?: DateType;
    endDate?: DateType;
    onChange?: RangeChange;
    /**
     * When `true`, tapping any date while a complete range (both startDate and
     * endDate) is selected will clear the endDate and begin a fresh selection
     * with the tapped date as the new startDate, regardless of whether the
     * tapped day falls inside the range, on the start, or on the end.
     */
    allowRangeReset?: boolean;
}
export interface DatePickerMultipleProps extends DatePickerBaseProps {
    mode: 'multiple';
    dates?: DateType[];
    onChange?: MultiChange;
}
declare const DateTimePicker: (props: DatePickerSingleProps | DatePickerRangeProps | DatePickerMultipleProps) => JSX.Element;
export default DateTimePicker;
//# sourceMappingURL=datetime-picker.d.ts.map