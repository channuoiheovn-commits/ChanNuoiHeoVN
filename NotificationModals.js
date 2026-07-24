import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  Alert
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

const NotificationModals = ({
  styles,
  formatVNDate,
  
  // 1. Props cho Modal Cảnh báo quy trình
  isQuyTrinhAlertVisible, setIsQuyTrinhAlertVisible, txtAlertNoiDung,
  
  // 2. Props cho Sổ khai báo nhanh nái mới
  isQuickAddModalVisible, setIsQuickAddModalVisible, isQuickSaving,
  maTai, quickGiong, setQuickGiong, quickLua, setQuickLua,
  danhSachLuaHeo, nhanThongBaoNhoQuickAdd, setNhanThongBaoNhoQuickAdd,
  handleQuickSaveHeoMoi,
  
  // 3. Props cho Modal Cai sữa nhanh tại chuồng
  isCaiSuaModalVisible, setIsCaiSuaModalVisible, caiSuaHeoItem,
  caiSuaNgay, setCaiSuaNgay, caiSuaSoCon, setCaiSuaHeoSoCon,
  isCaiSuaDatePickerVisible, setCaiSuaDatePickerVisible,
  isCaiSuaDatePickerVisibility, setCaiSuaDatePickerVisibility,
  handleLuuCaiSuaNhanhTaiChuong,
  
  // 4. Props cho Modal Mã tai chưa khai báo
  isAlertModalVisible, setIsAlertModalVisible,
  
  // 5. Props cho Modal Thông báo thành công
  isThanhCongModalVisible, setIsThanhCongModalVisible, txtThanhCongNoiDung
}) => {

  // Logic tính toán menu lứa đẻ của Sổ khai báo nhanh
  const laTrangThaiMoKhay = quickLua === "OPEN_MENU_LUA";
  const giaTriMacDinhDauTien = "Hãy chọn lứa";
  const chuHienThiChuan = (quickLua && quickLua.toString().trim() !== "" && quickLua !== "OPEN_MENU_LUA") 
    ? quickLua.toString().trim() 
    : giaTriMacDinhDauTien;

  return (
    <>
      {/* ⚠️ MODAL 1: CẢNH BÁO QUY TRÌNH SINH HỌC */}
      <Modal visible={isQuyTrinhAlertVisible} animationType="fade" transparent={true} onRequestClose={() => setIsQuyTrinhAlertVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.popupCard, { width: '85%', padding: 22, alignItems: 'center' }]}>
            <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#fde8e8', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 22 }}>⚠️</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#dc3545', textAlign: 'center', marginBottom: 12 }}>
              {txtAlertNoiDung?.tieuDe || "Cảnh Báo"}
            </Text>
            <Text style={{ fontSize: 13, color: '#495057', textAlign: 'center', lineHeight: 20, marginBottom: 22, paddingHorizontal: 4 }}>
              Heo nái mã số <Text style={{ fontWeight: 'bold', color: '#0056b3', backgroundColor: '#e6f2ff', paddingHorizontal: 4, borderRadius: 4 }}> {txtAlertNoiDung?.maTai || "---"} </Text> khi chọn sự kiện <Text style={{ fontWeight: 'bold', color: '#e65100', backgroundColor: '#fff0e6', paddingHorizontal: 4, borderRadius: 4 }}> {txtAlertNoiDung?.hanhDong || "---"} </Text> {txtAlertNoiDung?.loiGiai}
            </Text>
            <TouchableOpacity 
              activeOpacity={0.7}
              style={{ backgroundColor: '#6c757d', width: '100%', paddingVertical: 11, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setIsQuyTrinhAlertVisible(false)}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>ĐÃ HIỂU VÀ KIỂM TRA LẠI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ➕ MODAL 2: SỔ KHAI BÁO HEO MỚI NHẬP ĐÀN */}
      <Modal visible={isQuickAddModalVisible} animationType="fade" transparent={true} onRequestClose={() => { if (!isQuickSaving) setIsQuickAddModalVisible(false); }}>
        <View style={[styles.modalOverlay, { flex: 1, justifyContent: 'flex-start', alignItems: 'center' }]}>
          <View style={[styles.popupCard, { borderWidth: 1.5, borderColor: '#ffd3b6', backgroundColor: '#ffffff', padding: 18, borderRadius: 16, width: '85%', marginTop: 40 }]}>
            <View style={{ backgroundColor: '#fffaf5', borderWidth: 1, borderColor: '#ffd3b6', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#e65100', letterSpacing: 0.5 }}>➕ SỔ KHAI BÁO HEO MỚI NHẬP ĐÀN</Text>
            </View>
            <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 13, color: '#333333' }}>Mã Số Tai:</Text>
            <TextInput style={[styles.popupInput, { backgroundColor: '#eeeeee', color: '#555555', fontWeight: 'bold', marginBottom: 12, borderRadius: 8, height: 42, paddingHorizontal: 12 }]} value={maTai ? maTai.toUpperCase().trim() : "---"} editable={false} />
            <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 13, color: '#333333' }}>Giống Heo Nái:</Text>
            <TextInput style={[styles.popupInput, { borderColor: '#ffd3b6', marginBottom: 12, borderRadius: 8, height: 42, paddingHorizontal: 12, color: '#111111', fontWeight: '600' }]} placeholder="Nái Nhà, 909, CP ..." placeholderTextColor="#888888" value={quickGiong} onChangeText={setQuickGiong} editable={!isQuickSaving} />
            <Text style={{ fontWeight: 'bold', marginBottom: 6, fontSize: 13, color: '#333333' }}>Chọn Lứa Đẻ Hiện tại:</Text>
            <View style={{ width: '100%', backgroundColor: '#ffffff', marginBottom: 12 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isQuickSaving}
                onPress={() => setQuickLua(laTrangThaiMoKhay ? chuHienThiChuan : "OPEN_MENU_LUA")}
                style={{ height: 42, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, backgroundColor: '#ffffff', borderWidth: 1.2, borderColor: '#ffd3b6', borderRadius: 7 }}
              >
                <Text style={{ color: (chuHienThiChuan.includes("Chọn") || chuHienThiChuan.includes("chọn")) ? '#888888' : '#111111', fontSize: 13, fontWeight: (chuHienThiChuan.includes("Chọn") || chuHienThiChuan.includes("chọn")) ? '400' : '700' }}>{chuHienThiChuan}</Text>
                <Text style={{ fontSize: 12, color: '#e65100' }}>{laTrangThaiMoKhay ? "▲" : "▼"}</Text>
              </TouchableOpacity>
              {laTrangThaiMoKhay && (
                <View style={{ width: '100%', backgroundColor: '#ffffff', borderLeftWidth: 1.2, borderRightWidth: 1.2, borderBottomWidth: 1.2, borderColor: '#ffd3b6', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, height: 180, marginTop: -1, overflow: 'hidden' }}>
                  <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingVertical: 2 }}>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => Alert.alert("Hãy Chọn Lứa", "", [{ text: "Tôi sẽ chọn lại", style: "default" }])} style={{ paddingVertical: 11, paddingHorizontal: 14, backgroundColor: chuHienThiChuan === "Hãy chọn lứa" ? '#fffaf5' : '#ffffff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#f8f9fa' }}>
                      <Text style={{ fontSize: 13, color: '#adb5bd', fontWeight: '500', fontStyle: 'italic' }}>Hãy chọn lứa</Text>
                    </TouchableOpacity>
                    {Array.isArray(danhSachLuaHeo) && danhSachLuaHeo.map((itemText, index) => {
                      const textDongSach = itemText.toString().trim();
                      if (textDongSach.includes("Chọn") || textDongSach.includes("chọn")) return null;
                      const laDongDangChon = chuHienThiChuan === textDongSach;
                      return (
                        <TouchableOpacity key={`custom_lua_inline_fixed_${index}`} activeOpacity={0.7} onPress={() => setQuickLua(textDongSach)} style={{ paddingVertical: 11, paddingHorizontal: 14, backgroundColor: laDongDangChon ? '#fffaf5' : '#ffffff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: index < danhSachLuaHeo.length - 1 ? 0.5 : 0, borderBottomColor: '#f8f9fa' }}>
                          <Text style={{ fontSize: 13, color: laDongDangChon ? '#e65100' : '#111111', fontWeight: laDongDangChon ? '900' : '500' }}>{itemText}</Text>
                          {laDongDangChon && <Text style={{ fontSize: 12, color: '#e65100' }}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity activeOpacity={0.6} onPress={() => { if (!isQuickSaving) { setIsQuickAddModalVisible(false); setQuickGiong(''); setQuickLua('Hậu Bị'); if(typeof setNhanThongBaoNhoQuickAdd === 'function') setNhanThongBaoNhoQuickAdd(''); } }} disabled={isQuickSaving} style={{ flex: 1, backgroundColor: '#6c757d', paddingVertical: 11, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5 }}>HỦY BỎ</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.6} onPress={handleQuickSaveHeoMoi} disabled={isQuickSaving} style={{ flex: 1, backgroundColor: isQuickSaving ? '#cccccc' : '#e65100', paddingVertical: 11, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5 }}>{isQuickSaving ? '⏳ ĐANG LƯU...' : 'LƯU LẠI'}</Text>
              </TouchableOpacity>
            </View>
            {!!nhanThongBaoNhoQuickAdd && <Text style={{ color: '#28a745', fontSize: 12.5, fontWeight: 'bold', textAlign: 'center', marginTop: 12, fontStyle: 'italic' }}>{nhanThongBaoNhoQuickAdd}</Text>}
          </View>
        </View>
      </Modal>
      {/* 🍼 MODAL 3: HỘP THOẠI LÀM THỦ TỤC CAI SỮA NHANH NGAY TẠI CHUỒNG (TAB 4) */}
      <Modal visible={isCaiSuaModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsCaiSuaModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.popupCard, { width: '85%', padding: 18, borderRadius: 16 }]}>
            
            <View style={{ backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fbc4c4', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#c82333', letterSpacing: 0.3 }}>Cai Sữa Nhanh</Text>
            </View>

            <Text style={{ fontSize: 13, color: '#444444', marginBottom: 12, textAlign: 'center' }}>
              Lý lịch nái: Mã tai <Text style={{ fontWeight: 'bold', color: '#e65100' }}>{caiSuaHeoItem?.maTai}</Text> | Giống: <Text style={{ fontWeight: '500' }}>{caiSuaHeoItem?.giong}</Text>
            </Text>

            <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 13, color: '#333333' }}>Chọn ngày cai sữa:</Text>
            <TouchableOpacity 
              style={[styles.popupDateButton, { borderColor: '#ffd3b6', backgroundColor: '#fdfdfd', height: 42, justifyContent: 'center', marginBottom: 12 }]} 
              onPress={() => {
                if (typeof setCaiSuaDatePickerVisible === 'function') setCaiSuaDatePickerVisible(true);
                if (typeof setCaiSuaDatePickerVisibility === 'function') setCaiSuaDatePickerVisibility(true);
              }}
            >
              <Text style={{ fontSize: 14, color: '#111111', fontWeight: '500' }}>📅 {caiSuaNgay}</Text>
            </TouchableOpacity>

            <DateTimePickerModal 
              isVisible={typeof isCaiSuaDatePickerVisible !== 'undefined' ? isCaiSuaDatePickerVisible : (typeof isCaiSuaDatePickerVisibility !== 'undefined' ? isCaiSuaDatePickerVisibility : false)} 
              mode="date" 
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              locale="vi_VN"
              onConfirm={(d) => { 
                setCaiSuaNgay(formatVNDate(d)); 
                if (typeof setCaiSuaDatePickerVisible === 'function') setCaiSuaDatePickerVisible(false);
                if (typeof setCaiSuaDatePickerVisibility === 'function') setCaiSuaDatePickerVisibility(false);
              }} 
              onCancel={() => {
                if (typeof setCaiSuaDatePickerVisible === 'function') setCaiSuaDatePickerVisible(false);
                if (typeof setCaiSuaDatePickerVisibility === 'function') setCaiSuaDatePickerVisibility(false);
              }} 
              confirmTextConfirm="Xác nhận" 
              cancelText="Hủy" 
            />

            <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 13, color: '#333333' }}>Nhập số heo cai sữa đạt (con):</Text>
            <TextInput 
              style={[styles.popupInput, { borderColor: '#ffd3b6', height: 42, paddingHorizontal: 12, color: '#111111', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }]} 
              placeholder="Nhập số lượng heo..." 
              keyboardType="numeric" 
              placeholderTextColor="#888888" 
              value={caiSuaSoCon} 
              onChangeText={setCaiSuaHeoSoCon} 
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity activeOpacity={0.6} onPress={() => setIsCaiSuaModalVisible(false)} style={{ flex: 1, backgroundColor: '#6c757d', paddingVertical: 11, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5 }}>HỦY BỎ</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.6} onPress={handleLuuCaiSuaNhanhTaiChuong} style={{ flex: 1, backgroundColor: '#e65100', paddingVertical: 11, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5 }}>XÁC NHẬN</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* 🏷️ MODAL 4: CẢNH BÁO MÃ TAI CHƯA KHAI BÁO THÊM NHANH */}
      <Modal visible={isAlertModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsAlertModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.popupCard, { width: '85%', padding: 24, alignItems: 'center' }]}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff0e6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 24 }}>🏷️</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111111', textAlign: 'center', marginBottom: 8 }}>Mã tai chưa khai báo</Text>
            <Text style={{ fontSize: 13, color: '#666666', textAlign: 'center', lineHeight: 18, marginBottom: 24 }}>
              Mã tai <Text style={{ fontWeight: 'bold', color: '#e65100' }}>{maTai?.trim().toUpperCase()}</Text> chưa có bên Sổ mã tai. Bạn cần khai báo số tai này trước khi nhập nhật ký!
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <TouchableOpacity activeOpacity={0.7} style={{ flex: 1, backgroundColor: '#f2f2f2', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }} onPress={() => setIsAlertModalVisible(false)}>
                <Text style={{ color: '#555555', fontWeight: 'bold', fontSize: 14 }}>Để sau</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={{ flex: 1, backgroundColor: '#e65100', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }} onPress={() => { setIsAlertModalVisible(false); setIsQuickAddModalVisible(true); }}>
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>Thêm ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✨ MODAL 5: HỘP THÔNG BÁO THÀNH CÔNG ĐẸP MẮT ĐẶT ĐỘC LẬP Ở ĐÁY FILE */}
      <Modal animationType="fade" transparent={true} visible={isThanhCongModalVisible} onRequestClose={() => setIsThanhCongModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#ffffff', width: '90%', maxWidth: 350, borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: '#a7f3d0', shadowColor: '#059669', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 12 }}>
            <View style={{ backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#059669', letterSpacing: 0.5 }}>✨ {txtThanhCongNoiDung?.tieuDe || "Thành Công"}</Text>
            </View>
            <ScrollView style={{ maxHeight: 160 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 13.5, color: '#2d3748', lineHeight: 21, textAlign: 'justify' }}>
                Mã tai heo nái <Text style={{ fontWeight: 'bold', color: '#007bff' }}>[ {txtThanhCongNoiDung?.maTai} ]</Text> {txtThanhCongNoiDung?.loiGiai}
              </Text>
            </ScrollView>
            <TouchableOpacity activeOpacity={0.6} onPress={() => setIsThanhCongModalVisible(false)} style={{ backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 25, alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5, letterSpacing: 0.3 }}>TIẾP TỤC NHẬP LIỆU 👍</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default NotificationModals;
