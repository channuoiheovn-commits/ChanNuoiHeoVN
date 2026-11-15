// ========================================================
// 👥 THÀNH VIÊN TRẠI (kỹ thuật / công nhân)
// - dangNhapThanhVien: đăng nhập bằng email chủ trại + mã thành viên + PIN
// - layPhienDangNhap: đọc vai trò, mã trại từ vé đăng nhập (có bản lưu dự phòng khi mất mạng)
// - ManHinhQuanLyThanhVien: chủ trại tạo / đổi PIN / khóa / đổi vai trò / xóa thành viên
// ========================================================
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, FlatList, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithCustomToken } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { auth, db, functions } from './FirebaseConfig';

export const TEN_VAI_TRO = {
  CHU_TRAI: 'Chủ trại',
  KY_THUAT: 'Kỹ thuật',
  CONG_NHAN: 'Công nhân',
};

const KHOA_PHIEN = 'phienDangNhap';     // Bản lưu vai trò để dùng khi mở app lúc mất mạng
export const KHOA_GHI_NHO = 'ghiNhoDangNhap'; // Nhớ email chủ trại + mã thành viên cho lần sau

const dichLoi = (e) => {
  const ma = e?.code || '';
  if (ma.includes('network-request-failed') || ma.includes('unavailable')) return 'Mất kết nối mạng. Vui lòng thử lại.';
  return e?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
};

// --------------------------------------------------------
// 🔑 ĐĂNG NHẬP THÀNH VIÊN
// --------------------------------------------------------
export const dangNhapThanhVien = async (emailChuTrai, maThanhVien, pin) => {
  const goi = httpsCallable(functions, 'dangNhapThanhVien');
  let ketQua;
  try {
    ketQua = await goi({ emailChuTrai, maThanhVien, pin });
  } catch (e) {
    throw new Error(dichLoi(e));
  }
  await signInWithCustomToken(auth, ketQua.data.token);
  return {
    emailChuTrai: emailChuTrai.toLowerCase().trim(),
    maThanhVien: maThanhVien.toUpperCase().trim(),
    ten: ketQua.data.ten,
    vaiTro: ketQua.data.vaiTro,
  };
};

// --------------------------------------------------------
// 🪪 PHIÊN ĐĂNG NHẬP: { vaiTro, maTrai, maThanhVien, tenThanhVien, emailChuTrai }
// Tài khoản cũ chưa chuyển đổi (chưa có trại) -> vaiTro = null
// --------------------------------------------------------
export const layPhienDangNhap = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const ve = await user.getIdTokenResult();
    const c = ve.claims || {};
    const phien = {
      vaiTro: c.vaiTro || null,
      maTrai: c.maTrai || null,
      maThanhVien: c.maThanhVien || null,
      tenThanhVien: c.tenThanhVien || '',
      emailChuTrai: c.emailChuTrai || (user.email || '').toLowerCase(),
    };
    await AsyncStorage.setItem(KHOA_PHIEN, JSON.stringify(phien));
    return phien;
  } catch (e) {
    // Mất mạng và vé đã hết hạn -> dùng bản lưu lần trước
    try {
      const luu = await AsyncStorage.getItem(KHOA_PHIEN);
      return luu ? JSON.parse(luu) : null;
    } catch (e2) {
      return null;
    }
  }
};

