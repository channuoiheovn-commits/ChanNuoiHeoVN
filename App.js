import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, ScrollView, SafeAreaView,
  Appearance,
  // 🎯 BẢN VÁ TỐI CAO: Khai báo thêm 2 linh kiện gốc này để kích nổ tính năng hạ bàn phím toàn App
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'react-native';

import { auth } from './FirebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth'; 
import { 
  formatVNDate, 
  parseToDateObject, 
  formatStringtoVN, 
  tinhNgayDuKienDe, 
  laySoAnToan, 
  sinhIDDocBan 
} from './DateUtils';

import EditLogModal from './EditLogModal';       // Popup Chỉnh sửa dòng Nhật ký sự kiện (Tab 1)
import EditSowModal from './EditSowModal';       // Popup Chỉnh sửa lý lịch Heo Nái gốc (Tab 2)
import EditPigMeatModal from './EditPigMeatModal'; // Popup Chỉnh sửa ca biến động Heo Thịt (Tab 5)
import SowDetailModal from './SowDetailModal';     // Popup Xem chi tiết & Lịch sử lứa đẻ Heo Nái
import AddPigMeatModal from './AddPigMeatModal';   // Popup Khai báo hành động mới Heo Thịt (Nhập/Bán/Hao hụt)
import NotificationModals from './NotificationModals'; // File gộp 5 Cửa sổ cảnh báo quy trình & Thông báo thành công
import TasksTab from './TasksTab';                 // [Phân hệ Tab 3] Việc Cần Làm & Cấu hình lịch tiêm phòng vắc-xin
import PigMeatTab from './PigMeatTab';             // [Phân hệ Tab 5] Quản lý bàn cờ 7 giai đoạn tuổi Heo Thịt thương phẩm
import AgeDefinitionModal from './AgeDefinitionModal'; // Bảng tra cứu định nghĩa các mốc tuần tuổi Heo Thịt
import FarrowingTab from './FarrowingTab';         // [Phân hệ Tab 4] Danh sách Heo Đang Đẻ và Nuôi Con ngoài chuồng
import StatisticsTab from './StatisticsTab';       // [Phân hệ Tab 6] Báo cáo Thống Kê tổng hợp, đếm tuần thai & Dự kiến sản lượng cám
import DataEntryTab from './DataEntryTab';         // [Phân hệ Tab 1] Form Nhập Liệu nhật ký sinh sản hàng ngày cho trại
import SowRegistryTab from './SowRegistryTab';     // [Phân hệ Tab 2] Danh Bạ Sổ Mã Tai, chia nhóm chuồng (Chờ phối, Mang thai, Nuôi con, Thải loại)
import { FarmProvider, useSow, useTask, useMeat } from './FarmContext'; // 🎯 ĐẤU NỐI 3 KÊNH SÓNG PHÂN RÃ CHUYÊN BIỆT



function MainApp() {
const { 
    danhSachTrangThaiNai, setDanhSachTrangThaiNai,
    setDanhSachHeoLocCanhBao, setDanhSachHeoSapDeCanhBao, setDanhSachHeoCaiSuaCanhBao
  } = useSow();
  const { setDanhSachViecCanLamThuy } = useTask(); // Gọi trạm 2 (Lịch thú y)
 const [danhSachCauHinhVacXin, setDanhSachCauHinhVacXin] = useState([]);
  
    const [kieuXemThoiGianTask, setKieuXemThoiGianTask] = useState("HOM_NAY");
          // 🧠 BỘ NHỚ ĐỆM TỐI CAO: Giữ cứng khay việc thú y, chặn đứng hành vi tính toán lặp lại gây lag bàn phím
  const layDanhSachNhiemVuHomNay = React.useCallback(() => {
    const ketQuaGomNhom = [];
    if (!Array.isArray(danhSachLichSu)) return ketQuaGomNhom;

    const mangRamGocViec = global.danhSachCapNhatTrangThai || [];
    const ngayHomNayObj = new Date();
    ngayHomNayObj.setHours(0, 0, 0, 0);
    const timeMocHomNay = ngayHomNayObj.getTime();

    const cheDoXemHienTai = typeof kieuXemThoiGianTask !== 'undefined' ? kieuXemThoiGianTask : "HOM_NAY";

    global.danhSachHeoLocCanhBao = [];
    global.danhSachHeoSapDeCanhBao = [];

    if (danhSachLichSu.length > 0) {
      const khoPhoiMoiNhatCuaNai = {};
      const khoDeMoiNhatCuaNai = {};

      danhSachLichSu.forEach(item => {
        if (!item || !item.suKien || !item.maTai || item.actionType === "delete" || item.syncStatus === "delete") return;
        
        const txtSkTho = item.suKien.toString().trim().toUpperCase();
        const maTaiKey = item.maTai.toString().trim().toUpperCase();
        const ngayObj = parseToDateObject(item.ngay);
        if (!ngayObj) return;

        if (txtSkTho.includes("PHỐI") || txtSkTho.includes("PHOI") || txtSkTho.includes("GIỐNG")) {
          if (!khoPhoiMoiNhatCuaNai[maTaiKey] || ngayObj.getTime() > khoPhoiMoiNhatCuaNai[maTaiKey].ngayObj.getTime()) {
            khoPhoiMoiNhatCuaNai[maTaiKey] = { ngayObj, ngayTho: item.ngay, maTaiGoc: item.maTai };
          }
        }
        else if (txtSkTho.includes("ĐẺ") || txtSkTho.includes("DE")) {
          if (!khoDeMoiNhatCuaNai[maTaiKey] || ngayObj.getTime() > khoDeMoiNhatCuaNai[maTaiKey].ngayObj.getTime()) {
            khoDeMoiNhatCuaNai[maTaiKey] = { ngayObj, ngayTho: item.ngay, maTaiGoc: item.maTai };
          }
        }
      });

      Object.values(khoPhoiMoiNhatCuaNai).forEach(caPhoiM => {
        const maTaiNai = caPhoiM.maTaiGoc;
        const maTaiKeyChuan = maTaiNai.toString().trim().toUpperCase();
        
        if (khoDeMoiNhatCuaNai[maTaiKeyChuan] && khoDeMoiNhatCuaNai[maTaiKeyChuan].ngayObj.getTime() > caPhoiM.ngayObj.getTime()) return;

        let trangThaiHienTaiCuaNai = "CHO_PHOI";
        if (Array.isArray(mangRamGocViec) && mangRamGocViec.length > 0) {
          const timDongHeoReal = mangRamGocViec.find(h => h && h.maTai && h.maTai.toString().trim().toUpperCase() === maTaiKeyChuan);
          if (timDongHeoReal) {
            trangThaiHienTaiCuaNai = (timDongHeoReal.trangThaiDienThoai || timDongHeoReal.trangThai || "CHO_PHOI").toString().trim().toUpperCase();
          }
        }

        if (trangThaiHienTaiCuaNai !== "PHỐI" && !trangThaiHienTaiCuaNai.includes("PHOI")) return;

        const soNgayBauReal = Math.round((timeMocHomNay - caPhoiM.ngayObj.getTime()) / 86400000);

        let laKhopBatLoc = false;
        if (cheDoXemHienTai === "HOM_NAY") {
          if (soNgayBauReal >= 17 && soNgayBauReal <= 22) laKhopBatLoc = true;
        } else {
          if (soNgayBauReal < 17 && soNgayBauReal + 5 >= 17) laKhopBatLoc = true;
        }

        if (laKhopBatLoc) {
          const laCaDaTuotXongRoi = danhSachLichSu.some(item => {
            if (!item || !item.maTai || !item.suKien || item.actionType === "delete" || item.syncStatus === "delete") return false;
            if (item.maTai.toString().trim().toUpperCase() !== maTaiNai.toUpperCase()) return false;
            const dObj = parseToDateObject(item.ngay);
            if (!dObj || dObj.getTime() <= caPhoiM.ngayObj.getTime()) return false;
            const sText = item.suKien.toString().trim().toUpperCase();
            return sText.includes("PHỐI") || sText.includes("PHOI") || sText.includes("ĐẺ") || sText.includes("DE");
          });

          if (!laCaDaTuotXongRoi) {
            if (!global.danhSachHeoLocCanhBao.some(k => k.maTai === maTaiNai)) {
              global.danhSachHeoLocCanhBao.push({ maTai: maTaiNai, soNgay: soNgayBauReal });
            }
          }
        }

        if (soNgayBauReal >= 110) {
          if (!global.danhSachHeoSapDeCanhBao.some(k => k.maTai === maTaiNai)) {
            global.danhSachHeoSapDeCanhBao.push({ maTai: maTaiNai, soNgay: soNgayBauReal });
          }
        }
      });

      global.danhSachHeoCaiSuaCanhBao = []; 
      Object.values(khoDeMoiNhatCuaNai).forEach(caDeM => {
        const maTaiNai = caDeM.maTaiGoc;
        const maTaiKeyChuan = maTaiNai.toString().trim().toUpperCase();

        if (khoPhoiMoiNhatCuaNai[maTaiKeyChuan] && khoPhoiMoiNhatCuaNai[maTaiKeyChuan].ngayObj.getTime() > caDeM.ngayObj.getTime()) return;

        let trangThaiHienTaiCuaNaiDe = "CHO_PHOI";
        if (Array.isArray(mangRamGocViec) && mangRamGocViec.length > 0) {
          const timDongHeoRealDe = mangRamGocViec.find(h => h && h.maTai && h.maTai.toString().trim().toUpperCase() === maTaiKeyChuan);
          if (timDongHeoRealDe) {
            trangThaiHienTaiCuaNaiDe = (timDongHeoRealDe.trangThaiDienThoai || timDongHeoRealDe.trangThai || "CHO_PHOI").toString().trim().toUpperCase();
          }
        }

        if (trangThaiHienTaiCuaNaiDe !== "ĐẺ" && !trangThaiHienTaiCuaNaiDe.includes("DE") && !trangThaiHienTaiCuaNaiDe.includes("ĐE")) return;

        const soNgayDeReal = Math.round((timeMocHomNay - caDeM.ngayObj.getTime()) / 86400000);
        if (soNgayDeReal >= 20) {
          if (!global.danhSachHeoCaiSuaCanhBao.some(k => k.maTai === maTaiNai)) {
            global.danhSachHeoCaiSuaCanhBao.push({ maTai: maTaiNai, soNgay: soNgayDeReal });
          }
        }
      });
    }
    if (Array.isArray(danhSachCauHinhVacXin) && danhSachCauHinhVacXin.length > 0) {
      danhSachCauHinhVacXin.forEach(muiLich => {
        if (!muiLich || !muiLich.soNgay) return;

        const danhSachMaTaiCanXuLy = [];
        const mocNgayCauHinh = parseInt(muiLich.soNgay, 10);
        const tenNhiemVuChuan = muiLich.tenNhiemVu || muiLich.tenVacXin || "---";
        const oHanhDongTho = (muiLich.loaiHanhDong || muiLich.loaiMoc || "VACXIN_SAU_PHOI").toString().trim().toUpperCase();

        if (oHanhDongTho.includes("SAU_PHOI") || oHanhDongTho === "VACXIN" || oHanhDongTho === "VẮC-XIN") {
          const cacCaPhoiVacXin = danhSachLichSu.filter(item => {
            if (!item || !item.suKien || item.actionType === "delete" || item.syncStatus === "delete") return false;
            const txtSkTho = item.suKien.toString().trim().toUpperCase();
            return txtSkTho.includes("PHỐI") || txtSkTho.includes("PHOI");
          });

          cacCaPhoiVacXin.forEach(caPhoi => {
            const ngayPhoiChuan = parseToDateObject(caPhoi.ngay);
            if (!ngayPhoiChuan) return;

            const soNgayBauReal = Math.round((timeMocHomNay - ngayPhoiChuan.getTime()) / 86400000);
            const maTaiNai = caPhoi.maTai ? caPhoi.maTai.toString().trim() : "";
            if (maTaiNai === "") return;

            let laKhopNgayVacXin = false;
            if (cheDoXemHienTai === "HOM_NAY") {
              if (soNgayBauReal === mocNgayCauHinh) laKhopNgayVacXin = true;
            } else {
              if (soNgayBauReal < mocNgayCauHinh && soNgayBauReal + 5 >= mocNgayCauHinh) laKhopNgayVacXin = true;
            }

            if (laKhopNgayVacXin) {
              const laCaDaTiem = danhSachLichSu.some(item => {
                if (!item || !item.maTai || !item.suKien || item.actionType === "delete" || item.syncStatus === "delete") return false;
                const xSuKienText = item.suKien.toString().trim().toUpperCase();
                if (xSuKienText !== "VẮC-XIN" && xSuKienText !== "VACXIN") return false;
                if (!(item.ghiChu || "").toString().toUpperCase().includes(tenNhiemVuChuan.toUpperCase())) return false;
                
                const ngayTiemObj = parseToDateObject(item.ngay);
                if (!ngayTiemObj || ngayTiemObj.getTime() < ngayPhoiChuan.getTime()) return false; 

                return item.maTai.toString().toUpperCase().split(',').map(s => s.trim()).includes(maTaiNai.toUpperCase());
              });

              if (!laCaDaTiem && !danhSachMaTaiCanXuLy.includes(maTaiNai)) {
                danhSachMaTaiCanXuLy.push(maTaiNai);
              }
            }
          });
        }
        else if (oHanhDongTho.includes("SAU_NGAY_DE") || oHanhDongTho.includes("SAU_DE")) {
          if (Array.isArray(mangRamGocViec) && mangRamGocViec.length > 0) {
            mangRamGocViec.forEach(dongHeo => {
              if (!dongHeo || dongHeo.vuaNhapMoi === true) return;

              const maTaiHeo = dongHeo.maTai ? dongHeo.maTai.toString().toUpperCase().trim() : "";
              const lSuPhuDe = danhSachLichSu.filter(sk => sk && sk.maTai && sk.maTai.toString().toUpperCase().trim() === maTaiHeo && sk.actionType !== "delete");

              lSuPhuDe.sort((a, b) => (parseToDateObject(b.ngay)?.getTime() || 0) - (parseToDateObject(a.ngay)?.getTime() || 0));

              let trangThaiThucTeDe = dongHeo.trangThaiDienThoai || dongHeo.trangThai || "Cho Phoi";
              if (lSuPhuDe.length > 0 && lSuPhuDe.suKien) trangThaiThucTeDe = lSuPhuDe.suKien;
              const chuoiTrangThaiChuanDe = trangThaiThucTeDe.toString().trim().toUpperCase().normalize("NFC");

              if (chuoiTrangThaiChuanDe === "ĐẺ" || chuoiTrangThaiChuanDe.includes("DE") || chuoiTrangThaiChuanDe.includes("ĐE")) {
                const ngayDeMocSg = dongHeo.ngayDeDongThoiGianThuc || (lSuPhuDe.length > 0 ? lSuPhuDe.ngay : "---");
                const ngayDeObj = parseToDateObject(ngayDeMocSg);

                if (ngayDeObj) {
                  const soNgayDeReal = Math.round((timeMocHomNay - ngayDeObj.getTime()) / 86400000);
                  let laKhopThoiGianDe = false;

                  if (cheDoXemHienTai === "HOM_NAY") {
                    if (soNgayDeReal === mocNgayCauHinh) laKhopThoiGianDe = true;
                  } else {
                    if (soNgayDeReal < mocNgayCauHinh && soNgayDeReal + 5 >= mocNgayCauHinh) laKhopThoiGianDe = true;
                  }

                  if (laKhopThoiGianDe) {
                    const laCaDaChichDe = danhSachLichSu.some(item => {
                      if (!item || !item.maTai || !item.suKien || item.actionType === "delete" || item.syncStatus === "delete") return false;
                      const xSuKienText = item.suKien.toString().trim().toUpperCase();
                      if (xSuKienText !== "VẮC-XIN" && xSuKienText !== "VACXIN") return false;
                      if (!(item.ghiChu || "").toString().toUpperCase().includes(tenNhiemVuChuan.toUpperCase())) return false;
                      
                      const ngayTiemDeObj = parseToDateObject(item.ngay);
                      if (!ngayTiemDeObj || ngayTiemDeObj.getTime() < ngayDeObj.getTime()) return false;

                      return item.maTai.toString().toUpperCase().split(',').map(s => s.trim()).includes(maTaiHeo.toUpperCase());
                    });

                    if (!laCaDaChichDe && maTaiHeo !== "" && !danhSachMaTaiCanXuLy.includes(maTaiHeo)) {
                      danhSachMaTaiCanXuLy.push(maTaiHeo);
                    }
                  }
                }
              }
            });
          }
        }

        if (danhSachMaTaiCanXuLy.length > 0) {
          danhSachMaTaiCanXuLy.forEach(taiLe => {
            if (!ketQuaGomNhom.some(k => k.id === `task_${taiLe}_${muiLich.id}`)) {
              ketQuaGomNhom.push({
                id: `task_${taiLe}_${muiLich.id || Math.random()}`, 
                danhMucDan: "DAN NAI", 
                nhomViec: "THAO_TAC", 
                maTai: taiLe, 
                tieuDeViec: cheDoXemHienTai === "HOM_NAY" ? muiLich.tenNhiemVu + " (" + mocNgayCauHinh + " ngay)" : muiLich.tenNhiemVu + " (Du kien tuong lai)", 
                ghiChuMui: muiLich.ghiChu || "Theo chu ky dich te",
              });
            }
          });
        }
      });
    }

   global.mangLuuViecRamStandard = ketQuaGomNhom;
    setDanhSachViecCanLamThuy(ketQuaGomNhom); // 🎯 KÍCH HOẠT PHÁT SÓNG LỊCH TIÊM CHẠY NGẦM
    return ketQuaGomNhom;
  }, [danhSachLichSu, danhSachCauHinhVacXin, kieuXemThoiGianTask, global.danhSachCapNhatTrangThai]);



    const insets = useSafeAreaInsets();
  
  // 🌐 CẤU HÌNH MẢNG CỔNG LINK WEB APP PHÂN TẢI CHỐNG NGHẼN SERVER TRẠI
  // 🎯 BẢN VÁ XOAY VÒNG ĐỘNG TỐI CAO: CHÈN ĐỦ 4 LINK VÀ TỰ ĐỔI LINK LIÊN TỤC TRÊN MỖI LỆNH FETCH
  const MANG_LINKS_WEB_APP = [
    'https://script.google.com/macros/s/AKfycbwQl9CxRVMLhtO5fqlySeE-AUZtivY4Ez0UqieLkUl9DBPFoMmI4XE4TRKOmkJob8sCSQ/exec', // Mail chính - Link 1
    'https://script.google.com/macros/s/AKfycbzcyY0GkafF_WyRbwckRv-WNfzIG9FYx9txQpeduWAsOIm09QLNWo08a6mB3_WXnzYh2A/exec', // Mail chính - Link 2
    'https://script.google.com/macros/s/AKfycbyPG7pcUMSmHeLOIgJ2FUkOjiHamBzOjGeWh79dA6uGDZ3nS4o0NKEMMiVDGxrvULpVlQ/exec', // Mail phụ - Link 3
    'https://script.google.com/macros/s/AKfycbx4uHc3Vq4ppQPXLke1v7HpHDp3mitK-rG3ZdbjRv7X3uxdER4ulYHkc-2g7Hviw2P_9w/exec'  // Mail phụ - Link 4
  ];
const WEB_APP_URL = useMemo(() => {
    const chiSoNgauNhien = Math.floor(Math.random() * MANG_LINKS_WEB_APP.length);
    const linkBocDuoc = MANG_LINKS_WEB_APP[chiSoNgauNhien];
    
    // 🌟 CHỈ IN LOG ĐÚNG 1 LẦN DUY NHẤT Ở ĐÂY ĐỂ KIỂM TRA MẠNG
    console.log("🚀 [CỔNG MẠNG THỰC TẾ] Phiên này toàn trại chạy trên đường truyền:", linkBocDuoc);
    
    return linkBocDuoc;
  }, []);
  // 📋 IN LOG KIỂM TRA TRỰC TIẾP LUỒNG MẠNG ĐÃ NHẬN LINK DƯỚI CHƯA
  React.useEffect(() => {
    console.log("📱 ỨNG DỤNG KHỞI ĐỘNG - PHIÊN NÀY BỐC TRÚNG CỔNG LINK:", WEB_APP_URL);
  }, [WEB_APP_URL]);

  // --- STATE ĐĂNG NHẬP VÀ CHỌN TRẠI ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState(''); 
  const [typedEmail, setTypedEmail] = useState('');
  const [typedPassword, setTypedPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false); 
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // ========================================================
  // 🚀 BẢN VÁ TỐI CAO: CỜ TRẠNG THÁI THEO DÕI ĐỒNG BỘ NGẦM ĐỂ HIỂN THỊ ICON TẢI NHẸ
  // ========================================================
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);





