// ========================================================
// ⚖️ Ô NHẬP TỔNG TRỌNG LƯỢNG (kg) — KHÔNG BẮT BUỘC
// Dùng khi Bán heo và Nhập heo mua ngoài. Có lời khuyên nhập để sau này tính năng suất (FCR).
// ========================================================
import React from 'react';
import { View, Text, TextInput } from 'react-native';

// Chuỗi người dùng gõ -> số kg (chấp nhận dấu phẩy thập phân); 0 nếu bỏ trống / sai
export const docKg = (chuoi) => {
  const n = parseFloat(String(chuoi || '').replace(/\s/g, '').replace(',', '.'));
  return isNaN(n) || n <= 0 ? 0 : Math.round(n * 10) / 10;
};
export const hienKg = (kg) => (Number(kg) > 0 ? `${Number(kg).toLocaleString('vi-VN')} kg` : '');

export default function OKg({ value, onChange, soCon, nhan = 'Tổng trọng lượng (kg)', loiKhuyen = 'Không bắt buộc, nhưng nên nhập để app tính được trọng lượng trung bình và năng suất heo (FCR).' }) {
  const kg = docKg(value);
  const n = Number(soCon) || 0;
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#495057' }}>{nhan}</Text>
        <Text style={{ fontSize: 10.5, color: '#8a929a', marginLeft: 6 }}>(không bắt buộc)</Text>
      </View>
      <TextInput value={value} onChangeText={(t) => onChange(t.replace(/[^0-9.,]/g, ''))} keyboardType="decimal-pad" placeholder="VD: 2350"
        placeholderTextColor="#adb5bd"
        style={{ height: 44, borderWidth: 1.5, borderColor: kg > 0 ? '#28a745' : '#ced4da', borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#111111' }} />
      {kg > 0 && n > 0 ? (
        <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#137333', marginTop: 4 }}>≈ {(Math.round((kg / n) * 10) / 10).toLocaleString('vi-VN')} kg/con</Text>
      ) : (
        <Text style={{ fontSize: 10.5, color: '#b26a00', marginTop: 4 }}>💡 {loiKhuyen}</Text>
      )}
    </View>
  );
}