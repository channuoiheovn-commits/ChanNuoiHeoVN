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

const AddPigMeatModal = ({ 
  visible, 
  onClose, 
  styles,
  formatVNDate,
  
  // Khối State dữ liệu nhận từ App.js
  heoThitActionType,
  heoThitNgay, setHeoThitNgay,
  heoThitTuanChon, setHeoThitTuanChon,
  heoThitSoLuong, setHeoThitSoCon,
  heoThitGhiChu, setHeoThitGhiChu,
  dataHeoThit,
  
  // Trạng thái điều khiển lịch chọn ngày
  isHeoThitDatePickerVisible, setHeoThitDatePickerVisible,
  isHeoThitDatePickerVisibility, setHeoThitDatePickerVisibility,
  
  // Hàm xử lý lưu hành động lên Google Sheets gốc của trại
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
          <View style={{ width: '100%', padding: 10, borderRadius: 14, backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 }}>
            
            {/* Tiêu đề thanh mảnh nhận diện theo màu nghiệp vụ Nhập/Bán/Hao hụt */}
            <View 
              style={{ 
                backgroundColor: heoThitActionType === 'Nhập Đàn' ? '#e7f1ff' : (heoThitActionType === 'Hao Hụt' ? '#f8d7da' : '#d4edda'), 
                borderWidth: 0.5, 
                borderColor: heoThitActionType === 'Nhập Đàn' ? '#b8daff' : (heoThitActionType === 'Hao Hụt' ? '#f5c6cb' : '#c3e6cb'), 
                borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, alignItems: 'center', marginBottom: 10 
              }}
            >
              <Text style={{ fontSize: 12.5, fontWeight: '900', color: heoThitActionType === 'Nhập Đàn' ? '#004085' : (heoThitActionType === 'Hao Hụt' ? '#721c24' : '#155724'), letterSpacing: 0.3 }}>
                {heoThitActionType === 'Nhập Đàn' ? 'Nhập Heo' : (heoThitActionType === 'Hao Hụt' ? 'HEO THỊT HAO HỤT' : 'XUẤT BÁN HEO')}
              </Text>
            </View>

            {/* HÀNG 1: Chọn ngày thực hiện */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 12.5, color: '#333333' }}>Chọn Ngày:</Text>
              <TouchableOpacity 
                style={{ flex: 1, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#fdfdfd', height: 34, justifyContent: 'center', paddingHorizontal: 10 }} 
                onPress={() => {
                  if (typeof setHeoThitDatePickerVisible === 'function') setHeoThitDatePickerVisible(true);
                  if (typeof setHeoThitDatePickerVisibility === 'function') setHeoThitDatePickerVisibility(true);
                }}
              >
                <Text style={{ fontSize: 13, color: '#111111', fontWeight: '500' }}>📅 {heoThitNgay}</Text>
              </TouchableOpacity>
            </View>

            <DateTimePickerModal 
              isVisible={typeof isHeoThitDatePickerVisible !== 'undefined' ? isHeoThitDatePickerVisible : (typeof isHeoThitDatePickerVisibility !== 'undefined' ? isHeoThitDatePickerVisibility : false)} 
              mode="date" 
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              locale="vi_VN"
              onConfirm={(d) => { 
                setHeoThitNgay(formatVNDate(d)); 
                if (typeof setHeoThitDatePickerVisible === 'function') setHeoThitDatePickerVisible(false);
                if (typeof setHeoThitDatePickerVisibility === 'function') setHeoThitDatePickerVisibility(false);
              }} 
              onCancel={() => {
                if (typeof setHeoThitDatePickerVisible === 'function') setHeoThitDatePickerVisible(false);
                if (typeof setHeoThitDatePickerVisibility === 'function') setHeoThitDatePickerVisibility(false);
              }} 
              confirmTextConfirm="Xác nhận" 
              cancelText="Hủy" 
            />
            {/* 📊 PHẦN 1: THIẾT KẾ PHÂN HỘP GIAI ĐOẠN RÕ RÀNG TRONG POP-UP THÊM MỚI */}
            <View style={{ backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, padding: 8, gap: 12, marginBottom: 10 }}>
              {(() => {
                const mangLuaTuanThitAdd = [
                  { id: "4", nhan: "Cai Sữa", khoaRAM: "caiSua" },
                  { id: "5", nhan: "Tuần 5", khoaRAM: "5 Tuần" },
                  { id: "6", nhan: "Tuần 6", khoaRAM: "6 Tuần" },
                  { id: "7", nhan: "Tuần 7", khoaRAM: "7 Tuần" },
                  { id: "8", nhan: "Tuần 8", khoaRAM: "8 Tuần" },
                  { id: "9", nhan: "Tuần 9", khoaRAM: "9 Tuần" },
                  { id: "10", nhan: "Tuần 10", khoaRAM: "10 Tuần" },
                  { id: "11", nhan: "Tuần 11", khoaRAM: "11 Tuần" },
                  { id: "12", nhan: "Tuần 12", khoaRAM: "12 Tuần" },
                  { id: "13", nhan: "Tuần 13", khoaRAM: "13 Tuần" },
                  { id: "14", nhan: "Tuần 14", khoaRAM: "14 Tuần" },
                  { id: "15", nhan: "Tuần 15", khoaRAM: "15 Tuần" },
                  { id: "16", nhan: "Tuần 16", khoaRAM: "16 Tuần" },
                  { id: "17", nhan: "Tuần 17", khoaRAM: "17 Tuần" },
                  { id: "18", nhan: "Tuần 18", khoaRAM: "18 Tuần" },
                  { id: "19", nhan: "Tuần 19", khoaRAM: "19 Tuần" },
                  { id: "20", nhan: "Tuần 20", khoaRAM: "20 Tuần" },
                  { id: "21", nhan: "Tuần 21", khoaRAM: "21 Tuần" },
                  { id: "22", nhan: "Tuần 22", khoaRAM: "22 Tuần" },
                  { id: "23", nhan: "Tuần 23", khoaRAM: "23 Tuần" },
                  { id: "24", nhan: "Tuần 24", khoaRAM: "24 Tuần" },
                  { id: "25", nhan: "Tuần 25", khoaRAM: "25 Tuần" },
                  { id: "26", nhan: "Tuần 26", khoaRAM: "26 Tuần" },
                  { id: "27", nhan: "Tuần 27", khoaRAM: "27 Tuần" },
                  { id: "28", nhan: "Tuần 28", khoaRAM: "28 Tuần" },
                  { id: "29", nhan: "Tuần 29", khoaRAM: "29 Tuần" },
                  { id: "30", nhan: "Tuần 30", khoaRAM: "30 Tuần" }
                ];

                let mauChuChuongCap = '#007bff';
                if (heoThitActionType === 'Hao Hụt') mauChuChuongCap = '#dc3545';
                if (heoThitActionType === 'Bán') mauChuChuongCap = '#28a745';

                const veNutOChonAdd = (idTim, laDo) => {
                  const node = mangLuaTuanThitAdd.find(m => m.id === idTim);
                  if (!node) return null;

                  let soConHienTai = "0";
                  if (dataHeoThit) {
                    if (dataHeoThit[node.khoaRAM] !== undefined) {
                      soConHienTai = dataHeoThit[node.khoaRAM];
                    } else if (dataHeoThit[`${node.id} Tuần`] !== undefined) {
                      soConHienTai = dataHeoThit[`${node.id} Tuần`];
                    }
                    if (node.id === "4" && dataHeoThit["4 Tuần ( Cai Sữa )"] !== undefined) {
                      soConHienTai = dataHeoThit["4 Tuần ( Cai Sữa )"];
                    }
                  }

                  const laOThuocCheck = heoThitTuanChon && heoThitTuanChon.toString().trim() === node.id.toString().trim();
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
                      key={`add_ht_node_clean_${node.id}`}
                      activeOpacity={0.7}
                      onPress={() => setHeoThitTuanChon(node.id.toString().trim())}
                      style={{
                        flex: 1, minWidth: '30%', height: 44, borderRadius: 6,
                        borderWidth: laOThuocCheck ? 2 : 1,
                        borderColor: laOThuocCheck ? mauChuChuongCap : vTinh,
                        backgroundColor: laOThuocCheck ? mauChuChuongCap + '10' : nTinh,
                        alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 11.5, fontWeight: '800', color: laOThuocCheck ? mauChuChuongCap : '#212529' }}>
                        {node.nhan}
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
                        {veNutOChonAdd("4", false)}
                        <View style={{ flex: 1 }} /><View style={{ flex: 1 }} />
                      </View>
                    </View>

                    <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#e65100', marginBottom: 6, paddingLeft: 2 }}>
                        Giai đoạn 3. Đàn 10 - 30kg (Tuần 5-9)
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 5 }}>
                        {["5", "6", "7"].map(id => veNutOChonAdd(id, false))}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 5 }}>
                        {["8", "9"].map(id => veNutOChonAdd(id, false))}
                        <View style={{ flex: 1 }} />
                      </View>
                    </View>

                    <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#e65100', marginBottom: 6, paddingLeft: 2 }}>
                        Giai đoạn 4. Đàn 30 - 60kg (Tuần 10-15)
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 5 }}>
                        {["10", "11", "12"].map(id => veNutOChonAdd(id, false))}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 5 }}>
                        {["13", "14", "15"].map(id => veNutOChonAdd(id, false))}
                      </View>
                    </View>

                    <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#e65100', marginBottom: 6, paddingLeft: 2 }}>
                        Giai đoạn 5. Đàn 60 - 100kg (Tuần 16-20)
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 5 }}>
                        {["16", "17", "18"].map(id => veNutOChonAdd(id, false))}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 5 }}>
                        {["19", "20"].map(id => veNutOChonAdd(id, false))}
                        <View style={{ flex: 1 }} />
                      </View>
                    </View>
                {/* 🔴 GIAI DOAN 6: TU 100KG - 130KG BOXED */}
                <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#f5c6cb' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#c82333', marginBottom: 6, paddingLeft: 2 }}>
                    Giai đoạn 6. Từ 100kg - 130kg (Tuần 21-25)
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 5, marginBottom: 5 }}>
                    {["21", "22", "23"].map(id => veNutOChonAdd(id, true))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    {["24", "25"].map(id => veNutOChonAdd(id, true))}
                    <View style={{ flex: 1 }} />
                  </View>
                </View>

                {/* 🔴 GIAI DOAN 7: GIAI DOAN 130KG - XUAT CHUONG */}
                <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#f5c6cb' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#c82333', marginBottom: 6, paddingLeft: 2 }}>
                    Giai đoạn 7. 130kg - Xuất Chuồng (Tuần 26-30)
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 5, marginBottom: 5 }}>
                    {["26", "27", "28"].map(id => veNutOChonAdd(id, true))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    {["29", "30"].map(id => veNutOChonAdd(id, true))}
                    <View style={{ flex: 1 }} />
                  </View>
                </View>

              </View>
            );
          })()}
        </View>

        {/* Ô NHẬP SỐ LƯỢNG CON (HÀNG RIÊNG 1) */}
        <View style={{ marginBottom: 10, width: '100%' }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 12.5, color: '#333333' }}>🔢 Số lượng con heo</Text>
          <TextInput 
            style={{ borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, height: 38, paddingHorizontal: 10, color: '#111111', fontSize: 14, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ffffff', width: '100%' }} 
            placeholder="Nhập số con..." 
            keyboardType="numeric" 
            placeholderTextColor="#aaaaaa" 
            value={heoThitSoLuong} 
            onChangeText={setHeoThitSoCon} 
          />
        </View>

        {/* Ô NHẬP GHI CHÚ LÝ DO (HÀNG RIÊNG 2) */}
        <View style={{ marginBottom: 15, width: '100%' }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 12.5, color: '#333333' }}>📝 Ghi chú lý do ( nếu có )</Text>
          <TextInput 
            style={{ borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, height: 38, paddingHorizontal: 10, color: '#111111', fontSize: 13, backgroundColor: '#ffffff', width: '100%' }} 
            placeholder="Ghi chú nếu có" 
            placeholderTextColor="#aaaaaa" 
            value={heoThitGhiChu} 
            onChangeText={setHeoThitGhiChu} 
          />
        </View>

        {/* Cụm hai nút điều hướng phẳng bo cong dưới đáy */}
        <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
          <TouchableOpacity 
            activeOpacity={0.6} onPress={onClose}
            style={{ flex: 1, backgroundColor: '#6c757d', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5 }}>HỦY BỎ</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.6} 
            onPress={onSave}
            style={{ 
              flex: 1, 
              backgroundColor: heoThitActionType === 'Nhập Đàn' ? '#007bff' : (heoThitActionType === 'Hao Hụt' ? '#dc3545' : '#28a745'), 
              paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' 
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5 }}>XÁC NHẬN</Text>
          </TouchableOpacity>
        </View>

            </View>
          </ScrollView> 
        </KeyboardAvoidingView> 
      </Modal>
  );
};

export default AddPigMeatModal;
