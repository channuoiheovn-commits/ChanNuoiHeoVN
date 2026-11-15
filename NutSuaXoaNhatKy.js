// ========================================================
// ✏️🗑 NÚT SỬA / XÓA CHO NHẬT KÝ TOÀN BỘ Ô CHUỒNG
// - Quân số: sửa số con + ghi chú (giữ nguyên dấu +/− và tuần tuổi của dòng)
// - Cám: sửa số bao + ghi chú
// - Luân chuyển gồm 2 dòng đi cặp (trừ ô đi, cộng ô đến) nên sửa/xóa 2 dòng cùng lúc
// Quyền: chủ trại mọi dòng; kỹ thuật dòng của mình trong 24 giờ; công nhân không có nút.
// ========================================================
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { suaDong, xoaDong, suaNhieuDong, xoaNhieuDong } from './chuongThitService';
import { duocSuaXoa, chanNeuKhongDuQuyen } from './nguoiNhap';
import OKg, { docKg } from './OKg'; // ⚖️ sửa tổng kg khi bán / nhập heo mua ngoài

// Tìm dòng đi cặp của 1 dòng luân chuyển: số con đối nhau, khác ô chuồng, được ghi cùng lúc
// (2 dòng luân chuyển được tạo liền nhau nên mã id CT_<thời điểm>_ cách nhau rất ít)
// Dòng luân chuyển: có nhãn LUAN_CHUYEN, hoặc dữ liệu cũ có ghi chú mang dấu 🚚
export const laDongLuanChuyen = (d) => !!d && (d.suKienHeoThit === 'LUAN_CHUYEN' || String(d.ghiChu || '').includes('🚚'));
const thoiDiemTaoId = (id) => { const m = String(id || '').match(/^CT_(\d+)_/); return m ? Number(m[1]) : null; };
// Ưu tiên mã chung maLuanChuyen (luân chuyển từ bản mới); dữ liệu cũ chưa có mã thì đoán như trước.
export const timDongCap = (log, tatCa) => {
  if (!laDongLuanChuyen(log)) return null;
  if (log.maLuanChuyen) {
    return (Array.isArray(tatCa) ? tatCa : []).find((d) => d && d.id !== log.id && d.maLuanChuyen === log.maLuanChuyen) || null;
  }
  const t = thoiDiemTaoId(log.id);
  const ung = (Array.isArray(tatCa) ? tatCa : []).filter((d) =>
    d && d.id !== log.id && laDongLuanChuyen(d)
    && Number(d.soCon) === -Number(log.soCon)
    && `${d.tenKhu}_${d.tenChuong}` !== `${log.tenKhu}_${log.tenChuong}`);
  if (t === null) return ung.find((d) => String(d.ngayNhapChuong) === String(log.ngayNhapChuong)) || null;
  return ung
    .map((d) => ({ d, lech: Math.abs((thoiDiemTaoId(d.id) ?? Infinity) - t) }))
    .filter((x) => x.lech <= 10000)
    .sort((a, b) => a.lech - b.lech)[0]?.d || null;
};

