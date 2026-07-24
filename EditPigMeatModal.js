import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

const EditPigMeatModal = ({ 
  visible, 
  onClose, 
  styles,
  formatVNDate,
  
  suaHeoThitNgay, setSuaHeoThitNgay,
  suaHeoThitTuanChon, setSuaHeoThitTuanChon,
  suaHeoThitSoLuong, setSuaHeoThitSoCon,
  suaHeoThitGhiChu, setSuaHeoThitGhiChu,
  suaHeoThitActionType,
  
  dataHeoThit,
  danhSachLichSu,
  lichSuHeoThit,
  
  isSuaHeoThitDatePickerVisible, setSuaHeoThitDatePickerVisible,
  isSuaHeoThitDatePickerVisibility, setSuaHeoThitDatePickerVisibility,
  
  onSave
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <ScrollView
          style={{ flex: 1, width: '95%', alignSelf: 'center' }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 14 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width: '96%', padding: 12, borderRadius: 14, backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 }}>
            
            <Text style={[styles.popupTitle, { marginBottom: 12, color: '#111111', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }]}>
              📝 MỤC SỬA HEO THỊT
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#333333' }}>Ngày làm:</Text>
              <TouchableOpacity 
                style={{ flex: 1, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#fdfdfd', height: 36, justifyContent: 'center', paddingHorizontal: 10 }} 
                onPress={() => {
                  if (typeof setSuaHeoThitDatePickerVisible === 'function') setSuaHeoThitDatePickerVisible(true);
                  if (typeof setSuaHeoThitDatePickerVisibility === 'function') setSuaHeoThitDatePickerVisibility(true);
                }}
              >
                <Text style={{ fontSize: 13.5, color: '#111111', fontWeight: '500' }}>📅 {suaHeoThitNgay}</Text>
              </TouchableOpacity>
            </View>

            <DateTimePickerModal 
              isVisible={typeof isSuaHeoThitDatePickerVisible !== 'undefined' ? isSuaHeoThitDatePickerVisible : (typeof isSuaHeoThitDatePickerVisibility !== 'undefined' ? isSuaHeoThitDatePickerVisibility : false)} 
              mode="date" 
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              locale="vi_VN"
              onConfirm={(d) => { 
                setSuaHeoThitNgay(formatVNDate(d)); 
                if (typeof setSuaHeoThitDatePickerVisible === 'function') setSuaHeoThitDatePickerVisible(false);
                if (typeof setSuaHeoThitDatePickerVisibility === 'function') setSuaHeoThitDatePickerVisibility(false);
              }} 
              onCancel={() => {
                if (typeof setSuaHeoThitDatePickerVisible === 'function') setSuaHeoThitDatePickerVisible(false);
                if (typeof setSuaHeoThitDatePickerVisibility === 'function') setSuaHeoThitDatePickerVisibility(false);
              }} 
              confirmTextConfirm="Xác nhận" 
              cancelText="Hủy" 
            />
            {/* 2. Khối sơ đồ bàn cờ quét tính toán quân số heo theo RAM thực tế */}
            <View style={{ backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, padding: 8, gap: 12 }}>
              {(() => {
                const laySoTho = (val) => {
                  if (val === undefined || val === null) return 0;
                  const str = val.toString().trim();
                  if (str === "" || isNaN(str)) return 0;
                  return Number(str);
                };

                const khoTuanPopupEditRealTime = {};
                const danhSachTatCaCacTuan = [
                  "4 Tuần ( Cai Sữa )", "5 Tuần", "6 Tuần", "7 Tuần", "8 Tuần", "9 Tuần",
                  "10 Tuần", "11 Tuần", "12 Tuần", "13 Tuần", "14 Tuần", "15 Tuần",
                  "16 Tuần", "17 Tuần", "18 Tuần", "19 Tuần", "20 Tuần",
                  "21 Tuần", "22 Tuần", "23 Tuần", "24 Tuần", "25 Tuần",
                  "26 Tuần", "27 Tuần", "28 Tuần", "29 Tuần", "30 Tuần"
                ];

                danhSachTatCaCacTuan.forEach(k => {
                  khoTuanPopupEditRealTime[k] = laySoTho(dataHeoThit ? dataHeoThit[k] : 0);
                });

                if (dataHeoThit && khoTuanPopupEditRealTime["4 Tuần ( Cai Sữa )"] === 0) {
                  khoTuanPopupEditRealTime["4 Tuần ( Cai Sữa )"] = laySoTho(dataHeoThit.caiSua) || laySoTho(dataHeoThit["Cai Sữa"]);
                }

                let mangLichSuSong = [];
                if (typeof danhSachLichSu !== 'undefined' && Array.isArray(danhSachLichSu)) {
                  mangLichSuSong = danhSachLichSu;
                } else if (typeof lichSuHeoThit !== 'undefined' && Array.isArray(lichSuHeoThit)) {
                  mangLichSuSong = lichSuHeoThit;
                }

                if (mangLichSuSong.length > 0) {
                  mangLichSuSong.forEach(item => {
                    if (item && item.syncStatus !== "waiting") {
                      const chuoiSuKien = item.suKien ? item.suKien.toString().trim() : "";
                      const sCon = laySoTho(item.soHeo);
                      const loaiHanhDong = item.actionType || item.suKienLoai || "";

                      const mangSoTho = chuoiSuKien.match(/\d+/);
                      const soTuanSoHoc = mangSoTho ? parseInt(mangSoTho, 10) : 0;

                      if (soTuanSoHoc >= 4 && soTuanSoHoc <= 30) {
                        const khoaDinhDanh = soTuanSoHoc === 4 ? "4 Tuần ( Cai Sữa )" : `${soTuanSoHoc} Tuần`;
                        if (loaiHanhDong === "Nhập Đàn") {
                          khoTuanPopupEditRealTime[khoaDinhDanh] += sCon;
                        } else {
                          khoTuanPopupEditRealTime[khoaDinhDanh] -= sCon;
                        }
                      }
                    }
                  });
                }

                let mauChuChuongCap = '#007bff';
                if (suaHeoThitActionType === 'Hao Hụt') mauChuChuongCap = '#dc3545';
                if (suaHeoThitActionType === 'Bán') mauChuChuongCap = '#28a745';

                const veNutOChonSua = (idTim, laDo) => {
                  const khoaKey = idTim === "4" ? "4 Tuần ( Cai Sữa )" : `${idTim} Tuần`;
                  const soConHienTai = khoTuanPopupEditRealTime[khoaKey] !== undefined ? khoTuanPopupEditRealTime[khoaKey] : 0;

                  let chuHienThiNut = idTim === "4" ? "Cai Sữa" : `Tuần ${idTim}`;
                  const laOThuocCheck = suaHeoThitTuanChon === idTim;
                  const coHeoThucTe = Number(soConHienTai) > 0;

                  let vTinh = '#dee2e6';
                  let nTinh = '#ffffff';
                  let cConTinh = '#137333';

                  if (laDo && coHeoThucTe) {
                    vTinh = '#f5c6cb';
                    nTinh = '#ffffff';
                    cConTinh = '#c82333';
                  } else if (laDo && !coHeoThucTe) {
                    vTinh = '#e9ecef';
                    nTinh = '#ffffff';
                    cConTinh = '#adb5bd';
                  } else if (!laDo && !coHeoThucTe) {
                    cConTinh = '#adb5bd';
                  }

                  return (
                    <TouchableOpacity
                      key={`edit_ht_node_clean_${idTim}`}
                      activeOpacity={0.7}
                      onPress={() => setSuaHeoThitTuanChon(idTim)}
                      style={{
                        flex: 1, minWidth: '30%', height: 44, borderRadius: 6,
                        borderWidth: laOThuocCheck ? 2 : 1,
                        borderColor: laOThuocCheck ? mauChuChuongCap : vTinh,
                        backgroundColor: laOThuocCheck ? mauChuChuongCap + '10' : nTinh,
                        alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 11.5, fontWeight: '800', color: laOThuocCheck ? mauChuChuongCap : '#212529' }}>
                        {chuHienThiNut}
                      </Text>
                      <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 10, fontWeight: 'bold', color: laOThuocCheck ? mauChuChuongCap : cConTinh, marginTop: 2 }}>
                        {soConHienTai} Con
                      </Text>
                    </TouchableOpacity>
                  );
                };

                return (
                  <View style={{ gap: 10, width: '100%' }}>
                    <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#e65100', marginBottom: 6, paddingLeft: 2 }}>
                        Giai đoạn 2. Heo Cai Sữa (4 tuần)
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 5 }}>
                        {veNutOChonSua("4", false)}
                        <View style={{ flex: 1 }} /><View style={{ flex: 1 }} />
                      </View>
                    </View>

                    <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#e65100', marginBottom: 6, paddingLeft: 2 }}>
                        Giai đoạn 3. Đàn 10 - 30kg (Tuần 5-9)
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 5 }}>
                        {["5", "6", "7"].map(id => veNutOChonSua(id, false))}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 5 }}>
                        {["8", "9"].map(id => veNutOChonSua(id, false))}
                        <View style={{ flex: 1 }} />
                      </View>
                    </View>

                    <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#e65100', marginBottom: 6, paddingLeft: 2 }}>
                        Giai đoạn 4. Đàn 30 - 60kg (Tuần 10-15)
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 5 }}>
                        {["10", "11", "12"].map(id => veNutOChonSua(id, false))}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 5 }}>
                        {["13", "14", "15"].map(id => veNutOChonSua(id, false))}
                      </View>
                    </View>

                    <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#e65100', marginBottom: 6, paddingLeft: 2 }}>
                        Giai đoạn 5. Đàn 60 - 100kg (Tuần 16-20)
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 5 }}>
                        {["16", "17", "18"].map(id => veNutOChonSua(id, false))}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 5 }}>
                        {["19", "20"].map(id => veNutOChonSua(id, false))}
                        <View style={{ flex: 1 }} />
                      </View>
                    </View>
                    <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#f5c6cb' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#c82333', marginBottom: 6, paddingLeft: 2 }}>
                        Giai đoạn 6. Từ 100kg - 130kg (Tuần 21-25)
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 5 }}>
                        {["21", "22", "23"].map(id => veNutOChonSua(id, true))}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 5 }}>
                        {["24", "25"].map(id => veNutOChonSua(id, true))}
                        <View style={{ flex: 1 }} />
                      </View>
                    </View>

                    <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#f5c6cb' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#c82333', marginBottom: 6, paddingLeft: 2 }}>
                        Giai đoạn 7. 130kg - Xuất Chuồng (Tuần 26-30)
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 5 }}>
                        {["26", "27", "28"].map(id => veNutOChonSua(id, true))}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 5 }}>
                        {["29", "30"].map(id => veNutOChonSua(id, true))}
                        <View style={{ flex: 1 }} />
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* 3. Ô nhập Số lượng con heo tác động */}
            <View style={{ marginBottom: 10, width: '100%', marginTop: 12 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 12.5, color: '#333333' }}>🔢 Số lượng con heo tác động:</Text>
              <TextInput 
                style={{ borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, height: 38, paddingHorizontal: 10, color: '#111111', fontSize: 14, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ffffff', width: '100%' }} 
                keyboardType="numeric" 
                value={suaHeoThitSoLuong} 
                onChangeText={setSuaHeoThitSoCon} 
              />
            </View>

            {/* 4. Ô nhập Ghi chú lý do chi tiết */}
            <View style={{ marginBottom: 15, width: '100%' }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 12.5, color: '#333333' }}>📝 Ghi chú lý do chi tiết:</Text>
              <TextInput 
                style={{ borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, height: 38, paddingHorizontal: 10, color: '#111111', fontSize: 13, backgroundColor: '#ffffff', width: '100%' }} 
                value={suaHeoThitGhiChu} 
                onChangeText={setSuaHeoThitGhiChu} 
              />
            </View>

            {/* 5. Cụm hai nút điều khiển */}
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity 
                activeOpacity={0.6} onPress={onClose}
                style={{ flex: 1, backgroundColor: '#6c757d', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5 }}>HỦY BỎ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                activeOpacity={0.6} onPress={onSave}
                style={{ flex: 1, backgroundColor: '#ffc107', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#111111', fontWeight: 'bold', fontSize: 13.5 }}>LƯU SỬA</Text>
              </TouchableOpacity>
            </View> 

          </View> 
        </ScrollView> 
      </KeyboardAvoidingView> 
    </Modal>
  );
};

export default EditPigMeatModal;
