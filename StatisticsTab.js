import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';

const StatisticsTab = ({
  currentTab, styles, parseToDateObject,
  dataHeoThit, dataThongKe, danhSachLichSu,
  tuanBauDangMoTab3, setTuanBauDangMoTab3,
  danhSachMaTai, handleXemChiTietHeo
}) => {
  const [hienNaiBauTuan, setHienNaiBauTuan] = React.useState(false);
  const [hienBanDoTong, setHienBanDoTong] = React.useState(false);
  const [danhSachNaiChiTietTuan, setDanhSachNaiChiTietTuan] = React.useState([]);
const [tieuDeLuaChon, setTieuDeLuaChon] = React.useState('');
  const [mangNaiTheoLuaChon, setMangNaiTheoLuaChon] = React.useState([]);
  // 🌟 HÀM TRUNG TÂM PHÂN TÁCH SỐ LIỆU 52 TUẦN (ĐẶT NGOÀI LUỒNG RENDER CHỐNG LỖI DẤU)
 const khoDemXuyenNamHeThong = React.useMemo(() => {
    const khoDem = {};
    const ngayHienTai = new Date();
    const namHienTai = ngayHienTai.getFullYear();
    const thangHienTai = ngayHienTai.getMonth();

    // 🌟 ĐỘT PHÁ: Giật lùi mốc thời gian về 5 tháng trước để gom sạch lịch phối cũ tháng 4,5,6
    const thangGocLui = thangHienTai - 5;

    for (let i = 0; i < 12; i++) {
      const d = new Date(namHienTai, thangGocLui + i, 1);
      const mKey = `${d.getFullYear()}_${d.getMonth() + 1}`;
      khoDem[mKey] = {
        tenThang: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`,
        nam: d.getFullYear(),
        thang: d.getMonth() + 1,
        phoiTong: 0,
        deTong: 0,
        danhSachTuan: {}
      };
      for (let w = 1; w <= 54; w++) {
        khoDem[mKey].danhSachTuan[`w${w}`] = { phoi: 0, de: 0, danhSachNai: [] };
      }
    }

    const laySoTuanVaThangLich = (chuoiNgay) => {
      if (!chuoiNgay || chuoiNgay === "---" || chuoiNgay.toString().trim() === "") return null;
      try {
        let nStr = chuoiNgay.toString().trim();
        let d = 0, m = 0, y = 0;
        if (nStr.includes('/')) {
          const p = nStr.split('/');
          if (p.length >= 3) { d = parseInt(p[0], 10); m = parseInt(p[1], 10); y = parseInt(p[2].split(' ')[0], 10); }
        } else if (nStr.includes('-')) {
          const p = nStr.substring(0, 10).split('-');
          if (p.length >= 3) { y = parseInt(p[0], 10); m = parseInt(p[1], 10); d = parseInt(p[2], 10); }
        }
        if (d > 0 && m > 0 && y > 0) {
          const dateObj = new Date(y, m - 1, d); if (isNaN(dateObj.getTime())) return null;
          const ngayThuNamCuaTuan = new Date(dateObj.valueOf());
          const thuHienTai = dateObj.getDay(); const thuChuanHienTai = thuHienTai === 0 ? 7 : thuHienTai;
          ngayThuNamCuaTuan.setDate(ngayThuNamCuaTuan.getDate() + 4 - thuChuanHienTai);
          const ngayDauNamObj = new Date(ngayThuNamCuaTuan.getFullYear(), 0, 1);
          const khoangCachMs = ngayThuNamCuaTuan.getTime() - ngayDauNamObj.getTime();
          const soTuanISO = Math.ceil((Math.floor(khoangCachMs / 86400000) + 1) / 7);
          return { nam: dateObj.getFullYear(), thang: dateObj.getMonth() + 1, tuan: soTuanISO };
        }
      } catch (err) { return null; }
      return null;
    };

    const mangSoTaiGoc = global.danhSachCapNhatTrangThai || danhSachMaTai || [];
    if (Array.isArray(mangSoTaiGoc)) {
      mangSoTaiGoc.forEach(heo => {
        if (!heo || !heo.maTai || heo.vuaNhapMoi === true) return;
        const maTaiChuan = heo.maTai.toString().toUpperCase().trim();
        const trangThaiSowRegistry = (heo.trangThaiDienThoai || heo.trangThaiCotH || heo.trangThai || "Chờ Phối").toString().trim().toUpperCase().normalize("NFC");
        if (trangThaiSowRegistry !== "PHỐI" && !trangThaiSowRegistry.includes("PHOI")) return;

        const ngayPhoiGoc = heo.ngayPhoiDong || heo.ngayCotI || "";
        const dinhDangPhoi = laySoTuanVaThangLich(ngayPhoiGoc);
        if (dinhDangPhoi) {
          const kM = `${dinhDangPhoi.nam}_${dinhDangPhoi.thang}`;
          if (khoDem[kM]) {
            const kW = `w${dinhDangPhoi.tuan}`;
            khoDem[kM].phoiTong += 1; khoDem[kM].danhSachTuan[kW].phoi += 1;
            khoDem[kM].danhSachTuan[kW].danhSachNai.push({ id: `p_${heo.id}`, maTai: maTaiChuan, loai: "Phối", ngay: ngayPhoiGoc, tNum: dinhDangPhoi.tuan, mKey: kM });
          }
        }

        const ngayDuKienDe = heo.ngayDuKienDeMoi || "";
        const dinhDangDe = laySoTuanVaThangLich(ngayDuKienDe);
        if (dinhDangDe) {
          const kM = `${dinhDangDe.nam}_${dinhDangDe.thang}`;
          if (khoDem[kM]) {
            const kW = `w${dinhDangDe.tuan}`;
            khoDem[kM].deTong += 1; khoDem[kM].danhSachTuan[kW].de += 1;
            khoDem[kM].danhSachTuan[kW].danhSachNai.push({ id: `d_${heo.id}`, maTai: maTaiChuan, loai: "Dự Đẻ", ngay: ngayDuKienDe, tNum: dinhDangDe.tuan, mKey: kM });
          }
        }
      });
    }
    return Object.values(khoDem);
  }, [danhSachMaTai, danhSachLichSu, global.danhSachCapNhatTrangThai]);

  if (currentTab !== 'thong_ke') return null;

  const thongKeCoCauLuaNai = (() => {
    const khoLua = { hauBi: 0, lua_1_3: 0, lua_4_7: 0, lua_tren_7: 0 };
    const mangNaiHienTai = global.danhSachCapNhatTrangThai || danhSachMaTai || [];
    
    if (Array.isArray(mangNaiHienTai)) {
      mangNaiHienTai.forEach(heo => {
        if (!heo || !heo.maTai) return;
        
        // Loại trừ lợn đã thanh lý thải loại ra khỏi cơ cấu tính cám và sản xuất
        const st = (heo.trangThaiDienThoai || heo.trangThaiCotH || heo.trangThai || "CHOR").toString().toUpperCase();
        if (st.includes("THẢI") || st.includes("THAI")) return;

        const chuoiLua = (heo.lua || "Hậu Bị").toString().trim().toUpperCase();
        if (chuoiLua.includes("HẬU BỊ") || chuoiLua.includes("HAU BI") || chuoiLua === "LỨA 0" || chuoiLua === "LUA 0") {
          khoLua.hauBi += 1;
        } else {
          const soLua = parseInt(chuoiLua.replace(/\D/g, ""), 10);
          if (isNaN(soLua)) {
            khoLua.hauBi += 1;
          } else if (soLua >= 1 && soLua <= 3) {
            khoLua.lua_1_3 += 1;
          } else if (soLua >= 4 && soLua <= 7) {
            khoLua.lua_4_7 += 1;
          } else if (soLua > 7) {
            khoLua.lua_tren_7 += 1;
          }
        }
      });
    }
    return khoLua;
  })();

  // 🟢 TÍNH TOÁN SỐ LIỆU ĐÀN NÁI THỜI GIAN THỰC TỪ MẢNG RAM NỀN TOÀN CỤC
  const mangRamThongKe = global.danhSachCapNhatTrangThai || [];
  const soConDangDe = mangRamThongKe.filter(heo => {
    const status = heo && heo.trangThaiDienThoai ? heo.trangThaiDienThoai.toString().toUpperCase().trim() : "";
    // 🎯 ĐÃ VÁ: Sửa chính tả từ "ĐỂ" thành "ĐẺ" để khớp 100% với dữ liệu chuồng nuôi con
    return status === "ĐẺ" || status === "ĐANG ĐẺ";
  }).length;

  const soConMangBau = mangRamThongKe.filter(heo => {
    const status = heo && heo.trangThaiDienThoai ? heo.trangThaiDienThoai.toString().toUpperCase().trim() : "";
    return status === "PHỐI" || status === "ĐÃ PHỐI";
  }).length;

  const soConChoPhoi = mangRamThongKe.filter(heo => heo && heo.trangThaiDienThoai === "Chờ Phối").length;
  const soConCaiSua = mangRamThongKe.filter(heo => heo && heo.trangThaiDienThoai === "Cai Sữa").length;
  const soConLoc = mangRamThongKe.filter(heo => heo && heo.trangThaiDienThoai === "Lốc").length;
  const soConSayThai = mangRamThongKe.filter(heo => heo && heo.trangThaiDienThoai === "Sảy Thai").length;

  const soConChuaPhoi = soConChoPhoi + soConCaiSua + soConLoc + soConSayThai;
  const tongSoHeoNaiSong = soConDangDe + soConMangBau + soConChuaPhoi;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 15, paddingBottom: 100 }}>
        <View>
          
          {/* KHỐI 2: TỔNG QUAN CƠ SỞ ĐÀN NÁI HIỆN TẠI */}
          <View style={{ marginBottom: 8, width: '100%' }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#e65100', letterSpacing: 0.5 }}>📈 TỔNG QUAN ĐÀN NÁI</Text>
          </View>

          <View style={{ backgroundColor: '#fffaf5', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#ffd3b6' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1.2, borderBottomColor: '#ffd3b6', marginBottom: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111111' }}>Tổng Số Heo Nái</Text>
              <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 17 }}>{tongSoHeoNaiSong} con</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ffe5d4' }}>
              <Text style={{ fontSize: 13, color: '#555555' }}>Số Heo Đang Đẻ</Text>
              <Text style={{ fontSize: 14, color: '#111111', fontWeight: 'bold' }}>{soConDangDe} con</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ffe5d4' }}>
              <Text style={{ fontSize: 13, color: '#555555' }}>Số Con Mang Bầu</Text>
              <Text style={{ fontSize: 14, color: '#28a745', fontWeight: 'bold' }}>{soConMangBau} con</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ffe5d4' }}>
              <Text style={{ fontSize: 13, color: '#555555' }}>Số Con Chưa Phối</Text>
              <Text style={{ fontSize: 14, color: '#6c757d', fontWeight: 'bold' }}>{soConChuaPhoi} con</Text>
            </View>

            <View style={{ paddingLeft: 12, marginTop: 4, borderLeftWidth: 2, borderLeftColor: '#fbc48c' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ fontSize: 12.5, color: '#666666' }}>Theo Dõi</Text>
                <Text style={{ fontSize: 13, color: '#111111', fontWeight: '600' }}>{soConChoPhoi} con</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ fontSize: 12.5, color: '#666666' }}>Cai Sữa (Chờ lên giống)</Text>
                <Text style={{ fontSize: 13, color: '#111111', fontWeight: '600' }}>{soConCaiSua} con</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ fontSize: 12.5, color: '#dc3545' }}>Lốc (Phối hỏng)</Text>
                <Text style={{ fontSize: 13, color: '#dc3545', fontWeight: 'bold' }}>{soConLoc} con</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ fontSize: 12.5, color: '#dc3545' }}>Sảy Thai</Text>
                <Text style={{ fontSize: 13, color: '#dc3545', fontWeight: 'bold' }}>{soConSayThai} con</Text>
              </View>
            </View>
          </View>
                 {/* 📊 KHỐI cơ cấu tổng đàn */}

  <View style={{ marginBottom: 8, width: '100%' }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#e65100', letterSpacing: 0.5 }}>📊 CƠ CẤU TỔNG ĐÀN</Text>
          </View>
          
          <View style={{ backgroundColor: '#ffffff', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#eef2f6', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 }}>
            {(() => {
              const mangNaiHeoGoc = global.danhSachCapNhatTrangThai || danhSachMaTai || [];
              const bămMangNai = (loaiNhom) => {
                if (!Array.isArray(mangNaiHeoGoc)) return [];
                return mangNaiHeoGoc.filter(heo => {
                  if (!heo || !heo.maTai) return false;
                  const st = (heo.trangThaiDienThoai || heo.trangThaiCotH || heo.trangThai || "CHOR").toString().toUpperCase();
                  if (st.includes("THẢI") || st.includes("THAI")) return false;

                  const chuoiLua = (heo.lua || "Hậu Bị").toString().trim().toUpperCase();
                  const laHauBi = chuoiLua.includes("HẬU BỊ") || chuoiLua.includes("HAU BI") || chuoiLua === "LỨA 0" || chuoiLua === "LUA 0";
                  
                  if (loaiNhom === 'HB') return laHauBi;
                  if (laHauBi) return false;

                  const soLua = parseInt(chuoiLua.replace(/\D/g, ""), 10);
                  if (isNaN(soLua)) return loaiNhom === 'HB';
                  if (loaiNhom === '1_3') return soLua >= 1 && soLua <= 3;
                  if (loaiNhom === '4_7') return soLua >= 4 && soLua <= 7;
                  if (loaiNhom === 'TR_7') return soLua > 7;
                  return false;
                }).sort((a, b) => (a.maTai || "").toString().toUpperCase().localeCompare((b.maTai || "").toString().toUpperCase()));
              };

              return (
              // 🔍 QUÉT CHỌN TOÀN BỘ KHỐI <View style={{ gap: 2 }}> CŨ CỦA ANH VÀ DÁN ĐÈ KHỐI THẺ TIẾN TRÌNH NÀY VÀO:
                <View style={{ gap: 8, paddingVertical: 4 }}>
                  {(() => {
                    const mangNaiHeoGoc = global.danhSachCapNhatTrangThai || danhSachMaTai || [];
                    const bămMangNai = (loaiNhom) => {
                      if (!Array.isArray(mangNaiHeoGoc)) return [];
                      return mangNaiHeoGoc.filter(heo => {
                        if (!heo || !heo.maTai) return false;
                        const st = (heo.trangThaiDienThoai || heo.trangThaiCotH || heo.trangThai || "CHOR").toString().toUpperCase();
                        if (st.includes("THẢI") || st.includes("THAI")) return false;

                        const chuoiLua = (heo.lua || "Hậu Bị").toString().trim().toUpperCase();
                        const laHauBi = chuoiLua.includes("HẬU BỊ") || chuoiLua.includes("HAU BI") || chuoiLua === "LỨA 0" || chuoiLua === "LUA 0";
                        
                        if (loaiNhom === 'HB') return laHauBi;
                        if (laHauBi) return false;

                        const soLua = parseInt(chuoiLua.replace(/\D/g, ""), 10);
                        if (isNaN(soLua)) return loaiNhom === 'HB';
                        if (loaiNhom === '1_3') return soLua >= 1 && soLua <= 3;
                        if (loaiNhom === '4_7') return soLua >= 4 && soLua <= 7;
                        if (loaiNhom === 'TR_7') return soLua > 7;
                        return false;
                      }).sort((a, b) => (a.maTai || "").toString().toUpperCase().localeCompare((b.maTai || "").toString().toUpperCase()));
                    };

                    // 🧠 TOÁN TỬ TOÁN HỌC: Tính tổng số nái sống thực tế để chia tỷ lệ phần trăm thanh tiến trình
                    const tongNaiTinhPhanTram = Math.max(1, (thongKeCoCauLuaNai.hauBi || 0) + (thongKeCoCauLuaNai.lua_1_3 || 0) + (thongKeCoCauLuaNai.lua_4_7 || 0) + (thongKeCoCauLuaNai.lua_tren_7 || 0));

                    const cấuHìnhCột = [
                      { key: 'HB', tieuDe: 'Heo Hậu Bị', moTa: 'Chưa phối giống lứa nào', soCon: thongKeCoCauLuaNai.hauBi, mauChuChu: '#495057', mauNền: '#f8f9fa', mauVách: '#6c757d', mauThanh: '#ced4da' },
                      { key: '1_3', tieuDe: 'Lứa Trẻ Sung Mãn', moTa: 'Lứa đẻ từ 1 đến lứa 3', soCon: thongKeCoCauLuaNai.lua_1_3, mauChuChu: '#28a745', mauNền: '#f4fbf7', mauVách: '#28a745', mauThanh: '#a3cfbb' },
                      { key: '4_7', tieuDe: 'Lứa Giữa Ổn Định', moTa: 'Lứa đẻ từ 4 đến lứa 7', soCon: thongKeCoCauLuaNai.lua_4_7, mauChuChu: '#007bff', mauNền: '#f0f7ff', mauVách: '#007bff', mauThanh: '#b8daff' },
                      { key: 'TR_7', tieuDe: 'Lứa Cao Loại Thải', moTa: 'Heo già trên 7 lứa đẻ', soCon: thongKeCoCauLuaNai.lua_tren_7, mauChuChu: '#dc3545', mauNền: '#fff5f5', mauVách: '#dc3545', mauThanh: '#f5c6cb' }
                    ];

                    return cấuHìnhCột.map((itemCnf) => {
                      const phanTramNai = Math.round((itemCnf.soCon / tongNaiTinhPhanTram) * 100);
                      return (
                        <TouchableOpacity 
                          key={`progress_bar_box_${itemCnf.key}`}
                          activeOpacity={0.7} 
                          onPress={() => { setTieuDeLuaChon(`DANH SÁCH ${itemCnf.tieuDe.toUpperCase()}`); setMangNaiTheoLuaChon(bămMangNai(itemCnf.key)); }} 
                          style={{ 
                            flexDirection: 'row', 
                            backgroundColor: '#ffffff', 
                            borderRadius: 8, 
                            borderWidth: 1, 
                            borderColor: '#e9ecef',
                            overflow: 'hidden',
                            height: 54,
                            alignItems: 'center'
                          }}
                        >
                          {/* Vách màu chặn đầu dòng nhận diện nghiệp vụ nhanh */}
                          <View style={{ width: 4, height: '100%', backgroundColor: itemCnf.mauVách }} />
                          
                          <View style={{ flex: 1, paddingHorizontal: 12, justifyContent: 'center' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <View>
                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1a1f23' }}>{itemCnf.tieuDe}</Text>
                                <Text style={{ fontSize: 10, color: '#8a929a', marginTop: 1, fontStyle: 'italic' }}>{itemCnf.moTa}</Text>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 14, fontWeight: '900', color: itemCnf.mauChuChu }}>{itemCnf.soCon} con</Text>
                                <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#7f8c8d', marginTop: 1 }}>{phanTramNai}% đàn</Text>
                              </View>
                            </View>

                            {/* Thanh tiến trình (Progress Bar) chạy tỷ lệ đồ họa cao cấp */}
                            <View style={{ width: '100%', height: 5, backgroundColor: '#f1f3f5', borderRadius: 3, overflow: 'hidden' }}>
                              <View style={{ width: `${phanTramNai}%`, height: '100%', backgroundColor: itemCnf.mauThanh, borderRadius: 3 }} />
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </View>

              );
            })()}
          </View>
          <Modal
          visible={mangNaiTheoLuaChon.length > 0 || tieuDeLuaChon !== ''}
          transparent={true}
          animationType="fade"
          onRequestClose={() => { setTieuDeLuaChon(''); setMangNaiTheoLuaChon([]); }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(26, 31, 35, 0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} activeOpacity={1} onPress={() => { setTieuDeLuaChon(''); setMangNaiTheoLuaChon([]); }} />
            
            <View style={{ backgroundColor: '#ffffff', width: '96%', maxHeight: '70%', borderRadius: 16, padding: 16, elevation: 24, zIndex: 999999 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f3f5', borderStyle: 'dashed' }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#1a1f23', letterSpacing: 0.1 }}>📣 {tieuDeLuaChon} ({mangNaiTheoLuaChon.length} con)</Text>
                <TouchableOpacity onPress={() => { setTieuDeLuaChon(''); setMangNaiTheoLuaChon([]); }} style={{ backgroundColor: '#eef2f5', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#dee2e6' }}>
                  <Text style={{ color: '#495057', fontSize: 11, fontWeight: 'bold', marginTop: -1 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={true}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 4 }}>
                  {mangNaiTheoLuaChon.length === 0 ? (
                    <Text style={{ fontSize: 12, color: '#8a929a', fontStyle: 'italic', width: '100%', textAlign: 'center', paddingVertical: 15 }}>Hiện tại nhóm lứa này không có nái nào ngoài chuồng.</Text>
                  ) : (
                    mangNaiTheoLuaChon.map((heoLua, hLidx) => {
                      const ttNai = heoLua.trangThaiDienThoai || "Theo Dõi";
                      const laBau = ttNai === "Phối";
                      const laDe = ttNai === "Đẻ";

                      return (
                        <TouchableOpacity
                          key={`sub_lua_tag_${hLidx}`}
                          activeOpacity={0.7}
                          onPress={() => {
                            setTieuDeLuaChon(''); setMangNaiTheoLuaChon([]);
                            if (typeof handleXemChiTietHeo === 'function') {
                              handleXemChiTietHeo(heoLua);
                            }
                          }}
                          style={{
                            width: '31.3%',
                            backgroundColor: laBau ? '#f0f7ff' : (laDe ? '#f0fbf4' : '#fdfdfd'),
                            borderWidth: 0.8,
                            borderColor: laBau ? '#b8daff' : (laDe ? '#c3e6cb' : '#dee2e6'),
                            borderRadius: 6,
                            paddingVertical: 8,
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#111111' }} allowFontScaling={false}>{heoLua.maTai}</Text>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: laBau ? '#007bff' : (laDe ? '#28a745' : '#7f8c8d'), marginTop: 2 }} allowFontScaling={false}>
                            {laBau ? "Mang Thai" : (laDe ? "Đang Đẻ" : "Chờ Phối")}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
          </Modal>

         {/* 📊 KHỐI THỐNG KÊ LƯỚI 19 Ô BẦU THEO CHU KỲ TUẦN (ĐÃ TÍCH HỢP NÚT ẨN/HIỆN ĐỘNG) */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eef2f5', marginTop: 12, marginBottom: 15 }}>
            <View style={{ borderBottomWidth: hienNaiBauTuan ? 1.5 : 0, borderBottomColor: '#f1f3f5', paddingBottom: hienNaiBauTuan ? 10 : 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hienNaiBauTuan ? 12 : 0 }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#1a1f23', letterSpacing: 0.2 }}>📊 THỐNG KÊ NÁI BẦU</Text>
                <Text style={{ fontSize: 11, color: '#8a929a', marginTop: 3 }}>Theo dõi chu kỳ 18 tuần thai sản. Chạm ô tuần để rà soát mã tai</Text>
              </View>

              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => {
                  setHienNaiBauTuan(!hienNaiBauTuan);
                  setTuanBauDangMoTab3(null); // Tự động đóng khay chi tiết mã tai khi gập bảng để tránh rác giao diện
                }}
                style={{ backgroundColor: hienNaiBauTuan ? '#fff0e6' : '#e65100', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 0.5, borderColor: '#ffd3b6' }}
              >
                <Text style={{ color: hienNaiBauTuan ? '#e65100' : '#ffffff', fontSize: 11, fontWeight: 'bold' }}>
                  {hienNaiBauTuan ? "Ẩn tuần ▲" : "Hiện tuần ▼"}
                </Text>
              </TouchableOpacity>
            </View>

            {hienNaiBauTuan && (
              <View style={{ gap: 5, marginBottom: 5, marginTop: 4 }}>
                {(() => {
                  const arrayPregnancyWeeks = [
                    "t0", "t1", "t2", "t3", "t4", "t5", "t6",
                    "t7", "t8", "t9", "t10", "t11", "t12",
                    "t13", "t14", "t15", "t16", "t17", "t18"
                  ];

                  const mangRamSongGocTab3 = global.danhSachCapNhatTrangThai || [];
                  const khoDemTuanBauRealTime = {};
                  arrayPregnancyWeeks.forEach(wKey => { khoDemTuanBauRealTime[wKey] = 0; });

                  const layThuHaiDauTuan = (dateObj) => {
                    if (!dateObj) return null;
                    const d = new Date(dateObj.getTime());
                    const day = d.getDay();
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                    d.setDate(diff); d.setHours(0, 0, 0, 0);
                    return d;
                  };

                  const ngayHomNayObj = new Date();
                  const thuHaiTuanNayObj = layThuHaiDauTuan(ngayHomNayObj);

                  if (Array.isArray(mangRamSongGocTab3) && mangRamSongGocTab3.length > 0 && thuHaiTuanNayObj) {
                    const doDaiMangSong = mangRamSongGocTab3.length;
                    for (let j = 0; j < doDaiMangSong; j++) {
                      const dongHeo = mangRamSongGocTab3[j];
                      if (!dongHeo || dongHeo.vuaNhapMoi === true) continue;

                      const trangThaiHienTaiCuaNai = (dongHeo.trangThaiDienThoai || dongHeo.trangThaiCotH || dongHeo.trangThai || "Chờ Phối").toString().trim().toUpperCase();
                      if (trangThaiHienTaiCuaNai !== "PHỐI" && !trangThaiHienTaiCuaNai.includes("PHOI")) continue;

                      const maTaiHeo = dongHeo.maTai ? dongHeo.maTai.toString().toUpperCase().trim() : "";
                      if (maTaiHeo === "" || maTaiHeo === "---") continue;

                      let ngayPhoiSong = "---";
                      if (Array.isArray(danhSachLichSu) && danhSachLichSu.length > 0) {
                        const doDaiLichSu = danhSachLichSu.length;
                        let caPhoiTimDuoc = null;
                        for (let k = 0; k < doDaiLichSu; k++) {
                          const sk = danhSachLichSu[k];
                          if (sk && sk.maTai && sk.maTai.toString().toUpperCase().trim() === maTaiHeo && sk.actionType !== "delete") {
                            const txtS = (sk.suKien || "").toString().toUpperCase();
                            if (txtS.includes("PHỐI") || txtS.includes("PHOI") || txtS.includes("GIỐNG")) {
                              const dateCheck = parseToDateObject(sk.ngay);
                              if (dateCheck && (!caPhoiTimDuoc || dateCheck.getTime() > caPhoiTimDuoc.getTime())) {
                                caPhoiTimDuoc = dateCheck; ngayPhoiSong = sk.ngay || "---";
                              }
                            }
                          }
                        }
                      }

                      if (ngayPhoiSong === "---") { ngayPhoiSong = dongHeo.ngayPhoiDong || dongHeo.ngayCotI || "---"; }

                      const ngayPhoiGocObj = parseToDateObject(ngayPhoiSong);
                      if (ngayPhoiGocObj) {
                        const thuHaiCuaNgayPhoiObj = layThuHaiDauTuan(ngayPhoiGocObj);
                        if (thuHaiCuaNgayPhoiObj) {
                          const khoangCachMiliGiay = thuHaiTuanNayObj.getTime() - thuHaiCuaNgayPhoiObj.getTime();
                          const soTuanLechThucTe = Math.round(khoangCachMiliGiay / (1000 * 60 * 60 * 24 * 7));
                          if (soTuanLechThucTe === 0) { khoDemTuanBauRealTime["t0"] += 1; } 
                          else if (soTuanLechThucTe >= 1 && soTuanLechThucTe <= 17) { khoDemTuanBauRealTime[`t${soTuanLechThucTe}`] += 1; } 
                          else if (soTuanLechThucTe >= 18) { khoDemTuanBauRealTime["t18"] += 1; }
                        }
                      }
                    }
                  }

                  const rowGroupData = [];
                  for (let i = 0; i < arrayPregnancyWeeks.length; i += 3) { rowGroupData.push(arrayPregnancyWeeks.slice(i, i + 3)); }

                  return rowGroupData.map((hangData, hangIdx) => (
                    <View key={`clean_row_group_${hangIdx}`} style={{ width: '100%', marginBottom: 5 }}>
                      <View style={{ flexDirection: 'row', gap: 5 }}>
                        {hangData.map((tuanKey, colIdx) => {
                          const soConHienTai = (khoDemTuanBauRealTime[tuanKey] || 0).toString();
                          const laOThuocCheck = tuanBauDangMoTab3 === tuanKey;
                          const coHeo = Number(soConHienTai) > 0;

                          let mauVienLuoi = laOThuocCheck ? '#1a1f23' : '#e9ecef';
                          let mauNenLuoi = laOThuocCheck ? '#f1f3f5' : '#ffffff';
                          let mauChuTuan = '#495057';
                          let mauChuCon = coHeo ? '#1a1f23' : '#adb5bd';
                          let iconNhacNho = "";
                          let nhanTieuDeNut = `Bầu ${tuanKey.replace('t', '')} Tuần`;
                          let chuCanhBaoNho = null;

                          if (tuanKey === "t0") { nhanTieuDeNut = "Mới Phối"; if (!laOThuocCheck) { mauVienLuoi = '#007bff'; mauNenLuoi = '#ffffff'; } }
                          if (!laOThuocCheck && tuanKey !== "t0") { if (tuanKey === "t4" || tuanKey === "t7" || tuanKey === "t10") { mauVienLuoi = '#20c997'; } }
                          if (tuanKey === "t18") { mauVienLuoi = laOThuocCheck ? '#dc3545' : '#f5c6cb'; mauNenLuoi = laOThuocCheck ? '#fff5f5' : '#ffffff'; mauChuTuan = '#dc3545'; mauChuCon = '#dc3545'; iconNhacNho = "🚨 "; chuCanhBaoNho = "Kiểm Tra Gấp"; } 
                          else if (tuanKey === "t16" || tuanKey === "t17") { mauVienLuoi = laOThuocCheck ? '#fd7e14' : '#ffe0b2'; mauNenLuoi = laOThuocCheck ? '#fffbf7' : '#ffffff'; mauChuTuan = '#fd7e14'; mauChuCon = '#fd7e14'; iconNhacNho = "🚨 "; chuCanhBaoNho = "Sắp Đẻ"; }

                          return (
                            <TouchableOpacity
                              key={`grid3_clean_cell_${hangIdx}_${colIdx}`}
                              activeOpacity={0.7}
                              onPress={() => setTuanBauDangMoTab3(laOThuocCheck ? null : tuanKey)}
                              style={{ flex: 1, height: 52, borderRadius: 7, borderWidth: laOThuocCheck ? 1.8 : 0.8, borderColor: mauVienLuoi, backgroundColor: mauNenLuoi, alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '800', color: mauChuTuan }}>{iconNhacNho}{nhanTieuDeNut}</Text>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: mauChuCon, marginTop: 1 }}>{soConHienTai} Con</Text>
                              {chuCanhBaoNho && <Text style={{ fontSize: 8.5, fontWeight: '900', color: mauChuTuan, marginTop: 1, letterSpacing: 0.1 }}>{chuCanhBaoNho}</Text>}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ));
                })()}
              </View>
            )}
          </View>
          {/* KHỐI HIỂN THỊ CHI TIẾT MÃ TAI KHI CHẠM VÀO Ô LƯỚI CHU KỲ */}
          {tuanBauDangMoTab3 && (
            <View style={{ backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8, padding: 10, marginTop: 6, marginBottom: 15 }}>
              {(() => {
                const soTuanHienTai = tuanBauDangMoTab3.replace('t', '').trim();
                const laOThuocMoiPhoi = tuanBauDangMoTab3 === "t0";

                const mangRamSongGocChiTiet = global.danhSachCapNhatTrangThai || [];
                const danhSachMaTaiBauTuanNay = [];

                const layThuHaiDauTuanOutside = (dateObj) => {
                  if (!dateObj) return null;
                  const d = new Date(dateObj.getTime());
                  const day = d.getDay();
                  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                  d.setDate(diff);
                  d.setHours(0, 0, 0, 0);
                  return d;
                };

                const ngayHomNayObj = new Date();
                const thuHaiTuanNayObj = layThuHaiDauTuanOutside(ngayHomNayObj);

                if (Array.isArray(mangRamSongGocChiTiet) && mangRamSongGocChiTiet.length > 0 && thuHaiTuanNayObj) {
                  const doDaiMangSong = mangRamSongGocChiTiet.length;
                  
                  for (let j = 0; j < doDaiMangSong; j++) {
                    const dongHeo = mangRamSongGocChiTiet[j];
                    if (!dongHeo || dongHeo.vuaNhapMoi === true) continue;

                    const trangThaiSongNai = (dongHeo.trangThaiDienThoai || dongHeo.trangThaiCotH || dongHeo.trangThai || "Chờ Phối").toString().trim().toUpperCase();
                    if (trangThaiSongNai !== "PHỐI" && !trangThaiSongNai.includes("PHOI")) continue;

                    const maTaiChuanGamChuong = dongHeo.maTai ? dongHeo.maTai.toString().toUpperCase().trim() : "";
                    if (maTaiChuanGamChuong === "" || maTaiChuanGamChuong === "---") continue;

                    let ngayPhoiSong = "---";
                    let caPhoiGocObj = null;

                    if (Array.isArray(danhSachLichSu) && danhSachLichSu.length > 0) {
                      const doDaiLichSu = danhSachLichSu.length;
                      for (let k = 0; k < doDaiLichSu; k++) {
                        const sk = danhSachLichSu[k];
                        if (sk && sk.maTai && sk.maTai.toString().toUpperCase().trim() === maTaiChuanGamChuong && sk.actionType !== "delete") {
                          const txtS = (sk.suKien || "").toString().toUpperCase();
                          if (txtS.includes("PHỐI") || txtS.includes("PHOI") || txtS.includes("GIỐNG")) {
                            const dateCheck = parseToDateObject(sk.ngay);
                            if (dateCheck && (!caPhoiGocObj || dateCheck.getTime() > caPhoiGocObj.getTime())) {
                              caPhoiGocObj = dateCheck;
                              ngayPhoiSong = sk.ngay || "---";
                            }
                          }
                        }
                      }
                    }

                    if (ngayPhoiSong === "---") {
                      ngayPhoiSong = dongHeo.ngayPhoiDong || dongHeo.ngayCotI || "---";
                      caPhoiGocObj = parseToDateObject(ngayPhoiSong);
                    }

                    if (caPhoiGocObj) {
                      const thuHaiCuaNgayPhoiObj = layThuHaiDauTuanOutside(caPhoiGocObj);
                      
                      if (thuHaiCuaNgayPhoiObj) {
                        const khoangCachMiliGiay = thuHaiTuanNayObj.getTime() - thuHaiCuaNgayPhoiObj.getTime();
                        const soTuanLechThucTe = Math.round(khoangCachMiliGiay / (1000 * 60 * 60 * 24 * 7));
                        const khoangCachNgayMatTien = Math.round((ngayHomNayObj.getTime() - caPhoiGocObj.getTime()) / 1000 / 60 / 60 / 24);

                        let laKhopO_Check = false;
                        if (laOThuocMoiPhoi && soTuanLechThucTe === 0) {
                          laKhopO_Check = true;
                        } else if (!laOThuocMoiPhoi && soTuanLechThucTe === parseInt(soTuanHienTai, 10)) {
                          laKhopO_Check = true;
                        } else if (!laOThuocMoiPhoi && soTuanHienTai === "18" && soTuanLechThucTe >= 18) {
                          laKhopO_Check = true; 
                        }

                        if (laKhopO_Check) {
                          danhSachMaTaiBauTuanNay.push({
                            maTai: maTaiChuanGamChuong,
                            soNgayBauTinhDuocOutside: khoangCachNgayMatTien
                          });
                        }
                      }
                    }
                  }
                }
                danhSachMaTaiBauTuanNay.sort((a, b) => (a.maTai || "").toString().toUpperCase().localeCompare((b.maTai || "").toString().toUpperCase()));

                return (
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 5, borderBottomWidth: 0.5, borderBottomColor: '#e9ecef' }}>
                      <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#1a1f23' }}>
                        📋 {laOThuocMoiPhoi ? "DANH SÁCH HEO MỚI PHỐI" : `DANH SÁCH BẦU TUẦN THỨ ${soTuanHienTai}`}:
                      </Text>
                      <TouchableOpacity onPress={() => setTuanBauDangMoTab3(null)} style={{ backgroundColor: '#6c757d', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>Đóng x</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                      {danhSachMaTaiBauTuanNay.length === 0 ? (
                        <Text style={{ fontSize: 11, color: '#868e96', fontStyle: 'italic', paddingVertical: 4 }}>
                          Chưa có Mã Tai heo nái nào được ghi nhận ở mục này trên hệ thống.
                        </Text>
                      ) : (
                        danhSachMaTaiBauTuanNay.map((naiBau, nIdx) => {
                          const hienThiNgay = naiBau.soNgayBauTinhDuocOutside ?? 0;
                          return (
                            <View 
                              key={`grid3_clean_tag_${nIdx}`}
                              style={{ 
                                backgroundColor: laOThuocMoiPhoi ? '#e7f4ea' : '#fff5eb', 
                                borderWidth: 1, 
                                borderColor: laOThuocMoiPhoi ? '#a3cfbb' : '#ffd3b6', 
                                paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5,
                                minWidth: '31.5%', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              <Text style={{ color: '#212529', fontWeight: 'bold', fontSize: 11.5 }}>
                                {naiBau.maTai || "---"}
                              </Text>
                              <Text style={{ color: laOThuocMoiPhoi ? '#146c43' : '#e65100', fontSize: 9.5, fontWeight: '800', marginTop: 1 }}>
                                {hienThiNgay === 0 ? "Mới Phối ✨" : `${hienThiNgay} Ngày`}
                              </Text>
                            </View>
                          );
                        })
                      )}
                    </View>
                  </View>
                );
              })()}
            </View>
          )}
    {/* 📅 KHỐI THỐNG KÊ LƯỚI Ô VUÔNG LỊCH VẠN NIÊN PHẲNG 12 THÁNG (PREMIUM OPEN CALENDAR MATRIX) */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#eef2f6', marginBottom: 18 }}>
            <View style={{ marginBottom: 16, borderBottomWidth: 1.5, borderBottomColor: '#f1f3f5', paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#1a1f23', letterSpacing: 0.3 }}>📅 Lịch Phối / Dự Đẻ Trại ({new Date().getFullYear()})</Text>
                <Text style={{ fontSize: 11, color: '#8a929a', marginTop: 3 }}>Hiện các tháng/tuần có sự kiện. Bấm vào ô tuần để xem lý lịch nái</Text>
              </View>

              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => {
                  setHienBanDoTong(!hienBanDoTong);
                  global.tuan52DangMo = null; 
                  setTuanBauDangMoTab3(null);
                }}
                style={{ backgroundColor: hienBanDoTong ? '#fff0e6' : '#e65100', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 0.5, borderColor: '#ffd3b6' }}
              >
                <Text style={{ color: hienBanDoTong ? '#e65100' : '#ffffff', fontSize: 11, fontWeight: 'bold' }}>
                  {hienBanDoTong ? "Ẩn lịch ▲" : "Hiện lịch ▼"}
                </Text>
              </TouchableOpacity>
            </View>


            {hienBanDoTong && (() => {
              return (
                <View style={{ gap: 14 }}>
                  {khoDemXuyenNamHeThong.map((thangBlock, mIdx) => {
                    const mangCacKeyTuan = Object.keys(thangBlock.danhSachTuan).filter(kW => thangBlock.danhSachTuan[kW].phoi > 0 || thangBlock.danhSachTuan[kW].de > 0);
                    if (mangCacKeyTuan.length === 0) return null;

                    return (
                      <View key={`open_m_block_${mIdx}`} style={{ backgroundColor: '#fffdfb', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#ffd3b6' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 2 }}>
                          <Text style={{ fontSize: 11.5, fontWeight: '900', color: '#e65100' }}>
                            🗓️ {thangBlock.tenThang}
                          </Text>
                          <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#e65100' }}>
                            {thangBlock.phoiTong > 0 ? `Phối: ${thangBlock.phoiTong}` : ""}{thangBlock.phoiTong > 0 && thangBlock.deTong > 0 ? " | " : ""}{thangBlock.deTong > 0 ? `Dự Đẻ: ${thangBlock.deTong}` : ""} con
                          </Text>
                        </View>
                        
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                          {mangCacKeyTuan.map((kW) => {
                            const wNum = kW.replace('w', '');
                            const duLieuTuan = thangBlock.danhSachTuan[kW];
                            const ghimKeyUniq = `${thangBlock.nam}_${thangBlock.thang}_${kW}`;
                            const laTuanDangMoMatTien = global.tuan52DangMo === ghimKeyUniq;

                            return (
                              <TouchableOpacity
                                key={`sq_cell_flat_${ghimKeyUniq}`}
                                activeOpacity={0.65}
                                onPress={() => {
                                  // 🎯 BẢN VÁ QUYẾT ĐỊNH: Bơm trực tiếp dữ liệu vào State React để ép màn hình render ngay lập tức trong 0 giây
                                  setDanhSachNaiChiTietTuan(duLieuTuan.danhSachNai || []);
                                  global.tuan52DangMo = laTuanDangMoMatTien ? null : ghimKeyUniq;
                                  setTuanBauDangMoTab3(null);
                                }}
                                style={{
                                  width: '18.5%', 
                                  height: 48,
                                  borderRadius: 6,
                                  borderWidth: laTuanDangMoMatTien ? 1.8 : 0.8,
                                  borderColor: laTuanDangMoMatTien ? '#e65100' : '#fbc48c',
                                  backgroundColor: laTuanDangMoMatTien ? '#fff3cd' : '#fffcf5',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 1
                                }}
                              >
                                <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#e65100' }}>
                                  Tuần {wNum}
                                </Text>
                                <View style={{ marginTop: 2, alignItems: 'center' }}>
                                  {duLieuTuan.phoi > 0 && (
                                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#007bff', lineHeight: 10 }}>Phối: {duLieuTuan.phoi}</Text>
                                  )}
                                  {duLieuTuan.de > 0 && (
                                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#dc3545', lineHeight: 10 }}>Dự Đẻ: {duLieuTuan.de}</Text>
                                  )}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </View>

       {/* 🔔 BẢN VÁ TỐI CAO: Pop-up Modal sửa dứt điểm lỗi nghẽn vuốt cuộn khi tuần có nhiều nái */}
          <Modal
            visible={!!(hienBanDoTong && global.tuan52DangMo)}
            transparent={true}
            animationType="fade"
            onRequestClose={() => { global.tuan52DangMo = null; setDanhSachNaiChiTietTuan([]); setTuanBauDangMoTab3(null); }}
          >
            {/* 🎯 SỬA CHÍ MẠNG: Dùng View phẳng kết hợp nền mờ tuyệt đối độc lập, giải phóng hoàn toàn quyền trượt cuộn cho ScrollView */}
            <View style={{ flex: 1, backgroundColor: 'rgba(26, 31, 35, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 18 }}>
              
              {/* Nút tàng hình bọc lót: Bấm ra rìa ngoài vùng trắng vẫn đóng Pop-up nhanh như cũ */}
              <TouchableOpacity 
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
                activeOpacity={1} 
                onPress={() => { global.tuan52DangMo = null; setDanhSachNaiChiTietTuan([]); setTuanBauDangMoTab3(null); }} 
              />

              <View style={{ backgroundColor: '#ffffff', width: '100%', maxHeight: '75%', borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 24, zIndex: 99999 }}>
                
                {/* THANH ĐỈNH POP-UP */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#ffe5d4', borderStyle: 'dashed' }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#e65100', letterSpacing: 0.2 }}>
                    📋 DANH SÁCH MÃ TAI TUẦN LỊCH {(() => {
                      try {
                        const mangCatID = global.tuan52DangMo ? global.tuan52DangMo.toString().split('_') : [];
                        return mangCatID.length >= 3 ? mangCatID[2].replace('w', '') : (global.tuan52DangMo ? global.tuan52DangMo.toString().replace('w', '') : "");
                      } catch(e) { return ""; }
                    })()}:
                  </Text>
                  <TouchableOpacity 
                    onPress={() => { global.tuan52DangMo = null; setDanhSachNaiChiTietTuan([]); setTuanBauDangMoTab3(null); }} 
                    style={{ backgroundColor: '#f2f2f2', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#dee2e6' }}
                  >
                    <Text style={{ color: '#555555', fontSize: 11, fontWeight: 'bold', marginTop: -1 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* THÂN POP-UP: Ép trục trượt độc lập bằng nestedScrollEnabled liên thông kịch sàn */}
                <ScrollView 
                  nestedScrollEnabled={true} 
                  keyboardShouldPersistTaps="always"
                  showsVerticalScrollIndicator={true}
                >
                  <View style={{ gap: 6, paddingVertical: 2, paddingBottom: 10 }}>
                    {(!danhSachNaiChiTietTuan || danhSachNaiChiTietTuan.length === 0) ? (
                      <Text style={{ fontSize: 11.5, color: '#868e96', fontStyle: 'italic', paddingVertical: 15, textAlign: 'center' }}>Tuần này không có nái nào dính lịch mang thai.</Text>
                    ) : (
                      danhSachNaiChiTietTuan.map((heo, nIdx) => (
                        <TouchableOpacity 
                          key={`popup_52w_tag_${nIdx}`} 
                          activeOpacity={0.65}
                          onPress={() => {
                            global.tuan52DangMo = null; 
                            setDanhSachNaiChiTietTuan([]); 
                            setTuanBauDangMoTab3(null);
                            
                            let thongTinNaiGoc = { maTai: heo.maTai, trangThaiDienThoai: heo.loai };
                            if (Array.isArray(danhSachMaTai)) {
                              const timNai = danhSachMaTai.find(h => h && h.maTai && h.maTai.toString().toUpperCase().trim() === heo.maTai.toString().toUpperCase().trim());
                              if (timNai) thongTinNaiGoc = timNai;
                            }
                            
                            if (typeof handleXemChiTietHeo === 'function') {
                              handleXemChiTietHeo(thongTinNaiGoc);
                            }
                          }}
                          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: heo.loai === "Phối" ? '#f4f8ff' : '#fffafb', borderWidth: 0.8, borderColor: heo.loai === "Phối" ? '#b8daff' : '#fbc48c', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ fontSize: 12.5, color: '#666666', fontWeight: '500' }}>Mã số:</Text>
                            <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4, borderWidth: 0.5, borderColor: heo.loai === "Phối" ? '#b8daff' : '#fbc48c' }}>
                              <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 12.5 }}>{heo.maTai || "---"} 🔎</Text>
                            </View>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: heo.loai === "Phối" ? '#007bff' : '#dc3545', fontSize: 11, fontWeight: '800' }}>
                              {heo.loai === "Phối" ? "PHỐI GIỐNG" : "NÁI DỰ KIẾN ĐẺ"}
                            </Text>
                            <Text style={{ color: '#7f8c8d', fontSize: 9.5, marginTop: 3, fontStyle: 'italic' }}>Ngày: {heo.ngay}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </ScrollView>

              </View>
            </View>
          </Modal>

 
        {/* 🌾 KHỐI 4: DỰ KIẾN TIÊU THỤ CÁM TRONG THÁNG (ĐÃ VÁ ĐỌC TRỰC TIẾP TỪ KHAY ĐÀN HEO THỊT) */}
        {(() => {
          const laySoCamAnToan = (val) => (!val || isNaN(val.toString().trim()) || val.toString().trim() === "") ? 0 : Number(val.toString().trim());
          const khoHeoThitTmp = dataHeoThit || {};
          global.camHeoThitAnToan = laySoCamAnToan(khoHeoThitTmp.camHeoThit);
          global.camHeoNaiAnToan = laySoCamAnToan(khoHeoThitTmp.camHeoNai);
          global.tongCamToanTraiThangNay = global.camHeoThitAnToan + global.camHeoNaiAnToan;
          return null;
        })()}

        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0056b3', marginBottom: 8, letterSpacing: 0.5 }}>🌾 DỰ KIẾN TIÊU THỤ CÁM THÁNG NÀY</Text>
        <View style={{ backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#e9ecef' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
            <Text style={{ fontSize: 13, color: '#495057', fontWeight: '500' }}>Dự kiến cám Heo Thịt</Text>
            <Text style={{ fontSize: 14, color: '#111111', fontWeight: 'bold' }}>{global.camHeoThitAnToan} Kg</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
            <Text style={{ fontSize: 13, color: '#495057', fontWeight: '500' }}>Dự kiến cám Heo Nái</Text>
            <Text style={{ fontSize: 14, color: '#111111', fontWeight: 'bold' }}>{global.camHeoNaiAnToan} Kg</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, marginTop: 4, backgroundColor: '#e7f1ff', paddingHorizontal: 8, borderRadius: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0056b3' }}>Tổng Dự Kiến Cám</Text>
            <Text style={{ color: '#0056b3', fontSize: 16, fontWeight: 'bold' }}>{global.tongCamToanTraiThangNay} Kg</Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
};

export default StatisticsTab;

