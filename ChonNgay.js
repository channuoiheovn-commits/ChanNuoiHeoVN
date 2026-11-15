// ========================================================
// 📅 Ô CHỌN NGÀY DÙNG CHUNG (giống lúc chọn ngày Phối)
// Bấm vào ngày -> bật lịch dạng cửa sổ.
// value / onChange dùng chuỗi dd/mm/yyyy như phần còn lại của app.
// ========================================================
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { formatVNDate, parseToDateObject } from './DateUtils';

const tenNgay = (chuoi) => {
  const homNay = formatVNDate(new Date());
  const homQua = formatVNDate(new Date(Date.now() - 86400000));
  if (chuoi === homNay) return 'Hôm nay';
  if (chuoi === homQua) return 'Hôm qua';
  return '';
};

export default function ChonNgay({ value, onChange, mau = '#e65100', nhan = 'Ngày thực hiện', choPhepTuongLai = false }) {
  const [moLich, setMoLich] = useState(false);
  const ngay = value || formatVNDate(new Date());
  const ten = tenNgay(ngay);
  return (
    <View style={{ marginBottom: 12 }}>
      {nhan ? <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#495057', marginBottom: 5 }}>{nhan}</Text> : null}
      <TouchableOpacity activeOpacity={0.7} onPress={() => setMoLich(true)}
        style={{ height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: mau, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: '#1a1f23' }}>{ngay}</Text>
        <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: mau }}>{ten ? `${ten} · Đổi ▾` : 'Đổi ▾'}</Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={moLich}
        mode="date"
        display="inline"
        locale="vi"
        date={parseToDateObject(ngay) || new Date()}
        maximumDate={choPhepTuongLai ? undefined : new Date()}
        onConfirm={(d) => { setMoLich(false); onChange(formatVNDate(d)); }}
        onCancel={() => setMoLich(false)}
        confirmTextIOS="Xác nhận"
        cancelTextIOS="Hủy"
      />
    </View>
  );
}