const [isQuyTrinhAlertVisible, setIsQuyTrinhAlertVisible] = useState(false);
const [txtAlertNoiDung, setTxtAlertNoiDung] = useState({ tieuDe: '', maTai: '', hanhDong: '', loiGiai: '' });

  // --- STATE TÌM KIẾM CHO TỪNG TAB ĐỘC LẬP ---
  const [searchTxtTab1, setSearchTxtTab1] = useState(''); 
  const [searchTxtTab2, setSearchTxtTab2] = useState(''); 
  const [searchTxtTab4, setSearchTxtTab4] = useState(''); 

  // --- STATE CHUYỂN TAB VÀ ĐỒNG BỘ ---
  const [currentTab, setCurrentTab] = useState('nhap_lieu'); 
  const [dongBoStatus, setDongBoStatus] = useState('🟢 Hệ thống sẵn sàng');
  const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [cooldownCapNhat, setCooldownCapNhat] = useState(0);


    // --- STATE MODAL BIẾN ĐỘNG HEO THỊT THEO LÔ TUẦN TUỔI TAB 5 ---
  const [isHeoThitModalVisible, setIsHeoThitModalVisible] = useState(false);
  const [heoThitActionType, setHeoThitActionType] = useState(''); // 'Nhập Đàn', 'Hao Hụt', 'Bán'
  const [heoThitNgay, setHeoThitNgay] = useState(formatVNDate(new Date()));
  const [isHeoThitDatePickerVisible, setHeoThitDatePickerVisibility] = useState(false);
  const [heoThitSoLuong, setHeoThitSoCon] = useState('');
  const [heoThitGhiChu, setHeoThitGhiChu] = useState('');
  const [heoThitTuanChon, setHeoThitTuanChon] = useState(''); 
      // --- STATE QUẢN LÝ ĐÓNG MỞ CÁC GIAI ĐOẠN HEO THỊT TAB 5 ---
  // 🎯 BẢN VÁ TỐI CAO: BỔ SUNG CỜ GD7 ĐỘC LẬP ÉP HỘP SẬP XÒE BUNG FLAT 100%
  const [openGiaiDoan, setOpenGiaiDoan] = useState({ 
    gd3: false, 
    gd4: false, 
    gd5: false, 
    gd6: false, 
    gd7: false // 🚀 Khóa cứng cổng ẩn ngầm cho Giai đoạn 7 tạ ba xuất chuồng
  });

  // ========================================================
  // 🎯 CHỐT CHẶN VẠN NĂNG: Khai bao bien State gác cổng cho phan khu mốc dich te đa vách
  // ========================================================
// 🎯 ĐÃ VÁ: Quy chuẩn về chuỗi ký tự viết hoa không dấu để khớp 100% với màng lọc của TasksTab
const [loaiMocInput, setLoaiMocInput] = useState("SAU_PHOI");

    // --- STATE MODAL SỬA NHẬT KÝ HEO THỊT RIÊNG BIỆT TẠI TAB 5 ---
  const [isSuaHeoThitModalVisible, setIsSuaHeoThitModalVisible] = useState(false);
  const [suaHeoThitId, setSuaHeoThitId] = useState('');
  const [suaHeoThitNgay, setSuaHeoThitNgay] = useState('');
   // 🟢 VÁ TẬN GỐC: Đổi tên hàm thành setSuaHeoThitDatePickerVisible để đồng bộ với nút bấm ở đáy file
  const [isSuaHeoThitDatePickerVisible, setSuaHeoThitDatePickerVisible] = useState(false);

  const [suaHeoThitActionType, setSuaHeoThitActionType] = useState(''); // 'Nhập Đàn', 'Hao Hụt', 'Bán'
  const [suaHeoThitTuanChon, setSuaHeoThitTuanChon] = useState('');
  const [suaHeoThitSoLuong, setSuaHeoThitSoCon] = useState('');
  const [suaHeoThitGhiChu, setSuaHeoThitGhiChu] = useState('');

    const [isOpenSuKien, setIsOpenSuKien] = useState(false); // Cờ điều phối bật tắt khay sự kiện phẳng



    // ========================================================
  // 🚀 BẢN VÁ TỐI CAO: CHỈ ĐỌC Ổ CỨNG KHI RELOAD - CẤM TỰ ĐỘNG GỌI MẠNG KỊCH TRẦN
  // ========================================================
    // ========================================================
  // 🚀 BẢN VÁ TỐI CAO: BẮN EMAIL TRỰC TIẾP ĐỂ PHÁ BẦY CẤM VẬN MẠNG KHI KHỞI ĐỘNG
  // ========================================================
  useEffect(() => {
       const khoiDongLuuDemAnToan = async () => {
      try {
        // 1. Đọc nhanh email găm trong chip ổ cứng điện thoại lên trước
        const emailDaLuu = await AsyncStorage.getItem('userEmail');
        
        if (emailDaLuu && emailDaLuu.trim() !== "") {
          const emailChuan = emailDaLuu.toLowerCase().trim();
          
          setIsLoggedIn(true); 
          setUserEmail(emailChuan);
          
          const khoaDemTongHop = `cache_tonghop_pigvn_${emailChuan}`;
          const dataDemTho = await AsyncStorage.getItem(khoaDemTongHop);
          
          if (dataDemTho !== null) {
            const result = JSON.parse(dataDemTho);
            
            setDanhSachLichSu(result.tab1 || []);
            setDanhSachMaTai(result.tab2 || []);
            setDataThongKe(result.tab3 || null);
            setDanhSachDangDe(result.tab4 || []);

            // 🎯 VÁ KHÂU ĐỌC CACHE NGOẠI TUYẾN: Ép bốc đúng hạt nhân dữ liệu phẳng thô chống loạn lứa tuổi
            if (result.tab5) {
              setDataHeoThit(result.tab5.dataLocHt ? result.tab5.dataLocHt : result.tab5);
            } else {
              setDataHeoThit(null);
            }

            if (Array.isArray(result.tab6)) {
              setDanhSachCauHinhVacXin(result.tab6);
            } else {
              setDanhSachCauHinhVacXin([]);
            }

            setDongBoStatus('Sẵn Sàng');
            setIsInitialLoading(false); 

            if (typeof handleRefreshData === 'function') {
              console.log("AUTO FETCH KHI MO APP (MAY CO CACHE): Tu dong tai lai data...");
              setDongBoStatus("Đang Cập Nhật Dữ Liệu Trại...");
              handleRefreshData(emailChuan); 
              
              setTimeout(() => {
                if (typeof layDanhSachNhiemVuHomNay === 'function') layDanhSachNhiemVuHomNay();
              }, 1500);
            }
          } else {
            setDanhSachLichSu([]);
            setDanhSachMaTai([]);
            setDanhSachDangDe([]);
            setDanhSachCauHinhVacXin([]);
            setDongBoStatus('Sẵn Sàng');
            setIsInitialLoading(false);

            if (typeof handleRefreshData === 'function') {
              console.log("AUTO FETCH KHI MO APP (MAY MOI CHUA CACHE): Buoc phai keo data Server...");
              setDongBoStatus("Đang tải dữ liệu trại (nếu có)...");
              handleRefreshData(emailChuan); 
              
              setTimeout(() => {
                if (typeof layDanhSachNhiemVuHomNay === 'function') layDanhSachNhiemVuHomNay();
              }, 3000);
            }
          }
        }
      } catch (e) {
        console.log("Loi khoi phuc dang nhap cache ban dau:", e);
        setIsInitialLoading(false);
      }
    };

    khoiDongLuuDemAnToan();
  }, []);




  // --- STATE TAB 1: NHẬP LIỆU ---
  const [ngayHienThi, setNgayHienThi] = useState(formatVNDate(new Date()));
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [maTai, setMaTai] = useState('');
  const [suKien, setSuKien] = useState('Phối');
  const [soHeo, setSoHeo] = useState('');
  const [danhSachLichSu, setDanhSachLichSu] = useState([]);
  const [khoThai, setKhoThai] = useState('');
  const [coiCoc, setCoiCoc] = useState('');
  const [chetNgop, setChetNgop] = useState('');
  const [chonNuoi, setChonNuoi] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [goiYMaTaiLoc, setGoiYMaTaiLoc] = useState([]);
    // --- STATE DÒNG CHỮ THÔNG BÁO NHỎ CHO HỘP THÊM NHANH TAB 1 ---
  const [nhanThongBaoNhoQuickAdd, setNhanThongBaoNhoQuickAdd] = useState('');
    // --- STATE MODAL CẢNH BÁO THÀNH CÔNG ĐẸP MẮT GIỮA MÀN HÌNH ---
  const [isThanhCongModalVisible, setIsThanhCongModalVisible] = useState(false);
  const [txtThanhCongNoiDung, setTxtThanhCongNoiDung] = useState({ tieuDe: '', maTai: '', loiGiai: '' });

    // --- STATE BỔ SUNG PHỤC VỤ SỬA HEO THỊT TẠI TAB 1 ---
  const [inputTuanSua, setInputTuanSua] = useState(''); // Lưu số tuần tuổi khi khách sửa dòng heo thịt
    // 🟢 VÁ SIÊU TỐC: Khai báo biến editTuanSua để Modal ở chân file bốc trúng bộ nhớ RAM
  const [editTuanSua, setEditTuanSua] = useState('');

  // --- STATE BỘ LỌC NÂNG CAO TẠI TAB 1 ---
  const [filterNgayTab1, setFilterNgayTab1] = useState(''); // Lưu ngày khách chọn lọc (Dạng dd/mm/yyyy)
  const [isFilterDatePickerVisible, setFilterDatePickerVisible] = useState(false);
  const [filterSuKienTab1, setFilterSuKienTab1] = useState('ALL'); // 'ALL' hoặc tên sự kiện cụ thể


  //Khi thêm sự kiện mà không có mã tai thì thông báo cho khách
  const [isQuickAddModalVisible, setIsQuickAddModalVisible] = useState(false);
  const [quickGiong, setQuickGiong] = useState('');
  const [quickLua, setQuickLua] = useState('Hậu Bị');
  const [isQuickSaving, setIsQuickSaving] = useState(false);
  const [isAlertModalVisible, setIsAlertModalVisible] = useState(false);
  // STATE MODAL SỬA TAB 1
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editNgay, setEditNgay] = useState('');
  const [isEditDatePickerVisible, setEditDatePickerVisibility] = useState(false);
  const [editMaTai, setEditMaTai] = useState('');
  const [editSuKien, setEditSuKien] = useState('Phối');
  const [editSoHeo, setEditSoHeo] = useState('');

  const [editKhoThai, setEditKhoThai] = useState('');
  const [editCoiCoc, setEditCoiCoc] = useState('');
  const [editChetNgop, setEditChetNgop] = useState('');
  const [editChonNuoi, setEditChonNuoi] = useState('');
  const [editGhiChu, setEditGhiChu] = useState('');


  const danhSachSuKien = ["Phối", "Chờ Phối", "Lốc", "Đẻ", "Cai Sữa", "Sảy Thai", "Thải"];
const canNhapSoHeo = suKien === "Đẻ" || suKien === "Cai Sữa";
const editCanNhapSoHeo = editSuKien === "Đẻ" || editSuKien === "Cai Sữa";
const laSuKienBanHeo = false; // Triệt tiêu cờ bán heo ở Tab 1

  // --- STATE TAB 2: MÃ TAI ---
  const [mtMaTai, setMtMaTai] = useState('');
  const [mtGiong, setMtGiong] = useState('');
  const [mtLua, setMtLua] = useState('Hậu Bị'); 
  const [danhSachMaTai, setDanhSachMaTai] = useState([]);
  const [mangLichSuDeCuaTai, setMangLichSuDeCuaTai] = useState([]);
  const [isThaiListVisible, setIsThaiListVisible] = useState(false);
  const [nhomNaiTab2, setNhomNaiTab2] = useState('Phoi'); // Các nhóm: 'BAU', 'CHUA_PHOI', 'NUOI_CON', 'THAI'



  // STATE MODAL SỬA TAB 2
  const [isMtEditModalVisible, setIsMtEditModalVisible] = useState(false);
  const [mtEditingId, setMtEditingId] = useState(null);
  const [mtEditMaTai, setMtEditMaTai] = useState('');
  const [mtEditGiong, setMtEditGiong] = useState('');
  const [mtEditLua, setMtEditLua] = useState('Hậu Bị');

  const danhSachLuaHeo = ["Hậu Bị", ...Array.from({ length: 15 }, (_, i) => `Lứa ${i + 1}`)];

  // --- STATE TAB 3 & TAB 4 ---
  const [dataThongKe, setDataThongKe] = useState(null); 
  const [danhSachDangDe, setDanhSachDangDe] = useState([]); 
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false); 
  const [selectedHeoDetail, setSelectedHeoDetail] = useState(null);
  const [loadingLichSuDe, setLoadingLichSuDe] = useState(false);
    // --- STATE QUẢN LÝ BẤM XÒE DANH SÁCH MÃ TAI BẦU THEO TUẦN TẠI TAB 3 ---
  const [tuanBauDangMoTab3, setTuanBauDangMoTab3] = useState(null); // Lưu chuỗi tên tuần đang mở, ví dụ: 't1', 't10'...


    // --- STATE MODAL CAI SỮA NHANH TẠI CHUỒNG TAB 4 ---
  const [isCaiSuaModalVisible, setIsCaiSuaModalVisible] = useState(false);
  const [caiSuaHeoItem, setCaiSuaHeoItem] = useState(null);
  const [caiSuaNgay, setCaiSuaNgay] = useState(formatVNDate(new Date()));
  const [isCaiSuaDatePickerVisible, setCaiSuaDatePickerVisibility] = useState(false);
  const [caiSuaSoCon, setCaiSuaHeoSoCon] = useState('');

    // ========================================================
  // 🚀 BAN VA TOI CAO: KHAY LUU TRU BO LICH VACXIN VA KHAM THAI RIENG BIET
  // ========================================================
 
const [selectedType, setSelectedType] = useState("Vắc-xin");
  const [inputDays, setInputDays] = useState("");
  const [inputName, setInputName] = useState("");
      const [ghiChuVacXinInput, setGhiChuVacXinInput] = useState("");
  const [showCustomToastTab3, setShowCustomToastTab3] = useState(false);
  const [toastMessageTab3, setToastMessageTab3] = useState("");
  const [trangThaiMangLuu, setTrangThaiMangLuu] = useState("DANG_LUV");
    const [ghiChuCongNhanGaoInput, setGhiChuCongNhanGaoInput] = useState("");


  const [hienQuyTrinhChiTietTab3, setHienQuyTrinhChiTietTab3] = useState(false);
  const [hienCaiSuaChiTietTab3, setHienCaiSuaChiTietTab3] = useState(false);


    // ========================================================
  // 🚀 BIẾN RAM GHIM DÒNG CẤU HÌNH ĐANG SỬA (CHỐNG LỖI HOOKS LỒNG)
  // ========================================================
  const [editingConfigId, setEditingConfigId] = useState(null); // Neu bang null la dang Them moi, neu co ID la dang Sua do

    // ========================================================
  // 🚀 BAN VA TOI CAO: BIEN RAM CHUA CAC MA TAI DUOC TICK CHON TRONG NGAY CHONG LOI HOOKS
  // ========================================================
  const [selectedTasksMap, setSelectedTasksMap] = useState({}); // Găm giữ trạng thái bật tắt Checkbox ngoài bộ nhớ đệm
    const [danhSachChienDichDaAn, setDanhSachChienDichDaAn] = useState([]);


    // ========================================================
  // 🚀 BAN VA TOI CAO: CO DIEU PHOI MAN HINH PHU BEN TRONG TAB GOP NHIEM VU
  // ========================================================
  const [subTab, setSubTab] = useState("today_tasks"); // today_tasks la Viec hom nay, setup_schedule la Cai dat quy trinh
  const [hienSapDeChiTietTab3, setHienSapDeChiTietTab3] = useState(false);
    const [hienBatLocChiTietTab3, setHienBatLocChiTietTab3] = useState(false);



     // 🧠 TRẠM ĐIỀU PHỐI TRẠNG THÁI ĐÀN NÁI REAL-TIME TRUNG TÂM (ĐÃ CHUẨN HÓA VÀO EFFECT)
   useEffect(() => {
    if (!Array.isArray(danhSachMaTai)) return;

    // 1. Lọc bỏ các dòng rỗng lỗi từ bản ghi Sheets
    const mangSachDuLieu = danhSachMaTai.filter(h => h && h.maTai && h.maTai.toString().trim() !== "");

    // 2. Tính toán dịch tễ sinh sản thời gian thực ngoài lán trại
    const ketQuaQuetTrangThaiNai = mangSachDuLieu.map(heoGoc => {
      const maTaiInHoa = heoGoc.maTai.toString().toUpperCase().trim();

      // Tìm dòng nhật ký mới nhất thực tế của nái trên RAM (Đã vá toán tử an toàn chặn crash app)
      const mangSkLoc = Array.isArray(danhSachLichSu)
        ? danhSachLichSu
            .filter(i => i && i.maTai && String(i.maTai).trim().toUpperCase() === maTaiInHoa && i.actionType !== "delete")
            .sort((a, b) => {
              const timeA = parseToDateObject(a.ngay) ? parseToDateObject(a.ngay).getTime() : 0;
              const timeB = parseToDateObject(b.ngay) ? parseToDateObject(b.ngay).getTime() : 0;
              if (timeB !== timeA) return timeB - timeA;
              return (b.id ? b.id.toString() : "").localeCompare(a.id ? a.id.toString() : "");
            })
        : [];
      
      const skMoiNhat = mangSkLoc.length > 0 ? mangSkLoc[0] : null;

      let trangThaiThucTe = ""; let ngayTinhNgayBau = "";
      let ngayDuKienDeMoi = heoGoc.ngayDuKienDeMoi || "---";
      let ngayDeDongThoiGianThuc = heoGoc.ngayDeCotJ || ""; 

      if (skMoiNhat) {
        const skTho = skMoiNhat.suKien ? skMoiNhat.suKien.toString().trim().normalize("NFC") : "";
        if (skTho === "Đẻ" || skTho === "ĐẺ" || skTho.includes("Đe")) { trangThaiThucTe = "Đẻ"; ngayDeDongThoiGianThuc = skMoiNhat.ngay; } 
        else if (skTho === "Phối" || skTho === "PHỐI") { trangThaiThucTe = "Phối"; ngayTinhNgayBau = skMoiNhat.ngay; ngayDuKienDeMoi = tinhNgayDuKienDe(skMoiNhat.ngay); } 
        else if (skTho === "Cai Sữa" || skTho === "Cai sữa" || skTho.includes("Cai")) { trangThaiThucTe = "Cai Sữa"; } 
        else if (skTho === "Thải" || skTho === "THẢI") { trangThaiThucTe = "Thải"; } 
        else if (skTho === "Lốc" || skTho === "LỐC") { trangThaiThucTe = "Lốc"; } 
        else if (skTho === "Sảy Thai" || skTho === "SẢY THAI") { trangThaiThucTe = "Sảy Thai"; } 
        else { trangThaiThucTe = "Chờ Phối"; }
      } else {
        const ttH = heoGoc.trangThaiCotH ? heoGoc.trangThaiCotH.toString().trim().normalize("NFC") : "";
        if (ttH === "Phối") { trangThaiThucTe = "Phối"; ngayTinhNgayBau = heoGoc.ngayCotI || ""; } 
        else if (ttH === "Chờ Phối" || ttH === "Lốc" || ttH === "Sảy Thai" || ttH === "") { trangThaiThucTe = ttH !== "" ? ttH : "Chờ Phối"; } 
        else if (ttH === "Đẻ" || ttH === "Cai Sữa") { trangThaiThucTe = "Đẻ"; } 
        else if (ttH === "Thải") { trangThaiThucTe = "Thải"; }
      }

      return {
        ...heoGoc,
        trangThaiDienThoai: trangThaiThucTe,
        ngayPhoiDong: ngayTinhNgayBau,
        ngayDuKienDeMoi: ngayDuKienDeMoi,
        ngayDeDongThoiGianThuc: ngayDeDongThoiGianThuc
      };
    });

    // 3. Đổ dữ liệu sạch vào bộ phát sóng tập trung Context API giúp hạ tải CPU điện thoại
    setDanhSachTrangThaiNai(ketQuaQuetTrangThaiNai);

    // 4. 🛰️ MƯỢN XÁC HOÀN HỒN: Tự động bơm đầy dữ liệu vào mảng global cũ nuôi sống 5 Tab mặt tiền, tuyệt diệt lỗi vỡ app!
    global.danhSachCapNhatTrangThai = ketQuaQuetTrangThaiNai;

  }, [danhSachMaTai, danhSachLichSu]);