// --------------------------------------------------------
// 👀 THÀNH VIÊN TỰ THEO DÕI TÀI KHOẢN CỦA MÌNH
// Bị chủ trại khóa hoặc xóa -> gọi onBiThuHoi() để đăng xuất ngay
// --------------------------------------------------------
export const theoDoiTaiKhoanThanhVien = (phien, onBiThuHoi) => {
  if (!phien || !phien.maThanhVien || !phien.maTrai) return () => {};
  return onSnapshot(
    doc(db, 'Trai', phien.maTrai, 'ThanhVien', phien.maThanhVien),
    (snap) => {
      if (!snap.exists()) return onBiThuHoi('Tài khoản thành viên của bạn đã bị xóa khỏi trại.');
      if (snap.data().trangThai !== 'HOAT_DONG') return onBiThuHoi('Tài khoản thành viên của bạn đã bị chủ trại khóa.');
      // Chủ trại đổi vai trò -> vé đăng nhập cũ còn ghi vai trò cũ, bắt đăng nhập lại để nhận quyền mới
      if (phien.vaiTro && snap.data().vaiTro && snap.data().vaiTro !== phien.vaiTro) {
        return onBiThuHoi('Chủ trại vừa đổi vai trò của bạn. Vui lòng đăng nhập lại để cập nhật quyền.');
      }
    },
    (loi) => console.log('Theo dõi tài khoản thành viên lỗi:', loi)
  );
};

