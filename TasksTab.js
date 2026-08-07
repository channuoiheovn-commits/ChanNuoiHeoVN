import React, { useEffect, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

// BẢNG CHỌN LỊCH TRỰC QUAN ĐỒNG BỘ TRẠI
import DateTimePickerModal from "react-native-modal-datetime-picker";

const TasksTab = ({
  currentTab,
  styles,
  formatVNDate,
  parseToDateObject,
  
  // Quản lý Tab phụ nội bộ
  subTab, setSubTab,
  kieuXemThoiGianTask, setKieuXemThoiGianTask,
  
  // Danh sách dữ liệu nền nhận từ App.js
  danhSachLichSu,
  danhSachCauHinhVacXin, setDanhSachCauHinhVacXin,
  danhSachSoTay,
  danhSachDangDe,
  userEmail,
  
  // Trạng thái hiển thị đóng mở các khối cảnh báo tĩnh
  hienBatLocChiTietTab3, setHienBatLocChiTietTab3,
  hienSapDeChiTietTab3, setHienSapDeChiTietTab3,
  hienCaiSuaChiTietTab3, setHienCaiSuaChiTietTab3,
  hienQuyTrinhChiTietTab3, setHienQuyTrinhChiTietTab3,
  
  // Quản lý Form cấu hình vắc-xin mới từ App.js
  loaiMocInput, setLoaiMocInput,
  inputDays, setInputDays,
  inputName, setInputName,
  ghiChuVacXinInput, setGhiChuVacXinInput,
  editingConfigId, setEditingConfigId,
  
  // Các hàm tiện ích hệ thống gốc
  layDanhSachNhiemVuHomNay,
  xuLyMangCauHinhVacXin,
  AsyncStorage
}) => {
// State quản lý ẩn/hiện Pop-up sửa cấu hình vắc-xin
const [isEditModalVisible, setIsEditModalVisible] = useState(false);
const [hienLichTrongModal, setHienLichTrongModal] = useState(false);

  // Bộ nhớ tại chỗ quản lý riêng ô nhập ngày tiêm mũi trước cho cấu hình Định Kỳ
  const [ngayTiemTruocLocal, setNgayTiemTruocLocal] = useState("");
  const [isLichDatePickerVisible, setIsLichDatePickerVisible] = useState(false);

  const moBangChonLich = () => { setIsLichDatePickerVisible(true); };
  const dongBangChonLich = () => { setIsLichDatePickerVisible(false); };

    const xacNhanChonNgayTuLich = (date) => {
    setIsLichDatePickerVisible(false); // Ẩn lịch hệ thống
    if (date) {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      setNgayTiemTruocLocal(`${dd}/${mm}/${yyyy}`);
    }
    
    // 🔑 CHỐT CHẶN TRẢI NGHIỆM: Đợi 200ms cho lịch biến mất hoàn toàn rồi mới tự động mở lại Pop-up sửa thuốc
    setTimeout(() => {
      setIsEditModalVisible(true);
    }, 200);
  };


  const bamChuyenSangViecHomNay = () => { if (typeof setKieuXemThoiGianTask === 'function') setKieuXemThoiGianTask("HOM_NAY"); };
  const bamChuyenSangLich3Ngay = () => { if (typeof setKieuXemThoiGianTask === 'function') setKieuXemThoiGianTask("3_NGAY"); };
  
  const bamMoSubTabViecHomNay = () => { setSubTab("today_tasks"); };
  const bamMoSubTabLichVacxin = () => { setSubTab("setup_schedule"); };
  const bamMoSubTabNhatKyTiem = () => { setSubTab("inject_history"); };

  const bamDongMoKhoiBatLoc = () => { setHienBatLocChiTietTab3(!hienBatLocChiTietTab3); };
  const bamDongMoKhoiSapDe = () => { setHienSapDeChiTietTab3(!hienSapDeChiTietTab3); };
  const bamDongMoKhoiCaiSua = () => { setHienCaiSuaChiTietTab3(!hienCaiSuaChiTietTab3); };
  const bamDongMoKhoiVacxin = () => { setHienQuyTrinhChiTietTab3(!hienQuyTrinhChiTietTab3); };
  // Khối giao diện động bóc tách hiển thị cô lập theo loại mốc khi sửa
   const renderKhoiNhapLieuCoLapTheoNhom = () => {
    switch (loaiMocInput) {
      case "DINH_KY":
        return (
          <View style={{ backgroundColor: '#fff8f0', padding: 10, borderRadius: 6, borderWidth: 0.5, borderColor: '#ffe0b2', marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#e65100', marginBottom: 8 }}>📢 CẤU HÌNH LỊCH ĐỊNH KỲ TỔNG ĐÀN:</Text>
            
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Ngày tiêm gốc của trại (Bấm chọn):</Text>
            
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => setHienLichTrongModal(!hienLichTrongModal)}
              style={{ height: 42, borderWidth: 1, borderColor: '#ffd3b6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 12, marginBottom: 10, justifyContent: 'center' }}
            >
              <Text style={{ color: ngayTiemTruocLocal ? '#111111' : '#888888', fontSize: 13 }}>
                {ngayTiemTruocLocal ? `📅 Ngày tiêm cũ: ${ngayTiemTruocLocal}` : "Bấm chọn ngày tiêm mốc gốc..."}
              </Text>
            </TouchableOpacity>

            {/* KHAY LỊCH PHẲNG TRỰC QUAN CỦA BẠN */}
            {hienLichTrongModal && (
              <View style={{ borderWidth: 1, borderColor: '#ffd3b6', borderRadius: 8, backgroundColor: '#ffffff', padding: 4, marginBottom: 10, overflow: 'hidden' }}>
                <DateTimePickerModal
                  isVisible={hienLichTrongModal}
                  mode="date"
                  display="inline" 
                 onConfirm={(date) => {
  // 🔑 BƯỚC 1: Tắt khay lịch lập tức để gỡ bỏ lớp màng chắn cảm ứng ẩn trên màn hình
  setHienLichTrongModal(false); 
  
  if (date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    
    // 🔑 BƯỚC 2: Trì hoãn nhẹ 80ms chờ lịch đóng hẳn rồi mới nạp dữ liệu ngày tháng
    setTimeout(() => {
      setNgayTiemTruocLocal(`${dd}/${mm}/${yyyy}`);
    }, 80);
  }
}}
                  onCancel={() => setHienLichTrongModal(false)}
                  locale="vi"
                  confirmTextConfirm="Xác nhận"
                  cancelText="Hủy"
                />
              </View>
            )}

            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Khoảng cách chu kỳ nhắc lại (Số ngày):</Text>
            <TextInput style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, color: '#111111' }} value={inputDays} onChangeText={(txt) => setInputDays(txt.replace(/[^0-9]/g, ''))} keyboardType="number-pad" placeholderTextColor="#888888" />
          </View>
        );

      case "SAU_PHOI":
        return (
          <View style={{ backgroundColor: '#f0f4f8', padding: 10, borderRadius: 6, borderWidth: 0.5, borderColor: '#d0e1fd', marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#0056b3', marginBottom: 8 }}>🤰 CẤU HÌNH THEO NGÀY PHỐI (NÁI BẦU):</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Sau mốc bao nhiêu ngày phối thì tiêm:</Text>
            <TextInput style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, color: '#111111' }} value={inputDays} onChangeText={(txt) => setInputDays(txt.replace(/[^0-9]/g, ''))} keyboardType="number-pad" placeholderTextColor="#888888" />
          </View>
        );

      case "SAU_NGAY_DE":
        return (
          <View style={{ backgroundColor: '#e8f5e9', padding: 10, borderRadius: 6, borderWidth: 0.5, borderColor: '#b1dfbb', marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#28a745', marginBottom: 8 }}>🍼 CẤU HÌNH THEO NGÀY ĐẺ (NÁI NUÔI CON):</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Sau mốc bao nhiêu ngày đẻ thì tiêm:</Text>
            <TextInput style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, color: '#111111' }} value={inputDays} onChangeText={(txt) => setInputDays(txt.replace(/[^0-9]/g, ''))} keyboardType="number-pad" placeholderTextColor="#888888" />
          </View>
        );

      default:
        return null;
    }
  };


  useEffect(() => {
    if (currentTab === 'tasks' && typeof layDanhSachNhiemVuHomNay === 'function') {
      layDanhSachNhiemVuHomNay();
    }
  }, [currentTab]);

  // 🛰️ BỘ LỌCuseMemo TỐI CAO: Khử hoàn toàn rác chữ, cô lập vắc-xin khỏi trục thai sản
  const { danhSachHeoLocCanhBao, mangVacXinSauCung } = useMemo(() => {
    if (currentTab !== 'tasks') return { danhSachHeoLocCanhBao: [], mangVacXinSauCung: [] };

    const mangLichSuGocTho = danhSachLichSu || [];
    const mangVacXinCấuHình = danhSachCauHinhVacXin || [];
    const mangRamGocViec = global.danhSachCapNhatTrangThai || [];
    
    const ngayHomNayObj = new Date();
    ngayHomNayObj.setHours(0, 0, 0, 0);
    const timeMocHomNay = ngayHomNayObj.getTime();
    const cheDoXemHienTai = kieuXemThoiGianTask || "HOM_NAY";

    // HẠT NHÂN CHỐT CHẶN: Sắp xếp giảm dần, lọc SẠCH BỎ sự kiện Vacxin/Điều trị rác ra khỏi trục sinh sản chính
    const khoSuKienMoiNhatCuaNai = {};
    if (Array.isArray(mangLichSuGocTho)) {
      const mangLichSuSapXep = [...mangLichSuGocTho].sort((a, b) => {
        const timeA = parseToDateObject(a.ngay) ? parseToDateObject(a.ngay).getTime() : 0;
        const timeB = parseToDateObject(b.ngay) ? parseToDateObject(b.ngay).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return (b.id ? b.id.toString() : "").localeCompare(a.id ? a.id.toString() : "");
      });

      mangLichSuSapXep.forEach(item => {
        if (!item || !item.suKien || !item.maTai || item.actionType === "delete" || item.syncStatus === "delete") return;
        
        const maTaiKey = item.maTai.toString().trim().toUpperCase();
        const ngayObj = parseToDateObject(item.ngay);
        if (!ngayObj) return;

        const suKienChuanHoa = item.suKien.toString().trim().toUpperCase().normalize("NFC");
        
        // 🛑 BỘ LỌC CHỈ TÌM SỰ KIỆN SINH SẢN CHÍNH, BỎ QUA VẮC-XIN/ĐIỀU TRỊ Ổ CỨNG
        const laSuKienSinhSanHopLe = suKienChuanHoa.includes("PHỐI") || suKienChuanHoa.includes("PHOI") ||
                                      suKienChuanHoa.includes("ĐẺ") || suKienChuanHoa.includes("DE") ||
                                      suKienChuanHoa.includes("CAI") || suKienChuanHoa.includes("LỐC") || 
                                      suKienChuanHoa.includes("LOC") || suKienChuanHoa.includes("SẢY") || 
                                      suKienChuanHoa.includes("SAY") || suKienChuanHoa.includes("THẢI") || 
                                      suKienChuanHoa.includes("THAI") || suKienChuanHoa.includes("CHỜ PHỐI");

        if (laSuKienSinhSanHopLe && !khoSuKienMoiNhatCuaNai[maTaiKey]) {
          khoSuKienMoiNhatCuaNai[maTaiKey] = {
            itemGoc: item,
            ngayObj: ngayObj,
            suKienChuan: suKienChuanHoa
          };
        }
      });
    }
    // A. TÍNH TOÁN DANH SÁCH BẮT LỐC (Chỉ hiển thị ở màn hình ngày HOM_NAY)
    const danhSachHeoLoc = [];
    if (cheDoXemHienTai === "HOM_NAY") {
      Object.keys(khoSuKienMoiNhatCuaNai).forEach(maTaiKey => {
        const thongTinSk = khoSuKienMoiNhatCuaNai[maTaiKey];
        if (thongTinSk.suKienChuan.includes("PHỐI") || thongTinSk.suKienChuan.includes("PHOI") || thongTinSk.suKienChuan.includes("GIỐNG")) {
          const khoangCachNgayBau = Math.round((timeMocHomNay - thongTinSk.ngayObj.getTime()) / 86400000);
          if (khoangCachNgayBau >= 17 && khoangCachNgayBau <= 22) {
            danhSachHeoLoc.push({ maTai: thongTinSk.itemGoc.maTai, soNgay: khoangCachNgayBau });
          }
        }
      });
    }

    // B. TÍNH TOÁN MA TRẬN NHẮC LỊCH TIÊM CHỦNG
    const danhSachViecTrongNgayChuan = [];
    if (Array.isArray(mangRamGocViec) && mangRamGocViec.length > 0) {
      mangRamGocViec.forEach(dongHeo => {
        if (!dongHeo || dongHeo.vuaNhapMoi === true) return;

        const maTaiHeo = dongHeo.maTai ? dongHeo.maTai.toString().toUpperCase().trim() : "";
        
        // Chặn tuyệt đối nái đã bị thanh lý/thải loại ra khỏi quy trình nhắc thuốc định kỳ
        const ttNaiReal = (dongHeo.trangThaiDienThoai || dongHeo.trangThai || "").toString().trim().toUpperCase();
        if (ttNaiReal === "THẢI") return;

        const skMoiNhatCuaHeo = khoSuKienMoiNhatCuaNai[maTaiHeo];

        mangVacXinCấuHình.forEach(vx => {
          if (!vx || !vx.soNgay) return;
          
          const tenMuiChichChuan = vx.tenNhiemVu || vx.tenVacXin || "---";
          const mocNgayCauHinh = parseInt(vx.soNgay, 10);
          const oHanhDongTho = (vx.loaiHanhDong || vx.loaiMoc || "VACXIN_SAU_PHOI").toString().trim().toUpperCase();

          let laKhopNgayViec = false;
          let ngayConLaiMatTien = 0;
          let bienDemSoNgayCachBietRealTime = 0;
          let nhanNhomChuKy = "[SAU PHỐI]";

          // 🤰 LUỒNG 1: NHÓM VẮC-XIN SAU PHỐI (Chỉ khớp khi nái đang mang thai thực tế)
          if (oHanhDongTho.includes("SAU_PHOI") && skMoiNhatCuaHeo && (skMoiNhatCuaHeo.suKienChuan.includes("PHỐI") || skMoiNhatCuaHeo.suKienChuan.includes("PHOI"))) {
            bienDemSoNgayCachBietRealTime = Math.round((timeMocHomNay - skMoiNhatCuaHeo.ngayObj.getTime()) / 86400000);
            ngayConLaiMatTien = mocNgayCauHinh - bienDemSoNgayCachBietRealTime;
            nhanNhomChuKy = "[SAU PHỐI]";
            
            if (cheDoXemHienTai === "HOM_NAY") {
              if (bienDemSoNgayCachBietRealTime === mocNgayCauHinh) laKhopNgayViec = true;
            } else {
              if (bienDemSoNgayCachBietRealTime < mocNgayCauHinh && bienDemSoNgayCachBietRealTime + 3 >= mocNgayCauHinh) laKhopNgayViec = true;
            }
          } 
          // 🍼 LUỒNG 2: NHÓM VẮC-XIN SAU NGÀY ĐẺ (Chỉ khớp khi nái đang nuôi con thực tế)
          else if ((oHanhDongTho.includes("SAU_NGAY_DE") || oHanhDongTho.includes("SAU_DE")) && skMoiNhatCuaHeo && (skMoiNhatCuaHeo.suKienChuan.includes("ĐẺ") || skMoiNhatCuaHeo.suKienChuan.includes("DE"))) {
            bienDemSoNgayCachBietRealTime = Math.round((timeMocHomNay - skMoiNhatCuaHeo.ngayObj.getTime()) / 86400000);
            ngayConLaiMatTien = mocNgayCauHinh - bienDemSoNgayCachBietRealTime;
            nhanNhomChuKy = "[SAU ĐẺ]";
            
            if (cheDoXemHienTai === "HOM_NAY") {
              if (bienDemSoNgayCachBietRealTime === mocNgayCauHinh) laKhopNgayViec = true;
            } else {
              if (bienDemSoNgayCachBietRealTime < mocNgayCauHinh && bienDemSoNgayCachBietRealTime + 3 >= mocNgayCauHinh) laKhopNgayViec = true;
            }
          }
          // 📢 LUỒNG 3: NHÓM ĐỊNH KỲ TỔNG ĐÀN (Quét theo vòng lặp thời gian thực tế toàn chuồng)
          else if (oHanhDongTho.includes("DINH_KY")) {
            nhanNhomChuKy = "[ĐỊNH KỲ]";
            const mocNgayGocTiem = vx.ngayTiemTruoc || dongHeo.ngayNhapChuong || "01/01/2026";
            const ngayTiemGocObj = parseToDateObject(mocNgayGocTiem);
            
            if (ngayTiemGocObj) {
              const soNgayCachBiet = Math.round((timeMocHomNay - ngayTiemGocObj.getTime()) / 86400000);
              
              if (vx.ngayTiemTruoc) {
                bienDemSoNgayCachBietRealTime = soNgayCachBiet;
                ngayConLaiMatTien = mocNgayCauHinh - soNgayCachBiet;
                if (cheDoXemHienTai === "HOM_NAY") {
                  if (soNgayCachBiet === mocNgayCauHinh) laKhopNgayViec = true;
                } else {
                  if (soNgayCachBiet < mocNgayCauHinh && soNgayCachBiet + 3 >= mocNgayCauHinh) laKhopNgayViec = true;
                }
              } else {
                const chuKyHienTai = soNgayCachBiet % mocNgayCauHinh;
                bienDemSoNgayCachBietRealTime = chuKyHienTai;
                ngayConLaiMatTien = mocNgayCauHinh - chuKyHienTai;
                if (cheDoXemHienTai === "HOM_NAY") {
                  if (chuKyHienTai === 0) laKhopNgayViec = true;
                } else {
                  if (chuKyHienTai >= mocNgayCauHinh - 3 && chuKyHienTai < mocNgayCauHinh) laKhopNgayViec = true;
                }
              }
            }
          }

          // Kiểm tra chốt chặn loại trừ trùng lặp: Nếu trong chu kỳ nái đã chích thuốc này rồi thì ẩn lịch nhắc đi
          if (laKhopNgayViec) {
            const laCaDaChichThucTe = mangLichSuGocTho.some(item => {
              if (!item || !item.maTai || !item.suKien || item.actionType === "delete" || item.syncStatus === "delete") return false;
              
              const xSuKienText = item.suKien.toString().trim().toUpperCase();
              const ghiChuText = (item.ghiChu || "").toString().trim().toUpperCase();
              
              if (xSuKienText !== "VẮC-XIN" && xSuKienText !== "VACXIN") return false;
              if (!ghiChuText.includes(tenMuiChichChuan.toUpperCase())) return false;
              
              const mangTaiLog = item.maTai.toString().toUpperCase().split(',').map(s => s.trim());
              if (!mangTaiLog.includes(maTaiHeo.toUpperCase())) return false;

              const ngayTiemDeObj = parseToDateObject(item.ngay);
              if (!ngayTiemDeObj) return false;
              
              const khoangCachNgayLog = Math.abs(timeMocHomNay - ngayTiemDeObj.getTime()) / 86400000;
              return khoangCachNgayLog < mocNgayCauHinh;
            });

            if (!laCaDaChichThucTe) {
              const nhanHienThiChuoiText = cheDoXemHienTai === "HOM_NAY" ? `${tenMuiChichChuan} (${mocNgayCauHinh} ngày)` : `${tenMuiChichChuan} (Còn ${ngayConLaiMatTien} ngày)`;
              danhSachViecTrongNgayChuan.push({
                id: `${vx.id || Math.random().toString()}_${maTaiHeo}`,
                cauhinhId: tenMuiChichChuan,
                tenNhiemVu: nhanHienThiChuoiText,
                maTai: maTaiHeo,
                loai: oHanhDongTho,
                nhanMoc: nhanHienThiChuoiText.includes("Còn") ? `Còn ${ngayConLaiMatTien} ngày` : nhanNhomChuKy,
                soNgayGocThucTe: bienDemSoNgayCachBietRealTime
              });
            }
          }
        });
      });
    }

    const khoNhomVacXin = {};
    danhSachViecTrongNgayChuan.forEach(task => {
      const kKey = task.cauhinhId.toString().trim();
      const bieuTuong = task.nhanMoc;
      if (!khoNhomVacXin[kKey]) {
        khoNhomVacXin[kKey] = { bieuTuong, cauhinhId: kKey, tenNhiemVu: kKey, loaiMocGoc: task.loai, mangMaTaiCho: [] };
      }
      
      const checkTrungTai = khoNhomVacXin[kKey].mangMaTaiCho.some(h => h.maTaiHeo === task.maTai);
      if (!checkTrungTai) {
        khoNhomVacXin[kKey].mangMaTaiCho.push({
          maTaiHeo: task.maTai,
          soNgayThucTeCuaHeo: task.soNgayGocThucTe
        });
      }
    });

    return {
      danhSachHeoLocCanhBao: danhSachHeoLoc,
      mangVacXinSauCung: Object.values(khoNhomVacXin)
    };
  }, [currentTab, danhSachLichSu, danhSachCauHinhVacXin, global.danhSachCapNhatTrangThai, kieuXemThoiGianTask]);

  if (currentTab !== 'tasks') return null;
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      
      {/* 🧭 Thanh Menu lựa chọn 3 Sub-tab nghiệp vụ */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8, gap: 6, borderBottomWidth: 0.5, borderBottomColor: '#f1f2f6', backgroundColor: '#fffaf5' }}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={bamMoSubTabViecHomNay}
          style={{ flex: 1, paddingVertical: 6, borderRadius: 15, backgroundColor: subTab === "today_tasks" ? '#e65100' : 'transparent', borderWidth: subTab === "today_tasks" ? 0.5 : 0, borderColor: '#ffd3b6', alignItems: 'center' }}
        >
          <Text style={{ color: subTab === "today_tasks" ? '#ffffff' : '#7f8c8d', fontSize: 11.5, fontWeight: 'bold' }}>📋 Việc Hôm Nay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={bamMoSubTabLichVacxin}
          style={{ flex: 1, paddingVertical: 6, borderRadius: 15, backgroundColor: subTab === "setup_schedule" ? '#e65100' : 'transparent', borderWidth: subTab === "setup_schedule" ? 0.5 : 0, borderColor: '#ffd3b6', alignItems: 'center' }}
        >
          <Text style={{ color: subTab === "setup_schedule" ? '#ffffff' : '#7f8c8d', fontSize: 11.5, fontWeight: 'bold' }}>⚙️ Lịch Vắc-xin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={bamMoSubTabNhatKyTiem}
          style={{ flex: 1, paddingVertical: 6, borderRadius: 15, backgroundColor: subTab === "inject_history" ? '#e65100' : 'transparent', borderWidth: subTab === "inject_history" ? 0.5 : 0, borderColor: '#ffd3b6', alignItems: 'center' }}
        >
          <Text style={{ color: subTab === "inject_history" ? '#ffffff' : '#7f8c8d', fontSize: 11.5, fontWeight: 'bold' }}>📜 Số Tay Cá Nhân</Text>
        </TouchableOpacity>
      </View>

      {/* 📋 SUB-TAB 1: DANH SÁCH VIỆC CẦN LÀM TRONG NGÀY */}
      {subTab === "today_tasks" && (
        <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 12, paddingBottom: 120 }}>
          
          <View style={{ flexDirection: 'row', backgroundColor: '#f1f2f6', borderRadius: 10, padding: 3, marginBottom: 14, gap: 4 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={bamChuyenSangViecHomNay}
              style={{ flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: (kieuXemThoiGianTask || "HOM_NAY") === "HOM_NAY" ? '#ffffff' : 'transparent', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: (kieuXemThoiGianTask || "HOM_NAY") === "HOM_NAY" ? '#e65100' : '#555555' }}>📅 Việc Hôm Nay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={bamChuyenSangLich3Ngay}
              style={{ flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: (kieuXemThoiGianTask || "HOM_NAY") === "3_NGAY" ? '#ffffff' : 'transparent', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: (kieuXemThoiGianTask || "HOM_NAY") === "3_NGAY" ? '#e65100' : '#555555' }}>⏳ Lịch 3 Ngày Tới</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111111', marginBottom: 10 }}>
            {(kieuXemThoiGianTask || "HOM_NAY") === "HOM_NAY" ? "Danh sách việc cần làm hôm nay" : "Lịch nhắc thuốc dự kiến trong 3 ngày tới"}
          </Text>

          {danhSachHeoLocCanhBao.length === 0 && mangVacXinSauCung.length === 0 && (!global.danhSachHeoSapDeCanhBao || global.danhSachHeoSapDeCanhBao.length === 0) && (!global.danhSachHeoCaiSuaCanhBao || global.danhSachHeoCaiSuaCanhBao.length === 0) ? (
            <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 24, marginBottom: 8 }}>✅</Text>
              <Text style={{ color: '#28a745', fontSize: 13, fontWeight: 'bold' }}>HÔM NAY HOÀN THÀNH XUẤT SẮC!</Text>
            </View>
          ) : (
            <View style={{ width: '100%' }}>
              
            {/* 🚨 KHỐI CẢNH BÁO BẮT LỐC (Có nút bấm sập xòe đóng mở chi tiết) */}
              {(kieuXemThoiGianTask || "HOM_NAY") === "HOM_NAY" && danhSachHeoLocCanhBao.length > 0 && (
                <View style={{ borderWidth: 1.2, borderColor: '#f5c6cb', borderRadius: 8, backgroundColor: '#ffffff', marginBottom: 14, overflow: 'hidden' }}>
                  <TouchableOpacity activeOpacity={0.7} onPress={bamDongMoKhoiBatLoc} style={{ backgroundColor: '#fff5f5', paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: hienBatLocChiTietTab3 ? 0.5 : 0, borderBottomColor: '#f5c6cb' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ backgroundColor: '#dc3545', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#ffffff' }}>🚨</Text></View>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#dc3545' }}>THEO DÕI BẮT LỐC (Từ 17 đến 22 ngày)</Text>
                    </View>
                    <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 0.8, borderColor: '#f5c6cb', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#dc3545' }}>{danhSachHeoLocCanhBao.length} Con</Text>
                      <Text style={{ fontSize: 9, color: '#dc3545', fontWeight: 'bold' }}>{hienBatLocChiTietTab3 ? "▲ Thu gọn" : "▼ Xem"}</Text>
                    </View>
                  </TouchableOpacity>
                  {hienBatLocChiTietTab3 && (
                    <View style={{ padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: '#fdfdfd' }}>
                      {danhSachHeoLocCanhBao.map((heo, hIdx) => (
                        <View key={`cb_loc_${hIdx}`} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#f5c6cb', backgroundColor: '#fff5f5', flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: '31.5%', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#dc3545' }}>{heo.maTai}</Text>
                          <Text style={{ fontSize: 9.5, color: '#dc3545', fontWeight: '600' }}>{heo.soNgay} Ngày</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
               {/* 🐖 KHỐI CẢNH BÁO HEO SẮP ĐẺ (Từ 110 ngày trở lên) */}
{(kieuXemThoiGianTask || "HOM_NAY") === "HOM_NAY" && global.danhSachHeoSapDeCanhBao && global.danhSachHeoSapDeCanhBao.length > 0 && (                              <View style={{ borderWidth: 1.2, borderColor: '#ffeeba', borderRadius: 8, backgroundColor: '#ffffff', marginBottom: 16, overflow: 'hidden' }}>
                                <TouchableOpacity activeOpacity={0.7} onPress={bamDongMoKhoiSapDe} style={{ backgroundColor: '#fffdf0', paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: hienSapDeChiTietTab3 ? 0.5 : 0, borderBottomColor: '#ffeeba' }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={{ backgroundColor: '#ffc107', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#111111' }}>🐖</Text></View>
                                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#b78103' }}>HEO SẮP ĐẺ (Từ 110 ngày)</Text>
                                  </View>
                                  <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 0.8, borderColor: '#ffeeba', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#b78103' }}>{global.danhSachHeoSapDeCanhBao.length} Con</Text>
                                    <Text style={{ fontSize: 8, color: '#ba8b00' }}>{hienSapDeChiTietTab3 ? "▲" : "▼"}</Text>
                                  </View>
                                </TouchableOpacity>
                                {hienSapDeChiTietTab3 && (
                                  <View style={{ padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: '#fdfdfd' }}>
                                    {global.danhSachHeoSapDeCanhBao.map((heo, hIdx) => (
                                      <View key={`cb_sapde_${hIdx}`} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#ffeeba', backgroundColor: '#fffdf0', flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: '31.5%', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#b78103' }}>{heo.maTai}</Text>
                                        <Text style={{ fontSize: 9.5, color: '#ba8b00', fontWeight: '600' }}>{heo.soNgay} Ngày</Text>
                                      </View>
                                    ))}
                                  </View>
                                )}
                              </View>
                            )}
              {/* 🍼 KHỐI CẢNH BÁO THEO DÕI CAI SỮA (Có nút bấm sập xòe đóng mở chi tiết) */}
              {(kieuXemThoiGianTask || "HOM_NAY") === "HOM_NAY" && global.danhSachHeoCaiSuaCanhBao && global.danhSachHeoCaiSuaCanhBao.length > 0 && (
                <View style={{ borderWidth: 1.2, borderColor: '#b1dfbb', borderRadius: 8, backgroundColor: '#ffffff', marginBottom: 16, overflow: 'hidden' }}>
                  <TouchableOpacity activeOpacity={0.7} onPress={bamDongMoKhoiCaiSua} style={{ backgroundColor: '#e8f5e9', paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: hienCaiSuaChiTietTab3 ? 0.5 : 0, borderBottomColor: '#b1dfbb' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ backgroundColor: '#28a745', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#ffffff' }}>🍼</Text></View>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#1e7e34' }}>THEO DÕI CAI SỮA (Từ 20 ngày)</Text>
                    </View>
                    <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 0.8, borderColor: '#b1dfbb', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#28a745' }}>{global.danhSachHeoCaiSuaCanhBao.length} Con</Text>
                      <Text style={{ fontSize: 9, color: '#28a745', fontWeight: 'bold' }}>{hienCaiSuaChiTietTab3 ? "▲ Thu gọn" : "▼ Xem"}</Text>
                    </View>
                  </TouchableOpacity>
                  {hienCaiSuaChiTietTab3 && (
                    <View style={{ padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: '#fdfdfd' }}>
                      {global.danhSachHeoCaiSuaCanhBao.map((heo, hIdx) => (
                        <View key={`cb_caisua_${hIdx}`} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#b1dfbb', backgroundColor: '#e8f5e9', flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: '31.5%', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#1e7e34' }}>{heo.maTai}</Text>
                          <Text style={{ fontSize: 9.5, color: '#1e7e34', fontWeight: '600' }}>{heo.soNgay} Ngày</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

                     {/* 🤰 LUỒNG 1: HIỂN THỊ CHI TIẾT Ô MÃ TAI CHO NHÓM VẮC-XIN SẢN KHOA (SAU PHỐI / SAU ĐẺ) */}
{Array.isArray(mangVacXinSauCung) && mangVacXinSauCung.filter(c => c.loaiMocGoc !== "VACXIN_DINH_KY").length > 0 && (
  <View style={{ borderWidth: 1.2, borderColor: '#ffd3b6', borderRadius: 8, backgroundColor: '#ffffff', marginBottom: 14, overflow: 'hidden' }}>
    
    {/* NÚT BẤM ĐIỀU KHIỂN ĐÓNG MỞ KHỐI SẢN KHOA */}
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={bamDongMoKhoiSapDe} 
      style={{ backgroundColor: '#fffaf5', paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: hienSapDeChiTietTab3 ? 0.5 : 0, borderBottomColor: '#ffd3b6' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ backgroundColor: '#0056b3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#ffffff' }}>🤰</Text></View>
        <Text style={{ fontSize: 10, fontWeight: '800', color: '#0056b3' }}>
          {(kieuXemThoiGianTask || "HOM_NAY") === "HOM_NAY" ? "VẮC-XIN SAU PHỐI / SAU ĐẺ" : "LỊCH TIÊM 3 NGÀY TỚI"}
        </Text>
      </View>
      <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 0.8, borderColor: '#ffd3b6', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: '900', color: '#0056b3' }}>{mangVacXinSauCung.filter(c => c.loaiMocGoc !== "VACXIN_DINH_KY").length} Loại Mũi</Text>
        <Text style={{ fontSize: 9, color: '#0056b3', fontWeight: 'bold' }}>{hienSapDeChiTietTab3 ? "▲ Thu gọn" : "▼ Xem"}</Text>
      </View>
    </TouchableOpacity>

   {/* CHI TIẾT CÁC MŨI SẢN KHOA */}
{hienSapDeChiTietTab3 && (
  <View style={{ padding: 10, backgroundColor: '#fdfdfd' }}>
    {mangVacXinSauCung.filter(c => c.loaiMocGoc !== "VACXIN_DINH_KY").map((campaign, campaignIdx) => (
      <View key={`camp_sk_${campaignIdx}`} style={{ borderWidth: 1, borderColor: '#ffd3b6', borderRadius: 8, backgroundColor: '#ffffff', marginBottom: 10, padding: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#e65100', marginBottom: 8 }}>
          TÊN THUỐC: {campaign.tenNhiemVu.toUpperCase()} ({campaign.mangMaTaiCho.length} Heo)
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {campaign.mangMaTaiCho.map((taiItem, taiIdx) => (
            <View key={`tai_box_${taiIdx}`} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#ffd3b6', backgroundColor: '#fffaf5', alignItems: 'center', justifyContent: 'center', minWidth: 105 }}>
              {/* Hiển thị Mã Tai heo */}
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#e65100' }}>{taiItem.maTaiHeo}</Text>
              
              {/* ✅ BỔ SUNG: Hiển thị số ngày thực tế dựa vào loại mốc của vắc-xin */}
              <Text style={{ fontSize: 9.5, color: '#0056b3', fontWeight: '600', marginTop: 2 }}>
                {campaign.loaiMocGoc.includes("SAU_PHOI") 
                  ? `Đã phối ${taiItem.soNgayThucTeCuaHeo} ngày` 
                  : `Đã đẻ ${taiItem.soNgayThucTeCuaHeo} ngày`
                }
              </Text>

              {/* Nhãn thời gian nhắc việc (Hôm nay hoặc Còn X ngày) */}
              <Text style={{ fontSize: 8.5, color: '#f57c00', fontWeight: '700', marginTop: 1 }}>{campaign.bieuTuong}</Text>
            </View>
          ))}
        </View>
      </View>
    ))}
  </View>
)}

  </View>
)}

{/* 📢 LUỒNG 2: TÁCH RIÊNG KHỐI ĐỊNH KỲ TỔNG ĐÀN (CHẠY ĐÚNG CHO CẢ 2 CHẾ ĐỘ XEM) */}
{Array.isArray(mangVacXinSauCung) && mangVacXinSauCung.filter(c => c.loaiMocGoc === "VACXIN_DINH_KY").length > 0 && (
  <View style={{ borderWidth: 1.2, borderColor: '#ffd3b6', borderRadius: 8, backgroundColor: '#ffffff', marginBottom: 16, overflow: 'hidden' }}>
    
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={bamDongMoKhoiVacxin} 
      style={{ backgroundColor: '#fff0e6', paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: hienQuyTrinhChiTietTab3 ? 0.5 : 0, borderBottomColor: '#ffd3b6' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ backgroundColor: '#e65100', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#ffffff' }}>📢</Text></View>
        <Text style={{ fontSize: 10, fontWeight: '800', color: '#e65100' }}>
          {(kieuXemThoiGianTask || "HOM_NAY") === "HOM_NAY" ? "LỊCH ĐỊNH KỲ TỔNG ĐÀN" : "CHUẨN BỊ THUỐC ĐỊNH KỲ (3 NGÀY TỚI)"}
        </Text>
      </View>
      <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 0.8, borderColor: '#ffd3b6', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: '900', color: '#e65100' }}>{mangVacXinSauCung.filter(c => c.loaiMocGoc === "VACXIN_DINH_KY").length} Loại Mũi</Text>
        <Text style={{ fontSize: 9, color: '#e65100', fontWeight: 'bold' }}>{hienQuyTrinhChiTietTab3 ? "▲ Thu gọn" : "▼ Xem"}</Text>
      </View>
    </TouchableOpacity>

    {/* KHAY TRƯỢT ĐÓNG MỞ DANH SÁCH THUỐC ĐỊNH KỲ */}
    {hienQuyTrinhChiTietTab3 && (
      <View style={{ padding: 10, backgroundColor: '#fdfdfd' }}>
        {mangVacXinSauCung.filter(c => c.loaiMocGoc === "VACXIN_DINH_KY").map((campaign, campaignIdx) => (
          <View key={`camp_dk_${campaignIdx}`} style={{ padding: 12, backgroundColor: '#fffaf5', borderRadius: 6, marginBottom: 6, borderWidth: 0.5, borderColor: '#ffd3b6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#e65100' }}>
                📢 MŨI: {campaign.tenNhiemVu.toUpperCase()}
              </Text>
              <Text style={{ fontSize: 11, color: '#f57c00', marginTop: 3, fontWeight: '600' }}>
                {(kieuXemThoiGianTask || "HOM_NAY") === "HOM_NAY" 
                  ? "Trạng thái: Hôm Nay"
                  : `Trạng thái: ${campaign.bieuTuong}.`
                }
              </Text>
            </View>
            <View style={{ backgroundColor: '#e65100', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 }}>
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>{campaign.mangMaTaiCho.length} Con</Text>
            </View>
          </View>
        ))}
      </View>
    )}
  </View>
)}

            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}


      {/* ⚙️ SUB-TAB 2: CẤU HÌNH QUY TRÌNH DỊCH TỄ VẮC-XIN CỦA TRẠI */}
      {subTab === "setup_schedule" && (
        <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 12, paddingBottom: 120 }}>
          
          <View style={{ borderWidth: 1, borderColor: '#ffd3b6', padding: 12, borderRadius: 8, backgroundColor: '#fffaf5', marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100', marginBottom: 12 }}>⚙️ THÊM MỚI QUY TRÌNH DỊCH TỄ</Text>
            
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#555555', marginBottom: 6 }}>Bước 1: Chọn nhóm quản lý vắc-xin:</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
              <TouchableOpacity onPress={() => setLoaiMocInput("SAU_PHOI")} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: loaiMocInput === "SAU_PHOI" ? '#007bff' : '#f2f2f2', alignItems: 'center', borderWidth: 0.5, borderColor: '#dee2e6' }}>
                <Text style={{ color: loaiMocInput === "SAU_PHOI" ? '#ffffff' : '#555555', fontSize: 11, fontWeight: 'bold' }}>Sau Phối</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLoaiMocInput("SAU_NGAY_DE")} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: loaiMocInput === "SAU_NGAY_DE" ? '#28a745' : '#f2f2f2', alignItems: 'center', borderWidth: 0.5, borderColor: '#dee2e6' }}>
                <Text style={{ color: loaiMocInput === "SAU_NGAY_DE" ? '#ffffff' : '#555555', fontSize: 11, fontWeight: 'bold' }}>Sau Ngày Đẻ</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLoaiMocInput("DINH_KY")} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: loaiMocInput === "DINH_KY" ? '#e65100' : '#f2f2f2', alignItems: 'center', borderWidth: 0.5, borderColor: '#dee2e6' }}>
                <Text style={{ color: loaiMocInput === "DINH_KY" ? '#ffffff' : '#555555', fontSize: 11, fontWeight: 'bold' }}>Định Kỳ Tổng Đàn</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#555555', marginBottom: 6 }}>Bước 2: Nhập thông tin chi tiết:</Text>
            
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Tên thuốc / Vắc-xin:</Text>
            <TextInput 
              style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, marginBottom: 10, color: '#111111' }} 
              value={inputName} 
              onChangeText={(txt) => { if (typeof setInputName === 'function') setInputName(txt); }} 
              placeholder="Ví dụ: Tai Xanh, Lở Mồm Long Móng, Suyễn..." 
              placeholderTextColor="#888888" 
            />

            {loaiMocInput === "DINH_KY" ? (
              <View style={{ backgroundColor: '#fff8f0', padding: 10, borderRadius: 6, borderWidth: 0.5, borderColor: '#ffe0b2', marginBottom: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#e65100', marginBottom: 8 }}>📢 CẤU HÌNH NHẮC LỊCH ĐỊNH KỲ TỔNG ĐÀN:</Text>
                
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Ngày tiêm cũ của trại (Bấm chọn):</Text>
                <TouchableOpacity 
  activeOpacity={0.7}
  onPress={() => {
    const { Keyboard } = require('react-native');
    Keyboard.dismiss(); // Thu bàn phím ảo chống đơ UI
    setIsLichDatePickerVisible(!isLichDatePickerVisible); // Kích hoạt biến độc lập lớp ngoài
  }}
  style={{ height: 42, borderWidth: 1, borderColor: '#ffd3b6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 12, marginBottom: 10, justifyContent: 'center' }}
>
  <Text style={{ color: ngayTiemTruocLocal ? '#111111' : '#888888', fontSize: 13 }}>
    {ngayTiemTruocLocal ? `📅 Ngày tiêm cũ: ${ngayTiemTruocLocal}` : "Mở bảng chọn ngày tiêm mũi cũ..."}
  </Text>
</TouchableOpacity>


                
{/* ✅ ĐÃ SỬA: Khay lịch hiển thị độc lập cho Form Thêm Mới, không bị cắn nhau với Pop-up sửa */}
{isLichDatePickerVisible && (
  <View style={{ borderWidth: 1, borderColor: '#ffd3b6', borderRadius: 8, backgroundColor: '#ffffff', padding: 4, marginBottom: 10, overflow: 'hidden' }}>
    <DateTimePickerModal
      isVisible={isLichDatePickerVisible} // Đọc từ biến độc lập lớp ngoài
      mode="date"
      display="inline" 
      onConfirm={(date) => {
        setIsLichDatePickerVisible(false); // Ẩn ngay khay lịch để không bị kẹt cảm ứng vuốt
        if (date) {
          const dd = String(date.getDate()).padStart(2, '0');
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const yyyy = date.getFullYear();
          
          setTimeout(() => {
            setNgayTiemTruocLocal(`${dd}/${mm}/${yyyy}`);
          }, 80);
        }
      }}
      onCancel={() => setIsLichDatePickerVisible(false)}
      locale="vi"
      confirmTextConfirm="Xác nhận"
      cancelText="Hủy"
    />
  </View>
)}


                <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Khoảng cách chu kỳ nhắc lại (Số ngày):</Text>
                <TextInput style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, color: '#111111' }} value={inputDays} onChangeText={(txt) => setInputDays(txt.replace(/[^0-9]/g, ''))} placeholder="Ví dụ: 90 ngày (3 tháng)" keyboardType="number-pad" placeholderTextColor="#888888" />
              </View>
            ) : (
              <View style={{ backgroundColor: '#f0f4f8', padding: 10, borderRadius: 6, borderWidth: 0.5, borderColor: '#d0e1fd', marginBottom: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#0056b3', marginBottom: 8 }}>{loaiMocInput === "SAU_NGAY_DE" ? "🍼 CẤU HÌNH THEO NGÀY ĐẺ:" : "🤰 CẤU HÌNH THEO NGÀY PHỐI:"}</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Sau mốc bao nhiêu ngày thì tiêm:</Text>
                <TextInput style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, color: '#111111' }} value={inputDays} onChangeText={(txt) => setInputDays(txt.replace(/[^0-9]/g, ''))} placeholder="Ví dụ: 14 ngày, 60 ngày..." keyboardType="number-pad" placeholderTextColor="#888888" />
              </View>
            )}
            
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Ghi chú liều lượng (Không bắt buộc):</Text>
            <TextInput style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, marginBottom: 14, color: '#111111' }} value={ghiChuVacXinInput} onChangeText={setGhiChuVacXinInput} placeholder="Ví dụ: Tiêm bắp 2ml..." placeholderTextColor="#888888" />

            <TouchableOpacity 
              style={{ backgroundColor: editingConfigId ? '#e65100' : '#28a745', paddingVertical: 11, borderRadius: 6, alignItems: 'center' }}
              onPress={() => {
                if (!inputDays.trim() || !inputName.trim()) return Alert.alert("Thông báo", "Vui lòng điền đầy đủ số ngày và tên thuốc!");
                const chuoiGopMoc = `VACXIN_${loaiMocInput || "SAU_PHOI"}`;
                const ngayTiemTruocLuu = loaiMocInput === "DINH_KY" ? ngayTiemTruocLocal : "";
                const idCauHinhHienTai = editingConfigId || `VC_${Date.now()}`;
                
                if (editingConfigId) {
                  setDanhSachCauHinhVacXin(prev => prev.map(i => i.id === editingConfigId ? { ...i, loaiHanhDong: chuoiGopMoc, soNgay: Number(inputDays), tenNhiemVu: inputName.trim(), ghiChu: (ghiChuVacXinInput || "").trim(), ngayTiemTruoc: ngayTiemTruocLuu } : i));
                  setEditingConfigId(null);
                } else {
                  setDanhSachCauHinhVacXin(prev => [...prev, { id: idCauHinhHienTai, loaiHanhDong: chuoiGopMoc, soNgay: Number(inputDays), tenNhiemVu: inputName.trim(), ghiChu: (ghiChuVacXinInput || "").trim(), ngayTiemTruoc: ngayTiemTruocLuu }]);
                }

                if (typeof xuLyMangCauHinhVacXin === 'function') {
                  xuLyMangCauHinhVacXin(editingConfigId ? "update_cauhinh" : "insert_cauhinh", {
                    id: idCauHinhHienTai,
                    loaiHanhDong: chuoiGopMoc,
                    soNgay: Number(inputDays),
                    tenNhiemVu: inputName.trim(),
                    ghiChu: (ghiChuVacXinInput || "").trim(),
                    ngayTiemTruoc: ngayTiemTruocLuu
                  });
                }

                setInputDays(""); if (typeof setInputName === 'function') setInputName(""); setGhiChuVacXinInput(""); setNgayTiemTruocLocal("");
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>{editingConfigId ? "💾 Cập Nhật Quy Trình" : "💾 Thêm Vào Danh Mục Quy Trình"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#111111', marginTop: 10, marginBottom: 14 }}>📋 QUY TRÌNH DỊCH TỄ ĐANG ÁP DỤNG TRONG TRẠI:</Text>
          
          {/* Nhóm phối */}
          <View style={{ marginBottom: 14, backgroundColor: '#fcfcfc', borderRadius: 8, borderWidth: 1, borderColor: '#d0e1fd', padding: 8 }}>
            <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#0056b3', marginBottom: 8 }}>🤰 Nhóm Vắc-xin Sau Phối (Nái Bầu)</Text>
            {Array.isArray(danhSachCauHinhVacXin) && danhSachCauHinhVacXin.filter(i => i.loaiHanhDong?.includes("SAU_PHOI") || !i.loaiHanhDong).length === 0 ? (
              <Text style={{ fontSize: 11, color: '#999999', fontStyle: 'italic', paddingLeft: 8 }}>Chưa cấu hình quy trình nào.</Text>
            ) : (
              danhSachCauHinhVacXin.filter(i => i.loaiHanhDong?.includes("SAU_PHOI") || !i.loaiHanhDong).map((item, idx) => (
                <View key={`vp_${item.id || idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#ffffff', borderRadius: 6, marginBottom: 6, borderWidth: 0.5, borderColor: '#dee2e6' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#111111' }}>• {item.tenNhiemVu?.toString().toUpperCase()}</Text>
                    <Text style={{ fontSize: 11, color: '#666666', marginTop: 2 }}>Thời điểm tiêm: Sau phối {item.soNgay} ngày {item.ghiChu ? `(${item.ghiChu})` : ''}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
<TouchableOpacity 
  onPress={() => { 
    setEditingConfigId(item.id); 
    setInputDays(item.soNgay?.toString() || ""); 
    if (typeof setInputName === 'function') setInputName(item.tenNhiemVu || ""); 
    setGhiChuVacXinInput(item.ghiChu || ""); 
    setLoaiMocInput("SAU_PHOI"); 
    setNgayTiemTruocLocal(""); 
    setIsEditModalVisible(true); // Mở popup
  }} 
  style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f1f3f9', borderRadius: 4 }}
>
  <Text style={{ fontSize: 10.5, fontWeight: 'bold' }}>Sửa</Text>
</TouchableOpacity>
                    <TouchableOpacity onPress={() => { setDanhSachCauHinhVacXin(prev => prev.filter(i => i.id !== item.id)); if (typeof xuLyMangCauHinhVacXin === 'function') xuLyMangCauHinhVacXin("delete_cauhinh", { id: item.id }); }} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fdf2f2', borderRadius: 4 }}><Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#dc3545' }}>Xóa</Text></TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Nhóm đẻ */}
          <View style={{ marginBottom: 14, backgroundColor: '#fcfcfc', borderRadius: 8, borderWidth: 1, borderColor: '#b1dfbb', padding: 8 }}>
            <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#1e7e34', marginBottom: 8 }}>🍼 Nhóm Vắc-xin Sau Ngày Đẻ</Text>
            {Array.isArray(danhSachCauHinhVacXin) && danhSachCauHinhVacXin.filter(i => i.loaiHanhDong?.includes("DE")).length === 0 ? (
              <Text style={{ fontSize: 11, color: '#999999', fontStyle: 'italic', paddingLeft: 8 }}>Chưa cấu hình quy trình nào.</Text>
            ) : (
              danhSachCauHinhVacXin.filter(i => i.loaiHanhDong?.includes("DE")).map((item, idx) => (
                <View key={`vd_${item.id || idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#ffffff', borderRadius: 6, marginBottom: 6, borderWidth: 0.5, borderColor: '#dee2e6' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#111111' }}>• {item.tenNhiemVu?.toString().toUpperCase()}</Text>
                    <Text style={{ fontSize: 11, color: '#666666', marginTop: 2 }}>Thời điểm tiêm: Sau đẻ {item.soNgay} ngày {item.ghiChu ? `(${item.ghiChu})` : ''}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
<TouchableOpacity 
  onPress={() => { 
    setEditingConfigId(item.id); 
    setInputDays(item.soNgay?.toString() || ""); 
    if (typeof setInputName === 'function') setInputName(item.tenNhiemVu || ""); 
    setGhiChuVacXinInput(item.ghiChu || ""); 
    setLoaiMocInput("SAU_NGAY_DE"); 
    setNgayTiemTruocLocal(""); 
    setIsEditModalVisible(true); // Mở popup
  }} 
  style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f1f3f9', borderRadius: 4 }}
>
  <Text style={{ fontSize: 10.5, fontWeight: 'bold' }}>Sửa</Text>
</TouchableOpacity>
                    <TouchableOpacity onPress={() => { setDanhSachCauHinhVacXin(prev => prev.filter(i => i.id !== item.id)); if (typeof xuLyMangCauHinhVacXin === 'function') xuLyMangCauHinhVacXin("delete_cauhinh", { id: item.id }); }} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fdf2f2', borderRadius: 4 }}><Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#dc3545' }}>Xóa</Text></TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Nhóm định kỳ tổng đàn */}
          <View style={{ marginBottom: 14, backgroundColor: '#fcfcfc', borderRadius: 8, borderWidth: 1, borderColor: '#ffd3b6', padding: 8 }}>
            <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#e65100', marginBottom: 8 }}>📢 Nhóm Định Kỳ Toàn Trại (Tổng Đàn)</Text>
            {Array.isArray(danhSachCauHinhVacXin) && danhSachCauHinhVacXin.filter(i => i.loaiHanhDong?.includes("DINH_KY")).length === 0 ? (
              <Text style={{ fontSize: 11, color: '#999999', fontStyle: 'italic', paddingLeft: 8 }}>Chưa cấu hình quy trình nào.</Text>
            ) : (
              danhSachCauHinhVacXin.filter(i => i.loaiHanhDong?.includes("DINH_KY")).map((item, idx) => (
                <View key={`vdk_${item.id || idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#ffffff', borderRadius: 6, marginBottom: 6, borderWidth: 0.5, borderColor: '#dee2e6' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#111111' }}>• {item.tenNhiemVu?.toString().toUpperCase()}</Text>
                    <Text style={{ fontSize: 11, color: '#e65100', fontWeight: 'bold', marginTop: 2 }}>Chu kỳ tiêm nhắc lại: {item.soNgay} ngày</Text>
                    {item.ngayTiemTruoc ? (
                      <Text style={{ fontSize: 10.5, color: '#28a745', fontWeight: '600' }}>📅 Ngày tiêm cũ: {item.ngayTiemTruoc}</Text>
                    ) : (
                      <Text style={{ fontSize: 10.5, color: '#888888', fontStyle: 'italic' }}>🔄 Chu kỳ cuốn chiếu tự động</Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
<TouchableOpacity 
  onPress={() => { 
    setEditingConfigId(item.id); 
    setInputDays(item.soNgay?.toString() || ""); 
    if (typeof setInputName === 'function') setInputName(item.tenNhiemVu || ""); 
    setGhiChuVacXinInput(item.ghiChu || ""); 
    setLoaiMocInput("DINH_KY"); 
    
    // ✅ ĐÃ SỬA: Ép bộ nhớ tạm nạp đúng ngày gốc của dòng đang sửa, không bốc bừa ngày của Form thêm mới
    setNgayTiemTruocLocal(item.ngayTiemTruoc || ""); 
    
    setIsEditModalVisible(true); // Mở popup sửa
  }} 
  style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f1f3f9', borderRadius: 4 }}
>
  <Text style={{ fontSize: 10.5, fontWeight: 'bold' }}>Sửa</Text>
</TouchableOpacity>
                    <TouchableOpacity onPress={() => { setDanhSachCauHinhVacXin(prev => prev.filter(i => i.id !== item.id)); if (typeof xuLyMangCauHinhVacXin === 'function') xuLyMangCauHinhVacXin("delete_cauhinh", { id: item.id }); }} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fdf2f2', borderRadius: 4 }}><Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#dc3545' }}>Xóa</Text></TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

        </ScrollView>
      )}

      {/* 📜 SUB-TAB 3: LỊCH SỬ NHẬT KÝ TIÊM THUỐC DỊCH TỄ */}
    {/* 📓 SUB-TAB 3: GIAO DIỆN SỔ TAY CÁ NHÂN MỚI */}
      {subTab === "inject_history" && (
        <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 12, paddingBottom: 120 }}>
          
                  {/* BLOCK 1: NÚT BẤM ĐÓNG MỞ VÀ FORM THÊM GHI CHÚ MỚI */}
          <View style={{ marginBottom: 16 }}>
            
            {/* 💡 NÚT BẤM ĐIỀU KHIỂN SẬP XÒE (Tận dụng state hienLichTrongModal có sẵn để gác cổng ẩn hiện Form cho gọn) */}
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => setHienLichTrongModal(!hienLichTrongModal)} 
              style={{ 
                backgroundColor: '#fff0e6', 
                paddingVertical: 12, 
                paddingHorizontal: 12, 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                borderWidth: 1,
                borderColor: '#ffd3b6',
                borderRadius: 8
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14 }}>✍️</Text>
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#e65100' }}>VIẾT GHI CHÚ SỔ TAY MỚI</Text>
              </View>
              <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 0.8, borderColor: '#ffd3b6' }}>
                <Text style={{ fontSize: 10, color: '#e65100', fontWeight: 'bold' }}>
                  {hienLichTrongModal ? "▲ Đóng lại" : "▼ Mở để nhập"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 💡 DIỄN BIẾN CHÍNH: CHỈ HIỆN KHỐI NHẬP LIỆU KHI KHÁCH BẤM MỞ */}
            {hienLichTrongModal && (
              <View style={{ 
                borderWidth: 1, 
                borderColor: '#ffd3b6', 
                padding: 12, 
                borderRadius: 8, 
                backgroundColor: '#fffaf5', 
                marginTop: 6,
                // Tạo hiệu ứng đổ bóng nhẹ cho khối nhập liệu thêm đẹp mắt
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2
              }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Tiêu đề ghi chú:</Text>
                <TextInput 
                  style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, marginBottom: 10, color: '#111111' }} 
                  value={inputName} 
                  onChangeText={(txt) => { if (typeof setInputName === 'function') setInputName(txt); }} 
                  placeholder="Nhập tiêu đề công việc, nhắc nhở..." 
                  placeholderTextColor="#888888" 
                />

                <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Nội dung:</Text>
                <TextInput 
                  style={{ height: 60, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, marginBottom: 10, color: '#111111', textAlignVertical: 'top', paddingTop: 8 }} 
                  value={ghiChuVacXinInput} 
                  onChangeText={setGhiChuVacXinInput} 
                  multiline={true}
                  placeholder="Nội dung muốn ghi chú lại..." 
                  placeholderTextColor="#888888" 
                />

                <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Phân loại (Nếu có)</Text>
                <TextInput 
                  style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, marginBottom: 14, color: '#111111' }} 
                  value={inputDays} 
                  onChangeText={setInputDays} 
                  placeholder="Chăm Sóc, Cám, Thuốc, Khác..." 
                  placeholderTextColor="#888888" 
                />

                <TouchableOpacity 
                  style={{ backgroundColor: '#28a745', paddingVertical: 11, borderRadius: 6, alignItems: 'center' }}
                  onPress={() => {
                    if (!inputName.trim() || !ghiChuVacXinInput.trim()) return Alert.alert("Thông báo", "Vui lòng điền tiêu đề và nội dung!");
                    
                    if (typeof xuLyMangCauHinhVacXin === 'function') {
                      const ngayHienTai = new Date().toLocaleDateString('vi-VN');
                      xuLyMangCauHinhVacXin("insert_sotay", {
                        id: `ST_${Date.now()}`,
                        userEmail: userEmail,
                        ngayTao: ngayHienTai,
                        tieuDe: inputName.trim(),
                        noiDung: ghiChuVacXinInput.trim(),
                        danhMuc: inputDays.trim() || "Chung",
                        trangThai: "Mới"
                      });
                      Alert.alert("Thành công", "Đã gửi yêu cầu thêm ghi chú lên hệ thống!");
                    }
                    
                    // Xóa trắng form sau khi thêm và tự động đóng sập khung nhập lại cho gọn gàng
                    setInputName(""); setGhiChuVacXinInput(""); setInputDays("");
                    setHienLichTrongModal(false);
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>💾 Lưu Vào Sổ Tay Cá Nhân</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>


        {/* Block 2: KHO HIỂN THỊ DANH SÁCH SỔ TAY */}
<Text style={{ fontSize: 13, fontWeight: '800', color: '#111111', marginTop: 10, marginBottom: 14 }}>📋 DANH SÁCH GHI CHÚ TRONG SỔ TAY:</Text>

{/* 💡 Đã đổi sang lọc và quét theo mảng sổ tay độc lập */}
{Array.isArray(danhSachSoTay) && danhSachSoTay.length === 0 ? (
  <Text style={{ fontSize: 11, color: '#999999', fontStyle: 'italic', paddingLeft: 8 }}>Chưa có bản ghi chép nào trong sổ tay.</Text>
) : (
  danhSachSoTay.map((item, idx) => ( 
    <View key={`st_${item.id || idx}`} style={{ padding: 12, backgroundColor: '#ffffff', borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#111111' }}>📌 {item.tieuDe || "Không tiêu đề"}</Text>
        <View style={{ backgroundColor: '#fff0e6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
          <Text style={{ fontSize: 10, color: '#e65100', fontWeight: 'bold' }}>{item.danhMuc || "Chung"}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 12, color: '#444444', marginBottom: 8 }}>{item.noiDung || ""}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#f1f2f6', paddingTop: 6 }}>
        <Text style={{ fontSize: 10, color: '#888888' }}>📅 Ngày tạo: {item.ngayTao || "---"}</Text>
        <TouchableOpacity 
          onPress={() => {
            if (typeof xuLyMangCauHinhVacXin === 'function') {
              xuLyMangCauHinhVacXin("delete_sotay", { id: item.id });
            }
          }} 
          style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fdf2f2', borderRadius: 4 }}
        >
          <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#dc3545' }}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  ))
)}
        </ScrollView>
      )}
       <Modal
        animationType="fade"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => {
          setIsEditModalVisible(false);
          setEditingConfigId(null);
          setHienLichTrongModal(false);
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center' }}
        >
          {/* 🌟 CHỐT CHẶN: ÉP SCROLLVIEW KHỞI TẠO LẠI LAYOUT KHI THAY ĐỔI NGÀY HOẶC ID ĐỂ KHÔNG BỊ KHÓA VUỐT */}
          <ScrollView 
  key={`scroll_popup_${ngayTiemTruocLocal}_${editingConfigId}`} // 🌟 CHÈN DUY NHẤT DÒNG NÀY VÀO ĐÂY
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ width: '100%', backgroundColor: '#ffffff', borderRadius: 12, padding: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 }}>
              
              {/* Tiêu đề Pop-up */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f2f6', paddingBottom: 10, marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#e65100' }}>
                  ✏️ CẬP NHẬT QUY TRÌNH: {loaiMocInput === "SAU_PHOI" ? "SAU PHỐI" : loaiMocInput === "SAU_NGAY_DE" ? "SAU NGÀY ĐẺ" : "ĐỊNH KỲ TỔNG ĐÀN"}
                </Text>
                <TouchableOpacity onPress={() => { setIsEditModalVisible(false); setEditingConfigId(null); setInputDays(""); if (typeof setInputName === 'function') setInputName(""); setGhiChuVacXinInput(""); setHienLichTrongModal(false); }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#999999', paddingHorizontal: 6 }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Ô nhập liệu Tên thuốc chung */}
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Tên thuốc / Vắc-xin:</Text>
              <TextInput 
                style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, marginBottom: 10, color: '#111111' }} 
                value={inputName} 
                onChangeText={(txt) => { if (typeof setInputName === 'function') setInputName(txt); }} 
                placeholderTextColor="#888888" 
              />

              {/* 🌟 GỌI LẠI HÀM RENDERING NỘI DUNG CÔ LẬP TỪ PHẦN 1 */}
              {renderKhoiNhapLieuCoLapTheoNhom()}

              {/* Ô nhập liệu Ghi chú chung */}
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Ghi chú liều lượng (Không bắt buộc):</Text>
              <TextInput style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, marginBottom: 16, color: '#111111' }} value={ghiChuVacXinInput} onChangeText={setGhiChuVacXinInput} placeholderTextColor="#888888" />

              {/* Thanh nút bấm hành động */}
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
               <TouchableOpacity 
  style={{ backgroundColor: '#7f8c8d', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 }}
  onPress={() => { 
    setIsEditModalVisible(false); 
    setEditingConfigId(null); 
    setInputDays(""); 
    if (typeof setInputName === 'function') setInputName(""); 
    setGhiChuVacXinInput(""); 
    setHienLichTrongModal(false); 
    
    // ✅ BỔ SUNG: Xóa trắng ngày tạm khi đóng hủy để tránh rác bộ nhớ RAM
    setNgayTiemTruocLocal(""); 
  }}
>
  <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>Hủy</Text>
</TouchableOpacity>
                <TouchableOpacity 
                  style={{ backgroundColor: '#e65100', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 }}
                  onPress={() => {
                    if (!inputDays.trim() || !inputName.trim()) return Alert.alert("Thông báo", "Vui lòng điền đầy đủ số ngày và tên thuốc!");
                    const chuoiGopMoc = `VACXIN_${loaiMocInput || "SAU_PHOI"}`;
                    const ngayTiemTruocLuu = loaiMocInput === "DINH_KY" ? ngayTiemTruocLocal : "";
                    
                    setDanhSachCauHinhVacXin(prev => prev.map(i => i.id === editingConfigId ? { ...i, loaiHanhDong: chuoiGopMoc, soNgay: Number(inputDays), tenNhiemVu: inputName.trim(), ghiChu: (ghiChuVacXinInput || "").trim(), ngayTiemTruoc: ngayTiemTruocLuu } : i));
                    
                    if (typeof xuLyMangCauHinhVacXin === 'function') {
                      xuLyMangCauHinhVacXin("update_cauhinh", {
                        id: editingConfigId,
                        loaiHanhDong: chuoiGopMoc,
                        soNgay: Number(inputDays),
                        tenNhiemVu: inputName.trim(),
                        ghiChu: (ghiChuVacXinInput || "").trim(),
                        ngayTiemTruoc: ngayTiemTruocLuu
                      });
                    }

                    setInputDays(""); if (typeof setInputName === 'function') setInputName(""); setGhiChuVacXinInput(""); setNgayTiemTruocLocal(""); setEditingConfigId(null);
                    setHienLichTrongModal(false);
                    setIsEditModalVisible(false);
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>💾 Cập Nhật</Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

export default TasksTab;