const [dataHeoThit, setDataHeoThit] = useState(null);

  // 🧠 BỘ NÃO ĐỒNG BỘ TRUNG TÂM: Quét chuẩn đơn biến danhSachLichSu, tính số tổng lợn thịt Real-time tức thì ngoài RAM
  // 🎯 BẢN VÁ TỐI CAO V10: KHÓA PHẲNG BỘ NÃO, BẢO VỆ CHÂN ĐẾ SỐ LƯỢNG RAM THUẦN TÚY
   // 🎯 BẢN VÁ TỐI CAO V12: ĐÓNG VÁCH BẢO VỆ CHÂN ĐẾ SỐ LƯỢNG RAM THUẦN TÚY, TUYỆT DIỆT NHẢY SỐ LÙI
  useEffect(() => {
    if (!dataHeoThit) return;

    const laySoTho = (val) => (!val || isNaN(val.toString().trim()) || val.toString().trim() === "") ? 0 : Number(val.toString().trim());
    
    // Ép buộc tính toán số tổng bằng toán học sạch từ các ô giai đoạn đơn lẻ thực tế
    let tongHeoThitGoc = laySoTho(dataHeoThit.theoMe || dataHeoThit["Theo Mẹ"]) + 
                         laySoTho(dataHeoThit.caiSua || dataHeoThit["4 Tuần"] || dataHeoThit["4 Tuần ( Cai Sữa )"]) + 
                         laySoTho(dataHeoThit.giaiDoan3) + 
                         laySoTho(dataHeoThit.giaiDoan4) + 
                         laySoTho(dataHeoThit.giaiDoan5) + 
                         laySoTho(dataHeoThit.giaiDoan6) + 
                         laySoTho(dataHeoThit.giaiDoan7);

    // 🌟 KHÓA CHẶT TRỤC CHÂN: Gán thẳng số lượng toán học sạch vào biến hiển thị mặt tiền, cấm bốc mảng lịch sử gây lỗi chồng dòng
    if (dataHeoThit.tongHeoThitSauBuTruRealTime !== tongHeoThitGoc) {
      setDataHeoThit(prev => ({
        ...prev,
        tongHeoThitSauBuTruRealTime: tongHeoThitGoc
      }));
    }
  }, [dataHeoThit?.theoMe, dataHeoThit?.caiSua, dataHeoThit?.giaiDoan3, dataHeoThit?.giaiDoan4, dataHeoThit?.giaiDoan5, dataHeoThit?.giaiDoan6, dataHeoThit?.giaiDoan7]);

  const KhoiDanhSachHeoThai = React.memo(({ mangHeo, hienThi, onXemChiTiet }) => {
  if (!hienThi) return null;
  const danhSachThai = Array.isArray(mangHeo) ? mangHeo.filter(i => i && i.trangThaiCotH && i.trangThaiCotH.toString().trim().normalize("NFC") === "Thải") : [];
  if (danhSachThai.length === 0) return <Text style={{ textAlign: 'center', color: '#888888', fontStyle: 'italic', marginTop: 10, fontSize: 13 }}>Hiện tại chưa có heo nái nào bị thải trong trại này.</Text>;

  return (
    <View style={{ marginTop: 10 }}>
      {danhSachThai.map((item, index) => (
        <View key={`thai_${item.id || index}`} style={[{ flexDirection: 'row', alignItems: 'center', opacity: 0.65 }, styles.historyCard, { marginHorizontal: 0, marginTop: 8 }]}>
          <View style={{ flex: 1, paddingRight: 5 }}>
            <Text style={styles.cardHeader}>🔑 Mã số: <Text style={{color: '#777777', fontWeight: 'bold'}}>{String(item.maTai || "---")}</Text></Text>
            <Text style={styles.cardBody} numberOfLines={1}>🧬 Giống: {String(item.giong || "---")} | 🎂 Lứa: {String(item.lua || "---")}</Text>
            <Text style={{ fontSize: 12, color: '#dc3545', marginTop: 2, fontWeight: 'bold' }}>❌ Trạng thái: ĐÃ THẢI</Text>
          </View>
          <View style={{ minWidth: 60 }}>
            <TouchableOpacity 
              onPress={() => onXemChiTiet(item)} 
              style={{ backgroundColor: '#6c757d', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, alignItems: 'center' }}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>Xem</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
});
  // ========================================================
     // 🎯 KHÔI PHỤC HÀM ĐĂNG NHẬP NGUYÊN BẢN 100% - CHẤP MỌI KIỂU CHỮ HOA/THƯỜNG - ĐỌC JSON SẠCH
    const handleLoginSubmit = () => {
    if (!typedEmail.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Số tài khoản (Email)!");
    if (!typedPassword.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Mật mã truy cập!");

    setIsAuthLoading(true);
    setDongBoStatus('⏳ Đang xách định danh tính Cloud...');

    // 1. Kích hoạt cổng xác thực Firebase đám mây
    signInWithEmailAndPassword(auth, typedEmail.toLowerCase().trim(), typedPassword)
      .then(async (userCredential) => {
        const emailKhachStandard = userCredential.user.email.toLowerCase().trim();
        setUserEmail(emailKhachStandard);

        // Găm cứng email vào bộ nhớ máy để tự động đăng nhập lần sau
        await AsyncStorage.setItem('userEmail', emailKhachStandard);

        setDongBoStatus('⏳ Xác thực thành công! Đang tải sổ liệu nhật ký...');

        // 2. PHÁ VỠ CHỌN TRẠI TRUNG GIAN: Thọc thẳng lên Server kéo dữ liệu 5 Tab về máy lập tức
        const xauNgauNhien = Math.random().toString(36).substring(7);
        fetch(`${WEB_APP_URL}?action=get_all_data&userEmail=${emailKhachStandard}&_nocache=${xauNgauNhien}`, { method: 'GET', redirect: 'follow' })
          .then((res) => res.json())
          .then((result) => {
            setIsAuthLoading(false);
            if (result && result.status === 'success') {
              // Ghim sạch dữ liệu lên RAM điện thoại trong 0.01 giây
              setDanhSachLichSu(result.tab1 || []);
              setDanhSachMaTai(result.tab2 || []);
              setDataThongKe(result.tab3 || null);
              setDanhSachDangDe(result.tab4 || []);
              if (result && result.tab5) {
  // Ép bốc đúng Object dataLocHt phẳng sạch từ Server gửi về để nuôi sống bàn cờ
  setDataHeoThit(result.tab5.dataLocHt ? result.tab5.dataLocHt : result.tab5);
} else {
  setDataHeoThit(null);
}

              // Mở khóa màn hình chính, bỏ qua hoàn toàn pop-up chọn trại
              setIsLoggedIn(true);
              setDongBoStatus('🟢 Hệ thống sẵn sàng');
            } else {
              setDongBoStatus('🔴 Lỗi đồng bộ cấu trúc Server');
              Alert.alert("Thông báo", "Đăng nhập thành công nhưng không thể nạp sổ liệu. Vui lòng bấm Tải lại!");
              setIsLoggedIn(true); // Vẫn cho vào app để xem ngoại tuyến
            }
          })
          .catch((err) => {
            setIsAuthLoading(false);
            setDongBoStatus('⚠️ Mất mạng ngầm. Đang dùng dữ liệu nội bộ.');
            setIsLoggedIn(true);
          });
      })
      .catch((error) => {
        setIsAuthLoading(false);
        setDongBoStatus('❌ Sai mã truy cập');
        let chuoiLoi = "Không thể kết nối hệ thống Cloud. Vui lòng kiểm tra mạng!";
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          chuoiLoi = "Số tài khoản hoặc Mật mã không chính xác. Vui lòng nhập lại!";
        }
        Alert.alert("Lỗi truy cập", chuoiLoi);
      });
  };




  // 🔑 HÀM XỬ LÝ ĐĂNG XUẤT - XÓA SẠCH BỘ NHỚ TRÊN CHIP ĐIỆN THOẠI
   const handleLogOut = async () => {
    try {
      // Xóa sạch bộ nhớ tạm thời trên ổ cứng điện thoại
      await AsyncStorage.clear();

      // Đánh sập toàn bộ các mảng dữ liệu tạm thời trên RAM để bảo mật thông tin tài khoản cũ
      setIsLoggedIn(false);
      setDanhSachLichSu([]);
      setDanhSachMaTai([]);
      setDanhSachDangDe([]);
      setDataHeoThit(null);
      setDataThongKe(null); // SỬA: Dọn sạch nốt cả dữ liệu thống kê Tab 3 cho an toàn

      setDongBoStatus('🚪 Đã đăng xuất tài khoản thành công');
    } catch (e) {
      console.log("Lỗi đăng xuất:", e);
    }
  };


  // 🎯 VÁ TỐI ƯU HIỆU NĂNG: Hàm gọi dữ liệu nút Xem đặt độc lập bên ngoài FlatList
const handleXemChiTietHeo = (item) => {
    setIsDetailModalVisible(true);
    setLoadingLichSuDe(true);

    // 1. Tạo một Object gộp dữ liệu ban đầu
    let duLieuGopDayDu = { ...item };

    // 2. 🎯 SỬA CHUẨN ĐÉT: Dùng findLast quét từ dưới đáy mảng lên để bốc trọn lứa đẻ mới nhất của nái
    if (Array.isArray(danhSachDangDe)) {
      // Bản Expo/React Native hỗ trợ findLast, nếu không ta dùng logic đảo mảng an toàn
      const thongTinDeChiTiet = [...danhSachDangDe].reverse().find(heo => 
        heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === item.maTai.toString().toUpperCase().trim()
      );

      // Nếu tìm thấy lứa mới nhất, tiến hành gộp các thuộc tính sơ sinh vào Pop-up
      if (thongTinDeChiTiet) {
        duLieuGopDayDu = {
          ...duLieuGopDayDu,
          soHeoCon: thongTinDeChiTiet.soHeoCon || duLieuGopDayDu.soHeoCon || "0",
          khoThai: thongTinDeChiTiet.khoThai || "0",
          coiCoc: thongTinDeChiTiet.coiCoc || "0",
          chetNgop: thongTinDeChiTiet.chetNgop || "0",
          chonNuoi: thongTinDeChiTiet.chonNuoi || "0",
          soConCaiSua: thongTinDeChiTiet.soConCaiSua || "0",
          // Đảm bảo lấy đúng ngày đẻ thực tế từ lứa mới nhất của sheet xử lý heo đẻ
          ngayDeCotJ: thongTinDeChiTiet.ngayDe || duLieuGopDayDu.ngayDeCotJ || ""
        };
      }
    }

    // Nạp toàn bộ cục dữ liệu lứa mới nhất này vào State hiển thị của Pop-up Modal
    setSelectedHeoDetail(duLieuGopDayDu);

    // 3. Tự động nhận diện trạng thái Cột H thực tế để mở đúng giao diện tuần bầu hoặc nuôi con
const ttH = duLieuGopDayDu.trangThaiCotH ? duLieuGopDayDu.trangThaiCotH.toString().trim().normalize("NFC") : "";
    if (ttH === "Phối") {
      setNhomNaiTab2('Phoi');
    } else if (ttH === "Đẻ" || ttH === "Cai Sữa") {
      setNhomNaiTab2('De');
    } else if (ttH === "Thải") {
      setNhomNaiTab2('Thai');
    } else {
      setNhomNaiTab2('Cho Phoi');
    }


    // 4. Vẫn phát lệnh gọi mạng kéo thêm danh sách các lứa đẻ cũ trong lịch sử như bình thường
fetch(`${WEB_APP_URL}?action=get_lich_su_de&userEmail=${userEmail.toLowerCase().trim()}&maTai=${item.maTai}`, { method: 'GET', redirect: 'follow' })
      .then(res => res.json())
      .then(result => {
        setLoadingLichSuDe(false);
        if (result.status === 'success' && result.data) {
          setMangLichSuDeCuaTai(result.data);
        }
      })
      .catch(() => setLoadingLichSuDe(false));
  };

  // 🚀 BẢN VÁ TỐI CAO: DIỆT TẬN GỐC LỖI TRUYỀN EVENT OBJECT TRÊN BUTTON TẠO CHUỖI RÁC
  // ========================================================
   // 🎯 BẢN VÁ TỐI CAO: KHÓA NÚT CẬP NHẬT CHỐNG SPAM MẠNG TRONG 5 GIÂY
  const handleRefreshData = (emailTruyenVao) => {
    // 🛑 CHẮN CỔNG: Nếu vẫn đang trong thời gian cooldown, hủy lệnh mạng lập tức
    if (cooldownCapNhat > 0) {
      Alert.alert("Thông báo", `Hệ thống đang tải, vui lòng đợi ${cooldownCapNhat} giây để bấm lại!`);
      return;
    }

    let emailGocRaMa = "";
    if (emailTruyenVao && typeof emailTruyenVao === "string" && !emailTruyenVao.includes("[object")) {
      emailGocRaMa = emailTruyenVao;
    } else if (userEmail && typeof userEmail === "string") {
      emailGocRaMa = userEmail;
    }

    if (!emailGocRaMa.toString().trim()) return;

    setDongBoStatus('⏳ Đang cập nhật dữ liệu trại ');
    setIsInitialLoading(true);
    
    // 🌟 KÍCH HOẠT KHÓA NÚT 5 GIÂY
    setCooldownCapNhat(5);
    const boDemInterval = setInterval(() => {
      setCooldownCapNhat(prev => {
        if (prev <= 1) {
          clearInterval(boDemInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const emailChuan = emailGocRaMa.toString().toLowerCase().trim();
    const xauNgauNhien = Math.random().toString(36).substring(7);
    const khoaDemTongHop = `cache_tonghop_pigvn_${emailChuan}`;

    fetch(`${WEB_APP_URL}?action=get_all_data&userEmail=${emailChuan}&_nocache=${xauNgauNhien}`, { method: 'GET', redirect: 'follow' })
      .then((res) => res.json())
      .then((result) => {
        setIsInitialLoading(false);
        if (result && result.status === 'success') {
          setDanhSachLichSu(result.tab1 || []);
          setDanhSachMaTai(result.tab2 || []);
          setDataThongKe(result.tab3 || null);
          setDanhSachDangDe(result.tab4 || []);
          if (result && result.tab5) {
            setDataHeoThit(result.tab5.dataLocHt ? result.tab5.dataLocHt : result.tab5);
          } else {
            setDataHeoThit(null);
          }
          if (result.tab6 && Array.isArray(result.tab6)) {
            setDanhSachCauHinhVacXin(result.tab6);
          } else {
            setDanhSachCauHinhVacXin([]);
          }

          AsyncStorage.setItem(khoaDemTongHop, JSON.stringify(result)).catch(e => console.log(e));
          setDongBoStatus('✅ Đã cập nhật!');
        } else {
          setDongBoStatus('❌ Không thể cập nhật dữ liệu trại');
        }
      })
      .catch((error) => {
        setIsInitialLoading(false);
        setDongBoStatus('❌ Kết nối Server thất bại');
      });
  };



  // 🚀 BẢN VÁ TỐI CAO VẠN NĂNG: KHÉP KÍN TOÀN DIỆN LUỒNG THÊM / SỬA / XÓA THEO SỰ KIỆN SỐNG
  // ========================================================
  const guiYeuCauMang = async (bodyData, callback) => {
    const emailChuan = userEmail ? userEmail.toLowerCase().trim() : "";
    const khoaDemTongHop = `cache_tonghop_pigvn_${emailChuan}`;

    let duongLinkGoiData = `${WEB_APP_URL}?action=${bodyData.actionType}&id=${bodyData.id}&userEmail=${emailChuan}`;
    
    if (bodyData.actionType === "mt_create" || bodyData.actionType === "mt_delete") {
      duongLinkGoiData += `&maTai=${encodeURIComponent(bodyData.maTai || "")}&giong=${encodeURIComponent(bodyData.giong || "")}&lua=${encodeURIComponent(bodyData.lua || "0")}&trangThai=${encodeURIComponent(bodyData.trangThai || "Chờ Phối")}&ghiChu=${encodeURIComponent(bodyData.ghiChu || "")}`;
    } else {
      duongLinkGoiData += `&ngay=${encodeURIComponent(bodyData.ngay || "")}&maTai=${encodeURIComponent(bodyData.maTai || "")}&suKien=${encodeURIComponent(bodyData.suKien || "")}&soHeo=${bodyData.soHeo !== undefined ? bodyData.soHeo : ""}&giong=${encodeURIComponent(bodyData.giong || "")}&lua=${encodeURIComponent(bodyData.lua || "")}&khoThai=${encodeURIComponent(bodyData.khoThai || "")}&coiCoc=${encodeURIComponent(bodyData.coiCoc || "")}&chetNgop=${encodeURIComponent(bodyData.chetNgop || "")}&chonNuoi=${encodeURIComponent(bodyData.chonNuoi || "")}&ghiChu=${encodeURIComponent(bodyData.ghiChu || "")}&tuanBan=${encodeURIComponent(bodyData.tuanBan || "")}`;
    }

    fetch(duongLinkGoiData, { method: 'GET', redirect: 'follow' })
    .then((res) => {
      if (res.status >= 200 && res.status < 400) {
        return res.text().then(textTho => {
          try { return JSON.parse(textTho); } catch (e) { return { status: "success" }; }
        });
      }
      return res.json().catch(() => ({ status: "success" }));
    })
    .then(async (res) => {
      
      if (res && res.status === 'success') {
        
        let mangLichSuSauCapNhat = [];
        const maTaiQuetChuan = bodyData.maTai ? bodyData.maTai.toString().toUpperCase().trim() : "";
        let suKienQuetChuan = bodyData.suKien ? bodyData.suKien.toString().trim() : "";

        if (suKienQuetChuan === "Cai sữa" || suKienQuetChuan === "cai sua" || suKienQuetChuan.includes("Cai")) {
          suKienQuetChuan = "Cai Sữa";
        }

        // 🎯 TOÁN TỬ LẬT MẠCH TUẦN TUỔI CHUẨN TỪ SERVER ĐỔ VỀ CHO KHÂU HEO THỊT
        let suKienCapNhatTuan = bodyData.suKien;
        if (res.tuanTuoiThucTe && (bodyData.suKien.includes("Nhập Đàn") || bodyData.suKien.includes("Hao Hụt") || bodyData.suKien.includes("Bán"))) {
          const tenHanhDongTho = bodyData.suKien.includes("Nhập Đàn") ? "Nhập Đàn" : (bodyData.suKien.includes("Hao Hụt") ? "Hao Hụt" : "Bán Heo");
          suKienCapNhatTuan = `${tenHanhDongTho} Tuần ${res.tuanTuoiThucTe.toString().replace(/\D/g, '')}`;
        }

        // 🎯 🚀 VÁCH HÀNH ĐỘNG 1: NẾU LÀ LỆNH XÓA DÒNG NHẬT KÝ (ACTIONTYPE === "DELETE")
        if (bodyData.actionType === "delete") {
          // Xóa phăng hẳn dòng lịch sử mờ cam ra khỏi giao diện Tab 1 ngoài RAM mặt tiền
          setDanhSachLichSu(prev => prev.filter(i => i.id !== bodyData.id));

          // THUẬT TOÁN QUAY XE QUÂN SỐ: Nếu ca bị xóa mang nhãn hiệu "Thải" -> Ép lật ngược về Chờ Phối để đàn nái cộng trả lại 1 con!
          if (suKienQuetChuan === "Thải" || suKienQuetChuan === "THẢI") {
            setDanhSachMaTai(prev => prev.map(heo => {
              if (heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiQuetChuan) {
                return { ...heo, trangThaiDienThoai: "Chờ Phối", trangThai: "Chờ Phối", trangThaiCotH: "Chờ Phối" };
              }
              return heo;
            }));

            if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
              global.danhSachCapNhatTrangThai = global.danhSachCapNhatTrangThai.map(heo => {
                if (heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiQuetChuan) {
                  return { ...heo, trangThaiDienThoai: "Chờ Phối", trangThai: "Chờ Phối", trangThaiCotH: "Chờ Phối" };
                }
                return heo;
              });
            }
          }
        }

        // 🎯 VÁCH HÀNH ĐỘNG 2: NẾU GHI SỰ KIỆN CHÍNH MỚI (TAB 1 CREATE)
        else if (bodyData.actionType === "create") {
          setDanhSachLichSu(prev => {
            mangLichSuSauCapNhat = prev.map(i => i.id === bodyData.id ? { ...i, suKien: suKienCapNhatTuan, syncStatus: "synced" } : i);
            return mangLichSuSauCapNhat;
          });
        } 
        
        // 🎯 VÁCH HÀNH ĐỘNG 3: NẾU SỬA DÒNG NHẬT KÝ (TAB 1 UPDATE)
        else if (bodyData.actionType === "update") {
          setDanhSachLichSu(prev => {
            mangLichSuSauCapNhat = prev.map(i => i.id === bodyData.id ? { ...i, ...bodyData, suKien: suKienCapNhatTuan, syncStatus: "synced" } : i);
            return mangLichSuSauCapNhat;
          });
        }
        
        // 🎯 VÁCH HÀNH ĐỘNG 4: NẾU LÀ KHÂU THÊM MỚI DANH BẠ NÁI (TAB 2 MT_CREATE)
        else if (bodyData.actionType === "mt_create") {
          setDanhSachMaTai(prev => prev.map(i => i.id === bodyData.id ? { ...i, syncStatus: "synced" } : i));
          if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
            global.danhSachCapNhatTrangThai = global.danhSachCapNhatTrangThai.map(i => i.id === bodyData.id ? { ...i, syncStatus: "synced" } : i);
          }
        }

        // ĐỒNG BỘ LẬT NHÃN TRẠNG THÁI CHO LUỒNG LƯU / SỬA (CHO CẢ HAI MẢNG HIỂN THỊ MẶT TIỀN TAB 2)
        if (bodyData.actionType === "create" || bodyData.actionType === "update") {
          setDanhSachMaTai(prev => prev.map(heo => {
            if (heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiQuetChuan) {
              return { ...heo, trangThaiDienThoai: suKienQuetChuan, trangThai: suKienQuetChuan, trangThaiCotH: suKienQuetChuan };
            }
            return heo;
          }));

          if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
            global.danhSachCapNhatTrangThai = global.danhSachCapNhatTrangThai.map(heo => {
              if (heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiQuetChuan) {
                return { ...heo, trangThaiDienThoai: suKienQuetChuan, trangThai: suKienQuetChuan, trangThaiCotH: suKienQuetChuan };
              }
              return heo;
            });
          }
        }

        // 🎯 KÊNH NÉN GĂM CỨNG KẾT SẮT Ổ CỨNG TRÌNH TỰ CHỐNG SAI LỆCH KHI RELOAD
        try {
          const dataDemTho = await AsyncStorage.getItem(khoaDemTongHop);
          if (dataDemTho !== null) {
            const resultChuan = JSON.parse(dataDemTho);
            if (!Array.isArray(resultChuan.tab1)) resultChuan.tab1 = [];
            if (!Array.isArray(resultChuan.tab2)) resultChuan.tab2 = [];

            if (bodyData.actionType === "delete") {
              resultChuan.tab1 = resultChuan.tab1.filter(i => i && i.id !== bodyData.id);
              if (suKienQuetChuan === "Thải" || suKienQuetChuan === "THẢI") {
                resultChuan.tab2 = resultChuan.tab2.map(heo => {
                  if (heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiQuetChuan) {
                    return { ...heo, trangThaiDienThoai: "Chờ Phối", trangThai: "Chờ Phối", trangThaiCotH: "Chờ Phối" };
                  }
                  return heo;
                });
              }
            } 
            else if (bodyData.actionType === "create" || bodyData.actionType === "update") {
              const mangTab1SauLoc = resultChuan.tab1.filter(i => i && i.id !== bodyData.id);
              resultChuan.tab1 = [{ ...bodyData, suKien: suKienCapNhatTuan, syncStatus: "synced" }, ...mangTab1SauLoc];
              
              resultChuan.tab2 = resultChuan.tab2.map(heo => {
                if (heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiQuetChuan) {
                  return { ...heo, trangThaiDienThoai: suKienQuetChuan, trangThai: suKienQuetChuan, trangThaiCotH: suKienQuetChuan };
                }
                return heo;
              });
            } 
            else if (bodyData.actionType === "mt_create") {
              const mangTab2SauLoc = resultChuan.tab2.filter(i => i && i.id !== bodyData.id);
              resultChuan.tab2 = [{ ...bodyData, syncStatus: "synced" }, ...mangTab2SauLoc];
            }
            await AsyncStorage.setItem(khoaDemTongHop, JSON.stringify(resultChuan));
            console.log("🔒 LOCK OK DATA HEO THỊT & NÁI: Găm ổ cứng khép kín bảo mật vĩnh viễn!");
          }
        } catch (errCache) { console.log(errCache); }

        setDongBoStatus("✅ Da luu Cloud!");
      } else {
        setDongBoStatus("❌ Loi phan hoi vi mach tu Server");
      }
      if (typeof callback === 'function') callback(res); 
    })
    .catch((error) => { 
      console.log("Loi dut mach mang vat ly thực tế ngoài trại:", error);
      setDongBoStatus("❌ Mat ket noi mang");
      if (typeof callback === 'function') callback({ status: "error" });
    });
  };





  // ========================================================
  // 🚀 BẢN VÁ TỐI CAO: BỔ SUNG HÀM PHÁT LỆNH GHI NGẦM TRÊN BACKGROUND VacXin
  // ========================================================
   const xuLyMangCauHinhVacXin = (loaiHanhDongMang, dataBody) => {
    setDongBoStatus("⏳ Đang đồng bộ quy trình dịch tễ...");
    const emailChuan = userEmail ? userEmail.toLowerCase().trim() : "";
    
    let linkGui = `${WEB_APP_URL}?action=${loaiHanhDongMang}&id=${dataBody.id}&userEmail=${emailChuan}`;
    if (loaiHanhDongMang !== "delete_cauhinh") {
      // 🎯 ĐÃ VÁ: Nối thêm tham số ngayTiemTruoc vào đường link gửi dữ liệu lên Google Sheets
      linkGui += `&loaiHanhDong=${encodeURIComponent(dataBody.loaiHanhDong)}&soNgay=${Number(dataBody.soNgay)}&tenNhiemVu=${encodeURIComponent(dataBody.tenNhiemVu)}&ghiChu=${encodeURIComponent(dataBody.ghiChu || "")}&ngayTiemTruoc=${encodeURIComponent(dataBody.ngayTiemTruoc || "")}`;
    }

    fetch(linkGui, { method: 'GET', redirect: 'follow' })
      .then(res => res.json())
      .then(res => {
        if (res && res.status === 'success') {
          setDongBoStatus("✅ Đã đồng bộ!");
          
          // Cập nhật đè dữ liệu mới vào bộ nhớ đệm ổ cứng điện thoại (Cache)
          const khoaDemTongHop = `cache_tonghop_pigvn_${emailChuan}`;
          AsyncStorage.getItem(khoaDemTongHop).then(dataDemTho => {
            if (dataDemTho !== null) {
              const result = JSON.parse(dataDemTho);
              if (loaiHanhDongMang === "delete_cauhinh") {
                result.tab6 = (result.tab6 || []).filter(i => i.id !== dataBody.id);
              } else {
                const mangMoi = (result.tab6 || []).filter(i => i.id !== dataBody.id);
                result.tab6 = [...mangMoi, dataBody];
              }
              AsyncStorage.setItem(khoaDemTongHop, JSON.stringify(result));
            }
          });
        } else {
          setDongBoStatus("⚠️ Lỗi Server Sheets, hãy thử lại!");
        }
      })
      .catch(() => {
        setDongBoStatus("⚠️ Mất mạng ngầm. Hãy thử lại!");
      });
  };




  // --- HÀM 5: FORM NHẬP NHẬT KÝ HEO (TAB 1) ---
  // 🚀 BẢN VÁ TỐI CAO TAB 1: HÀM LƯU SỰ KIỆN CHÍNH CÓ CƠ CHẾ LÀM MỜ ĐỘNG CHUẨN XÁC 100%
  // ========================================================
   // ========================================================
  // 🚀 BẢN VÁ TỐI CAO TAB 1: TỰ ĐỘNG ĐỔI TRẠNG THÁI THỰC TẾ CHO KHAY GHIM TAB 2 LẬP TỨC
  // ========================================================
  const handleSaveNew = () => {
    if (!maTai.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Mã Tai!");
    if (canNhapSoHeo && !soHeo.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Số Heo!");

    const maTaiChuanQuet = maTai ? maTai.toString().trim().toUpperCase() : "";
    const suKienHienTaiChuan = suKien ? suKien.toString().trim().normalize("NFC") : "";

    const mangDanhBaTai = Array.isArray(danhSachMaTai) ? danhSachMaTai : [];
    const maTaiDaTonTai = mangDanhBaTai.some(heo => 
      heo && heo.maTai && heo.maTai.toString().trim().toUpperCase() === maTaiChuanQuet
    );

    if (!maTaiDaTonTai) {
      return Alert.alert(
        "❌ Chưa Có Mã Tai",
        `Mã tai [ ${maTaiChuanQuet} ] hiện chưa được tạo trong Sổ Mã Tai.\n\nVui lòng qua "Sổ Mã Tai" / Hoặc Bấm Thêm Nhanh để thêm mới con nái này vào sổ trước khi nhập sự kiện chăn nuôi!`,
        [{ text: "Tôi đã hiểu", style: "default" }]
      );
    }

       // ========================================================
    // 🚀 BẢN VÁ TỐI CAO: SỬA LỖI KHUYẾT CHỈ SỐ MẢNG - MỞ MẮT BỘ NÃO GÁC CỔNG QUY TRÌNH
    // ========================================================
    const lichSuRiengCuaNai = Array.isArray(danhSachLichSu)
      ? danhSachLichSu.filter(item => {
          if (!item || !item.maTai) return false;
          const maTaiDong = item.maTai.toString().trim().toUpperCase();
          if (item.actionType && item.actionType.toString().trim() === "delete") return false;
          return maTaiDong === maTaiChuanQuet;
        })
      : [];

    lichSuRiengCuaNai.sort((a, b) => {
      const timeA = parseToDateObject(a.ngay) ? parseToDateObject(a.ngay).getTime() : 0;
      const timeB = parseToDateObject(b.ngay) ? parseToDateObject(b.ngay).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return (b.id ? b.id.toString() : "").localeCompare(a.id ? a.id.toString() : "");
    });

    // 🎯 🚀 ĐÃ VÁ CHÍ MẠNG: Thêm chỉ số [0] để nhặt trúng 1 Object sự kiện thực tế gần nhất ngoài lán trại!
    const skGanNhatRiengCuaNai = lichSuRiengCuaNai.length > 0 ? lichSuRiengCuaNai[0] : null;
    let trangThaiLienTruocTho = "";

    if (skGanNhatRiengCuaNai) {
      // Bộ não đã mở mắt, bốc chuẩn đét nhãn sự kiện sống vừa nhập ngoài RAM!
      trangThaiLienTruocTho = skGanNhatRiengCuaNai.suKien ? skGanNhatRiengCuaNai.suKien.toString().trim().normalize("NFC") : "";
    } else {
      const heoGocTab2 = Array.isArray(danhSachMaTai) && danhSachMaTai.find(h => h && h.maTai && h.maTai.toString().toUpperCase().trim() === maTaiChuanQuet);
      if (heoGocTab2) {
        trangThaiLienTruocTho = heoGocTab2.trangThaiDienThoai || heoGocTab2.trangThaiCotH || heoGocTab2.trangThai || "";
        trangThaiLienTruocTho = trangThaiLienTruocTho.toString().trim().normalize("NFC");
      }
    }

    let trangThaiXacThuc = "";
    if (trangThaiLienTruocTho === "Đẻ" || trangThaiLienTruocTho === "Đcopy" || trangThaiLienTruocTho === "ĐẺ" || trangThaiLienTruocTho.includes("Đe")) {
      trangThaiXacThuc = "Đẻ";
    } else if (trangThaiLienTruocTho === "Phối" || trangThaiLienTruocTho === "PHỐI") {
      trangThaiXacThuc = "Phối";
    } else if (trangThaiLienTruocTho === "Cai Sữa" || trangThaiLienTruocTho === "Cai sữa" || trangThaiLienTruocTho.includes("Cai")) {
      trangThaiXacThuc = "Cai Sữa";
    } else if (trangThaiLienTruocTho === "Thải" || trangThaiLienTruocTho === "THẢI") {
      trangThaiXacThuc = "Thải";
    } else if (trangThaiLienTruocTho === "Lốc" || trangThaiLienTruocTho === "Sảy Thai" || trangThaiLienTruocTho === "Chờ Phối") {
      trangThaiXacThuc = "Chua_Phoi"; 
    } else if (trangThaiLienTruocTho === "") {
      trangThaiXacThuc = "Nai_Moi_Tinh";
    }


    if (suKienHienTaiChuan === "Cai Sữa" || suKienHienTaiChuan === "Cai sữa") {
      if (trangThaiXacThuc !== "Đẻ") {
        let loiNhanMoiTinh = "hiện đang ở trạng thái [" + (trangThaiXacThuc === "Phối" ? "Đang Bầu" : (trangThaiXacThuc === "Nai_Moi_Tinh" ? "✨ Mã nái mới tinh chưa có lịch sử" : "Chưa Nhập Đẻ")) + "] Bạn KHÔNG THỂ thực hiện hành động Cai Sữa khi chưa nhập Heo Đẻ!";
        setTxtAlertNoiDung({ 
          tieuDe: "Sai quy trình chăn nuôi", 
          maTai: maTaiChuanQuet, 
          hanhDong: "Cai Sữa tách đàn", 
          loiGiai: loiNhanMoiTinh
        });
        setIsQuyTrinhAlertVisible(true);
        return;
      }
    }

    if (trangThaiXacThuc !== "" && trangThaiXacThuc !== "Nai_Moi_Tinh") {
      if (trangThaiXacThuc === "Thải") {
        setTxtAlertNoiDung({ tieuDe: "Heo nái đã thải loại", maTai: maTaiChuanQuet, hanhDong: suKien, loiGiai: "đã bị thanh lý khỏi đàn. Bạn không thể ghi nhận thêm bất kỳ dữ liệu nào!" });
        setIsQuyTrinhAlertVisible(true);
        return;
      }

      if (trangThaiXacThuc === "Phối" && suKienHienTaiChuan === "Phối") {
        setTxtAlertNoiDung({ 
          tieuDe: "Sai quy trình chăn nuôi", 
          maTai: maTaiChuanQuet, 
          hanhDong: "Phối liên tiếp", 
          loiGiai: "đã được phối giống ở lứa này và hiện đang mang thai (Chưa nhập Đẻ/Lốc/Sảy thai). Bạn KHÔNG THỂ nhập hành động Phối tiếp!" 
        });
        setIsQuyTrinhAlertVisible(true);
        return; 
      }

      if (trangThaiXacThuc === "Đẻ") {
        if (suKienHienTaiChuan !== "Cai Sữa" && suKienHienTaiChuan !== "Cai sữa" && suKienHienTaiChuan !== "Thải") {
          setTxtAlertNoiDung({ 
            tieuDe: "Sai quy trình chăn nuôi", 
            maTai: maTaiChuanQuet, 
            hanhDong: suKien, 
            loiGiai: "Hiện Đang Đẻ (chưa nhập Cai Sữa). Bạn CHỈ ĐƯỢC nhập Cai Sữa hoặc Thải loại!" 
          });
          setIsQuyTrinhAlertVisible(true);
          return;
        }
      }

      if ((suKienHienTaiChuan === "Cai Sữa" || suKienHienTaiChuan === "Cai sữa") && trangThaiXacThuc === "Cai Sữa") {
        setTxtAlertNoiDung({ tieuDe: "Sai quy trình chăn nuôi", maTai: maTaiChuanQuet, hanhDong: "Cai Sữa liên tiếp", loiGiai: "đã được làm thủ tục Cai Sữa tách đàn rồi. Bạn không thể nhập Cai Sữa liên tiếp lượt nữa!" });
        setIsQuyTrinhAlertVisible(true);
        return;
      }
    }

    const dongMoi = {
      id: sinhIDDocBan("ID"), 
      ngay: ngayHienThi, 
      maTai: maTaiChuanQuet, 
      suKien: suKien, 
      soHeo: canNhapSoHeo ? laySoAnToan(soHeo) : "", 
      khoThai: suKien === "Đẻ" ? laySoAnToan(khoThai) : "",
      coiCoc: suKien === "Đẻ" ? laySoAnToan(coiCoc) : "",
      chetNgop: suKien === "Đẻ" ? laySoAnToan(chetNgop) : "",
      chonNuoi: suKien === "Đẻ" ? laySoAnToan(chonNuoi) : "",
      ghiChu: ghiChu,
      actionType: "create",
      syncStatus: "waiting" 
    };
    
    setDanhSachLichSu(prev => [dongMoi, ...prev]);

    // 🎯 🚀 THUẬT TOÁN ĐỘT PHÁ CẬP NHẬT CHÉO: Ép mảng toàn cục mặt tiền đổi trạng thái thực tế lập tức ngoài RAM!
    if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
      global.danhSachCapNhatTrangThai = global.danhSachCapNhatTrangThai.map(heo => {
        if (heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiChuanQuet) {
          return {
            ...heo,
            trangThaiDienThoai: suKien, // Gá sự kiện mới chớp nhoáng (Phối / Đẻ / Cai Sữa)
            trangThai: suKien,
            trangThaiCotH: suKien
          };
        }
        return heo;
      });
    }

    setMaTai(''); setSoHeo(''); setKhoThai(''); setCoiCoc(''); setChetNgop(''); setChonNuoi(''); setGhiChu('');
    setDongBoStatus(`⏳ Đang lưu...`);

    guiYeuCauMang(dongMoi, (res) => {
      if (res && res.status === 'success') {
        setDongBoStatus('✅ Đã Lưu Thành Công');
      } else {
        setDanhSachLichSu(prev => prev.filter(i => i.id !== dongMoi.id));
        setDongBoStatus('⚠️ Lỗi. Bấm Lại Cập Nhật');
        Alert.alert("Lỗi", "Không thể ghi nhận sự kiện lên hệ thống mạng Sheets.");
      }
    });
  };







    const handleEditClick = (item) => {
    setEditingId(item.id); 
    setEditMaTai(item.maTai); 
    setEditSuKien(item.suKien); 
    setEditSoHeo(String(item.soHeo));
    
    if (item.ngay) {
      const ngayGoc = item.ngay.toString().trim();
      if (ngayGoc.includes('/')) {
        setEditNgay(ngayGoc.substring(0, 10));
      } else {
        const d = new Date(ngayGoc);
        if (!isNaN(d.getTime())) {
          setEditNgay(formatVNDate(d));
        } else {
          setEditNgay(formatVNDate(new Date()));
        }
      }
    } else {
      setEditNgay(formatVNDate(new Date()));
    }
    
    // Nạp số liệu chi tiết và ghi chú cũ vào form sửa khi bấm nút Sửa
    setEditKhoThai(item.khoThai ? String(item.khoThai) : '');
    setEditCoiCoc(item.coiCoc ? String(item.coiCoc) : '');
    setEditChetNgop(item.chetNgop ? String(item.chetNgop) : '');
    setEditChonNuoi(item.chonNuoi ? String(item.chonNuoi) : '');
    setEditGhiChu(item.ghiChu || '');

    // ========================================================
    // 🟢 CHÈN CHUẨN XỊN: Nạp sẵn số tuần tuổi cũ của dòng Heo Thịt vào bộ nhớ sửa
    // giúp thanh chọn Picker mở ra hiển thị đúng tuần gốc của lô heo, không bị trống
    // ========================================================
    setEditTuanSua(item.tuanBan ? String(item.tuanBan) : '');
    // ========================================================

    setIsEditModalVisible(true); 
  };



  // 🟢 HÀM LƯU SỬA NHẬT KÝ HEO NÁI ĐẺ (TAB 1) - ĐÃ VÁ LỖI HIỆN (0 CON)
  // ========================================================
   // ========================================================
  // 🚀 BẢN VÁ TỐI CAO: HÀM SỬA NHẬT KÝ TAB 1 CÓ CƠ CHẾ LÀM MỜ ĐỘNG CHUẨN XÁC 100%
  // ========================================================
  const handleSaveEdit = () => {
    if (!editSoHeo.trim() && editCanNhapSoHeo && editSuKien !== "Đẻ") {
      return Alert.alert("Thông báo", "Vui lòng nhập Số Lượng heo!");
    }
    
    setIsEditModalVisible(false);
    setDongBoStatus("⏳ Đang Sửa...");

    const quanSoConThucTe = editSuKien === "Đẻ" ? laySoAnToan(editSoHeo) : (editSoHeo.trim() !== "" ? Number(editSoHeo) : "");

    const dongCapNhatMoi = {
      id: editingId, 
      userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
      actionType: "update",
      ngay: editNgay,
      maTai: editMaTai,   
      suKien: editSuKien, 
      soHeo: quanSoConThucTe, 
      khoThai: editSuKien === "Đẻ" ? editKhoThai : "",
      coiCoc: editSuKien === "Đẻ" ? editCoiCoc : "",
      chetNgop: editSuKien === "Đẻ" ? editChetNgop : "",
      chonNuoi: editSuKien === "Đẻ" ? editChonNuoi : "",
      ghiChu: editGhiChu.trim(),
      tuanBan: "",
      
      // 🎯 MỎ NEO MINI: Mặc định gá trạng thái chờ mạng để ép làm mờ dòng chữ 45% ngay lập tức ngoài bộ nhớ RAM!
      syncStatus: "waiting" 
    };

    // 🎯 CHỌC RAM MẶT TIỀN: Ép dòng vừa sửa trên màn hình chuyển sang trạng thái "waiting" để kích hoạt mờ cam lập tức
    setDanhSachLichSu(prev => prev.map(i => i.id === editingId ? { ...i, ...dongCapNhatMoi, syncStatus: "waiting" } : i));

    // Kích nổ lệnh gửi mạng link GET lên Server đám mây Google Sheets
    // Trình tự lật cờ sang "synced" rõ nét và lưu đè ổ cứng sẽ do hàm guiYeuCauMang điều phối tự động khi nhận tín hiệu success!
    guiYeuCauMang(dongCapNhatMoi, (res) => {
      if (res && res.status === 'success') {
        setDongBoStatus("✅ Đã Sửa thành công!");
      } else {
        // Nếu Server Drive báo lỗi mạng thực tế, khôi phục trạng thái sáng cũ để người dùng biết và bấm lại
        setDanhSachLichSu(prev => prev.map(i => i.id === editingId ? { ...i, syncStatus: "synced" } : i));
        setDongBoStatus("⚠️ Lỗi mạng. Không thể ghi đè dữ liệu sửa.");
      }
    });
  };





   // 🎯 LUỒNG XOÁ NHẬT KÝ SIÊU TỐC - ĐẬP TAN ĐỘ TRỄ TIMING MẠNG - CẬP NHẬT TRONG 0.01 GIÂY
   // ========================================================
  // 🟢 HÀM XÓA NHẬT KÝ CHỦ ĐỘNG - VÁ LỖI MẠNG AN TOÀN TUYỆT ĐỐI
  // ========================================================
   // 🎯 BẢN VÁ XÓA NHẬT KÝ V17: HOÀN TÁC Ô TUỔI LẺ VÀ SỐ TỔNG HEO THỊT LẬP TỨC TRONG 0.01 GIÂY
  const handleXoaNhatKyChuDong = (item) => {
    if (!item || !item.id) return;

    const checkSuKien = item.suKien ? item.suKien.toString().trim().toLowerCase() : "";
    const qtyToDelete = !item.soHeo || isNaN(item.soHeo) ? 0 : Number(item.soHeo);
    const weekStr = item.tuanBan ? item.tuanBan.toString().replace(/\D/g, '') : "";

    // 🌟 BƯỚC 1 (ĐÁNH LỪA NGƯỜI DÙNG TỨC THÌ): Nếu ca bị xóa thuộc về phân hệ lợn thịt thương phẩm
    if (checkSuKien.includes("nhập") || checkSuKien.includes("nhap") || checkSuKien.includes("hao") || checkSuKien.includes("bán") || checkSuKien.includes("ban")) {
      let targetKey = `${weekStr} Tuần`;
      if (weekStr === "3") targetKey = "theoMe";
      else if (weekStr === "4") targetKey = dataHeoThit && dataHeoThit["4 Tuần ( Cai Sữa )"] !== undefined ? "4 Tuần ( Cai Sữa )" : "caiSua";

      // Tiến hành lật ngược phép tính toán học ngoài bộ nhớ RAM thiết bị
      setDataHeoThit(prev => {
        if (!prev || !prev[targetKey]) return prev;
        const nextState = { ...prev };
        let currentQtyOfCell = Number(nextState[targetKey]) || 0;

        if (checkSuKien.includes("nhập") || checkSuKien.includes("nhap")) {
          // Xóa ca nhập -> Phải trừ bớt lợn đi ngoài RAM
          nextState[targetKey] = Math.max(0, currentQtyOfCell - qtyToDelete).toString();
        } else if (checkSuKien.includes("hao") || checkSuKien.includes("bán") || checkSuKien.includes("ban")) {
          // Xóa ca bán / ca chết -> Phải cộng trả lợn về lại ô chuồng
          nextState[targetKey] = (currentQtyOfCell + qtyToDelete).toString();
        }

        // 🧠 TỰ ĐỘNG TÍNH TOÁN LẠI 5 KHỐI GIAI ĐOẠN ĐỂ CẬP NHẬT LUÔN CẢ SỐ TỔNG ĐÀN TRÊN BANNER ĐỈNH
        const nT5  = Number(nextState["5 Tuần"]) || 0;  const nT6  = Number(nextState["6 Tuần"]) || 0;
        const nT7  = Number(nextState["7 Tuần"]) || 0;  const nT8  = Number(nextState["8 Tuần"]) || 0;
        const nT9  = Number(nextState["9 Tuần"]) || 0;  const nT10 = Number(nextState["10 Tuần"]) || 0;
        const nT11 = Number(nextState["11 Tuần"]) || 0; const nT12 = Number(nextState["12 Tuần"]) || 0;
        const nT13 = Number(nextState["13 Tuần"]) || 0; const nT14 = Number(nextState["14 Tuần"]) || 0;
        const nT15 = Number(nextState["15 Tuần"]) || 0; const nT16 = Number(nextState["16 Tuần"]) || 0;
        const nT17 = Number(nextState["17 Tuần"]) || 0; const nT18 = Number(nextState["18 Tuần"]) || 0;
        const nT19 = Number(nextState["19 Tuần"]) || 0; const nT20 = Number(nextState["20 Tuần"]) || 0;
        const nT21 = Number(nextState["21 Tuần"]) || 0; const nT22 = Number(nextState["22 Tuần"]) || 0;
        const nT23 = Number(nextState["23 Tuần"]) || 0; const nT24 = Number(nextState["24 Tuần"]) || 0;
        const nT25 = Number(nextState["25 Tuần"]) || 0; const nT26 = Number(nextState["26 Tuần"]) || 0;
        const nT27 = Number(nextState["27 Tuần"]) || 0; const nT28 = Number(nextState["28 Tuần"]) || 0;
        const nT29 = Number(nextState["29 Tuần"]) || 0; const nT30 = Number(nextState["30 Tuần"]) || 0;

        nextState.giaiDoan3 = (nT5 + nT6 + nT7 + nT8 + nT9).toString();
        nextState.giaiDoan4 = (nT10 + nT11 + nT12 + nT13 + nT14 + nT15).toString();
        nextState.giaiDoan5 = (nT16 + nT17 + nT18 + nT19 + nT20).toString();
        nextState.giaiDoan6 = (nT21 + nT22 + nT23 + nT24 + nT25).toString();
        nextState.giaiDoan7 = (nT26 + nT27 + nT28 + nT29 + nT30).toString();

        return nextState;
      });
    }

    const dongMuonXoa = {
      id: item.id,
      userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
      actionType: "delete",
      ngay: "", maTai: item.maTai || "", suKien: item.suKien || "", giong: "", lua: "", 
      khoThai: "", coiCoc: "", chetNgop: "", chonNuoi: "", ghiChu: ""
    };

    // Ép lọc mất dòng nhật ký ra khỏi giao diện đáy tức thì trong 0.01s
    setDanhSachLichSu(prev => prev.filter(i => i.id !== item.id));
    setDongBoStatus(`⏳ Đang hoàn tác và xóa nhật ký lô tuần...`);
    
    // 🌟 BƯỚC 2: Gọi cổng mạng chạy ngầm ẩn sau lưng để xóa vĩnh viễn trên Drive Google Sheets
    guiYeuCauMang(dongMuonXoa, (res) => {
      if (res && res.status === 'success') {
        setDongBoStatus('✅ Đã xoá dòng Nhật Ký thành công vĩnh viễn!');
      } else {
        setDongBoStatus('⚠️ Cổng mạng chậm ngầm. Số liệu đã được bảo toàn nội bộ.');
      }
    });
  };


  // 🟢 HÀM MỞ HỘP THOẠI VÀ LƯU THỦ TỤC CAI SỮA ĐẦY ĐỦ THÔNG SỐ (TAB 4)
  // ========================================================
   const handleMoModalCaiSuaNhanh = (itemNai) => {
    if (!itemNai) return;
    const maTaiInHoa = itemNai.maTai ? itemNai.maTai.toString().toUpperCase().trim() : "";
    if (!maTaiInHoa) return;

    // 🌟 1. Quét RAM lấy trọn bộ nhật ký lịch sử thực tế của riêng con nái này
   const lichSuCuaNai = Array.isArray(danhSachLichSu)
            ? danhSachLichSu.filter(i => {
                // 🎯 CHÈN CHUẨN VÀNG: Nếu dòng nhật ký mang mác xóa "delete", LOẠI BỎ NGAY LẬP TỨC để khôi phục dòng cũ
                if (!i || !i.maTai || i.actionType === "delete" || i.actionType === "mt_delete") return false;
                if (i.maTai.toString().toUpperCase().trim() !== maTaiInHoa) return false;
                const skTho = i.suKien ? i.suKien.toString().trim().normalize("NFC") : "";
                return skTho === "Cai Sữa" || skTho === "Đẻ";
              })
            : [];
    // 🌟 2. Sắp xếp đưa dòng sự kiện có mốc ngày thực hiện mới gõ nhất lên vị trí Index 0
    lichSuCuaNai.sort((a, b) => {
      const timeA = parseToDateObject(a.ngay) ? parseToDateObject(a.ngay).getTime() : 0;
      const timeB = parseToDateObject(b.ngay) ? parseToDateObject(b.ngay).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return (b.id ? b.id.toString() : "").localeCompare(a.id ? a.id.toString() : "");
    });

    // 🌟 3. Tóm lấy hành động mới nhất thực tế hiện tại trên điện thoại
    const dongNhatKyMoiNhat = lichSuCuaNai.length > 0 ? lichSuCuaNai[0] : null;
    const hanhDongMoiNhat = dongNhatKyMoiNhat ? dongNhatKyMoiNhat.suKien.toString().trim().normalize("NFC") : "";

    // ========================================================
    // 🛑 CHẶN QUY TRÌNH: Nếu RAM báo hành động mới nhất đã là Cai Sữa, chặn đứng lập tức!
    // ========================================================
    if (hanhDongMoiNhat === "Cai Sữa" || itemNai.trangThaiHienTai === "Cai Sữa") {
      return Alert.alert(
        "⚠️ Kiểm Tra Lại",
        `Heo nái [ ${maTaiInHoa} ] hiện tại đã được Cai Sữa rồi.\n\nNếu vẫn lỗi, bấm lại nút Cập Nhật`,
        [{ text: "Đã hiểu", style: "default" }]
      );
    }
    // ========================================================

    // Nếu kiểm tra an toàn (nái đang Đẻ nuôi con bình thường), mở khóa Pop-up nhập liệu
    setCaiSuaHeoItem(itemNai);
    setCaiSuaNgay(formatVNDate(new Date())); // Mặc định ngày hôm nay
    setCaiSuaHeoSoCon(''); // Trống số lượng con
    setIsCaiSuaModalVisible(true);
  };

   const handleLuuCaiSuaNhanhTaiChuong = () => {
    if (!caiSuaHeoItem) return;
    const maTaiInHoa = caiSuaHeoItem.maTai ? caiSuaHeoItem.maTai.toUpperCase().trim() : "";
    if (!maTaiInHoa) return;
    if (!caiSuaSoCon.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Số Heo Cai Sữa!");

    setDongBoStatus(`⏳ Đang lưu Cai Sữa: ${maTaiInHoa}...`);
    setIsCaiSuaModalVisible(false);

    // 🌟 TẠO DÒNG TẠM THỜI TRÊN RAM ĐIỆN THOẠI CHỜ GỬI LÊN MẠNG
    const dongMoiCaiSua = {
      id: sinhIDDocBan("ID"),
      ngay: caiSuaNgay, 
      maTai: maTaiInHoa,
      suKien: "Cai Sữa",
      soHeo: laySoAnToan(caiSuaSoCon), 
      khoThai: "", coiCoc: "", chetNgop: "", chonNuoi: "",
      ghiChu: "Cai sữa nhanh tại ô chuồng đẻ",
      syncStatus: "waiting", // Đóng mác chờ mạng tạm thời
      actionType: "create"
    };

    // Ghim tạm vào RAM Nhật Ký để đổi màu nút bấm tức thì
    setDanhSachLichSu(prev => [dongMoiCaiSua, ...prev]);

    // Bắn dữ liệu chạy ngầm lên Google Sheet
    guiYeuCauMang(dongMoiCaiSua, (res) => {
      if (res && res.status === 'success') {
        setDongBoStatus(`✅ Nái ${maTaiInHoa} đã lưu ${dongMoiCaiSua.soHeo} con thành công!`);
        // 🟢 VÁ TRỰC DIỆN: Mạng đã lưu xong vĩnh viễn lên Google Sheet, lập tức đổi mác sang synced.
        // Khi mác đổi sang synced, màng lọc đầu Tab 4 sẽ biết dữ liệu đã an toàn và ẩn heo đi lập tức!
        setDanhSachLichSu(prev => prev.map(i => i.id === dongMoiCaiSua.id ? { ...i, syncStatus: "synced" } : i));
      } else {
        setDongBoStatus('⚠️ Kết nối chậm ngầm. Đã cập nhật sổ liệu nội bộ.');
        // Nếu lỗi mạng, giữ nguyên mác waiting để người nuôi biết chưa lên Sheet
      }
    });
  };

    // ========================================================
  // 🟢 HÀM LƯU BIẾN ĐỘNG HEO THỊT THEO LÔ TUẦN TUỔI (TAB 5)
  // ========================================================
  const handleMoModalHeoThit = (loaiHanhDong) => {
    setHeoThitActionType(loaiHanhDong);
    setHeoThitNgay(formatVNDate(new Date()));
    setHeoThitSoCon('');
    setHeoThitGhiChu('');
    // 🎯 Để trống rỗng để bắt buộc khách phải bấm chọn tuần, không tự động nhảy số bừa bãi
    setHeoThitTuanChon(""); 
    setIsHeoThitModalVisible(true);
  };

 
  // 🟢 BẢN VÁ TỐI CAO: THÔNG MẠCH LOGIC LƯU HEO THỊT - CHỐNG BÁO LỖI LÔ ẢO
  // ========================================================
    // 🎯 BẢN VÁ ĐÁNH LỪA NGƯỜI DÙNG TỨC THÌ V13: NHẢY QUÂN SỐ TRÊN RAM TRONG 0.01 GIÂY NGAY KHI BẤM NÚT
  const handleLuuHanhDongHeoThit = () => {
    const oTuanChonChuan = heoThitTuanChon ? heoThitTuanChon.toString().trim() : "";
    if (oTuanChonChuan === "" || oTuanChonChuan === "CHON_TUAN" || oTuanChonChuan.toLowerCase().includes("chon")) {
      return Alert.alert(
        "⚠️ Chưa Chọn Tuần", 
        `Bạn vui lòng chọn Tuần trước khi tiến hành ${heoThitActionType}!`,
        [{ text: "Tôi sẽ chọn", style: "default" }]
      );
    }
    
    if (!heoThitSoLuong || heoThitSoLuong.toString().trim() === "") {
      return Alert.alert("Thông báo", "Vui lòng nhập Số Lượng heo!");
    }
    
    setIsHeoThitModalVisible(false); 
    setDongBoStatus(`⏳ Đang ${heoThitActionType} tuần ${oTuanChonChuan}...`);

    const soConTacDong = laySoAnToan(heoThitSoLuong);
    
    // 🧭 ĐỊNH VỊ TỌA ĐỘ CHÍNH XÁC Ô CHÂN RAM TRÊN ĐIỆN THOẠI
    let khoaThucTeRAM = `${oTuanChonChuan} Tuần`;
    if (oTuanChonChuan === "theoMe" || oTuanChonChuan === "Theo Mẹ" || oTuanChonChuan === "3") {
      khoaThucTeRAM = "theoMe";
    } else if (oTuanChonChuan === "4 Tuần ( Cai Sữa )" || oTuanChonChuan === "caiSua" || oTuanChonChuan === "4") {
      khoaThucTeRAM = dataHeoThit && dataHeoThit["4 Tuần ( Cai Sữa )"] !== undefined ? "4 Tuần ( Cai Sữa )" : "caiSua";
    }

    // Đồng bộ chuẩn số phẳng sang Drive Google Sheets
    let soTuanGuiServer = oTuanChonChuan;
    if (soTuanGuiServer === "theoMe" || soTuanGuiServer === "Theo Mẹ") soTuanGuiServer = "3"; 
    else if (soTuanGuiServer === "caiSua" || soTuanGuiServer === "4 Tuần ( Cai Sữa )") soTuanGuiServer = "4";

    const dongMoiHeoThit = {
      id: sinhIDDocBan("ID"),                     
      userEmail: userEmail || "",                  
      ngay: heoThitNgay,                           
      maTai: heoThitActionType,                    
      suKien: heoThitActionType,                   
      soHeo: soConTacDong,          
      ghiChu: heoThitGhiChu ? heoThitGhiChu.trim() : "", 
      tuanBan: soTuanGuiServer, 
      syncStatus: "waiting",
      actionType: "create"
    };

    // 🌟 BƯỚC 1 (ĐÁNH LỪA THẦN TỐC): Đẩy dòng mới vào danh sách lịch sử khay đáy hiển thị dạng mờ cam
    setDanhSachLichSu(prev => [dongMoiHeoThit, ...prev]);

    // 🌟 BƯỚC 2 (HIỆN RA LIỀN): Ép ma trận ô tuần lẻ cộng/trừ số lượng văng số trực tiếp trên RAM ngay lập tức
    setDataHeoThit(prev => {
      if (!prev) return prev;
      let soConCu = prev[khoaThucTeRAM] !== undefined ? Number(prev[khoaThucTeRAM]) : 0;
      let soConMoi = soConCu;

      if (heoThitActionType === "Nhập Đàn") {
        soConMoi = soConCu + soConTacDong;
      } else if (heoThitActionType === "Hao Hụt" || heoThitActionType === "Bán") {
        soConMoi = Math.max(0, soConCu - soConTacDong);
      }

      // Tự động tính toán lại các mốc Giai đoạn để bọc lót đồng bộ giao diện
      const ketQuaMoi = { ...prev, [khoaThucTeRAM]: soConMoi.toString() };
      
      // Đồng bộ nạp lại giá trị tổng cho các biến nội bộ
      const nT5  = Number(ketQuaMoi["5 Tuần"]) || 0; const nT6  = Number(ketQuaMoi["6 Tuần"]) || 0;
      const nT7  = Number(ketQuaMoi["7 Tuần"]) || 0; const nT8  = Number(ketQuaMoi["8 Tuần"]) || 0;
      const nT9  = Number(ketQuaMoi["9 Tuần"]) || 0; const nT10 = Number(ketQuaMoi["10 Tuần"]) || 0;
      const nT11 = Number(ketQuaMoi["11 Tuần"]) || 0; const nT12 = Number(ketQuaMoi["12 Tuần"]) || 0;
      const nT13 = Number(ketQuaMoi["13 Tuần"]) || 0; const nT14 = Number(ketQuaMoi["14 Tuần"]) || 0;
      const nT15 = Number(ketQuaMoi["15 Tuần"]) || 0; const nT16 = Number(ketQuaMoi["16 Tuần"]) || 0;
      const nT17 = Number(ketQuaMoi["17 Tuần"]) || 0; const nT18 = Number(ketQuaMoi["18 Tuần"]) || 0;
      const nT19 = Number(ketQuaMoi["19 Tuần"]) || 0; const nT20 = Number(ketQuaMoi["20 Tuần"]) || 0;
      const nT21 = Number(ketQuaMoi["21 Tuần"]) || 0; const nT22 = Number(ketQuaMoi["22 Tuần"]) || 0;
      const nT23 = Number(ketQuaMoi["23 Tuần"]) || 0; const nT24 = Number(ketQuaMoi["24 Tuần"]) || 0;
      const nT25 = Number(ketQuaMoi["25 Tuần"]) || 0; const nT26 = Number(ketQuaMoi["26 Tuần"]) || 0;
      const nT27 = Number(ketQuaMoi["27 Tuần"]) || 0; const nT28 = Number(ketQuaMoi["28 Tuần"]) || 0;
      const nT29 = Number(ketQuaMoi["29 Tuần"]) || 0; const nT30 = Number(ketQuaMoi["30 Tuần"]) || 0;

      ketQuaMoi.giaiDoan3 = (nT5 + nT6 + nT7 + nT8 + nT9).toString();
      ketQuaMoi.giaiDoan4 = (nT10 + nT11 + nT12 + nT13 + nT14 + nT15).toString();
      ketQuaMoi.giaiDoan5 = (nT16 + nT17 + nT18 + nT19 + nT20).toString();
      ketQuaMoi.giaiDoan6 = (nT21 + nT22 + nT23 + nT24 + nT25).toString();
      ketQuaMoi.giaiDoan7 = (nT26 + nT27 + nT28 + nT29 + nT30).toString();

      return ketQuaMoi;
    });

    // 🌟 BƯỚC 3: Phát tín hiệu chạy mạng đẩy dữ liệu lên Google Sheets ẩn sau hậu trường
    guiYeuCauMang(dongMoiHeoThit, (res) => {
      const laGiaoDichThanhCong = res && (res.status === 'success' || res.status === 'synced' || JSON.stringify(res).toLowerCase().includes('success') || res === 'success');

      if (laGiaoDichThanhCong) {
        setDongBoStatus(`✅ Đã Lưu số heo Tuần ${oTuanChonChuan}!`);
        // Đổi màu dòng lịch sử sang mác synced cho uy tín, giữ nguyên vẹn quân số RAM vừa nhảy
        setDanhSachLichSu(prev => prev.map(i => i.id === dongMoiHeoThit.id ? { ...i, syncStatus: "synced" } : i));
        setHeoThitSoCon(''); setHeoThitGhiChu('');
      } else {
        // Luồng hoàn tác trả lại số lợn cũ nếu mất mạng thật sự giữa chừng để bảo vệ RAM sạch
        setDongBoStatus('⚠️ Kết nối Server lỗi. Đã hoàn tác số liệu nội bộ.');
        setDanhSachLichSu(prev => prev.filter(i => i.id !== dongMoiHeoThit.id));
        
        setDataHeoThit(prev => {
          if (!prev) return prev;
          let soConHienTai = prev[khoaThucTeRAM] !== undefined ? Number(prev[khoaThucTeRAM]) : 0;
          let hoanTacSoCon = soConHienTai;
          if (heoThitActionType === "Nhập Đàn") hoanTacSoCon = Math.max(0, soConHienTai - soConTacDong);
          else if (heoThitActionType === "Hao Hụt" || heoThitActionType === "Bán") hoanTacSoCon = soConHienTai + soConTacDong;
          return { ...prev, [khoaThucTeRAM]: hoanTacSoCon.toString() };
        });
        setHeoThitSoCon(''); setHeoThitGhiChu('');
      }
    });
  };


  
  // 🟢 HÀM MỞ POP-UP SỬA HEO THỊT - ĐÃ VÁ ĐỊNH DẠNG NGÀY dd/mm/yyyy
  // ========================================================
  const handleMoSuaHeoThit = (item) => {
    if (!item) return;
    setSuaHeoThitId(item.id);
    setSuaHeoThitActionType(item.suKien || 'Hao Hụt');
    setSuaHeoThitSoCon(item.soHeo ? String(item.soHeo) : '');
    setSuaHeoThitGhiChu(item.ghiChu || '');
    setSuaHeoThitTuanChon(item.tuanBan ? String(item.tuanBan) : 'CHON_TUAN');

    // 🎯 THUẬT TOÁN ĐỒNG BỘ: Ép chuỗi ngày cũ từ Sheet về chuẩn định dạng dd/mm/yyyy
    if (item.ngay) {
      const ngayGoc = item.ngay.toString().trim();
      if (ngayGoc.includes('/')) {
        // Nếu đã có định dạng gạch chéo sẵn, cắt lấy đúng 10 ký tự đầu tiên (dd/mm/yyyy)
        setSuaHeoThitNgay(ngayGoc.substring(0, 10));
      } else {
        // Nếu là định dạng thời gian máy chủ hệ thống, bọc qua hàm định dạng formatVNDate của bạn
        const d = new Date(ngayGoc);
        if (!isNaN(d.getTime())) {
          setSuaHeoThitNgay(formatVNDate(d));
        } else {
          setSuaHeoThitNgay(formatVNDate(new Date()));
        }
      }
    } else {
      setSuaHeoThitNgay(formatVNDate(new Date()));
    }

    setIsSuaHeoThitModalVisible(true);
  };


  // 🟢 HÀM LƯU SỬA HEO THỊT - BẢN VÁ HOÀN TRẢ VÀ BÙ TRỪ ĐA TUẦN TUỔI REAL-TIME
  // ========================================================
   // 🎯 BẢN VÁ LƯU SỬA HEO THỊT VẬN HÀNH SIÊU TỐC V16: KHÔNG BIẾN TIẾNG VIỆT, TỰ ĐỘNG CẬP NHẬT TỔNG ĐÀN
  const handleLuuSuaHeoThit = () => {
    if (!suaHeoThitTuanChon || suaHeoThitTuanChon === "CHON_TUAN" || suaHeoThitTuanChon.trim() === "") {
      return Alert.alert("⚠️ Thiếu Số Liệu Lô", "Vui lòng chọn số Tuần Tuổi của lô heo thịt!");
    }
    if (!suaHeoThitSoLuong || !suaHeoThitSoLuong.toString().trim()) {
      return Alert.alert("Thông báo", "Vui lòng nhập Số Lượng heo!");
    }

    // 1. LẤY SỐ LIỆU CŨ TỪ BỘ NHỚ RAM ĐỂ LÀM PHÉP HOÀN TÁC TOÁN HỌC KHÉP KÍN
    const currentLog = Array.isArray(danhSachLichSu) ? danhSachLichSu.find(i => i && i.id === suaHeoThitId) : null;
    const oldQty = currentLog ? laySoAnToan(currentLog.soHeo) : 0;
    const oldWeekStr = currentLog && currentLog.tuanBan !== undefined ? currentLog.tuanBan.toString().trim() : "";
    
    // 2. LẤY SỐ LIỆU MỚI TOÀN DIỆN VỪA GÕ TRÊN POP-UP MODAL
    const newQty = laySoAnToan(suaHeoThitSoLuong);
    const newWeekStr = suaHeoThitTuanChon.toString().trim();

    // 🧭 ĐỊNH VỊ TỌA ĐỘ Ô TUẦN CŨ
    let oldTargetKey = `${oldWeekStr} Tuần`;
    if (oldWeekStr === "theoMe" || oldWeekStr === "3") oldTargetKey = "theoMe";
    else if (oldWeekStr === "4" || oldWeekStr === "caiSua") {
      oldTargetKey = dataHeoThit && dataHeoThit["4 Tuần ( Cai Sữa )"] !== undefined ? "4 Tuần ( Cai Sữa )" : "caiSua";
    }

    // 🧭 ĐỊNH VỊ TỌA ĐỘ Ô TUẦN MỚI
    let newTargetKey = `${newWeekStr} Tuần`;
    if (newWeekStr === "theoMe" || newWeekStr === "3") newTargetKey = "theoMe";
    else if (newWeekStr === "4" || newWeekStr === "caiSua") {
      newTargetKey = dataHeoThit && dataHeoThit["4 Tuần ( Cai Sữa )"] !== undefined ? "4 Tuần ( Cai Sữa )" : "caiSua";
    }

    // Đóng sập Pop-up sửa lập tức trong 0.01 giây
    setIsSuaHeoThitModalVisible(false);
    setDongBoStatus(`⏳ Đang lưu chỉnh sửa lô tuần ${newWeekStr}...`);

    const dongCapNhatMoi = {
      id: suaHeoThitId,
      userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
      actionType: "update", 
      ngay: suaHeoThitNgay,
      maTai: suaHeoThitActionType,   
      suKien: suaHeoThitActionType, 
      soHeo: newQty,
      khoThai: "", coiCoc: "", chetNgop: "", chonNuoi: "", 
      ghiChu: suaHeoThitGhiChu ? suaHeoThitGhiChu.trim() : "",
      tuanBan: newWeekStr 
    };

    // Đẩy dòng nhật ký sửa đổi vào khay đáy hiển thị tức thì dạng mờ cam gác cổng mạng
    setDanhSachLichSu(prev => prev.map(i => i.id === suaHeoThitId ? { ...i, ...dongCapNhatMoi, syncStatus: "waiting" } : i));

    // 🌟 BƯỚC ĐÁNH LỪA NGƯỜI DÙNG: Ép ma trận ô dãn số nhảy kết quả cộng/trừ chéo tức thì ngoài RAM
    setDataHeoThit(prev => {
      if (!prev) return prev;
      const nextState = { ...prev };

      // BƯỚC A: HOÀN TRẢ LẠI QUÂN SỐ GỐC CHO Ô TUẦN CŨ (Xóa bỏ hoàn toàn lệnh cũ)
      let oldCellQty = nextState[oldTargetKey] !== undefined ? Number(nextState[oldTargetKey]) : 0;
      if (suaHeoThitActionType === "Nhập Đàn") {
        nextState[oldTargetKey] = Math.max(0, oldCellQty - oldQty).toString(); // Trừ bớt số lợn đã nhập nhầm vào ô tuần cũ
      } else if (suaHeoThitActionType === "Hao Hụt" || suaHeoThitActionType === "Bán") {
        nextState[oldTargetKey] = (oldCellQty + oldQty).toString(); // Cộng trả lại số lợn đã trừ hụt của ô tuần cũ
      }

      // BƯỚC B: ÁP DỤNG QUÂN SỐ MỚI TINH VÀO Ô TUẦN MỚI CHỌN ĐỔI CHỮ
      let newCellQty = nextState[newTargetKey] !== undefined ? Number(nextState[newTargetKey]) : 0;
      if (suaHeoThitActionType === "Nhập Đàn") {
        nextState[newTargetKey] = (newCellQty + newQty).toString(); // Cộng số lượng mới vào ô tuần mới chọn sửa
      } else if (suaHeoThitActionType === "Hao Hụt" || suaHeoThitActionType === "Bán") {
        nextState[newTargetKey] = Math.max(0, newCellQty - newQty).toString(); // Trừ số lượng mới đi ở ô tuần mới chọn sửa
      }

      // 🧠 ĐỒNG BỘ: TỰ ĐỘNG TÍNH TOÁN LẠI 5 KHỐI GIAI ĐOẠN ĐỂ CẬP NHẬT LUÔN CẢ SỐ TỔNG ĐÀN TRÊN BANNER ĐỈNH
      const nT5  = Number(nextState["5 Tuần"]) || 0;  const nT6  = Number(nextState["6 Tuần"]) || 0;
      const nT7  = Number(nextState["7 Tuần"]) || 0;  const nT8  = Number(nextState["8 Tuần"]) || 0;
      const nT9  = Number(nextState["9 Tuần"]) || 0;  const nT10 = Number(nextState["10 Tuần"]) || 0;
      const nT11 = Number(nextState["11 Tuần"]) || 0; const nT12 = Number(nextState["12 Tuần"]) || 0;
      const nT13 = Number(nextState["13 Tuần"]) || 0; const nT14 = Number(nextState["14 Tuần"]) || 0;
      const nT15 = Number(nextState["15 Tuần"]) || 0; const nT16 = Number(nextState["16 Tuần"]) || 0;
      const nT17 = Number(nextState["17 Tuần"]) || 0; const nT18 = Number(nextState["18 Tuần"]) || 0;
      const nT19 = Number(nextState["19 Tuần"]) || 0; const nT20 = Number(nextState["20 Tuần"]) || 0;
      const nT21 = Number(nextState["21 Tuần"]) || 0; const nT22 = Number(nextState["22 Tuần"]) || 0;
      const nT23 = Number(nextState["23 Tuần"]) || 0; const nT24 = Number(nextState["24 Tuần"]) || 0;
      const nT25 = Number(nextState["25 Tuần"]) || 0; const nT26 = Number(nextState["26 Tuần"]) || 0;
      const nT27 = Number(nextState["27 Tuần"]) || 0; const nT28 = Number(nextState["28 Tuần"]) || 0;
      const nT29 = Number(nextState["29 Tuần"]) || 0; const nT30 = Number(nextState["30 Tuần"]) || 0;

      nextState.giaiDoan3 = (nT5 + nT6 + nT7 + nT8 + nT9).toString();
      nextState.giaiDoan4 = (nT10 + nT11 + nT12 + nT13 + nT14 + nT15).toString();
      nextState.giaiDoan5 = (nT16 + nT17 + nT18 + nT19 + nT20).toString();
      nextState.giaiDoan6 = (nT21 + nT22 + nT23 + nT24 + nT25).toString();
      nextState.giaiDoan7 = (nT26 + nT27 + nT28 + nT29 + nT30).toString();

      return nextState;
    });

    // 3. Kích nổ lệnh mạng đẩy dữ liệu lên Google Sheets ẩn sau hậu trường
    guiYeuCauMang(dongCapNhatMoi, (res) => {
      const laGiaoDichThanhCong = res && (res.status === 'success' || res.status === 'synced' || JSON.stringify(res).toLowerCase().includes('success') || res === 'success');

      if (laGiaoDichThanhCong) {
        setDongBoStatus("✅ Đã cập nhật Heo Thịt thành công!");
        setDanhSachLichSu(prev => prev.map(i => i.id === suaHeoThitId ? { ...i, syncStatus: "synced" } : i));
      } else {
        // Luồng hoàn tác trả lợn về đúng vị trí cũ nếu mạng rớt thật sự giữa chừng
        setDongBoStatus("⚠️ Kết nối mạng lỗi. Đã hoàn tác số liệu cũ.");
        setDanhSachLichSu(prev => prev.map(i => i.id === suaHeoThitId ? { ...i, syncStatus: "synced" } : i));
        
        setDataHeoThit(prev => {
          if (!prev) return prev;
          const failState = { ...prev };
          
          let qCu = failState[oldTargetKey] !== undefined ? Number(failState[oldTargetKey]) : 0;
          if (suaHeoThitActionType === "Nhập Đàn") failState[oldTargetKey] = (qCu + oldQty).toString();
          else if (suaHeoThitActionType === "Hao Hụt" || suaHeoThitActionType === "Bán") failState[oldTargetKey] = Math.max(0, qCu - oldQty).toString();

          let qMoi = failState[newTargetKey] !== undefined ? Number(failState[newTargetKey]) : 0;
          if (suaHeoThitActionType === "Nhập Đàn") failState[newTargetKey] = Math.max(0, qMoi - newQty).toString();
          else if (suaHeoThitActionType === "Hao Hụt" || suaHeoThitActionType === "Bán") failState[newTargetKey] = (qMoi + newQty).toString();

          return failState;
        });
      }
    });
  };









  // ========================================================
  // 🚀 KHỐI 3/4: HÀM THÊM NHANH MODAL MINI - GIỮ CỨNG MÃ TAI NGOÀI KHAY CHÍNH
  // ========================================================
  const handleQuickSaveHeoMoi = () => {
    if (isQuickSaving) return;

    setIsQuickSaving(true);
    setDongBoStatus('⏳ Đang tạo nhanh mã tai vào sổ...');

    const maTaiChuanInHoa = maTai ? maTai.toUpperCase().trim() : "";
    const idDocBanQuickAdd = "MT_" + new Date().getTime(); 
    let giongHeoChuanGhi = quickGiong && quickGiong.trim() !== "" ? quickGiong.trim() : "Nái Nhà";

    const dongMoiMaTai = {
      id: idDocBanQuickAdd,
      maTai: maTaiChuanInHoa,
      giong: giongHeoChuanGhi,
      lua: quickLua ? quickLua.toString().trim() : "Hậu Bị",
      luaHienThiThongMinh: quickLua ? quickLua.toString().trim() : "Hậu Bị",
      ngayPhoi: "",
      ngayCotI: "---",
      ngayDuKienDeMoi: "---",
      
      trangThaiDienThoai: "Chờ Phối", 
      trangThai: "Chờ Phối",
      trangThaiCotH: "Chờ Phối",
      
      ghiChu: "Them nhanh tu o go mini",
      userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
      vuaNhapMoi: "chua_reload", // Ep ga chu de hien thi song hanh ca tren lan duoi
      syncStatus: "waiting", // Mac dinh lam mo 50%
      actionType: "mt_create" 
    };

    // Chọc RAM lập tức hiển thị đồng thời cả 2 khay mặt tiền trong 0.001s
    setDanhSachMaTai(prev => [dongMoiMaTai, ...prev]);
    if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
      global.danhSachCapNhatTrangThai = [dongMoiMaTai, ...global.danhSachCapNhatTrangThai];
    }

    guiYeuCauMang(dongMoiMaTai, async (ketQua) => {
      setIsQuickSaving(false);

      if (ketQua && ketQua.status === 'success') {
        setIsQuickAddModalVisible(false);
        
        // 🎯 ĐỘT PHÁ THAO TÁC: Giữ cứng cựa mã tai vừa tạo ra khay chính không xóa trắng!
        setMaTai(maTaiChuanInHoa); 
        setQuickGiong('');
        setQuickLua('Hậu Bị');

        setTxtThanhCongNoiDung({
          tieuDe: "GHI NHẬN THÀNH CÔNG",
          maTai: maTaiChuanInHoa,
          loiGiai: "đã được tạo mới thành công. Bắt đầu Nhập Liệu cho Nái"
        });
        setIsThanhCongModalVisible(true);
      } else {
        setDanhSachMaTai(prev => prev.filter(i => i.id !== dongMoiMaTai.id));
        if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
          global.danhSachCapNhatTrangThai = global.danhSachCapNhatTrangThai.filter(i => i && i.id !== dongMoiMaTai.id);
        }
        setDongBoStatus('❌ Lỗi kết nối ghi nhận dữ liệu mạng');
        Alert.alert("Lỗi", "Không thể thêm nhanh mã tai lên hệ thống mạng.");
      }
    });
  };


  // --- HÀM 6: FORM THÊM MỚI SỔ MÃ TAI (TAB 2) ---
  // ========================================================
  // 🚀 BẢN VÁ TỐI CAO: FIX KHÍT KHHAO BIẾN GIONGHEOCHUANTAB2 - TUYỆT DIỆT LỖI REFERENCEERROR
  // ========================================================
   // ========================================================
  // 🚀 BẢN VÁ TỐI CAO: ÉP CỜ CHUA_RELOAD ĐỂ HIỂN THỊ SONG HÀNH CẢ 2 NƠI MẶT TIỀN
  // ========================================================
    // ========================================================
  // 🚀 KHỐI 2/4: HÀM THÊM CHÍNH - PHẲNG SẠCH 100% TIẾNG VIỆT KHÔNG DẤU
  // ========================================================
  const handleSaveMaTai = () => {
    if (!mtMaTai.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Mã Tai!");

    const maTaiGoc = mtMaTai.toUpperCase().trim();
    if (Array.isArray(danhSachMaTai) && danhSachMaTai.some(heo => heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiGoc)) {
      return Alert.alert("Cảnh báo trùng mã tai Cũ", `Mã tai [${maTaiGoc}] đã tồn tại Hoặc nằm trong mục loại ( Thải ). Vui lòng nhập số tai khác hoặc thêm kí tự!`);
    }
    const giongHeoChuanTab2 = mtGiong && mtGiong.trim() !== "" ? mtGiong.trim() : "Nái Nhà";
    const idDocBanChinh = "MT_" + new Date().getTime();

    const dongMoi = { 
      id: idDocBanChinh, 
      maTai: maTaiGoc, 
      giong: giongHeoChuanTab2, 
      lua: mtLua ? mtLua.toString().trim() : "Hậu Bị", 
      luaHienThiThongMinh: mtLua ? mtLua.toString().trim() : "Hậu Bị",
      ngayPhoi: "",
      ngayCotI: "---",
      ngayDuKienDeMoi: "---",
      
      trangThaiDienThoai: "Chờ Phối",
      trangThai: "Chờ Phối",
      trangThaiCotH: "Chờ Phối",
      
      ghiChu: "Them mui truc tiep tu so nai",
      userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
      vuaNhapMoi: "chua_reload", 
      syncStatus: "waiting", // Ga co mac dinh lam mo 50% truoc khi len cloud
      actionType: "mt_create" 
    };
    
    // Chọc RAM lập tức cho cả 2 mảng hiển thị mặt tiền song hành 100%
    setDanhSachMaTai(prev => [dongMoi, ...prev]); 
    if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
      global.danhSachCapNhatTrangThai = [dongMoi, ...global.danhSachCapNhatTrangThai];
    }

    setMtMaTai(''); 
    setMtGiong(''); 
    setMtLua('Hậu Bị'); 
    setDongBoStatus(`⏳ Đang lưu mã tai mới: ${dongMoi.maTai}...`);

    guiYeuCauMang(dongMoi, async (ketQua) => {
      if (ketQua && ketQua.status === 'success') {
        setDongBoStatus('✅ Thêm Mã tai heo mới thành công');
      } else {
        setDanhSachMaTai(prev => prev.filter(i => i.id !== dongMoi.id));
        if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
          global.danhSachCapNhatTrangThai = global.danhSachCapNhatTrangThai.filter(i => i.id !== dongMoi.id);
        }
        Alert.alert("Lỗi", "Không thể lưu mã tai lên hệ thống mạng Sheets.");
      }
    });
  };





  const handleMtEditClick = (item) => {
    setMtEditingId(item.id); setMtEditMaTai(item.maTai); setMtEditGiong(item.giong); setMtEditLua(item.lua);
    setIsMtEditModalVisible(true);
  };

  const handleSaveMtEdit = () => {
    const dongMtSua = {
      id: mtEditingId,
      maTai: mtEditMaTai.toUpperCase().trim(),
      giong: mtEditGiong.trim(),
      lua: mtEditLua,
      syncStatus: "waiting",
      actionType: "mt_update"
    };

    setDanhSachMaTai(prev => prev.map(item => item.id === mtEditingId ? { ...item, ...dongMtSua } : item));
    setIsMtEditModalVisible(false); 
    setMtEditingId(null);

    setDongBoStatus(`⏳ Đang đồng bộ sửa danh bạ tai: ${dongMtSua.maTai}...`);
    guiYeuCauMang(dongMtSua, (res) => {
      if (res.status === 'success') {
        setDanhSachMaTai(prev => prev.map(i => i.id === dongMtSua.id ? { ...i, syncStatus: "synced" } : i));
        setDongBoStatus('✅ Đã cập nhật Danh Bạ!');
      }
    });
  };
 // MÀN HÌNH KHÓA ĐĂNG NHẬP CLOUD FIREBASE
  if (!isLoggedIn) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1, backgroundColor: '#ffffff' }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 30 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 🎯 LOGO ĐÃ ĐỔI SANG BỐC TỪ ASSETS ICON.PNG PHẲNG ĐẸP */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Image 
              source={require('./assets/icon.png')} 
              style={{ width: 90, height: 90, borderRadius: 20, resizeMode: 'contain' }} 
            />
          </View>

          <Text style={styles.loginTitle}>HỆ THỐNG TRẠI HEO</Text>
          <Text style={styles.loginSub}>Nhập Liệu và Quản Lý Trang Trại Của bạn</Text>
          
          <Text style={{ fontWeight: '600', marginBottom: 4, fontSize: 13, color: '#333333' }}>Số tài khoản (Email):</Text>
          <TextInput 
            style={[styles.inputStandard, { borderColor: '#ffd3b6', height: 44, fontSize: 14, marginBottom: 15 }]} 
            placeholder="Nhập số tài khoản (Email)" 
            value={typedEmail} 
            onChangeText={setTypedEmail} 
            keyboardType="email-address" 
            placeholderTextColor="#888888" 
            autoCapitalize="none" 
            editable={!isAuthLoading} 
          />

          <Text style={{ fontWeight: '600', marginBottom: 4, fontSize: 13, color: '#333333' }}>Mật mã truy cập:</Text>
          {/* Thanh bọc ô nhập mật mã và nút con mắt nằm chung hàng ngang phẳng sạch */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            borderWidth: 1, 
            borderColor: '#ffd3b6', 
            borderRadius: 6, 
            backgroundColor: '#ffffff',
            marginBottom: 25,
            height: 44,
            paddingHorizontal: 12
          }}>
            <TextInput 
              style={{ flex: 1, color: '#111111', fontSize: 14, paddingVertical: 0, height: '100%' }} 
              placeholder="Nhập mật mã" 
              value={typedPassword} 
              onChangeText={setTypedPassword} 
              secureTextEntry={!isPasswordVisible} // 🎯 Ẩn hiện dựa trên state
              autoCapitalize="none" 
              placeholderTextColor="#888888" 
              editable={!isAuthLoading} 
            />
            {/* NÚT ICON CON MẮT PHẲNG MỊN */}
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              style={{ padding: 6 }}
              disabled={isAuthLoading}
            >
              <Text style={{ fontSize: 16 }}>{isPasswordVisible ? "👁️" : "🙈"}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 5 }}>
            {isAuthLoading ? (
              <ActivityIndicator size="large" color="#e65100" />
            ) : (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={handleLoginSubmit}
                style={{ backgroundColor: '#e65100', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>ĐĂNG NHẬP HỆ THỐNG</Text>
              </TouchableOpacity>
            )}
          </View>
      

          {/* 🎯 BẢN VÁ THƯƠNG HIỆU TỐI GIẢN APPLE: KHÔNG LIÊN KẾT MẠNG - AN TOÀN TUYỆT ĐỐI */}
          <View style={{ marginTop: 45, alignItems: 'center', gap: 6 }}>
            
            {/* Hàng ngang chứa Website và TikTok phẳng lỳ chữ lớn dõng dạc */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, justifyContent: 'center', backgroundColor: '#f8f9fa', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, borderWidth: 0.5, borderColor: '#e9ecef' }}>
              
              {/* Cột trái: Nhãn Website tĩnh thô */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13 }}>🌐</Text>
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#495057' }}>channuoiheo.vn</Text>
              </View>

              {/* Vạch chia ranh giới mỏng ở giữa */}
              <View style={{ width: 1, height: 12, backgroundColor: '#dee2e6' }} />

              {/* Cột phải: Nhãn TikTok tĩnh thô */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13 }}>Tiktok</Text>
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#212529' }}>@channuoiheo.vn</Text>
              </View>

            </View>

            {/* Dòng chữ giải thích nghiệp vụ chìm nhã nhặn */}
            <Text style={{ fontSize: 11, color: '#868e96', textAlign: 'center', marginTop: 4, paddingHorizontal: 12, lineHeight: 15 }}>
              Vui lòng nhắn tin thông tin theo địa chỉ trên để được cấp tài khoản miễn phí.
            </Text>

            <Text style={{ fontSize: 10, color: '#adb5bd', marginTop: 5, fontWeight: '500' }}>
              © 2026 PigVN • Phiên bản 2.1
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    );
  }


  return (
    
// 🎯 BẢN VÁ TRẢ VỀ NỀN PHẲNG TRONG APP.JS: Khóa thuộc tính behavior để cấm ép uổng toàn màn hình
<KeyboardAvoidingView 
  behavior={undefined} 
  style={styles.mainWrapper}
>

      {/* 🚀 BANNER TĨNH CỐ ĐỊNH TRÊN ĐỈNH: Luôn luôn hiện ở mọi Tab, không che khuất chữ */}
      <View style={{
        paddingTop: Platform.OS === 'ios' ? 35 : 12, 
        paddingBottom: 8,
        paddingHorizontal: 15,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6',
      }}>
               {/* ======================================================== */}
        {/* 🚀 THIẾT KẾ ĐỒNG BỘ CAO CẤP: ÉP HAI DÒNG CHỮ PHỤ THẲNG HÀNG NGANG 100% */}
        {/* ======================================================== */}
        <View style={{ marginBottom: 12, width: '100%', paddingHorizontal: 2 }}>
          
          {/* TẦNG 1: HÀNG NGANG ĐỈNH ĐẦU - BÊN TRÁI HIỆN EMAIL, BÊN PHẢI HIỆN NÚT ĐĂNG XUẤT */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 6 }}>
            
            {/* LỀ TRÁI: Danh tính Email tài khoản nái */}
            <Text style={{ fontSize: 13, color: '#333333', flex: 1, paddingRight: 10 }} numberOfLines={1}>
              👤 <Text style={{ fontWeight: 'bold' }}>{userEmail}</Text>
            </Text>

            {/* LỀ PHẢI: Chỉ giữ duy nhất chiếc nút Đăng xuất kén nhựa của bạn */}
            <TouchableOpacity 
              activeOpacity={0.6} 
              onPress={handleLogOut} 
              style={{ 
                backgroundColor: '#fff0e6', 
                paddingHorizontal: 10, 
                paddingVertical: 5, 
                borderRadius: 15, 
                borderWidth: 0.5, 
                borderColor: '#ffd3b6' 
              }}
            >
              <Text style={{ color: '#e65100', fontSize: 10.5, fontWeight: 'bold' }}>Đăng xuất 🚪</Text>
            </TouchableOpacity>

          </View>

          {/* TẦNG 2: HÀNG NGANG ĐÁY LỀ - ÉP HAI KHỐI CHỮ PHỤ CÙNG NẰM TRÊN 1 ĐƯỜNG THẲNG TĂM TẮP */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            
            {/* CHỮ PHỤ BÊN TRÁI: Căn lề trái tự nhiên */}
            <Text style={{ fontSize: 8.5, fontWeight: '600', color: '#7f8c8d', fontStyle: 'italic', textAlign: 'left', flex: 1, paddingRight: 8 }}>
              Xin hãy đợi hệ thống báo ✅ rồi nhập tiếp.
            </Text>

            {/* CHỮ PHỤ BÊN PHẢI: Căn lề phải tự nhiên, nằm ngang hàng tăm tắp với bên trái */}
            <Text style={{ fontSize: 8.5, fontWeight: '600', color: '#7f8c8d', fontStyle: 'italic', textAlign: 'right' }}>
              Bấm cập nhật để tính số liệu mới nhất!
            </Text>

          </View>

        </View>

        {/* Hàng 2: Trạng thái nạp ngầm + nút Tải Lại phẳng */}
        <View style={{
          backgroundColor: dongBoStatus.includes('❌') ? '#f8d7da' : (dongBoStatus.includes('⏳') ? '#fff3cd' : '#d4edda'),
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 8,
          borderWidth: 0.5,
          borderColor: dongBoStatus.includes('❌') ? '#f5c6cb' : (dongBoStatus.includes('⏳') ? '#ffeeba' : '#c3e6cb'),
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{ 
            fontSize: 11, 
            fontWeight: '600', 
            color: dongBoStatus.includes('❌') ? '#721c24' : (dongBoStatus.includes('⏳') ? '#856404' : '#155724'), 
            marginRight: 6, 
            textAlign: 'left', 
            flex: 1 
          }} numberOfLines={1}>
            {dongBoStatus}
          </Text>
                    {/* ======================================================== */}
          {/* 🚀 THIẾT KẾ CAO CẤP: NÚT CẬP NHẬT ĐỔ BÓNG VÀ TEXT PHỤ ĐẸP MẮT */}
          {/* ======================================================== */}
           {/* SỬA KHỐI NÀY: Ép nút đổi màu xám mờ và hiển thị số giây đếm ngược nếu bị khóa */}
          <View style={{ alignItems: 'flex-end', justifyContent: 'center', marginVertical: 2 }}>
            <TouchableOpacity 
              activeOpacity={0.7}
              style={{ 
                backgroundColor: cooldownCapNhat > 0 ? '#95a5a6' : '#e65100', // Đổi sang màu xám khi bị khóa
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                borderRadius: 7,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#e65100',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: cooldownCapNhat > 0 ? 0 : 0.2,
                shadowRadius: 3,
                elevation: 3
              }} 
              onPress={handleRefreshData} 
              disabled={isInitialLoading || cooldownCapNhat > 0} // Chặn bấm tuyệt đối khi cooldown > 0
            >
              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 }}>
                {cooldownCapNhat > 0 ? `⏳ Chờ ${cooldownCapNhat}s` : "🔄 Cập Nhật Số Liệu"}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>

      

     

            {/* TAB 1: NHẬP LIỆU */}
    <DataEntryTab
  currentTab={currentTab}
  styles={styles}
  formatVNDate={formatVNDate}
  parseToDateObject={parseToDateObject}
  
  searchTxtTab1={searchTxtTab1}
  setSearchTxtTab1={setSearchTxtTab1}
  danhSachLichSu={danhSachLichSu}
  setDanhSachLichSu={setDanhSachLichSu}
  danhSachMaTai={danhSachMaTai}
  danhSachSuKien={danhSachSuKien}
  ngayHienThi={ngayHienThi}
  setNgayHienThi={setNgayHienThi}
  isDatePickerVisible={isDatePickerVisible}
  setDatePickerVisibility={setDatePickerVisibility}
  maTai={maTai}
  setMaTai={setMaTai}
  goiYMaTaiLoc={goiYMaTaiLoc}
  setGoiYMaTaiLoc={setGoiYMaTaiLoc}
  suKien={suKien}
  setSuKien={setSuKien}
  soHeo={soHeo}
  setSoHeo={setSoHeo}
  khoThai={khoThai}
  setKhoThai={setKhoThai}
  coiCoc={coiCoc}
  setCoiCoc={setCoiCoc}
  chetNgop={chetNgop}
  setChetNgop={setChetNgop}
  chonNuoi={chonNuoi}
  setChonNuoi={setChonNuoi}
  ghiChu={ghiChu}
  setGhiChu={setGhiChu}
  
  laSuKienBanHeo={laSuKienBanHeo}
  canNhapSoHeo={canNhapSoHeo}
  isOpenSuKien={isOpenSuKien}
  setIsOpenSuKien={setIsOpenSuKien}
  userEmail={userEmail}
  
  setIsQuickAddModalVisible={setIsQuickAddModalVisible}
  handleSaveNew={handleSaveNew}
  handleEditClick={handleEditClick}
  handleXemChiTietHeo={handleXemChiTietHeo}
  tinhNgayDuKienDe={tinhNgayDuKienDe}
  setDongBoStatus={setDongBoStatus}
  guiYeuCauMang={guiYeuCauMang}
