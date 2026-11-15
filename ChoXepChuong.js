// ========================================================
// 📦 CHỜ XẾP CHUỒNG
// = Heo có trong báo cáo theo tuần tuổi nhưng chưa xếp vào ô chuồng.
// Hiện trên sơ đồ như 1 ô chuồng (ô đầu tiên). Mở ra có 4 nút giống ô thường:
// - Nhập Heo: heo mua từ ngoài, cộng vào báo cáo (dòng sổ cái tenKhu = 'CHO_XEP', tinhBaoCao = true)
// - Bán / Hao hụt: trừ báo cáo (dòng sổ cái tenKhu = 'CHO_XEP', tinhBaoCao = true)
// - Luân Chuyển: xếp vào ô chuồng, báo cáo KHÔNG đổi (dòng sổ cái nguon = 'CHO_XEP')
// Không xếp cũng được, heo cứ nằm ở đây.
// ========================================================
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Animated, Easing } from 'react-native';
import { formatVNDate, parseToDateObject } from './DateUtils';
import { ghiDongMoi } from './chuongThitService';
import { chanNeuKhongDuQuyen, duocThem } from './nguoiNhap';
import { KHU_CHO_XEP, TEN_CHUONG_CHO_XEP, tuoiDongChuong } from './SoHeoThit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ChonNgay from './ChonNgay'; // 📅 chọn ngày dạng cửa sổ
import OKg, { docKg, hienKg } from './OKg'; // ⚖️ tổng kg không bắt buộc

const TEN_HD = { NHAP_HEO: 'Nhập Heo', XEP: 'Luân Chuyển', BAN_HEO: 'Bán Heo', HAO_HUT: 'Hao Hụt', XOA_HEO: 'Xóa Heo' };
const MAU_HD = { NHAP_HEO: '#007bff', XEP: '#e65100', BAN_HEO: '#28a745', HAO_HUT: '#dc3545', XOA_HEO: '#6c757d' };


// Danh sách khu / ô chuồng thật từ sổ cái (dùng cho "Xếp vào chuồng" ở nơi không có sẵn sơ đồ)
export const layDanhSachKhu = (danhSachChuongThit) => {
  const kho = {};
  (Array.isArray(danhSachChuongThit) ? danhSachChuongThit : []).forEach((d) => {
    if (!d || !d.tenChuong || d.tenKhu === KHU_CHO_XEP) return;
    if (['VAO_CAM', 'TIEM_VACCINE', 'DON_CHUONG'].includes(d.suKienHeoThit)) return;
    const tenKhu = String(d.tenKhu || 'Cai Sữa').trim();
    const tenChuong = String(d.tenChuong).trim();
    kho[tenKhu] = kho[tenKhu] || {};
    kho[tenKhu][tenChuong] = (kho[tenKhu][tenChuong] || 0) + (Number(d.soCon) || 0);
  });
  return Object.keys(kho).sort((a, b) => b.localeCompare(a)).map((tenKhu) => ({
    tenKhu,
    danhSachChuongCuaKhu: Object.keys(kho[tenKhu])
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map((tenChuong) => ({ tenChuong, tongSoCon: Math.max(0, kho[tenKhu][tenChuong]) })),
  }));
};

// Báo cáo gom tuần: dưới 3 tuần tính vào ô 3, trên 30 tuần tính vào ô 30
const kepTuanBaoCao = (t) => Math.min(30, Math.max(2, t));

