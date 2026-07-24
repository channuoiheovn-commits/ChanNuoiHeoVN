import React from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';

const SowRegistryTab = ({
  currentTab, styles, parseToDateObject, formatStringtoVN, formatVNDate, WEB_APP_URL, userEmail,
  searchTxtTab2, setSearchTxtTab2, nhomNaiTab2, setNhomNaiTab2, danhSachLichSu, danhSachMaTai, setDanhSachMaTai, danhSachLuaHeo,
  mtMaTai, setMtMaTai, mtGiong, setMtGiong, mtLua, setMtLua,
  setIsQuickAddModalVisible, setSelectedHeoDetail, setIsDetailModalVisible, setLoadingLichSuDe, setMangLichSuDeCuaTai, handleSaveMaTai, handleMtEditClick, setDongBoStatus, guiYeuCauMang
}) => {
  if (currentTab !== 'ma_tai') return null;

  return (
    <View style={{ flex: 1, paddingBottom: 80, width: '100%' }}>
      <View style={{ paddingHorizontal: 15, marginTop: 12, marginBottom: 5 }}>
        <TextInput style={[styles.inputStandard, { marginBottom: 0, borderRadius: 20, paddingHorizontal: 15, height: 42, backgroundColor: '#f2f2f2', borderWidth: 0, color: '#111111', fontSize: 14 }]} placeholder="🔍 Nhập Mã Tai để tìm kiếm..." placeholderTextColor="#888888" value={searchTxtTab2} onChangeText={setSearchTxtTab2} autoCapitalize="characters" />
      </View>

      <FlatList
        data={(global.danhSachCapNhatTrangThai || [])
          .filter(dongLoc => {
            if (!dongLoc || dongLoc.vuaNhapMoi === true) return false;
            if (searchTxtTab2 && searchTxtTab2.trim() !== "") {
              return (dongLoc.maTai ? dongLoc.maTai.toString().toLowerCase().trim() : "").includes(searchTxtTab2.toLowerCase().trim());
            }
            const trangThaiGocTho = dongLoc.trangThaiDienThoai || dongLoc.trangThai || "Chờ Phối";
            const chuoiTrangThaiChuan = trangThaiGocTho.toString().trim().normalize("NFC");

            if (nhomNaiTab2 === 'Cho Phoi') {
              return chuoiTrangThaiChuan === "Chờ Phối" || chuoiTrangThaiChuan === "Cai Sữa" || chuoiTrangThaiChuan === "Cai sữa" || chuoiTrangThaiChuan === "Lốc" || chuoiTrangThaiChuan === "Sảy Thai";
            } 
            if (nhomNaiTab2 === 'Phoi') return chuoiTrangThaiChuan === "Phối" || chuoiTrangThaiChuan === "PHỐI";
            if (nhomNaiTab2 === 'De') return chuoiTrangThaiChuan === "Đẻ" || chuoiTrangThaiChuan === "ĐỂ" || chuoiTrangThaiChuan === "ĐẺ";
            if (nhomNaiTab2 === 'Thai') return chuoiTrangThaiChuan === "Thải" || chuoiTrangThaiChuan === "THẢI";
            return false; 
          })
          .sort((a, b) => {
            if (nhomNaiTab2 === 'Cho Phoi') {
              const layTrongSoUuTien = (trangThai) => {
                if (trangThai === "Cai Sữa") return 1;
                if (trangThai === "Sảy Thai") return 2;
                if (trangThai === "Lốc") return 3;
                return 4;
              };
              let trongSoA = layTrongSoUuTien(a.trangThaiDienThoai);
              let trongSoB = layTrongSoUuTien(b.trangThaiDienThoai);
              if (trongSoA !== trongSoB) return trongSoA - trongSoB;
            } else if (nhomNaiTab2 === 'De') {
              const layMocThoiGianDeAnToan = (m) => (!m || !m.ngayDeDongThoiGianThuc) ? 0 : (parseToDateObject(m.ngayDeDongThoiGianThuc)?.getTime() || 0);
              let mocA = layMocThoiGianDeAnToan(a); let mocB = layMocThoiGianDeAnToan(b);
              if (mocA === 0 && mocB !== 0) return 1; if (mocA !== 0 && mocB === 0) return -1;
              if (mocA !== mocB) return mocA - mocB;
            } else {
              const layMocThoiGianDuSinhAnToan = (m) => {
                if (!m || !m.ngayDuKienDeMoi || m.ngayDuKienDeMoi.toString().trim() === "" || m.ngayDuKienDeMoi.toString().trim() === "---") return 0;
                return parseToDateObject(m.ngayDuKienDeMoi.toString().trim())?.getTime() || 0;
              };
              let mocA = layMocThoiGianDuSinhAnToan(a); let mocB = layMocThoiGianDuSinhAnToan(b);
              if (mocA === 0 && mocB !== 0) return 1; if (mocA !== 0 && mocB === 0) return -1;
              if (mocA !== mocB) return mocA - mocB;
            }
            return (b.id ? b.id.toString() : "").localeCompare(a.id ? a.id.toString() : "");
          })
        }
        keyExtractor={(i) => i && i.id ? i.id.toString() : Math.random().toString()}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListHeaderComponent={
          <View style={{ backgroundColor: '#ffffff', paddingBottom: 5 }}>
            {!searchTxtTab2 ? (
              <View>
                <View style={[styles.formFixedContainer, { backgroundColor: '#fffaf5', borderWidth: 1.2, borderColor: '#ffd3b6', borderRadius: 10, padding: 12, shadowColor: "#e65100", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 }]}>
                  <View style={{ alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ffe5d4', paddingBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: '#e65100', fontWeight: 'bold' }}>📌 TẠO MỚI HEO NÁI VÀO SỔ</Text>
                  </View>
                  <View style={[styles.rowInput, { marginBottom: 10 }]}>
                    <TextInput style={[styles.inputStandard, { flex: 1, marginBottom: 0, marginRight: 8, color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', height: 42, fontSize: 14, paddingVertical: 0 }]} placeholder="Mã Tai" placeholderTextColor="#777777" value={mtMaTai} onChangeText={setMtMaTai} autoCapitalize="characters" />
                    <TextInput style={[styles.inputStandard, { flex: 1, marginBottom: 0, color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', height: 42, fontSize: 14, paddingVertical: 0 }]} placeholder="Giống heo" placeholderTextColor="#777777" value={mtGiong} onChangeText={setMtGiong} />
                  </View>

                  {(() => {
                    const laTrangThaiMoKhayMt = mtLua === "OPEN_MENU_MT_LUA";
                    const giaTriMacDinhDauTien = "Hãy chọn lứa";
                    const chuHienThiChuanMt = (mtLua && mtLua.toString().trim() !== "" && mtLua !== "OPEN_MENU_MT_LUA") ? mtLua.toString().trim() : giaTriMacDinhDauTien;

                    return (
                      <View style={{ width: '100%', backgroundColor: '#ffffff' }}>
                        <TouchableOpacity activeOpacity={0.8} onPress={() => setMtLua(laTrangThaiMoKhayMt ? chuHienThiChuanMt : "OPEN_MENU_MT_LUA")} style={{ height: 42, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, backgroundColor: '#ffffff', borderWidth: 1.2, borderColor: '#ffd3b6', borderRadius: 7 }}>
                          <Text style={{ color: (chuHienThiChuanMt.includes("Chọn") || chuHienThiChuanMt.includes("chọn")) ? '#888888' : '#111111', fontSize: 14, fontWeight: (chuHienThiChuanMt.includes("Chọn") || chuHienThiChuanMt.includes("chọn")) ? '400' : '700' }}>Lứa đẻ: {chuHienThiChuanMt}</Text>
                          <Text style={{ fontSize: 12, color: '#e65100' }}>{laTrangThaiMoKhayMt ? "▲" : "▼"}</Text>
                        </TouchableOpacity>

                        {laTrangThaiMoKhayMt && (
                          <View style={{ width: '100%', backgroundColor: '#ffffff', borderLeftWidth: 1.2, borderRightWidth: 1.2, borderBottomWidth: 1.2, borderColor: '#ffd3b6', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, height: 180, marginTop: -1, overflow: 'hidden' }}>
                            <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingVertical: 2 }}>
                              <TouchableOpacity activeOpacity={0.7} onPress={() => Alert.alert("Hãy Chọn Lứa", "Vui lòng chọn đúng lứa đẻ hiện tại của con nái!", [{ text: "Tôi sẽ Chọn", style: "default" }])} style={{ paddingVertical: 11, paddingHorizontal: 14, backgroundColor: chuHienThiChuanMt === "Hãy chọn lứa" ? '#fffaf5' : '#ffffff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#f8f9fa' }}><Text style={{ fontSize: 14, color: '#adb5bd', fontWeight: '500', fontStyle: 'italic' }}>Hãy chọn lứa</Text></TouchableOpacity>
                              {Array.isArray(danhSachLuaHeo) && danhSachLuaHeo.map((item, index) => {
                                const textDongSach = item.toString().trim();
                                if (textDongSach.includes("Chọn") || textDongSach.includes("chọn")) return null;
                                const laDongDangChon = chuHienThiChuanMt === textDongSach;
                                return (
                                  <TouchableOpacity key={`custom_mt_lua_inline_${index}`} activeOpacity={0.7} onPress={() => setMtLua(textDongSach)} style={{ paddingVertical: 11, paddingHorizontal: 14, backgroundColor: laDongDangChon ? '#fffaf5' : '#ffffff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: index < danhSachLuaHeo.length - 1 ? 0.5 : 0, borderBottomColor: '#f8f9fa' }}><Text style={{ fontSize: 14, color: laDongDangChon ? '#e65100' : '#111111', fontWeight: laDongDangChon ? '900' : '500' }}>{item}</Text>{laDongDangChon && <Text style={{ fontSize: 12, color: '#e65100' }}>✓</Text>}</TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    );
                  })()}
                  <TouchableOpacity onPress={handleSaveMaTai} activeOpacity={0.5} style={{ backgroundColor: '#e65100', paddingVertical: 9, borderRadius: 6, alignItems: 'center', marginTop: 10 }}><Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>THÊM MÃ TAI MỚI VÀO SỔ</Text></TouchableOpacity>
                </View>
                {Array.isArray(danhSachMaTai) && danhSachMaTai.some(i => i && i.vuaNhapMoi === "chua_reload") && (
                  <View style={{ paddingHorizontal: 15, marginTop: 5, marginBottom: 5 }}>
                    <Text style={{ fontSize: 12, color: '#e65100', fontWeight: 'bold', marginBottom: 4 }}>Heo nái vừa thêm vào hệ thống ( Bấm CẬP NHẬT Nếu Muốn Xóa / Sửa và Sắp xếp ở 4 ô phía dưới )</Text>
                    {danhSachMaTai.filter(i => i && i.vuaNhapMoi === "chua_reload").map((naiVuaThem, idx) => {
                      const maTaiChuan = naiVuaThem.maTai ? naiVuaThem.maTai.toString().toUpperCase().trim() : "";
                      const lichSuRiengCuaNaiNay = Array.isArray(danhSachLichSu) ? danhSachLichSu.filter(sk => sk && sk.maTai && sk.maTai.toString().toUpperCase().trim() === maTaiChuan && sk.actionType !== "delete") : [];
                      let trangThaiThucTe = lichSuRiengCuaNaiNay.length > 0 ? (lichSuRiengCuaNaiNay.suKien || "Chờ Phối") : (naiVuaThem.trangThaiDienThoai || naiVuaThem.trangThai || "Chờ Phối");
                      return (
                        <View key={`vuanhap_${naiVuaThem.id || idx}`} style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffdf6', borderColor: '#fbc48c', opacity: naiVuaThem.syncStatus === "waiting" ? 0.45 : 1 }, styles.historyCard, { marginHorizontal: 0, marginTop: 4, padding: 10 }]}>
                          <View style={{ flex: 1 }}>
                            {naiVuaThem.syncStatus === "waiting" && <Text style={{ fontSize: 10, color: '#e65100', fontStyle: 'italic', marginBottom: 4 }}>⏳ Đang xử lý...</Text>}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><Text style={{ fontSize: 13, color: '#666666' }}>Mã số: </Text><View style={{ backgroundColor: '#e7f1ff', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 0.5, borderColor: '#b8daff' }}><Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 13 }}>{naiVuaThem.maTai || "---"}</Text></View></View>
                            <Text style={[styles.cardBody, { color: '#333333', marginBottom: 4 }]} numberOfLines={1}>Giống: <Text style={{ fontWeight: '600' }}>{naiVuaThem.giong || "---"}</Text> | <Text style={{ fontWeight: 'bold', color: '#e83e8c' }}>{naiVuaThem.lua || "---"}</Text></Text>
                            <Text style={{ fontSize: 13, color: '#111111', fontWeight: '500' }}>Trạng thái thực tế: <Text style={{ fontWeight: 'bold', color: '#666666' }}>{trangThaiThucTe === "Phối" ? "Đang bầu" : (trangThaiThucTe === "Đẻ" ? "Nuôi con" : (trangThaiThucTe === "Thải" ? "Đã Thải" : (trangThaiThucTe === "Cai Sữa" ? "Cai Sữa (Chờ lên giống)" : (trangThaiThucTe === "Lốc" ? "Lốc (Phối hỏng)" : (trangThaiThucTe === "Sảy Thai" ? "Sảy Thai" : "Chờ phối")))))}</Text></Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', paddingHorizontal: 15, marginTop: 8, marginBottom: 10, gap: 5 }}>
              <TouchableOpacity onPress={() => setNhomNaiTab2('Cho Phoi')} style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'Cho Phoi' ? '#e65100' : '#f2f2f2', paddingVertical: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 52 }}><Text style={{ color: nhomNaiTab2 === 'Cho Phoi' ? '#ffffff' : '#666666', fontSize: 11, fontWeight: '600', textAlign: 'center' }}>Chờ Phối</Text><Text style={{ color: nhomNaiTab2 === 'Cho Phoi' ? '#ffffff' : '#e65100', fontSize: 14, fontWeight: '900', marginTop: 2, textAlign: 'center' }}>{(() => { const danhSachGoc = global.danhSachCapNhatTrangThai || []; return String(danhSachGoc.filter(dongLoc => dongLoc && !dongLoc.vuaNhapMoi && (dongLoc.trangThaiDienThoai === "Chờ Phối" || dongLoc.trangThaiDienThoai === "Cai Sữa" || dongLoc.trangThaiDienThoai === "Lốc" || dongLoc.trangThaiDienThoai === "Sảy Thai")).length); })()}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setNhomNaiTab2('Phoi')} style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'Phoi' ? '#e65100' : '#f2f2f2', paddingVertical: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 52 }}><Text style={{ color: nhomNaiTab2 === 'Phoi' ? '#ffffff' : '#666666', fontSize: 11, fontWeight: '600', textAlign: 'center' }}>Mang Thai</Text><Text style={{ color: nhomNaiTab2 === 'Phoi' ? '#ffffff' : '#007bff', fontSize: 14, fontWeight: '900', marginTop: 2, textAlign: 'center' }}>{(() => { const danhSachGoc = global.danhSachCapNhatTrangThai || []; return String(danhSachGoc.filter(dongLoc => dongLoc && !dongLoc.vuaNhapMoi && dongLoc.trangThaiDienThoai === "Phối").length); })()}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setNhomNaiTab2('De')} style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'De' ? '#e65100' : '#f2f2f2', paddingVertical: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 52 }}><Text style={{ color: nhomNaiTab2 === 'De' ? '#ffffff' : '#666666', fontSize: 11, fontWeight: '600', textAlign: 'center' }}>Nuôi Con</Text><Text style={{ color: nhomNaiTab2 === 'De' ? '#ffffff' : '#28a745', fontSize: 14, fontWeight: '900', marginTop: 2, textAlign: 'center' }}>{(() => { const danhSachGoc = global.danhSachCapNhatTrangThai || []; return String(danhSachGoc.filter(dongLoc => dongLoc && !dongLoc.vuaNhapMoi && dongLoc.trangThaiDienThoai === "Đẻ").length); })()}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setNhomNaiTab2('Thai')} style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'Thai' ? '#6c757d' : '#f2f2f2', paddingVertical: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 52 }}><Text style={{ color: nhomNaiTab2 === 'Thai' ? '#ffffff' : '#666666', fontSize: 11, fontWeight: '600', textAlign: 'center' }}>Đã Thải</Text><Text style={{ color: nhomNaiTab2 === 'Thai' ? '#ffffff' : '#dc3545', fontSize: 14, fontWeight: '900', marginTop: 2, textAlign: 'center' }}>{(() => { const danhSachGoc = global.danhSachCapNhatTrangThai || []; return String(danhSachGoc.filter(dongLoc => dongLoc && !dongLoc.vuaNhapMoi && dongLoc.trangThaiDienThoai === "Thải").length); })()}</Text></TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if (!item || !item.maTai) return null;
          return (
            <View style={[{ flexDirection: 'row', alignItems: 'center' }, styles.historyCard, item.syncStatus === "waiting" && { backgroundColor: '#fef1d6', borderColor: '#fbc48c', opacity: 0.4 }]}>
              <TouchableOpacity 
                activeOpacity={0.6}
                style={{ flex: 1, paddingRight: 5 }}
                onPress={() => {
                  setSelectedHeoDetail(item);
                  setIsDetailModalVisible(true);
                  setLoadingLichSuDe(true);
                  fetch(`${WEB_APP_URL}?action=get_lich_su_de&userEmail=${userEmail.toLowerCase().trim()}&maTai=${item.maTai}`, { method: 'GET', redirect: 'follow' })
                    .then(res => res.json())
                    .then(result => {
                      setLoadingLichSuDe(false);
                      if (result.status === 'success' && result.data) {
                        setMangLichSuDeCuaTai(result.data);
                      }
                    }).catch(() => setLoadingLichSuDe(false));
                }}
              >
                {/* Hàng 1: Mã số nái và Trạng thái mạng ngầm */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, color: '#666666', fontWeight: '500' }}>Mã số: </Text>
                  <View style={{ backgroundColor: '#e7f1ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#b8daff' }}>
                    <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 13 }}>{item.maTai || "---"}</Text>
                  </View>
                  
                  <View style={{ marginLeft: 'auto' }}>
                    {item.syncStatus === "waiting" ? (
                      <Text style={{ fontSize: 11, color: '#e65100', fontWeight: '600', fontStyle: 'italic' }}>Đang tạo...</Text>
                    ) : (
                      item.vuaNhapMoi ? <Text style={{ fontSize: 11, color: '#28a745', fontWeight: '600' }}>Đã vào sổ</Text> : null
                    )}
                  </View>
                </View>
                
                {/* Hàng 2: Giống và Lứa viết phẳng */}
                <Text style={[styles.cardBody, { color: '#333333', marginBottom: 4 }]} numberOfLines={1}>
                  Giống: <Text style={{ fontWeight: '600' }}>{item.giong || "---"}</Text> | Lứa: <Text style={{ fontWeight: 'bold', color: '#e83e8c' }}>{item.luaHienThiThongMinh || item.lua || "---"}</Text>
                </Text>
                
                {/* Hàng 3: Trạng thái sinh sản thực tế */}
                <Text style={{ fontSize: 13, color: '#111111', fontWeight: '500', marginBottom: 4 }}>
                  Trạng Thái: <Text style={{ 
                    fontWeight: 'bold', 
                    color: item.trangThaiDienThoai === "Phối" ? '#007bff' : 
                           item.trangThaiDienThoai === "Đẻ" ? '#28a745' : 
                           item.trangThaiDienThoai === "Thải" ? '#dc3545' : 
                           item.trangThaiDienThoai === "Lốc" ? '#dc3545' : 
                           item.trangThaiDienThoai === "Sảy Thai" ? '#d946ef' : 
                           '#666666' 
                  }}>
                    {(() => {
                      if (item.trangThaiDienThoai === "Phối") return "Đang bầu";
                      if (item.trangThaiDienThoai === "Đẻ") return "Nuôi con";
                      if (item.trangThaiDienThoai === "Thải") return "Đã Thải";
                      if (item.trangThaiDienThoai === "Cai Sữa") return "Cai Sữa (Chờ lên giống)";
                      if (item.trangThaiDienThoai === "Lốc") return "Lốc (Phối hỏng)";
                      if (item.trangThaiDienThoai === "Sảy Thai") return "Sảy Thai";
                      return "Chờ phối";
                    })()}
                  </Text>
                </Text>

                {/* 🎯 BẢN VÁ PHÁT TRIỂN: TỰ ĐỘNG TÍNH SỐ NGÀY CAI SỮA / LỐC / SẢY THAI NGOÀI CHUỒNG TỪ RAM */}
                {(item.trangThaiDienThoai === "Cai Sữa" || item.trangThaiDienThoai === "Lốc" || item.trangThaiDienThoai === "Sảy Thai") && (
                  <View style={{ marginTop: 2, borderTopWidth: 0.5, borderTopColor: '#e9ecef', paddingTop: 4 }}>
                    <Text style={{ fontSize: 12.5, color: '#555555' }}>
                      {item.trangThaiDienThoai === "Cai Sữa" ? "Số ngày cai sữa: " : (item.trangThaiDienThoai === "Lốc" ? "Số ngày lốc: " : "Số ngày sảy thai: ")}
                      <Text style={{ color: '#dc3545', fontWeight: '700' }}>
                        {(() => {
                          const maTaiInHoa = item.maTai ? item.maTai.toString().toUpperCase().trim() : "";
                          const mangHanhDongNai = Array.isArray(danhSachLichSu)
                            ? danhSachLichSu.filter(sk => sk && sk.maTai && sk.maTai.toString().toUpperCase().trim() === maTaiInHoa && sk.suKien === item.trangThaiDienThoai && sk.actionType !== "delete")
                            : [];

                          mangHanhDongNai.sort((a, b) => {
                            const tA = parseToDateObject(a.ngay)?.getTime() || 0;
                            const tB = parseToDateObject(b.ngay)?.getTime() || 0;
                            return tB - tA;
                          });

                          const ngaySuKienGoc = mangHanhDongNai.length > 0 ? mangHanhDongNai[0].ngay : (item.ngayCaiSuaCotKhat || item.ngayDeCotJ || "---");
                          const dSuKien = parseToDateObject(ngaySuKienGoc);
                          if (!dSuKien) return "---";

                          const dNay = new Date();
                          dNay.setHours(0, 0, 0, 0);
                          const khoangCachNgay = Math.floor((dNay.getTime() - dSuKien.getTime()) / 86400000);
                          
                          if (khoangCachNgay === 0) return "Hôm nay";
                          return khoangCachNgay > 0 ? `${khoangCachNgay} ngày` : "0 ngày";
                        })()}
                      </Text>
                    </Text>
                  </View>
                )}
                {/* Hàng 3.1: Số ngày đã đẻ (Nếu nái đang nuôi con) */}
                {item.trangThaiDienThoai === "Đẻ" && item.ngayDeDongThoiGianThuc && item.ngayDeDongThoiGianThuc.toString().trim() !== "" && item.ngayDeDongThoiGianThuc.toString().trim() !== "---" && (
                  <View style={{ marginTop: 2, borderTopWidth: 0.5, borderTopColor: '#e9ecef', paddingTop: 4 }}>
                    <Text style={{ fontSize: 12.5, color: '#555555' }}>
                      Số ngày đã đẻ: <Text style={{ color: '#28a745', fontWeight: '700' }}>
                        {(() => {
                          const dDe = parseToDateObject(item.ngayDeDongThoiGianThuc);
                          if (!dDe) return "---";
                          const dNay = new Date(); dNay.setHours(0, 0, 0, 0);
                          const khoangCachNgay = Math.floor((dNay.getTime() - dDe.getTime()) / 86400000);
                          return khoangCachNgay === 0 ? "Hôm nay" : (khoangCachNgay > 0 ? `${khoangCachNgay} ngày` : "0 ngày");
                        })()}
                      </Text>
                    </Text>
                  </View>
                )}

                {/* Hàng 4 & 5: Chu kỳ mang thai thời gian thực (Nếu nái đang phối mang thai) */}
                {item.trangThaiDienThoai === "Phối" && (
                  <View style={{ marginTop: 2, borderTopWidth: 0.5, borderTopColor: '#e9ecef', paddingTop: 4, gap: 2 }}>
                    {item.ngayPhoiDong && item.ngayPhoiDong.toString().trim() !== "---" && (
                      <Text style={{ fontSize: 12.5, color: '#555555' }}>Ngày phối giống: <Text style={{ color: '#111111', fontWeight: '700' }}>{formatStringtoVN(item.ngayPhoiDong)}</Text></Text>
                    )}
                    {item.ngayDuKienDeMoi && item.ngayDuKienDeMoi.toString().trim() !== "---" && (
                      <Text style={{ fontSize: 12.5, color: '#555555' }}>Dự kiến đẻ: <Text style={{ color: '#e65100', fontWeight: '700' }}>{formatStringtoVN(item.ngayDuKienDeMoi)}</Text></Text>
                    )}
                    {item.ngayPhoiDong && item.ngayPhoiDong.toString().trim() !== "---" && (
                      <Text style={{ fontSize: 12.5, color: '#555555' }}>
                        Số ngày bầu: <Text style={{ color: '#007bff', fontWeight: 'bold' }}>
                          {(() => {
                            const ngayPhoi = parseToDateObject(item.ngayPhoiDong);
                            if (!ngayPhoi) return "---";
                            const ngayHomNay = new Date(); ngayHomNay.setHours(0, 0, 0, 0);
                            const soNgayBau = Math.floor((ngayHomNay.getTime() - ngayPhoi.getTime()) / 86400000);
                            return soNgayBau <= 0 ? "Mới Phối" : `${soNgayBau} ngày`;
                          })()}
                        </Text>
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: 'column', gap: 6, minWidth: 60 }}>
                <TouchableOpacity onPress={() => handleMtEditClick(item)} style={{ backgroundColor: '#ffc107', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, alignItems: 'center' }}>
                  <Text style={{ color: '#000000', fontWeight: 'bold', fontSize: 12 }}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    Alert.alert("Xác nhận", `Xóa mã tai [${item.maTai}] khỏi sổ đàn?`, [
                      { text: "Hủy" },
                      { 
                        text: "Xóa", 
                        onPress: () => {
                          const dongMuonXoa = { ...item, syncStatus: "waiting", actionType: "mt_delete" };
                          setDongBoStatus(`⏳ Đang xóa tai: ${item.maTai}...`);
                          setDanhSachMaTai(prev => prev.map(i => i.id === item.id ? { ...i, syncStatus: "waiting" } : i));
                          guiYeuCauMang(dongMuonXoa, (res) => {
                            if (res && res.status === 'success') {
                              setDanhSachMaTai(prev => prev.filter(i => i.id !== item.id));
                              setDongBoStatus('✅ Đã xóa Mã Tai thành công!');
                            } else {
                              setDanhSachMaTai(prev => prev.map(i => i.id === item.id ? { ...i, syncStatus: "synced" } : i));
                              setDongBoStatus('❌ Lỗi mạng, không thể xóa Mã Tai.');
                            }
                          });
                        } 
                      }
                    ]);
                  }}
                  style={{ backgroundColor: '#dc3545', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, alignItems: 'center' }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ padding: 30, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, color: '#888888', fontStyle: 'italic', textAlign: 'center' }}>
              {nhomNaiTab2 === 'Phoi' ? "🤰 Không có Nái nào đang mang thai" : (nhomNaiTab2 === 'Cho Phoi' ? "💢 Không có Nái nào chờ phối" : (nhomNaiTab2 === 'De' ? "🍼 Không có Nái nào đang nuôi con" : "❌ Không có Nái nào đã thải"))}
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default SowRegistryTab;
