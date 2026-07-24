import React from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';

const FarrowingTab = ({
  currentTab,
  styles,
  formatVNDate,
  parseToDateObject,
  
  // Các state tìm kiếm và dữ liệu nhận từ App.js
  searchTxtTab4, setSearchTxtTab4,
  danhSachLichSu,
  danhSachMaTai,
  
  // Hàm mở hộp thoại Cai sữa nhanh gốc của trại
  handleMoModalCaiSuaNhanh
}) => {
  if (currentTab !== 'heo_de') return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ paddingHorizontal: 15, marginTop: 10, marginBottom: 5 }}>
        <TextInput
          style={[styles.inputStandard, { marginBottom: 0, borderRadius: 20, paddingHorizontal: 15, height: 44, backgroundColor: '#f0f0f0', borderWidth: 0, color: '#111111' }]}
          placeholder="🔍 Tìm Heo Đang Đẻ"
          placeholderTextColor="#888888"
          value={searchTxtTab4}
          onChangeText={setSearchTxtTab4}
          autoCapitalize="characters"
        />
      </View>
      <FlatList
        data={(() => {
          const danhSachGoc = Array.isArray(global.danhSachCapNhatTrangThai) ? global.danhSachCapNhatTrangThai : [];

          const mangNuoiConThucTe = danhSachGoc.length > 0 
            ? danhSachGoc.filter(heo => {
                const maTaiInHoa = heo.maTai ? heo.maTai.toString().toUpperCase().trim() : "";
                const trangThaiHienTaiCuaApp = heo.trangThaiDienThoai || "";

                const skCaiSuaMoiNhat = Array.isArray(danhSachLichSu)
                  ? danhSachLichSu.find(i => i && i.maTai && i.maTai.toString().toUpperCase().trim() === maTaiInHoa && i.suKien === "Cai Sữa" && i.actionType !== "delete")
                  : null;
                const trangThaiMang = skCaiSuaMoiNhat ? skCaiSuaMoiNhat.syncStatus : "";

                if (trangThaiHienTaiCuaApp === "Cai Sữa" && trangThaiMang === "waiting") {
                  return true;
                }
                if (trangThaiHienTaiCuaApp === "Cai Sữa" || trangThaiHienTaiCuaApp === "Thải") {
                  return false;
                }

                const trangThaiGocTuSheet = heo.trangThaiCotH ? heo.trangThaiCotH.toString().trim().normalize("NFC") : "";
                if (trangThaiGocTuSheet === "Cai Sữa" || trangThaiGocTuSheet === "Thải") {
                  return false;
                }

                return trangThaiHienTaiCuaApp === "Đẻ" || trangThaiGocTuSheet === "Đẻ";
              })
            : (Array.isArray(danhSachMaTai) ? danhSachMaTai.filter(h => h && h.trangThaiCotH === "Đẻ") : []);

          const mangDangDeChoList = mangNuoiConThucTe.map((nai, index) => {
            const maTaiInHoa = nai.maTai ? nai.maTai.toString().toUpperCase().trim() : "";
            
            const mangLichSuDe = Array.isArray(danhSachLichSu)
              ? danhSachLichSu.filter(i => i && i.maTai && i.maTai.toString().toUpperCase().trim() === maTaiInHoa && i.suKien === "Đẻ" && i.actionType !== "delete")
              : [];

            mangLichSuDe.sort((a, b) => {
              const timeA = parseToDateObject(a.ngay) ? parseToDateObject(a.ngay).getTime() : 0;
              const timeB = parseToDateObject(b.ngay) ? parseToDateObject(b.ngay).getTime() : 0;
              return timeB - timeA;
            });

            const skDeGanNhat = mangLichSuDe.length > 0 ? mangLichSuDe[0] : null;

            return {
              id: "RAM_DE_" + (nai.id || index),
              maTai: nai.maTai,
              giong: nai.giong || "---",
              luaDe: nai.lua || "---",
              trangThaiHienTai: nai.trangThaiDienThoai,
              ngayDe: nai.ngayDeDongThoiGianThuc || (skDeGanNhat ? skDeGanNhat.ngay : "---"),
              soHeoCon: skDeGanNhat ? String(skDeGanNhat.soHeo) : (nai.soHeoCon || "0"),
              khoThai: skDeGanNhat ? String(skDeGanNhat.khoThai) : (nai.khoThai || "0"),
              coiCoc: skDeGanNhat ? String(skDeGanNhat.coiCoc) : (nai.coiCoc || "0"),
              chetNgop: skDeGanNhat ? String(skDeGanNhat.chetNgop) : (nai.chetNgop || "0"),
              chonNuoi: skDeGanNhat ? String(skDeGanNhat.chonNuoi) : (nai.chonNuoi || "0"),
              ghiChuDe: skDeGanNhat ? skDeGanNhat.ghiChu : (nai.ghiChuDe || "")
            };
          });

          return mangDangDeChoList.filter(i => {
            if (!searchTxtTab4) return true;
            if (!i || !i.maTai) return false;
            return i.maTai.toLowerCase().includes(searchTxtTab4.toLowerCase());
          });
        })()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          return (
            <View style={{ 
              backgroundColor: '#ffffff', 
              marginHorizontal: 15, 
              marginTop: 10, 
              borderRadius: 10, 
              padding: 14,
              borderWidth: 1, 
              borderColor: '#eef2f5',
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 3
            }}>
              <View style={{ flex: 1 }}>
                
                {/* Hàng 1: Mã số nái đóng khung phẳng */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, color: '#6c757d', fontWeight: '500' }}>Mã số nái</Text>
                  <View style={{ backgroundColor: '#e7f1ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#b8daff' }}>
                    <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 13 }}>{item.maTai || "---"}</Text>
                  </View>
                </View>

                {/* Hàng 2: Giống và Lứa Đẻ */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#f1f2f6' }}>
                  <Text style={{ fontSize: 13, color: '#555555' }}>Giống / Lứa đẻ</Text>
                  <Text style={{ fontSize: 13, color: '#111111', fontWeight: '500' }}>
                    {item.giong || "---"} | lứa <Text style={{ fontWeight: 'bold', color: '#e83e8c' }}>{item.luaDe || "---"}</Text>
                  </Text>
                </View>

                {/* Hàng 3: Ngày thực tế đẻ */}
                {item.ngayDe && item.ngayDe !== "---" ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#f1f2f6' }}>
                    <Text style={{ fontSize: 13, color: '#555555' }}>Ngày thực tế đẻ</Text>
                    <Text style={{ fontSize: 13, color: '#111111', fontWeight: '600' }}>
                      {(() => {
                        const str = item.ngayDe.toString().trim();
                        if (str.includes('/') && str.split('/').length === 3) return str.substring(0, 10);
                        const d = new Date(str);
                        if (isNaN(d.getTime())) return str.substring(0, 10);
                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                      })()}
                    </Text>
                  </View>
                ) : null}

                {/* Hàng 4: Số ngày đã đẻ & Số tuần tuổi heo con */}
                {item.ngayDe && item.ngayDe !== "---" ? (
                  <View style={{ backgroundColor: '#f8f9fa', borderRadius: 6, padding: 8, marginTop: 5, marginBottom: 5, borderWidth: 0.5, borderColor: '#dee2e6' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={{ fontSize: 12.5, color: '#495057', fontWeight: '500' }}>Số ngày đã đẻ:</Text>
                      <Text style={{ fontSize: 13, color: '#111111', fontWeight: 'bold' }}>
                        {(() => {
                          const dDe = parseToDateObject(item.ngayDe);
                          if (!dDe) return "---";
                          const dNay = new Date(); 
                          dNay.setHours(0, 0, 0, 0);
                          const khoangCachNgay = Math.floor((dNay.getTime() - dDe.getTime()) / 86400000);
                          if (khoangCachNgay === 0) return "Hôm nay";
                          return khoangCachNgay > 0 ? `${khoangCachNgay} ngày` : "---";
                        })()}
                      </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12.5, color: '#495057', fontWeight: '500' }}>Tuổi heo con ngoài ô:</Text>
                      <Text style={{ fontSize: 13, color: '#111111', fontWeight: 'bold' }}>
                        {(() => {
                          const dDe = parseToDateObject(item.ngayDe);
                          if (!dDe) return "---";
                          const dNay = new Date(); 
                          dNay.setHours(0, 0, 0, 0);
                          const khoangCachNgay = Math.floor((dNay.getTime() - dDe.getTime()) / 86400000);
                          const soTuan = Math.floor(khoangCachNgay / 7);
                          if (khoangCachNgay === 0) return "Sơ sinh mới đẻ";
                          return soTuan > 0 ? `${soTuan} tuần tuổi` : "Dưới 1 tuần tuổi";
                        })()}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* Hàng 5: Tổng số con đẻ ra */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#f1f2f6' }}>
                  <Text style={{ fontSize: 13, color: '#555555' }}>Tổng số con đẻ ra</Text>
                  <Text style={{ fontSize: 13, color: '#111111', fontWeight: 'bold' }}>{item.soHeoCon || "0"} con</Text>
                </View>

                {/* Hàng 6: Khối hiển thị chi tiết số con */}
                <View style={{ backgroundColor: '#f8f9fa', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, marginTop: 4, borderWidth: 0.5, borderColor: '#dee2e6' }}>
                  <Text style={{ fontSize: 12, color: '#666666', lineHeight: 18 }}>
                    Khô thai: <Text style={{fontWeight:'600', color:'#111111'}}>{item.khoThai || 0}</Text> | Còi cọc: <Text style={{fontWeight:'600', color:'#111111'}}>{item.coiCoc || 0}</Text> | Chết ngộp: <Text style={{fontWeight:'600', color:'#111111'}}>{item.chetNgop || 0}</Text>
                  </Text>
                  <Text style={{ fontSize: 12, color: '#111111', fontWeight: 'bold', marginTop: 4, borderTopWidth: 0.5, borderTopColor: '#e9ecef', paddingTop: 4 }}>
                    Chọn Nuôi Thực Tế: <Text style={{color:'#28a745'}}>{item.chonNuoi || 0} con</Text>
                  </Text>
                </View>

                {/* Hàng 7: Khối hiển thị Ghi chú đẻ */}
                {item.ghiChuDe && item.ghiChuDe.toString().trim() !== "" && item.ghiChuDe.toString().trim() !== "---" ? (
                  <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#f1f2f6' }}>
                    <Text style={{ fontSize: 12, color: '#6c757d', fontStyle: 'italic', lineHeight: 16 }}>
                      Ghi chú: <Text style={{ color: '#e65100', fontWeight: '500', fontStyle: 'normal' }}>{item.ghiChuDe}</Text>
                    </Text>
                  </View>
                ) : null}

                {/* Khối bọc nút bấm điều hướng gác cổng mạng ngầm */}
                {(() => {
                  const maTaiChuan = item.maTai ? item.maTai.toString().toUpperCase().trim() : "";
                  const lichSuNaiHienTai = Array.isArray(danhSachLichSu)
                    ? danhSachLichSu.filter(i => i && i.maTai && i.maTai.toString().toUpperCase().trim() === maTaiChuan && (i.suKien === "Cai Sữa" || i.suKien === "Đẻ") && i.actionType !== "delete")
                    : [];

                  lichSuNaiHienTai.sort((a, b) => {
                    const timeA = parseToDateObject(a.ngay) ? parseToDateObject(a.ngay).getTime() : 0;
                    const timeB = parseToDateObject(b.ngay) ? parseToDateObject(b.ngay).getTime() : 0;
                    if (timeB !== timeA) return timeB - timeA;
                    return (b.id ? b.id.toString() : "").localeCompare(a.id ? a.id.toString() : "");
                  });

                  const dongMoiNhatTrenRam = lichSuNaiHienTai.length > 0 ? lichSuNaiHienTai[0] : null;
                  const hanhDongMoiNhat = dongMoiNhatTrenRam ? dongMoiNhatTrenRam.suKien.toString().trim().normalize("NFC") : "";
                  const trangThaiMangMoiNhat = dongMoiNhatTrenRam ? dongMoiNhatTrenRam.syncStatus : "";

                  if (hanhDongMoiNhat === "Cai Sữa" && trangThaiMangMoiNhat === "waiting") {
                    return (
                      <View style={{ backgroundColor: '#d4edda', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 12, borderWidth: 1, borderColor: '#c3e6cb' }}>
                        <Text style={{ color: '#155724', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 }}>✅ Đang Lưu</Text>
                      </View>
                    );
                  }

                  return (
                    <TouchableOpacity 
                      activeOpacity={0.6}
                      onPress={() => handleMoModalCaiSuaNhanh(item)}
                      style={{ backgroundColor: '#e65100', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 12, shadowColor: '#e65100', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                    >
                      <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 }}>Cai Sữa Nhanh</Text>
                    </TouchableOpacity>
                  );
                })()}

              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

export default FarrowingTab;
