// ========================================================
// ✍️ DẤU "AI NHẬP / AI SỬA" CHO MỌI BẢN GHI
// - Bản ghi MỚI:  { maTrai, nguoiNhap, tenNguoiNhap, taoLuc }
// - Khi SỬA:      { maTrai, nguoiSua,  tenNguoiSua,  suaLuc }  (giữ nguyên người nhập ban đầu)
// nguoiNhap = mã thành viên (VD: KT01) hoặc 'CHU' nếu chủ trại nhập
// taoLuc dùng cho luật "kỹ thuật được sửa/xóa bản ghi của mình trong 24 giờ"
// Lưu ý: KHÔNG dùng tên thoiGianNhap vì trường đó đang là chuỗi giờ nhập, robot ghi lên Sheet.
// ========================================================
import React from 'react';
import { Text, Alert } from 'react-native';
import { serverTimestamp } from 'firebase/firestore';
import { auth } from './FirebaseConfig';

let phienHienTai = null; // { vaiTro, maTrai, maThanhVien, tenThanhVien }

// App.js gọi mỗi lần render (trước khi vẽ các tab) để các tab luôn đọc đúng phiên
export const datPhienGhi = (phien) => { phienHienTai = phien || null; };

// Xác định người đang thao tác. Nếu phiên chưa kịp nạp (vd: mở app lúc mất mạng),
// đọc thẳng từ tài khoản Firebase: thành viên có uid dạng tv_{maTrai}_{MA}
const layNguoiDangThaoTac = () => {
  if (phienHienTai && phienHienTai.maThanhVien) {
    return { ma: phienHienTai.maThanhVien, ten: phienHienTai.tenThanhVien || '', maTrai: phienHienTai.maTrai };
  }
  const uid = auth.currentUser ? auth.currentUser.uid : '';
  if (uid.startsWith('tv_')) {
    const phan = uid.split('_'); // ['tv', maTrai, MA]
    return { ma: phan[2] || '', ten: '', maTrai: phan[1] || null };
  }
  return { ma: 'CHU', ten: 'Chủ trại', maTrai: phienHienTai ? phienHienTai.maTrai : null };
};

// Dấu cho bản ghi MỚI
export const dauTao = () => {
  const n = layNguoiDangThaoTac();
  const dau = { nguoiNhap: n.ma, tenNguoiNhap: n.ten, taoLuc: serverTimestamp() };
  if (n.maTrai) dau.maTrai = n.maTrai; // Tài khoản cũ chưa có trại: để script chuyển đổi gắn sau
  return dau;
};

// Dấu khi SỬA bản ghi
export const dauSua = () => {
  const n = layNguoiDangThaoTac();
  const dau = { nguoiSua: n.ma, tenNguoiSua: n.ten, suaLuc: serverTimestamp() };
  if (n.maTrai) dau.maTrai = n.maTrai;
  return dau;
};

// Bỏ các trường "người nhập ban đầu" khỏi dữ liệu sửa, để lệnh sửa không bao giờ ghi đè chúng
export const boDauTao = (duLieu) => {
  if (!duLieu || typeof duLieu !== 'object') return duLieu;
  const { nguoiNhap, tenNguoiNhap, taoLuc, ...conLai } = duLieu;
  return conLai;
};

// Hiển thị: "👤 KT01 – Anh Tuấn" (+ "· sửa bởi CHU" nếu người khác sửa)
const tenHienThi = (ma, ten) => {
  if (!ma) return '';
  if (ma === 'CHU') return 'Chủ trại';
  return ten ? `${ma} – ${ten}` : ma;
};

export function NhanNguoiNhap({ item, style, nhan = 'Nhập bởi' }) {
  if (!item || !item.nguoiNhap) return null; // Dữ liệu cũ chưa có thông tin người nhập
  const nhap = tenHienThi(item.nguoiNhap, item.tenNguoiNhap);
  const sua = item.nguoiSua && item.nguoiSua !== item.nguoiNhap ? tenHienThi(item.nguoiSua, item.tenNguoiSua) : '';
  return (
    <Text style={[{ fontSize: 11, color: '#6c757d', marginTop: 3 }, style]} numberOfLines={1}>
      👤 {nhan}: {nhap}{sua ? `  ·  ✏️ sửa bởi: ${sua}` : ''}
    </Text>
  );
}


