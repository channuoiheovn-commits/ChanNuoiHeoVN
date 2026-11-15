// ========================================================
// 📝 MÀN HÌNH ĐĂNG KÝ TRẠI MỚI + MÀN HÌNH XÁC MINH EMAIL
// Luồng: Đăng ký (email, mật khẩu, tên trại)
//   -> Firebase tạo tài khoản, lưu tên trại vào hồ sơ tài khoản (displayName), gửi email xác minh
//   -> Màn hình chờ xác minh email
//   -> ĐÃ XÁC MINH mới gọi Cloud Function taoTrai (tạo trại, gán quyền CHỦ TRẠI) -> vào app
// => Firestore KHÔNG có dữ liệu nào của tài khoản chưa xác minh.
// ========================================================
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert,
  KeyboardAvoidingView, ScrollView, Platform, StyleSheet,
} from 'react-native';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut, updateProfile } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from './FirebaseConfig';


// Đổi mã lỗi Firebase sang tiếng Việt dễ hiểu
const dichLoi = (e) => {
  const ma = e?.code || '';
  if (ma.includes('email-already-in-use')) return 'Email này đã được đăng ký. Bạn hãy quay lại đăng nhập.';
  if (ma.includes('invalid-email')) return 'Email không hợp lệ.';
  if (ma.includes('weak-password')) return 'Mật khẩu quá yếu, cần ít nhất 6 ký tự.';
  if (ma.includes('network-request-failed')) return 'Mất kết nối mạng. Vui lòng thử lại.';
  if (ma.includes('too-many-requests')) return 'Bạn thao tác quá nhanh. Vui lòng đợi vài phút rồi thử lại.';
  return e?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
};

// ☁️ ĐẢM BẢO TÀI KHOẢN ĐÃ CÓ TRẠI (gọi được nhiều lần, an toàn)
// - Đã có quyền maTrai trong vé đăng nhập -> không làm gì
// - Tài khoản tự đăng ký (có tên trại trong hồ sơ), đã xác minh, chưa có trại -> gọi taoTrai
// - Tài khoản cũ do admin tạo tay (không có tên trại) -> bỏ qua, script chuyển đổi sẽ xử lý
export const damBaoCoTrai = async () => {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return null;
  let ve = await user.getIdTokenResult(true); // true = lấy vé mới, có trạng thái xác minh mới nhất
  if (ve.claims.maTrai) return ve.claims.maTrai;
  if (!user.displayName) return null;

  const taoTrai = httpsCallable(functions, 'taoTrai');
  const ketQua = await taoTrai({ tenTrai: user.displayName });
  await user.getIdToken(true); // Làm mới vé để nhận quyền CHỦ TRẠI vừa gán
  return ketQua.data.maTrai;
};

