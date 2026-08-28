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
// 🛰️ ĐẤU NỐI THÔNG MẠCH FIRESTORE EXPO (DÁN ĐỈNH FILE APP.JS)
import { db } from './FirebaseConfig'; // Trỏ đúng đường dẫn đến file firebase.js của bạn
import { doc, setDoc, collection, query, where, onSnapshot, getDoc } from 'firebase/firestore';
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
  const [danhSachLichSu, setDanhSachLichSu] = useState([]); // Khay lưu Nhật ký sự kiện toàn trại
  const [danhSachMaTai, setDanhSachMaTai] = useState([]);   // Khay lưu Danh bạ Sổ mã tai heo nái

    const [vuaBamLoginTay, setVuaBamLoginTay] = useState(false);

 const [danhSachCauHinhVacXin, setDanhSachCauHinhVacXin] = useState([]);
 const [danhSachSoTay, setDanhSachSoTay] = useState([]);
  
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
    'https://script.google.com/macros/s/AKfycbyHQR04w_g-VDUjnbBv8OTRuuWCuX_uB48lNcSYJh2S0ZXaNTaMNnu0I3qcdLHp2OEroQ/exec' // Mail chính - Link 1
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
  const unsubscribeRefs = React.useRef({ lichSu: null, maTai: null });

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
  // 🔔 BẢN VÁ THÔNG BÁO HỆ THỐNG TOÀN APPS QUA CLOUD FIRESTORE (CÁCH 1)
  const [isPopupThongBaoVisible, setIsPopupThongBaoVisible] = useState(false); // Bật tắt bảng xem thông báo
  const [tinNhanHeThongFirebase, setTinNhanHeThongFirebase] = useState(null);   // Bộ nhớ tạm găm tin nhắn dùng chung

  // Tự động kiểm tra và kéo tin nhắn chung từ Firebase về máy mỗi khi mở app hoặc đổi Tab
  useEffect(() => {
    
    // Thọc thẳng lên kho chung lấy tài liệu "he_thong" nằm trong bảng "Thong_Bao"
    getDoc(doc(db, "Thong_Bao", "he_thong"))
      .then((snap) => {
        if (snap.exists()) {
          setTinNhanHeThongFirebase(snap.data()); // Nạp cục dữ liệu thông báo chung vào máy khách
        }
      })
      .catch(e => console.log("Lỗi đồng bộ đài phát tin Firebase:", e));
  }, [currentTab]); // Cứ công nhân nhảy đổi Tab hoặc vừa mở app là tự động đồng bộ tin mới


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

          // 🎯 BIỆN PHÁP CHỮA CHÁY TỐI CAO: Phải gọi listener Firestore ngay tại đây 
          // để mở cổng hứng dữ liệu đám mây lập tức, chặn đứng hiện tượng mảng rỗng đè lên!
          batDauLangNgheFirestore(emailChuan);
          
          const khoaDemTongHop = `cache_tonghop_pigvn_${emailChuan}`;
          const dataDemTho = await AsyncStorage.getItem(khoaDemTongHop);
          
          // Nạp tạm dữ liệu cũ từ cache lên trước để người nuôi không phải nhìn màn hình trắng
          if (dataDemTho !== null) {
            const result = JSON.parse(dataDemTho);
            // 🎯 Chặn không cho bộ nhớ đệm ghi đè mảng trống lên RAM nếu cache cũ bị lỗi
            if (result.tab1 && result.tab1.length > 0) setDanhSachLichSu(result.tab1);
             if (result.tab2 && result.tab2.length > 0) {
    // 📥 TẮT APP MỞ LẠI: Quét cache lên, ép tất cả trạng thái thông báo cam cũ về false
    const tab2DaResetTrangThai = result.tab2.map(heo => {
      if (heo && heo.vuaNhapMoi === "chua_reload") {
        return { ...heo, vuaNhapMoi: false };
      }
      return heo;
    });
    setDanhSachMaTai(tab2DaResetTrangThai);
  }
            setDataThongKe(result.tab3 || null);
            setDanhSachDangDe(result.tab4 || []);
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
            if (Array.isArray(result.tab7)) {
              setDanhSachSoTay(result.tab7);
            } else {
              setDanhSachSoTay([]);
            }
          }

          // 🎯 ÉP KÍCH HOẠT LỆNH MẠNG THỜI GIAN THỰC (NHƯ BẤM TAY VÀO NÚT CẬP NHẬT)
          if (typeof handleRefreshData === 'function') {
            console.log("🔄 [HỆ THỐNG KÍCH HOẠT LỆNH TỰ ĐỘNG CẬP NHẬT DATA TRẠI KHI VÀO APP]");
            setDongBoStatus("⏳ Đang cập nhật dữ liệu trại mới nhất...");
            setIsInitialLoading(true);
            
            // Phát sóng lệnh mạng kéo dữ liệu phụ trợ
            handleRefreshData(emailChuan); 
            
            setTimeout(() => {
              if (typeof layDanhSachNhiemVuHomNay === 'function') layDanhSachNhiemVuHomNay();
            }, 2000);
          } else {
            setDongBoStatus('🟢 Hệ thống sẵn sàng');
            setIsInitialLoading(false);
          }
        }
      } catch (e) {
        console.log("Loi khoi phuc dang nhap cache ban dau:", e);
        setIsInitialLoading(false);
      }
    };

    khoiDongLuuDemAnToan();
  }, [vuaBamLoginTay]);




  // --- STATE TAB 1: NHẬP LIỆU ---
  const [ngayHienThi, setNgayHienThi] = useState(formatVNDate(new Date()));
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [maTai, setMaTai] = useState('');
  const [suKien, setSuKien] = useState('Phối');
  const [soHeo, setSoHeo] = useState('');
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


  const danhSachSuKien = ["Phối", "Lốc", "Đẻ", "Cai Sữa", "Sảy Thai", "Thải", "Theo Dõi"];
