import React, { useEffect, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert 
} from 'react-native';


// 🌟 CHÈN DÒNG NÀY ĐỂ SỬ DỤNG BẢNG CHỌN LỊCH TRỰC QUAN
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

  // Bộ nhớ tại chỗ quản lý riêng ô nhập ngày tiêm mũi trước để tránh lỗi mất chữ
  const [ngayTiemTruocLocal, setNgayTiemTruocLocal] = useState("");
  const [isLichDatePickerVisible, setIsLichDatePickerVisible] = useState(false);

  const moBangChonLich = () => { setIsLichDatePickerVisible(true); };
  const dongBangChonLich = () => { setIsLichDatePickerVisible(false); };

  const xacNhanChonNgayTuLich = (date) => {
    setIsLichDatePickerVisible(false);
    if (!date) return;
    
    // Định dạng ngày chọn từ lịch về chuỗi dd/mm/yyyy chuẩn của trại
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    setNgayTiemTruocLocal(`${dd}/${mm}/${yyyy}`);
  };

  // Tách độc lập các hàm điều hướng khỏi JSX để diệt tận gốc lỗi biên dịch Babel
  const bamChuyenSangViecHomNay = () => { if (typeof setKieuXemThoiGianTask === 'function') setKieuXemThoiGianTask("HOM_NAY"); };
  const bamChuyenSangLich5Ngay = () => { if (typeof setKieuXemThoiGianTask === 'function') setKieuXemThoiGianTask("5_NGAY"); };
  
  const bamMoSubTabViecHomNay = () => { setSubTab("today_tasks"); };
  const bamMoSubTabLichVacxin = () => { setSubTab("setup_schedule"); };
  const bamMoSubTabNhatKyTiem = () => { setSubTab("inject_history"); };

  const bamDongMoKhoiBatLoc = () => { setHienBatLocChiTietTab3(!hienBatLocChiTietTab3); };
  const bamDongMoKhoiSapDe = () => { setHienSapDeChiTietTab3(!hienSapDeChiTietTab3); };
  const bamDongMoKhoiCaiSua = () => { setHienCaiSuaChiTietTab3(!hienCaiSuaChiTietTab3); };
  const bamDongMoKhoiVacxin = () => { setHienQuyTrinhChiTietTab3(!hienQuyTrinhChiTietTab3); };

  // Tải dữ liệu an toàn một lần duy nhất khi chuyển sang tab tasks
  useEffect(() => {
    if (currentTab === 'tasks' && typeof layDanhSachNhiemVuHomNay === 'function') {
      layDanhSachNhiemVuHomNay();
    }
  }, [currentTab]);
   useEffect(() => {
    if (currentTab === 'tasks' && subTab === 'setup_schedule') {
      if (!loaiMocInput && typeof setLoaiMocInput === 'function') {
        // Tự động kích hoạt tô màu chọn mặc định cho nút Sau Phối khi vừa mở tab
        setLoaiMocInput("SAU_PHOI");
      }
    }
  }, [currentTab, subTab, loaiMocInput]);

  // Khối xử lý tính toán dữ liệu bằng useMemo giúp tối ưu hóa hiệu năng cực cao
  const { danhSachHeoLocCanhBao, mangVacXinSauCung } = useMemo(() => {
    if (currentTab !== 'tasks') return { danhSachHeoLocCanhBao: [], mangVacXinSauCung: [] };

    const mangLichSuGocTho = danhSachLichSu || [];
    const mangCauHinhVacXinGoc = danhSachCauHinhVacXin || [];
    const mangRamGocViec = global.danhSachCapNhatTrangThai || [];
    
    const ngayHomNayObj = new Date();
    ngayHomNayObj.setHours(0, 0, 0, 0);
    const timeMocHomNay = ngayHomNayObj.getTime();
    const cheDoXemHienTai = kieuXemThoiGianTask || "HOM_NAY";

    // 1. Tìm ngày phối mới nhất của từng mã tai
    const khoPhoiMoiNhat = {};
    if (Array.isArray(mangLichSuGocTho)) {
      mangLichSuGocTho.forEach(item => {
        if (!item || !item.suKien || !item.maTai || item.actionType === "delete" || item.syncStatus === "delete") return;
        const txtSkTho = item.suKien.toString().trim().toUpperCase();
        if (txtSkTho.includes("PHỐI") || txtSkTho.includes("PHOI") || txtSkTho.includes("GIỐNG")) {
          const maTaiKey = item.maTai.toString().trim().toUpperCase();
          const ngayObj = parseToDateObject(item.ngay);
          if (!ngayObj) return;
          if (!khoPhoiMoiNhat[maTaiKey] || ngayObj.getTime() > khoPhoiMoiNhat[maTaiKey].ngayObj.getTime()) {
            khoPhoiMoiNhat[maTaiKey] = { ngayObj, maTaiGoc: item.maTai };
          }
        }
      });
    }

    // 2. Tính toán danh sách heo cần theo dõi bắt lốc (từ 17 đến 22 ngày)
    const danhSachHeoLoc = [];
    Object.values(khoPhoiMoiNhat).forEach(ca => {
      const khoangCachNgayBau = Math.round((timeMocHomNay - ca.ngayObj.getTime()) / 86400000);
      if (khoangCachNgayBau >= 17 && khoangCachNgayBau <= 22) {
        danhSachHeoLoc.push({ maTai: ca.maTaiGoc, soNgay: khoangCachNgayBau });
      }
    });

    // 3. Tính toán lịch tiêm thuốc vắc xin (Sau phối, sau đẻ và định kỳ tổng đàn)
    const danhSachViecTrongNgayChuan = [];
          if (Array.isArray(mangRamGocViec) && mangRamGocViec.length > 0) {
            mangRamGocViec.forEach(dongHeo => {
              if (!dongHeo || dongHeo.vuaNhapMoi === true) return;

              const maTaiHeo = dongHeo.maTai ? dongHeo.maTai.toString().toUpperCase().trim() : "";
              const lichSuPhuViec = mangLichSuGocTho.filter(sk => sk && sk.maTai && sk.maTai.toString().toUpperCase().trim() === maTaiHeo && sk.actionType !== "delete");

              const caPhoiGanNhat = lichSuPhuViec.find(sk => {
                const txtS = (sk.suKien || "").toString().toUpperCase();
                return txtS.includes("PHỐI") || txtS.includes("PHOI");
              });

              const caDeGanNhat = lichSuPhuViec.find(sk => {
                const txtS = (sk.suKien || "").toString().toUpperCase();
                return txtS.includes("ĐẺ") || txtS.includes("DE");
              });

              mangCauHinhVacXinGoc.forEach(vx => {
                if (!vx || !vx.soNgay) return;
                
                const tenMuiChichChuan = vx.tenNhiemVu || vx.tenVacXin || "---";
                const mocNgayCauHinh = parseInt(vx.soNgay, 10);
                const oHanhDongTho = (vx.loaiHanhDong || vx.loaiMoc || "VACXIN_SAU_PHOI").toString().trim().toUpperCase();

                let laKhopNgayViec = false;
                let ngayConLaiMatTien = 0;
                let bienDemSoNgayCachBietRealTime = 0; // Số ngày thực tế của con heo tính từ mốc (Phối / Đẻ)

                if (oHanhDongTho.includes("SAU_PHOI") && caPhoiGanNhat) {
                  const ngayPhoiObj = parseToDateObject(caPhoiGanNhat.ngay);
                  if (ngayPhoiObj) {
                    bienDemSoNgayCachBietRealTime = Math.round((timeMocHomNay - ngayPhoiObj.getTime()) / 86400000);
                    ngayConLaiMatTien = mocNgayCauHinh - bienDemSoNgayCachBietRealTime;
                    if (cheDoXemHienTai === "HOM_NAY") {
                      if (bienDemSoNgayCachBietRealTime === mocNgayCauHinh) laKhopNgayViec = true;
                    } else {
                      if (bienDemSoNgayCachBietRealTime < mocNgayCauHinh && bienDemSoNgayCachBietRealTime + 5 >= mocNgayCauHinh) laKhopNgayViec = true;
                    }
                  }
                } 
                else if ((oHanhDongTho.includes("SAU_NGAY_DE") || oHanhDongTho.includes("SAU_DE")) && caDeGanNhat) {
                  const mocNgayDeSg = dongHeo.ngayDeDongThoiGianThuc || caDeGanNhat.ngay;
                  const ngayDeObj = parseToDateObject(mocNgayDeSg);
                  if (ngayDeObj) {
                    bienDemSoNgayCachBietRealTime = Math.round((timeMocHomNay - ngayDeObj.getTime()) / 86400000);
                    ngayConLaiMatTien = mocNgayCauHinh - bienDemSoNgayCachBietRealTime;
                    if (cheDoXemHienTai === "HOM_NAY") {
                      if (bienDemSoNgayCachBietRealTime === mocNgayCauHinh) laKhopNgayViec = true;
                    } else {
                      if (bienDemSoNgayCachBietRealTime < mocNgayCauHinh && bienDemSoNgayCachBietRealTime + 5 >= mocNgayCauHinh) laKhopNgayViec = true;
                    }
                  }
                }
                else if (oHanhDongTho.includes("DINH_KY")) {
                  const mocNgayGocTiem = vx.ngayTiemTruoc || dongHeo.ngayNhapChuong || dongHeo.ngayMua || "01/01/2026";
                  const ngayTiemGocObj = parseToDateObject(mocNgayGocTiem);
                  if (ngayTiemGocObj) {
                    const soNgayCachBiet = Math.round((timeMocHomNay - ngayTiemGocObj.getTime()) / 86400000);
                    
                    if (vx.ngayTiemTruoc) {
                      bienDemSoNgayCachBietRealTime = soNgayCachBiet;
                      ngayConLaiMatTien = mocNgayCauHinh - soNgayCachBiet;
                      if (cheDoXemHienTai === "HOM_NAY") {
                        if (soNgayCachBiet === mocNgayCauHinh) laKhopNgayViec = true;
                      } else {
                        if (soNgayCachBiet < mocNgayCauHinh && soNgayCachBiet + 5 >= mocNgayCauHinh) laKhopNgayViec = true;
                      }
                    } else {
                      const chuKyHienTai = soNgayCachBiet % mocNgayCauHinh;
                      bienDemSoNgayCachBietRealTime = chuKyHienTai;
                      ngayConLaiMatTien = mocNgayCauHinh - chuKyHienTai;
                      if (cheDoXemHienTai === "HOM_NAY") {
                        if (chuKyHienTai === 0) laKhopNgayViec = true;
                      } else {
                        if (chuKyHienTai >= mocNgayCauHinh - 5 && chuKyHienTai < mocNgayCauHinh) laKhopNgayViec = true;
                      }
                    }
                  }
                }

                if (laKhopNgayViec) {
                  const nhanHienThiChuoiText = cheDoXemHienTai === "HOM_NAY" ? `${tenMuiChichChuan} (${mocNgayCauHinh} ngày)` : `${tenMuiChichChuan} (Còn ${ngayConLaiMatTien} ngày)`;
                  danhSachViecTrongNgayChuan.push({
                    id: vx.id || Math.random().toString(),
                    cauhinhId: tenMuiChichChuan,
                    tenNhiemVu: nhanHienThiChuoiText,
                    maTai: maTaiHeo,
                    loai: oHanhDongTho,
                    soNgayGocThucTe: bienDemSoNgayCachBietRealTime // Găm mốc ngày sống của nái vào đây
                  });
                }
              });
            });
          }

          const khoNhomVacXin = {};
          danhSachViecTrongNgayChuan.forEach(task => {
            const kKey = task.cauhinhId.toString().trim();
            const bieuTuong = task.loai.includes("DINH_KY") ? "📢 [ĐỊNH KỲ]" : (task.loai.includes("DE") ? "🍼" : "🤰");
            if (!khoNhomVacXin[kKey]) {
              khoNhomVacXin[kKey] = { bieuTuong, cauhinhId: kKey, tenNhiemVu: kKey, loaiMocGoc: task.loai, mangMaTaiCho: [] };
            }
            
            // 🌟 ĐÃ VÁ CHÍ MẠNG: Đóng gói mã tai đi kèm Object ngày thực tế thay vì đẩy chuỗi chữ thô
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
          <Text style={{ color: subTab === "inject_history" ? '#ffffff' : '#7f8c8d', fontSize: 11.5, fontWeight: 'bold' }}>📜 Nhật Ký Tiêm</Text>
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
              onPress={bamChuyenSangLich5Ngay}
              style={{ flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: (kieuXemThoiGianTask || "HOM_NAY") === "5_NGAY" ? '#ffffff' : 'transparent', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: (kieuXemThoiGianTask || "HOM_NAY") === "5_NGAY" ? '#e65100' : '#555555' }}>⏳ Lịch 5 Ngày Tới</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111111', marginBottom: 10 }}>
            {(kieuXemThoiGianTask || "HOM_NAY") === "HOM_NAY" ? "Danh sách việc cần làm hôm nay" : "Lịch nhắc thuốc dự kiến trong 5 ngày tới"}
          </Text>
          {danhSachHeoLocCanhBao.length === 0 && mangVacXinSauCung.length === 0 && (!global.danhSachHeoSapDeCanhBao || global.danhSachHeoSapDeCanhBao.length === 0) && (!global.danhSachHeoCaiSuaCanhBao || global.danhSachHeoCaiSuaCanhBao.length === 0) ? (
            <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 24, marginBottom: 8 }}>✅</Text>
              <Text style={{ color: '#28a745', fontSize: 13, fontWeight: 'bold' }}>HÔM NAY HOÀN THÀNH XUẤT SẮC!</Text>
            </View>
          ) : (
            <View style={{ width: '100%' }}>
              {/* 🚨 KHỐI CẢNH BÁO BẮT LỐC (Từ 17 đến 22 ngày) */}
              {danhSachHeoLocCanhBao.length > 0 && (
                <View style={{ borderWidth: 1.2, borderColor: '#f5c6cb', borderRadius: 8, backgroundColor: '#ffffff', marginBottom: 14, overflow: 'hidden' }}>
                  <TouchableOpacity activeOpacity={0.7} onPress={bamDongMoKhoiBatLoc} style={{ backgroundColor: '#fff5f5', paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: hienBatLocChiTietTab3 ? 0.5 : 0, borderBottomColor: '#f5c6cb' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ backgroundColor: '#dc3545', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#ffffff' }}>🚨</Text></View>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#dc3545' }}>THEO DÕI BẮT LỐC (Từ 17 đến 22 ngày)</Text>
                    </View>
                    <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 0.8, borderColor: '#f5c6cb', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#dc3545' }}>{danhSachHeoLocCanhBao.length} Con</Text>
                      <Text style={{ fontSize: 8, color: '#dc3545' }}>{hienBatLocChiTietTab3 ? "▲" : "▼"}</Text>
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
              {global.danhSachHeoSapDeCanhBao && global.danhSachHeoSapDeCanhBao.length > 0 && (
                <View style={{ borderWidth: 1.2, borderColor: '#ffeeba', borderRadius: 8, backgroundColor: '#ffffff', marginBottom: 16, overflow: 'hidden' }}>
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
              {/* 🍼 KHỐI CẢNH BÁO THEO DÕI CAI SỮA (Từ 20 ngày trở lên) */}
              {global.danhSachHeoCaiSuaCanhBao && global.danhSachHeoCaiSuaCanhBao.length > 0 && (
                <View style={{ borderWidth: 1.2, borderColor: '#b1dfbb', borderRadius: 8, backgroundColor: '#ffffff', marginBottom: 16, overflow: 'hidden' }}>
                  <TouchableOpacity activeOpacity={0.7} onPress={bamDongMoKhoiCaiSua} style={{ backgroundColor: '#e8f5e9', paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: hienCaiSuaChiTietTab3 ? 0.5 : 0, borderBottomColor: '#b1dfbb' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ backgroundColor: '#28a745', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#ffffff' }}>🍼</Text></View>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#1e7e34' }}>THEO DÕI CAI SỮA (Từ 20 ngày)</Text>
                    </View>
                    <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 0.8, borderColor: '#b1dfbb', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#28a745' }}>{global.danhSachHeoCaiSuaCanhBao.length} Con</Text>
                      <Text style={{ fontSize: 8, color: '#28a745' }}>{hienCaiSuaChiTietTab3 ? "▲" : "▼"}</Text>
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

              {/* 💉 KHỐI DANH SÁCH NHẮC LỊCH TIÊM THUỐC / VẮC-XIN (ĐÃ VÁ CHUẨN HIỂN THỊ SỐ NGÀY THỰC TẾ CỦA HEO) */}
              {Array.isArray(mangVacXinSauCung) && mangVacXinSauCung.length > 0 && (
                <View style={{ borderWidth: 1.2, borderColor: '#ffd3b6', borderRadius: 8, backgroundColor: '#ffffff', marginBottom: 16, overflow: 'hidden' }}>
                  <TouchableOpacity activeOpacity={0.7} onPress={bamDongMoKhoiVacxin} style={{ backgroundColor: '#fff0e6', paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: hienQuyTrinhChiTietTab3 ? 0.5 : 0, borderBottomColor: '#ffd3b6' }}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ backgroundColor: '#e65100', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#ffffff' }}>🔧</Text></View>
                      
                      {/* 🌟 BẢN VÁ TỐI CAO: Tự động lật chữ tiêu đề theo nút bấm "Hôm nay" hoặc "5 ngày tới" của bạn */}
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#e65100' }}>
                        {(kieuXemThoiGianTask || "HOM_NAY") === "HOM_NAY" 
                          ? "THUỐC / VẮC-XIN HÔM NAY" 
                          : "CHUẨN BỊ THUỐC / VẮC-XIN 5 NGÀY TỚI"}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 0.8, borderColor: '#ffd3b6', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#e65100' }}>{mangVacXinSauCung.length} Mũi Nhắc</Text>
                      <Text style={{ fontSize: 8, color: '#e65100' }}>{hienQuyTrinhChiTietTab3 ? "▲" : "▼"}</Text>
                    </View>
                  </TouchableOpacity>

                  {hienQuyTrinhChiTietTab3 && (
                    <View style={{ padding: 10, backgroundColor: '#fdfdfd' }}>
                      {mangVacXinSauCung.map((campaign, cIdx) => (
                        <View key={`camp_vx_${cIdx}`} style={{ borderWidth: 1, borderColor: '#ffd3b6', borderRadius: 8, backgroundColor: '#ffffff', marginBottom: 12, overflow: 'hidden', padding: 10 }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#e65100', marginBottom: 6 }}>
                            {campaign.bieuTuong} MŨI: {campaign.tenNhiemVu.toString().toUpperCase()} ({campaign.mangMaTaiCho.length} Heo đến lịch)
                          </Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {campaign.mangMaTaiCho.map((taiItem, tIdx) => {
                              
                              // 🧭 THUẬT TOÁN BÓC TÁCH DỮ LIỆU ĐỐI TƯỢNG ĐA Ô
                              // Hỗ trợ đọc cả kiểu dữ liệu chuỗi cũ (taiItem thô) lẫn kiểu Object mới (taiItem.maTaiHeo) để tránh crash giao diện
                              const tenMaTaiThucTe = typeof taiItem === 'object' ? (taiItem.maTaiHeo || "---") : taiItem.toString();
                              const soNgayCuaHeo = typeof taiItem === 'object' ? (taiItem.soNgayThucTeCuaHeo || 0) : (campaign.soNgay || 0);

                              let nhanMocChuKy = "Định Kỳ";
                              const kieuMocVx = (campaign.loaiMocGoc || "").toString().toUpperCase();

                              if (kieuMocVx.includes("SAU_PHOI") || kieuMocVx.includes("PHOI")) {
                                nhanMocChuKy = `Đang Bầu: ${soNgayCuaHeo} ngày`;
                              } else if (kieuMocVx.includes("DE") || kieuMocVx.includes("SAU_NGAY_DE")) {
                                nhanMocChuKy = `Đã Đẻ: ${soNgayCuaHeo} ngày`;
                              } else if (kieuMocVx.includes("DINH_KY")) {
                                nhanMocChuKy = `Chu kỳ chu kỳ: ${soNgayCuaHeo} ngày`;
                              }

                              return (
                                <View key={`tai_box_vx_${tIdx}`} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#ffd3b6', backgroundColor: '#fffaf5', alignItems: 'center', justifyContent: 'center', minWidth: 105 }}>
                                  {/* Hiển thị Mã Tai Heo chính xác ở hàng trên */}
                                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#e65100' }}>{tenMaTaiThucTe}</Text>
                                  
                                  {/* 🌟 HIỂN THỊ CHUẨN ĐÉT: Số ngày thực tế tính toán của riêng con heo đó */}
                                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#f57c00', marginTop: 3 }}>
                                    {nhanMocChuKy}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              
              )}
            </View>
          )}
        </ScrollView>
      )}
           {/* ⚙️ SUB-TAB 2: CẤU HÌNH QUY TRÌNH DỊCH TỄ VẮC-XIN CỦA TRẠI */}
      {subTab === "setup_schedule" && (
        <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 12, paddingBottom: 120 }} showsVerticalScrollIndicator={true}>
          
          <View style={{ borderWidth: 1, borderColor: '#ffd3b6', padding: 12, borderRadius: 8, backgroundColor: '#fffaf5', marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100', marginBottom: 12 }}>⚙️ THÊM MỚI QUY TRÌNH DỊCH TỄ</Text>
            
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#555555', marginBottom: 6 }}>Bước 1: Chọn nhóm quản lý vắc-xin:</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
              <TouchableOpacity onPress={() => setLoaiMocInput("SAU_PHOI")} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: (loaiMocInput === "SAU_PHOI" || !loaiMocInput) ? '#007bff' : '#f2f2f2', alignItems: 'center', borderWidth: 0.5, borderColor: '#dee2e6' }}>
                <Text style={{ color: (loaiMocInput === "SAU_PHOI" || !loaiMocInput) ? '#ffffff' : '#555555', fontSize: 11, fontWeight: 'bold' }}>Sau Phối</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLoaiMocInput("SAU_NGAY_DE")} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: loaiMocInput === "SAU_NGAY_DE" ? '#28a745' : '#f2f2f2', alignItems: 'center', borderWidth: 0.5, borderColor: '#dee2e6' }}>
                <Text style={{ color: loaiMocInput === "SAU_NGAY_DE" ? '#ffffff' : '#555555', fontSize: 11, fontWeight: 'bold' }}>Sau Ngày Đẻ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                disabled={true} // <-- KHÓA CỨNG: Chặn đứng mọi hành vi bấm click chuột
                style={{ 
                  flex: 1, 
                  paddingVertical: 8, 
                  borderRadius: 8, 
                  backgroundColor: '#eef2f5', // Đổi sang màu xám nhạt bảo trì chuyên nghiệp
                  alignItems: 'center', 
                  borderWidth: 0.5, 
                  borderColor: '#ced4da',
                  opacity: 0.65 // Làm mờ nút đi 35% để báo hiệu tính năng đang bị đóng băng
                }}
              >
                <Text style={{ color: '#6c757d', fontSize: 11, fontWeight: 'bold' }}>
                  📢 Định Kỳ Tổng Đàn ( Đang Hoàn Thiện )
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#555555', marginBottom: 6 }}>Bước 2: Nhập thông tin chi tiết:</Text>
            
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Tên thuốc / Vắc-xin:</Text>
            <TextInput 
              style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, marginBottom: 10, color: '#111111' }} 
              value={inputName} 
              onChangeText={(txt) => { if (typeof setInputName === 'function') setInputName(txt); }} 
              placeholder="Ví dụ: Tai Xanh, Lở Mồm Long Móng, Ecoli..." 
              placeholderTextColor="#888888" 
            />

          {loaiMocInput === "DINH_KY" ? (
              <View style={{ backgroundColor: '#fff8f0', padding: 10, borderRadius: 6, borderWidth: 0.5, borderColor: '#ffe0b2', marginBottom: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#e65100', marginBottom: 8 }}>💡 CẤU HÌNH NHẮC LỊCH ĐỊNH KỲ THỜI GIAN THỰC:</Text>
                
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Ngày tiêm mũi trước (Nhấn vào để chọn lịch):</Text>
                
                {/* Nút bấm kích hoạt mở bảng lịch */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={moBangChonLich}
                  style={{ height: 42, borderWidth: 1, borderColor: '#ffd3b6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 12, marginBottom: 10, justifyContent: 'center' }}
                >
                  <Text style={{ color: ngayTiemTruocLocal ? '#111111' : '#888888', fontSize: 14 }}>
                    {ngayTiemTruocLocal ? `📅 ${ngayTiemTruocLocal}` : "Bấm vào đây để mở bảng lịch chọn ngày..."}
                  </Text>
                </TouchableOpacity>

                {/* 🎯 ĐÃ VÁ: Cấu hình display="inline" để ép hiển thị bảng lịch ô vuông vạn niên giống hệt tab nhập liệu */}
                <DateTimePickerModal
                  isVisible={isLichDatePickerVisible}
                  mode="date"
                  display="inline" 
                  onConfirm={xacNhanChonNgayTuLich}
                  onCancel={dongBangChonLich}
                  locale="vi"
                  confirmTextConfirm="Xác nhận"
                  cancelText="Hủy"
                />

                <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Khoảng cách chu kỳ nhắc lại (Số ngày):</Text>
                <TextInput style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, color: '#111111' }} value={inputDays} onChangeText={(txt) => setInputDays(txt.replace(/[^0-9]/g, ''))} placeholder="Ví dụ: 90 ngày (3 tháng)" keyboardType="number-pad" placeholderTextColor="#888888" />
              </View>
            ) : (
              <View style={{ backgroundColor: '#f0f4f8', padding: 10, borderRadius: 6, borderWidth: 0.5, borderColor: '#d0e1fd', marginBottom: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#0056b3', marginBottom: 8 }}>{loaiMocInput === "SAU_NGAY_DE" ? "🍼 CẤU HÌNH THEO NGÀY ĐẺ:" : "🤰 CẤU HÌNH THEO NGÀY PHỐI:"}</Text>
                
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Sau mốc {loaiMocInput === "SAU_NGAY_DE" ? "Đẻ" : "Phối"} bao nhiêu ngày thì tiêm:</Text>
                <TextInput style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, color: '#111111' }} value={inputDays} onChangeText={(txt) => setInputDays(txt.replace(/[^0-9]/g, ''))} placeholder="Ví dụ: 14 ngày, 60 ngày..." keyboardType="number-pad" placeholderTextColor="#888888" />
              </View>
            )}
            
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Ghi chú liều lượng & vị trí tiêm (Không bắt buộc):</Text>
            <TextInput style={{ height: 40, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, marginBottom: 14, color: '#111111' }} value={ghiChuVacXinInput} onChangeText={setGhiChuVacXinInput} placeholder="Ví dụ: Tiêm bắp cơ cổ 2ml..." placeholderTextColor="#888888" />

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
          
          {/* 1. Nhóm phối */}
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
                    <TouchableOpacity onPress={() => { setEditingConfigId(item.id); setInputDays(item.soNgay?.toString() || ""); if (typeof setInputName === 'function') setInputName(item.tenNhiemVu || ""); setGhiChuVacXinInput(item.ghiChu || ""); setLoaiMocInput("SAU_PHOI"); setNgayTiemTruocLocal(""); }} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f1f3f9', borderRadius: 4 }}><Text style={{ fontSize: 10.5, fontWeight: 'bold' }}>Sửa</Text></TouchableOpacity>
                   <TouchableOpacity 
    onPress={() => {
      setDanhSachCauHinhVacXin(prev => prev.filter(i => i.id !== item.id));
      if (typeof xuLyMangCauHinhVacXin === 'function') {
        xuLyMangCauHinhVacXin("delete_cauhinh", { id: item.id });
      }
    }}
    // Thêm lại style gốc để nút có màu hồng nhạt, bo góc và khoảng đệm đẹp mắt
    style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fdf2f2', borderRadius: 4 }}
  >
    <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#dc3545' }}>Xóa</Text>
  </TouchableOpacity>
</View>
                </View>
              ))
            )}
          </View>

          {/* 2. Nhóm đẻ */}
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
                    <TouchableOpacity onPress={() => { setEditingConfigId(item.id); setInputDays(item.soNgay?.toString() || ""); if (typeof setInputName === 'function') setInputName(item.tenNhiemVu || ""); setGhiChuVacXinInput(item.ghiChu || ""); setLoaiMocInput("SAU_NGAY_DE"); setNgayTiemTruocLocal(""); }} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f1f3f9', borderRadius: 4 }}><Text style={{ fontSize: 10.5, fontWeight: 'bold' }}>Sửa</Text></TouchableOpacity>
<TouchableOpacity 
    onPress={() => {
      setDanhSachCauHinhVacXin(prev => prev.filter(i => i.id !== item.id));
      if (typeof xuLyMangCauHinhVacXin === 'function') {
        xuLyMangCauHinhVacXin("delete_cauhinh", { id: item.id });
      }
    }}
    // Thêm lại style gốc để nút có màu hồng nhạt, bo góc và khoảng đệm đẹp mắt
    style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fdf2f2', borderRadius: 4 }}
  >
    <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#dc3545' }}>Xóa</Text>
  </TouchableOpacity>
                    </View>
                </View>
              ))
            )}
          </View>

          {/* 3. Nhóm định kỳ tổng đàn (ĐÃ KHỬ TRÙNG KHỐI LẶP DƯ THỪA CHUẨN XỊN) */}
          <View style={{ marginBottom: 14, backgroundColor: '#fcfcfc', borderRadius: 8, borderWidth: 1, borderColor: '#ffd3b6', padding: 8 }}>
            <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#e65100', marginBottom: 8 }}>📢 Nhóm Định Kỳ Toàn Trại (Tổng Đàn)</Text>
            {Array.isArray(danhSachCauHinhVacXin) && danhSachCauHinhVacXin.filter(i => i.loaiHanhDong?.includes("DINH_KY")).length === 0 ? (
              <Text style={{ fontSize: 11, color: '#999999', fontStyle: 'italic', paddingLeft: 8 }}>Chưa cấu hình quy trình nào.</Text>
            ) : (
              danhSachCauHinhVacXin.filter(i => i.loaiHanhDong?.includes("DINH_KY")).map((item, idx) => {
                const layNgayDinhDangChuan = (chuoiNgay) => {
                  if (!chuoiNgay) return "";
                  try {
                    const str = chuoiNgay.toString().trim();
                    if (str.includes('-') && str.indexOf('-') === 4) {
                      const p = str.substring(0, 10).split('-');
                      return `${p[2]}/${p[1]}/${p[0]}`;
                    }
                    if (!str.includes('/') && !isNaN(Date.parse(str))) {
                      const dObj = new Date(str);
                      const d = String(dObj.getDate()).padStart(2, '0');
                      const m = String(dObj.getMonth() + 1).padStart(2, '0');
                      return `${d}/${m}/${dObj.getFullYear()}`;
                    }
                    return str.substring(0, 10);
                  } catch (e) { return chuoiNgay; }
                };

                const ngayHienThiGiaoDien = layNgayDinhDangChuan(item.ngayTiemTruoc);

                return (
                  <View key={`vdk_${item.id || idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#ffffff', borderRadius: 6, marginBottom: 6, borderWidth: 0.5, borderColor: '#dee2e6' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#111111' }}>• {item.tenNhiemVu?.toString().toUpperCase()}</Text>
                      <Text style={{ fontSize: 11, color: '#e65100', fontWeight: 'bold', marginTop: 2 }}>Chu kỳ tiêm nhắc lại: {item.soNgay} ngày</Text>
                      {item.ngayTiemTruoc ? (
                        <Text style={{ fontSize: 10.5, color: '#28a745', fontWeight: '600' }}>📅 Ngày tiêm mũi gần nhất: {ngayHienThiGiaoDien}</Text>
                      ) : (
                        <Text style={{ fontSize: 10.5, color: '#888888', fontStyle: 'italic' }}>⚠️ Chưa cập nhật ngày tiêm trước</Text>
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
                          setNgayTiemTruocLocal(ngayHienThiGiaoDien); 
                        }} 
                        style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f1f3f9', borderRadius: 4 }}
                      >
                        <Text style={{ fontSize: 10.5, fontWeight: 'bold' }}>Sửa</Text>
                      </TouchableOpacity>
<TouchableOpacity 
    onPress={() => {
      setDanhSachCauHinhVacXin(prev => prev.filter(i => i.id !== item.id));
      if (typeof xuLyMangCauHinhVacXin === 'function') {
        xuLyMangCauHinhVacXin("delete_cauhinh", { id: item.id });
      }
    }}
    // Thêm lại style gốc để nút có màu hồng nhạt, bo góc và khoảng đệm đẹp mắt
    style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fdf2f2', borderRadius: 4 }}
  >
    <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#dc3545' }}>Xóa</Text>
  </TouchableOpacity>
                      </View>
                  </View>
                );
              })
            )}
          </View>

        </ScrollView>
      )}

      {/* 📜 SUB-TAB 3: LỊCH SỬ NHẬT KÝ TIÊM THUỐC DỊCH TỄ */}
      {subTab === "inject_history" && (
        <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 12, paddingBottom: 120 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111111', marginBottom: 10 }}>📜 LỊCH SỬ TIÊM THUỐC DỊCH TỄ TOÀN TRẠI</Text>
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: '#888888', fontStyle: 'italic', textAlign: 'center' }}>Chế độ xem lịch sử tiêm phòng dịch tễ của toàn trang trại.</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default TasksTab;
