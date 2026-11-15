// ========================================================
// 🔐 BƯỚC 0: CỔNG PHIÊN BẢN TỐI THIỂU
// Đọc Firestore: Cau_Hinh_App/phienBan
//   { toiThieu: "5.0", thongBao: "...", linkAndroid: "...", linkIOS: "..." }
// Nếu bản app đang chạy thấp hơn "toiThieu" -> khóa màn hình, yêu cầu cập nhật.
// Mất mạng hoặc chưa có document -> cho vào bình thường (không chặn nhầm khách).
// ========================================================
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './FirebaseConfig';

// So sánh "5.0" với "5.10": trả về số âm nếu a < b
const soSanhPhienBan = (a, b) => {
  const pa = String(a || '0').split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b || '0').split('.').map(n => parseInt(n, 10) || 0);
  const dai = Math.max(pa.length, pb.length);
  for (let i = 0; i < dai; i++) {
    const hieu = (pa[i] || 0) - (pb[i] || 0);
    if (hieu !== 0) return hieu;
  }
  return 0;
};

export default function CongPhienBan({ children }) {
  const [canCapNhat, setCanCapNhat] = useState(null); // null = chưa chặn

  useEffect(() => {
    const kiemTra = async () => {
      try {
        const phienBanDangChay = Constants.expoConfig?.version || '0';
        const snap = await getDoc(doc(db, 'Cau_Hinh_App', 'phienBan'));
        if (!snap.exists()) return;
        const cauHinh = snap.data();
        if (cauHinh.toiThieu && soSanhPhienBan(phienBanDangChay, cauHinh.toiThieu) < 0) {
          setCanCapNhat({ ...cauHinh, phienBanDangChay });
        }
      } catch (e) {
        // Mất mạng: bỏ qua, không chặn khách
      }
    };
    kiemTra();
  }, []);

  if (!canCapNhat) return children;

  const link = Platform.OS === 'ios' ? canCapNhat.linkIOS : canCapNhat.linkAndroid;

  return (
    <View style={styles.khung}>
      <Text style={styles.icon}>🐷</Text>
      <Text style={styles.tieuDe}>Cần cập nhật PigVN</Text>
      <Text style={styles.noiDung}>
        {canCapNhat.thongBao ||
          'Phiên bản bạn đang dùng đã cũ. Vui lòng cập nhật lên bản mới nhất để tiếp tục sử dụng và bảo vệ dữ liệu trại.'}
      </Text>
      <Text style={styles.phienBan}>
        Bản hiện tại: {canCapNhat.phienBanDangChay} • Yêu cầu tối thiểu: {canCapNhat.toiThieu}
      </Text>
      {!!link && (
        <TouchableOpacity style={styles.nut} onPress={() => Linking.openURL(link)}>
          <Text style={styles.chuNut}>Cập nhật ngay</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  khung: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#ffffff' },
  icon: { fontSize: 50, marginBottom: 10 },
  tieuDe: { fontSize: 20, fontWeight: 'bold', color: '#111111', marginBottom: 12 },
  noiDung: { fontSize: 15, color: '#333333', textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  phienBan: { fontSize: 12, color: '#777777', marginBottom: 25 },
  nut: { backgroundColor: '#e65100', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 },
  chuNut: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
