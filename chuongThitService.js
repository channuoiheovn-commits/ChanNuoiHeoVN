// chuongThitService.js
// Các hàm dùng chung để ghi / sửa / xóa "sổ cái" ô chuồng thịt thẳng trên Firestore.
// Mỗi dòng sổ cái = 1 document trong collection Chuong_Thit (giống cách Du_Lieu_Goc đang chạy).
// Cloud Function (Robot 7 trong functions/index.js) tự đồng bộ một chiều sang sheet Danh_Sach_Chuong_Thit.

import { Alert } from 'react-native';
import {
  collection, doc, getDocs, query, where,
  setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp,
} from 'firebase/firestore';

// ⚠️ SỬA dòng này cho đúng chỗ App.js đang import `db` (Firestore) của bạn
import { db } from './FirebaseConfig'; // Trỏ đúng đường dẫn đến file firebase.js của bạn
import { dauTao, dauSua, boDauTao } from './nguoiNhap'; // ✍️ Dấu ai nhập / ai sửa

export const TEN_COLLECTION_CHUONG_THIT = 'Chuong_Thit';

// ID có thể sắp xếp theo thời gian (màn hình lịch sử đang sắp xếp theo id, dòng mới nhất lên đầu).
// Luôn tăng dần trên cùng 1 máy, đuôi ngẫu nhiên để 2 máy không bao giờ trùng nhau.
let msCuoiCung = 0;
export const taoIdDongMoi = () => {
  let ms = Date.now();
  if (ms <= msCuoiCung) ms = msCuoiCung + 1;
  msCuoiCung = ms;
  const duoi = Math.random().toString(36).slice(2, 5).toUpperCase().padEnd(3, '0');
  return `CT_${ms}_${duoi}`;
};

const chuoi = (v) => (v === undefined || v === null ? '' : String(v).trim());
const so = (v) => Number(v) || 0;

// Chuẩn hóa 1 dòng sổ cái (Firestore không nhận giá trị undefined)
export const taoDongSoCai = (d) => ({
  id: d.id || taoIdDongMoi(),
  userEmail: chuoi(d.userEmail),
  tenKhu: chuoi(d.tenKhu),
  tenChuong: chuoi(d.tenChuong),
  soCon: so(d.soCon),               // số dương = nhập, số âm = xuất / hao hụt / dọn
  tuanTuoi: so(d.tuanTuoi),
  ngayNhapChuong: chuoi(d.ngayNhapChuong),
  ghiChu: chuoi(d.ghiChu),
  soBaoCam: so(d.soBaoCam),
  soLieuVaccine: so(d.soLieuVaccine),
  suKienHeoThit: chuoi(d.suKienHeoThit),
  ...(d.nguon ? { nguon: chuoi(d.nguon) } : {}), // 📦 'CHO_XEP' = heo xếp vào từ "Chờ xếp chuồng"
  ...(d.tinhBaoCao ? { tinhBaoCao: true } : {}), // 📊 Nhập / bán / hao hụt thật -> đổi báo cáo theo tuần tuổi
  ...(so(d.tongKg) > 0 ? { tongKg: so(d.tongKg) } : {}), // ⚖️ tổng kg khi bán / nhập heo mua ngoài (không bắt buộc)
  ...(d.maLuanChuyen ? { maLuanChuyen: chuoi(d.maLuanChuyen) } : {}),
  luongMoi: true, // 🆕 dòng ghi từ bản 5.1 (tab Đàn Heo). Dòng không có nhãn này = dữ liệu bản cũ
  ...(d.maDoiChieu ? { maDoiChieu: chuoi(d.maDoiChieu) } : {}), // 🔗 cặp dòng đối chiếu heo cũ (bỏ gắn = xóa cả cặp) // 🔗 2 dòng của cùng 1 lần luân chuyển dùng chung mã này
});

