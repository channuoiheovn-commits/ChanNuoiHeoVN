import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert, Animated, Easing } from 'react-native';
import { layNoiCoHeoTheoTuan } from './ChoXepChuong';
import { tuoiDongChuong } from './SoHeoThit'; // 📍 heo của 1 tuần tuổi đang nằm ở đâu
import FarmMapSubTab from './FarmMapSubTab';
import { duocSuaXoa, duocThem, NhanChiXem, NhanNguoiNhap, laChuTrai } from './nguoiNhap'; // 🔐 quyền + ✍️ người tạo

const PigMeatTab = ({ currentTab, styles, formatVNDate, dataHeoThit, danhSachLichSu, lichSuHeoThit, lichSuHeo, historyData, dataLichSu, openGiaiDoan, setOpenGiaiDoan, handleMoModalHeoThit, handleMoSuaHeoThit, handleXoaXoaNhatKyChuDong, handleXoaNhatKyChuDong,danhSachChuongThit, 
  setDanhSachChuongThit, 
  WEB_APP_URL, 
  userEmail, 
  setDongBoStatus,
  cauHinhVacXinLoc, nutCapNhat }) => {
  if (currentTab !== 'heo_thit') return null;
  const [tuanChon, setTuanChon] = useState(null); // { tuoi, tong } ô tuần đang chạm: xem heo tuần đó nằm ở đâu
  // 🎞 Hiệu ứng cửa sổ tuần: nền mờ dần + khung nổi nhẹ lên (phóng 0.94 -> 1). Lúc đóng giữ nguyên nội dung tới khi mờ hẳn, không bị nháy khung trống.
  const [hienTuan, setHienTuan] = useState(false);
  const animTuan = useRef(new Animated.Value(0)).current;
  const moTuan = (v) => { animTuan.setValue(0); setTuanChon(v); setHienTuan(true); };
  const chayMoTuan = () => Animated.timing(animTuan, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  const dongTuan = (nhanh) => {
    if (nhanh) { setHienTuan(false); setTuanChon(null); return; }
    Animated.timing(animTuan, { toValue: 0, duration: 150, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => { setHienTuan(false); setTuanChon(null); });
  };
  const [yeuCauMoChuong, setYeuCauMoChuong] = useState(null); // { tenKhu, tenChuong, lan } nhờ sơ đồ mở 1 ô chuồng
  const [tabCon, setTabCon] = useState('DAN'); // 'DAN' = Đàn heo · 'NANG_SUAT' = Cám & năng suất
  const [moLichSuCu, setMoLichSuCu] = useState(false); // 📜 Lịch sử bản cũ: thu gọn mặc định

  // 🧠 BỘ NÃO GOM MẢNG TOÀN CỤC: Đặt ở đỉnh file để nuôi sống khay hiển thị Nhật ký
  const mangLichSuGocRealTime = Array.isArray(danhSachLichSu) ? danhSachLichSu : 
                                (Array.isArray(lichSuHeoThit) ? lichSuHeoThit : 
                                (Array.isArray(lichSuHeo) ? lichSuHeo : 
                                (Array.isArray(historyData) ? historyData : 
                                (Array.isArray(dataLichSu) ? dataLichSu : []))));

  // ========================================================
  // 🐷 TAB HEO THỊT — 1 MÀN HÌNH DUY NHẤT
  // 1. Dòng tổng: heo ở đâu (theo mẹ / chờ xếp / trong chuồng)
  // 2. Số heo theo tuần tuổi: CHỈ XEM (chạm 1 tuần để biết heo nằm ở ô nào)
  // 3. Ô chuồng: nơi DUY NHẤT để Nhập / Bán / Hao hụt / Luân chuyển (Chờ xếp chuồng là ô đầu tiên)
  // 4. Nhật ký + lịch sử bản cũ: thu gọn ở cuối
  // ========================================================
  const laySo = (v) => { const n = Number(String(v ?? '').trim()); return isNaN(n) ? 0 : n; };
  const dsCho = dataHeoThit && Array.isArray(dataHeoThit.choXepTheoTuoi) ? dataHeoThit.choXepTheoTuoi : [];
  const nguon = (dataHeoThit && dataHeoThit.nguon) || { theoMe: 0, choXep: 0, daXep: 0 };
  const tongHeo = dataHeoThit ? laySo(dataHeoThit.tongHeoThitSauBuTruRealTime) : 0;
  const cacTuan = [];
  for (let t = 2; t <= 30; t++) cacTuan.push({ tuoi: t, so: dataHeoThit ? laySo(dataHeoThit[`${t} Tuần`]) : 0 });
  // Giai đoạn như bản cũ (tu..den = tuần tuổi); gd6, gd7 tô đỏ: heo lớn, sắp xuất chuồng
  const GIAI_DOAN = [
    { ma: 'gd1', ten: 'Theo Mẹ', phu: 'Chưa cai sữa' },
    { ma: 'gd2', ten: 'Cai Sữa', phu: '2 – 4 tuần', tu: 2, den: 4 },
    { ma: 'gd3', ten: '10 – 30 kg', phu: '5 – 9 tuần', tu: 5, den: 9 },
    { ma: 'gd4', ten: '30 – 60 kg', phu: '10 – 15 tuần', tu: 10, den: 15 },
    { ma: 'gd5', ten: '60 – 100 kg', phu: '16 – 20 tuần', tu: 16, den: 20 },
    { ma: 'gd6', ten: '100 – 130 kg', phu: '21 – 25 tuần', tu: 21, den: 25, do: true },
    { ma: 'gd7', ten: '130 kg – Xuất Chuồng', phu: '26 – 30 tuần trở lên', tu: 26, den: 30, do: true },
  ];

  const moChuong = (noi) => { dongTuan(true); setYeuCauMoChuong({ tenKhu: noi.laChoXep ? 'CHO_XEP' : noi.tenKhu, tenChuong: noi.laChoXep ? '' : noi.tenChuong, tuoi: noi.tuoiThat, lan: Date.now() }); };


  const chuongMoi = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
  // 📜 Nhập đàn / Bán / Hao hụt ghi theo cách cũ: hiện chung trong Nhật ký toàn bộ ô chuồng (vẫn tính vào báo cáo như trước)
  const lichSuBanCu = mangLichSuGocRealTime.filter((e) => e && e.actionType !== 'delete' && e.syncStatus !== 'delete' && ['BÁN', 'HAO HỤT', 'NHẬP ĐÀN'].includes(String(e.suKien || '').trim().toUpperCase()));
  const cacTabCon = [{ ma: 'DAN', ten: 'Đàn Heo' }, { ma: 'NANG_SUAT', ten: 'Cám & Năng Suất' }];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      contentContainerStyle={{ padding: 12, paddingBottom: 200 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
    >
      {/* 2 TAB CON: Đàn heo (xem + thao tác) · Cám & năng suất (tính toán, làm sau) */}
      <View style={{ flexDirection: 'row', backgroundColor: '#f1f3f5', padding: 4, borderRadius: 10, marginBottom: 12, gap: 4 }}>
        {cacTabCon.map((t) => {
          const chon = tabCon === t.ma;
          return (
            <TouchableOpacity key={t.ma} activeOpacity={0.7} onPress={() => setTabCon(t.ma)}
              style={{ flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', backgroundColor: chon ? '#ffffff' : 'transparent', elevation: chon ? 1 : 0, shadowColor: '#000', shadowOpacity: chon ? 0.08 : 0, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}>
              <Text style={{ fontSize: cacTabCon.length > 2 ? 12 : 13, fontWeight: 'bold', color: chon ? '#e65100' : '#6c757d' }} numberOfLines={1}>{t.ten}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tabCon === 'NANG_SUAT' ? (
        <View style={{ backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: '#1a1f23', marginBottom: 6 }}>Cám & Năng Suất</Text>
          <Text style={{ fontSize: 12.5, color: '#495057', lineHeight: 19 }}>
            Phần này đang được xây dựng. Sắp tới sẽ có:{'\n'}
            • Lượng cám đã dùng theo ô chuồng và cả trại{'\n'}
            • Dự kiến cám cần dùng tuần / tháng tới{'\n'}
            • Hệ số chuyển hóa thức ăn (FCR), tăng trọng, tỷ lệ hao hụt
          </Text>
        </View>
      ) : !dataHeoThit ? (
        <Text style={styles.emptyText}>Trại này hiện chưa có dữ liệu heo thịt.</Text>
      ) : (
        <View style={{ width: '100%' }}>
          {/* 1. DÒNG TỔNG */}
          <View style={{ backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#1a1f23' }}>HEO THỊT</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#137333' }}>{tongHeo} con</Text>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 8, gap: 6 }}>
              {[
                { ten: 'Theo mẹ', so: nguon.theoMe, mau: '#16a34a' },
                { ten: 'Chưa xếp chuồng', so: nguon.choXep, mau: '#b26a00' },
                { ten: 'Trong chuồng', so: nguon.daXep, mau: '#0056b3' },
              ].map((x) => (
                <View key={x.ten} style={{ flex: 1, alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 8, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: x.mau }}>{x.so}</Text>
                  <Text style={{ fontSize: 10.5, color: '#6c757d' }} numberOfLines={1} adjustsFontSizeToFit>{x.ten}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 2. SỐ HEO THEO GIAI ĐOẠN / TUẦN TUỔI — chỉ xem. Chạm 1 giai đoạn để bung các tuần, chạm 1 tuần để xem heo nằm ở ô nào */}
          <View style={{ marginBottom: 14, gap: 6 }}>
            {GIAI_DOAN.map((gd, gIdx) => {
              const cacT = gd.tu ? cacTuan.filter((x) => x.tuoi >= gd.tu && x.tuoi <= gd.den) : [];
              const tongGd = gd.ma === 'gd1' ? laySo(nguon.theoMe) : cacT.reduce((a, x) => a + x.so, 0);
              const mo = gd.tu && openGiaiDoan && openGiaiDoan[gd.ma];
              const mau = gd.do ? '#c82333' : '#137333';
              return (
                <View key={gd.ma} style={{ borderWidth: 1, borderColor: gd.do ? '#f5c6cb' : '#dee2e6', borderRadius: 10, overflow: 'hidden', backgroundColor: '#ffffff' }}>
                  <TouchableOpacity activeOpacity={gd.tu ? 0.6 : 1} disabled={!gd.tu}
                    onPress={() => setOpenGiaiDoan((prev) => ({ ...(prev || {}), [gd.ma]: !(prev && prev[gd.ma]) }))}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: mo ? '#f8f9fa' : '#ffffff' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1a1f23' }}>Giai đoạn {gd.ten}</Text>
                      <Text style={{ fontSize: 10.5, color: '#8a929a' }}>{gd.phu}</Text>
                    </View>
                    <Text style={{ fontSize: 14.5, fontWeight: '900', color: tongGd > 0 ? mau : '#adb5bd' }}>{tongGd} con</Text>
                    <Text style={{ width: 22, textAlign: 'right', fontSize: 11, color: '#adb5bd' }}>{gd.tu ? (mo ? '▲' : '▼') : ''}</Text>
                  </TouchableOpacity>
                  {mo && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, paddingHorizontal: 12, paddingBottom: 10, backgroundColor: '#f8f9fa' }}>
                      {cacT.map((x) => (
                        <TouchableOpacity key={`tuan_${x.tuoi}`} activeOpacity={0.6} onPress={() => moTuan({ tuoi: x.tuoi, tong: x.so })}
                          style={{ width: '18.5%', paddingVertical: 5, alignItems: 'center', borderRadius: 7, backgroundColor: '#ffffff', borderWidth: 1, borderColor: x.so > 0 ? (gd.do ? '#f5c6cb' : '#c8e6c9') : '#eef0f2' }}>
                          <Text style={{ fontSize: 12, fontWeight: '900', color: x.so > 0 ? mau : '#adb5bd' }}>{x.tuoi} Tuần</Text>
                          <Text style={{ fontSize: 10.5, color: x.so > 0 ? '#495057' : '#ced4da' }}>{x.so} con</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* 3. Ô CHUỒNG — nơi thao tác duy nhất */}
          <FarmMapSubTab
            danhSachChuongThit={chuongMoi}
            setDanhSachChuongThit={setDanhSachChuongThit}
            WEB_APP_URL={WEB_APP_URL}
            userEmail={userEmail}
            setDongBoStatus={setDongBoStatus}
            cauHinhVacXinLoc={cauHinhVacXinLoc}
            choXepTheoTuoi={dsCho}
            yeuCauMoChuong={yeuCauMoChuong}
            lichSuBanCu={lichSuBanCu}
            onSuaBanCu={handleMoSuaHeoThit}
            onXoaBanCu={typeof handleXoaNhatKyChuDong === 'function' ? handleXoaNhatKyChuDong : handleXoaXoaNhatKyChuDong}
          />

        </View>
      )}


      {/* 📍 CHẠM 1 TUẦN: heo tuần đó đang nằm ở đâu (chạm vào tên ô để mở ô đó) */}
      <Modal visible={hienTuan} transparent animationType="none" statusBarTranslucent onShow={chayMoTuan} onRequestClose={() => dongTuan()}>
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', opacity: animTuan }} />
        <TouchableOpacity activeOpacity={1} onPress={() => dongTuan()} style={{ flex: 1, justifyContent: 'center', padding: 22 }}>
          <Animated.View style={{ opacity: animTuan, transform: [{ scale: animTuan.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }, { translateY: animTuan.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 16 }}>
            {tuanChon && (() => {
              const tongSong = (cacTuan.find((x) => x.tuoi === tuanChon.tuoi) || { so: tuanChon.tong }).so; // số mới nhất, không đứng ở lúc chạm
              const cacNoi = layNoiCoHeoTheoTuan(tuanChon.tuoi, dsCho, chuongMoi);
              const conLai = tongSong - cacNoi.reduce((a, x) => a + x.soCon, 0);
              return (
                <View>
                  <Text style={{ fontSize: 17, fontWeight: '900', color: '#1a1f23' }}>Heo {tuanChon.tuoi} tuần tuổi</Text>
                  <Text style={{ fontSize: 12.5, color: '#495057', marginTop: 2, marginBottom: 12 }}>Tổng: <Text style={{ fontWeight: '900' }}>{tongSong} con</Text></Text>
                  {cacNoi.length === 0 && conLai <= 0 && <Text style={{ fontSize: 12, color: '#8a929a', marginBottom: 6 }}>Không có heo tuần này.</Text>}
                  {cacNoi.map((x) => (
                    <TouchableOpacity key={x.khoa} activeOpacity={0.6} onPress={() => moChuong(x)}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' }}>
                      <Text style={{ flex: 1, fontSize: 13.5, fontWeight: 'bold', color: x.laChoXep ? '#b26a00' : '#0056b3' }}>
                        {x.ten}{x.tuoiThat !== tuanChon.tuoi ? ` · ${x.tuoiThat} tuần` : ''}
                      </Text>
                      <Text style={{ fontSize: 13.5, fontWeight: '900', color: '#1a1f23', marginRight: 8 }}>{x.soCon} con</Text>
                      <Text style={{ fontSize: 14, color: '#adb5bd' }}>›</Text>
                    </TouchableOpacity>
                  ))}
                  {conLai > 0 && (
                    <View style={{ flexDirection: 'row', paddingVertical: 11 }}>
                      <Text style={{ flex: 1, fontSize: 13, color: '#6c757d' }}>Chưa nằm trong ô nào (số liệu bản cũ)</Text>
                      <Text style={{ fontSize: 13.5, fontWeight: '900', color: '#6c757d', marginRight: 16 }}>{conLai} con</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 10.5, color: '#8a929a', marginTop: 10 }}>Chạm vào tên ô để mở ô đó và Bán / Hao hụt / Luân chuyển.</Text>
                  <TouchableOpacity onPress={() => dongTuan()} style={{ marginTop: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#f1f3f5' }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#495057' }}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

export default PigMeatTab;