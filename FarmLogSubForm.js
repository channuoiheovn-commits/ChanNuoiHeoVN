import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ghiDongMoi } from './chuongThitService';
import ChonNgay from './ChonNgay'; // 📅 chọn ngày dạng cửa sổ

const FarmLogSubForm = ({ 
  cauHinhVacXinLoc,
  modalSubTab, 
  setModalSubTab, 
  selectedChuongGop, 
  ngayNhapInput, 
  setNgayNhapInput, 
  setIsCalendarOpen, 
  isCalendarOpen, 
  danhSachNgayTrongThangCalendar, 
  currentCalendarMonth, 
  setCurrentCalendarMonth, 
  currentCalendarYear, 
  setCurrentCalendarYear, 
  formatVNDate, 
  WEB_APP_URL, 
  userEmail, 
  setDongBoStatus, 
  setDanhSachChuongThit
}) => {
  const [inputSoLuong, setInputSoLuong] = useState("");
  const [inputTenVatTu, setInputTenVatTu] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Chốt chặn gác cổng: Nếu không lật thẻ trúng Cám/Vaccine thì giấu kín Form 100% bảo toàn diện tích
  if (modalSubTab !== "VAO_CAM" && modalSubTab !== "TIEM_VACCINE") return null;

  const laCam = modalSubTab === "VAO_CAM";

  const handleXacNhanGhiLogVatTu = () => {
    const soLuongChuan = Number(inputSoLuong);
    if (!soLuongChuan || soLuongChuan <= 0) {
      return Alert.alert("Thông báo", `Vui lòng nhập số lượng ${laCam ? "bao cám" : "liều vaccine"} hợp lệ lớn hơn 0!`);
    }
    if (!laCam && !inputTenVatTu.trim()) {
      return Alert.alert("Thông báo", "Vui lòng nhập tên loại Vaccine thuốc tiêm điều trị!");
    }

    setIsSending(true);
    if (typeof setDongBoStatus === 'function') setDongBoStatus("⏳ Đang dồn chi phí vật tư lên mây...");

    const chuongHienTai = selectedChuongGop?.tenChuong || "1";
    const khuChuan = selectedChuongGop?.tenKhu || "Cai Sữa";
    const chuoiNgayHnay = ngayNhapInput ? ngayNhapInput.toString().trim() : formatVNDate(new Date());

    // Thu thập hồ sơ bầy lợn hiện trạng để ép mốc tuần tuổi thực tế chuẩn chằn chặn
    const mangBayTho = Array.isArray(selectedChuongGop?.cacBayNho) ? selectedChuongGop.cacBayNho : [];
    const bayDauTien = mangBayTho[0] || {};
    // 🛠️ ĐÃ VÁ: bỏ mặc định cưỡng ép "tuần 4" khi không xác định được tuổi bầy hiện tại — để 0 thay vì tự chèn 4
    const tuanTuoiHienTai = bayDauTien.tuanTuoiThucTe || 0;

    const tenVatTuSach = laCam ? (inputTenVatTu.trim() || "Cám hỗn hợp lợn thịt") : inputTenVatTu.trim();
    const chuoiGhiChuLog = laCam ? `${tenVatTuSach}`: `${tenVatTuSach}`;

    const thamSoBaoCam = laCam ? soLuongChuan : 0;
    const thamSoLieuVaccine = laCam ? 0 : soLuongChuan;

    // 🚀 GHI THẲNG LÊN FIRESTORE (collection Chuong_Thit): 1 dòng sổ cái, nhãn suKienHeoThit = VAO_CAM hoặc TIEM_VACCINE.
    // Cloud Function tự đồng bộ sang Sheet (cột I = Cám, cột J = Vacxin, cột K = Sự Kiện)
    ghiDongMoi({
      userEmail,
      tenKhu: khuChuan,
      tenChuong: chuongHienTai,
      soCon: 0,
      tuanTuoi: tuanTuoiHienTai,
      ngayNhapChuong: chuoiNgayHnay,
      ghiChu: chuoiGhiChuLog,
      soBaoCam: thamSoBaoCam,
      soLieuVaccine: thamSoLieuVaccine,
      suKienHeoThit: modalSubTab // Lưu chính xác mã sự kiện VAO_CAM hoặc TIEM_VACCINE làm khóa lọc
    })
    .then(dongMoiHoanThien => {
      setIsSending(false);
      if (typeof setDongBoStatus === 'function') setDongBoStatus("✅ Đã ghi nhận chi phí!");
      Alert.alert("Thành công 🎉");

      // 🧠 RAM ẢO: đưa đúng dòng vừa ghi lên Firestore vào danh sách để hiển thị tức thì
      if (typeof setDanhSachChuongThit === 'function') {
        setDanhSachChuongThit(prev => [...(Array.isArray(prev) ? prev : []), dongMoiHoanThien]);
      }
      setInputSoLuong(""); setInputTenVatTu(""); setModalSubTab("AN_FORM");
    })
    .catch(() => { 
      setIsSending(false); 
      Alert.alert("Lỗi", "Không thể lưu dữ liệu, vui lòng kiểm tra mạng và thử lại."); 
    });
  };

  return (
    <View style={{ width: '100%', padding: 10, backgroundColor: laCam ? '#fffdf0' : '#f0fdf4', borderRadius: 8, borderWidth: 0.5, borderColor: laCam ? '#ffe0b2' : '#a3cfbb', marginBottom: 10 }}>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: laCam ? '#ffe0b2' : '#a3cfbb', paddingBottom: 5, marginBottom: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: '900', color: laCam ? '#e65100' : '#137333' }}>
          {laCam ? "🌾 Nhập Cám  ( Xem ở lịch sử Cám ) " : "💊 Chích Thuốc / Vacxin  ( Xem ở lịch sử Thuốc )"}
        </Text>
        <TouchableOpacity onPress={() => { setModalSubTab("AN_FORM"); setInputSoLuong(""); setInputTenVatTu(""); }} style={{ backgroundColor: '#ffffff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#ced4da' }}><Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#495057' }}>✕ Ẩn khay</Text></TouchableOpacity>
      </View>

      <ChonNgay value={ngayNhapInput} onChange={(d) => { if (typeof setNgayNhapInput === 'function') setNgayNhapInput(d); }} mau={laCam ? '#e65100' : '#28a745'} />

     
      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#495057', marginBottom: 4 }}>{laCam ? "Số bao cám" : "Số liều thuốc"}</Text>
      <TextInput style={{ height: 44, borderWidth: 1.5, borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#111111', borderColor: '#ced4da', backgroundColor: '#ffffff', marginBottom: 12 }} value={inputSoLuong} onChangeText={(txt) => setInputSoLuong(txt.replace(/[^0-9]/g, ''))} keyboardType="numeric" placeholder={laCam ? "Ví dụ: 50" : "Ví dụ: 100"} placeholderTextColor="#999999" />

 <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>{laCam ? "2. Gõ mã số / Tên nhãn hiệu Cám (Không bắt buộc):" : "2. Nhập chính xác tên loại Vaccine / Thuốc tiêm bệnh:"}</Text>
      <TextInput style={{ height: 36, borderWidth: 1, borderColor: '#ced4da', borderRadius: 5, backgroundColor: '#ffffff', paddingHorizontal: 10, marginBottom: 6, fontSize: 12 }} value={inputTenVatTu} onChangeText={setInputTenVatTu} placeholder={laCam ? "Ví dụ: cám thịt" : "Ví dụ: Dịch tả..."} placeholderTextColor="#999999" />

      <TouchableOpacity 
        disabled={isSending} 
        style={{ backgroundColor: laCam ? '#e67e22' : '#28a745', paddingVertical: 9, borderRadius: 5, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }} 
        onPress={() => { handleXacNhanGhiLogVatTu(); }}
      >

        {isSending && <ActivityIndicator size="small" color="#ffffff" />}
        <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>GHI VÀO LỊCH SỬ</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FarmLogSubForm;