/>



      {/* TAB 2: MÃ TAI */}
     <SowRegistryTab
  currentTab={currentTab}
  styles={styles}
  parseToDateObject={parseToDateObject}
  formatStringtoVN={formatStringtoVN}
  formatVNDate={formatVNDate}
  WEB_APP_URL={WEB_APP_URL}
  userEmail={userEmail}
  
  searchTxtTab2={searchTxtTab2}
  setSearchTxtTab2={setSearchTxtTab2}
  nhomNaiTab2={nhomNaiTab2}
  setNhomNaiTab2={setNhomNaiTab2}
  danhSachLichSu={danhSachLichSu}
  danhSachMaTai={danhSachMaTai}
  setDanhSachMaTai={setDanhSachMaTai}
  danhSachLuaHeo={danhSachLuaHeo}
  
  mtMaTai={mtMaTai}
  setMtMaTai={setMtMaTai}
  mtGiong={mtGiong}
  setMtGiong={setMtGiong}
  mtLua={mtLua}
  setMtLua={setMtLua}
  
  setIsQuickAddModalVisible={setIsQuickAddModalVisible}
  setSelectedHeoDetail={setSelectedHeoDetail}
  setIsDetailModalVisible={setIsDetailModalVisible}
  setLoadingLichSuDe={setLoadingLichSuDe}
  setMangLichSuDeCuaTai={setMangLichSuDeCuaTai}
  handleSaveMaTai={handleSaveMaTai}
  handleMtEditClick={handleMtEditClick}
  setDongBoStatus={setDongBoStatus}
  guiYeuCauMang={guiYeuCauMang}