// Những nơi đang có heo đúng tuần (theo ô báo cáo): Chờ xếp chuồng + từng ô chuồng thật
// Mỗi ô chuồng tách theo tuổi thật (VD ô 30 tuần có thể gồm heo 31, 32 tuần)
export const layNoiCoHeoTheoTuan = (tuan, choXepTheoTuoi, danhSachChuongThit) => {
  const ketQua = [];
  const nhomCho = (Array.isArray(choXepTheoTuoi) ? choXepTheoTuoi : []).find((x) => x.tuoi === tuan);
  if (nhomCho && nhomCho.soCon > 0) ketQua.push({ khoa: 'CHO_XEP', laChoXep: true, ten: 'Ô heo chưa sắp xếp chuồng', tuoiThat: tuan, soCon: nhomCho.soCon });
  const kho = {};
  (Array.isArray(danhSachChuongThit) ? danhSachChuongThit : []).forEach((d) => {
    if (!d || !d.tenChuong || String(d.tenKhu || '').trim() === KHU_CHO_XEP) return;
    if (['VAO_CAM', 'TIEM_VACCINE', 'DON_CHUONG'].includes(d.suKienHeoThit)) return;
    const so = Number(d.soCon) || 0;
    if (so === 0) return;
    const tuoi = tuoiDongChuong(d);
    if (tuoi <= 0 || kepTuanBaoCao(tuoi) !== tuan) return;
    const tenKhu = String(d.tenKhu || 'Cai Sữa').trim();
    const tenChuong = String(d.tenChuong).trim();
    const khoa = `${tenKhu}|${tenChuong}|${tuoi}`;
    if (!kho[khoa]) kho[khoa] = { khoa, laChoXep: false, tenKhu, tenChuong, ten: `${tenKhu} - Ô ${tenChuong}`, tuoiThat: tuoi, soCon: 0 };
    kho[khoa].soCon += so;
  });
  Object.values(kho).filter((x) => x.soCon > 0)
    .sort((a, b) => a.ten.localeCompare(b.ten, undefined, { numeric: true }) || a.tuoiThat - b.tuoiThat)
    .forEach((x) => ketQua.push(x));
  return ketQua;
};

// ========================================================
// 🪟 CỬA SỔ THAO TÁC: Nhập đàn / Xếp vào chuồng / Bán / Hao hụt
// Dùng ở khung Chờ xếp chuồng (tab ô chuồng) và khi chạm ô tuần ở Báo cáo theo tuần tuổi.
// tuoiBanDau: chọn sẵn tuần tuổi (hoặc điền sẵn tuần khi Nhập đàn)
// ========================================================
// 🟧 1 ô tuần tuổi dùng chung (ngoài Ô heo chưa sắp xếp + trong form Bán / Hao hụt / Luân chuyển / Xóa): nhìn giống hệt nhau
export const OTuanChoXep = ({ nhom, chon, onPress }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress}
    style={{ width: '23%', paddingVertical: 4, paddingHorizontal: 2, alignItems: 'center', backgroundColor: chon ? '#e65100' : '#fff4e5', borderWidth: chon ? 2 : 1, borderColor: chon ? '#bf360c' : '#ffb74d', borderRadius: 7 }}>
    <Text style={{ fontSize: 12.5, fontWeight: '900', color: chon ? '#ffffff' : '#e65100' }}>{nhom.tuoi} Tuần</Text>
    <Text style={{ fontSize: 11, fontWeight: 'bold', color: chon ? '#ffffff' : '#1a1f23' }}>{nhom.soCon} con</Text>
  </TouchableOpacity>
);

