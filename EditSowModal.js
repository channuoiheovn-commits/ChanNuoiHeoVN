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
  Button,
  Alert
} from 'react-native';

const EditSowModal = ({ 
  visible, 
  onClose, 
  styles,
  
  // Các state dữ liệu nhận từ App.js
  mtEditMaTai, setMtEditMaTai,
  mtEditGiong, setMtEditGiong,
  mtEditLua, setMtEditLua,
  danhSachLuaHeo,
  
  // Biến tạm để điều khiển menu lứa đẻ
  editLuaTamThoi, setEditLuaTamThoi,
  
  // Hàm xử lý nút Cập nhật lên Cloud
  onSave 
}) => {
  const laTrangThaiMoKhay = mtEditLua === "OPEN_MENU_EDIT_LUA";
  
  let chuHienThiChuan = mtEditLua ? mtEditLua.toString().trim() : "";
  
  const giaTriMacDinhDauTien = (Array.isArray(danhSachLuaHeo) && danhSachLuaHeo.length > 0) 
    ? danhSachLuaHeo[0].toString().trim() 
    : "Hậu bị";

  if (laTrangThaiMoKhay) {
    if (typeof editLuaTamThoi !== 'undefined' && editLuaTamThoi && editLuaTamThoi !== "OPEN_MENU_EDIT_LUA" && editLuaTamThoi !== "") {
      chuHienThiChuan = editLuaTamThoi;
    } else {
      chuHienThiChuan = giaTriMacDinhDauTien;
    }
  } else {
    if (chuHienThiChuan === "" || chuHienThiChuan === "OPEN_MENU_EDIT_LUA") {
      chuHienThiChuan = giaTriMacDinhDauTien;
    }
  }

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>📝 SỬA SỔ DANH BẠ HEO</Text>
            
            <TextInput 
              style={[styles.popupInput, {color: '#111111', backgroundColor: '#ffffff'}]} 
              value={mtEditMaTai} 
              onChangeText={setMtEditMaTai} 
              placeholderTextColor="#777777" 
              autoCapitalize="characters" 
            />
            
            <TextInput 
              style={[styles.popupInput, {marginTop: 10, color: '#111111', backgroundColor: '#ffffff'}]} 
              value={mtEditGiong} 
              onChangeText={setMtEditGiong} 
              placeholder="Sửa Giống heo" 
              placeholderTextColor="#777777" 
            />
            {/* 3. Hộp chọn Lứa đẻ kèm khay cuộn dropdown mượt mà */}
            <View style={{ width: '100%', backgroundColor: '#ffffff', marginTop: 10 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (!laTrangThaiMoKhay && chuHienThiChuan !== "OPEN_MENU_EDIT_LUA" && chuHienThiChuan !== "") {
                    if (typeof setEditLuaTamThoi === 'function') {
                      setEditLuaTamThoi(chuHienThiChuan);
                    }
                  }
                  setMtEditLua(laTrangThaiMoKhay ? chuHienThiChuan : "OPEN_MENU_EDIT_LUA");
                }}
                style={{
                  height: 42,
                  width: '100%',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  backgroundColor: '#ffffff',
                  borderRadius: 7,
                  borderWidth: 1.2,
                  borderColor: '#ffd3b6'
                }}
              >
                <Text style={{ 
                  color: (chuHienThiChuan.includes("Chọn") || chuHienThiChuan.includes("chọn") || chuHienThiChuan.includes("Hãy") || chuHienThiChuan.includes("hãy")) ? '#888888' : '#111111', 
                  fontSize: 13, 
                  fontWeight: (chuHienThiChuan.includes("Chọn") || chuHienThiChuan.includes("chọn") || chuHienThiChuan.includes("Hãy") || chuHienThiChuan.includes("hãy")) ? '400' : '700' 
                }}>
                  Lứa đẻ: {chuHienThiChuan}
                </Text>
                <Text style={{ fontSize: 12, color: '#e65100' }}>{laTrangThaiMoKhay ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {laTrangThaiMoKhay && (
                <View 
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    borderLeftWidth: 1.2,
                    borderRightWidth: 1.2,
                    borderBottomWidth: 1.2,
                    borderColor: '#ffd3b6',
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                    height: 180, 
                    marginTop: -1,
                    overflow: 'hidden'
                  }}
                >
                  <ScrollView 
                    nestedScrollEnabled={true} 
                    showsVerticalScrollIndicator={true} 
                    contentContainerStyle={{ paddingVertical: 2 }}
                  >
                    {Array.isArray(danhSachLuaHeo) && danhSachLuaHeo.map((itemText, index) => {
                      const textDongSach = itemText.toString().trim();
                      const laDongDangChon = chuHienThiChuan === textDongSach;
                      const laDongChuMoiHuongDan = textDongSach.includes("Chọn") || textDongSach.includes("chọn") || textDongSach.includes("Hãy") || textDongSach.includes("hãy");

                      return (
                        <TouchableOpacity
                          key={`custom_edit_lua_inline_fixed_${index}`}
                          activeOpacity={0.7}
                          onPress={() => {
                            if (laDongChuMoiHuongDan) {
                              return Alert.alert(
                                "Hãy Chọn Lứa",
                                "", 
                                [{ text: "Tôi sẽ chọn", style: "default" }]
                              );
                            }
                            setMtEditLua(textDongSach); 
                            if (typeof setEditLuaTamThoi === 'function') {
                              setEditLuaTamThoi(textDongSach);
                            }
                          }}
                          style={{
                            paddingVertical: 11,
                            paddingHorizontal: 14,
                            backgroundColor: laDongDangChon ? '#fffaf5' : '#ffffff',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottomWidth: index < danhSachLuaHeo.length - 1 ? 0.5 : 0,
                            borderBottomColor: '#f8f9fa'
                          }}
                        >
                          <Text style={{
                            fontSize: 13,
                            color: laDongChuMoiHuongDan ? '#adb5bd' : (laDongDangChon ? '#e65100' : '#111111'),
                            fontWeight: laDongDangChon ? '900' : '500',
                            fontStyle: laDongChuMoiHuongDan ? 'italic' : 'normal'
                          }}>
                            {itemText}
                          </Text>
                          {laDongDangChon && !laDongChuMoiHuongDan && <Text style={{ fontSize: 12, color: '#e65100' }}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <Text style={{ fontSize: 11.5, color: '#666666', fontStyle: 'italic', marginBottom: 12, paddingHorizontal: 4, lineHeight: 16 }}>
              ( lứa heo lúc nhập về, thông thường sẽ để hậu bị. hệ thống tự tính toán lứa đẻ, không cần phải sửa )
            </Text>

            {/* Cụm hai nút Cập nhật và Hủy */}
            <View style={styles.popupButtonGroup}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Button title="CẬP NHẬT" onPress={onSave} color="#ffc107" />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="HỦY" onPress={onClose} color="#6c757d" />
              </View>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView> 
    </Modal>
  );
};

export default EditSowModal;