/>




      {/* 📊 TAB 3: THỐNG KÊ NÁI & CÁM   */}
 
     <StatisticsTab
  currentTab={currentTab}
  styles={styles}
  parseToDateObject={parseToDateObject}
  
  dataThongKe={dataThongKe}
  danhSachLichSu={danhSachLichSu}
  tuanBauDangMoTab3={tuanBauDangMoTab3}
  setTuanBauDangMoTab3={setTuanBauDangMoTab3}
/>

{/* 🐷 TAB 4: HIỂN THỊ DANH SÁCH HEO ĐANG ĐẺ  */}
      <FarrowingTab
  currentTab={currentTab}
  styles={styles}
  formatVNDate={formatVNDate}
  parseToDateObject={parseToDateObject}
  
  searchTxtTab4={searchTxtTab4}
  setSearchTxtTab4={setSearchTxtTab4}
  danhSachLichSu={danhSachLichSu}
  danhSachMaTai={danhSachMaTai}
  
  handleMoModalCaiSuaNhanh={handleMoModalCaiSuaNhanh}
/>


    {/* TAB 5: HEO THỊT */}
<PigMeatTab
  currentTab={currentTab}
  styles={styles}
  formatVNDate={formatVNDate}
  
  dataHeoThit={dataHeoThit}
  danhSachLichSu={danhSachLichSu}
  lichSuHeoThit={danhSachLichSu} // 🎯 Vá chí mạng: Ép các biến dự phòng dùng chung nguồn danhSachLichSu
  lichSuHeo={danhSachLichSu}
  historyData={danhSachLichSu}
  dataLichSu={danhSachLichSu}
  openGiaiDoan={openGiaiDoan} setOpenGiaiDoan={setOpenGiaiDoan}
  
  handleMoModalHeoThit={handleMoModalHeoThit}
  handleMoSuaHeoThit={handleMoSuaHeoThit}
  handleXoaNhatKyChuDong={handleXoaNhatKyChuDong}