export function ModalThaoTacHeo({ nhung, visible, hanhDong, tuoiBanDau, choXepTheoTuoi, danhSachKhu, danhSachChuongThit, userEmail, onClose, onDaGhi, setDongBoStatus }) {
  const [tuoiChon, setTuoiChon] = useState(null);
  const [soCon, setSoCon] = useState('');
  const [chuongChon, setChuongChon] = useState(null); // { tenKhu, tenChuong }
  const [dangLuu, setDangLuu] = useState(false);
  const [tuoiNhap, setTuoiNhap] = useState('');
  const [ngayNhap, setNgayNhap] = useState('');
  const [noiChon, setNoiChon] = useState(null);
  const [tongKg, setTongKg] = useState(''); // ⚖️ khi bán / nhập heo mua ngoài // khoa nơi lấy heo khi bán / hao hụt từ báo cáo

  const ds = Array.isArray(choXepTheoTuoi) ? choXepTheoTuoi : [];
  const khu = Array.isArray(danhSachKhu) ? danhSachKhu : [];
  const nhomChon = ds.find((x) => x.tuoi === tuoiChon);
  const setMoModal = (mo) => { if (!mo && typeof onClose === 'function') onClose(); };

  // Bán / Hao hụt mở từ Báo cáo theo tuần tuổi: cho chọn lấy heo từ Chờ xếp hay từ ô chuồng nào
  const laChonNoi = (hanhDong === 'BAN_HEO' || hanhDong === 'HAO_HUT' || hanhDong === 'XOA_HEO') && !!tuoiBanDau && Array.isArray(danhSachChuongThit);
  const dsNoi = laChonNoi ? layNoiCoHeoTheoTuan(tuoiBanDau, ds, danhSachChuongThit) : [];
  const noi = dsNoi.find((x) => x.khoa === noiChon) || null;

  // Mỗi lần mở: điền sẵn theo tuần được chạm
  useEffect(() => {
    if (!visible) return;
    const nhom = ds.find((x) => x.tuoi === tuoiBanDau);
    setTuoiChon(nhom ? nhom.tuoi : null);
    setSoCon(nhom && hanhDong === 'XEP' ? String(nhom.soCon) : '');
    setChuongChon(null);
    setTuoiNhap(hanhDong === 'NHAP_HEO' && tuoiBanDau ? String(tuoiBanDau) : '');
    setNgayNhap(formatVNDate(new Date()));
    setTongKg('');
    setNoiChon(dsNoi.length === 1 ? dsNoi[0].khoa : null);
  }, [visible, hanhDong, tuoiBanDau]);

  const chonNhom = (nhom) => {
    setTuoiChon(nhom.tuoi);
    setSoCon(hanhDong === 'XEP' ? String(nhom.soCon) : '');
  };

  const luu = async () => {
    const n = parseInt(soCon, 10) || 0;
    const ngayGhi = (ngayNhap || formatVNDate(new Date())).trim();
    if (!parseToDateObject(ngayGhi)) return Alert.alert('Thông báo', 'Ngày không đúng dạng ngày/tháng/năm.');
    const tuanLui = tuoiDongChuong({ tuanTuoi: 1, ngayNhapChuong: ngayGhi }) - 1; // ngày chọn cách hôm nay bao nhiêu tuần
    const kg = docKg(tongKg);
    const coKg = (hanhDong === 'BAN_HEO' || hanhDong === 'NHAP_HEO') && kg > 0 ? { tongKg: kg } : {};
    if (hanhDong === 'NHAP_HEO') {
      // 🛒 Nhập đàn: heo mua / nhập từ ngoài -> cộng báo cáo, nằm ở chờ xếp chuồng
      const tuoi = parseInt(tuoiNhap, 10) || 0;
      if (tuoi < 1 || tuoi > 30) return Alert.alert('Thông báo', 'Vui lòng nhập tuần tuổi của heo lúc nhập (1 đến 30).');
      if (n <= 0) return Alert.alert('Thông báo', 'Vui lòng nhập số con.');
      setDangLuu(true);
      try {
        const dong = await ghiDongMoi({
          userEmail, tenKhu: KHU_CHO_XEP, tenChuong: TEN_CHUONG_CHO_XEP, soCon: n, tuanTuoi: tuoi, ngayNhapChuong: ngayNhap.trim(),
          ghiChu: `Nhập đàn ${n} con heo ${tuoi} tuần vào Ô heo chưa sắp xếp chuồng (ngày ${ngayNhap.trim()})`,
          soBaoCam: 0, soLieuVaccine: 0, suKienHeoThit: 'NHAP_HEO', tinhBaoCao: true, ...coKg,
        });
        setDangLuu(false);
        if (typeof onDaGhi === 'function') onDaGhi(dong);
        setMoModal(false);
        Alert.alert('Thành công 🎉', `Đã nhập ${n} con heo ${tuoi} tuần.`);
      } catch (e) {
        setDangLuu(false);
        Alert.alert('Lỗi', 'Không lưu được, vui lòng kiểm tra mạng và thử lại.');
      }
      return;
    }
    if (laChonNoi) {
      if (!noi) return Alert.alert('Thông báo', 'Vui lòng chọn lấy heo từ đâu.');
      if (n <= 0) return Alert.alert('Thông báo', 'Vui lòng nhập số con.');
      if (n > noi.soCon) return Alert.alert('Thông báo', `${noi.ten} chỉ có ${noi.soCon} con heo ${noi.tuoiThat} tuần.`);
      if (!noi.laChoXep) {
        // Lấy từ ô chuồng: ghi giống hệt khi bán / hao hụt trong ô chuồng đó
        const homNayO = ngayGhi;
        const tuoiGhiO = noi.tuoiThat - tuanLui;
        if (tuoiGhiO < 1) return Alert.alert('Thông báo', 'Ngày chọn lùi quá xa so với tuổi của lứa heo này.');
        setDangLuu(true);
        if (typeof setDongBoStatus === 'function') setDongBoStatus('⏳ Đang lưu...');
        try {
          const dong = await ghiDongMoi({
            userEmail, tenKhu: noi.tenKhu, tenChuong: noi.tenChuong, soCon: -n, tuanTuoi: tuoiGhiO, ngayNhapChuong: homNayO, ...coKg,
            ghiChu: hanhDong === 'BAN_HEO'
              ? `[XUẤT BÁN]: Bán ${n} con heo Tuần ${noi.tuoiThat} (Xuất ngày ${homNayO})`
              : hanhDong === 'XOA_HEO' ? `[XÓA]: Xóa ${n} con heo Tuần ${noi.tuoiThat} khỏi ô (ngày ${homNayO})`
              : `[HAO HỤT]: Hao Hụt ${n} con heo Tuần ${noi.tuoiThat} (Ghi sổ ngày ${homNayO})`,
            soBaoCam: 0, soLieuVaccine: 0, suKienHeoThit: hanhDong, tinhBaoCao: true,
          });
          setDangLuu(false);
          if (typeof setDongBoStatus === 'function') setDongBoStatus('✅ Đã lưu');
          if (typeof onDaGhi === 'function') onDaGhi(dong);
          setMoModal(false);
          Alert.alert('Thành công 🎉', `${TEN_HD[hanhDong]} ${n} con ${noi.tuoiThat} tuần ở ${noi.ten}.`);
        } catch (e) {
          setDangLuu(false);
          Alert.alert('Lỗi', 'Không lưu được, vui lòng kiểm tra mạng và thử lại.');
        }
        return;
      }
    }
    if (!nhomChon) return Alert.alert('Thông báo', 'Vui lòng chọn tuần tuổi.');
    if (n <= 0) return Alert.alert('Thông báo', 'Vui lòng nhập số con.');
    if (n > nhomChon.soCon) return Alert.alert('Thông báo', `Heo ${nhomChon.tuoi} tuần chỉ còn ${nhomChon.soCon} con chưa sắp xếp chuồng.`);
    if (hanhDong === 'XEP' && !chuongChon) return Alert.alert('Thông báo', 'Vui lòng chọn ô chuồng.');

    const tuoi = nhomChon.tuoi;
    const homNay = ngayGhi;
    const tuoiGhi = tuoi - tuanLui; // tuổi lúc đó, để hôm nay vẫn ra đúng tuoi
    if (tuoiGhi < 1) return Alert.alert('Thông báo', 'Ngày chọn lùi quá xa so với tuổi của nhóm heo này.');
    const dongGhi = hanhDong === 'XEP'
      ? {
          tenKhu: chuongChon.tenKhu, tenChuong: chuongChon.tenChuong, soCon: n,
          ghiChu: `📦 Nhận ${n} con ${tuoi} tuần từ Ô heo chưa sắp xếp chuồng`,
          suKienHeoThit: 'NHAP_HEO', nguon: 'CHO_XEP',
        }
      : {
          tenKhu: KHU_CHO_XEP, tenChuong: TEN_CHUONG_CHO_XEP, soCon: -n,
          ghiChu: hanhDong === 'BAN_HEO'
            ? `[XUẤT BÁN]: Bán ${n} con heo Tuần ${tuoi} từ Ô heo chưa sắp xếp chuồng (ngày ${homNay})`
            : hanhDong === 'XOA_HEO' ? `[XÓA]: Xóa ${n} con heo Tuần ${tuoi} khỏi Ô heo chưa sắp xếp chuồng (ngày ${homNay})`
            : `[HAO HỤT]: Hao hụt ${n} con heo Tuần ${tuoi} ở Ô heo chưa sắp xếp chuồng (ngày ${homNay})`,
          suKienHeoThit: hanhDong, tinhBaoCao: true,
        };

    setDangLuu(true);
    if (typeof setDongBoStatus === 'function') setDongBoStatus('⏳ Đang lưu...');
    try {
      const dong = await ghiDongMoi({ userEmail, tuanTuoi: tuoiGhi, ngayNhapChuong: homNay, soBaoCam: 0, soLieuVaccine: 0, ...coKg, ...dongGhi });
      setDangLuu(false);
      if (typeof setDongBoStatus === 'function') setDongBoStatus('✅ Đã lưu');
      if (typeof onDaGhi === 'function') onDaGhi(dong);
      setMoModal(false);
      Alert.alert('Thành công 🎉', hanhDong === 'XEP'
        ? `${n} con ${tuoi} tuần đã vào chuồng ${chuongChon.tenChuong} (${chuongChon.tenKhu}).`
        : `${TEN_HD[hanhDong]} ${n} con ${tuoi} tuần.`);
    } catch (e) {
      setDangLuu(false);
      Alert.alert('Lỗi', 'Không lưu được, vui lòng kiểm tra mạng và thử lại.');
    }
  };

  const khung = (
          <View style={[{ backgroundColor: '#ffffff', borderRadius: 14, padding: 16 }, nhung ? { flexShrink: 1 } : { maxHeight: '88%' }]}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: MAU_HD[hanhDong], marginBottom: 2 }}>{TEN_HD[hanhDong]}</Text>
            <Text style={{ fontSize: 11.5, color: '#8a929a', marginBottom: 12 }}>
              {hanhDong === 'NHAP_HEO' ? 'Heo mua / nhập từ ngoài trại, sẽ cộng vào báo cáo theo tuần tuổi.'
                : hanhDong === 'XEP' ? 'Dời heo từ Ô heo chưa sắp xếp chuồng vào ô chuồng. Số heo trong báo cáo không đổi.'
                : hanhDong === 'XOA_HEO' ? 'Dùng khi số heo bị dư, nhập sai… Trừ khỏi số heo theo tuần tuổi, không tính là bán hay hao hụt, không tính vào năng suất.'
                : laChonNoi ? `Heo ${tuoiBanDau} tuần — lấy từ đâu? Sẽ trừ vào báo cáo theo tuần tuổi.` : 'Sẽ trừ vào báo cáo theo tuần tuổi.'}
            </Text>

            <ScrollView keyboardShouldPersistTaps="handled">
              <ChonNgay value={ngayNhap} onChange={setNgayNhap} mau={MAU_HD[hanhDong]} nhan={hanhDong === 'NHAP_HEO' ? 'Ngày nhập' : hanhDong === 'XEP' ? 'Ngày luân chuyển' : hanhDong === 'BAN_HEO' ? 'Ngày bán' : 'Ngày'} />
              {hanhDong === 'NHAP_HEO' && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#495057', marginBottom: 4 }}>Tuần tuổi của heo lúc nhập:</Text>
                  <TextInput value={tuoiNhap} onChangeText={(t) => setTuoiNhap(t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="VD: 8"
                    style={{ height: 44, borderWidth: 1.5, borderColor: '#ced4da', borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#111111', marginBottom: 12 }} />
                </>
              )}
              {laChonNoi && (
                <View style={{ marginBottom: 12 }}>
                  {dsNoi.length === 0 && <Text style={{ fontSize: 12, color: '#dc3545' }}>Không còn heo {tuoiBanDau} tuần ở Ô heo chưa sắp xếp chuồng hay ô chuồng nào.</Text>}
                  {dsNoi.map((x) => {
                    const bat = noiChon === x.khoa;
                    return (
                      <TouchableOpacity key={x.khoa} activeOpacity={0.7} onPress={() => setNoiChon(x.khoa)}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1.5, borderColor: bat ? MAU_HD[hanhDong] : '#dee2e6', backgroundColor: bat ? '#f8f9fa' : '#ffffff', marginBottom: 6 }}>
                        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: bat ? MAU_HD[hanhDong] : '#adb5bd', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                          {bat && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: MAU_HD[hanhDong] }} />}
                        </View>
                        <Text style={{ flex: 1, fontSize: 13, fontWeight: bat ? 'bold' : '600', color: '#1a1f23' }}>
                          {x.ten}{x.tuoiThat !== tuoiBanDau ? ` · ${x.tuoiThat} tuần` : ''}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#495057' }}>{x.soCon} con</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {hanhDong !== 'NHAP_HEO' && !laChonNoi && <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#495057', marginBottom: 6 }}>Chọn tuần tuổi:</Text>}
              {hanhDong !== 'NHAP_HEO' && !laChonNoi && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                {ds.map((nhom) => <OTuanChoXep key={`m_${nhom.tuoi}`} nhom={nhom} chon={tuoiChon === nhom.tuoi} onPress={() => chonNhom(nhom)} />)}
              </View>}

              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#495057', marginBottom: 4 }}>Số con:</Text>
              <TextInput value={soCon} onChangeText={(t) => setSoCon(t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="0"
                style={{ height: 44, borderWidth: 1.5, borderColor: '#ced4da', borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#111111', marginBottom: 12 }} />

              {(hanhDong === 'BAN_HEO' || hanhDong === 'NHAP_HEO') && (
                <OKg value={tongKg} onChange={setTongKg} soCon={soCon} nhan={hanhDong === 'BAN_HEO' ? 'Tổng trọng lượng bán (kg)' : 'Tổng trọng lượng heo nhập (kg)'} />
              )}

              {hanhDong === 'XEP' && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#495057', marginBottom: 6 }}>Chọn ô chuồng:</Text>
                  {khu.length === 0 && <Text style={{ fontSize: 12, color: '#dc3545' }}>Chưa có ô chuồng nào. Hãy tạo ô chuồng trước.</Text>}
                  {khu.map((k) => (
                    <View key={`k_${k.tenKhu}`} style={{ marginBottom: 10 }}>
                      <Text style={{ fontSize: 11.5, fontWeight: '900', color: k.tenKhu.includes('Cai') ? '#e65100' : '#0056b3', marginBottom: 6 }}>{k.tenKhu}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {(k.danhSachChuongCuaKhu || []).map((c) => {
                          const bat = chuongChon && chuongChon.tenKhu === k.tenKhu && chuongChon.tenChuong === c.tenChuong;
                          return (
                            <TouchableOpacity key={`c_${k.tenKhu}_${c.tenChuong}`} onPress={() => setChuongChon({ tenKhu: k.tenKhu, tenChuong: c.tenChuong })}
                              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: bat ? '#e65100' : '#dee2e6', backgroundColor: bat ? '#fff0e6' : '#ffffff' }}>
                              <Text style={{ fontSize: 12.5, fontWeight: '800', color: bat ? '#e65100' : '#212529' }}>{c.tenChuong}</Text>
                              <Text style={{ fontSize: 10, color: '#8a929a' }}>{c.tongSoCon || 0} con</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setMoModal(false)} disabled={dangLuu}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#f1f3f5' }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#495057' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={luu} disabled={dangLuu}
                style={{ flex: 1.4, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: MAU_HD[hanhDong], flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                {dangLuu && <ActivityIndicator size="small" color="#ffffff" />}
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>LƯU</Text>
              </TouchableOpacity>
            </View>
          </View>
  );
  // nhung = vẽ ngay trong cửa sổ của ô (không mở cửa sổ mới -> không nháy nền khi chuyển qua lại)
  if (nhung) return khung;
  return (
      <Modal visible={!!visible} transparent animationType="fade" onRequestClose={() => setMoModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 18 }}>
          {khung}
        </KeyboardAvoidingView>
      </Modal>
  );
}

// ========================================================
// 📦 Ô "CHỜ XẾP CHUỒNG" — mở ra giống 1 ô chuồng bình thường
// Heo cai sữa tự vào đây. 4 nút: Nhập Heo (mua ngoài) / Bán Heo / Hao Hụt / Luân Chuyển (xếp vào ô chuồng)
// ========================================================
const NUT_CHO_XEP = [
  { hd: 'NHAP_HEO', ten: 'Nhập Heo', icon: 'plus-circle-outline' },
  { hd: 'BAN_HEO', ten: 'Bán Heo', icon: 'cash-multiple' },
  { hd: 'HAO_HUT', ten: 'Hao Hụt', icon: 'minus-circle-outline' },
  { hd: 'XEP', ten: 'Luân Chuyển', icon: 'swap-horizontal' },
  { hd: 'XOA_HEO', ten: 'Xóa', icon: 'delete-outline' },
];

export default function OChoXepChuong({ visible, tuoiChon, onClose, choXepTheoTuoi, danhSachKhu, danhSachChuongThit, userEmail, onDaGhi, setDongBoStatus, NutSuaXoa }) {
  const [hanhDong, setHanhDong] = useState(null); // thao tác đang mở (cửa sổ ô tạm ẩn, đóng thao tác thì quay lại)
  const [dongMo, setDongMo] = useState(null);
  const [tuanChon, setTuanChon] = useState(null); // 📍 ô tuần đang chọn: các nút Bán / Hao hụt / Luân chuyển / Xóa tự chọn sẵn tuần này

  const ds = Array.isArray(choXepTheoTuoi) ? choXepTheoTuoi : [];
  const tong = ds.reduce((a, b) => a + b.soCon, 0);
  const coQuyen = duocThem();

  // Lịch sử của ô chờ xếp: nhập / bán / hao hụt tại đây + các lần luân chuyển vào ô chuồng
  const msNgay = (d) => { const x = parseToDateObject(d.ngayNhapChuong); return x ? x.getTime() : 0; };
  const lichSu = (Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [])
    .filter((d) => d && Number(d.soCon) !== 0 && d.suKienHeoThit !== 'DOI_CHIEU' && (String(d.tenKhu || '').trim() === KHU_CHO_XEP || d.nguon === 'CHO_XEP'))
    .sort((x, y) => (msNgay(y) - msNgay(x)) || String(y.id || '').localeCompare(String(x.id || '')));
  const moTa = (d) => {
    const so = Number(d.soCon) || 0;
    if (String(d.tenKhu || '').trim() !== KHU_CHO_XEP) return { ten: `Luân chuyển tới ${d.tenKhu} - Ô ${d.tenChuong}`, mau: '#e65100', so: `−${Math.abs(so)}`, mauSo: '#c82333' };
    if (d.suKienHeoThit === 'BAN_HEO') return { ten: 'Bán heo', mau: '#28a745', so: `−${Math.abs(so)}`, mauSo: '#c82333' };
    if (d.suKienHeoThit === 'XOA_HEO') return { ten: 'Xóa heo', mau: '#6c757d', so: `−${Math.abs(so)}`, mauSo: '#c82333' };
    if (d.suKienHeoThit === 'HAO_HUT') return { ten: 'Hao hụt', mau: '#dc3545', so: `−${Math.abs(so)}`, mauSo: '#c82333' };
    return so > 0 ? { ten: 'Nhập heo', mau: '#007bff', so: `+${so}`, mauSo: '#1e7e34' } : { ten: 'Giảm', mau: '#6c757d', so: `−${Math.abs(so)}`, mauSo: '#c82333' };
  };

  const bam = (hd) => {
    if (chanNeuKhongDuQuyen('them')) return;
    if (hd !== 'NHAP_HEO' && tong === 0) return Alert.alert('Thông báo', 'Không có heo nào chưa sắp xếp chuồng.');
    doiNoiDung(hd);
  };
  // 🎞 1 cửa sổ duy nhất: bấm nút thao tác chỉ đổi nội dung bên trong (mờ + trượt nhẹ), nền không tắt/bật lại -> hết giật
  const [hien, setHien] = useState(false);
  const animMo = useRef(new Animated.Value(0)).current;   // nền + khung lúc mở / đóng cửa sổ
  const animDoi = useRef(new Animated.Value(1)).current;  // đổi qua lại giữa ô và form thao tác
  useEffect(() => { if (visible) { animMo.setValue(0); setHien(true); setTuanChon(tuoiChon || null); } else setHien(false); }, [visible, tuoiChon]);
  const chayMo = () => Animated.timing(animMo, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  const doiNoiDung = (hd) => {
    animDoi.setValue(0);
    setHanhDong(hd);
    Animated.timing(animDoi, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };
  const dong = () => {
    Animated.timing(animMo, { toValue: 0, duration: 150, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setHien(false); setHanhDong(null); setDongMo(null); if (typeof onClose === 'function') onClose();
    });
  };
  let thangTruoc = '';

  return (
    <>
      <Modal visible={hien} transparent animationType="none" statusBarTranslucent onShow={chayMo} onRequestClose={() => (hanhDong ? doiNoiDung(null) : dong())}>
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', opacity: animMo }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center', padding: 14 }}>
        <Animated.View style={{ maxHeight: '92%', opacity: animMo, transform: [{ scale: animMo.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }, { translateY: animMo.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
        <Animated.View style={{ flexShrink: 1, opacity: animDoi, transform: [{ translateY: animDoi.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
        {hanhDong ? (
          <ModalThaoTacHeo nhung visible hanhDong={hanhDong} tuoiBanDau={hanhDong !== 'NHAP_HEO' && ds.some((x) => x.tuoi === tuanChon) ? tuanChon : null} choXepTheoTuoi={ds}
            danhSachKhu={danhSachKhu} userEmail={userEmail} setDongBoStatus={setDongBoStatus}
            onClose={() => doiNoiDung(null)} onDaGhi={onDaGhi} />
        ) : (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 14, flexShrink: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#b26a00' }}>Ô heo chưa sắp xếp chuồng</Text>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: '#1a1f23', marginTop: 1 }}>{tong} con</Text>
                </View>
                <TouchableOpacity onPress={dong} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={{ fontSize: 18, color: '#8a929a', fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 11, color: '#8a929a', marginTop: 4, marginBottom: 10 }}>Đây là số heo sau khi cai sữa, chưa được xếp vào chuồng nào. Nếu bạn muốn quản lý theo từng ô chuồng, hãy bấm tạo ô chuồng.</Text>

              {tong === 0 ? (
                <Text style={{ fontSize: 12, color: '#8a929a', marginBottom: 12 }}>Không có heo nào chưa sắp xếp chuồng.</Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                  {ds.map((nhom) => <OTuanChoXep key={`cx_${nhom.tuoi}`} nhom={nhom} chon={tuanChon === nhom.tuoi} onPress={() => setTuanChon(tuanChon === nhom.tuoi ? null : nhom.tuoi)} />)}
                </View>
              )}

              {coQuyen && (
                <View style={{ flexDirection: 'row', gap: 5, marginBottom: 14 }}>
                  {NUT_CHO_XEP.map((n) => {
                    const mo = n.hd === 'NHAP_HEO' || tong > 0;
                    const mau = mo ? MAU_HD[n.hd] : '#ced4da';
                    return (
                      <TouchableOpacity key={n.hd} activeOpacity={0.7} onPress={() => bam(n.hd)}
                        style={{ flex: 1, paddingVertical: 7, borderRadius: 7, alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: mau }}>
                        <MaterialCommunityIcons name={n.icon} size={22} color={mau} />
                        <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: mau, marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>{n.ten}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Text style={{ fontSize: 12, fontWeight: '900', color: '#1a1f23', marginBottom: 4 }}>Lịch sử</Text>
              {lichSu.length === 0 && <Text style={{ fontSize: 12, color: '#8a929a', paddingVertical: 14, textAlign: 'center' }}>Chưa có lần nhập / bán / luân chuyển nào.</Text>}
              {lichSu.slice(0, 60).map((d, idx) => {
                const m = moTa(d);
                const ngay = String(d.ngayNhapChuong || '');
                const thang = ngay.split('/').slice(1).join('/');
                const hienThang = thang && thang !== thangTruoc;
                thangTruoc = thang;
                const khoa = d.id || idx;
                const mo = dongMo === khoa;
                const nguoi = d.nguoiNhap ? (d.nguoiNhap === 'CHU' ? 'Chủ trại' : (d.tenNguoiNhap ? `${d.nguoiNhap} – ${d.tenNguoiNhap}` : d.nguoiNhap)) : '';
                return (
                  <View key={`lscx_${khoa}`}>
                    {hienThang && <Text style={{ fontSize: 11, fontWeight: '900', color: '#8a929a', marginTop: idx === 0 ? 2 : 10, marginBottom: 2 }}>Tháng {thang}</Text>}
                    <TouchableOpacity activeOpacity={0.6} onPress={() => setDongMo(mo ? null : khoa)}
                      style={{ paddingVertical: 9, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f1f3f5', backgroundColor: mo ? '#f8f9fa' : 'transparent' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: m.mau, marginRight: 9 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1a1f23' }} numberOfLines={1}>{m.ten}</Text>
                          <Text style={{ fontSize: 11, color: '#8a929a', marginTop: 1 }} numberOfLines={1}>{[ngay, `${d.tuanTuoi} tuần`, hienKg(d.tongKg), nguoi].filter(Boolean).join('  ·  ')}</Text>
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '900', color: m.mauSo, marginLeft: 8 }}>{m.so}</Text>
                      </View>
                      {mo && (
                        <View style={{ marginTop: 6, marginLeft: 12 }}>
                          <Text style={{ fontSize: 11.5, color: '#495057', lineHeight: 16 }}>{d.ghiChu ? d.ghiChu : 'Không có ghi chú'}</Text>
                          {NutSuaXoa ? <NutSuaXoa log={d} /> : null}
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}

              <TouchableOpacity activeOpacity={0.7} onPress={dong}
                style={{ marginTop: 12, paddingVertical: 11, borderRadius: 8, alignItems: 'center', backgroundColor: '#f1f3f5' }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#495057' }}>Trở về</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
        </Animated.View>
        </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}