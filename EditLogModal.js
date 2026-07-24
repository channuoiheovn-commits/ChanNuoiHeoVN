import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Button
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

const EditLogModal = ({ 
  visible, 
  onClose, 
  styles,
  formatVNDate,
  
  // Các state dữ liệu nhận từ App.js
  editNgay, setEditNgay,
  editMaTai, setEditMaTai,
  editSuKien, setEditSuKien,
  editSoHeo, setEditSoHeo,
  editChonNuoi, setEditChonNuoi,
  editKhoThai, setEditKhoThai,
  editCoiCoc, setEditCoiCoc,
  editChetNgop, setEditChetNgop,
  editGhiChu, setEditGhiChu,
  editCanNhapSoHeo,
  danhSachSuKien,
  
  // Các state quản lý lịch chọn ngày
  isEditDatePickerVisible, setEditDatePickerVisible,
  setEditDatePickerVisibility,
  editSuKienTamThoi, setEditSuKienTamThoi,
  
  // Hàm xử lý nút bấm lưu dữ liệu lên Cloud
  onSave
}) => {
  
  const laTrangThaiMoKhay = editSuKien === "OPEN_MENU_SK" || editSuKien === "OPEN_MENU";
  const chuHienThiChuan = (editSuKien && editSuKien !== "OPEN_MENU_SK" && editSuKien !== "OPEN_MENU") 
    ? editSuKien.toString().trim() 
    : ((typeof editSuKienTamThoi !== 'undefined' && editSuKienTamThoi) ? editSuKienTamThoi : "Phối");

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <ScrollView
          style={{ flex: 1, width: '95%', alignSelf: 'center' }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 14 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', padding: 16, borderRadius: 14, backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 }}>
            
            <Text style={[styles.popupTitle, { marginBottom: 12, color: '#111111', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }]}>
              📝 SỬA NHẬT KÝ HEO
            </Text>

            {/* 1. Lịch chọn ngày */}
            <TouchableOpacity 
              style={styles.popupDateButton} 
              onPress={() => {
                if (typeof setEditDatePickerVisible === 'function') setEditDatePickerVisible(true);
                if (typeof setEditDatePickerVisibility === 'function') setEditDatePickerVisibility(true);
              }}
            >
              <Text style={{ color: '#111111', fontSize: 13.5, fontWeight: '500' }}>📅 {editNgay}</Text>
            </TouchableOpacity>
            
            <DateTimePickerModal 
              isVisible={typeof isEditDatePickerVisible !== 'undefined' ? isEditDatePickerVisible : false} 
              mode="date" 
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              locale="vi_VN"
              onConfirm={(d) => { 
                setEditNgay(formatVNDate(d));
                if (typeof setEditDatePickerVisible === 'function') setEditDatePickerVisible(false);
                if (typeof setEditDatePickerVisibility === 'function') setEditDatePickerVisibility(false);
              }} 
              onCancel={() => {
                if (typeof setEditDatePickerVisible === 'function') setEditDatePickerVisible(false);
                if (typeof setEditDatePickerVisibility === 'function') setEditDatePickerVisibility(false);
              }} 
              confirmTextConfirm="Xác nhận"
              cancelText="Hủy"
            />

            {/* 2. Ô nhập Mã Tai heo nái */}
            <TextInput 
              style={[styles.popupInput, { marginTop: 10, color: '#111111', backgroundColor: '#ffffff', fontWeight: 'bold' }]} 
              value={editMaTai} 
              onChangeText={setEditMaTai} 
              placeholderTextColor="#777777" 
              autoCapitalize="characters" 
            />
            
            {/* 3. Hộp chọn Sự kiện sinh sản heo nái */}
            <View style={{ width: '100%', marginTop: 10 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (!laTrangThaiMoKhay && chuHienThiChuan !== "") {
                    if (typeof setEditSuKienTamThoi === 'function') setEditSuKienTamThoi(chuHienThiChuan);
                  }
                  setEditSuKien(laTrangThaiMoKhay ? chuHienThiChuan : "OPEN_MENU_SK");
                }}
                style={{
                  height: 42,
                  width: '100%',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  backgroundColor: '#ffffff',
                  borderWidth: 1.2,
                  borderColor: '#ffd3b6',
                  borderRadius: 7,
                }}
              >
                <Text style={{ color: '#111111', fontSize: 14, fontWeight: '700' }}>{chuHienThiChuan}</Text>
                <Text style={{ fontSize: 12, color: '#111111' }}>{laTrangThaiMoKhay ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {laTrangThaiMoKhay && (
                <View style={{ width: '100%', backgroundColor: '#ffffff', borderLeftWidth: 1.2, borderRightWidth: 1.2, borderBottomWidth: 1.2, borderColor: '#ffd3b6', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, maxHeight: 180, marginTop: -1, overflow: 'hidden' }}>
                  <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingVertical: 2 }}>
                    {Array.isArray(danhSachSuKien) && danhSachSuKien.map((itemText, index) => {
                      const laDongDangChon = chuHienThiChuan === itemText.toString().trim();
                      return (
                        <TouchableOpacity
                          key={`custom_sk_inline_fixed_${index}`}
                          activeOpacity={0.7}
                          onPress={() => {
                            setEditSuKien(itemText.toString().trim()); 
                            if (typeof setEditSuKienTamThoi === 'function') setEditSuKienTamThoi(itemText.toString().trim());
                            if (typeof setEditSoHeo === 'function') setEditSoHeo('');
                          }}
                          style={{ paddingVertical: 11, paddingHorizontal: 14, backgroundColor: laDongDangChon ? '#fffaf5' : '#ffffff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: index < danhSachSuKien.length - 1 ? 0.5 : 0, borderBottomColor: '#f8f9fa' }}
                        >
                          <Text style={{ fontSize: 14, color: laDongDangChon ? '#e65100' : '#111111', fontWeight: laDongDangChon ? '900' : '500' }}>{itemText}</Text>
                          {laDongDangChon && <Text style={{ fontSize: 12, color: '#e65100' }}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
            {/* 4. Ô nhập Số lượng con */}
            {editCanNhapSoHeo && editSuKien !== "Đẻ" && (
              <TextInput 
                style={[styles.popupInput, { marginTop: 10, color: '#111111', backgroundColor: '#ffffff' }]} 
                value={editSoHeo} 
                onChangeText={setEditSoHeo} 
                placeholder="Nhập số lượng heo..."
                placeholderTextColor="#777777" 
                keyboardType="numeric" 
              />
            )}

            {/* 5. Khối chi tiết Heo Đẻ bung 5 ô nhập */}
            {editSuKien === "Đẻ" && (
              <View style={{ backgroundColor: '#fdf7f2', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f5dad2', marginTop: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100', marginBottom: 12 }}>Sửa chi tiết Heo Đẻ:</Text>
                
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, color: '#d32f2f', fontWeight: '600', marginBottom: 4, paddingLeft: 2 }}>📊 Tổng số con sinh ra (Sống + Chết)</Text>
                  <TextInput style={[styles.popupInput, { fontSize: 14, height: 38, paddingVertical: 0, fontWeight: 'bold', borderColor: '#f5c6cb', backgroundColor: '#ffffff' }]} keyboardType="numeric" value={editSoHeo} onChangeText={setEditSoHeo} />
                </View>

                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, color: '#28a745', fontWeight: '600', marginBottom: 4, paddingLeft: 2 }}>🟢 Số heo Chọn nuôi </Text>
                  <TextInput style={[styles.popupInput, { fontSize: 14, height: 38, paddingVertical: 0, fontWeight: 'bold', borderColor: '#c3e6cb', backgroundColor: '#ffffff' }]} keyboardType="numeric" value={editChonNuoi} onChangeText={setEditChonNuoi} />
                </View>

                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, color: '#666666', marginBottom: 4, paddingLeft: 2 }}>📝 Số con chết khô</Text>
                  <TextInput style={[styles.popupInput, { fontSize: 14, height: 38, paddingVertical: 0, backgroundColor: '#ffffff' }]} keyboardType="numeric" value={editKhoThai} onChangeText={setEditKhoThai} />
                </View>

                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, color: '#666666', marginBottom: 4, paddingLeft: 2 }}>📝 Số con còi cọc, dị tật</Text>
                  <TextInput style={[styles.popupInput, { fontSize: 14, height: 38, paddingVertical: 0, backgroundColor: '#ffffff' }]} keyboardType="numeric" value={editCoiCoc} onChangeText={setEditCoiCoc} />
                </View>

                <View style={{ marginBottom: 2 }}>
                  <Text style={{ fontSize: 11, color: '#666666', marginBottom: 4, paddingLeft: 2 }}>📝 Số con chết ngộp, lưu thai</Text>
                  <TextInput style={[styles.popupInput, { fontSize: 14, height: 38, paddingVertical: 0, backgroundColor: '#ffffff' }]} keyboardType="numeric" value={editChetNgop} onChangeText={setEditChetNgop} />
                </View>
              </View>
            )}

            {/* 6. Ô nhập Ghi chú phẳng */}
            <TextInput 
              style={[styles.popupInput, { marginTop: 10, color: '#111111', backgroundColor: '#ffffff' }]} 
              placeholder="Sửa Ghi chú" 
              placeholderTextColor="#888888" 
              value={editGhiChu} 
              onChangeText={setEditGhiChu} 
            />

            {/* Cụm nút bấm */}
            <View style={styles.popupButtonGroup}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Button title="LƯU SỬA" onPress={onSave} color="#ffc107" />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="HỦY" onPress={onClose} color="#6c757d" />
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EditLogModal;