/>

           {/* TAB 6 : việc làm */}

    <TasksTab
  currentTab={currentTab}
  styles={styles}
  formatVNDate={formatVNDate}
  parseToDateObject={parseToDateObject}
  
  subTab={subTab} setSubTab={setSubTab}
  kieuXemThoiGianTask={kieuXemThoiGianTask} setKieuXemThoiGianTask={setKieuXemThoiGianTask}
  
  danhSachLichSu={danhSachLichSu}
  danhSachCauHinhVacXin={danhSachCauHinhVacXin} setDanhSachCauHinhVacXin={setDanhSachCauHinhVacXin}
  danhSachDangDe={danhSachDangDe}
  userEmail={userEmail}
  
  hienBatLocChiTietTab3={hienBatLocChiTietTab3} setHienBatLocChiTietTab3={setHienBatLocChiTietTab3}
  hienSapDeChiTietTab3={hienSapDeChiTietTab3} setHienSapDeChiTietTab3={setHienSapDeChiTietTab3}
  hienCaiSuaChiTietTab3={hienCaiSuaChiTietTab3} setHienCaiSuaChiTietTab3={setHienCaiSuaChiTietTab3}
  hienQuyTrinhChiTietTab3={hienQuyTrinhChiTietTab3} setHienQuyTrinhChiTietTab3={setHienQuyTrinhChiTietTab3}
  
  loaiMocInput={loaiMocInput} setLoaiMocInput={setLoaiMocInput}
  inputDays={inputDays} setInputDays={setInputDays}
  inputName={inputName} setInputName={setInputName}
  ghiChuVacXinInput={ghiChuVacXinInput} setGhiChuVacXinInput={setGhiChuVacXinInput}
  editingConfigId={editingConfigId} setEditingConfigId={setEditingConfigId}
  
  layDanhSachNhiemVuHomNay={layDanhSachNhiemVuHomNay}
  xuLyMangCauHinhVacXin={xuLyMangCauHinhVacXin}
  AsyncStorage={AsyncStorage}