// ========================================================
// 🔐 QUYỀN THEO VAI TRÒ
// - CHU_TRAI: thêm, sửa, xóa mọi thứ
// - KY_THUAT: thêm; sửa/xóa bản ghi CỦA CHÍNH MÌNH trong 24 giờ
// - CONG_NHAN: chỉ xem
// Tài khoản cũ chưa có trại (chưa chuyển đổi) được coi là chủ trại.
// Đây là lớp chặn trên giao diện; Security Rules (bước D) sẽ chặn thêm ở server.
// ========================================================
const MOT_NGAY_MS = 24 * 60 * 60 * 1000;

export const layVaiTro = () => {
  if (phienHienTai && phienHienTai.vaiTro) return phienHienTai.vaiTro;
  const uid = auth.currentUser ? auth.currentUser.uid : '';
  if (uid.startsWith('tv_')) return 'CONG_NHAN'; // Thành viên mà phiên chưa nạp kịp -> tạm chỉ cho xem
  return 'CHU_TRAI';
};

// taoLuc có thể là Timestamp của Firestore, {seconds} (đọc từ bộ nhớ đệm), hoặc null (vừa tạo, chưa lên server)
const layMiliGiay = (t) => {
  if (!t) return null;
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (typeof t.seconds === 'number') return t.seconds * 1000;
  const ms = Date.parse(t);
  return isNaN(ms) ? null : ms;
};

export const laChuTrai = () => layVaiTro() === 'CHU_TRAI';
export const laCongNhan = () => layVaiTro() === 'CONG_NHAN';
export const duocThem = () => layVaiTro() !== 'CONG_NHAN';

export const duocSuaXoa = (item) => {
  const vaiTro = layVaiTro();
  if (vaiTro === 'CHU_TRAI') return true;
  if (vaiTro !== 'KY_THUAT' || !item) return false;
  const toi = layNguoiDangThaoTac();
  if (item.nguoiNhap !== toi.ma) return false;          // Không phải bản ghi của mình
  const ms = layMiliGiay(item.taoLuc);
  if (ms === null) return true;                          // Vừa tạo xong, chưa có giờ server
  return Date.now() - ms < MOT_NGAY_MS;
};

// Dùng ở đầu các hàm lưu/sửa/xóa: không đủ quyền -> báo và trả về true để dừng
// hanhDong: 'them' | 'sua' | 'xoa' | 'chuTrai'
export const chanNeuKhongDuQuyen = (hanhDong, item) => {
  let lyDo = '';
  if (hanhDong === 'them' && !duocThem()) {
    lyDo = 'Tài khoản Công nhân chỉ được xem dữ liệu.';
  } else if ((hanhDong === 'sua' || hanhDong === 'xoa') && !duocSuaXoa(item)) {
    lyDo = laCongNhan()
      ? 'Tài khoản Công nhân chỉ được xem dữ liệu.'
      : 'Kỹ thuật chỉ được sửa hoặc xóa bản ghi do chính mình nhập, trong vòng 24 giờ.';
  } else if (hanhDong === 'chuTrai' && !laChuTrai()) {
    lyDo = 'Chỉ chủ trại mới được thực hiện thao tác này.';
  }
  if (!lyDo) return false;
  Alert.alert('Không đủ quyền', lyDo);
  return true;
};

// Dòng thông báo cho công nhân ở đầu các tab
export function NhanChiXem({ style }) {
  if (!laCongNhan()) return null;
  return (
    <Text style={[{ fontSize: 12, color: '#6c757d', backgroundColor: '#f1f3f5', padding: 8, borderRadius: 6, marginBottom: 10, textAlign: 'center' }, style]}>
      👁️ Tài khoản Công nhân: chỉ xem dữ liệu
    </Text>
  );
}

// Mã trại của phiên đăng nhập hiện tại (null nếu tài khoản chưa có trại)
export const layMaTrai = () => layNguoiDangThaoTac().maTrai || null;