// --------------------------------------------------------
// 🧑‍🌾 MÀN HÌNH QUẢN LÝ THÀNH VIÊN (chỉ chủ trại)
// --------------------------------------------------------
export function ManHinhQuanLyThanhVien({ visible, onClose, maTrai, emailChuTrai }) {
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangXuLy, setDangXuLy] = useState(false);

  // Form thêm mới
  const [ma, setMa] = useState('');
  const [ten, setTen] = useState('');
  const [vaiTro, setVaiTro] = useState('KY_THUAT');
  const [pin, setPin] = useState('');

  // Thành viên đang mở rộng để thao tác
  const [dangMo, setDangMo] = useState(null);
  const [pinMoi, setPinMoi] = useState('');

  useEffect(() => {
    if (!visible || !maTrai) return;
    setDangTai(true);
    const huy = onSnapshot(
      collection(db, 'Trai', maTrai, 'ThanhVien'),
      (snap) => {
        const mang = snap.docs.map((d) => ({ ma: d.id, ...d.data() }));
        mang.sort((a, b) => a.ma.localeCompare(b.ma));
        setDanhSach(mang);
        setDangTai(false);
      },
      (loi) => { console.log('Tải thành viên lỗi:', loi); setDangTai(false); }
    );
    return () => huy();
  }, [visible, maTrai]);

  const taoMoi = async () => {
    const maChuan = ma.toUpperCase().trim();
    if (!/^[A-Z0-9]{2,10}$/.test(maChuan)) return Alert.alert('Thông báo', 'Mã thành viên gồm 2–10 ký tự chữ hoặc số, không dấu, không khoảng trắng. VD: KT01');
    if (!ten.trim()) return Alert.alert('Thông báo', 'Vui lòng nhập tên thành viên.');
    if (!/^\d{6}$/.test(pin)) return Alert.alert('Thông báo', 'Mã PIN phải đúng 6 chữ số.');

    setDangXuLy(true);
    try {
      await httpsCallable(functions, 'taoThanhVien')({ maThanhVien: maChuan, ten: ten.trim(), vaiTro, pin });
      setDangXuLy(false);
      Alert.alert(
        'Đã tạo thành viên',
        `Gửi thông tin này cho ${ten.trim()} để đăng nhập:\n\n• Email chủ trại: ${emailChuTrai}\n• Mã thành viên: ${maChuan}\n• Mã PIN: ${pin}`
      );
      setMa(''); setTen(''); setPin(''); setVaiTro('KY_THUAT');
    } catch (e) {
      setDangXuLy(false);
      Alert.alert('Không tạo được', dichLoi(e));
    }
  };

  const capNhat = async (maTV, hanhDong, them = {}, thongBaoXong) => {
    setDangXuLy(true);
    try {
      await httpsCallable(functions, 'capNhatThanhVien')({ maThanhVien: maTV, hanhDong, ...them });
      setDangXuLy(false);
      setPinMoi('');
      if (thongBaoXong) Alert.alert('Xong', thongBaoXong);
    } catch (e) {
      setDangXuLy(false);
      Alert.alert('Không thực hiện được', dichLoi(e));
    }
  };

  const xacNhanXoa = (tv) => {
    Alert.alert('Xóa thành viên', `Xóa ${tv.ma} – ${tv.ten}? Người này sẽ bị đăng xuất và không vào trại được nữa.`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => { setDangMo(null); capNhat(tv.ma, 'XOA', {}, `Đã xóa ${tv.ma}.`); } },
    ]);
  };

  const hienThanhVien = ({ item: tv }) => {
    const moRong = dangMo === tv.ma;
    const biKhoa = tv.trangThai !== 'HOAT_DONG';
    return (
      <View style={s.the}>
        <TouchableOpacity onPress={() => { setDangMo(moRong ? null : tv.ma); setPinMoi(''); }} activeOpacity={0.7}>
          <View style={s.hang}>
            <Text style={s.maTV}>{tv.ma}</Text>
            <Text style={s.tenTV} numberOfLines={1}>{tv.ten}</Text>
            <Text style={[s.nhanVaiTro, tv.vaiTro === 'CONG_NHAN' && { backgroundColor: '#e8f5e9', color: '#2e7d32' }]}>
              {TEN_VAI_TRO[tv.vaiTro] || tv.vaiTro}
            </Text>
          </View>
          {biKhoa && <Text style={s.chuKhoa}>🔒 Đang khóa</Text>}
        </TouchableOpacity>

        {moRong && (
          <View style={s.vungThaoTac}>
            <View style={s.hang}>
              <TextInput style={[s.o, { flex: 1, marginBottom: 0 }]} placeholder="PIN mới (6 số)" placeholderTextColor="#888888"
                value={pinMoi} onChangeText={(t) => setPinMoi(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} />
              <TouchableOpacity style={[s.nutNho, { marginLeft: 8 }]} disabled={dangXuLy}
                onPress={() => /^\d{6}$/.test(pinMoi)
                  ? capNhat(tv.ma, 'DOI_PIN', { pin: pinMoi }, `PIN mới của ${tv.ma}: ${pinMoi}`)
                  : Alert.alert('Thông báo', 'Mã PIN phải đúng 6 chữ số.')}>
                <Text style={s.chuNutNho}>Đổi PIN</Text>
              </TouchableOpacity>
            </View>

            <View style={[s.hang, { marginTop: 10, gap: 8 }]}>
              <TouchableOpacity style={[s.nutNho, { flex: 1 }]} disabled={dangXuLy}
                onPress={() => capNhat(tv.ma, 'DOI_VAI_TRO', { vaiTro: tv.vaiTro === 'KY_THUAT' ? 'CONG_NHAN' : 'KY_THUAT' })}>
                <Text style={s.chuNutNho}>→ {tv.vaiTro === 'KY_THUAT' ? 'Công nhân' : 'Kỹ thuật'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.nutNho, { flex: 1 }]} disabled={dangXuLy}
                onPress={() => capNhat(tv.ma, biKhoa ? 'MO_KHOA' : 'KHOA')}>
                <Text style={s.chuNutNho}>{biKhoa ? '🔓 Mở khóa' : '🔒 Khóa'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.nutNho, { flex: 1, backgroundColor: '#ffebee', borderColor: '#ffcdd2' }]} disabled={dangXuLy}
                onPress={() => xacNhanXoa(tv)}>
                <Text style={[s.chuNutNho, { color: '#c62828' }]}>🗑 Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.nen}>
        <View style={s.dauTrang}>
          <Text style={s.tieuDe}>👥 Quản lý thành viên</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
            <Text style={{ fontSize: 16, color: '#e65100', fontWeight: 'bold' }}>Đóng ✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={danhSach}
          keyExtractor={(tv) => tv.ma}
          renderItem={hienThanhVien}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListHeaderComponent={
            <View style={s.khungTao}>
              <Text style={s.tieuDeNho}>➕ Thêm thành viên</Text>
              <View style={[s.hang, { gap: 8 }]}>
                <TextInput style={[s.o, { width: 95 }]} placeholder="Mã (KT01)" placeholderTextColor="#888888"
                  value={ma} onChangeText={(t) => setMa(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))} autoCapitalize="characters" />
                <TextInput style={[s.o, { flex: 1 }]} placeholder="Tên (VD: Anh Tuấn)" placeholderTextColor="#888888"
                  value={ten} onChangeText={setTen} maxLength={40} />
              </View>
              <View style={[s.hang, { gap: 8 }]}>
                {['KY_THUAT', 'CONG_NHAN'].map((vt) => (
                  <TouchableOpacity key={vt} onPress={() => setVaiTro(vt)}
                    style={[s.nutChon, vaiTro === vt && s.nutChonBat]}>
                    <Text style={[s.chuNutChon, vaiTro === vt && { color: '#ffffff' }]}>{TEN_VAI_TRO[vt]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.ghiChu}>
                {vaiTro === 'KY_THUAT'
                  ? 'Kỹ thuật: xem và thêm dữ liệu, sửa/xóa bản ghi của chính mình trong 24 giờ.'
                  : 'Công nhân: chỉ xem dữ liệu.'}
              </Text>
              <TextInput style={s.o} placeholder="Mã PIN 6 số" placeholderTextColor="#888888"
                value={pin} onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} />
              {dangXuLy ? (
                <ActivityIndicator size="small" color="#e65100" />
              ) : (
                <TouchableOpacity style={s.nutChinh} onPress={taoMoi} activeOpacity={0.7}>
                  <Text style={s.chuNutChinh}>TẠO THÀNH VIÊN</Text>
                </TouchableOpacity>
              )}
              <Text style={[s.tieuDeNho, { marginTop: 22 }]}>
                Danh sách ({danhSach.length}) {dangTai ? '⏳' : ''}
              </Text>
              {!dangTai && danhSach.length === 0 && (
                <Text style={s.ghiChu}>Chưa có thành viên nào.</Text>
              )}
            </View>
          }
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  nen: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  dauTrang: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 0.5, borderColor: '#eeeeee' },
  tieuDe: { fontSize: 18, fontWeight: 'bold', color: '#111111' },
  tieuDeNho: { fontSize: 14, fontWeight: 'bold', color: '#333333', marginBottom: 10 },
  khungTao: { marginBottom: 6 },
  hang: { flexDirection: 'row', alignItems: 'center' },
  o: { borderWidth: 1, borderColor: '#ffd3b6', borderRadius: 6, height: 42, paddingHorizontal: 10, fontSize: 14, color: '#111111', marginBottom: 10, backgroundColor: '#ffffff' },
  nutChon: { flex: 1, borderWidth: 1, borderColor: '#ffd3b6', borderRadius: 6, paddingVertical: 9, alignItems: 'center', marginBottom: 6 },
  nutChonBat: { backgroundColor: '#e65100', borderColor: '#e65100' },
  chuNutChon: { color: '#e65100', fontWeight: '600', fontSize: 13 },
  ghiChu: { fontSize: 12, color: '#777777', marginBottom: 10, lineHeight: 17 },
  nutChinh: { backgroundColor: '#e65100', paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  chuNutChinh: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  the: { borderWidth: 0.5, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: '#fafafa' },
  maTV: { fontWeight: 'bold', fontSize: 14, color: '#e65100', width: 70 },
  tenTV: { flex: 1, fontSize: 14, color: '#111111' },
  nhanVaiTro: { fontSize: 11, fontWeight: 'bold', color: '#e65100', backgroundColor: '#fff0e6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  chuKhoa: { fontSize: 12, color: '#c62828', marginTop: 6 },
  vungThaoTac: { marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderColor: '#e0e0e0' },
  nutNho: { borderWidth: 1, borderColor: '#ffd3b6', backgroundColor: '#fff0e6', borderRadius: 6, paddingVertical: 9, paddingHorizontal: 10, alignItems: 'center', marginLeft: 0 },
  chuNutNho: { color: '#e65100', fontWeight: 'bold', fontSize: 12.5 },
});