/>


    <SowDetailModal
  visible={isDetailModalVisible && currentTab !== 'heo_thit'}
  onClose={() => { setIsDetailModalVisible(false); setSelectedHeoDetail(null); }}
  styles={styles}
  parseToDateObject={parseToDateObject}
  
  selectedHeoDetail={selectedHeoDetail}
  nhomNaiTab2={nhomNaiTab2}
  danhSachLichSu={danhSachLichSu}
  danhSachDangDe={danhSachDangDe}
/>

        <EditLogModal
  visible={isEditModalVisible}
  onClose={() => setIsEditModalVisible(false)}
  styles={styles}
  formatVNDate={formatVNDate}
  
  editNgay={editNgay} setEditNgay={setEditNgay}
  editMaTai={editMaTai} setEditMaTai={setEditMaTai}
  editSuKien={editSuKien} setEditSuKien={setEditSuKien}
  editSoHeo={editSoHeo} setEditSoHeo={setEditSoHeo}
  editChonNuoi={editChonNuoi} setEditChonNuoi={setEditChonNuoi}
  editKhoThai={editKhoThai} setEditKhoThai={setEditKhoThai}
  editCoiCoc={editCoiCoc} setEditCoiCoc={setEditCoiCoc}
  editChetNgop={editChetNgop} setEditChetNgop={setEditChetNgop}
  editGhiChu={editGhiChu} setEditGhiChu={setEditGhiChu}
  editCanNhapSoHeo={editCanNhapSoHeo}
  danhSachSuKien={danhSachSuKien}
  
  // 🎯 ĐOẠN BẢN VÁ AN TOÀN CHỐNG CHẾT APP:
  isEditDatePickerVisible={typeof isEditDatePickerVisible !== 'undefined' ? isEditDatePickerVisible : false}
  setEditDatePickerVisible={typeof setEditDatePickerVisible !== 'undefined' ? setEditDatePickerVisible : () => {}}
  setEditDatePickerVisibility={typeof setEditDatePickerVisibility !== 'undefined' ? setEditDatePickerVisibility : () => {}}
  editSuKienTamThoi={typeof editSuKienTamThoi !== 'undefined' ? editSuKienTamThoi : undefined}
  setEditSuKienTamThoi={typeof setEditSuKienTamThoi !== 'undefined' ? setEditSuKienTamThoi : () => {}}
  
  onSave={handleSaveEdit}