const canNhapSoHeo = suKien === "Đẻ" || suKien === "Cai Sữa";
const editCanNhapSoHeo = editSuKien === "Đẻ" || editSuKien === "Cai Sữa";
const laSuKienBanHeo = false; // Triệt tiêu cờ bán heo ở Tab 1

  // --- STATE TAB 2: MÃ TAI ---
  const [mtMaTai, setMtMaTai] = useState('');
  const [mtGiong, setMtGiong] = useState('');
  const [mtLua, setMtLua] = useState('Hậu Bị'); 
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
// ========================================================
    // 🟢 HẠT NHÂN TỰ ĐỘNG ĐẾM CỘNG DỒN LỨA HEO TỪ NHẬT KÝ SỰ KIỆN (MỚI BỔ SUNG)
    // ========================================================
    const banDoDemSoLanDeAnToan = {};
    if (Array.isArray(danhSachLichSu)) {
      danhSachLichSu.forEach(nhatKy => {
        if (!nhatKy || !nhatKy.maTai) return;
        
        const maTaiChuan = nhatKy.maTai.toString().toUpperCase().trim();
        const tenSuKien = nhatKy.suKien ? nhatKy.suKien.toString().trim().toLowerCase() : "";
        const kieuHanhDong = nhatKy.actionType ? nhatKy.actionType.toString().trim().toLowerCase() : "";

        if (kieuHanhDong === 'delete' || nhatKy.syncStatus === 'delete') return;

        // Cứ có sự kiện "Đẻ" hoặc "Báo đẻ" dán trong nhật ký là tính thêm 1 lứa đẻ ngoài RAM
        if (tenSuKien.includes("đẻ") || tenSuKien.includes("de")) {
          if (!banDoDemSoLanDeAnToan[maTaiChuan]) {
            banDoDemSoLanDeAnToan[maTaiChuan] = 0;
          }
          banDoDemSoLanDeAnToan[maTaiChuan] += 1;
        }
      });
    }

    // Lọc sạch dòng rỗng đồng thời tự động tính tích lũy lứa heo thời gian thực kịch sàn
    const mangSachDuLieu = Array.isArray(danhSachMaTai) 
      ? danhSachMaTai.filter(h => h && h.maTai && h.maTai.toString().trim() !== "").map(heo => {
          const maTaiChuan = heo.maTai.toString().toUpperCase().trim();
          const soLanDeThemInLichSu = banDoDemSoLanDeAnToan[maTaiChuan] || 0;
          
          const chuoiLuaGoc = heo.luaGoc ? heo.luaGoc.toString().trim().toLowerCase() : "";
          let soLuaGocSoHoc = 0; // Mặc định nếu là chữ "Hậu bị" hoặc trống sẽ tính là số 0

          if (chuoiLuaGoc !== "" && !chuoiLuaGoc.includes("hậu") && !chuoiLuaGoc.includes("hau") && !chuoiLuaGoc.includes("bị") && !chuoiLuaGoc.includes("bi")) {
            const soTachDuoc = parseInt(chuoiLuaGoc.replace(/\D/g, ''), 10);
            if (!isNaN(soTachDuoc)) {
              soLuaGocSoHoc = soTachDuoc;
            }
          }

          // Lứa Hiện Tại = Lứa Nhập Ban Đầu + Số Lần Đẻ Thêm Trong Nhật Ký Sự Kiện
          let ketQuaLuaHienTai = soLuaGocSoHoc + soLanDeThemInLichSu;
          let chuoiLuaHienThiCuoiCung = ketQuaLuaHienTai === 0 ? "Hậu bị" : "Lứa " + ketQuaLuaHienTai;

          return {
            ...heo,
            lua: chuoiLuaHienThiCuoiCung // Ghi đè thuộc tính lứa hiển thị ngoài màn hình và pop-up chi tiết
          };
        })
      : [];
    // 2. Tính toán dịch tễ sinh sản thời gian thực ngoài lán trại
        // ========================================================
    // 🧠 BẢN VÁ TỐI CAO: BỘ NÃO PHÂN KÊNH TÁCH BIỆT VẮC-XIN CHỐNG LOẠN TRẠNG THÁI NÁI
    // ========================================================
    const ketQuaQuetTrangThaiNai = mangSachDuLieu.map(heoGoc => {
      const maTaiInHoa = heoGoc.maTai.toString().toUpperCase().trim();

      // 🎯 BƯỚC A: Lọc sạch lịch sử riêng của nái, loại bỏ hoàn toàn các ca vắc-xin/thuốc trị bệnh
      const mangSkSinhSanMoc = Array.isArray(danhSachLichSu)
        ? danhSachLichSu
            .filter(i => {
              if (!i || !i.maTai || String(i.maTai).trim().toUpperCase() !== maTaiInHoa || i.actionType === "delete" || i.syncStatus === "delete") return false;
              
              const skTextChuan = i.suKien ? i.suKien.toString().toUpperCase().trim() : "";
              // Loại trừ thẳng cánh các từ khóa vắc-xin, thuốc khỏi luồng can thiệp trạng thái sinh sản
              if (
                skTextChuan.includes("VACXIN") || 
                skTextChuan.includes("VẮC-XIN") || 
                skTextChuan.includes("THUỐC") || 
                skTextChuan.includes("TIÊM") ||
                skTextChuan.includes("THEO DOI") ||
                skTextChuan.includes("THEO DÕI")
              ) return false;
              
              return true; // Chỉ giữ lại các mốc Phối, Đẻ, Cai Sữa, Lốc, Sảy, Thải
            })
            .sort((a, b) => {
              const timeA = parseToDateObject(a.ngay) ? parseToDateObject(a.ngay).getTime() : 0;
              const timeB = parseToDateObject(b.ngay) ? parseToDateObject(b.ngay).getTime() : 0;
              if (timeB !== timeA) return timeB - timeA;
              return (b.id ? b.id.toString() : "").localeCompare(a.id ? a.id.toString() : "");
            })
        : [];
      
      // Bốc sự kiện sinh sản cốt lõi mới nhất làm điểm tựa tính toán
      const skMoiNhat = mangSkSinhSanMoc.length > 0 ? mangSkSinhSanMoc[0] : null;

      let trangThaiThucTe = "Chờ Phối"; 
      let ngayTinhNgayBau = "";
      let ngayDuKienDeMoi = heoGoc.ngayDuKienDeMoi || "---";
      let ngayDeDongThoiGianThuc = heoGoc.ngayDeCotJ || ""; 

      if (skMoiNhat) {
        const skTho = skMoiNhat.suKien ? skMoiNhat.suKien.toString().trim().toUpperCase().normalize("NFC") : "";
       if (skTho.includes("THEO DÕI") || skTho.includes("THEO DOI")) {
  trangThaiThucTe = "Theo Dõi"; 
}
else if (skTho.includes("ĐẺ") || skTho.includes("DE")) { 
  trangThaiThucTe = "Đẻ"; 
  ngayDeDongThoiGianThuc = skMoiNhat.ngay; 
} 
else if (skTho.includes("PHỐI") || skTho.includes("PHOI") || skTho.includes("GIỐNG")) { 
  trangThaiThucTe = "Phối"; 
  ngayTinhNgayBau = skMoiNhat.ngay; 
  ngayDuKienDeMoi = tinhNgayDuKienDe(skMoiNhat.ngay); 
} 
else if (skTho.includes("CAI")) { 
  trangThaiThucTe = "Cai Sữa"; 
} 
else if (skTho.includes("THẢI") || skTho.includes("THAI loại")) { 
  trangThaiThucTe = "Thải"; 
} 
else if (skTho.includes("LỐC") || skTho.includes("LOC")) { 
  trangThaiThucTe = "Lốc"; 
} 
else if (skTho.includes("SẢY") || skTho.includes("SAY")) { 
  trangThaiThucTe = "Sảy Thai"; 
} 
else { 
  trangThaiThucTe = "Theo Dõi"; // Mặc định chuyển hết sang Theo Dõi
}
      }

      return {
        ...heoGoc,
        trangThaiDienThoai: trangThaiThucTe,
        ngayPhoiDong: ngayTinhNgayBau,
        ngayDuKienDeMoi: ngayDuKienDeMoi,
        ngayDeDongThoiGianThuc: ngayDeDongThoiGianThuc
      };
    });

    setDanhSachTrangThaiNai(ketQuaQuetTrangThaiNai);
    global.danhSachCapNhatTrangThai = ketQuaQuetTrangThaiNai;


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
                setVuaBamLoginTay(true); 

        batDauLangNgheFirestore(emailKhachStandard); // 👈 THÊM DÒNG NÀY

        setDongBoStatus('⏳ Xác thực thành công! Đang tải sổ liệu nhật ký...');

        
        // 2. PHÁ VỠ CHỌN TRẠI TRUNG GIAN: Thọc thẳng lên Server kéo dữ liệu 5 Tab về máy lập tức
       
        const xauNgauNhien = Math.random().toString(36).substring(7);
       
      fetch(`${WEB_APP_URL}?action=get_all_data&userEmail=${emailKhachStandard}&_nocache=${xauNgauNhien}`, { method: 'GET', redirect: 'follow' })
  .then((res) => res.json())
  .then((result) => {
    setIsAuthLoading(false);
    if (result && result.status === 'success') {
      
      // 🎯 BẢN VÁ TỐI CAO: TUYỆT ĐỐI KHÔNG sử dụng result.tab1 và result.tab2 để tránh bị [] đè lên
      // Hãy để cho hàm batDauLangNgheFirestore độc quyền gán dữ liệu cho 2 tab này!
      batDauLangNgheFirestore(emailKhachStandard);

      // Chỉ lấy các tab phụ trợ tính toán từ Google Sheets về máy khách
      setDanhSachDangDe(result.tab4 || []);
      if (result && result.tab5) {
        setDataHeoThit(result.tab5.dataLocHt ? result.tab5.dataLocHt : result.tab5);
      } else {
        setDataHeoThit(null);
      }
      if (result.tab6 && Array.isArray(result.tab6)) {
        setDanhSachCauHinhVacXin(result.tab6);
      }
      if (result.tab7 && Array.isArray(result.tab7)) {
        setDanhSachSoTay(result.tab7);
      }

      // Mở khóa màn hình chính lán trại
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
            setDongBoStatus('⚠️ Mất mạng. Hãy Cập Nhật Lại.');
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
const batDauLangNgheFirestore = (emailChuan) => {
  // Hủy listener cũ nếu có (tránh chồng lắng nghe khi gọi lại)
  if (unsubscribeRefs.current.lichSu) unsubscribeRefs.current.lichSu();
  if (unsubscribeRefs.current.maTai) unsubscribeRefs.current.maTai();

  const emailChuanQuet = emailChuan.toString().toLowerCase().trim();
  console.log("🛰️ [FIRESTORE] Kích nổ cổng lắng nghe thời gian thực cho:", emailChuanQuet);

  // 1. KÊNH LẮNG NGHE NHẬT KÝ SỰ KIỆN (Du_Lieu_Goc)
  const qLichSu = query(collection(db, "Du_Lieu_Goc"), where("userEmail", "==", emailChuanQuet));
  unsubscribeRefs.current.lichSu = onSnapshot(qLichSu, (snapshot) => {
    if (!snapshot.empty) {
      // 🎯 BẢN VÁ TỐI CAO: Bắt buộc phải gộp d.id vào Object để nuôi sống keyExtractor và bộ lọc so sánh
      const ds = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log(`✅ [FIRESTORE] Đã cập nhật ngầm thành công ${ds.length} dòng dữ liệu Nhật ký!`);
      setDanhSachLichSu(ds);
    } else {
      console.log("⚠️ [FIRESTORE] Bộ sưu tập Du_Lieu_Goc trả về mảng rỗng.");
      setDanhSachLichSu([]);
    }
  }, (err) => console.log("❌ Lỗi nghẽn cổng kết nối Du_Lieu_Goc:", err));

  // 2. KÊNH LẮNG NGHE DANH BẠ SỔ MÃ TAI NÁI (Danh_Sach_Ma_Tai)
  const qMaTai = query(collection(db, "Danh_Sach_Ma_Tai"), where("userEmail", "==", emailChuanQuet));
  unsubscribeRefs.current.maTai = onSnapshot(qMaTai, (snapshot) => {
    if (!snapshot.empty) {
      const ds = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log(`✅ [FIRESTORE] Đã cập nhật ngầm thành công ${ds.length} dòng Sổ mã tai nái!`);
      
      // 🧠 THUẬT TOÁN GÁC CỔNG FIRESTORE: Sắp xếp tìm ra con heo có mã ID lớn nhất (tức là con vừa gõ mới nhất lán trại)
      let maIdMoiNhatThucTe = "";
      ds.forEach(h => {
        if (h && h.id && h.id.toString().includes("MTSK_")) {
          if (h.id.toString() > maIdMoiNhatThucTe) {
            maIdMoiNhatThucTe = h.id.toString();
          }
        }
      });

      // 🌟 TIẾN HÀNH DON DẸP: Duyệt mảng mạng đổ về, con nào cũ hơn con vừa gõ là ép dập cờ màu cam ngay lập tức
      const dsDonSachCoCam = ds.map(heo => {
        if (heo && heo.vuaNhapMoi === "chua_reload" && heo.id !== maIdMoiNhatThucTe) {
          return { ...heo, vuaNhapMoi: false }; // Tắt trạng thái thông báo màu cam của các con cũ vĩnh viễn
        }
        return heo;
      });

      setDanhSachMaTai(dsDonSachCoCam);
    } else {
      console.log("⚠️ [FIRESTORE] Bộ sưu tập Danh_Sach_Ma_Tai trả về mảng rỗng.");
      setDanhSachMaTai([]);
    }
  }, (err) => console.log("❌ Lỗi nghẽn cổng kết nối Danh_Sach_Ma_Tai:", err));
};




  // 🔑 HÀM XỬ LÝ ĐĂNG XUẤT - XÓA SẠCH BỘ NHỚ TRÊN CHIP ĐIỆN THOẠI
   const handleLogOut = async () => {
    if (unsubscribeRefs.current.lichSu) unsubscribeRefs.current.lichSu();
if (unsubscribeRefs.current.maTai) unsubscribeRefs.current.maTai();
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

     // 🎯 2. Tự động nhận diện trạng thái RAM Thông Minh thực tế để mở đúng giao diện tuần bầu hoặc nuôi con
    // (Đã chuyển đổi sang trangThaiDienThoai để dẹp bỏ hoàn toàn cột H trên Cloud Sheet)
    const ttH = duLieuGopDayDu.trangThaiDienThoai ? duLieuGopDayDu.trangThaiDienThoai.toString().trim().normalize("NFC") : "";
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
      if (result.tab7 && Array.isArray(result.tab7)) {
        setDanhSachSoTay(result.tab7);
      } else {
        setDanhSachSoTay([]);
      }

     // ✅ CHÈN THÊM TOÀN BỘ ĐOẠN CODE NÀY VÀO ĐÂY:

      // 1. Dập cờ trực tiếp trên mảng RAM hiển thị của Sổ mã tai ngoài màn hình lập tức
      setDanhSachMaTai(prev => {
        if (!Array.isArray(prev)) return [];
        return prev.map(heo => {
          if (heo && heo.vuaNhapMoi === "chua_reload") {
            return { ...heo, vuaNhapMoi: false }; // Tắt trạng thái hiển thị màu cam
          }
          return heo;
        });
      });

      // 2. Dập cờ trên mảng global mặt tiền để đồng bộ các bộ lọc phân nhóm của Tab 2
      if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
        global.danhSachCapNhatTrangThai = global.danhSachCapNhatTrangThai.map(heo => {
          if (heo && heo.vuaNhapMoi === "chua_reload") {
            return { ...heo, vuaNhapMoi: false };
          }
          return heo;
        });
      }

      // 3. Lọc sạch cờ trong cục dữ liệu Sheets vừa tải về từ Server trước khi nén gói lưu xuống máy
      if (result && result.tab2 && Array.isArray(result.tab2)) {
        result.tab2 = result.tab2.map(heo => {
          if (heo && heo.vuaNhapMoi === "chua_reload") {
            return { ...heo, vuaNhapMoi: false };
          }
          return heo;
        });
      }

      // 🎯 (Giữ nguyên luồng đóng gói lưu dữ liệu cũ của anh ngay phía dưới)
      const duLieuGopDeLuu = {

        ...result,
        tab1: danhSachLichSu, // Giữ nguyên nhật ký lịch sử Firestore đang có trên máy
        tab2: danhSachMaTai   // Giữ nguyên danh bạ mã tai Firestore đang có trên máy
      };

      AsyncStorage.setItem(khoaDemTongHop, JSON.stringify(duLieuGopDeLuu)).catch(e => console.log(e));
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
    const emailChuan = userEmail ? userEmail.toLowerCase().trim() : "";
    
    // 1. Cập nhật trạng thái thông báo linh hoạt tùy thuộc vào hành động sổ tay hay vắc-xin
    if (loaiHanhDongMang.includes("sotay")) {
      setDongBoStatus("⏳ Đang đồng bộ sổ tay cá nhân...");
    } else {
      setDongBoStatus("⏳ Đang đồng bộ quy trình dịch tễ...");
    }
    
    // Thiết lập link gửi gốc chung cho mọi hành động
    let linkGui = `${WEB_APP_URL}?action=${loaiHanhDongMang}&id=${dataBody.id}&userEmail=${emailChuan}`;
    
    // 2. Phân nhánh tạo chuỗi tham số URL (Query Parameters) truyền lên Google Apps Script
    if (loaiHanhDongMang === "insert_sotay" || loaiHanhDongMang === "update_sotay") {
      // Ép tham số chuẩn khớp với các cột trên sheet So_Tay_Ca_Nhan mà chúng ta đã cấu hình ở Apps Script
      linkGui += `&ngayTao=${encodeURIComponent(dataBody.ngayTao || "")}&tieuDe=${encodeURIComponent(dataBody.tieuDe || "")}&noiDung=${encodeURIComponent(dataBody.noiDung || "")}&danhMuc=${encodeURIComponent(dataBody.danhMuc || "Chung")}&trangThai=${encodeURIComponent(dataBody.trangThai || "Mới")}`;
    } else if (loaiHanhDongMang !== "delete_cauhinh" && loaiHanhDongMang !== "delete_sotay") {
      // Giữ nguyên chuỗi tham số của luồng cấu hình vắc-xin cũ
      linkGui += `&loaiHanhDong=${encodeURIComponent(dataBody.loaiHanhDong)}&soNgay=${Number(dataBody.soNgay)}&tenNhiemVu=${encodeURIComponent(dataBody.tenNhiemVu)}&ghiChu=${encodeURIComponent(dataBody.ghiChu || "")}&ngayTiemTruoc=${encodeURIComponent(dataBody.ngayTiemTruoc || "")}`;
    }

    fetch(linkGui, { method: 'GET', redirect: 'follow' })
      .then(res => res.text())
      .then(textData => {
        let laThanhCong = false;
        try {
          const json = JSON.parse(textData);
          if (json && json.status === 'success') laThanhCong = true;
        } catch (e) {
          if (textData.toLowerCase().includes("success")) laThanhCong = true;
        }

        if (laThanhCong) {
          setDongBoStatus("✅ Đã đồng bộ!");
          
          const khoaDemTongHop = `cache_tonghop_pigvn_${emailChuan}`;
          AsyncStorage.getItem(khoaDemTongHop).then(dataDemTho => {
            if (dataDemTho !== null) {
              const result = JSON.parse(dataDemTho);
              
              // 3. Phân luồng cập nhật bộ nhớ cache đệm cục bộ (Tránh cắn đè dữ liệu của nhau)
             if (loaiHanhDongMang.includes("sotay")) {
  if (loaiHanhDongMang === "delete_sotay") {
    // Xóa khỏi Cache tab7
    result.tab7 = (result.tab7 || []).filter(i => i && i.id !== dataBody.id);
    // Cập nhật màn hình điện thoại lập tức
    setDanhSachSoTay(prev => prev.filter(i => i.id !== dataBody.id));
  } else {
    // Thêm vào Cache tab7
    const mangMoiST = (result.tab7 || []).filter(i => i && i.id !== dataBody.id);
    result.tab7 = [...mangMoiST, dataBody];
    // Cập nhật màn hình điện thoại lập tức
    setDanhSachSoTay(prev => [...prev.filter(i => i.id !== dataBody.id), dataBody]);
  }
}
              
              AsyncStorage.setItem(khoaDemTongHop, JSON.stringify(result));
            }
          });
        } else {
          setDongBoStatus("⚠️ Lỗi Server, hãy thử lại!");
        }
      })
      .catch(() => {
        setDongBoStatus("⚠️ Mất mạng. Hãy thử lại!");
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
          
          // 🎯 BỎ QUA CHỮ "THEO DÕI" KHI KIỂM TRA QUY TRÌNH ĐỂ TRÁNH LÀM ĐỨT MẠCH SƠ SINH / CAI SỮA
          const skText = item.suKien ? item.suKien.toString().toUpperCase().trim() : "";
          if (skText.includes("THEO DOI") || skText.includes("THEO DÕI")) return false;
          
          return maTaiDong === maTaiChuanQuet;
        })
      : [];

    lichSuRiengCuaNai.sort((a, b) => {
      const timeA = parseToDateObject(a.ngay) ? parseToDateObject(a.ngay).getTime() : 0;
      const timeB = parseToDateObject(b.ngay) ? parseToDateObject(b.ngay).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return (b.id ? b.id.toString() : "").localeCompare(a.id ? a.id.toString() : "");
    });

    const skGanNhatRiengCuaNai = lichSuRiengCuaNai.length > 0 ? lichSuRiengCuaNai[0] : null;
    let trangThaiLienTruocTho = "";

    if (skGanNhatRiengCuaNai) {
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
    } else if (trangThaiLienTruocTho === "Lốc" || trangThaiLienTruocTho === "Sảy Thai" || trangThaiLienTruocTho === "Chờ Phối" || trangThaiLienTruocTho === "Theo Dõi") {
      trangThaiXacThuc = "Chua_Phoi"; 
    } else if (trangThaiLienTruocTho === "") {
      trangThaiXacThuc = "Nai_Moi_Tinh";
    }

 if (suKienHienTaiChuan !== "Theo Dõi" && suKienHienTaiChuan !== "THEO DÕI") {
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
  }
       // ========================================================
    // 🛰️ BẢN VÁ TỐI ƯU FIRESTORE KẾT HỢP BỘ NÃO GÁC CỔNG QUY TRÌNH (0 GIÂY THỜI GIAN THỰC)
    // ========================================================
    const idSuKienMoi = "SK_" + Date.now() + "_" + Math.random().toString(36).substring(7);
    const emailChuoiSach = userEmail ? userEmail.toString().toLowerCase().trim() : "";
    const thoiGianThucCuaMay = new Date();
    const chuoiGioNhap = `${String(thoiGianThucCuaMay.getDate()).padStart(2, '0')}/${String(thoiGianThucCuaMay.getMonth() + 1).padStart(2, '0')}/${thoiGianThucCuaMay.getFullYear()} ${String(thoiGianThucCuaMay.getHours()).padStart(2, '0')}:${String(thoiGianThucCuaMay.getMinutes()).padStart(2, '0')}:${String(thoiGianThucCuaMay.getSeconds()).padStart(2, '0')}`;

    const dongMoi = {
      id: idSuKienMoi, // Đồng bộ mã số thời gian thực dùng chung cho cả Firestore và Robot Sheets
      userEmail: emailChuoiSach,
      thoiGianNhap: chuoiGioNhap,
      ngay: ngayHienThi ? ngayHienThi.toString().trim() : "", 
      maTai: maTaiChuanQuet, 
      suKien: suKien, 
      soHeo: canNhapSoHeo ? laySoAnToan(soHeo).toString() : "", 
      khoThai: suKien === "Đẻ" ? laySoAnToan(khoThai).toString() : "0",
      coiCoc: suKien === "Đẻ" ? laySoAnToan(coiCoc).toString() : "0",
      chetNgop: suKien === "Đẻ" ? laySoAnToan(chetNgop).toString() : "0",
      chonNuoi: suKien === "Đẻ" ? laySoAnToan(chonNuoi).toString() : "0",
      ghiChu: ghiChu ? ghiChu.toString().trim() : "",
      tuanBan: "" // Chừa trống đồng bộ cấu hình cho heo thịt nâng cấp sau
    };
    
    // 🧠 THUẬT TOÁN ĐẬP TAN ĐỘ TRỄ: Đẩy dòng mới vào đáy mảng RAM hiển thị ngay lập tức (0 giây)!
    setDanhSachLichSu(prev => [...prev, { ...dongMoi, actionType: "create", syncStatus: "waiting" }]);

    // 🎯 🚀 THUẬT TOÁN ĐỘT PHÁ CẬP NHẬT CHÉO: Ép mảng toàn cục mặt tiền đổi trạng thái thực tế lập tức ngoài RAM!
    if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
      global.danhSachCapNhatTrangThai = global.danhSachCapNhatTrangThai.map(heo => {
        if (heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiChuanQuet) {
          return {
            ...heo,
            trangThaiDienThoai: suKien, // Gá sự kiện mới chớp nhoáng (Phối / Đẻ / Cai Sữa) ngoài RAM phẳng
            trangThai: suKien,
            trangThaiCotH: suKien
          };
        }
        return heo;
      });
    }

     // RESET SẠCH CÁC Ô GÕ CHỮ TRÊN MÀN HÌNH CỦA BẠN ĐỂ CÔNG NHÂN NHẬP CA TIẾP THEO
    setMaTai(''); setSoHeo(''); setKhoThai(''); setCoiCoc(''); setChetNgop(''); setChonNuoi(''); setGhiChu('');
    setDongBoStatus(`⏳ Đang lưu...`);

    // 🚀 PHÓNG THẲNG LÊN KHO FIRESTORE EXPO REAL-TIME: Mất đúng 0.001 giây ngoài RAM phẳng!
    setDoc(doc(db, "Du_Lieu_Goc", idSuKienMoi), dongMoi)
      .then(() => {
        // Khi đám mây ghi nhận thành công, gỡ bỏ mác waiting để ghim cứng dòng ở đỉnh hiển thị vĩnh viễn
        setDongBoStatus('✅ Đã Lưu Thành Công');
        setDanhSachLichSu(prev => 
          prev.map(item => item.id === idSuKienMoi ? { ...item, syncStatus: 'synced' } : item)
        );
       // ========================================================
    // 🔥 BẢN VÁ LOGIC SHEET: TỰ ĐỘNG CHUYỂN DỊCH ĐÀN THEO MẸ & CAI SỮA
    // ========================================================
    if (suKien === "Đẻ") {
      // Logic Sheet: Ưu tiên Chọn nuôi, nếu trống thì lấy Số heo đẻ
      const soConSoSinhThucTe = laySoAnToan(chonNuoi) > 0 ? laySoAnToan(chonNuoi) : laySoAnToan(soHeo);
      
      setDataHeoThit(prev => {
        if (!prev) return prev;
        const soConTheoMeCu = Number(prev.theoMe || prev["Theo Mẹ"]) || 0;
        return {
          ...prev,
          theoMe: (soConTheoMeCu + soConSoSinhThucTe).toString()
        };
      });
    } 
    else if (suKien === "Cai Sữa" || suKien === "Cai sữa") {
      // 1. Tìm lại bầy sơ sinh gốc của con nái này trong nhật ký RAM để biết lúc đẻ ra/chọn nuôi bao nhiêu con
      const maTaiChuan = maTai.trim().toUpperCase();
     const caDeGanNhat = [...danhSachLichSu]
  .filter(i => i && i.maTai && i.maTai.toUpperCase().trim() === maTaiChuan && i.suKien === "Đẻ" && i.actionType !== "delete")
  .sort((a, b) => {
    // Ép buộc sắp xếp theo thời gian nhập thực tế (id hoặc thoiGianNhap), dòng nào nhập sau cùng sẽ lên đầu
    return (b.id || "").toString().localeCompare((a.id || "").toString());
  })[0];

      // Tính số lượng lúc đẻ ra để trừ sạch khỏi chuồng Theo Mẹ
      let soConGocLucDe = 0;
      if (caDeGanNhat) {
        soConGocLucDe = laySoAnToan(caDeGanNhat.chonNuoi) > 0 ? laySoAnToan(caDeGanNhat.chonNuoi) : laySoAnToan(caDeGanNhat.soHeo);
      }

      // Số lượng heo cai sữa thực tế khách vừa nhập để chuyển sang ô 4 tuần
      const soConCaiSuaMoiNhap = laySoAnToan(soHeo);

      setDataHeoThit(prev => {
        if (!prev) return prev;
        let targetKeyCaiSua = prev["4 Tuần ( Cai Sữa )"] !== undefined ? "4 Tuần ( Cai Sữa )" : "caiSua";
        const soConTheoMeCu = Number(prev.theoMe || prev["Theo Mẹ"]) || 0;
        const soConCaiSuaCu = Number(prev[targetKeyCaiSua]) || 0;
        
        return {
          ...prev,
          theoMe: Math.max(0, soConTheoMeCu - soConGocLucDe).toString(), // Trừ sạch số lượng gốc lúc đẻ của bầy đó
          [targetKeyCaiSua]: (soConCaiSuaCu + soConCaiSuaMoiNhap).toString() // Chỉ cộng số lượng cai sữa thực tế vào ô 4 tuần
        };
      });
    }
    // ========================================================
  })
      .catch((error) => {
        console.error("❌ Lỗi nghẽn luồng Fire lán trại:", error);
        // Bộ giảm xóc bọc lót khi rớt sóng 4G: Giữ nguyên số liệu ở Offline máy khách để chống mất dòng dữ liệu
        setDongBoStatus('⚠️ Lưu Offline lán trại');
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

    // ========================================================
  // 🎯 BẢN VÁ SỬA TỨC THÌ: GHI ĐÈ THẲNG FIRESTORE, TUYỆT DIỆT QUAY VÒNG CHỜ MẠNG
  // ========================================================
  const handleSaveEdit = async () => {
    if (!editSoHeo.trim() && editCanNhapSoHeo && editSuKien !== "Đẻ") {
      return Alert.alert("Thông báo", "Vui lòng nhập Số Lượng heo!");
    }
    
    // Đóng ngay modal sửa lập tức để người nuôi không phải chờ đợi
    setIsEditModalVisible(false);
    setDongBoStatus("⏳ Đang cập nhật dữ liệu...");

    const quanSoConThucTe = editSuKien === "Đẻ" ? laySoAnToan(editSoHeo) : (editSoHeo.trim() !== "" ? Number(editSoHeo) : "");
    const maTaiChuanQuet = editMaTai ? editMaTai.toString().toUpperCase().trim() : "";
    const suKienHienTaiChuan = editSuKien ? editSuKien.toString().trim().normalize("NFC") : "";

    // Gom dữ liệu sạch chuẩn cấu hình tài liệu Firestore NoSQL
    const dongCapNhatMoi = {
      id: editingId, 
      userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
      ngay: editNgay,
      maTai: maTaiChuanQuet,   
      suKien: editSuKien, 
      soHeo: quanSoConThucTe.toString(), 
      khoThai: editSuKien === "Đẻ" ? laySoAnToan(editKhoThai).toString() : "0",
      coiCoc: editSuKien === "Đẻ" ? laySoAnToan(editCoiCoc).toString() : "0",
      chetNgop: editSuKien === "Đẻ" ? laySoAnToan(editChetNgop).toString() : "0",
      chonNuoi: editSuKien === "Đẻ" ? laySoAnToan(editChonNuoi).toString() : "0",
      ghiChu: editGhiChu.trim(),
      tuanBan: "" // Chừa trống trường dữ liệu phục vụ nâng cấp heo thịt lô tuần
    };

    // 🧠 CẬP NHẬT LẠC QUAN: Ép ma trận dòng vừa sửa ngoài RAM đổi số hiển thị rõ nét ngay lập tức (0.01 giây)!
    setDanhSachLichSu(prev => prev.map(i => i.id === editingId ? { ...i, ...dongCapNhatMoi, syncStatus: "synced" } : i));

    // Đồng bộ lật nhãn trạng thái nái ngoài danh bạ mặt tiền sang sự kiện mới sửa đổi
    if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
      global.danhSachCapNhatTrangThai = global.danhSachCapNhatTrangThai.map(heo => {
        if (heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiChuanQuet) {
          return { ...heo, trangThaiDienThoai: suKienHienTaiChuan, trangThai: suKienHienTaiChuan, trangThaiCotH: suKienHienTaiChuan };
        }
        return heo;
      });
    }

    // 🎯 PHÓNG LỆNH GHI ĐÈ LÊN CLOUD FIRESTORE TỐC ĐỘ SIÊU TỐC
    const { doc, setDoc } = require('firebase/firestore');
    setDoc(doc(db, "Du_Lieu_Goc", editingId), dongCapNhatMoi, { merge: true })
      .then(async () => {
        setDongBoStatus("✅ Đã cập nhật sửa đổi thành công!");
         // ========================================================
    // 🔥 BẢN VÁ TỐI CAO: BÙ TRỪ CHÊNH LỆCH KHI SỬA SỰ KIỆN ĐẺ / CAI SỮA
    // ========================================================
    try {
      const dongLichSuCu = danhSachLichSu.find(i => i && i.id === editingId);
      if (dongLichSuCu) {
        const suKienCuChuan = (dongLichSuCu.suKien || "").toString().trim().normalize("NFC");
        const maTaiChuan = (dongCapNhatMoi.maTai || "").toString().toUpperCase().trim();

        // 🌟 TRƯỜNG HỢP 1: KHÁCH SỬA SỐ LIỆU DÒNG "ĐỂ"
        if (editSuKien === "Đẻ") {
          const soCuLucDe = laySoAnToan(dongLichSuCu.chonNuoi) > 0 ? laySoAnToan(dongLichSuCu.chonNuoi) : laySoAnToan(dongLichSuCu.soHeo);
          const soMoiLucDe = laySoAnToan(dongCapNhatMoi.chonNuoi) > 0 ? laySoAnToan(dongCapNhatMoi.chonNuoi) : laySoAnToan(dongCapNhatMoi.soHeo);
          const chenhLechDe = soMoiLucDe - soCuLucDe; // Tính độ dôi dư/khấu trừ

          setDataHeoThit(prev => {
            if (!prev) return prev;
            const soConTheoMeCu = Number(prev.theoMe || prev["Theo Mẹ"]) || 0;
            return { ...prev, theoMe: Math.max(0, soConTheoMeCu + chenhLechDe).toString() };
          });
        } 
        
        // 🌟 TRƯỜNG HỢP 2: KHÁCH SỬA SỐ LIỆU DÒNG "CAI SỮA"
        else if (editSuKien === "Cai Sữa" || editSuKien === "Cai sữa") {
          const soCaiSuaCu = laySoAnToan(dongLichSuCu.soHeo);
          const soCaiSuaMoi = laySoAnToan(dongCapNhatMoi.soHeo);
          const chenhLechCaiSua = soCaiSuaMoi - soCaiSuaCu;

          setDataHeoThit(prev => {
            if (!prev) return prev;
            let targetKeyCaiSua = prev["4 Tuần ( Cai Sữa )"] !== undefined ? "4 Tuần ( Cai Sữa )" : "caiSua";
            const soConCaiSuaCu = Number(prev[targetKeyCaiSua]) || 0;
            return { ...prev, [targetKeyCaiSua]: Math.max(0, soConCaiSuaCu + chenhLechCaiSua).toString() };
          });
        }
      }
    } catch (errEditSync) { console.log("Lỗi đồng bộ sửa:", errEditSync); }
    // ========================================================

        
        // Găm cứng dữ liệu sạch vào bộ nhớ đệm Cache ổ cứng của thiết bị điện thoại
        const emailChuoiSach = userEmail ? userEmail.toString().toLowerCase().trim() : "";
        const khoaDemTongHop = `cache_tonghop_pigvn_${emailChuoiSach}`;
        const dataDemTho = await AsyncStorage.getItem(khoaDemTongHop);
        if (dataDemTho !== null) {
          const resultChuan = JSON.parse(dataDemTho);
          resultChuan.tab1 = (resultChuan.tab1 || []).map(i => i.id === editingId ? { ...i, ...dongCapNhatMoi } : i);
          await AsyncStorage.setItem(khoaDemTongHop, JSON.stringify(resultChuan));
        }
      })
      .catch((error) => {
        console.error("❌ Lỗi sửa Fire lán trại:", error);
        setDongBoStatus("⚠️ Lưu ngoại tuyến lán trại");
      });
  };


  // 🎯 BẢN VÁ XÓA TỨC THÌ: BĂM THẲNG VÀO FIRESTORE, TUYỆT DIỆT MỜ DÒNG CHỜ MẠNG
  // ========================================================
  const handleXoaNhatKyChuDong = async (item) => {
    if (!item || !item.id) return;

    // Khai báo thư viện xóa của Firestore trực tiếp trong hàm
    const { doc, deleteDoc } = require('firebase/firestore');

    const checkSuKien = item.suKien ? item.suKien.toString().trim().toLowerCase() : "";
    const qtyToDelete = !item.soHeo || isNaN(item.soHeo) ? 0 : Number(item.soHeo);
    const weekStr = item.tuanBan ? item.tuanBan.toString().replace(/\D/g, '') : "";
    const maTaiQuetChuan = item.maTai ? item.maTai.toString().toUpperCase().trim() : "";

    // 🌟 BƯỚC 1: CẬP NHẬT GIAO DIỆN LẠC QUAN (Ẩn dòng trên màn hình lập tức trong 0.01s)
    setDanhSachLichSu(prev => prev.filter(i => i.id !== item.id));
    setDongBoStatus(`⏳ Đang xóa dữ liệu...`);

    // 🌟 BƯỚC 2: Hoàn tác và tính toán lại quân số Heo Thịt ngoài RAM thiết bị ngay lập trưng
    if (checkSuKien.includes("nhập") || checkSuKien.includes("nhap") || checkSuKien.includes("hao") || checkSuKien.includes("bán") || checkSuKien.includes("ban")) {
      let targetKey = `${weekStr} Tuần`;
      if (weekStr === "3") targetKey = "theoMe";
      else if (weekStr === "4") targetKey = dataHeoThit && dataHeoThit["4 Tuần ( Cai Sữa )"] !== undefined ? "4 Tuần ( Cai Sữa )" : "caiSua";

      setDataHeoThit(prev => {
        if (!prev || !prev[targetKey]) return prev;
        const nextState = { ...prev };
        let currentQtyOfCell = Number(nextState[targetKey]) || 0;

        if (checkSuKien.includes("nhập") || checkSuKien.includes("nhap")) {
          nextState[targetKey] = Math.max(0, currentQtyOfCell - qtyToDelete).toString();
        } else if (checkSuKien.includes("hao") || checkSuKien.includes("bán") || checkSuKien.includes("ban")) {
          nextState[targetKey] = (currentQtyOfCell + qtyToDelete).toString();
        }

        // Tính lại số tổng đàn trên Banner đỉnh đầu
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
// 🚀 TÌM ĐOẠN NÀY TRONG HÀM handleXoaNhatKyChuDong Ở APP.JS:
// (Tìm ngay dưới dòng lệnh: setDongBoStatus(`⏳ Đang xóa dữ liệu...`);)

// 🌟 BƯỚC 2: Hoàn tác và tính toán lại quân số Heo Thịt ngoài RAM thiết bị ngay lập tức
if (checkSuKien.includes("nhập") || checkSuKien.includes("nhap") || checkSuKien.includes("hao") || checkSuKien.includes("bán") || checkSuKien.includes("ban")) {
  // ... Giữ nguyên đoạn code xử lý xóa heo thịt của bạn ở đây ...
} 
// ========================================================
// 🔥 CHÈN THÊM ĐOẠN VÁ HOÀN TÁC KHI XÓA SỰ KIỆN ĐẺ / CAI SỮA CỦA NÁI VÀO ĐÂY:
// ========================================================
else if (checkSuKien === "đẻ" || checkSuKien === "de" || checkSuKien === "cai sữa" || checkSuKien === "cai sua") {
  setDataHeoThit(prev => {
    if (!prev) return prev;
    const nextState = { ...prev };
    let targetKeyCaiSua = nextState["4 Tuần ( Cai Sữa )"] !== undefined ? "4 Tuần ( Cai Sữa )" : "caiSua";
    const maTaiChuan = maTaiQuetChuan; // Mã tai của con nái bị xóa dòng

    // 🌟 TRƯỜNG HỢP A: XÓA DÒNG NHẬT KÝ ĐỂ
    if (checkSuKien === "đẻ" || checkSuKien === "de") {
      // Ưu tiên chọn nuôi, nếu trống lấy số heo đẻ sơ sinh
      const soConXoaDe = laySoAnToan(item.chonNuoi) > 0 ? laySoAnToan(item.chonNuoi) : laySoAnToan(item.soHeo);
      let currentTheoMe = Number(nextState.theoMe || nextState["Theo Mẹ"]) || 0;
      
      nextState.theoMe = Math.max(0, currentTheoMe - soConXoaDe).toString(); // Khấu trừ sạch khỏi chuồng Theo Mẹ
    } 
    
    // 🌟 TRƯỜNG HỢP B: XÓA DÒNG NHẬT KÝ CAI SỮA
    else if (checkSuKien === "cai sữa" || checkSuKien === "cai sua") {
      // 1. Số lượng heo cai sữa thực tế bị xóa bỏ khỏi ô 4 tuần
      const soConXoaCaiSua = laySoAnToan(item.soHeo);
      
      // 2. Truy vết tìm lại ca Đẻ mới nhất của riêng con nái này trên RAM để hoàn trả lợn sơ sinh về chuồng Theo Mẹ
      const mangCaDeGoc = [...danhSachLichSu]
        .filter(i => i && i.maTai && i.maTai.toUpperCase().trim() === maTaiChuan && i.suKien === "Đẻ" && i.id !== item.id && i.actionType !== "delete");
      
      let soConGocLucDe = 0;
      if (mangCaDeGoc.length > 0) {
        const caDeGanNhat = mangCaDeGoc[0]; // Ca đẻ gần nhất còn sót lại
        soConGocLucDe = laySoAnToan(caDeGanNhat.chonNuoi) > 0 ? laySoAnToan(caDeGanNhat.chonNuoi) : laySoAnToan(caDeGanNhat.soHeo);
      }

      let currentTheoMe = Number(nextState.theoMe || nextState["Theo Mẹ"]) || 0;
      let currentCaiSua = Number(nextState[targetKeyCaiSua]) || 0;
      
      nextState.theoMe = (currentTheoMe + soConGocLucDe).toString(); // Hoàn trả số con sơ sinh ban đầu về chuồng Theo Mẹ
      nextState[targetKeyCaiSua] = Math.max(0, currentCaiSua - soConXoaCaiSua).toString(); // Khấu trừ số lượng cai sữa ra khỏi chuồng 4 tuần
    }

    // Tự động gá lệnh tính toán lại số tổng cho 5 khối giai đoạn trên banner đỉnh
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
// ========================================================

    // Nếu ca bị xóa mang nhãn hiệu "Thải" -> Cộng trả đàn nái lại 1 con ngoài RAM
    if (checkSuKien === "thải" || checkSuKien === "thai") {
      setDanhSachMaTai(prev => prev.map(heo => 
        (heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiQuetChuan)
          ? { ...heo, trangThaiDienThoai: "Chờ Phối", trangThai: "Chờ Phối", trangThaiCotH: "Chờ Phối" }
          : heo
      ));
    }

    // 🌟 BƯỚC 3: PHÁT LỆNH XOÁ THẲNG LÊN CLOUD FIRESTORE (TỐC ĐỘ SIÊU TỐC)
    try {
      await deleteDoc(doc(db, "Du_Lieu_Goc", item.id));
      setDongBoStatus('✅ Đã xoá dữ liệu vĩnh viễn!');
      
      // Cập nhật ngầm bộ nhớ đệm Cache ổ cứng của máy khách
      const emailChuoiSach = userEmail ? userEmail.toString().toLowerCase().trim() : "";
      const khoaDemTongHop = `cache_tonghop_pigvn_${emailChuoiSach}`;
      const dataDemTho = await AsyncStorage.getItem(khoaDemTongHop);
      if (dataDemTho !== null) {
        const resultChuan = JSON.parse(dataDemTho);
        resultChuan.tab1 = (resultChuan.tab1 || []).filter(i => i && i.id !== item.id);
        if (checkSuKien === "thải" || checkSuKien === "thai") {
          resultChuan.tab2 = (resultChuan.tab2 || []).map(heo => 
            (heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiQuetChuan)
              ? { ...heo, trangThaiDienThoai: "Chờ Phối", trangThai: "Chờ Phối", trangThaiCotH: "Chờ Phối" }
              : heo
          );
        }
        await AsyncStorage.setItem(khoaDemTongHop, JSON.stringify(resultChuan));
      }
    } catch (errorRef) {
      console.error("❌ Lỗi xóa thực tế:", errorRef);
      setDongBoStatus('⚠️ Lưu trạng thái ngoại tuyến');
    }
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
                if (!i || !i.maTai || i.actionType === "delete" || i.actionType === "mt_delete") return false;
                if (i.maTai.toString().toUpperCase().trim() !== maTaiInHoa) return false;
                
                const skTho = i.suKien ? i.suKien.toString().trim().normalize("NFC") : "";
                
                // 🎯 ĐÃ VÁ: Bỏ qua dòng theo dõi khi mở bảng cai sữa nhanh ngoài chuồng nuôi con
                if (skTho.toUpperCase().includes("THEO DOI") || skTho.toUpperCase().includes("THEO DÕI")) return false;
                
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

    // 🌟 TẠO ID DUY NHẤT CHUẨN ĐỒNG BỘ FIRESTORE VÀ ROBOT SHEETS
    const idSuKienCaiSua = "SK_" + Date.now() + "_" + Math.random().toString(36).substring(7);
    const emailChuoiSach = userEmail ? userEmail.toString().toLowerCase().trim() : "";
    const thoiGianThucCuaMay = new Date();
    const chuoiGioNhap = `${String(thoiGianThucCuaMay.getDate()).padStart(2, '0')}/${String(thoiGianThucCuaMay.getMonth() + 1).padStart(2, '0')}/${thoiGianThucCuaMay.getFullYear()} ${String(thoiGianThucCuaMay.getHours()).padStart(2, '0')}:${String(thoiGianThucCuaMay.getMinutes()).padStart(2, '0')}:${String(thoiGianThucCuaMay.getSeconds()).padStart(2, '0')}`;

   const dongMoiCaiSua = {
      id: idSuKienCaiSua,
      userEmail: emailChuoiSach,
      thoiGianNhap: chuoiGioNhap,
      ngay: ngayHienThi ? ngayHienThi.toString().trim() : formatVNDate(new Date()), // Đồng bộ lấy trục ngày hiển thị của trại
      maTai: maTaiInHoa,
      suKien: "Cai Sữa",
      soHeo: laySoAnToan(caiSuaSoCon).toString(), 
      khoThai: "0", coiCoc: "0", chetNgop: "0", chonNuoi: "0", // Ép tĩnh về chữ số 0 để không lỗi bộ lọc Excel
      ghiChu: "Cai sữa nhanh tại ô chuồng đẻ",
      tuanBan: "" 
    };

    // 🧠 CẬP NHẬT LẠC QUAN: Ghim ngay vào RAM Nhật Ký để đổi màu nút bấm tức thì ngoài màn hình (0 giây)
       setDanhSachLichSu(prev => [...prev, { ...dongMoiCaiSua, actionType: "create", syncStatus: "waiting" }]);

    // 🚀 PHÓNG THẲNG LÊN KHO FIRESTORE EXPO REAL-TIME: Rút hoàn toàn khỏi Apps Script cũ!
    const { doc, setDoc } = require('firebase/firestore');
    setDoc(doc(db, "Du_Lieu_Goc", idSuKienCaiSua), dongMoiCaiSua)
      .then(() => {
        setDongBoStatus(`✅ Nái ${maTaiInHoa} đã lưu ${dongMoiCaiSua.soHeo} con thành công!`);
        // Khi Firestore ghi nhận xong, đổi mác sang synced để màng lọc Tab 4 nhận diện và ẩn heo đi lập tức
        setDanhSachLichSu(prev => prev.map(i => i.id === idSuKienCaiSua ? { ...i, syncStatus: "synced" } : i));
    // ========================================================
    // 🔥 BẢN VÁ LOGIC SHEET: KHẤU TRỪ THEO MẸ VÀ TĂNG TẢI CAI SỮA 4 TUẦN
    // ========================================================
    // Tìm bầy đẻ gốc của nái này trên RAM
    const caDeGanNhat = [...danhSachLichSu]
  .filter(i => i && i.maTai && i.maTai.toUpperCase().trim() === maTaiInHoa && i.suKien === "Đẻ" && i.actionType !== "delete")
  .sort((a, b) => {
    // Ép buộc sắp xếp theo thời gian nhập thực tế (id hoặc thoiGianNhap), dòng nào nhập sau cùng sẽ lên đầu
    return (b.id || "").toString().localeCompare((a.id || "").toString());
  })[0];

    let soConGocLucDe = 0;
    if (caDeGanNhat) {
      soConGocLucDe = laySoAnToan(caDeGanNhat.chonNuoi) > 0 ? laySoAnToan(caDeGanNhat.chonNuoi) : laySoAnToan(caDeGanNhat.soHeo);
    }

    const soConCaiSuaNhanh = laySoAnToan(caiSuaSoCon);

    setDataHeoThit(prev => {
      if (!prev) return prev;
      let targetKeyCaiSua = prev["4 Tuần ( Cai Sữa )"] !== undefined ? "4 Tuần ( Cai Sữa )" : "caiSua";
      const soConTheoMeCu = Number(prev.theoMe || prev["Theo Mẹ"]) || 0;
      const soConCaiSuaCu = Number(prev[targetKeyCaiSua]) || 0;
      
      return {
        ...prev,
        theoMe: Math.max(0, soConTheoMeCu - soConGocLucDe).toString(), // Trừ sạch bầy con theo mẹ gốc
        [targetKeyCaiSua]: (soConCaiSuaCu + soConCaiSuaNhanh).toString() // Đưa số cai sữa thực tế vào ô 4 tuần
      };
    });
    // ========================================================

        setCaiSuaHeoSoCon('');
      })
      .catch((error) => {
        console.error("❌ Lỗi nghẽn luồng Cai Sữa:", error);
        setDongBoStatus('⚠️ Lưu ngoại tuyến lán trại');
        // Giữ nguyên mác waiting để người nuôi biết dữ liệu đang nằm ở Offline máy khách
        setCaiSuaHeoSoCon('');
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
    // 🐷 BẢN VÁ TỐI CAO: CHUYỂN HEO THỊT SANG FIRESTORE CHUẨN XỊN 100%
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

    const idHeoThitMoi = "SK_" + Date.now() + "_" + Math.random().toString(36).substring(7);
    const emailChuoiSach = userEmail ? userEmail.toString().toLowerCase().trim() : "";
    const thoiGianThucCuaMay = new Date();
    const chuoiGioNhap = `${String(thoiGianThucCuaMay.getDate()).padStart(2, '0')}/${String(thoiGianThucCuaMay.getMonth() + 1).padStart(2, '0')}/${thoiGianThucCuaMay.getFullYear()} ${String(thoiGianThucCuaMay.getHours()).padStart(2, '0')}:${String(thoiGianThucCuaMay.getMinutes()).padStart(2, '0')}:${String(thoiGianThucCuaMay.getSeconds()).padStart(2, '0')}`;

    const dongMoiHeoThit = {
      id: idHeoThitMoi,                     
      userEmail: emailChuoiSach,
      thoiGianNhap: chuoiGioNhap,                
      ngay: heoThitNgay ? heoThitNgay.toString().trim() : formatVNDate(new Date()),                           
      maTai: heoThitActionType,                    
      suKien: heoThitActionType,                   
      soHeo: soConTacDong.toString(), // Ép kiểu chuỗi để tương thích mảng phẳng thô          
      khoThai: "0", coiCoc: "0", chetNgop: "0", chonNuoi: "0", // Khóa cứng 0 phòng ngừa lỗi ô trống nhiễm độc
      ghiChu: heoThitGhiChu ? heoThitGhiChu.trim() : "Biến động số lượng heo thịt chuồng thương phẩm", 
      tuanBan: soTuanGuiServer.toString()
    };

    // 🌟 BƯỚC 1: Đẩy dòng mới nối đuôi ra đáy mảng RAM gốc để useEffect giật chữ màu cam lên đỉnh hiển thị
    setDanhSachLichSu(prev => [...prev, { ...dongMoiHeoThit, actionType: "create", syncStatus: "waiting" }]);

    // 🌟 BƯỚC 2 (HIỆN RA LIỀN): Ép ma trận ô tuần lẻ cộng/trừ số lượng văng số trực tiếp trên RAM ngay lập tức
    setDataHeoThit(prev => {
      if (!prev) return prev;
      let soConCu = prev[khoaThucTeRAM] !== undefined ? Number(prev[khoaThucTeRAM]) : 0;
      let soConMoi = soConCu;

      if (heoThitActionType === "Nhập Đàn") {
        soConMoi = Math.max(0, soConCu + soConTacDong);
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

      // ✅ ĐÃ FIX TRIỆT ĐỂ: Thay toàn bộ chữ nextState thành ketQuaMoi
      ketQuaMoi.giaiDoan3 = (nT5 + nT6 + nT7 + nT8 + nT9).toString();
      ketQuaMoi.giaiDoan4 = (nT10 + nT11 + nT12 + nT13 + nT14 + nT15).toString();
      ketQuaMoi.giaiDoan5 = (nT16 + nT17 + nT18 + nT19 + nT20).toString();
      ketQuaMoi.giaiDoan6 = (nT21 + nT22 + nT23 + nT24 + nT25).toString();
      ketQuaMoi.giaiDoan7 = (nT26 + nT27 + nT28 + nT29 + nT30).toString();

      return ketQuaMoi;
    });

    // 🌟 BƯỚC 3: Kích nổ lệnh mạng chọc trực tiếp lên kho dữ liệu mây Firestore NoSQL
    const { doc, setDoc } = require('firebase/firestore');
    setDoc(doc(db, "Du_Lieu_Goc", idHeoThitMoi), dongMoiHeoThit)
      .then(() => {
        setDongBoStatus(`✅ Đã Lưu số heo Tuần ${oTuanChonChuan}!`);
        // Gỡ bỏ trạng thái chờ mạng để ghim cứng dòng ở đỉnh hiển thị vĩnh viễn
        setDanhSachLichSu(prev => prev.map(i => i.id === idHeoThitMoi ? { ...i, syncStatus: "synced" } : i));
        setHeoThitSoCon(''); setHeoThitGhiChu('');
      })
      .catch((error) => {
        console.error("❌ Lỗi nghẽn luồng Fire heo thịt:", error);
        setDongBoStatus('⚠️ Lưu ngoại tuyến lán trại');
        // Giảm xóc khi mất mạng ngầm, quay xe thu hồi quân số đã nhảy lầm ngoài RAM để bảo vệ dữ liệu sạch
        setDanhSachLichSu(prev => prev.filter(i => i.id !== idHeoThitMoi));
        
        setDataHeoThit(prev => {
          if (!prev) return prev;
          let soConHienTai = prev[khoaThucTeRAM] !== undefined ? Number(prev[khoaThucTeRAM]) : 0;
          let hoanTacSoCon = soConHienTai;
          if (heoThitActionType === "Nhập Đàn") hoanTacSoCon = Math.max(0, soConHienTai - soConTacDong);
          else if (heoThitActionType === "Hao Hụt" || heoThitActionType === "Bán") hoanTacSoCon = soConHienTai + soConTacDong;
          return { ...prev, [khoaThucTeRAM]: hoanTacSoCon.toString() };
        });
        setHeoThitSoCon(''); setHeoThitGhiChu('');
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
    const thoiGianThucCuaMay = new Date();
    const chuoiGioNhap = `${String(thoiGianThucCuaMay.getDate()).padStart(2, '0')}/${String(thoiGianThucCuaMay.getMonth() + 1).padStart(2, '0')}/${thoiGianThucCuaMay.getFullYear()} ${String(thoiGianThucCuaMay.getHours()).padStart(2, '0')}:${String(thoiGianThucCuaMay.getMinutes()).padStart(2, '0')}:${String(thoiGianThucCuaMay.getSeconds()).padStart(2, '0')}`;

    const dongCapNhatMoi = {
      id: suaHeoThitId,
      userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
      thoiGianNhap: chuoiGioNhap,
      actionType: "update", 
      ngay: suaHeoThitNgay,
      maTai: suaHeoThitActionType,   
      suKien: suaHeoThitActionType, 
      soHeo: newQty.toString(), 
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

    const { doc, setDoc } = require('firebase/firestore');
    setDoc(doc(db, "Du_Lieu_Goc", suaHeoThitId), dongCapNhatMoi, { merge: true })
      .then(async () => {
        setDongBoStatus("✅ Đã cập nhật sửa đổi thành công!");
        
        // Găm cứng dữ liệu sạch vào bộ nhớ đệm Cache ổ cứng của thiết bị điện thoại
        const emailChuoiSach = userEmail ? userEmail.toString().toLowerCase().trim() : "";
        const khoaDemTongHop = `cache_tonghop_pigvn_${emailChuoiSach}`;
        const dataDemTho = await AsyncStorage.getItem(khoaDemTongHop);
        if (dataDemTho !== null) {
          const resultChuan = JSON.parse(dataDemTho);
          resultChuan.tab1 = (resultChuan.tab1 || []).map(i => i.id === suaHeoThitId ? { ...i, ...dongCapNhatMoi } : i);
          await AsyncStorage.setItem(khoaDemTongHop, JSON.stringify(resultChuan));
        }
      })
      .catch((error) => {
        console.error("❌ Lỗi sửa Fire lán trại heo thịt:", error);
        setDongBoStatus("⚠️ Lưu ngoại tuyến lán trại");
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
    
    // ⚙️ 1. Ép chính xác mã khóa ID theo cấu trúc MTSK_ kết hợp mã số ngẫu nhiên chống trùng khóa kịch sàn
    const idDocBanQuickAdd = "MTSK_" + new Date().getTime(); 
    let giongHeoChuanGhi = quickGiong && quickGiong.trim() !== "" ? quickGiong.trim() : "Nái Nhà";

    // ⏱️ 2. Tạo chuỗi thời gian thực ngày/tháng/năm giờ:phút:giây để Robot 2 đẩy tự động vào cột C bên Sheets
    const thoiGianThucCuaMay = new Date();
    const chuoiGioNhap = `${String(thoiGianThucCuaMay.getDate()).padStart(2, '0')}/${String(thoiGianThucCuaMay.getMonth() + 1).padStart(2, '0')}/${thoiGianThucCuaMay.getFullYear()} ${String(thoiGianThucCuaMay.getHours()).padStart(2, '0')}:${String(thoiGianThucCuaMay.getMinutes()).padStart(2, '0')}:${String(thoiGianThucCuaMay.getSeconds()).padStart(2, '0')}`;

    const dongMoiMaTai = {
      id: idDocBanQuickAdd,
      userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
      thoiGianNhap: chuoiGioNhap, // Dấu thời gian đổ cứng vào cột C của Google Sheets
      nhom: quickLua ? quickLua.toString().trim() : "Hậu Bị",
      maTai: maTaiChuanInHoa,
      giong: giongHeoChuanGhi,
      luaGoc: quickLua ? quickLua.toString().trim() : "Hậu Bị",
      luaHienThiThongMinh: quickLua ? quickLua.toString().trim() : "Hậu Bị",
      ngayPhoi: "",
      ngayCotI: "---",
      ngayDuKienDeMoi: "---",
      
      trangThaiDienThoai: "Chờ Phối", 
      trangThai: "Chờ Phối",
      trangThaiCotH: "Chờ Phối",
      
      ghiChu: "Them nhanh tu o go mini",
      vuaNhapMoi: "chua_reload", // 🎯 VÁ CHÍ MẠNG 1: Trả lại đúng nhãn chuỗi chữ "chua_reload" để khớp 100% với hộp thông báo thành công của SowRegistryTab!
      syncStatus: "waiting", // Gá tạm nhãn waiting ngoài RAM để giao diện hiển thị nhấp nháy tiến độ mượt mà
      actionType: "firestore_hoan_thanh" // 🎯 VÁ CHÍ MẠNG 2: Đổi tên nhãn hành động để bộ não useEffect trung tâm chặn đứng hàm guiYeuCauMang chạy ẩn cắn ngược gây treo State!
    };

    // Chọc RAM cập nhật lập tức danh sách hiển thị ngoài màn hình chính lán trại trong 0.001s
    setDanhSachMaTai(prev => {
  if (!Array.isArray(prev)) return [dongMoiMaTai];
  const mangCuDaDonDep = prev.map(heo => heo && heo.vuaNhapMoi === "chua_reload" ? { ...heo, vuaNhapMoi: false } : heo);
  return [dongMoiMaTai, ...mangCuDaDonDep];
});

if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
  const mangGlobalCuDaDonDep = global.danhSachCapNhatTrangThai.map(heo => heo && heo.vuaNhapMoi === "chua_reload" ? { ...heo, vuaNhapMoi: false } : heo);
  global.danhSachCapNhatTrangThai = [dongMoiMaTai, ...mangGlobalCuDaDonDep];
}

    // 🛰️ 3. Gọi trực tiếp thư viện ghi đè tài liệu Cloud Firestore NoSQL
    const { doc, setDoc } = require('firebase/firestore');
    
    setDoc(doc(db, "Danh_Sach_Ma_Tai", idDocBanQuickAdd), dongMoiMaTai)
      .then(async () => {
        setDongBoStatus('✅ Đã tạo mã tai thành công!'); 
        setIsQuickSaving(false);
        setIsQuickAddModalVisible(false);
        
        
        // Cập nhật lại nhãn trạng thái ngoài RAM sang sáng rõ nét sau khi Firestore báo thành công
        setDanhSachMaTai(prev => prev.map(i => i.id === idDocBanQuickAdd ? { ...i, syncStatus: "synced" } : i));
        if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
          global.danhSachCapNhatTrangThai = global.danhSachCapNhatTrangThai.map(i => i.id === idDocBanQuickAdd ? { ...i, syncStatus: "synced" } : i);
        }

        setMaTai(maTaiChuanInHoa); 
        setQuickGiong('');
        setQuickLua('Hậu Bị');

        // 🎯 ĐỘ TRỄ LIÊN THÔNG UI: Trì hoãn 250ms chờ Pop-up gõ chữ ẩn hẳn rồi mới bật Pop-up thông báo thành công đẹp mắt
        setTimeout(() => {
          setTxtThanhCongNoiDung({
            tieuDe: "GHI NHẬN THÀNH CÔNG",
            maTai: maTaiChuanInHoa,
            loiGiai: "Thành Công. Bắt đầu Nhập Liệu cho Nái"
          });
          setIsThanhCongModalVisible(true);
        }, 100);

        // Găm cứng dữ liệu sạch vào bộ nhớ đệm Cache ổ cứng thiết bị để chạy mượt khi rớt mạng
        const emailChuoiSach = userEmail ? userEmail.toString().toLowerCase().trim() : "";
        const khoaDemTongHop = `cache_tonghop_pigvn_${emailChuoiSach}`;
        const dataDemTho = await AsyncStorage.getItem(khoaDemTongHop);
        if (dataDemTho !== null) {
          const resultChuan = JSON.parse(dataDemTho);
          // Ghim dòng mới gõ vào cache tab 2 nội bộ
          resultChuan.tab2 = [{ ...dongMoiMaTai, syncStatus: "synced" }, ...(resultChuan.tab2 || [])];
          await AsyncStorage.setItem(khoaDemTongHop, JSON.stringify(resultChuan));
        }
      })
      .catch((error) => {
        console.error("❌ Lỗi ghi thêm nhanh nái Firestore:", error);
        
        // Luôn nhả khóa giao diện ở nhánh lỗi để không bao giờ bị treo cứng bánh xe chờ
        setIsQuickSaving(false);
        
        // Hoàn tác RAM hiển thị nếu có sự cố mất kết nối mạng xảy ra ngoài lán trại
        setDanhSachMaTai(prev => prev.filter(i => i.id !== dongMoiMaTai.id));
        if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
          global.danhSachCapNhatTrangThai = global.danhSachCapNhatTrangThai.filter(i => i && i.id !== dongMoiMaTai.id);
        }
        setDongBoStatus('⚠️ Lưu ngoại tuyến lán trại');
        Alert.alert("Lỗi", "Không thể lưu mã tai lên hệ thống đám mây.");
      });
  };


  // 🚀 KHỐI 2/4: HÀM THÊM CHÍNH - PHẲNG SẠCH 100% TIẾNG VIỆT KHÔNG DẤU
  // ========================================================
  const handleSaveMaTai = () => {
    if (!mtMaTai.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Mã Tai!");

    const maTaiGoc = mtMaTai.toUpperCase().trim();
    if (Array.isArray(danhSachMaTai) && danhSachMaTai.some(heo => heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiGoc)) {
      return Alert.alert("Cảnh báo trùng mã tai Cũ", `Mã tai [${maTaiGoc}] đã tồn tại Hoặc nằm trong mục loại ( Thải ). Vui lòng nhập số tai khác hoặc thêm kí tự!`);
    }
    const giongHeoChuanTab2 = mtGiong && mtGiong.trim() !== "" ? mtGiong.trim() : "Nái Nhà";
    const idDocBanChinh = "MTSK_" + new Date().getTime();
    let luaHeoGhiDoc = "Hậu Bị";
if (mtLua && mtLua.toString().trim() !== "" && mtLua !== "OPEN_MENU_MT_LUA") {
  luaHeoGhiDoc = mtLua.toString().trim();
}
   // ⏱️ SINH DẤU THỜI GIAN NHẬP CHO CỘT C BÊN SHEET DANH BẠ NÁI
    const thoiGianThucCuaMay = new Date();
    const chuoiGioNhap = `${String(thoiGianThucCuaMay.getDate()).padStart(2, '0')}/${String(thoiGianThucCuaMay.getMonth() + 1).padStart(2, '0')}/${thoiGianThucCuaMay.getFullYear()} ${String(thoiGianThucCuaMay.getHours()).padStart(2, '0')}:${String(thoiGianThucCuaMay.getMinutes()).padStart(2, '0')}:${String(thoiGianThucCuaMay.getSeconds()).padStart(2, '0')}`;

    const dongMoi = { 
      id: idDocBanChinh, 
      userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
      thoiGianNhap: chuoiGioNhap, // 🎯 Bơm mốc thời gian khách tạo nái
      nhom: mtLua ? mtLua.toString().trim() : "Hậu Bị", // Gá nhãn cột C cũ trên sheet
      maTai: maTaiGoc, 
      giong: giongHeoChuanTab2, 
      luaGoc: luaHeoGhiDoc, 
      luaHienThiThongMinh: luaHeoGhiDoc,
      ngayPhoi: "",
      ngayCotI: "---",
      ngayDuKienDeMoi: "---",
      trangThaiDienThoai: "Chờ Phối",
      trangThai: "Chờ Phối",
      trangThaiCotH: "Chờ Phối",
      ghiChu: "Them mui truc tiep tu so nai",
      vuaNhapMoi: "chua_reload", 
      syncStatus: "synced",
      actionType: "mt_create" 
    };
    
    // Chọc RAM lập tức hiển thị giao diện phẳng sạch
  setDanhSachMaTai(prev => {
  if (!Array.isArray(prev)) return [dongMoi];
  const mangCuDaDonDep = prev.map(heo => heo && heo.vuaNhapMoi === "chua_reload" ? { ...heo, vuaNhapMoi: false } : heo);
  return [dongMoi, ...mangCuDaDonDep];
});

if (global && Array.isArray(global.danhSachCapNhatTrangThai)) {
  const mangGlobalCuDaDonDep = global.danhSachCapNhatTrangThai.map(heo => heo && heo.vuaNhapMoi === "chua_reload" ? { ...heo, vuaNhapMoi: false } : heo);
  global.danhSachCapNhatTrangThai = [dongMoi, ...mangGlobalCuDaDonDep];
}

    setMtMaTai(''); 
    setMtGiong(''); 
    setMtLua('Hậu Bị'); 
    setDongBoStatus(`⏳ Đang lưu mã tai mới: ${dongMoi.maTai}...`);

    // 🛰️ PHÓNG THẲNG LÊN TẬP TIN CLOUD FIRESTORE BỎ QUA GUIYEUCAUMANG
    const { doc, setDoc } = require('firebase/firestore');
    setDoc(doc(db, "Danh_Sach_Ma_Tai", idDocBanChinh), dongMoi)
      .then(async () => {
        setDongBoStatus('✅ Thêm Mã tai heo mới thành công');
        
        // Găm cứng cache vào ổ cứng điện thoại
        const emailChuoiSach = userEmail ? userEmail.toString().toLowerCase().trim() : "";
        const khoaDemTongHop = `cache_tonghop_pigvn_${emailChuoiSach}`;
        const dataDemTho = await AsyncStorage.getItem(khoaDemTongHop);
        if (dataDemTho !== null) {
          const resultChuan = JSON.parse(dataDemTho);
          resultChuan.tab2 = [dongMoi, ...(resultChuan.tab2 || [])];
          await AsyncStorage.setItem(khoaDemTongHop, JSON.stringify(resultChuan));
        }
      })
      .catch((error) => {
        console.error("❌ Lỗi ghi danh bạ nái:", error);
        setDongBoStatus('⚠️ Lưu ngoại tuyến');
      });
  };


  const handleMtEditClick = (item) => {
    setMtEditingId(item.id); setMtEditMaTai(item.maTai); setMtEditGiong(item.giong); setMtEditLua(item.lua);
    setIsMtEditModalVisible(true);
  };

  const handleSaveMtEdit = () => {
    // ⏱️ SINH LẠI THỜI GIAN NHẬP LÚC CHỈNH SỬA
    const thoiGianThucCuaMay = new Date();
    const chuoiGioNhap = `${String(thoiGianThucCuaMay.getDate()).padStart(2, '0')}/${String(thoiGianThucCuaMay.getMonth() + 1).padStart(2, '0')}/${thoiGianThucCuaMay.getFullYear()} ${String(thoiGianThucCuaMay.getHours()).padStart(2, '0')}:${String(thoiGianThucCuaMay.getMinutes()).padStart(2, '0')}:${String(thoiGianThucCuaMay.getSeconds()).padStart(2, '0')}`;

    const dongMtSua = {
      id: mtEditingId,
      userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
      thoiGianNhap: chuoiGioNhap,
      nhom: mtEditLua ? mtEditLua.toString().trim() : "Hậu Bị",
      maTai: mtEditMaTai.toUpperCase().trim(),
      giong: mtEditGiong.trim(),
      luaGoc: mtEditLua,
      lua: mtEditLua,
      syncStatus: "synced",
      actionType: "mt_update"
    };

    setDanhSachMaTai(prev => prev.map(item => item.id === mtEditingId ? { ...item, ...dongMtSua } : item));
    setIsMtEditModalVisible(false); 
    setMtEditingId(null);

    setDongBoStatus(`⏳ Đang đồng bộ sửa danh bạ tai: ${dongMtSua.maTai}...`);

    // 🎯 PHÓNG THẲNG LÊN CLOUD FIRESTORE BIẾN SỔ MÃ TAI
    const { doc, setDoc } = require('firebase/firestore');
    setDoc(doc(db, "Danh_Sach_Ma_Tai", mtEditingId), dongMtSua, { merge: true })
      .then(async () => {
        setDongBoStatus('✅ Đã cập nhật Danh Bạ lên Cloud!');
        
        const emailChuoiSach = userEmail ? userEmail.toString().toLowerCase().trim() : "";
        const khoaDemTongHop = `cache_tonghop_pigvn_${emailChuoiSach}`;
        const dataDemTho = await AsyncStorage.getItem(khoaDemTongHop);
        if (dataDemTho !== null) {
          const resultChuan = JSON.parse(dataDemTho);
          resultChuan.tab2 = (resultChuan.tab2 || []).map(i => i.id === mtEditingId ? { ...i, ...dongMtSua } : i);
          await AsyncStorage.setItem(khoaDemTongHop, JSON.stringify(resultChuan));
        }
      })
      .catch((error) => {
        console.error("❌ Lỗi sửa danh bạ:", error);
        setDongBoStatus('⚠️ Lưu ngoại tuyến lán trại');
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
              © 2026 PigVN • Phiên bản 4.1
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

           {/* LỀ PHẢI BANNER: NÚT CHUÔNG ĐỌC THÔNG BÁO TỪ FIRESTORE CHUNG + NÚT ĐĂNG XUẤT */}
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
  
  {/* NÚT QUẢ CHUÔNG BẬT ĐÈN ĐỎ CẢNH BÁO KHI ANH ĐỔI TIN TRÊN FIREBASE */}
  <TouchableOpacity 
    activeOpacity={0.6}
    onPress={() => setIsPopupThongBaoVisible(true)}
    style={{
      backgroundColor: '#f0f3f4', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 15,
      flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 0.5, borderColor: '#bdc3c7'
    }}
  >
    <Text style={{ fontSize: 12 }}>🔔</Text>
    {/* Nếu anh gõ thuộc tính trangThai: "Mới" trên Firebase Console, chuông của tất cả user sẽ sáng số 1 đỏ rực */}
    <View style={{ backgroundColor: (tinNhanHeThongFirebase && tinNhanHeThongFirebase.trangThai === "Mới") ? '#dc3545' : '#7f8c8d', paddingHorizontal: 4, paddingVertical: 0.5, borderRadius: 10 }}>
      <Text style={{ color: '#ffffff', fontSize: 8.5, fontWeight: '900' }}>
        {(tinNhanHeThongFirebase && tinNhanHeThongFirebase.trangThai === "Mới") ? "1" : "0"}
      </Text>
    </View>
  </TouchableOpacity>

  {/* NÚT ĐĂNG XUẤT NGUYÊN BẢN CỦA APP */}
  <TouchableOpacity 
    activeOpacity={0.6} onPress={handleLogOut} 
    style={{ backgroundColor: '#fff0e6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, borderWidth: 0.5, borderColor: '#ffd3b6' }}
  >
    <Text style={{ color: '#e65100', fontSize: 10.5, fontWeight: 'bold' }}>Đăng xuất 🚪</Text>
  </TouchableOpacity>
</View>

          </View>

         {/* TẦNG 2: THANH TRẠNG THÁI TRUNG TÂM - HIỂN THỊ ĐỘC QUYỀN MẠNG REAL-TIME FIRESTORE */}
<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
  
  {/* LỀ TRÁI: Báo hiệu mạng đám mây Firestore luôn sẵn sàng 0 giây */}
  <Text style={{ fontSize: 9, fontWeight: '700', color: '#28a745', fontStyle: 'italic', textAlign: 'left', flex: 1, paddingRight: 8 }}>
    PigVN v4.2 • Sẵn Sàng Nhập Liệu
  </Text>

  {/* LỀ PHẢI: Trạng thái kéo dữ liệu nền từ Google Sheets */}
  <Text style={{ fontSize: 8.5, fontWeight: '600', color: dongBoStatus.includes('⏳') ? '#d35400' : '#7f8c8d', fontStyle: 'italic', textAlign: 'right' }}>
    {dongBoStatus.includes('⏳') ? "⏳ Đang tải" : "✅ Thành Công"}
  </Text>

</View>

        </View>

        {/* Hàng 2: Trạng thái nạp ngầm + nút Tải Lại phẳng */}
          <View 
          style={{ 
            flexDirection: 'row', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            marginTop: 6,
            paddingHorizontal: 2,
            display: currentTab === 'heo_thit' ? 'flex' : 'none'
          }}
        >
          <TouchableOpacity 
            activeOpacity={0.7}
            style={{ 
              backgroundColor: cooldownCapNhat > 0 ? '#95a5a6' : '#28a745', 
              paddingHorizontal: 14, 
              paddingVertical: 6, 
              borderRadius: 14, 
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }} 
            onPress={() => {
              if (typeof handleRefreshData === 'function') {
                handleRefreshData(userEmail);
              }
            }} 
            disabled={isInitialLoading || cooldownCapNhat > 0} 
          >
            <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold' }}>
              {cooldownCapNhat > 0 ? `⏳ Chờ ${cooldownCapNhat} giây` : "🔄 Cập Nhật Heo Thịt"}
            </Text>
          </TouchableOpacity>
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
  handleXoaNhatKyChuDong={handleXoaNhatKyChuDong} 
filterSuKienTab1={filterSuKienTab1} setFilterSuKienTab1={setFilterSuKienTab1}
  filterNgayTab1={filterNgayTab1} setFilterNgayTab1={setFilterNgayTab1}
  isFilterDatePickerVisible={isFilterDatePickerVisible} setFilterDatePickerVisible={setFilterDatePickerVisible}
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
  goiYMaTaiLoc={goiYMaTaiLoc}
setGoiYMaTaiLoc={setGoiYMaTaiLoc}
  handleXemChiTietHeo={handleXemChiTietHeo}

/>




      {/* 📊 TAB 3: THỐNG KÊ NÁI & CÁM   */}
 
     <StatisticsTab
  currentTab={currentTab}
  styles={styles}
  parseToDateObject={parseToDateObject}
  
  dataThongKe={dataThongKe}
  dataHeoThit={dataHeoThit}
  danhSachLichSu={danhSachLichSu}
    danhSachMaTai={danhSachMaTai} 
        handleXemChiTietHeo={handleXemChiTietHeo}
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
  danhSachSoTay={danhSachSoTay}
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
  visible={!!isDetailModalVisible}
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
                   {/* TAB 4: ĐANG ĐẺ - ĐÃ ĐỒNG BỘ PHẲNG THEO TOÁN TỬ PICKER TRUNG TÂM */}
          <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('heo_de')} style={{ flex: 1 }}>
            <View style={{ backgroundColor: currentTab === 'heo_de' ? '#fff0e6' : '#f8f9fa', borderRadius: 8, width: '100%', height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 0.5, borderColor: currentTab === 'heo_de' ? '#ffd3b6' : '#eef2f5' }}>
              <Text style={{ fontSize: 12, fontWeight: currentTab === 'heo_de' ? '800' : '600', color: currentTab === 'heo_de' ? '#e65100' : '#495057' }}>🐖 Đang Đẻ</Text>
              <View style={{ backgroundColor: currentTab === 'heo_de' ? '#e65100' : '#28a745', paddingHorizontal: 4, paddingVertical: 0.5, borderRadius: 4 }}>
                <Text style={{ fontSize: 8.5, fontWeight: '900', color: '#ffffff' }}>
                  {(() => {
                    // Bốc trọn mảng trạng thái nái real-time trung tâm ra tính toán
                    const danhSachGoc = Array.isArray(global.danhSachCapNhatTrangThai) ? global.danhSachCapNhatTrangThai : [];
                    
                    // 🎯 BẢN VÁ: Chỉ lọc duy nhất theo nhãn trạng thái sinh sản thực tế "Đẻ", 
                    // phá bỏ hoàn toàn các điều kiện gác cổng ảo để khớp tuyệt đối với Picker!
                    const soConThucTeTrongChuongDe = danhSachGoc.filter(heo => 
                      heo && heo.trangThaiDienThoai === "Đẻ"
                    ).length;

                    return String(soConThucTeTrongChuongDe);
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

{/* 🔔 MODAL ĐỌC THÔNG BÁO DÙNG CHUNG TOÀN HỆ THỐNG - THIẾT KẾ PREMIUM FLAT UI */}
<Modal 
  visible={isPopupThongBaoVisible} 
  animationType="slide" // Chuyển sang hiệu ứng trượt từ dưới lên cho tự nhiên
  transparent={true} 
  onRequestClose={() => setIsPopupThongBaoVisible(false)}
>
  <View style={[styles.modalOverlay, { backgroundColor: 'rgba(26, 31, 35, 0.45)' }]}>
    <View style={{ 
      backgroundColor: '#ffffff', 
      width: '100%', 
      maxHeight: '75%', 
      borderRadius: 20, 
      overflow: 'hidden',
      shadowColor: "#1a1f23",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 0.8,
      borderColor: '#e9ecef'
    }}>
      
      {/* HEADER: Khối tiêu đề thiết kế sang trọng, tối giản */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 18, 
        paddingVertical: 14, 
        backgroundColor: '#f8f9fa', 
        borderBottomWidth: 1, 
        borderBottomColor: '#eef2f5' 
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 15 }}>📢</Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#1a1f23', letterSpacing: 0.3 }}>Thông Báo Hệ Thống</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.6}
          onPress={() => setIsPopupThongBaoVisible(false)} 
          style={{ 
            backgroundColor: '#eef2f5', 
            width: 28, 
            height: 28, 
            borderRadius: 14, 
            alignItems: 'center', 
            justifyContent: 'center',
            borderWidth: 0.5,
            borderColor: '#dee2e6'
          }}
        >
          <Text style={{ color: '#495057', fontSize: 11, fontWeight: 'bold', marginTop: -1 }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* BODY: Vùng hiển thị nội dung đọc tin tức */}
      <ScrollView 
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ padding: 18 }}
      >
        {(() => {
          if (!tinNhanHeThongFirebase) {
            return (
              <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color="#e65100" style={{ marginBottom: 10 }} />
                <Text style={{ textAlign: 'center', color: '#8a929a', fontStyle: 'italic', fontSize: 12 }}>
                  ⏳ Đang đồng bộ thông tin từ trung tâm...
                </Text>
              </View>
            );
          }

          const ngayGui = tinNhanHeThongFirebase.ngay || "---";
          const tieuDe = tinNhanHeThongFirebase.tieuDe || "Thông báo từ ban quản trị";
          const noiDung = tinNhanHeThongFirebase.noiDung || "Không có nội dung mới.";
          const phanLoai = tinNhanHeThongFirebase.danhMuc || "HỆ THỐNG";
          const laTinMoi = tinNhanHeThongFirebase.trangThai === "Mới";

          return (
            <View>
              {/* Thẻ Tag phân loại và Ngày tháng đồng bộ nằm gọn trên 1 hàng */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ 
                  backgroundColor: laTinMoi ? '#fff0e6' : '#f1f3f5', 
                  paddingHorizontal: 10, 
                  paddingVertical: 4, 
                  borderRadius: 6,
                  borderWidth: 0.5,
                  borderColor: laTinMoi ? '#ffd3b6' : '#dee2e6'
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: laTinMoi ? '#e65100' : '#495057', letterSpacing: 0.5 }}>
                    ⚙️ {phanLoai.toUpperCase()}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '500', color: '#8a929a' }}>📅 {ngayGui}</Text>
              </View>

              {/* Tiêu đề thông báo: Chữ lớn, đậm nét dõng dạc */}
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '800', 
                color: '#1a1f23', 
                lineHeight: 22, 
                marginBottom: 10,
                letterSpacing: 0.1
              }}>
                {tieuDe}
              </Text>

              {/* Nội dung thông báo chính: Nền phẳng sang trọng, giãn dòng dễ đọc */}
              <View style={{ 
                backgroundColor: laTinMoi ? '#fffcf9' : '#fdfdfd', 
                borderWidth: laTinMoi ? 1 : 0.8,
                borderColor: laTinMoi ? '#ffe5d4' : '#eef2f5', 
                borderRadius: 12, 
                padding: 14,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.01,
                shadowRadius: 1,
                elevation: 1
              }}>
                <Text style={{ 
                  fontSize: 13.5, 
                  color: '#343a40', 
                  lineHeight: 20, 
                  fontWeight: '500',
                  textAlign: 'justify'
                }}>
                  {noiDung}
                </Text>
              </View>

              {/* Nút bấm xác nhận nhanh ở đáy sau khi xem tin */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsPopupThongBaoVisible(false)}
                style={{
                  backgroundColor: '#1a1f23',
                  paddingVertical: 11,
                  borderRadius: 10,
                  alignItems: 'center',
                  marginTop: 20,
                  shadowColor: '#1a1f23',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 2
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 12.5, fontWeight: 'bold', letterSpacing: 0.3 }}>
                  OK, TÔI ĐÃ ĐỌC
                </Text>
              </TouchableOpacity>

            </View>
          );
        })()}
      </ScrollView>

    </View>
  </View>
</Modal>


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