// ⏱ KHÔNG ĐỂ NÚT LƯU QUAY MÃI: Firestore ghi vào máy NGAY (danh sách tự hiện dòng mới), còn lời xác nhận
// từ máy chủ có lúc về chậm (mạng chập chờn, kết nối mới mở app). Chờ tối đa 2,5 giây: máy chủ báo lỗi trong lúc đó
// thì báo lỗi như thường; quá 2,5 giây thì coi như đã lưu (lệnh ghi vẫn nằm hàng đợi, có mạng tự gửi lên).
// Nếu sau đó máy chủ từ chối, hiện thông báo để khách biết.
const CHO_XAC_NHAN_MS = 2500;
const choGhi = (lenhGhi) => new Promise((xong, loi) => {
  let daTraLoi = false;
  const hen = setTimeout(() => { daTraLoi = true; xong(); }, CHO_XAC_NHAN_MS);
  lenhGhi.then(
    () => { clearTimeout(hen); if (!daTraLoi) { daTraLoi = true; xong(); } },
    (e) => {
      clearTimeout(hen);
      if (!daTraLoi) { daTraLoi = true; loi(e); return; }
      console.log('❌ Máy chủ từ chối lệnh ghi Chuong_Thit:', e);
      Alert.alert('Chưa lưu được', 'Thao tác vừa rồi chưa lưu được lên máy chủ, vui lòng kiểm tra lại và nhập lại.\n\n' + String((e && (e.code || e.message)) || ''));
    }
  );
});

// Ghi 1 dòng mới. Trả về dòng đã ghi (cùng hình dạng với mảng danhSachChuongThit trong app)
export const ghiDongMoi = async (d) => {
  const dong = taoDongSoCai(d);
  await choGhi(setDoc(doc(db, TEN_COLLECTION_CHUONG_THIT, dong.id), {
    ...dong,
    thoiGianNhap: serverTimestamp(), // ngày khách nhập -> cột L trên Sheet
    ...dauTao(), // ✍️
  }));
  return dong;
};

// Ghi nhiều dòng trong 1 lô: hoặc thành công hết, hoặc không dòng nào (tối đa 500 dòng)
export const ghiNhieuDong = async (danhSach) => {
  const cacDong = danhSach.map(taoDongSoCai);
  const batch = writeBatch(db);
  cacDong.forEach((dong) => {
    batch.set(doc(db, TEN_COLLECTION_CHUONG_THIT, dong.id), {
      ...dong,
      thoiGianNhap: serverTimestamp(),
      ...dauTao(), // ✍️
    });
  });
  await choGhi(batch.commit());
  return cacDong;
};

// Sửa 1 dòng theo ID (chỉ đổi các trường truyền vào, giữ nguyên thoiGianNhap)
export const suaDong = (id, thayDoi) =>
  choGhi(updateDoc(doc(db, TEN_COLLECTION_CHUONG_THIT, String(id)), { ...boDauTao(thayDoi), ...dauSua() })); // ✍️

// Sửa nhiều dòng trong 1 lô: hoặc thành công hết, hoặc không dòng nào (dùng cho cặp dòng luân chuyển)
export const suaNhieuDong = async (cacThayDoi) => {
  const batch = writeBatch(db);
  const dau = dauSua(); // ✍️
  cacThayDoi.forEach(({ id, thayDoi }) => batch.update(doc(db, TEN_COLLECTION_CHUONG_THIT, String(id)), { ...boDauTao(thayDoi), ...dau }));
  await choGhi(batch.commit());
};

// Mã chung cho 2 dòng của 1 lần luân chuyển
export const taoMaLuanChuyen = () => `LC_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// Xóa hẳn 1 dòng theo ID
export const xoaDong = (id) => choGhi(deleteDoc(doc(db, TEN_COLLECTION_CHUONG_THIT, String(id))));

// Lấy toàn bộ dòng của 1 ô chuồng (chỉ lọc bằng dấu =, không cần tạo index)
export const layDongCuaChuong = async (userEmail, tenKhu, tenChuong) => {
  const q = query(
    collection(db, TEN_COLLECTION_CHUONG_THIT),
    where('userEmail', '==', chuoi(userEmail)),
    where('tenKhu', '==', chuoi(tenKhu)),
    where('tenChuong', '==', chuoi(tenChuong))
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
};

// Xóa nhiều dòng theo danh sách ID (chia lô 400 dòng)
export const xoaNhieuDong = async (cacId) => {
  for (let i = 0; i < cacId.length; i += 400) {
    const batch = writeBatch(db);
    cacId.slice(i, i + 400).forEach((id) => {
      batch.delete(doc(db, TEN_COLLECTION_CHUONG_THIT, String(id)));
    });
    await choGhi(batch.commit());
  }
};