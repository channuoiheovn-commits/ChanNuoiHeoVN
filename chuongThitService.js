// chuongThitService.js
// Các hàm dùng chung để ghi / sửa / xóa "sổ cái" ô chuồng thịt thẳng trên Firestore.
// Mỗi dòng sổ cái = 1 document trong collection Chuong_Thit (giống cách Du_Lieu_Goc đang chạy).
// Cloud Function (Robot 7 trong functions/index.js) tự đồng bộ một chiều sang sheet Danh_Sach_Chuong_Thit.

import {
  collection, doc, getDocs, query, where,
  setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp,
} from 'firebase/firestore';

// ⚠️ SỬA dòng này cho đúng chỗ App.js đang import `db` (Firestore) của bạn
import { db } from './FirebaseConfig'; // Trỏ đúng đường dẫn đến file firebase.js của bạn

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
});

// Ghi 1 dòng mới. Trả về dòng đã ghi (cùng hình dạng với mảng danhSachChuongThit trong app)
export const ghiDongMoi = async (d) => {
  const dong = taoDongSoCai(d);
  await setDoc(doc(db, TEN_COLLECTION_CHUONG_THIT, dong.id), {
    ...dong,
    thoiGianNhap: serverTimestamp(), // ngày khách nhập -> cột L trên Sheet
  });
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
    });
  });
  await batch.commit();
  return cacDong;
};

// Sửa 1 dòng theo ID (chỉ đổi các trường truyền vào, giữ nguyên thoiGianNhap)
export const suaDong = (id, thayDoi) =>
  updateDoc(doc(db, TEN_COLLECTION_CHUONG_THIT, String(id)), thayDoi);

// Xóa hẳn 1 dòng theo ID
export const xoaDong = (id) => deleteDoc(doc(db, TEN_COLLECTION_CHUONG_THIT, String(id)));

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
    await batch.commit();
  }
};