/>

   <EditSowModal
  visible={isMtEditModalVisible}
  onClose={() => setIsMtEditModalVisible(false)}
  styles={styles}
  
  mtEditMaTai={mtEditMaTai} setMtEditMaTai={setMtEditMaTai}
  mtEditGiong={mtEditGiong} setMtEditGiong={setMtEditGiong}
  mtEditLua={mtEditLua} setMtEditLua={setMtEditLua}
  danhSachLuaHeo={danhSachLuaHeo}
  
  // Bản vá an toàn chống sập app nếu biến tạm chưa được khai báo
  editLuaTamThoi={typeof editLuaTamThoi !== 'undefined' ? editLuaTamThoi : undefined}
  setEditLuaTamThoi={typeof setEditLuaTamThoi !== 'undefined' ? setEditLuaTamThoi : () => {}}
  
  onSave={handleSaveMtEdit}
/>


      {/* GIẢI THÍCH CHI TIẾT GIAI ĐOẠN HEO THỊT   */}

           <AgeDefinitionModal
  visible={currentTab === 'heo_thit' && isDetailModalVisible}
  onClose={() => setIsDetailModalVisible(false)}
  styles={styles}
/>


      {/* 🚀 THANH MENU 5 TAB CHỮ PHẲNG - ĐÃ SỬA CHỐNG XUỐNG HÀNG & SÁNG SỐ 100% */}
      {/* ======================================================== */}
           <View 
        style={{
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#eef2f5',
          height: 94 + (insets.bottom > 0 ? insets.bottom : 6), 
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6, 
          paddingTop: 8,
          paddingHorizontal: 10,
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 12,
          zIndex: 9999
        }}
      >
        {/* 🎯 TẦNG 1: HÀNG TRÊN (3 NÚT ĐỐI XỨNG TUYỆT ĐỐI) */}
        <View style={{ flexDirection: 'row', width: '100%', marginBottom: 6, gap: 6 }}>
          {/* TAB 1: NHẬP LIỆU */}
          <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('nhap_lieu')} style={{ flex: 1 }}>
            <View style={{ backgroundColor: currentTab === 'nhap_lieu' ? '#fff0e6' : '#f8f9fa', borderRadius: 8, width: '100%', height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: currentTab === 'nhap_lieu' ? '#ffd3b6' : '#eef2f5' }}>
              <Text style={{ fontSize: 12, fontWeight: currentTab === 'nhap_lieu' ? '800' : '600', color: currentTab === 'nhap_lieu' ? '#e65100' : '#495057' }}>📝 Nhập Liệu</Text>
            </View>
          </TouchableOpacity>
          
          {/* TAB 2: SỔ MÃ TAI */}
          <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('ma_tai')} style={{ flex: 1 }}>
            <View style={{ backgroundColor: currentTab === 'ma_tai' ? '#fff0e6' : '#f8f9fa', borderRadius: 8, width: '100%', height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 0.5, borderColor: currentTab === 'ma_tai' ? '#ffd3b6' : '#eef2f5' }}>
              <Text style={{ fontSize: 12, fontWeight: currentTab === 'ma_tai' ? '800' : '600', color: currentTab === 'ma_tai' ? '#e65100' : '#495057' }}>🏷️ Sổ Tai</Text>
              <View style={{ backgroundColor: currentTab === 'ma_tai' ? '#e65100' : '#28a745', paddingHorizontal: 4, paddingVertical: 0.5, borderRadius: 4 }}>
                <Text style={{ fontSize: 8.5, fontWeight: '900', color: '#ffffff' }}>
                  {(() => {
                    const mangRamTabNutDay = global.danhSachCapNhatTrangThai || [];
                    return String(mangRamTabNutDay.filter(heo => {
                      if (!heo || !heo.maTai) return false;
                      const trangThaiTho = heo.trangThaiDienThoai || heo.trangThaiCotH || heo.trangThai || "Chờ Phối";
                      return trangThaiTho.toString().trim().toUpperCase() !== "THẢI";
                    }).length);
                  })()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* TAB 3: QUY TRÌNH */}
          <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('tasks')} style={{ flex: 1 }}>
            <View style={{ backgroundColor: currentTab === 'tasks' ? '#fff0e6' : '#f8f9fa', borderRadius: 8, width: '100%', height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: currentTab === 'tasks' ? '#ffd3b6' : '#eef2f5' }}>
<Text style={{ fontSize: 12, fontWeight: currentTab === 'tasks' ? '800' : '600', color: currentTab === 'tasks' ? '#e65100' : '#495057' }}>📅 Việc Cần Làm</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 🎯 TẦNG 2: HÀNG DƯỚI (3 NÚT ĐỐI XỨNG PHẲNG PHIÊU CHUẨN ĐẾT) */}
        <View style={{ flexDirection: 'row', width: '100%', gap: 6 }}>
          {/* TAB 4: ĐANG ĐẺ */}
          <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('heo_de')} style={{ flex: 1 }}>
            <View style={{ backgroundColor: currentTab === 'heo_de' ? '#fff0e6' : '#f8f9fa', borderRadius: 8, width: '100%', height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 0.5, borderColor: currentTab === 'heo_de' ? '#ffd3b6' : '#eef2f5' }}>
              <Text style={{ fontSize: 12, fontWeight: currentTab === 'heo_de' ? '800' : '600', color: currentTab === 'heo_de' ? '#e65100' : '#495057' }}>🐖 Đang Đẻ</Text>
              <View style={{ backgroundColor: currentTab === 'heo_de' ? '#e65100' : '#28a745', paddingHorizontal: 4, paddingVertical: 0.5, borderRadius: 4 }}>
                <Text style={{ fontSize: 8.5, fontWeight: '900', color: '#ffffff' }}>
                  {(() => {
                    const danhSachGoc = Array.isArray(global.danhSachCapNhatTrangThai) ? global.danhSachCapNhatTrangThai : [];
                    return String(danhSachGoc.filter(heo => heo && !heo.vuaNhapMoi && heo.trangThaiDienThoai === "Đẻ").length);
                  })()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
 {/* TAB 6: THỐNG KÊ */}
          <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('thong_ke')} style={{ flex: 1 }}>
            <View style={{ backgroundColor: currentTab === 'thong_ke' ? '#fff0e6' : '#f8f9fa', borderRadius: 8, width: '100%', height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: currentTab === 'thong_ke' ? '#ffd3b6' : '#eef2f5' }}>
              <Text style={{ fontSize: 12, fontWeight: currentTab === 'thong_ke' ? '800' : '600', color: currentTab === 'thong_ke' ? '#e65100' : '#495057' }}>📊 Thống Kê</Text>
            </View>
          </TouchableOpacity>
                   {/* TAB 5: HEO THỊT ĐÃ ĐƯỢC KHÔI PHỤC KẾT CẤU CHỮ VÀ SỐ REAL-TIME */}
          <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('heo_thit')} style={{ flex: 1 }}>
            <View style={{ backgroundColor: currentTab === 'heo_thit' ? '#fff0e6' : '#f8f9fa', borderRadius: 8, width: '100%', height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 0.5, borderColor: currentTab === 'heo_thit' ? '#ffd3b6' : '#eef2f5' }}>
              
              {/* Dòng chữ hiển thị tiêu đề nút bấm */}
              <Text style={{ fontSize: 12, fontWeight: currentTab === 'heo_thit' ? '800' : '600', color: currentTab === 'heo_thit' ? '#e65100' : '#495057' }}>🏠 Heo Thịt</Text>
              
              {/* Khối huy hiệu bốc trực tiếp số tổng sống sau khi đã được trạm useEffect xử lý bù trừ */}
              <View style={{ backgroundColor: currentTab === 'heo_thit' ? '#e65100' : '#28a745', paddingHorizontal: 4, paddingVertical: 0.5, borderRadius: 4 }}>
                <Text style={{ fontSize: 8.5, fontWeight: '900', color: '#ffffff' }}>
                  {dataHeoThit && dataHeoThit.tongHeoThitSauBuTruRealTime !== undefined ? String(dataHeoThit.tongHeoThitSauBuTruRealTime) : (dataHeoThit?.tongHeoThit || "0")}
                </Text>
              </View>

            </View>

          </TouchableOpacity>


         
        </View>

      </View>


<NotificationModals
  styles={styles}
  formatVNDate={formatVNDate}
  
  isQuyTrinhAlertVisible={isQuyTrinhAlertVisible}
  setIsQuyTrinhAlertVisible={setIsQuyTrinhAlertVisible}
  txtAlertNoiDung={txtAlertNoiDung}
  
  isQuickAddModalVisible={isQuickAddModalVisible}
  setIsQuickAddModalVisible={setIsQuickAddModalVisible}
  isQuickSaving={isQuickSaving}
  maTai={maTai}
  quickGiong={quickGiong}
  setQuickGiong={setQuickGiong}
  quickLua={quickLua}
  setQuickLua={setQuickLua}
  danhSachLuaHeo={danhSachLuaHeo}
  nhanThongBaoNhoQuickAdd={nhanThongBaoNhoQuickAdd}
  setNhanThongBaoNhoQuickAdd={typeof setNhanThongBaoNhoQuickAdd !== 'undefined' ? setNhanThongBaoNhoQuickAdd : undefined}
  handleQuickSaveHeoMoi={handleQuickSaveHeoMoi}
  
  isCaiSuaModalVisible={isCaiSuaModalVisible}
  setIsCaiSuaModalVisible={setIsCaiSuaModalVisible}
  caiSuaHeoItem={caiSuaHeoItem}
  caiSuaNgay={caiSuaNgay}
  setCaiSuaNgay={setCaiSuaNgay}
  caiSuaSoCon={caiSuaSoCon}
  setCaiSuaHeoSoCon={setCaiSuaHeoSoCon}
  isCaiSuaDatePickerVisible={typeof isCaiSuaDatePickerVisible !== 'undefined' ? isCaiSuaDatePickerVisible : false}
  setCaiSuaDatePickerVisible={typeof setCaiSuaDatePickerVisible !== 'undefined' ? setCaiSuaDatePickerVisible : () => {}}
  isCaiSuaDatePickerVisibility={typeof isCaiSuaDatePickerVisibility !== 'undefined' ? isSuaHeoThitDatePickerVisibility : false}
  setCaiSuaDatePickerVisibility={typeof setCaiSuaDatePickerVisibility !== 'undefined' ? setCaiSuaDatePickerVisibility : () => {}}
  handleLuuCaiSuaNhanhTaiChuong={handleLuuCaiSuaNhanhTaiChuong}
  
  isAlertModalVisible={isAlertModalVisible}
  setIsAlertModalVisible={setIsAlertModalVisible}
  
  isThanhCongModalVisible={isThanhCongModalVisible}
  setIsThanhCongModalVisible={setIsThanhCongModalVisible}
  txtThanhCongNoiDung={txtThanhCongNoiDung}
/>

      <AddPigMeatModal
  visible={isHeoThitModalVisible}
  onClose={() => setIsHeoThitModalVisible(false)}
  styles={styles}
  formatVNDate={formatVNDate}
  
  heoThitActionType={typeof heoThitActionType !== 'undefined' ? heoThitActionType : ''}
  heoThitNgay={heoThitNgay} setHeoThitNgay={setHeoThitNgay}
  heoThitTuanChon={heoThitTuanChon} setHeoThitTuanChon={setHeoThitTuanChon}
  heoThitSoLuong={heoThitSoLuong} setHeoThitSoCon={setHeoThitSoCon}
  heoThitGhiChu={heoThitGhiChu} setHeoThitGhiChu={setHeoThitGhiChu}
  dataHeoThit={typeof dataHeoThit !== 'undefined' ? dataHeoThit : null}
  
  isHeoThitDatePickerVisible={typeof isHeoThitDatePickerVisible !== 'undefined' ? isHeoThitDatePickerVisible : false}
  setHeoThitDatePickerVisible={typeof setHeoThitDatePickerVisible !== 'undefined' ? setHeoThitDatePickerVisible : () => {}}
  isHeoThitDatePickerVisibility={typeof isHeoThitDatePickerVisibility !== 'undefined' ? isHeoThitDatePickerVisibility : false}
  setHeoThitDatePickerVisibility={typeof setHeoThitDatePickerVisibility !== 'undefined' ? setHeoThitDatePickerVisibility : () => {}}
  
  onSave={handleLuuHanhDongHeoThit}
/>



      <EditPigMeatModal
  visible={isSuaHeoThitModalVisible}
  onClose={() => setIsSuaHeoThitModalVisible(false)}
  styles={styles}
  formatVNDate={formatVNDate}
  
  suaHeoThitNgay={suaHeoThitNgay} setSuaHeoThitNgay={setSuaHeoThitNgay}
  suaHeoThitTuanChon={suaHeoThitTuanChon} setSuaHeoThitTuanChon={setSuaHeoThitTuanChon}
  suaHeoThitSoLuong={suaHeoThitSoLuong} setSuaHeoThitSoCon={setSuaHeoThitSoCon}
  suaHeoThitGhiChu={suaHeoThitGhiChu} setSuaHeoThitGhiChu={setSuaHeoThitGhiChu}
  suaHeoThitActionType={typeof suaHeoThitActionType !== 'undefined' ? suaHeoThitActionType : ''}
  
  dataHeoThit={typeof dataHeoThit !== 'undefined' ? dataHeoThit : null}
  danhSachLichSu={typeof danhSachLichSu !== 'undefined' ? danhSachLichSu : []}
  lichSuHeoThit={typeof lichSuHeoThit !== 'undefined' ? lichSuHeoThit : []}
  
  isSuaHeoThitDatePickerVisible={typeof isSuaHeoThitDatePickerVisible !== 'undefined' ? isSuaHeoThitDatePickerVisible : false}
  setSuaHeoThitDatePickerVisible={typeof setSuaHeoThitDatePickerVisible !== 'undefined' ? setSuaHeoThitDatePickerVisible : () => {}}
  isSuaHeoThitDatePickerVisibility={typeof isSuaHeoThitDatePickerVisibility !== 'undefined' ? isSuaHeoThitDatePickerVisibility : false}
  setSuaHeoThitDatePickerVisibility={typeof setSuaHeoThitDatePickerVisibility !== 'undefined' ? setSuaHeoThitDatePickerVisibility : () => {}}
  
  onSave={handleLuuSuaHeoThit}
/>



    </KeyboardAvoidingView>
  
  );
}
export default function App() {
  
  // ========================================================
  // 🚀 BAN VA TOI CAO: EP CUONG BUC GIAO DIEN SANG TRONG LONG HAM APP
  // ========================================================
  if (Appearance && typeof Appearance.setColorScheme === 'function') {
    try {
      Appearance.setColorScheme('light');
    } catch (err) {
      // Bo qua neu he thong gan tro
    }
  }

  // 🎯 LUỒNG KHÓA CỨNG KÍCH THƯỚC CHỮ TOÀN CỤC CHỐNG VỠ GIAO DIỆN KHÁCH LỚN TUỔI
  if (Text.defaultProps) {
    Text.defaultProps.allowFontScaling = false;
  } else {
    Text.defaultProps = { allowFontScaling: false };
  }
  
  if (TextInput.defaultProps) {
    TextInput.defaultProps.allowFontScaling = false;
  } else {
    TextInput.defaultProps = { allowFontScaling: false };
  }

  return (
    <SafeAreaProvider>
      <FarmProvider>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
          <MainApp />
        </TouchableWithoutFeedback>
      </FarmProvider>
    </SafeAreaProvider>
  );
}

// ========================================================
// 🎨 HỆ THỐNG ĐỊNH DẠNG STYLE SHEET TỔNG HỢP CHO TOÀN FILE
// ========================================================
const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'ios' ? 50 : 35 },
  loginContainer: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#ffffff' },
  loginEmoji: { fontSize: 50, textAlign: 'center', marginBottom: 10 },
  loginTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, color: '#111111', letterSpacing: 1 },
  loginSub: { fontSize: 13, color: '#333333', textAlign: 'center', marginBottom: 35 },
  userInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eeeeee', alignItems:'center' },
  userInfoText: { fontSize: 13, color: '#222222' },
  logoutText: { fontSize: 13, color: '#dc3545', fontWeight: 'bold' },
  formFixedContainer: { padding: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#dddddd' },
  rowInput: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dateButton: { backgroundColor: '#ffffff', padding: 12, borderWidth: 1, borderColor: '#cccccc', borderRadius: 6, flex: 0.45, justifyContent: 'center', alignItems: 'center' },
  dateButtonText: { fontSize: 15, color: '#111111', fontWeight: '500' },
  inputMaTai: { backgroundColor: '#ffffff', padding: 12, borderWidth: 1, borderColor: '#cccccc', borderRadius: 6, flex: 0.5, fontSize: 15, fontWeight: 'bold', textAlign: 'center', color: '#111111' },
  inputStandard: { backgroundColor: '#ffffff', padding: 12, borderWidth: 1, borderColor: '#cccccc', borderRadius: 6, marginBottom: 15, fontSize: 16, color: '#111111' },
  pickerBorder: { borderWidth: 1, borderColor: '#cccccc', borderRadius: 6, backgroundColor: '#ffffff', marginBottom: 12 },
  statusMiniBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#eeeeee' },
  statusMiniText: { fontSize: 12, color: '#222222', fontWeight: '500', flex: 0.7 },
  refreshButton: { backgroundColor: '#e65100', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  refreshButtonText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  historyCard: { backgroundColor: '#ffffff', padding: 12, borderRadius: 8, marginTop: 8, marginHorizontal: 15, borderWidth: 1, borderColor: '#cccccc', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardWaiting: { backgroundColor: '#fffbe6', borderColor: '#ffe58f' },
  cardHeader: { fontSize: 13, color: '#333333' },
  cardBody: { fontSize: 13, color: '#111111', marginTop: 2, fontWeight: '500' },
  cardActions: { flexDirection: 'row' },
  editBtn: { backgroundColor: '#ffc107', padding: 8, borderRadius: 5, marginRight: 5 },
  deleteBtn: { backgroundColor: '#dc3545', padding: 8, borderRadius: 5 },
  btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 11 },
  emptyText: { textAlign: 'center', color: '#666666', fontStyle: 'italic', marginTop: 30, paddingHorizontal: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 25 },
popupCard: { 
    backgroundColor: '#ffffff', 
    width: '100%', 
    padding: 20, 
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  popupTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', color: '#111111', marginBottom: 15 },
  popupInput: { backgroundColor: '#ffffff', padding: 10, borderWidth: 1, borderColor: '#cccccc', borderRadius: 6, fontSize: 15, color: '#111111' },
  popupDateButton: { backgroundColor: '#ffffff', padding: 11, borderWidth: 1, borderColor: '#cccccc', borderRadius: 6, alignItems: 'center' },
  popupPickerBorder: { borderWidth: 1, borderColor: '#cccccc', borderRadius: 6, backgroundColor: '#ffffff', marginTop: 10 },
  popupButtonGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f1f1', backgroundColor: '#ffffff', alignItems: 'center' },
  detailLabel: { fontSize: 14, color: '#444444', fontWeight: '500' },
  detailVal: { fontSize: 14, color: '#111111', fontWeight: 'bold', textAlign: 'right' }
});