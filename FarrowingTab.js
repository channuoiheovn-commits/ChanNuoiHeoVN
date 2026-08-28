import React from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';

const FarrowingTab = ({
  currentTab,
  styles,
  formatVNDate,
  parseToDateObject,
  searchTxtTab4, setSearchTxtTab4,
  danhSachLichSu,
  danhSachMaTai,
  handleMoModalCaiSuaNhanh
}) => {
  if (currentTab !== 'heo_de') return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ paddingHorizontal: 15, marginTop: 10, marginBottom: 5 }}>
        <TextInput
          style={[styles.inputStandard, { marginBottom: 0, borderRadius: 20, paddingHorizontal: 15, height: 42, backgroundColor: '#f0f0f0', borderWidth: 0, color: '#111111', fontSize: 13.5 }]}
          placeholder="🔍 Tìm Heo Đang Đẻ..."
          placeholderTextColor="#888888"
          value={searchTxtTab4}
          onChangeText={setSearchTxtTab4}
          autoCapitalize="characters"
        />
      </View>
      
      <FlatList
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 15, gap: 8 }}
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

                if (trangThaiHienTaiCuaApp === "Cai Sữa" && trangThaiMang === "waiting") return true;
                if (trangThaiHienTaiCuaApp === "Cai Sữa" || trangThaiHienTaiCuaApp === "Thải") return false;

                const trangThaiGocTuSheet = heo.trangThaiCotH ? heo.trangThaiCotH.toString().trim().normalize("NFC") : "";
                if (trangThaiGocTuSheet === "Cai Sữa" || trangThaiGocTuSheet === "Thải") return false;

                return trangThaiHienTaiCuaApp === "Đẻ" || trangThaiGocTuSheet === "Đẻ";
              })
            : (Array.isArray(danhSachMaTai) ? danhSachMaTai.filter(h => h && h.trangThaiCotH === "Đẻ") : []);

          const mangDangDeChoList = mangNuoiConThucTe.map((nai, index) => {
            const maTaiInHoa = nai.maTai ? nai.maTai.toString().toUpperCase().trim() : "";
            const mangLichSuDe = Array.isArray(danhSachLichSu) ? danhSachLichSu.filter(i => i && i.maTai && i.maTai.toString().toUpperCase().trim() === maTaiInHoa && i.suKien === "Đẻ" && i.actionType !== "delete") : [];
  mangLichSuDe.sort((a, b) => (parseToDateObject(a.ngay)?.getTime() || 0) - (parseToDateObject(b.ngay)?.getTime() || 0));
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

         mangDangDeChoList.sort((a, b) => {
            const timeA = parseToDateObject(a.ngayDe) ? parseToDateObject(a.ngayDe).getTime() : 0;
            const timeB = parseToDateObject(b.ngayDe) ? parseToDateObject(b.ngayDe).getTime() : 0;
            if (timeA === 0) return 1;
            if (timeB === 0) return -1;
            return timeA - timeB; // Sắp xếp xuôi dòng thời gian: Cũ lên trước, Mới xuống sau
          });

          return mangDangDeChoList.filter(i => {
            if (!searchTxtTab4) return true;
            if (!i || !i.maTai) return false;
            return i.maTai.toLowerCase().includes(searchTxtTab4.toLowerCase());
          });
        })()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
        showsVerticalScrollIndicator={true}
        renderItem={({ item }) => {
          const soNgayDaDeNuoiCon = (() => {
            if (!item.ngayDe || item.ngayDe === "---") return 0;
            const dDe = parseToDateObject(item.ngayDe); if (!dDe) return 0;
            const dNay = new Date(); dNay.setHours(0, 0, 0, 0);
            return Math.max(0, Math.floor((dNay.getTime() - dDe.getTime()) / 86400000));
          })();

          const soTuanTuoiCon = Math.floor(soNgayDaDeNuoiCon / 7);
       return (
            <View style={{ 
              flex: 1,
              backgroundColor: '#ffffff', 
              marginTop: 10, 
              borderRadius: 12, 
              padding: 10,
              borderWidth: 1, 
              borderColor: '#e9ecef',
              maxWidth: '48.5%', 
              justifyContent: 'space-between',
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 2,
              elevation: 1.5
            }}>
              <View>
                {/* MÃ SỐ NÁI & LỨA ĐẺ */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ backgroundColor: '#e7f1ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#b8daff' }}>
                    <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 12 }} numberOfLines={1} allowFontScaling={false}>
                      Mã: {item.maTai || "---"}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#e83e8c' }} numberOfLines={1} allowFontScaling={false}>
                    {item.luaDe || "0"}
                  </Text>
                </View>

                {/* CHU KỲ NUÔI CON TỐI GIẢN */}
                <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, padding: 6, marginBottom: 8, borderWidth: 0.5, borderColor: '#dee2e6' }}>
                  <Text style={{ fontSize: 10.5, color: '#495057', fontWeight: 'bold' }} numberOfLines={1} allowFontScaling={false}>
                    Ngày đẻ: {item.ngayDe ? item.ngayDe.toString().substring(0, 10) : "---"}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#111111', fontWeight: '800', marginTop: 4 }} numberOfLines={1} allowFontScaling={false}>
                    Đã đẻ: {soNgayDaDeNuoiCon === 0 ? "Hôm nay" : `${soNgayDaDeNuoiCon} ngày`}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#6c757d', fontWeight: '600', marginTop: 3, fontStyle: 'italic' }} numberOfLines={1} allowFontScaling={false}>
                    {soNgayDaDeNuoiCon === 0 ? "Sơ sinh mới đẻ" : `${soTuanTuoiCon} tuần tuổi`}
                  </Text>
                </View>

                {/* SẢN LƯỢNG SƠ SINH GỘP PHẲNG */}
                <View style={{ gap: 3, paddingVertical: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#666666' }} allowFontScaling={false}>Tổng sơ sinh:</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#111111' }} allowFontScaling={false}>{item.soHeoCon || "0"} con</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#dc3545' }} allowFontScaling={false}>Hao hụt:</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#dc3545' }} allowFontScaling={false}>
                      {Number(item.khoThai || 0) + Number(item.coiCoc || 0) + Number(item.chetNgop || 0)} con
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3, backgroundColor: '#e8f5e9', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 11, color: '#1b5e20', fontWeight: 'bold' }} allowFontScaling={false}>Chọn nuôi:</Text>
                    <Text style={{ fontSize: 11.5, fontWeight: '900', color: '#28a745' }} allowFontScaling={false}>{item.chonNuoi || "0"} con</Text>
                  </View>
                </View>

                {/* DÒNG GHI CHÚ NÉN MỊN */}
                {item.ghiChuDe && item.ghiChuDe.toString().trim() !== "" && item.ghiChuDe.toString().trim() !== "---" ? (
                  <Text style={{ fontSize: 9.5, color: '#fd7e14', fontStyle: 'italic', marginTop: 5, lineHeight: 12 }} numberOfLines={1} allowFontScaling={false}>
                    Ghi chú: {item.ghiChuDe}
                  </Text>
                ) : null}
              </View>

              {/* NÚT BẤM CAI SỮA CHÂN ĐẾ */}
              {(() => {
                const maTaiChuan = item.maTai ? item.maTai.toString().toUpperCase().trim() : "";
                const lichSuNaiHienTai = Array.isArray(danhSachLichSu) ? danhSachLichSu.filter(i => i && i.maTai && i.maTai.toString().toUpperCase().trim() === maTaiChuan && (i.suKien === "Cai Sữa" || i.suKien === "Đẻ") && i.actionType !== "delete") : [];
                lichSuNaiHienTai.sort((a, b) => (parseToDateObject(b.ngay)?.getTime() || 0) - (parseToDateObject(a.ngay)?.getTime() || 0));
                const dongMoiNhatTrenRam = lichSuNaiHienTai.length > 0 ? lichSuNaiHienTai[0] : null;

                if (dongMoiNhatTrenRam && dongMoiNhatTrenRam.suKien === "Cai Sữa" && dongMoiNhatTrenRam.syncStatus === "waiting") {
                  return (
                    <View style={{ backgroundColor: '#d4edda', paddingVertical: 7, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderWidth: 0.5, borderColor: '#c3e6cb' }}>
                      <Text style={{ color: '#155724', fontWeight: 'bold', fontSize: 11.5 }} allowFontScaling={false}>Đang Lưu</Text>
                    </View>
                  );
                }

                return (
                  <TouchableOpacity 
                    activeOpacity={0.6}
                    onPress={() => handleMoModalCaiSuaNhanh(item)}
                    style={{ backgroundColor: '#e65100', paddingVertical: 7, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 11.5 }} allowFontScaling={false}>Cai Sữa Nhanh</Text>
                  </TouchableOpacity>
                );
              })()}

            </View>
          );
        }}
      />
    </View>
  );
};

export default FarrowingTab;
