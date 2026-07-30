import React from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

const DataEntryTab = ({
  currentTab,
  styles,
  formatVNDate,
  parseToDateObject,
  
  // Hệ thống State tìm kiếm và Form nhập liệu nhận từ App.js
  searchTxtTab1, setSearchTxtTab1,
  danhSachLichSu, setDanhSachLichSu,
  danhSachMaTai, danhSachSuKien,
  ngayHienThi, setNgayHienThi,
  isDatePickerVisible, setDatePickerVisibility,
  maTai, setMaTai,
  goiYMaTaiLoc, setGoiYMaTaiLoc,
  suKien, setSuKien,
  soHeo, setSoHeo,
  khoThai, setKhoThai,
  coiCoc, setCoiCoc,
  chetNgop, setChetNgop,
  chonNuoi, setChonNuoi,
  ghiChu, setGhiChu,
  
  // Trạng thái gác cổng sự kiện và kiểm soát ẩn hiện Form nhanh
  laSuKienBanHeo, canNhapSoHeo, isOpenSuKien, setIsOpenSuKien,
  userEmail,
  
  // Các hàm điều khiển Pop-up bổ trợ và hàm kết nối Cloud gốc
  setIsQuickAddModalVisible,
  handleSaveNew,
  handleEditClick,
  handleXemChiTietHeo,
  tinhNgayDuKienDe,
  setDongBoStatus,
  guiYeuCauMang
}) => {
  if (currentTab !== 'nhap_lieu') return null;

  const [sortMode, setSortMode] = React.useState('thu_tu_nhap'); // Mặc định ban đầu: 'thu_tu_nhap' hoặc 'ngay_thang'


  return (
    <View style={{ flex: 1, paddingBottom: 80, width: '100%' }}>
      <View style={{ paddingHorizontal: 15, marginTop: 12, marginBottom: 5 }}>
        <TextInput 
          style={[styles.inputStandard, { marginBottom: 0, borderRadius: 20, paddingHorizontal: 15, height: 42, backgroundColor: '#f2f2f2', borderWidth: 0, color: '#111111', fontSize: 14 }]} 
          placeholder="🔍 Nhập Mã Tai để xem lịch sử" 
          placeholderTextColor="#888888" 
          value={searchTxtTab1} 
          onChangeText={setSearchTxtTab1} 
          autoCapitalize="characters" 
        />
      </View>
     <FlatList 
        data={(() => {
          // Lọc sạch các dòng rác và dòng sự kiện heo thịt để thu về Nhật ký heo nái sạch
          let nhatKyFiltered = danhSachLichSu
            .filter(i => i && i.actionType !== "delete")
            .filter(i => i && i.suKien !== "Nhập Đàn" && i.suKien !== "Hao Hụt" && i.suKien !== "Bán");

          if (searchTxtTab1) {
            nhatKyFiltered = nhatKyFiltered.filter(i => i && i.maTai && i.maTai.toLowerCase().includes(searchTxtTab1.toLowerCase()));
          }

          // 🧠 THUẬT TOÁN ĐIỀU PHỐI ĐẢO TRỤC THỜI GIAN THEO BIẾN SORTMODE NGOÀI RAM DI ĐỘNG (BẢN CHUẨN ĐẾT VẠN NĂNG)
          nhatKyFiltered.sort((a, b) => {
            // 💡 Cửa gác vạn năng: Dòng nào mới nhập tinh đang nằm ở khay chờ mạng, ép nảy phốc lên đầu App lập tức 0 giây!
            if (a.syncStatus === 'waiting' && b.syncStatus !== 'waiting') return -1;
            if (b.syncStatus === 'waiting' && a.syncStatus !== 'waiting') return 1;

            if (sortMode === 'thu_tu_nhap') {
              // 🎯 CHẾ ĐỘ A: XẾP THỨ TỰ NHẬP (Quét ngược từ dưới đáy file Excel dán lên đỉnh đầu hàng App)
              // Dòng nào nằm cuối mảng danhSachLichSu (vừa mới gõ xong mang index lớn hơn) tự động vọt lên đầu 100%
              return danhSachLichSu.indexOf(b) - danhSachLichSu.indexOf(a);
            } else {
              // 🎯 CHẾ ĐỘ B: XẾP THEO NGÀY THÁNG SỔ TAY TRẠI
              const quyDoiThoiGian = (item) => {
                if (!item || !item.ngay) return 0;
                try {
                  let ngayGoc = item.ngay.toString().trim();
                  if (ngayGoc.includes('/')) {
                    // Cắt chính xác mảng chuỗi ngày dd/mm/yyyy chuẩn cơ số 10
                    let p = ngayGoc.substring(0, 10).split('/');
                    if (p.length === 3) {
                      const dObj = new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
                      return !isNaN(dObj.getTime()) ? dObj.getTime() : 0;
                    }
                  }
                  let timestamp = Date.parse(ngayGoc);
                  return isNaN(timestamp) ? 0 : timestamp;
                } catch (e) { return 0; }
              };

              const timeA = quyDoiThoiGian(a); 
              const timeB = quyDoiThoiGian(b);
              
              if (timeB !== timeA) return timeB - timeA; // Ngày gần nhất nhảy lên đầu hàng
              // Nếu trùng khít ngày tháng thực tế, dòng nào vừa nhập sau (ở đáy file) vẫn ưu tiên xếp lên trên đỉnh đầu
              return danhSachLichSu.indexOf(b) - danhSachLichSu.indexOf(a);
            }
          });

          return nhatKyFiltered;
        })()} 
        keyExtractor={(i) => i.id} 
        contentContainerStyle={{ paddingBottom: 80 }} 

        ListHeaderComponent={
          !searchTxtTab1 ? (
            <View style={{ backgroundColor: '#ffffff', paddingBottom: 5 }}>
              <View style={[styles.formFixedContainer, { backgroundColor: '#fffaf5', borderWidth: 1.2, borderColor: '#ffd3b6', borderRadius: 10, padding: 12, shadowColor: "#e65100", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 }]}>
                
                <View style={{ marginBottom: 14, width: '100%' }}>
                  <View style={{ alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ffe5d4', paddingBottom: 6, marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: '#e65100', fontWeight: 'bold', textAlign: 'center' }}>📝 HÔM NAY CÓ SỰ KIỆN GÌ MỚI? BẠN HÃY NHẬP Ở ĐÂY</Text>
                  </View>

                  {ngayHienThi && ngayHienThi.toString().trim() !== "" && (
                    <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ffffff', borderLeftWidth: 4, borderLeftColor: '#28a745', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, marginTop: 4, width: '100%' }}>
                      {(() => {
                        let chuoiTuanPhoiHienThi = "";
                        try {
                          const chuoiNgayForm = ngayHienThi ? ngayHienThi.toString().trim() : "";
                          let d = 0, m = 0, y = 0;
                          if (chuoiNgayForm.includes('/')) {
                            const mangCat = chuoiNgayForm.split('/');
                            if (mangCat.length === 3) { d = parseInt(mangCat[0], 10); m = parseInt(mangCat[1], 10); y = parseInt(mangCat[2], 10); }
                          } else if (chuoiNgayForm.includes('-')) {
                            const mangCat = chuoiNgayForm.substring(0, 10).split('-');
                            if (mangCat.length === 3) { y = parseInt(mangCat[0], 10); m = parseInt(mangCat[1], 10); d = parseInt(mangCat[2], 10); }
                          }
                          if (d > 0 && m > 0 && y > 0) {
                            const dateChonObj = new Date(y, m - 1, d);
                            const ngayThuNamCuaTuan = new Date(dateChonObj.valueOf());
                            const thuHienTai = dateChonObj.getDay();
                            const thuChuanHienTai = thuHienTai === 0 ? 7 : thuHienTai;
                            ngayThuNamCuaTuan.setDate(ngayThuNamCuaTuan.getDate() + 4 - thuChuanHienTai);
                            const ngayDauNamObj = new Date(ngayThuNamCuaTuan.getFullYear(), 0, 1);
                            const khoangCachMs = ngayThuNamCuaTuan.getTime() - ngayDauNamObj.getTime();
                            const soNgayTroiQua = Math.floor(khoangCachMs / 86400000);
                            const soTuanLich = Math.ceil((soNgayTroiQua + 1) / 7);
                            if (soTuanLich > 0 && soTuanLich <= 54) chuoiTuanPhoiHienThi = `${soTuanLich}`;
                          }
                        } catch (err) { chuoiTuanPhoiHienThi = ""; }

                        return (
                          <Text style={{ fontSize: 12, color: '#155724', fontWeight: '700', lineHeight: 17 }}>
                            Chọn ngày để tính nhanh ngày dự đẻ:{" "}
                            <Text style={{ color: '#d35400', fontWeight: '900' }}>
                              {tinhNgayDuKienDe(ngayHienThi)}
                              {chuoiTuanPhoiHienThi !== "" ? ` • (Tuần Phối: ${chuoiTuanPhoiHienThi})` : ""}
                            </Text>
                          </Text>
                        );
                      })()}
                    </View>
                  )}
                </View>
                <View style={[styles.rowInput, { marginBottom: 10 }]}>
                  <TouchableOpacity style={[styles.dateButton, { borderColor: '#ffd3b6', backgroundColor: '#ffffff', height: 42, justifyContent: 'center', paddingHorizontal: 10, zIndex: 10000 }]} onPress={() => setDatePickerVisibility(true)}>
                    <Text style={[styles.dateButtonText, { fontSize: 14 }]}>📅 {ngayHienThi}</Text>
                  </TouchableOpacity>

                  {!laSuKienBanHeo ? (
                    <View style={{ flex: 0.5, position: 'relative' }}>
                      <TextInput style={[styles.inputMaTai, { color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', height: 42, fontSize: 14, paddingVertical: 0, width: '100%' }]} placeholder="Mã Tai" placeholderTextColor="#777777" value={maTai} autoCapitalize="characters" onChangeText={(txt) => { setMaTai(txt); const txtChuan = txt.trim().toUpperCase(); if (txtChuan.length > 0 && Array.isArray(danhSachMaTai)) { const mangLoc = danhSachMaTai.filter(heo => heo && heo.maTai && heo.maTai.toString().toUpperCase().includes(txtChuan) && (!heo.trangThaiCotH || heo.trangThaiCotH.toString().trim().normalize("NFC") !== "Thải")).slice(0, 5); setGoiYMaTaiLoc(mangLoc); } else { setGoiYMaTaiLoc([]); } }} />
                      {goiYMaTaiLoc.length > 0 && <TouchableOpacity style={{ position: 'absolute', top: -1000, left: -1000, right: -1000, bottom: -1000, backgroundColor: 'transparent', zIndex: 99998 }} activeOpacity={1} onPress={() => setGoiYMaTaiLoc([])} />}
                      {goiYMaTaiLoc.length > 0 && (
                        <View style={{ position: 'absolute', top: 45, left: 0, right: 0, backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#ffd3b6', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 9999, zIndex: 999999, maxHeight: 220, overflow: 'hidden' }}>
                          <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
                            {goiYMaTaiLoc.map((heo, index) => (
                              <TouchableOpacity key={index} activeOpacity={0.4} style={{ paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: index === goiYMaTaiLoc.length - 1 ? 0.5 : 0, borderBottomColor: '#ffe5d4', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }} onPress={() => { setMaTai(heo.maTai.toString().toUpperCase()); setGoiYMaTaiLoc([]); }}>
                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100' }}>🏷️ {heo.maTai}</Text>
                                <Text style={{ fontSize: 11, color: '#666666', fontStyle: 'italic' }}>{heo.giong || "---"}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      {(() => {
                        const maTaiChuan = maTai.trim().toUpperCase();
                        if (maTaiChuan.length === 0 || laSuKienBanHeo || goiYMaTaiLoc.length > 0) return null;
                        const heoTimDuoc = Array.isArray(danhSachMaTai) && danhSachMaTai.find(heo => heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiChuan);
                        const trangThaiHeo = heoTimDuoc && heoTimDuoc.trangThaiCotH ? heoTimDuoc.trangThaiCotH.toString().trim().normalize("NFC") : "";
                        if (heoTimDuoc && trangThaiHeo === "Thải") {
                          return <View style={{ backgroundColor: '#fff3cd', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginTop: 6, borderWidth: 0.5, borderColor: '#ffeeba', alignItems: 'center' }}><Text style={{ color: '#856404', fontWeight: '600', fontSize: 11 }}>⚠️ Mã tai này trùng with heo đã thải!</Text></View>;
                        }
                        if (!heoTimDuoc) {
                          return <TouchableOpacity activeOpacity={0.7} style={{ backgroundColor: '#fff0e6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, marginTop: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffd3b6', flexDirection: 'row', gap: 4 }} onPress={() => setIsQuickAddModalVisible(true)}><Text style={{ fontSize: 13 }}>➕</Text><Text style={{ color: '#e65100', fontWeight: 'bold', fontSize: 12 }}>Mã tai mới! Bấm để thêm vào sổ gốc</Text></TouchableOpacity>;
                        }
                        return null;
                      })()}
                    </View>
                  ) : (
                    <View style={{ flex: 0.5 }} />
                  )}
                </View>

                <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" display="inline" locale="vi" onConfirm={(d) => { setNgayHienThi(formatVNDate(d)); setDatePickerVisibility(false); }} onCancel={() => setDatePickerVisibility(false)} confirmTextConfirm="Xác nhận" cancelText="Hủy" />
                
                <View style={{ marginBottom: 10, borderWidth: 1.2, borderColor: '#ffd3b6', borderRadius: 8, backgroundColor: '#ffffff', justifyContent: 'center', minHeight: 44 }}>
                  <View style={{ width: '100%' }}>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => { if (typeof isOpenSuKien === 'undefined') { setSuKien(suKien === "OPEN_MENU" ? "" : "OPEN_MENU"); } else { setIsOpenSuKien(!isOpenSuKien); } }} style={{ height: 42, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, backgroundColor: '#ffffff', borderWidth: 0 }}><Text style={{ color: (suKien && suKien !== "OPEN_MENU") ? '#111111' : '#888888', fontSize: 14, fontWeight: suKien ? '700' : '400' }}>{(suKien && suKien !== "OPEN_MENU") ? suKien : "--- Cham chon Su Kien ---"}</Text><Text style={{ fontSize: 12, color: '#111111' }}>{(isOpenSuKien || suKien === "OPEN_MENU") ? "▲" : "▼"}</Text></TouchableOpacity>
                    {(isOpenSuKien || suKien === "OPEN_MENU") && (
                      <View style={{ width: '100%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ffd3b6', borderRadius: 8, paddingVertical: 2, marginTop: 4 }}>
                        {Array.isArray(danhSachSuKien) && danhSachSuKien.map((itemText, index) => {
                          const laDongDangChon = suKien === itemText;
                          return <TouchableOpacity key={`custom_sk_pure_${index}`} activeOpacity={0.7} onPress={() => { setSuKien(itemText); if (typeof setSoHeo === 'function') setSoHeo(''); if (typeof setIsOpenSuKien === 'function') setIsOpenSuKien(false); }} style={{ paddingVertical: 11, paddingHorizontal: 14, backgroundColor: laDongDangChon ? '#fffaf5' : '#ffffff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: index < danhSachSuKien.length - 1 ? 0.5 : 0, borderBottomColor: '#f8f9fa' }}><Text style={{ fontSize: 14, color: laDongDangChon ? '#e65100' : '#111111', fontWeight: laDongDangChon ? '900' : '500' }}>{itemText}</Text>{laDongDangChon && <Text style={{ fontSize: 12, color: '#e65100' }}>✓</Text>}</TouchableOpacity>;
                        })}
                      </View>
                    )}
                  </View>
                </View>
                {suKien === "Đẻ" && (
                  <View style={{ backgroundColor: '#ffffff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ffd3b6', marginBottom: 10 }}>
                    <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#28a745', flex: 1 }}>Tổng số heo sơ sinh (con):</Text>
                      <TextInput style={[styles.inputStandard, { marginBottom: 0, paddingVertical: 6, height: 38, fontSize: 15, fontWeight: 'bold', color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', flex: 1, textAlign: 'center' }]} value={soHeo} onChangeText={setSoHeo} placeholder="Số con..." keyboardType="numeric" placeholderTextColor="#888888"/>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View style={{ flex: 0.48 }}>
                        <TextInput style={[styles.inputStandard, { marginBottom: 0, height: 38, paddingVertical: 0, paddingHorizontal: 8, fontSize: 13, textAlign: 'center', color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6' }]} placeholder="Khô thai" keyboardType="numeric" placeholderTextColor="#777777" value={khoThai} onChangeText={setKhoThai} />
                      </View>
                      <View style={{ flex: 0.48 }}>
                        <TextInput style={[styles.inputStandard, { marginBottom: 0, height: 38, paddingVertical: 0, paddingHorizontal: 8, fontSize: 13, textAlign: 'center', color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6' }]} placeholder="Còi cọc" keyboardType="numeric" placeholderTextColor="#777777" value={coiCoc} onChangeText={setCoiCoc} />
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ flex: 0.48 }}>
                        <TextInput style={[styles.inputStandard, { marginBottom: 0, height: 38, paddingVertical: 0, paddingHorizontal: 8, fontSize: 13, textAlign: 'center', color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6' }]} placeholder="Chết ngộp" keyboardType="numeric" placeholderTextColor="#777777" value={chetNgop} onChangeText={setChetNgop} />
                      </View>
                      <View style={{ flex: 0.48 }}>
                        <TextInput style={[styles.inputStandard, { marginBottom: 0, height: 38, paddingVertical: 0, paddingHorizontal: 8, fontSize: 13, textAlign: 'center', color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6' }]} placeholder="Chọn nuôi" keyboardType="numeric" placeholderTextColor="#777777" value={chonNuoi} onChangeText={setChonNuoi} />
                      </View>
                    </View>
                  </View>
                )}

                {canNhapSoHeo && suKien !== "Đẻ" && (
                  <TextInput style={[styles.inputStandard, { color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', marginBottom: 10, height: 42, fontSize: 14, paddingVertical: 0 }]} value={soHeo} onChangeText={setSoHeo} placeholder={`Nhập Số Heo ${suKien.toLowerCase()} (con)`} keyboardType="numeric" placeholderTextColor="#888888"/>
                )}
                
                <TextInput style={[styles.inputStandard, { color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', marginBottom: 10, height: 42, fontSize: 14, paddingVertical: 0 }]} placeholder="Nhập Ghi chú (nếu có)" placeholderTextColor="#888888" value={ghiChu} onChangeText={setGhiChu} />
                <TouchableOpacity onPress={handleSaveNew} activeOpacity={0.5} style={{ backgroundColor: '#e65100', paddingVertical: 9, borderRadius: 6, alignItems: 'center', marginTop: 4 }}><Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>Thêm Mới Nhật Ký</Text></TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, marginBottom: 4, width: '100%', paddingHorizontal: 4 }}>
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  onPress={() => setSortMode('thu_tu_nhap')}
                  style={{ 
                    flex: 1, 
                    paddingVertical: 9, 
                    borderRadius: 20, 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: sortMode === 'thu_tu_nhap' ? '#e65100' : '#ffffff', 
                    borderWidth: 1, 
                    borderColor: sortMode === 'thu_tu_nhap' ? '#e65100' : '#ffd3b6' 
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: sortMode === 'thu_tu_nhap' ? '#ffffff' : '#e65100' }} numberOfLines={1} adjustsFontSizeToFit>
                    Theo Thứ Tự Nhập
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.7} 
                  onPress={() => setSortMode('ngay_thang')}
                  style={{ 
                    flex: 1, 
                    paddingVertical: 9, 
                    borderRadius: 20, 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: sortMode === 'ngay_thang' ? '#28a745' : '#ffffff', 
                    borderWidth: 1, 
                    borderColor: sortMode === 'ngay_thang' ? '#28a745' : '#ced4da' 
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: sortMode === 'ngay_thang' ? '#ffffff' : '#28a745' }} numberOfLines={1} adjustsFontSizeToFit>
                    Theo Ngày Tháng
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          ) : null
        }
        
        renderItem={({ item }) => 
          (item && ((item.suKien || "").toString().trim().toUpperCase() === "VẮC-XIN" || (item.suKien || "").toString().trim().toUpperCase() === "VACXIN")) ? null : (
            <View style={[
              styles.historyCard, 
              item.syncStatus === "waiting" && { backgroundColor: '#fef1d6', borderColor: '#fbc48c', opacity: 0.4 }
            ]}>
              <View style={{ flex: 1, paddingRight: 5 }}>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 6, rowGap: 4 }}>
                  <Text style={styles.cardHeader}>
                    📅 {(() => {
                      if (!item.ngay) return "---";
                      const str = item.ngay.toString().trim();
                      if (str.includes('/') && str.split('/').length === 3) return str.substring(0, 10);
                      const d = new Date(str);
                      if (isNaN(d.getTime())) return str.substring(0, 10);
                      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                    })()} | 
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.cardBody, { marginTop: 0, marginRight: 4, fontSize: 13 }]}>Mã Tai: </Text>
                    {item.maTai === "BÁN HEO" ? (
                      <View style={{ backgroundColor: '#f1f2f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#ced4da' }}>
                        <Text style={{ color: '#4f5d73', fontWeight: 'bold', fontSize: 12 }}>BÁN HEO</Text>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        activeOpacity={0.5}
                        style={{ backgroundColor: '#e7f1ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#b8daff', flexDirection: 'row', alignItems: 'center' }}
                        onPress={() => {
                          let thongTinDayDuCuaNai = { maTai: item.maTai }; 
                          if (Array.isArray(danhSachMaTai)) {
                            const naiTimDuoc = danhSachMaTai.find(heo => heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === item.maTai.toString().toUpperCase().trim());
                            if (naiTimDuoc) thongTinDayDuCuaNai = naiTimDuoc;
                          }
                          handleXemChiTietHeo(thongTinDayDuCuaNai);
                        }}
                      >
                        <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 12 }}>{item.maTai} 🔎</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <Text style={styles.cardBody}>
                  📝 {item.suKien} {item.soHeo !== "" ? `(${item.soHeo} con)` : ""}
                </Text>

                {item && item.suKien && item.suKien.toString().trim().toUpperCase().includes("PHỐI") && item.ngay && (
                  <View style={{ marginTop: 4, marginBottom: 2, backgroundColor: '#f4fbf7', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: '#28a745', alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 11, color: '#155724', fontWeight: 'bold', fontStyle: 'italic' }}>
                      ⏳ Dự kiến đẻ: {tinhNgayDuKienDe(item.ngay)}
                    </Text>
                  </View>
                )}

                {item.suKien === "Đẻ" && !!(item.khoThai || item.coiCoc || item.chetNgop || item.chonNuoi) && (
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#666666', lineHeight: 18 }}>
                      Khô: {String(item.khoThai || 0)} | Còi: {String(item.coiCoc || 0)} | Ngộp: {String(item.chetNgop || 0)}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#111111', fontWeight: 'bold', marginTop: 2, lineHeight: 18 }}>
                      Chọn Nuôi: <Text style={{ color: '#28a745', fontWeight: 'bold' }}>{String(item.chonNuoi || 0)} con</Text>
                    </Text>
                  </View>
                )}

                {!!item.ghiChu && <Text style={{ fontSize: 12, color: '#e65100', fontStyle: 'italic', marginTop: 2 }}>📌 Ghi chú: {String(item.ghiChu)}</Text>}
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleEditClick(item)} style={styles.editBtn}>
                  <Text style={styles.btnText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    Alert.alert("Xác nhận", "Xóa dòng nhật ký khỏi sổ?", [
                      { text: "Hủy" },
                      { 
                        text: "Xóa", 
                        onPress: () => {
                          const dongMuonXoa = { 
                            id: item.id,
                            userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
                            actionType: "delete",
                            ngay: "", 
                            maTai: item.maTai || "", 
                            suKien: item.suKien || "", 
                            soHeo: 0,
                            giong: "", lua: "", khoThai: "", coiCoc: "", chetNgop: "", chonNuoi: "", ghiChu: "", tuanBan: ""
                          };
                          
                          setDongBoStatus("⏳ Đang thực hiện xóa nhật ký...");
                          setDanhSachLichSu(prev => prev.map(i => i.id === item.id ? { ...i, syncStatus: "waiting" } : i));
                          
                          guiYeuCauMang(dongMuonXoa, (res) => {
                            if (res && (res.status === 'success' || res.status === 'offline_queue')) {
                              setDanhSachLichSu(prev => prev.filter(i => i.id !== item.id));
                              setDongBoStatus("✅ Đã xóa dòng nhật ký thành công!");
                            } else {
                              setDanhSachLichSu(prev => prev.map(i => i.id === item.id ? { ...i, syncStatus: "synced" } : i));
                              setDongBoStatus("❌ Lỗi mạng thực sự, không thể xóa dòng nhật ký.");
                            }
                          });
                        } 
                      }
                    ]);
                  }}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.btnText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }
      />
    </View>
  );
};

export default DataEntryTab;