// --------------------------------------------------------
// 📝 FORM ĐĂNG KÝ
// --------------------------------------------------------
export function ManHinhDangKy({ onQuayLai, onDangKyXong }) {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [nhapLai, setNhapLai] = useState('');
  const [tenTrai, setTenTrai] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);

  const xuLyDangKy = async () => {
    const emailChuan = email.toLowerCase().trim();
    const tenTraiChuan = tenTrai.trim();

    if (!emailChuan) return Alert.alert('Thông báo', 'Vui lòng nhập email.');
    if (matKhau.length < 6) return Alert.alert('Thông báo', 'Mật khẩu cần ít nhất 6 ký tự.');
    if (matKhau !== nhapLai) return Alert.alert('Thông báo', 'Mật khẩu nhập lại không khớp.');
    if (tenTraiChuan.length < 2) return Alert.alert('Thông báo', 'Vui lòng nhập tên trại (ít nhất 2 ký tự).');
    if (tenTraiChuan.length > 60) return Alert.alert('Thông báo', 'Tên trại tối đa 60 ký tự.');

    setDangXuLy(true);
    try {
      // 1. Tạo tài khoản (Firebase tự đăng nhập luôn tài khoản mới)
      auth.languageCode = 'vi'; // Email xác minh gửi bằng tiếng Việt
      const ketQua = await createUserWithEmailAndPassword(auth, emailChuan, matKhau);

      // 2. Lưu tên trại vào hồ sơ tài khoản (chưa ghi gì lên Firestore).
      //    Đổi máy khác để xác minh cũng không mất tên trại.
      await updateProfile(ketQua.user, { displayName: tenTraiChuan });

      // 3. Gửi email xác minh. Trại chỉ được tạo SAU KHI xác minh xong.
      try { await sendEmailVerification(ketQua.user); } catch (e) {}

      setDangXuLy(false);
      onDangKyXong(emailChuan);
    } catch (e) {
      setDangXuLy(false);
      Alert.alert('Không đăng ký được', dichLoi(e));
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.nen}>
      <ScrollView contentContainerStyle={s.khung} keyboardShouldPersistTaps="handled">
        <Text style={s.tieuDe}>ĐĂNG KÝ TRẠI MỚI</Text>
        <Text style={s.phuDe}>Tài khoản này sẽ là Chủ trại, có toàn quyền quản lý và tạo tài khoản cho kỹ thuật, công nhân.</Text>

        <Text style={s.nhan}>Tên trại:</Text>
        <TextInput style={s.o} placeholder="Ví dụ: Trại PigVN" placeholderTextColor="#888888"
          value={tenTrai} onChangeText={setTenTrai} editable={!dangXuLy} maxLength={60} />

        <Text style={s.nhan}>Email:</Text>
        <TextInput style={s.o} placeholder="Email của chủ trại" placeholderTextColor="#888888"
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!dangXuLy} />

        <Text style={s.nhan}>Mật khẩu (ít nhất 6 ký tự):</Text>
        <View style={[s.o, s.hangMatKhau]}>
          <TextInput style={s.oMatKhau} placeholder="Nhập mật khẩu" placeholderTextColor="#888888"
            value={matKhau} onChangeText={setMatKhau} secureTextEntry={!hienMatKhau} autoCapitalize="none" editable={!dangXuLy} />
          <TouchableOpacity onPress={() => setHienMatKhau(!hienMatKhau)} style={{ padding: 6 }}>
            <Text style={{ fontSize: 16 }}>{hienMatKhau ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.nhan}>Nhập lại mật khẩu:</Text>
        <TextInput style={s.o} placeholder="Nhập lại mật khẩu" placeholderTextColor="#888888"
          value={nhapLai} onChangeText={setNhapLai} secureTextEntry={!hienMatKhau} autoCapitalize="none" editable={!dangXuLy} />

        <View style={{ marginTop: 10 }}>
          {dangXuLy ? (
            <ActivityIndicator size="large" color="#e65100" />
          ) : (
            <TouchableOpacity style={s.nutChinh} onPress={xuLyDangKy} activeOpacity={0.7}>
              <Text style={s.chuNutChinh}>ĐĂNG KÝ</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={onQuayLai} disabled={dangXuLy} style={s.nutPhu}>
          <Text style={s.chuNutPhu}>← Đã có tài khoản? Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --------------------------------------------------------
// 📧 MÀN HÌNH CHỜ XÁC MINH EMAIL
// --------------------------------------------------------
export function ManHinhXacMinhEmail({ email, onDaXacMinh, onDangXuat }) {
  const [dangKiemTra, setDangKiemTra] = useState(false);
  const [demNguoc, setDemNguoc] = useState(60); // Chờ 60 giây mới cho gửi lại

  useEffect(() => {
    if (demNguoc <= 0) return;
    const t = setTimeout(() => setDemNguoc(demNguoc - 1), 1000);
    return () => clearTimeout(t);
  }, [demNguoc]);

  const kiemTraDaXacMinh = async () => {
    if (!auth.currentUser) return onDangXuat();
    setDangKiemTra(true);
    try {
      await auth.currentUser.reload(); // Hỏi lại Firebase trạng thái mới nhất
      if (!auth.currentUser.emailVerified) {
        setDangKiemTra(false);
        return Alert.alert('Chưa xác minh', 'Bạn hãy mở email, bấm vào đường link xác minh, rồi quay lại bấm nút này. Nhớ xem cả mục Spam/Thư rác.');
      }
      // Đã xác minh -> bây giờ mới tạo trại trên Firestore
      await damBaoCoTrai();

      setDangKiemTra(false);
      onDaXacMinh(auth.currentUser.email.toLowerCase().trim());
    } catch (e) {
      setDangKiemTra(false);
      Alert.alert('Lỗi', dichLoi(e));
    }
  };

  const guiLai = async () => {
    if (!auth.currentUser) return onDangXuat();
    try {
      auth.languageCode = 'vi';
      await sendEmailVerification(auth.currentUser);
      setDemNguoc(60);
      Alert.alert('Đã gửi', 'Email xác minh mới đã được gửi tới ' + email);
    } catch (e) {
      Alert.alert('Không gửi được', dichLoi(e));
    }
  };

  const dangXuat = async () => {
    try { await signOut(auth); } catch (e) {}
    onDangXuat();
  };

  return (
    <View style={[s.nen, s.khung]}>
      <Text style={{ fontSize: 50, textAlign: 'center', marginBottom: 10 }}>📧</Text>
      <Text style={s.tieuDe}>XÁC MINH EMAIL</Text>
      <Text style={s.phuDe}>
        Chúng tôi đã gửi đường link xác minh tới:{'\n'}
        <Text style={{ fontWeight: 'bold', color: '#111111' }}>{email}</Text>{'\n\n'}
        Mở email, bấm vào đường link, rồi quay lại đây bấm nút bên dưới. Nếu không thấy, hãy xem mục Spam/Thư rác.
      </Text>

      {dangKiemTra ? (
        <ActivityIndicator size="large" color="#e65100" />
      ) : (
        <TouchableOpacity style={s.nutChinh} onPress={kiemTraDaXacMinh} activeOpacity={0.7}>
          <Text style={s.chuNutChinh}>TÔI ĐÃ XÁC MINH</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={guiLai} disabled={demNguoc > 0 || dangKiemTra} style={s.nutPhu}>
        <Text style={[s.chuNutPhu, demNguoc > 0 && { color: '#aaaaaa' }]}>
          {demNguoc > 0 ? `Gửi lại email sau ${demNguoc} giây` : 'Gửi lại email xác minh'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={dangXuat} disabled={dangKiemTra} style={s.nutPhu}>
        <Text style={[s.chuNutPhu, { color: '#777777' }]}>Dùng email khác / Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  nen: { flex: 1, backgroundColor: '#ffffff' },
  khung: { flexGrow: 1, justifyContent: 'center', padding: 30 },
  tieuDe: { fontSize: 20, fontWeight: 'bold', color: '#e65100', textAlign: 'center', marginBottom: 8 },
  phuDe: { fontSize: 13, color: '#555555', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  nhan: { fontWeight: '600', marginBottom: 4, fontSize: 13, color: '#333333' },
  o: { borderWidth: 1, borderColor: '#ffd3b6', borderRadius: 6, height: 44, paddingHorizontal: 12, fontSize: 14, color: '#111111', marginBottom: 15, backgroundColor: '#ffffff' },
  hangMatKhau: { flexDirection: 'row', alignItems: 'center' },
  oMatKhau: { flex: 1, color: '#111111', fontSize: 14, paddingVertical: 0, height: '100%' },
  nutChinh: { backgroundColor: '#e65100', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  chuNutChinh: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  nutPhu: { marginTop: 18, alignItems: 'center' },
  chuNutPhu: { color: '#e65100', fontSize: 14, fontWeight: '600' },
});
