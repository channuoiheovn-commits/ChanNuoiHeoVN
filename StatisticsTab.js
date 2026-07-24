import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

const StatisticsTab = ({
  currentTab,
  styles,
  parseToDateObject,
  
  // Dữ liệu báo cáo tổng nạp từ Server và State gác cổng
  dataThongKe,
  danhSachLichSu,
  tuanBauDangMoTab3, setTuanBauDangMoTab3
}) => {
  if (currentTab !== 'thong_ke') return null;

  const mangRamThongKe = global.danhSachCapNhatTrangThai || [];
  const soConDangDe = mangRamThongKe.filter(heo => heo && heo.trangThaiDienThoai === "Đẻ").length;
  const soConMangBau = mangRamThongKe.filter(heo => heo && heo.trangThaiDienThoai === "Phối").length;
  const soConChoPhoi = mangRamThongKe.filter(heo => heo && heo.trangThaiDienThoai === "Chờ Phối").length;
  const soConCaiSua = mangRamThongKe.filter(heo => heo && heo.trangThaiDienThoai === "Cai Sữa").length;
  const soConLoc = mangRamThongKe.filter(heo => heo && heo.trangThaiDienThoai === "Lốc").length;
  const soConSayThai = mangRamThongKe.filter(heo => heo && heo.trangThaiDienThoai === "Sảy Thai").length;

  const soConChuaPhoi = soConChoPhoi + soConCaiSua + soConLoc + soConSayThai;
  const tongSoHeoNaiSong = soConDangDe + soConMangBau + soConChuaPhoi;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 15, paddingBottom: 100 }}>
      {dataThongKe && dataThongKe[0] ? (
        <View>
          
          {/* KHỐI 2: TỔNG QUAN CƠ SỞ ĐÀN NÁI HIỆN TẠI */}
          <View style={{ marginBottom: 8, width: '100%' }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#e65100', letterSpacing: 0.5 }}>📈 TỔNG QUAN ĐÀN NÁI</Text>
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#7f8c8d', fontStyle: 'italic', marginTop: 3 }}>( Số liệu sống thời gian thực đồng bộ ngoài RAM lán trại )</Text>
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
                <Text style={{ fontSize: 12.5, color: '#666666' }}>Chờ Phối</Text>
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
          {/* KHỐI 3: TIÊU CHUẨN TỈ LỆ NĂNG SUẤT NĂM HIỆN TẠI */}
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#28a745', marginBottom: 8, letterSpacing: 0.5 }}>📊 CHỈ SỐ NĂNG SUẤT </Text>
          <View style={{ backgroundColor: '#f4fbf7', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#c3e6cb' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#d4edda' }}>
              <Text style={{ fontSize: 13, color: '#444444', fontWeight: '500' }}>Tỉ Lệ Đẻ Thành Công</Text>
              <Text style={{ fontSize: 15, color: '#28a745', fontWeight: 'bold' }}>{dataThongKe[0].tiLeDe}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, color: '#444444', fontWeight: '500' }}>Tỉ Lệ Cai Sữa Đạt</Text>
              <Text style={{ fontSize: 15, color: '#007bff', fontWeight: 'bold' }}>{dataThongKe[0].tiLeCaiSua}</Text>
            </View>
          </View>

          {/* 📊 KHỐI THỐNG KÊ LƯỚI 19 Ô BẦU THEO CHU KỲ TUẦN */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eef2f5', marginTop: 12, marginBottom: 15 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#1a1f23', letterSpacing: 0.2 }}>📊 THỐNG KÊ NÁI BẦU</Text>
              <Text style={{ fontSize: 11.5, color: '#8a929a', marginTop: 2 }}>So lieu song thoi gian thuc tu dong tinh tuan tuoi phang sach ngoai RAM.</Text>
            </View>

            <View style={{ gap: 5, marginBottom: 5 }}>
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
                  d.setDate(diff);
                  d.setHours(0, 0, 0, 0);
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
                              caPhoiTimDuoc = dateCheck;
                              ngayPhoiSong = sk.ngay || "---";
                            }
                          }
                        }
                      }
                    }

                    if (ngayPhoiSong === "---") {
                      ngayPhoiSong = dongHeo.ngayPhoiDong || dongHeo.ngayCotI || "---";
                    }

                    const ngayPhoiGocObj = parseToDateObject(ngayPhoiSong);
                    if (ngayPhoiGocObj) {
                      const thuHaiCuaNgayPhoiObj = layThuHaiDauTuan(ngayPhoiGocObj);
                      if (thuHaiCuaNgayPhoiObj) {
                        const khoangCachMiliGiay = thuHaiTuanNayObj.getTime() - thuHaiCuaNgayPhoiObj.getTime();
                        const soTuanLechThucTe = Math.round(khoangCachMiliGiay / (1000 * 60 * 60 * 24 * 7));

                        if (soTuanLechThucTe === 0) {
                          khoDemTuanBauRealTime["t0"] += 1;
                        } else if (soTuanLechThucTe >= 1 && soTuanLechThucTe <= 17) {
                          khoDemTuanBauRealTime[`t${soTuanLechThucTe}`] += 1;
                        } else if (soTuanLechThucTe >= 18) {
                          khoDemTuanBauRealTime["t18"] += 1;
                        }
                      }
                    }
                  }
                }
                const rowGroupData = [];
                for (let i = 0; i < arrayPregnancyWeeks.length; i += 3) {
                  rowGroupData.push(arrayPregnancyWeeks.slice(i, i + 3));
                }
                return rowGroupData.map((hangData, hangIdx) => {
                  return (
                    <View key={`clean_row_group_${hangIdx}`} style={{ width: '100%' }}>
                      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 5 }}>
                        {hangData.map((tuanKey, colIdx) => {
                          const soConHienTai = (khoDemTuanBauRealTime[tuanKey] || 0).toString();
                          const laOThuocCheck = tuanBauDangMoTab3 === tuanKey;
                          const coHeo = Number(soConHienTai) > 0;

                          let mauVienLuoi = laOThuocCheck ? '#1a1f23' : '#e9ecef';
                          let mauNenLuoi = laOThuocCheck ? '#f1f3f5' : '#ffffff';
                          let mauChuTuan = '#495057';
                          let mauChuCon = coHeo ? '#1a1f23' : '#adb5bd';
                          let iconNhacNho = "";
                          let nhanTieuDeNut = `Bầu Tuần ${tuanKey.replace('t', '')}`;
                          let chuCanhBaoNho = null;

                          if (tuanKey === "t0") {
                            nhanTieuDeNut = "Mới Phối";
                            if (!laOThuocCheck) {
                              mauVienLuoi = '#007bff'; 
                              mauNenLuoi = '#ffffff';
                            }
                          }

                          if (!laOThuocCheck && tuanKey !== "t0") {
                            if (tuanKey === "t4" || tuanKey === "t7" || tuanKey === "t10") {
                              mauVienLuoi = '#20c997'; 
                            }
                          }

                          if (tuanKey === "t18") {
                            mauVienLuoi = laOThuocCheck ? '#dc3545' : '#f5c6cb';
                            mauNenLuoi = laOThuocCheck ? '#fff5f5' : '#ffffff';
                            mauChuTuan = '#dc3545';
                            mauChuCon = '#dc3545';
                            iconNhacNho = "🚨 "; 
                            chuCanhBaoNho = "Kiểm Tra Gấp";
                          } else if (tuanKey === "t16" || tuanKey === "t17") {
                            mauVienLuoi = laOThuocCheck ? '#fd7e14' : '#ffe0b2';
                            mauNenLuoi = laOThuocCheck ? '#fffbf7' : '#ffffff';
                            mauChuTuan = '#fd7e14';
                            mauChuCon = '#fd7e14';
                            iconNhacNho = "🚨 "; 
                            chuCanhBaoNho = "Sắp Đẻ";
                          }

                          return (
                            <TouchableOpacity
                              key={`grid3_clean_cell_${hangIdx}_${colIdx}`}
                              activeOpacity={0.7}
                              onPress={() => setTuanBauDangMoTab3(laOThuocCheck ? null : tuanKey)}
                              style={{
                                flex: 1, 
                                height: 52, 
                                borderRadius: 7,
                                borderWidth: laOThuocCheck ? 1.8 : 0.8,
                                borderColor: mauVienLuoi,
                                backgroundColor: mauNenLuoi || '#ffffff',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '800', color: mauChuTuan }}>
                                {iconNhacNho}{nhanTieuDeNut}
                              </Text>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: mauChuCon, marginTop: 1 }}>
                                {soConHienTai} Con
                              </Text>

                              {chuCanhBaoNho && (
                                <Text style={{ fontSize: 8.5, fontWeight: '900', color: mauChuTuan, marginTop: 1, letterSpacing: 0.1 }}>
                                  {chuCanhBaoNho}
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                });
              })()}
            </View>
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
                        📋 {laOThuocMoiPhoi ? "DANH SÁCH HEO MỚI PHỐI (TUẦN LỊCH HIỆN HÀNH)" : `DANH SÁCH BẦU TUẦN LỊCH THỨ ${soTuanHienTai}`}:
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

          {/* KHỐI 4: DỰ KIẾN TIÊU THỤ CÁM TRONG THÁNG */}
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0056b3', marginBottom: 8, letterSpacing: 0.5 }}>🌾 DỰ KIẾN TIÊU THỤ CÁM THÁNG NÀY</Text>
          <View style={{ backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#e9ecef' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
              <Text style={{ fontSize: 13, color: '#495057', fontWeight: '500' }}>Dự kiến cám Heo Thịt</Text>
              <Text style={{ fontSize: 14, color: '#111111', fontWeight: 'bold' }}>{dataThongKe[0]?.heoThit || 0} Kg</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
              <Text style={{ fontSize: 13, color: '#495057', fontWeight: '500' }}>Dự kiến cám Heo Nái</Text>
              <Text style={{ fontSize: 14, color: '#111111', fontWeight: 'bold' }}>{dataThongKe[0]?.heoNaiCam || 0} Kg</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, marginTop: 4, backgroundColor: '#e7f1ff', paddingHorizontal: 8, borderRadius: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0056b3' }}>Tổng Dự Kiến Cám</Text>
              <Text style={{ color: '#0056b3', fontSize: 16, fontWeight: 'bold' }}>{dataThongKe[0]?.duKienCam || 0} Kg</Text>
            </View>
          </View>

        </View>
      ) : (
        <Text style={styles.emptyText}>Trại hiện tại chưa có dữ liệu báo cáo Thống Kê tổng hợp trên Server.</Text>
      )}
    </ScrollView>
  );
};

export default StatisticsTab;