export default function NutSuaXoaNhatKy({ log, loai = 'QUAN_SO', danhSachChuongThit, setDanhSachChuongThit, setDongBoStatus }) {
  const [moSua, setMoSua] = useState(false);
  const [so, setSo] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [kg, setKg] = useState('');
  const [dangLuu, setDangLuu] = useState(false);

  if (!log || !log.id || !duocSuaXoa(log)) return null;

  const laCam = loai === 'CAM';
  const truongVatTu = log.suKienHeoThit === 'TIEM_VACCINE' ? 'soLieuVaccine' : 'soBaoCam'; // dòng chích thuốc lưu số liều ở soLieuVaccine
  const laLuanChuyen = laDongLuanChuyen(log);
  const dongCap = laLuanChuyen ? timDongCap(log, danhSachChuongThit) : null;
  // Dòng có kg: bán heo, hoặc nhập heo mua ngoài (không phải heo từ Chờ xếp)
  const coKg = !laCam && (log.suKienHeoThit === 'BAN_HEO' || (log.suKienHeoThit === 'NHAP_HEO' && log.nguon !== 'CHO_XEP' && Number(log.soCon) > 0));

  const capNhatState = (ham) => { if (typeof setDanhSachChuongThit === 'function') setDanhSachChuongThit((prev) => ham(Array.isArray(prev) ? prev : [])); };

  const moForm = () => {
    if (chanNeuKhongDuQuyen('sua', log)) return;
    setSo(String(Math.abs(Number(laCam ? log[truongVatTu] : log.soCon) || 0)));
    setGhiChu(log.ghiChu || '');
    setKg(Number(log.tongKg) > 0 ? String(log.tongKg) : '');
    setMoSua(true);
  };

  const luu = async () => {
    const n = parseFloat(String(so).replace(',', '.')) || 0;
    if (n <= 0) return Alert.alert('Thông báo', laCam ? (truongVatTu === 'soLieuVaccine' ? 'Số liều phải lớn hơn 0.' : 'Số bao cám phải lớn hơn 0.') : 'Số con phải lớn hơn 0.');
    setDangLuu(true);
    if (typeof setDongBoStatus === 'function') setDongBoStatus('⏳ Đang sửa nhật ký...');
    try {
      const thayDoi = laCam
        ? { [truongVatTu]: n, ghiChu }
        : { soCon: Number(log.soCon) < 0 ? -n : n, ghiChu, ...(coKg ? { tongKg: docKg(kg) } : {}) };
      const thayDoiCap = dongCap ? { soCon: Number(dongCap.soCon) < 0 ? -n : n } : null;
      // Cặp luân chuyển: sửa 2 dòng trong 1 lần ghi -> hoặc cả 2 cùng đổi, hoặc không dòng nào (không bao giờ lệch)
      if (dongCap) await suaNhieuDong([{ id: log.id, thayDoi }, { id: dongCap.id, thayDoi: thayDoiCap }]);
      else await suaDong(log.id, thayDoi);
      capNhatState((ds) => ds.map((d) => (d.id === log.id ? { ...d, ...thayDoi } : (dongCap && d.id === dongCap.id ? { ...d, ...thayDoiCap } : d))));
      setDangLuu(false);
      if (typeof setDongBoStatus === 'function') setDongBoStatus('✅ Đã sửa nhật ký');
      setMoSua(false);
    } catch (e) {
      setDangLuu(false);
      Alert.alert('Lỗi', 'Không sửa được, vui lòng kiểm tra mạng và thử lại.');
    }
  };

  const xoa = () => {
    if (chanNeuKhongDuQuyen('xoa', log)) return;
    Alert.alert(
      'Xóa dòng nhật ký',
      dongCap
        ? `Đây là dòng luân chuyển. Xóa sẽ xóa cả 2 dòng (${log.tenChuong} và ${dongCap.tenChuong}) để số heo 2 ô chuồng không bị lệch.`
        : (laLuanChuyen
          ? 'Không tìm thấy dòng đi cặp ở ô chuồng bên kia (dữ liệu cũ). Xóa dòng này thì số heo ô bên kia sẽ không đổi theo — hãy kiểm tra lại ô đó sau khi xóa.'
          : 'Xóa dòng này? Số liệu ô chuồng và báo cáo sẽ tính lại.'),
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive', onPress: async () => {
            if (typeof setDongBoStatus === 'function') setDongBoStatus('⏳ Đang xóa...');
            try {
              // Cặp luân chuyển: xóa 2 dòng trong 1 lần ghi -> hoặc cả 2 cùng mất, hoặc không dòng nào
              if (dongCap) await xoaNhieuDong([log.id, dongCap.id]);
              else await xoaDong(log.id);
              capNhatState((ds) => ds.filter((d) => d.id !== log.id && (!dongCap || d.id !== dongCap.id)));
              if (typeof setDongBoStatus === 'function') setDongBoStatus('✅ Đã xóa');
            } catch (e) {
              Alert.alert('Lỗi', 'Không xóa được, vui lòng kiểm tra mạng và thử lại.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
      <TouchableOpacity onPress={moForm} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, backgroundColor: '#fff8e1', borderWidth: 1, borderColor: '#ffe082' }}>
        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#b58100' }}>✏️ Sửa</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={xoa} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca' }}>
        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#dc3545' }}>🗑 Xóa</Text>
      </TouchableOpacity>

      <Modal visible={moSua} transparent animationType="fade" onRequestClose={() => setMoSua(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 18 }}>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#1a1f23', marginBottom: 2 }}>Sửa nhật ký</Text>
            <Text style={{ fontSize: 11.5, color: '#8a929a', marginBottom: 12 }}>
              {`${log.tenKhu} - Ô ${log.tenChuong} · ${log.ngayNhapChuong}`}{!laCam ? ` · ${log.tuanTuoi} tuần` : ''}
              {dongCap ? `\nDòng luân chuyển: ô ${dongCap.tenChuong} sẽ được sửa cùng.` : ''}
            </Text>

            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#495057', marginBottom: 4 }}>
              {laCam ? (truongVatTu === 'soLieuVaccine' ? 'Số liều thuốc:' : 'Số bao cám:') : (Number(log.soCon) < 0 ? 'Số con (xuất / giảm):' : 'Số con (nhập / tăng):')}
            </Text>
            <TextInput value={so} onChangeText={(t) => setSo(t.replace(/[^0-9.,]/g, ''))} keyboardType="decimal-pad"
              style={{ height: 44, borderWidth: 1.5, borderColor: '#ced4da', borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#111111', marginBottom: 12 }} />

            {coKg && <OKg value={kg} onChange={setKg} soCon={so} nhan={log.suKienHeoThit === 'BAN_HEO' ? 'Tổng trọng lượng bán (kg)' : 'Tổng trọng lượng heo nhập (kg)'} />}

            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#495057', marginBottom: 4 }}>Ghi chú:</Text>
            <TextInput value={ghiChu} onChangeText={setGhiChu} multiline
              style={{ minHeight: 44, borderWidth: 1, borderColor: '#ced4da', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#111111', marginBottom: 14 }} />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => setMoSua(false)} disabled={dangLuu}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#f1f3f5' }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#495057' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={luu} disabled={dangLuu}
                style={{ flex: 1.4, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#b58100', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                {dangLuu && <ActivityIndicator size="small" color="#ffffff" />}
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>LƯU</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}