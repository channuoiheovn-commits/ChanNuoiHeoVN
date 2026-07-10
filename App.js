import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, ScrollView, SafeAreaView  } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider,useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'react-native';



// Nhập thư viện cấu hình Firebase Web SDK xịn cho Expo
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// 🛠 HÃY DÁN CẤU HÌNH FIREBASE CỦA BẠN VÀO ĐÂY
const firebaseConfig = {
  apiKey: "AIzaSyDoY-hoyLop6gmhrUOwh0w0jhUt-uqsJF0",
  authDomain: "channuoiheovs6.firebaseapp.com",
  projectId: "channuoiheovs6",
  storageBucket: "channuoiheovs6.firebasestorage.app",
  messagingSenderId: "340478697796",
  appId: "1:340478697796:web:f5666e604f81b33b4bb711",
  measurementId: "G-MZ68B8L813"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Cấu hình thêm dòng này để bạn gọi hàm đăng nhập phía dưới nếu cầ

// ❌ ĐÃ XÓA BỎ DÒNG const analytics = getAnalytics(app); GÂY CRASH APP TẠI ĐÂY!

function MainApp() {
  const formatVNDate = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    date = new Date();
  }
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// 2. Chuyển đổi mọi định dạng chuỗi ngày thành Date Object an toàn, chống lệch múi giờ
const parseToDateObject = (str) => {
  if (!str) return null;
  try {
    const s = str.toString().trim();
    if (s === "" || s === "---") return null;

    // Định dạng dd/mm/yyyy
    if (s.includes('/') && s.split('/').length === 3) {
      const parts = s.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      // Tạo Date Object theo giờ địa phương lúc 00:00:00 để tính toán chuẩn xác
      return new Date(year, month, day, 0, 0, 0, 0);
    } 
    
    // Định dạng ISO hoặc yyyy-mm-dd từ Server đổ về
    const parsedDate = new Date(s);
    if (!isNaN(parsedDate.getTime())) {
      parsedDate.setHours(0, 0, 0, 0);
      return parsedDate;
    }
    return null;
  } catch (e) {
    console.log("Lỗi parse ngày toàn cục:", e);
    return null;
  }
};

// 3. Ép chuỗi ngày bất kỳ sang dạng dd/mm/yyyy hiển thị chuẩn Việt Nam
const formatStringtoVN = (str) => {
  const dObj = parseToDateObject(str);
  if (!dObj) return str ? str.toString().substring(0, 10) : "---";
  return formatVNDate(dObj);
};

// 4. Áp dụng công thức chu kỳ sinh sản: Cộng chính xác 114 ngày mang thai
const tinhNgayDuKienDe = (ngayGoc) => {
  const dateObject = parseToDateObject(ngayGoc);
  if (!dateObject) return "";
  dateObject.setDate(dateObject.getDate() + 114);
  return formatVNDate(dateObject);
};

// 5. Bộ lọc bốc tách số lượng an toàn, chống lỗi ký tự lạ hoặc rỗng
const laySoAnToan = (val) => {
  if (val === undefined || val === null) return 0;
  const cleanStr = val.toString().trim();
  if (cleanStr === "" || isNaN(cleanStr)) return 0;
  return Number(cleanStr);
};

// 6. THUẬT TOÁN SINH ID ĐỘC BẢN: Triệt tiêu 100% lỗi trùng Key FlatList khi gõ nhanh dưới chuồng
const sinhIDDocBan = (tienTo) => {
  const timestamp = new Date().getTime();
  // Sinh thêm chuỗi 5 ký tự ngẫu nhiên mã hóa hệ 36 chống multi-click trong cùng 1 mili-giây
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${tienTo}_${timestamp}_${randomStr}`;
};
  const insets = useSafeAreaInsets();
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw-hQWvYVEDqypBYWO8hsMShIrJ-anPZThN127bSwXke3hOdr5BLQAUvPR3_9a8B_xC4Q/exec';

  // --- STATE ĐĂNG NHẬP VÀ CHỌN TRẠI ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState(''); 
  const [typedEmail, setTypedEmail] = useState('');
  const [typedPassword, setTypedPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false); 
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);




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

    // --- STATE MODAL BIẾN ĐỘNG HEO THỊT THEO LÔ TUẦN TUỔI TAB 5 ---
  const [isHeoThitModalVisible, setIsHeoThitModalVisible] = useState(false);
  const [heoThitActionType, setHeoThitActionType] = useState(''); // 'Nhập Đàn', 'Hao Hụt', 'Bán'
  const [heoThitNgay, setHeoThitNgay] = useState(formatVNDate(new Date()));
  const [isHeoThitDatePickerVisible, setHeoThitDatePickerVisibility] = useState(false);
  const [heoThitSoLuong, setHeoThitSoCon] = useState('');
  const [heoThitGhiChu, setHeoThitGhiChu] = useState('');
  const [heoThitTuanChon, setHeoThitTuanChon] = useState(''); 
    // --- STATE QUẢN LÝ ĐÓNG MỞ CÁC GIAI ĐOẠN HEO THỊT TAB 5 ---
  const [openGiaiDoan, setOpenGiaiDoan] = useState({ gd3: false, gd4: false, gd5: false, gd6: false });

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


useEffect(() => {
    const kiemTraDangNhapCu = async () => {
      try {
        // 1. Đọc nhanh email đã lưu trong chip ổ cứng điện thoại
        const emailDaLuu = await AsyncStorage.getItem('userEmail');
        
        if (emailDaLuu && emailDaLuu.trim() !== "") {
          // KÍCH HOẠT NHANH: Cho phép vào thẳng giao diện chính ngay lập tức, chặn màn hình login hiển thị
          setIsLoggedIn(true); 
          setUserEmail(emailDaLuu.toLowerCase().trim());
          setDongBoStatus('⏳ Đang nạp dữ liệu trại');
          
          // 2. Chạy ngầm kéo dữ liệu từ Google Sheets về sau (Không bắt người dùng phải đợi ở màn hình login)
          const xauNgauNhien = Math.random().toString(36).substring(7);
          fetch(`${WEB_APP_URL}?action=get_all_data&userEmail=${emailDaLuu.toLowerCase().trim()}&_nocache=${xauNgauNhien}`, { method: 'GET', redirect: 'follow' })
            .then((res) => res.json())
            .then((result) => {
              if (result && result.status === 'success') {
                setDanhSachLichSu(result.tab1 || []);  
                setDanhSachMaTai(result.tab2 || []);   
                setDataThongKe(result.tab3 || null);   
                setDanhSachDangDe(result.tab4 || []);  
                setDataHeoThit(result.tab5 || null);   
                setDongBoStatus('🟢 Thành công');
              } else {
                setDongBoStatus('⚠️ Đang dùng dữ liệu nội bộ');
              }
            })
            .catch(() => {
              setDongBoStatus('⚠️ Ngoại tuyến: Đang dùng dữ liệu nội bộ');
            });
        }
      } catch (e) {
        console.log("Lỗi khôi phục đăng nhập:", e);
      }
    };

    kiemTraDangNhapCu();
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

   {(() => {
            if (!Array.isArray(danhSachMaTai)) return;

            // Lọc bỏ các dòng rỗng lỗi từ Sheet
            const mangSachDuLieu = danhSachMaTai.filter(h => h && h.maTai && h.maTai.toString().trim() !== "");
            
            // Đổ dữ liệu chạy ngầm trực tiếp lên RAM hệ thống toàn cục
            global.danhSachCapNhatTrangThai = mangSachDuLieu.map(heoGoc => {
              const maTaiInHoa = heoGoc.maTai.toString().toUpperCase().trim();

              // Tìm dòng nhật ký mới nhất thực tế của nái trên RAM
              const skMoiNhat = Array.isArray(danhSachLichSu)
                ? danhSachLichSu
                    .filter(i => i && i.maTai && String(i.maTai).trim().toUpperCase() === maTaiInHoa && i.actionType !== "delete")
                    .sort((a, b) => {
                      const timeA = parseToDateObject(a.ngay) ? parseToDateObject(a.ngay).getTime() : 0;
                      const timeB = parseToDateObject(b.ngay) ? parseToDateObject(b.ngay).getTime() : 0;
                      if (timeB !== timeA) return timeB - timeA;
                      return (b.id ? b.id.toString() : "").localeCompare(a.id ? a.id.toString() : "");
                    })[0] // Tóm dòng mới gõ nhất
                : null;

              let trangThaiThucTe = "";
              let ngayTinhNgayBau = "";
              let ngayDuKienDeMoi = heoGoc.ngayDuKienDeMoi || "---";
              let ngayDeDongThoiGianThuc = heoGoc.ngayDeCotJ || ""; 

              if (skMoiNhat) {
                const skTho = skMoiNhat.suKien ? skMoiNhat.suKien.toString().trim().normalize("NFC") : "";
                
                if (skTho === "Đẻ" || skTho === "ĐẺ" || skTho.includes("Đe")) {
                  trangThaiThucTe = "Đẻ";
                  ngayDeDongThoiGianThuc = skMoiNhat.ngay; 
                } else if (skTho === "Phối" || skTho === "PHỐI") {
                  trangThaiThucTe = "Phối";
                  ngayTinhNgayBau = skMoiNhat.ngay;
                  ngayDuKienDeMoi = tinhNgayDuKienDe(skMoiNhat.ngay);
                } else if (skTho === "Cai Sữa" || skTho === "Cai sữa" || skTho.includes("Cai")) {
                  trangThaiThucTe = "Cai Sữa";
                } else if (skTho === "Thải" || skTho === "THẢI") {
                  trangThaiThucTe = "Thải";
                } else if (skTho === "Lốc" || skTho === "LỐC") {
                  trangThaiThucTe = "Lốc"; 
                } else if (skTho === "Sảy Thai" || skTho === "SẢY THAI") {
                  trangThaiThucTe = "Sảy Thai"; 
                } else {
                  trangThaiThucTe = "Chờ Phối";
                }
              } else {
                const ttH = heoGoc.trangThaiCotH ? heoGoc.trangThaiCotH.toString().trim().normalize("NFC") : "";
                if (ttH === "Phối") {
                  trangThaiThucTe = "Phối";
                  ngayTinhNgayBau = heoGoc.ngayCotI || "";
                } else if (ttH === "Chờ Phối" || ttH === "Lốc" || ttH === "Sảy Thai" || ttH === "") {
                  trangThaiThucTe = ttH !== "" ? ttH : "Chờ Phối"; 
                } else if (ttH === "Đẻ" || ttH === "Cai Sữa") {
                  trangThaiThucTe = "Đẻ";
                } else if (ttH === "Thải") {
                  trangThaiThucTe = "Thải";
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
          })()}

  const [dataHeoThit, setDataHeoThit] = useState(null);

  //List Heo nái Thải
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
  // 🚪 HÀM: ĐĂNG NHẬP QUA FIREBASE + TỰ ĐỘNG GỌI SHEET LẤY LIST TRẠI
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
              setDataHeoThit(result.tab5 || null);   
              
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

  // 🔑 HÀM XÁC NHẬN VÀO TRẠI (DÀNH CHO POP-UP CHỌN TRẠI)
   // 🎯 LUỒNG XÁC NHẬN ĐỔI TRẠI - BẢN SỬA LỖI LỆCH CÚ PHÁP CHUẨN ĐÉT
  

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
    // ✅ BẢN VÁ ĐỒNG BỘ KHÔNG DẤU CHUẨN THEO DANH SACH SU KIEN GỐC
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
 
    // 🎯 KHÔI PHỤC HÀM LÀM MỚI 1 CỔNG TỔNG HỢP - ÉP MÁY CHỦ TRẢ DATA MỚI TINH KHÔNG DÙNG CACHE NGẦM
   const handleRefreshData = () => {
    if (!userEmail) return;
    setDongBoStatus('⏳ Đang cập nhật ');
    setIsInitialLoading(true);

    const emailChuan = userEmail.toLowerCase().trim();
    const xauNgauNhien = Math.random().toString(36).substring(7);

    fetch(`${WEB_APP_URL}?action=get_all_data&userEmail=${emailChuan}&_nocache=${xauNgauNhien}`, { method: 'GET', redirect: 'follow' })
      .then((res) => res.json())
      .then((result) => {
        setIsInitialLoading(false);
        if (result && result.status === 'success') {
          setDanhSachLichSu(result.tab1 || []);
          setDanhSachMaTai(result.tab2 || []);
          setDataThongKe(result.tab3 || null);
          setDanhSachDangDe(result.tab4 || []);
          setDataHeoThit(result.tab5 || null);
          setDongBoStatus('✅ Đã cập nhật toàn bộ dữ liệu!');
        } else {
          setDongBoStatus('❌ Không thể cập nhật dữ liệu');
        }
      })
      .catch(() => {
        setIsInitialLoading(false);
        setDongBoStatus('❌ Kết nối Server thất bại');
      });
  };



   // --- HÀM 4: CỔNG GỬI YÊU CẦU MẠNG URL GET - BẢN VÁ LỖI TREO DÒNG KHI BẬT MẠNG LẠI ---
    // ========================================================
  // 🟢 BẢN VÁ TỐI CAO: BỔ SUNG BIẾN TUẦN BÁN VÀO ĐƯỜNG TRUYỀN MẠNG GET
  // ========================================================
  const guiYeuCauMang = (bodyData, callback) => {
    const ngayMaHoa = encodeURIComponent(bodyData.ngay || "");
    const maTaiMaHoa = encodeURIComponent(bodyData.maTai || "");
    const suKienMaHoa = encodeURIComponent(bodyData.suKien || "");
    const giongMaHoa = encodeURIComponent(bodyData.giong || "");
    const luaMaHoa = encodeURIComponent(bodyData.lua || "");
    const ghiChuMaHoa = encodeURIComponent(bodyData.ghiChu || "");
    
    // 🎯 VÁ CHÍ MẠNG: Mã hóa số tuần khách chọn từ Picker để bắn lên URL
    const tuanBanMaHoa = encodeURIComponent(bodyData.tuanBan || "");

    // 🎯 KIẾN TRÚC MỚI: Đã bổ sung &tuanBan=${tuanBanMaHoa} vào sát đáy dải link gửi đi
    const duongLinkGửiData = `${WEB_APP_URL}?action=${bodyData.actionType}&id=${bodyData.id}&userEmail=${userEmail.toLowerCase().trim()}&ngay=${ngayMaHoa}&maTai=${maTaiMaHoa}&suKien=${suKienMaHoa}&soHeo=${bodyData.soHeo !== undefined ? bodyData.soHeo : ""}&giong=${giongMaHoa}&lua=${luaMaHoa}&khoThai=${encodeURIComponent(bodyData.khoThai || "")}&coiCoc=${encodeURIComponent(bodyData.coiCoc || "")}&chetNgop=${encodeURIComponent(bodyData.chetNgop || "")}&chonNuoi=${encodeURIComponent(bodyData.chonNuoi || "")}&ghiChu=${ghiChuMaHoa}&tuanBan=${tuanBanMaHoa}`;

    fetch(duongLinkGửiData, { method: 'GET', redirect: 'follow' })
    .then((res) => {
      if (res.status >= 300 && res.status < 400) {
        return { status: "success" }; 
      }
      return res.json().catch(() => ({ status: "success" }));
    })
    .then((res) => {
      if (typeof callback === 'function') {
        callback(res); 
      }
    })
    .catch((error) => { 
      console.log("Dập tắt lỗi sập mạng vật lý của điện thoại:", error);
      if (typeof callback === 'function') {
        callback({ status: "offline_queue", message: "Đứt kết nối sóng ngầm" });
      }
    });
  };






  //Thông báo khi khách nhập sự kiện mà không có mã tai
 const handleQuickSaveHeoMoi = () => {
  if (isQuickSaving) return;

  if (!quickGiong.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Giống heo!");

  setIsQuickSaving(true);
  setDongBoStatus('⏳ Đang tạo nhanh mã tai vào sổ...');

  const maTaiChuanInHoa = maTai ? maTai.toUpperCase().trim() : "";

  // Tạo dòng tạm thời trên điện thoại để cập nhật RAM lập tức cho Tab 2
  const dongMoiGhimRam = {
    id: "MT_" + new Date().getTime(),
    maTai: maTaiChuanInHoa,
    giong: quickGiong.trim(),
    lua: quickLua,
    trangThaiCotH: "Chưa Phối",
    ngayCotI: "---",
    ngayDuKienDeMoi: "---",
    syncStatus: "waiting",
    vuaNhapMoi: true
  };

  setDanhSachMaTai(prev => [dongMoiGhimRam, ...prev]);

  const dongMoiMaTai = {
    id: dongMoiGhimRam.id,
    maTai: maTaiChuanInHoa,
    giong: quickGiong.trim(),
    lua: quickLua,
    actionType: "mt_create"
  };

  guiYeuCauMang(dongMoiMaTai, (res) => {
    setIsQuickSaving(false);

    if (res && res.status === 'success') {
      setDanhSachMaTai(prev => prev.map(i => i.id === dongMoiMaTai.id ? { ...i, syncStatus: "synced" } : i));
      setDongBoStatus('✅ Đã thêm Mã tai heo mới thành công');
      
      // 🎯 ĐÓNG HỘP NHẬP NHANH NGAY LẬP TỨC
      setIsQuickAddModalVisible(false);
      setQuickGiong('');
      setQuickLua('Hậu Bị');

      // 🎯 KÍCH NỔ MODAL THÀNH CÔNG ĐẸP MẮT Ở CHÍNH GIỮA MÀN HÌNH GIỐNG HỘP QUY TRÌNH
      setTxtThanhCongNoiDung({
        tieuDe: "GHI NHẬN THÀNH CÔNG",
        maTai: maTaiChuanInHoa,
        loiGiai: "đã được tạo mới thành công. Bắt đầu Nhập Liệu cho Nái"
      });
      setIsThanhCongModalVisible(true);

    } else {
      setDanhSachMaTai(prev => prev.filter(i => i.id !== dongMoiMaTai.id));
      setDongBoStatus('❌ Lỗi kết nối ghi nhận dữ liệu mạng');
      Alert.alert("Lỗi", "Không thể thêm nhanh mã tai lên hệ thống mạng.");
    }
  });
};


  // --- HÀM 5: FORM NHẬP NHẬT KÝ HEO (TAB 1) ---
 
     // 🎯 BẢN VÁ HẠT NHÂN TỐI CAO - ĐỒNG BỘ CHUẨN XÁC BIẾN suKien KHÓA CHẶN QUY TRÌNH CHĂN NUÔI 100%
   // 🎯 BẢN VÁ TỐI CAO TỐI GIẢN - SO KHỚP CHUẨN GỐC MẢNG SỰ KIỆN - CHẶN CỨNG QUY TRÌNH QUY TRÌNH 100%
    const handleSaveNew = () => {
    if (!laSuKienBanHeo && !maTai.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Mã Tai!");
    if (canNhapSoHeo && !soHeo.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Số Heo!");

    const maTaiChuanQuet = maTai ? maTai.toString().trim().toUpperCase() : "";
    const suKienHienTaiChuan = suKien ? suKien.toString().trim().normalize("NFC") : "";

    // ========================================================
    // 🛑 CHÈN KHỐI BẢO VỆ CHẶN NHẬP MÙ VÀO ĐÚNG VỊ TRÍ NÀY
    // ========================================================
    if (!laSuKienBanHeo) {
      const mangDanhBaTai = Array.isArray(danhSachMaTai) ? danhSachMaTai : [];
      
      // Dò xem mã tai gõ vào đã được tạo khai sinh trong sổ mã tai (Tab 2) chưa
      const maTaiDaTonTai = mangDanhBaTai.some(heo => 
        heo && heo.maTai && heo.maTai.toString().trim().toUpperCase() === maTaiChuanQuet
      );

      // Nếu không tìm thấy, nổ cảnh báo chặn đứng không cho lưu dữ liệu rác
      if (!maTaiDaTonTai) {
        return Alert.alert(
          "❌ Chưa Có Mã Tai",
          `Mã tai [ ${maTaiChuanQuet} ] hiện chưa được tạo trong Sổ Mã Tai (Tab 2).\n\nVui lòng qua "Sổ Mã Tai" / Hoặc Bấm Thêm Nhanh để thêm mới con nái này vào sổ trước khi nhập sự kiện chăn nuôi!`,
          [{ text: "Tôi đã hiểu", style: "default" }]
        );
      }
    }
    // ========================================================

    // --------------------------------------------------------
    // 🐖 THUẬT TOÁN ĐÚNG Ý BẠN: SẮP XẾP NGÀY MỚI NHẤT LÊN ĐẦU RỒI ĐỐI CHIẾU (Giữ nguyên vẹn dòng này hất xuống dưới)
    // --------------------------------------------------------
    if (!laSuKienBanHeo) {
      // Bước 1: Lọc riêng nhật ký của con nái này (Bỏ qua những dòng có hành động xóa "delete")
      const lichSuRiengCuaNai = Array.isArray(danhSachLichSu)

        ? danhSachLichSu.filter(item => {
            if (!item || !item.maTai) return false;
            const maTaiDong = item.maTai.toString().trim().toUpperCase();
            if (item.actionType && item.actionType.toString().trim() === "delete") return false;
            return maTaiDong === maTaiChuanQuet;
          })
        : [];

      // Bước 2: Sắp xếp động đưa ngày mới nhất lên đỉnh đầu mảng (Index 0)
      lichSuRiengCuaNai.sort((a, b) => {
        const timeA = parseToDateObject(a.ngay) ? parseToDateObject(a.ngay).getTime() : 0;
        const timeB = parseToDateObject(b.ngay) ? parseToDateObject(b.ngay).getTime() : 0;
        
        if (timeB !== timeA) return timeB - timeA; // Ngày mới hơn xếp lên trước
        
        // Nếu trùng ngày trùng tháng (nhập gõ nhanh liên tiếp hôm nay), so khớp ID để phân định dòng mới gõ
        return (b.id ? b.id.toString() : "").localeCompare(a.id ? a.id.toString() : "");
      });

      // Bước 3: Tóm cổ dòng ở vị trí index 0 (Chắc chắn 100% là sự kiện mới nhất thực tế)
      const skGanNhatRiengCuaNai = lichSuRiengCuaNai.length > 0 ? lichSuRiengCuaNai[0] : null;

      let trangThaiLienTruocTho = "";

      if (skGanNhatRiengCuaNai) {
        trangThaiLienTruocTho = skGanNhatRiengCuaNai.suKien ? skGanNhatRiengCuaNai.suKien.toString().trim().normalize("NFC") : "";
      } else {
        // Nhánh dự phòng: Nếu lịch sử trống trơn, bốc dữ liệu gốc từ danh bạ Tab 2 làm điểm tựa
        const heoGocTab2 = Array.isArray(danhSachMaTai) && danhSachMaTai.find(h => h && h.maTai && h.maTai.toString().toUpperCase().trim() === maTaiChuanQuet);
        if (heoGocTab2) {
          trangThaiLienTruocTho = heoGocTab2.trangThaiCotH ? heoGocTab2.trangThaiCotH.toString().trim().normalize("NFC") : "";
        }
      }

      // Bước 4: Kiểm tra khóa chặn quy trình thú y nghiêm ngặt
      let trangThaiXacThuc = "";
      if (trangThaiLienTruocTho === "Đẻ" || trangThaiLienTruocTho === "ĐẺ" || trangThaiLienTruocTho.includes("Đe")) {
        trangThaiXacThuc = "Đẻ";
      } else if (trangThaiLienTruocTho === "Phối" || trangThaiLienTruocTho === "PHỐI") {
        trangThaiXacThuc = "Phối";
      } else if (trangThaiLienTruocTho === "Cai Sữa" || trangThaiLienTruocTho === "Cai sữa" || trangThaiLienTruocTho.includes("Cai")) {
        trangThaiXacThuc = "Cai Sữa";
      } else if (trangThaiLienTruocTho === "Thải" || trangThaiLienTruocTho === "THẢI") {
        trangThaiXacThuc = "Thải";
      } else if (trangThaiLienTruocTho === "Lốc" || trangThaiLienTruocTho === "Sảy Thai" || trangThaiLienTruocTho === "Chờ Phối") {
        trangThaiXacThuc = "Chua_Phoi"; // Giải phóng nái về nhóm chưa phối để phối lại lập tức
      }

      if (trangThaiXacThuc !== "") {
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
          return; // Chặn đứng lưu lọt lưới
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
                // ----------------========================================
        // TRƯỜNG HỢP C: NÁI ĐANG NUÔI CON (ĐỂ) & KHÓA CHẶT QUY TRÌNH CAI SỮA
        // ----------------========================================
        if (trangThaiXacThuc === "Đẻ") {
          // Đang nuôi con thì KHÔNG ĐƯỢC PHÉP nhập phối lại (Bụng đã trống đâu mà phối)
          if (suKienHienTaiChuan === "Phối") {
            setTxtAlertNoiDung({ 
              tieuDe: "Sai quy trình chăn nuôi", 
              maTai: maTaiChuanQuet, 
              hanhDong: "Phối giống lứa mới", 
              loiGiai: "vừa có sự kiện Đẻ lứa trước và hiện vẫn đang nuôi con trên chuồng. Bạn phải làm thủ tục Cai Sữa tách đàn cho heo trước rồi mới được phối giống lại lứa tiếp theo!" 
            });
            setIsQuyTrinhAlertVisible(true);
            return; // Chặn đứng lưu
          }

          if (suKienHienTaiChuan !== "Cai Sữa" && suKienHienTaiChuan !== "Cai sữa" && suKienHienTaiChuan !== "Thải") {
            setTxtAlertNoiDung({ 
              tieuDe: "Sai quy trình chăn nuôi", 
              maTai: maTaiChuanQuet, 
              hanhDong: suKien, 
              loiGiai: "vừa có sự kiện Đẻ lứa trước và hiện vẫn đang nuôi con trên chuồng (chưa nhập Cai Sữa). Bạn CHỈ ĐƯỢC PHÉP nhập sự kiện Cai Sữa hoặc Thải loại!" 
            });
            setIsQuyTrinhAlertVisible(true);
            return;
          }
        }

        // 🎯 THẦN CÔNG CHẶN LỌT LƯỚI: Chưa Đẻ mà đòi Cai sữa là chặn đứng 100%
        if (suKienHienTaiChuan === "Cai Sữa" || suKienHienTaiChuan === "Cai sữa") {
          if (trangThaiXacThuc !== "Đẻ") {
            setTxtAlertNoiDung({ 
              tieuDe: "Sai quy trình chăn nuôi", 
              maTai: maTaiChuanQuet, 
              hanhDong: "Cai Sữa tách đàn", 
              loiGiai: "hiện đang ở trạng thái [" + (trangThaiXacThuc === "Phối" ? "🤰 Đang mang thai" : "💢 Trống phối") + "] và chưa nhập sự kiện Đẻ lứa này. Bạn KHÔNG THỂ thực hiện hành động Cai Sữa khi heo chưa sinh con!" 
            });
            setIsQuyTrinhAlertVisible(true);
            return; // Chặn đứng ngắt mạch lọt lưới
          }
        }

        if ((suKienHienTaiChuan === "Cai Sữa" || suKienHienTaiChuan === "Cai sữa") && trangThaiXacThuc === "Cai Sữa") {
          setTxtAlertNoiDung({ tieuDe: "Sai quy trình chăn nuôi", maTai: maTaiChuanQuet, hanhDong: "Cai Sữa liên tiếp", loiGiai: "đã được làm thủ tục Cai Sữa tách đàn rồi. Bạn không thể nhập Cai Sữa liên tiếp lượt nữa!" });
          setIsQuyTrinhAlertVisible(true);
          return;
        }

      }
    }

    const dongMoi = { 
      id: sinhIDDocBan("ID"), 
      ngay: ngayHienThi, 
      maTai: maTaiChuanQuet, 
      suKien, 
      soHeo: canNhapSoHeo ? laySoAnToan(soHeo) : "", 
      khoThai: suKien === "Đẻ" ? laySoAnToan(khoThai) : "",
      coiCoc: suKien === "Đẻ" ? laySoAnToan(coiCoc) : "",
      chetNgop: suKien === "Đẻ" ? laySoAnToan(chetNgop) : "",
      chonNuoi: suKien === "Đẻ" ? laySoAnToan(chonNuoi) : "",
      ghiChu: ghiChu,
      syncStatus: "synced", 
      actionType: "create" 
    };
    
    setDanhSachLichSu(prev => [dongMoi, ...prev]);
    setDongBoStatus(`⏳ Đang lưu...`);
    setMaTai(''); setSoHeo(''); setKhoThai(''); setCoiCoc(''); setChetNgop(''); setChonNuoi(''); setGhiChu('');

    guiYeuCauMang(dongMoi, (res) => {
      if (res && res.status === 'success') {
        setDongBoStatus('✅ Đã Lưu Thành Công');
      } else {
        setDongBoStatus('⚠️ Lỗi. Bấm Lại Cập Nhật');
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


    
    // 🎯 LUỒNG HÀM LƯU SỬA CHUẨN ĐÉT ONLINE-FIRST - ĐÃ VÁ LỖI THAM CHIẾU BIẾN LAYSOANTOAN
        // ========================================================
  // 🟢 HÀM LƯU SỬA NHẬT KÝ HEO NÁI ĐẺ (TAB 1) - ĐÃ VÁ LỖI HIỆN (0 CON)
  // ========================================================
  const handleSaveEdit = () => {
    if (!editSoHeo.trim() && editCanNhapSoHeo && editSuKien !== "Đẻ") {
      return Alert.alert("Thông báo", "Vui lòng nhập Số Lượng heo!");
    }
    
    setIsEditModalVisible(false);
    setDongBoStatus("⏳ Đang cập nhật chỉnh sửa dòng nhật ký lên máy chủ...");

    // 🎯 THUẬT TOÁN VÁ: Chỉ dùng laySoAnToan khi sự kiện là "Đẻ". 
    // Các sự kiện phối, khám... nếu ô nhập trống thì găm chuỗi rỗng "" để không bị biến thành số 0.
    const quanSoConThucTe = editSuKien === "Đẻ" ? laySoAnToan(editSoHeo) : (editSoHeo.trim() !== "" ? Number(editSoHeo) : "");

    const dongCapNhatMoi = {
      id: editingId, 
      userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
      actionType: "update",
      ngay: editNgay,
      maTai: editMaTai,   
      suKien: editSuKien, 
      soHeo: quanSoConThucTe, // 🟢 Đã thông mạch: Ghi nhận đúng quân số hoặc chuỗi rỗng phẳng sạch
      khoThai: editSuKien === "Đẻ" ? editKhoThai : "",
      coiCoc: editSuKien === "Đẻ" ? editCoiCoc : "",
      chetNgop: editSuKien === "Đẻ" ? editChetNgop : "",
      chonNuoi: editSuKien === "Đẻ" ? editChonNuoi : "",
      ghiChu: editGhiChu.trim(),
      tuanBan: "" 
    };

    // Cập nhật đè dữ liệu mới vào mảng RAM hiển thị tại chỗ ngoài màn hình Tab 1
    setDanhSachLichSu(prev => prev.map(i => i.id === editingId ? { ...i, ...dongCapNhatMoi, syncStatus: "synced" } : i));

    // Kích nổ lệnh gửi mạng link GET lên Server đám mây Google Sheets
    guiYeuCauMang(dongCapNhatMoi, (res) => {
      if (res && res.status === 'success') {
        setDongBoStatus("✅ Đã cập nhật sửa đổi nhật ký thành công!");
      } else {
        setDongBoStatus("⚠️ Kết nối mạng chậm ngầm. Đã bảo toàn số liệu nội bộ.");
      }
    });
  };




   // 🎯 LUỒNG XOÁ NHẬT KÝ SIÊU TỐC - ĐẬP TAN ĐỘ TRỄ TIMING MẠNG - CẬP NHẬT TRONG 0.01 GIÂY
   // ========================================================
  // 🟢 HÀM XÓA NHẬT KÝ CHỦ ĐỘNG - VÁ LỖI MẠNG AN TOÀN TUYỆT ĐỐI
  // ========================================================
  const handleXoaNhatKyChuDong = (item) => {
    if (!item || !item.id) return;

    // 1. Tạo gói tin xóa tinh gọn 15 cột phẳng sạch gửi thông qua hàm mạng gốc của bạn
    const dongMuonXoa = {
      id: item.id,
      userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
      actionType: "delete", // Gửi cờ lệnh action=delete lên Server
      
      // Khóa cứng gán chuỗi rỗng cho các trường trung gian để dải nối link URL trong hàm guiYeuCauMang không bị báo lỗi rỗng (undefined)
      ngay: "", maTai: "", suKien: "", giong: "", lua: "", 
      khoThai: "", coiCoc: "", chetNgop: "", chonNuoi: "", ghiChu: ""
    };

    // 2. ÉP CẬP NHẬT MÀN HÌNH LẬP TỨC TRONG 0.01 GIÂY (Khách thấy biến mất ngay)
    setDanhSachLichSu(prev => prev.filter(i => i.id !== item.id));
    setDongBoStatus(`⏳ Đang xoá nhật ký tai: ${item.maTai}...`);
    
    // 3. Gọi chính xác hàm mạng gốc guiYeuCauMang của bạn để kết nối Cloud an toàn vẹn toàn
    guiYeuCauMang(dongMuonXoa, (res) => {
      if (res && res.status === 'success') {
        setDongBoStatus('✅ Đã xoá dòng Nhật Ký');
      } else {
        // Luồng dự phòng nếu dính đứt sóng ngầm chập chờn
        setDongBoStatus('⚠️ Kết Nối Lỗi. Bấm Lại Cập Nhật');
      }
    });
  };

    // ========================================================
  // 🟢 HÀM CAI SỮA SIÊU TỐC NGAY TẠI CHUỒNG (TAB 4)
  // ========================================================
    // ========================================================
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

  // 🟢 HÀM XÁC NHẬN BIẾN ĐỘNG HEO THỊT - ĐÃ VÁ DỊCH KHÓA "theoMe" THÀNH SỐ 3
  // ========================================================
    // ========================================================
  // 🟢 BẢN VÁ TỐI CAO ĐIỆN THOẠI: HÀM LƯU BIẾN ĐỘNG HEO THỊT ĐỒNG BỘ 100% LƯỚI 3 Ô
  // ========================================================
    // ========================================================
  // 🟢 BẢN VÁ TỐI CAO: THÔNG MẠCH LOGIC LƯU HEO THỊT - CHỐNG BÁO LỖI LÔ ẢO
  // ========================================================
  const handleLuuHanhDongHeoThit = () => {
    // 🎯 VÁ CHÍ MẠNG: Lấy giá trị thô, ép chuỗi phẳng sạch để đối chiếu công bằng
    const oTuanChonChuan = heoThitTuanChon ? heoThitTuanChon.toString().trim() : "";
    
    // Nếu trống hoặc chưa chạm chọn ô tuổi thực sự (Vẫn dính chữ mặc định) thì mới báo lỗi
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
    setDongBoStatus(`⏳ Đang xử lý lệnh ${heoThitActionType} lô tuần ${oTuanChonChuan}...`);

    const soConTacDong = laySoAnToan(heoThitSoLuong);
    
    // 🎯 THUẬT TOÁN ĐỊNH VỊ KHÓA ĐỂ CẬP NHẬT RAM ĐIỆN THOẠI CHÍNH XÁC KHÍT Ô LƯỚI
    let khoaThucTeRAM = `${oTuanChonChuan} Tuần`;
    if (oTuanChonChuan === "theoMe" || oTuanChonChuan === "Theo Mẹ" || oTuanChonChuan === "3") {
      khoaThucTeRAM = "theoMe";
    } else if (oTuanChonChuan === "4 Tuần ( Cai Sữa )" || oTuanChonChuan === "caiSua" || oTuanChonChuan === "4") {
      khoaThucTeRAM = dataHeoThit && dataHeoThit["4 Tuần ( Cai Sữa )"] !== undefined ? "4 Tuần ( Cai Sữa )" : "caiSua";
    }

    // Dịch chữ thành số lẻ chuẩn chỉ để bắn lên Google Sheets vật lý
    let soTuanGuiServer = oTuanChonChuan;
    if (soTuanGuiServer === "theoMe" || soTuanGuiServer === "Theo Mẹ") {
      soTuanGuiServer = "3"; 
    } else if (soTuanGuiServer === "caiSua" || soTuanGuiServer === "4 Tuần ( Cai Sữa )") {
      soTuanGuiServer = "4";
    }

    // Khối cấu trúc đối tượng dongMoiHeoThit gửi đi lên mạng
    const dongMoiHeoThit = {
      id: sinhIDDocBan("ID"),                      
      userEmail: userEmail || "",                  
      ngay: heoThitNgay,                           
      maTai: heoThitActionType,                    
      suKien: heoThitActionType,                   
      soHeo: soConTacDong,          
      ghiChu: heoThitGhiChu ? heoThitGhiChu.trim() : "", 
      tuanBan: soTuanGuiServer, // Bắn chuẩn số thô 3, 4, 5, 24 lên cột O
      syncStatus: "waiting",
      actionType: "create"
    };

    setDanhSachLichSu(prev => [dongMoiHeoThit, ...prev]);

    // Tự động CỘNG hoặc TRỪ trực tiếp số con ngoài giao diện lưới Tab 5 lập tức
    setDataHeoThit(prev => {
      if (!prev) return prev;
      let soConCu = prev[khoaThucTeRAM] !== undefined ? Number(prev[khoaThucTeRAM]) : 0;
      let soConMoi = soConCu;

      if (heoThitActionType === "Nhập Đàn") {
        soConMoi = soConCu + soConTacDong;
      } else if (heoThitActionType === "Hao Hụt" || heoThitActionType === "Bán") {
        soConMoi = soConCu - soConTacDong;
        if (soConMoi < 0) soConMoi = 0;
      }

      return { ...prev, [khoaThucTeRAM]: soConMoi.toString() };
    });

    // Kích nổ cuốc mạng đẩy dữ liệu lên Google Sheets
    guiYeuCauMang(dongMoiHeoThit, (res) => {
      const laGiaoDichThanhCong = res && (res.status === 'success' || res.status === 'synced' || JSON.stringify(res).toLowerCase().includes('success') || res === 'success');

      if (laGiaoDichThanhCong) {
        setDongBoStatus(`✅ Ghi nhận thành công biến động lô tuần ${oTuanChonChuan} lên hệ thống!`);
        setDanhSachLichSu(prev => prev.map(i => i.id === dongMoiHeoThit.id ? { ...i, syncStatus: "synced" } : i));
        if (typeof setHeoThitSoCon === 'function') setHeoThitSoCon('');
        if (typeof setHeoThitSoHeo === 'function') setHeoThitSoHeo('');
        if (typeof setHeoThitGhiChu === 'function') setHeoThitGhiChu('');
      } else {
        setDongBoStatus('⚠️ Kết nối Server chậm ngầm. Đã bảo toàn số liệu nội bộ trên thiết bị.');
        setDanhSachLichSu(prev => prev.map(i => i.id === dongMoiHeoThit.id ? { ...i, syncStatus: "waiting" } : i));
        if (typeof setHeoThitSoCon === 'function') setHeoThitSoCon('');
        if (typeof setHeoThitSoHeo === 'function') setHeoThitSoHeo('');
        if (typeof setHeoThitGhiChu === 'function') setHeoThitGhiChu('');
      }
    });
  };




  // ========================================================
  // 🟢 BƯỚC 2: CÁC HÀM XỬ LÝ SỬA NHẬT KÝ HEO THỊT ĐỘC LẬP (TAB 5)
  // ========================================================
    // ========================================================
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


    // ========================================================
  // 🟢 HÀM LƯU SỬA HEO THỊT - TỰ ĐỘNG BÙ TRỪ QUÂN SỐ TRÊN LƯỚI REAL-TIME
  // ========================================================
    // ========================================================
  // 🟢 HÀM LƯU SỬA HEO THỊT - BẢN VÁ HOÀN TRẢ VÀ BÙ TRỪ ĐA TUẦN TUỔI REAL-TIME
  // ========================================================
  const handleLuuSuaHeoThit = () => {
    if (!suaHeoThitTuanChon || suaHeoThitTuanChon === "CHON_TUAN" || suaHeoThitTuanChon.trim() === "") {
      return Alert.alert("⚠️ Thiếu Số Liệu Lô", "Vui lòng chọn số Tuần Tuổi của lô heo thịt!");
    }
    if (!suaHeoThitSoLuong || !suaHeoThitSoLuong.toString().trim()) {
      return Alert.alert("Thông báo", "Vui lòng nhập Số Lượng heo!");
    }

    // 1. LẤY SỐ LIỆU CŨ TỪ BỘ NHỚ RAM ĐỂ CHUẨN BỊ HOÀN TÁC
    const dongLichSuCu = Array.isArray(danhSachLichSu) ? danhSachLichSu.find(i => i && i.id === suaHeoThitId) : null;
    const soConCuBanDau = dongLichSuCu ? laySoAnToan(dongLichSuCu.soHeo) : 0;
    const tuanCuBanDau = dongLichSuCu && dongLichSuCu.tuanBan !== undefined ? dongLichSuCu.tuanBan.toString().trim() : "";
    
    // 2. LẤY SỐ LIỆU MỚI TOÀN DIỆN
    const soConMoiUpdate = laySoAnToan(suaHeoThitSoLuong);
    const tuanMoiUpdate = suaHeoThitTuanChon.toString().trim();

    // 🎯 THUẬT TOÁN ĐỊNH VỊ KHÓA RAM CHO Ô TUẦN CŨ
    let khoaRamCu = `${tuanCuBanDau} Tuần`;
    if (tuanCuBanDau === "theoMe" || tuanCuBanDau === "3") khoaRamCu = "theoMe";
    else if (tuanCuBanDau === "4" || tuanCuBanDau === "caiSua") {
      khoaRamCu = dataHeoThit && dataHeoThit["4 Tuần ( Cai Sữa )"] !== undefined ? "4 Tuần ( Cai Sữa )" : "caiSua";
    }

    // 🎯 THUẬT TOÁN ĐỊNH VỊ KHÓA RAM CHO Ô TUẦN MỚI
    let khoaRamMoi = `${tuanMoiUpdate} Tuần`;
    if (tuanMoiUpdate === "theoMe" || tuanMoiUpdate === "3") khoaRamMoi = "theoMe";
    else if (tuanMoiUpdate === "4" || tuanMoiUpdate === "caiSua") {
      khoaRamMoi = dataHeoThit && dataHeoThit["4 Tuần ( Cai Sữa )"] !== undefined ? "4 Tuần ( Cai Sữa )" : "caiSua";
    }

    // Đóng sập Pop-up sửa lập tức trong 0.01 giây
    setIsSuaHeoThitModalVisible(false);
    setDongBoStatus(`⏳ Đang cập nhật chỉnh sửa lô heo thịt lên máy chủ...`);

    // Khóa cấu trúc 15 cột đẩy qua hàm mạng GET nối chuỗi
    const dongCapNhatMoi = {
      id: suaHeoThitId,
      userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
      actionType: "update", 
      ngay: suaHeoThitNgay,
      maTai: suaHeoThitActionType,   
      suKien: suaHeoThitActionType, 
      soHeo: soConMoiUpdate,
      khoThai: "", coiCoc: "", chetNgop: "", chonNuoi: "", 
      ghiChu: suaHeoThitGhiChu ? suaHeoThitGhiChu.trim() : "",
      tuanBan: tuanMoiUpdate 
    };

    // Cập nhật dòng nhật ký lịch sử ở khay đáy hiển thị tức thì ngoài màn hình điện thoại
    setDanhSachLichSu(prev => prev.map(i => i.id === suaHeoThitId ? { ...i, ...dongCapNhatMoi, syncStatus: "synced" } : i));

    // 🎯 🌟 ĐỘT PHÁ TỐC ĐỘ: KHỞI HỎA BỘ ĐIỀU PHỐI ĐA Ô TUỔI THỜI GIAN THỰC
    setDataHeoThit(prev => {
      if (!prev) return prev;
      
      // Tạo một bản sao RAM phẳng để tính toán song song 2 ô tuổi cùng lúc
      let mảngTạmRAM = { ...prev };

      // BƯỚC A: HOÀN TRẢ LẠI QUÂN SỐ GỐC CHO Ô TUẦN CŨ (Hủy bỏ lệnh cũ hoàn toàn)
      let quanSoCuGoc = mảngTạmRAM[khoaRamCu] !== undefined ? Number(mảngTạmRAM[khoaRamCu]) : 0;
      if (suaHeoThitActionType === "Nhập Đàn") {
        mảngTạmRAM[khoaRamCu] = Math.max(0, quanSoCuGoc - soConCuBanDau).toString(); // Trừ bớt số heo đã nhập nhầm vào tuần cũ
      } else if (suaHeoThitActionType === "Hao Hụt" || suaHeoThitActionType === "Bán") {
        mảngTạmRAM[khoaRamCu] = (quanSoCuGoc + soConCuBanDau).toString(); // Cộng trả lại số heo đã trừ hụt của tuần cũ
      }

      // BƯỚC B: ÁP DỤNG QUÂN SỐ MỚI TINH VÀO Ô TUẦN MỚI CHỌN ĐỔI CHỮ
      let quanSoMoiGoc = mảngTạmRAM[khoaRamMoi] !== undefined ? Number(mảngTạmRAM[khoaRamMoi]) : 0;
      if (suaHeoThitActionType === "Nhập Đàn") {
        mảngTạmRAM[khoaRamMoi] = (quanSoMoiGoc + soConMoiUpdate).toString(); // Cộng số lượng mới vào ô tuần mới
      } else if (suaHeoThitActionType === "Hao Hụt" || suaHeoThitActionType === "Bán") {
        mảngTạmRAM[khoaRamMoi] = Math.max(0, quanSoMoiGoc - soConMoiUpdate).toString(); // Trừ số lượng mới đi ở ô tuần mới
      }

      return mảngTạmRAM; // Khóa cứng đồng loạt cả 2 ô vuông ngoài màn hình Tab 5 nhảy số liền!
    });

    // 2. Kích nổ lệnh gửi mạng thông suốt lên Cloud Google Sheets
    guiYeuCauMang(dongCapNhatMoi, (res) => {
      if (res && res.status === 'success') {
        setDongBoStatus("✅ Đã cập nhật sửa đổi nhật ký heo thịt thành công!");
      } else {
        setDongBoStatus("⚠️ Kết nối mạng chậm ngầm. Đã bảo toàn số liệu nội bộ.");
      }
    });
  };










  // --- HÀM 6: FORM THÊM MỚI SỔ MÃ TAI (TAB 2) ---
  const handleSaveMaTai = () => {
    if (!mtMaTai.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Mã Tai!");
    if (!mtGiong.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Giống heo!");
    const maTaiGoc = mtMaTai.toUpperCase().trim();
  if (Array.isArray(danhSachMaTai) && danhSachMaTai.some(heo => heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiGoc)) {
    return Alert.alert("Cảnh báo trùng mã tai Cũ", `Mã tai [${maTaiGoc}] đã tồn tại Hoặc nằm trong mục loại ( Thải ). Vui lòng nhập số tai khác hoặc thêm kí tự!`);
  }
    
    const dongMoi = { 
      id: "MT_" + new Date().getTime(), 
      maTai: mtMaTai.toUpperCase().trim(), 
      giong: mtGiong.trim(), 
      lua: mtLua, 
      syncStatus: "waiting", 
      actionType: "mt_create",
      vuaNhapMoi: true
    };
    
    setDanhSachMaTai(prev => [dongMoi, ...prev]); 
    setMtMaTai(''); setMtGiong(''); setMtLua('Hậu Bị'); 

    setDongBoStatus(`⏳ Đang lưu mã tai mới: ${dongMoi.maTai}...`);
       guiYeuCauMang(dongMoi, (res) => {
      if (res.status === 'success') {
        // 🎯 TỰ ĐỘNG NHẬN DỮ LIỆU: Tự gọi hàm kéo dữ liệu mới tinh từ Sheet về điện thoại ngầm

        setDanhSachMaTai(prev => prev.map(i => i.id === dongMoi.id ? { ...i, syncStatus: "synced" } : i));
        setDongBoStatus('✅ Thêm Mã tai heo mới thành công');
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
    
<KeyboardAvoidingView 
  behavior={Platform.OS === "ios" ? "padding" : undefined} 
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
        {/* Hàng 1: Thông tin tài khoản và Đăng xuất */}
               <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontSize: 13, color: '#333333' }} numberOfLines={1}>
              👤 <Text style={{ fontWeight: 'bold' }}>{userEmail}</Text>
            </Text>
            
           
          </View>
          
          {/* ĐÃ BẢO TOÀN NGUYÊN VẸN: Nút đăng xuất nguyên bản phẳng đẹp của bạn */}
          <TouchableOpacity activeOpacity={0.6} onPress={handleLogOut} style={{ backgroundColor: '#fff0e6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, borderWidth: 0.5, borderColor: '#ffd3b6' }}>
            <Text style={{ color: '#e65100', fontSize: 11, fontWeight: 'bold' }}>Đăng xuất 🚪</Text>
          </TouchableOpacity>
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
          <TouchableOpacity 
            activeOpacity={0.6}
            style={{ backgroundColor: '#e65100', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }} 
            onPress={handleRefreshData} 
            disabled={isInitialLoading}
          >
            <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>🔄 Cập Nhật Thống Kê</Text>
          </TouchableOpacity>
        </View>
      </View>

      

     

            {/* TAB 1: NHẬP LIỆU */}
     {currentTab === 'nhap_lieu' && ( 
        <View style={{ flex: 1 }}>
           <View style={{ paddingHorizontal: 15, marginTop: 12, marginBottom: 5 }}>
                  <TextInput style={[styles.inputStandard, { marginBottom: 0, borderRadius: 20, paddingHorizontal: 15, height: 42, backgroundColor: '#f2f2f2', borderWidth: 0, color: '#111111', fontSize: 14 }]} placeholder="🔍 Nhập Mã Tai để xem lịch sử" placeholderTextColor="#888888" value={searchTxtTab1} onChangeText={setSearchTxtTab1} autoCapitalize="characters" />
                </View>
                    <FlatList 
            data={danhSachLichSu
              .filter(i => i.actionType !== "delete")
              // 🟢 VÁ TRỰC TIẾP CHẮN LỖI: Loại bỏ hoàn toàn 3 sự kiện Heo Thịt ra khỏi danh sách hiển thị Tab 1
              .filter(i => i && i.suKien !== "Nhập Đàn" && i.suKien !== "Hao Hụt" && i.suKien !== "Bán")
              .filter(i => {
                if (!searchTxtTab1) return true;
                if (!i.maTai) return false;
                return i.maTai.toLowerCase().includes(searchTxtTab1.toLowerCase());
              })

              .sort((a, b) => {
                const quyDoiThoiGian = (item) => {
                  if (!item || !item.ngay) return 0;
                  try {
                    let ngayGoc = item.ngay.toString().trim();
                    if (ngayGoc.includes('/')) {
                      let p = ngayGoc.substring(0, 10).split('/');
                      if (p.length === 3) return new Date(p[2], p[1] - 1, p[0]).getTime();
                    }
                    let timestamp = Date.parse(ngayGoc);
                    return isNaN(timestamp) ? 0 : timestamp;
                  } catch (e) { return 0; }
                };
                const timeA = quyDoiThoiGian(a); const timeB = quyDoiThoiGian(b);
                if (timeB !== timeA) return timeB - timeA;
                return (b.id ? b.id.toString() : "").localeCompare(a.id ? a.id.toString() : "");
              })
            } 
            keyExtractor={(i) => i.id} 
            contentContainerStyle={{ paddingBottom: 80 }} 


                            // 🟢 ĐÃ NÂNG CẤP CHUẨN ĐÉT: Tự động ẩn sạch khối nhập liệu khi người nuôi gõ ô tìm kiếm
            ListHeaderComponent={
              !searchTxtTab1 ? (
                // LỢI ÍCH: Nếu ô tìm kiếm trống, hiển thị Form nhập liệu rộng rãi bình thường
                <View style={{ backgroundColor: '#ffffff', paddingBottom: 5 }}>
                  <View style={[styles.formFixedContainer, { 
                    backgroundColor: '#fffaf5', 
                    borderWidth: 1.2, 
                    borderColor: '#ffd3b6', 
                    borderRadius: 10, 
                    padding: 12,
                    shadowColor: "#e65100",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 2,
                    elevation: 1
                  }]}>
                    
                    <View style={{ 
                      alignItems: 'center', 
                      marginBottom: 12, 
                      borderBottomWidth: 1, 
                      borderBottomColor: '#ffe5d4', 
                      paddingBottom: 6 
                    }}>
                      <Text style={{ fontSize: 13, color: '#e65100', fontWeight: 'bold', textAlign: 'center' }}>
                        📝 HÔM NAY CÓ SỰ KIỆN GÌ MỚI? BẠN HÃY NHẬP Ở ĐÂY
                      </Text>
                    </View>

                   <View style={[styles.rowInput, { marginBottom: 10 }]}>
  {/* Nút bấm chọn ngày tháng của bạn giữ nguyên */}
 {/* 🎯 KHỐI CHỌN NGÀY VÀ THÔNG BÁO DỰ KIẾN - TÁCH DÒNG PHẲNG KHÔNG LƠ LỬNG */}
  {/* 🎯 NÚT CHỌN NGÀY THÁNG - CỐ ĐỊNH KÍCH THƯỚC PHẲNG */}
  <TouchableOpacity 
    style={[styles.dateButton, { borderColor: '#ffd3b6', backgroundColor: '#ffffff', height: 42, justifyContent: 'center', paddingHorizontal: 10, zIndex: 10000 }]} 
    onPress={() => setDatePickerVisibility(true)}
  >
    <Text style={[styles.dateButtonText, { fontSize: 14 }]}>📅 {ngayHienThi}</Text>
  </TouchableOpacity>

  {/* 🎯 NHÃN MỜ LƠ LỬNG: Nằm ép ngay dưới đáy nút Ngày, tuyệt đối không đẩy dòng làm xấu ô bên cạnh */}
  {suKien && suKien.toString().trim().toUpperCase().includes("PHỐI") && ngayHienThi && (
    <View style={{ position: 'absolute', top: 44, left: 4, right: 0, zIndex: 9999 }}>
      <Text style={{ fontSize: 11, color: '#28a745', fontWeight: 'bold', fontStyle: 'italic' }}>
        Dự kiến đẻ: {tinhNgayDuKienDe(ngayHienThi)}
      </Text>
    </View>
  )}


  
  {!laSuKienBanHeo ? (
    // Nới khung bọc zIndex cao để danh sách gợi ý đè lên trên các ô nhập khác không bị che khuất
       <View style={{ flex: 0.5, position: 'relative' }}>
      
      {/* Ô nhập mã tai gốc của bạn giữ nguyên vẹn tăm tắp */}
      <TextInput 
        style={[styles.inputMaTai, { color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', height: 42, fontSize: 14, paddingVertical: 0, width: '100%' }]} 
        placeholder="Mã Tai" 
        placeholderTextColor="#777777" 
        value={maTai} 
        autoCapitalize="characters"
        onChangeText={(txt) => {
          setMaTai(txt);
          const txtChuan = txt.trim().toUpperCase();
          
          if (txtChuan.length > 0 && Array.isArray(danhSachMaTai)) {
            const mangLoc = danhSachMaTai.filter(heo => 
              heo && heo.maTai && 
              heo.maTai.toString().toUpperCase().includes(txtChuan) &&
              (!heo.trangThaiCotH || heo.trangThaiCotH.toString().trim().normalize("NFC") !== "Thải")
            ).slice(0, 5);
            setGoiYMaTaiLoc(mangLoc);
          } else {
            setGoiYMaTaiLoc([]);
          }
        }} 
      />
      
      {/* 🎯 TẤM MÀNG CHẶN TÀNG HÌNH: Khi hiện gợi ý, bọc một nút phủ toang hoác màn hình để che Picker phía dưới, chạm ra ngoài tự tắt gợi ý */}
      {goiYMaTaiLoc.length > 0 && (
        <TouchableOpacity 
          style={{ 
            position: 'absolute', 
            top: -1000, left: -1000, right: -1000, bottom: -1000, // Bung lề phủ rộng toàn app
            backgroundColor: 'transparent',
            zIndex: 99998
          }} 
          activeOpacity={1} 
          onPress={() => setGoiYMaTaiLoc([])} // Chạm ra khoảng trống tự thu gọn bảng gợi ý
        />
      )}

      {/* 🎯 KHỐI HIỂN THỊ DANH SÁCH GỢI Ý PHẲNG - TUYỆT ĐỐI KHÔNG LÀM TỤT BÀN PHÍM */}
      {goiYMaTaiLoc.length > 0 && (
        <View 
          style={{ 
            position: 'absolute', 
            top: 45, 
            left: 0, 
            right: 0, 
            backgroundColor: '#ffffff', 
            borderRadius: 8, 
            borderWidth: 1, 
            borderColor: '#ffd3b6',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
            elevation: 9999, // Ép Android đẩy độ sâu lên cao nhất để đè lên ô chọn sự kiện dưới
            zIndex: 999999,  // Khóa lơ lửng tối cao trên iOS chống bị chìm dưới form
            maxHeight: 220, 
            overflow: 'hidden'
          }}
        >
          <ScrollView 
            nestedScrollEnabled={true} 
            keyboardShouldPersistTaps="always" // Ép chạm phát ăn lệnh điền chữ ngay, giữ bàn phím phăng phắc
            showsVerticalScrollIndicator={false}
          >
            {goiYMaTaiLoc.map((heo, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.4} 
                style={{ 
                  paddingVertical: 12, 
                  paddingHorizontal: 14, 
                  borderBottomWidth: index === goiYMaTaiLoc.length - 1 ? 0 : 0.5, 
                  borderBottomColor: '#ffe5d4',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#ffffff' // Đổ nền đặc cách ly hoàn toàn ô Picker lấp ló bên dưới
                }}
                onPress={() => {
                  setMaTai(heo.maTai.toString().toUpperCase()); // Điền chuỗi in hoa vào ô nhập
                  setGoiYMaTaiLoc([]);                          // Thu gọn bảng gợi ý ngay lập tức
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100' }}>🏷️ {heo.maTai}</Text>
                <Text style={{ fontSize: 11, color: '#666666', fontStyle: 'italic' }}>{heo.giong || "---"}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}


      {/* KHỐI CẢNH BÁO TRÙNG THẢI / MÃ TAI MỚI CỦA BẠN ĐƯỢC GIỮ NGUYÊN */}
      {(() => {
        const maTaiChuan = maTai.trim().toUpperCase();
        if (maTaiChuan.length === 0 || laSuKienBanHeo || goiYMaTaiLoc.length > 0) return null;

        const heoTimDuoc = Array.isArray(danhSachMaTai) && danhSachMaTai.find(heo => heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiChuan);
        const trangThaiHeo = heoTimDuoc && heoTimDuoc.trangThaiCotH ? heoTimDuoc.trangThaiCotH.toString().trim().normalize("NFC") : "";

        if (heoTimDuoc && trangThaiHeo === "Thải") {
          return (
            <View style={{ backgroundColor: '#fff3cd', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginTop: 6, borderWidth: 0.5, borderColor: '#ffeeba', alignItems: 'center' }}>
              <Text style={{ color: '#856404', fontWeight: '600', fontSize: 11 }}>⚠️ Mã tai này trùng với heo đã thải!</Text>
            </View>
          );
        }
        if (!heoTimDuoc) {
          return (
            <TouchableOpacity activeOpacity={0.7} style={{ backgroundColor: '#fff0e6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, marginTop: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffd3b6', flexDirection: 'row', gap: 4 }} onPress={() => setIsQuickAddModalVisible(true)}>
              <Text style={{ fontSize: 13 }}>➕</Text>
              <Text style={{ color: '#e65100', fontWeight: 'bold', fontSize: 12 }}>Mã tai mới! Bấm để thêm vào sổ gốc</Text>
            </TouchableOpacity>
          );
        }
        return null;
      })()}
    </View>
  ) : (
    <View style={{ flex: 0.5 }} />
  )}
</View>
                    <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={(d) => { setNgayHienThi(formatVNDate(d)); setDatePickerVisibility(false); }} onCancel={() => setDatePickerVisibility(false)} confirmTextConfirm="Xác nhận" cancelText="Hủy" />
                    
                    <View style={{ 
                      marginBottom: 10, 
                      borderWidth: 1.2, 
                      borderColor: '#ffd3b6', 
                      borderRadius: 8, 
                      backgroundColor: '#ffffff',
                      justifyContent: 'center',
                      minHeight: 44
                    }}>
                      <Picker 
                        selectedValue={suKien} 
                        dropdownIconColor="#111111" 
                        style={{ color: '#111111', backgroundColor: 'transparent', width: '100%' }} 
                        onValueChange={(itemValue) => { setSuKien(itemValue); setSoHeo(''); }}
                      >
                        {danhSachSuKien.map((item, index) => (
                          <Picker.Item key={index} label={item} value={item} style={{ color: '#111111', backgroundColor: '#ffffff', fontSize: 14 }} />
                        ))}
                      </Picker>
                    </View>

                    {suKien === "Đẻ" && (
                      <View style={{ backgroundColor: '#ffffff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ffd3b6', marginBottom: 10 }}>
                        <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: '#28a745', flex: 1 }}>Tổng số heo sơ sinh (con):</Text>
                          <TextInput style={[styles.inputStandard, { marginBottom: 0, paddingVertical: 6, height: 38, fontSize: 15, fontWeight: 'bold', color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', flex: 1, textAlign: 'center' }]} value={soHeo} onChangeText={setSoHeo} placeholder="Số con..." keyboardType="numeric" placeholderTextColor="#888888"/>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <View style={{ flex: 0.48 }}>
                            <TextInput style={[styles.inputStandard, { marginBottom: 0, height: 38, paddingVertical: 0, paddingHorizontal: 8, fontSize: 13, textAlign: 'center', color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6' }]} placeholder="Khô thai" keyboardType="numeric" placeholderTextColor="#777777" value={khoThai} onChangeText={setKhoThai} />
                          </View>
                          <View style={{ flex: 0.48 }}>
                            <TextInput style={[styles.inputStandard, { marginBottom: 0, height: 38, paddingVertical: 0, paddingHorizontal: 8, fontSize: 13, textAlign: 'center', color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6' }]} placeholder="Còi cọc" keyboardType="numeric" placeholderTextColor="#777777" value={coiCoc} onChangeText={setCoiCoc} />
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <View style={{ flex: 0.48 }}>
                            <TextInput style={[styles.inputStandard, { marginBottom: 0, height: 38, paddingVertical: 0, paddingHorizontal: 8, fontSize: 13, textAlign: 'center', color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6' }]} placeholder="Chết ngộp" keyboardType="numeric" placeholderTextColor="#777777" value={chetNgop} onChangeText={setChetNgop} />
                          </View>
                          <View style={{ flex: 0.48 }}>
                            <TextInput style={[styles.inputStandard, { marginBottom: 0, height: 38, paddingVertical: 0, paddingHorizontal: 8, fontSize: 13, textAlign: 'center', color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6' }]} placeholder="Chọn nuôi" keyboardType="numeric" placeholderTextColor="#777777" value={chonNuoi} onChangeText={setChonNuoi} />
                          </View>
                        </View>
                      </View>
                    )}

                    {canNhapSoHeo && suKien !== "Đẻ" && (
                      <TextInput style={[styles.inputStandard, { color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', marginBottom: 10, height: 42, fontSize: 14, paddingVertical: 0 }]} value={soHeo} onChangeText={setSoHeo} placeholder={`Nhập Số Heo ${suKien.toLowerCase()} (con)`} keyboardType="numeric" placeholderTextColor="#888888"/>
                    )}

                    <TextInput style={[styles.inputStandard, { color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', marginBottom: 10, height: 42, fontSize: 14, paddingVertical: 0 }]} placeholder="Nhập Ghi chú (nếu có)" placeholderTextColor="#888888" value={ghiChu} onChangeText={setGhiChu} />

                    <TouchableOpacity onPress={handleSaveNew} activeOpacity={0.5} style={{ backgroundColor: '#e65100', paddingVertical: 9, borderRadius: 6, alignItems: 'center', marginTop: 4 }}>
                      <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>Thêm Mới Nhật Ký</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null // Nếu ô tìm kiếm có chữ, trả về null (Form lập tức ẩn biến mất tăm, dành trọn không gian hiện danh sách)
            }




                        renderItem={({ item }) => (
              /* 🎯 ĐÃ CẬP NHẬT: Ép dòng mờ đi 60% (opacity: 0.4) và chuyển nền cam nhạt khi ở trạng thái Chờ Xóa/Sửa */
              <View style={[
                styles.historyCard, 
                item.syncStatus === "waiting" && { backgroundColor: '#fef1d6', borderColor: '#fbc48c', opacity: 0.4 }
              ]}>
                <View style={{ flex: 1, paddingRight: 5 }}>
                  {/* 🎯 ĐÃ KHÔI PHỤC: Xóa bỏ nhãn trạng thái lặp lại ở đây, chỉ giữ lại Ngày và Mã Tai gốc */}
                  <Text style={styles.cardHeader}>
                    📅 {(() => {
                      if (!item.ngay) return "---";
                      const str = item.ngay.toString().trim();
                      if (str.includes('/') && str.split('/').length === 3) return str.substring(0, 10);
                      const d = new Date(str);
                      if (isNaN(d.getTime())) return str.substring(0, 10);
                      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                    })()} |                   {/* 🟢 ĐÃ VÁ THẨM MỸ CAO CẤP: Đồng bộ lề hàng và phông nền tinh tế cho dòng Bán Heo */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                    <Text style={styles.cardBody}>Mã Tai: </Text>
                    {item.maTai === "BÁN HEO" ? (
                      // 1. Nhãn phẳng màu xám nhạt tinh tế cho sự kiện Bán Heo (Không có kính lúp)
                      <View style={{ backgroundColor: '#f1f2f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#ced4da' }}>
                        <Text style={{ color: '#4f5d73', fontWeight: 'bold', fontSize: 12 }}>
                          BÁN HEO
                        </Text>
                      </View>
                    ) : (
                      // 2. Nhãn bấm chuyên nghiệp cho Mã tai heo nái thực tế
                      <TouchableOpacity 
                        activeOpacity={0.5}
                        style={{ backgroundColor: '#e7f1ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#b8daff' }}
                        onPress={() => {
                          let thongTinDayDuCuaNai = { maTai: item.maTai }; 
                          if (Array.isArray(danhSachMaTai)) {
                            const naiTimDuoc = danhSachMaTai.find(heo => heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === item.maTai.toString().toUpperCase().trim());
                            if (naiTimDuoc) {
                              thongTinDayDuCuaNai = naiTimDuoc;
                            }
                          }
                          handleXemChiTietHeo(thongTinDayDuCuaNai);
                        }}
                      >
                        <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 12 }}>
                          {item.maTai} 🔎
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  </Text>

                  <Text style={styles.cardBody}>
                    📝 {item.suKien} {item.soHeo !== "" ? `(${item.soHeo} con)` : ""}
                  </Text>

                  {/* 🎯 VỊ TRÍ CHÈN CHUẨN VÀNG: HIỂN THỊ NGÀY DỰ ĐẺ RIÊNG CHO CÁC THẺ NHẬT KÝ SỰ KIỆN PHỐI */}
                  {item && item.suKien && item.suKien.toString().trim().toUpperCase().includes("PHỐI") && item.ngay && (
                    <View 
                      style={{ 
                        marginTop: 4, 
                        marginBottom: 2,
                        backgroundColor: '#f4fbf7', 
                        paddingVertical: 4, 
                        paddingHorizontal: 8, 
                        borderRadius: 4, 
                        borderLeftWidth: 3, 
                        borderLeftColor: '#28a745',
                        alignSelf: 'flex-start' // Bọc khít chữ vuông vắn, không làm đẩy lấn các ô khác
                      }}
                    >
                      <Text style={{ fontSize: 11, color: '#155724', fontWeight: 'bold', fontStyle: 'italic' }}>
                        ⏳ Dự kiến đẻ: {tinhNgayDuKienDe(item.ngay)}
                      </Text>
                    </View>
                  )}

                  {/* 🎯 SỬA CHUẨN: BỎ NGOẶC TRÒN CŨ CỦA BẠN GIỮ NGUYÊN VẸN 100% */}
                  {item.suKien === "Đẻ" && !!(item.khoThai || item.coiCoc || item.chetNgop || item.chonNuoi) && (
                    <View style={{ marginTop: 4 }}>
                      {/* Hàng 1: Các chỉ số hao hụt sơ sinh dạng chữ phẳng gọn gàng */}
                      <Text style={{ fontSize: 12, color: '#666666', lineHeight: 18 }}>
                        Khô: {String(item.khoThai || 0)} | Còi: {String(item.coiCoc || 0)} | Ngộp: {String(item.chetNgop || 0)}
                      </Text>
                      
                      {/* Hàng 2: Chỉ số Chọn Nuôi nằm hàng dưới, chữ đen và đậm nét hơn */}
                      <Text style={{ fontSize: 13, color: '#111111', fontWeight: 'bold', marginTop: 2, lineHeight: 18 }}>
                        Chọn Nuôi: <Text style={{ color: '#28a745', fontWeight: 'bold' }}>{String(item.chonNuoi || 0)} con</Text>
                      </Text>
                    </View>
                  )}

                  {/* 🎯 CHẶN CHỮ RỖNG GHI CHÚ GỐC CỦA BẠN */}
                  {!!item.ghiChu && <Text style={{ fontSize: 12, color: '#e65100', fontStyle: 'italic', marginTop: 2 }}>📌 Ghi chú: {String(item.ghiChu)}</Text>}
               </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleEditClick(item)} style={styles.editBtn}>
                    <Text style={styles.btnText}>Sửa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      Alert.alert("Xác nhận", "Xóa dòng nhật ký khỏi sổ?", [
                        { text: "Hủy" },
                        { 
                          text: "Xóa", 
                          onPress: () => {
                            // 🎯 KHÓA CỨNG ĐẦU VÀO: Gán số 0 và chuỗi rỗng để dải nối link URL trong hàm GET chạy phẳng lỳ không dính lỗi rỗng
                            const dongMuonXoa = { 
                              id: item.id,
                              userEmail: userEmail ? userEmail.toLowerCase().trim() : "",
                              actionType: "delete",
                              ngay: "", 
                              maTai: item.maTai || "", 
                              suKien: item.suKien || "", 
                              soHeo: 0, // Điền số 0 để dập tắt lỗi sập mạng vật lý của dải nối chuỗi link GET
                              giong: "", lua: "", khoThai: "", coiCoc: "", chetNgop: "", chonNuoi: "", ghiChu: "", tuanBan: ""
                            };
                            
                            setDongBoStatus("⏳ Đang thực hiện xóa nhật ký...");
                            
                            // Ép dòng này trên màn hình chuyển sang trạng thái "waiting" để kích hoạt mờ cam lập tức
                            setDanhSachLichSu(prev => prev.map(i => i.id === item.id ? { ...i, syncStatus: "waiting" } : i));
                            
                            guiYeuCauMang(dongMuonXoa, (res) => {
                              // 🟢 VÁ CHÍ MẠNG: Chấp nhận cả cờ 'success' lẫn cờ mạng chuyển hướng 'offline_queue' để chặn đứng hoàn toàn lỗi mạng ảo
                              if (res && (res.status === 'success' || res.status === 'offline_queue')) {
                                
                                // Thực hiện xóa hẳn dòng khỏi giao diện màn hình phẳng sạch sẽ
                                setDanhSachLichSu(prev => prev.filter(i => i.id !== item.id));
                                setDongBoStatus("✅ Đã xóa dòng nhật ký thành công!");
                              } else {
                                // Nếu lỗi thực sự, trả về trạng thái cũ để hết mờ
                                setDanhSachLichSu(prev => prev.map(i => i.id === item.id ? { ...i, syncStatus: "synced" } : i));
                                setDongBoStatus("❌ Lỗi mạng thực sự, không thể xóa dòng nhật ký.");
                              }
                            });
                          } 
                        }
                      ]);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.btnText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
 
          />
        </View>
      )}


      {/* TAB 2: MÃ TAI */}
     {currentTab === 'ma_tai' && ( 
        <View style={{ flex: 1 }}>
           <View style={{ paddingHorizontal: 15, marginTop: 12, marginBottom: 5 }}>
                  <TextInput style={[styles.inputStandard, { marginBottom: 0, borderRadius: 20, paddingHorizontal: 15, height: 42, backgroundColor: '#f2f2f2', borderWidth: 0, color: '#111111', fontSize: 14 }]} placeholder="🔍 Nhập Mã Tai để tìm kiếm..." placeholderTextColor="#888888" value={searchTxtTab2} onChangeText={setSearchTxtTab2} autoCapitalize="characters" />
           </View>

          {/* ======================================================== */}
          {/* 🟢 KHỐI TÍNH TOÁN ĐÃ ĐƯỢC ĐƯA RA NGOÀI FLATLIST TOÀN CỤC */}
          {/* ======================================================== */}
         

          {/* Bây giờ mới khai báo thẻ FlatList và chỉ truyền bộ lọc ngắn gọn */}
          <FlatList 
            data={(global.danhSachCapNhatTrangThai || [])


              .filter(dongLoc => {
                if (!dongLoc) return false;
                if (dongLoc.vuaNhapMoi) return false;

                if (searchTxtTab2 && searchTxtTab2.trim() !== "") {
                  return (dongLoc.maTai ? dongLoc.maTai.toString().toLowerCase().trim() : "").includes(searchTxtTab2.toLowerCase().trim());
                }

                if (nhomNaiTab2 === 'Cho Phoi') {
                  return (
                    dongLoc.trangThaiDienThoai === "Chờ Phối" || 
                    dongLoc.trangThaiDienThoai === "Cai Sữa" || 
                    dongLoc.trangThaiDienThoai === "Lốc" || 
                    dongLoc.trangThaiDienThoai === "Sảy Thai"
                  );
                } else if (nhomNaiTab2 === 'Phoi') {
                  return dongLoc.trangThaiDienThoai === "Phối";
                } else if (nhomNaiTab2 === 'De') {
                  return dongLoc.trangThaiDienThoai === "Đẻ";
                } else if (nhomNaiTab2 === 'Thai') {
                  return dongLoc.trangThaiDienThoai === "Thải";
                }
                return true;
              })
              .sort((a, b) => {
                // 🌟 THUẬT TOÁN SẮP XẾP ƯU TIÊN: Cai Sữa -> Sảy Thai -> Lốc -> Chờ Phối
                if (nhomNaiTab2 === 'Cho Phoi') {
                  const layTrongSoUuTien = (trangThai) => {
                    if (trangThai === "Cai Sữa") return 1;
                    if (trangThai === "Sảy Thai") return 2;
                    if (trangThai === "Lốc") return 3;
                    return 4;
                  };
                  let trongSoA = layTrongSoUuTien(a.trangThaiDienThoai);
                  let trongSoB = layTrongSoUuTien(b.trangThaiDienThoai);
                  if (trongSoA !== trongSoB) return trongSoA - trongSoB;
                } else if (nhomNaiTab2 === 'De') {
                  const layMocThoiGianDeAnToan = (m) => {
                    if (!m || !m.ngayDeDongThoiGianThuc) return 0;
                    const dObj = parseToDateObject(m.ngayDeDongThoiGianThuc);
                    return dObj ? dObj.getTime() : 0;
                  };
                  let mocA = layMocThoiGianDeAnToan(a);
                  let mocB = layMocThoiGianDeAnToan(b);
                  if (mocA === 0 && mocB !== 0) return 1;
                  if (mocA !== 0 && mocB === 0) return -1;
                  if (mocA !== mocB) return mocA - mocB;
                } else {
                  const layMocThoiGianDuSinhAnToan = (m) => {
                    if (!m || !m.ngayDuKienDeMoi) return 0;
                    let str = m.ngayDuKienDeMoi.toString().trim();
                    if (str === "" || str === "---") return 0;
                    const dObj = parseToDateObject(str);
                    return dObj ? dObj.getTime() : 0;
                  };
                  let mocA = layMocThoiGianDuSinhAnToan(a);
                  let mocB = layMocThoiGianDuSinhAnToan(b);
                  if (mocA === 0 && mocB !== 0) return 1;
                  if (mocA !== 0 && mocB === 0) return -1;
                  if (mocA !== mocB) return mocA - mocB;
                }
                return (b.id ? b.id.toString() : "").localeCompare(a.id ? a.id.toString() : "");
              })
            }
            keyExtractor={(i) => i && i.id ? i.id.toString() : Math.random().toString()} 
            contentContainerStyle={{ paddingBottom: 80 }}
            
            ListHeaderComponent={
              <View style={{ backgroundColor: '#ffffff', paddingBottom: 5 }}>
                {!searchTxtTab2 ? (
                  <View>
                    {/* Khung tạo mới heo nái vào sổ */}
                    <View style={[styles.formFixedContainer, { backgroundColor: '#fffaf5', borderWidth: 1.2, borderColor: '#ffd3b6', borderRadius: 10, padding: 12, shadowColor: "#e65100", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 }]}>
                      <View style={{ alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ffe5d4', paddingBottom: 6 }}>
                        <Text style={{ fontSize: 13, color: '#e65100', fontWeight: 'bold' }}>📌 TẠO MỚI HEO NÁI VÀO SỔ</Text>
                      </View>
                      <View style={[styles.rowInput, { marginBottom: 10 }]}>
                        <TextInput style={[styles.inputStandard, { flex: 1, marginBottom: 0, marginRight: 8, color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', height: 42, fontSize: 14, paddingVertical: 0 }]} placeholder="Mã Tai" placeholderTextColor="#777777" value={mtMaTai} onChangeText={setMtMaTai} autoCapitalize="characters" />
                        <TextInput style={[styles.inputStandard, { flex: 1, marginBottom: 0, color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', height: 42, fontSize: 14, paddingVertical: 0 }]} placeholder="Giống heo" placeholderTextColor="#777777" value={mtGiong} onChangeText={setMtGiong} />
                      </View>
                      <View style={{ marginBottom: 10, borderWidth: 1.2, borderColor: '#ffd3b6', borderRadius: 8, backgroundColor: '#ffffff', justifyContent: 'center', minHeight: 44 }}>
                        <Picker selectedValue={mtLua} dropdownIconColor="#111111" style={{ color: '#111111', backgroundColor: 'transparent', width: '100%' }} onValueChange={(itemValue) => setMtLua(itemValue)}>
                          {danhSachLuaHeo.map((item, index) => (
                            <Picker.Item key={index} label={item} value={item} style={{ color: '#111111', backgroundColor: '#ffffff', fontSize: 14 }} />
                          ))}
                        </Picker>
                      </View>
                      <TouchableOpacity onPress={handleSaveMaTai} activeOpacity={0.5} style={{ backgroundColor: '#e65100', paddingVertical: 9, borderRadius: 6, alignItems: 'center', marginTop: 4 }}>
                        <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>THÊM MÃ TAI MỚI VÀO SỔ</Text>
                      </TouchableOpacity>
                    </View>

                   {/* Khối ghim heo nái vừa thêm - Thiết kế phẳng tối giản, sạch 100% icon rườm rà */}
                   {Array.isArray(danhSachMaTai) && danhSachMaTai.some(i => i && i.vuaNhapMoi) && (
  <View style={{ paddingHorizontal: 15, marginTop: 5, marginBottom: 5 }}>
    <Text style={{ fontSize: 12, color: '#e65100', fontWeight: 'bold', marginBottom: 4 }}>Heo nái vừa thêm vào hệ thống ( Bấm CẬP NHẬT Nếu Muốn Xóa / Sửa và Sắp xếp ở 4 ô phía dưới )</Text>
    {danhSachMaTai.filter(i => i && i.vuaNhapMoi).map((naiVuaThem, idx) => {
      // 🟢 CHÈN CÔNG THỨC TRA CỨU: Dò tìm trạng thái sinh sản thực tế hiện tại của con nái này từ RAM toàn cục
      const maTaiChuan = naiVuaThem.maTai ? naiVuaThem.maTai.toString().toUpperCase().trim() : "";
      const thongTinNaiHienTai = (global.danhSachCapNhatTrangThai || []).find(h => h && h.maTai && h.maTai.toString().toUpperCase().trim() === maTaiChuan);
      const trangThaiThucTe = thongTinNaiHienTai ? thongTinNaiHienTai.trangThaiDienThoai : "Chờ Phối";

      return (
        <View key={`vuanhap_${naiVuaThem.id || idx}`} style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffdf6', borderColor: '#fbc48c', opacity: 0.8 }, styles.historyCard, { marginHorizontal: 0, marginTop: 4, padding: 10 }]}>
          <View style={{ flex: 1 }}>
            
            {/* Hàng 1: Mã số bọc khung nhãn phẳng đơn giản */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, color: '#666666', fontWeight: '500' }}>Mã số: </Text>
              <View style={{ backgroundColor: '#e7f1ff', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 0.5, borderColor: '#b8daff' }}>
                <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 13 }}>{naiVuaThem.maTai || "---"}</Text>
              </View>
            </View>
            
            {/* Hàng 2: Giống và Lứa viết phẳng mạch lạc */}
            <Text style={[styles.cardBody, { color: '#333333', marginBottom: 4 }]} numberOfLines={1}>
              Giống: <Text style={{ fontWeight: '600' }}>{naiVuaThem.giong || "---"}</Text> | Lứa: <Text style={{ fontWeight: 'bold', color: '#e83e8c' }}>{naiVuaThem.lua || "---"}</Text>
            </Text>
            
            {/* ======================================================== */}
            {/* 🟢 HÀNG 3: HIỂN THỊ TRẠNG THÁI CHĂN NUÔI THỜI GIAN THỰC TỪ TAB 1 */}
            {/* ======================================================== */}
            <Text style={{ fontSize: 13, color: '#111111', fontWeight: '500' }}>
              Trạng thái thực tế: <Text style={{ 
                fontWeight: 'bold', 
                color: trangThaiThucTe === "Phối" ? '#007bff' : 
                       trangThaiThucTe === "Đẻ" ? '#28a745' : 
                       trangThaiThucTe === "Thải" ? '#dc3545' : 
                       trangThaiThucTe === "Lốc" ? '#dc3545' : 
                       trangThaiThucTe === "Sảy Thai" ? '#d946ef' : 
                       '#666666' 
              }}>
                {(() => {
                  if (trangThaiThucTe === "Phối") return "Đang bầu";
                  if (trangThaiThucTe === "Đẻ") return "Nuôi con";
                  if (trangThaiThucTe === "Thải") return "Đã Thải";
                  if (trangThaiThucTe === "Cai Sữa") return "Cai Sữa (Chờ lên giống)";
                  if (trangThaiThucTe === "Lốc") return "Lốc (Phối hỏng)";
                  if (trangThaiThucTe === "Sảy Thai") return "Sảy Thai";
                  return "Chờ phối";
                })()}
              </Text>
            </Text>
            {/* ======================================================== */}

          </View>
        </View>
      );
    })}
  </View>
)}
                  </View>
                ) : null}

             <View style={{ flexDirection: 'row', paddingHorizontal: 15, marginTop: 8, marginBottom: 10, gap: 5 }}>
  {/* NÚT 1: CHỜ PHỐI */}
  <TouchableOpacity onPress={() => setNhomNaiTab2('Cho Phoi')} style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'Cho Phoi' ? '#e65100' : '#f2f2f2', paddingVertical: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 52 }}>
    <Text style={{ color: nhomNaiTab2 === 'Cho Phoi' ? '#ffffff' : '#666666', fontSize: 11, fontWeight: '600', textAlign: 'center' }}>Chờ Phối</Text>
    <Text style={{ color: nhomNaiTab2 === 'Cho Phoi' ? '#ffffff' : '#e65100', fontSize: 14, fontWeight: '900', marginTop: 2, textAlign: 'center' }}>
      {(() => {
        const danhSachGoc = global.danhSachCapNhatTrangThai || [];
        return String(danhSachGoc.filter(dongLoc => 
          dongLoc && !dongLoc.vuaNhapMoi && (
            dongLoc.trangThaiDienThoai === "Chờ Phối" || 
            dongLoc.trangThaiDienThoai === "Cai Sữa" || 
            dongLoc.trangThaiDienThoai === "Lốc" || 
            dongLoc.trangThaiDienThoai === "Sảy Thai"
          )
        ).length);
      })()}
    </Text>
  </TouchableOpacity>
  
  {/* NÚT 2: MANG THAI */}
  <TouchableOpacity onPress={() => setNhomNaiTab2('Phoi')} style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'Phoi' ? '#e65100' : '#f2f2f2', paddingVertical: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 52 }}>
    <Text style={{ color: nhomNaiTab2 === 'Phoi' ? '#ffffff' : '#666666', fontSize: 11, fontWeight: '600', textAlign: 'center' }}>Mang Thai</Text>
    <Text style={{ color: nhomNaiTab2 === 'Phoi' ? '#ffffff' : '#007bff', fontSize: 14, fontWeight: '900', marginTop: 2, textAlign: 'center' }}>
      {(() => {
        const danhSachGoc = global.danhSachCapNhatTrangThai || [];
        return String(danhSachGoc.filter(dongLoc => 
          dongLoc && !dongLoc.vuaNhapMoi && dongLoc.trangThaiDienThoai === "Phối"
        ).length);
      })()}
    </Text>
  </TouchableOpacity>
  
  {/* NÚT 3: NUÔI CON */}
  <TouchableOpacity onPress={() => setNhomNaiTab2('De')} style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'De' ? '#e65100' : '#f2f2f2', paddingVertical: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 52 }}>
    <Text style={{ color: nhomNaiTab2 === 'De' ? '#ffffff' : '#666666', fontSize: 11, fontWeight: '600', textAlign: 'center' }}>Nuôi Con</Text>
    <Text style={{ color: nhomNaiTab2 === 'De' ? '#ffffff' : '#28a745', fontSize: 14, fontWeight: '900', marginTop: 2, textAlign: 'center' }}>
      {(() => {
        const danhSachGoc = global.danhSachCapNhatTrangThai || [];
        return String(danhSachGoc.filter(dongLoc => 
          dongLoc && !dongLoc.vuaNhapMoi && dongLoc.trangThaiDienThoai === "Đẻ"
        ).length);
      })()}
    </Text>
  </TouchableOpacity>
  
  {/* NÚT 4: ĐÃ THẢI */}
  <TouchableOpacity onPress={() => setNhomNaiTab2('Thai')} style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'Thai' ? '#6c757d' : '#f2f2f2', paddingVertical: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 52 }}>
    <Text style={{ color: nhomNaiTab2 === 'Thai' ? '#ffffff' : '#666666', fontSize: 11, fontWeight: '600', textAlign: 'center' }}>Đã Thải</Text>
    <Text style={{ color: nhomNaiTab2 === 'Thai' ? '#ffffff' : '#dc3545', fontSize: 14, fontWeight: '900', marginTop: 2, textAlign: 'center' }}>
      {(() => {
        const danhSachGoc = global.danhSachCapNhatTrangThai || [];
        return String(danhSachGoc.filter(dongLoc => 
          dongLoc && !dongLoc.vuaNhapMoi && dongLoc.trangThaiDienThoai === "Thải"
        ).length);
      })()}
    </Text>
  </TouchableOpacity>
</View>


              </View>
            }
            renderItem={({ item }) => {
              if (!item || !item.maTai) return null;
              return (
                <View style={[{ flexDirection: 'row', alignItems: 'center' }, styles.historyCard, item.syncStatus === "waiting" && { backgroundColor: '#fef1d6', borderColor: '#fbc48c', opacity: 0.4 }]}>
                  <TouchableOpacity 
                    activeOpacity={0.6}
                    style={{ flex: 1, paddingRight: 5 }}
                    onPress={() => {
                      setSelectedHeoDetail(item);
                      setIsDetailModalVisible(true);
                      setLoadingLichSuDe(true);
fetch(`${WEB_APP_URL}?action=get_lich_su_de&userEmail=${userEmail.toLowerCase().trim()}&maTai=${item.maTai}`, { method: 'GET', redirect: 'follow' })
                        .then(res => res.json())
                        .then(result => {
                          setLoadingLichSuDe(false);
                          if (result.status === 'success' && result.data) {
                            setMangLichSuDeCuaTai(result.data);
                          }
                        }).catch(() => setLoadingLichSuDe(false));
                    }}
                  >
                 {/* Hàng 1: Mã số nái và Trạng thái mạng ngầm phẳng sạch */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ fontSize: 13, color: '#666666', fontWeight: '500' }}>Mã số: </Text>
                      <View style={{ backgroundColor: '#e7f1ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#b8daff' }}>
                        <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 13 }}>{item.maTai || "---"}</Text>
                      </View>
                      
                      {/* Nhãn mạng ngầm chữ phẳng thu gọn nép bên phải */}
                      <View style={{ marginLeft: 'auto' }}>
                        {item.syncStatus === "waiting" ? (
                          <Text style={{ fontSize: 11, color: '#e65100', fontWeight: '600', fontStyle: 'italic' }}>Đang tạo...</Text>
                        ) : (
                          item.vuaNhapMoi ? <Text style={{ fontSize: 11, color: '#28a745', fontWeight: '600' }}>Đã vào sổ</Text> : null
                        )}
                      </View>
                    </View>
                    
                    {/* Hàng 2: Giống và Lứa viết phẳng mạch lạc trên 1 dòng */}
                    <Text style={[styles.cardBody, { color: '#333333', marginBottom: 4 }]} numberOfLines={1}>
                      Giống: <Text style={{ fontWeight: '600' }}>{item.giong || "---"}</Text> | Lứa: <Text style={{ fontWeight: 'bold', color: '#e83e8c' }}>{item.luaHienThiThongMinh || item.lua || "---"}</Text>
                    </Text>
                    
               {/* Hàng 3: Trạng thái sinh sản thực tế chữ phẳng rõ nét */}
{/* Hàng 3: Trạng thái sinh sản thực tế chữ phẳng rõ nét - ĐÃ LÀM SẠCH BIỂU TƯỢNG ICON */}
<Text style={{ fontSize: 13, color: '#111111', fontWeight: '500', marginBottom: (item.trangThaiDienThoai === "Đẻ" || item.trangThaiDienThoai === "Phối" || item.trangThaiDienThoai === "Lốc" || item.trangThaiDienThoai === "Sảy Thai") ? 4 : 0 }}>
  Trạng Thái: <Text style={{ 
    fontWeight: 'bold', 
    color: item.trangThaiDienThoai === "Phối" ? '#007bff' : 
           item.trangThaiDienThoai === "Đẻ" ? '#28a745' : 
           item.trangThaiDienThoai === "Thải" ? '#dc3545' : 
           item.trangThaiDienThoai === "Lốc" ? '#dc3545' : 
           item.trangThaiDienThoai === "Sảy Thai" ? '#d946ef' : 
           '#666666' 
  }}>
    {(() => {
      if (item.trangThaiDienThoai === "Phối") return "Đang bầu";
      if (item.trangThaiDienThoai === "Đẻ") return "Nuôi con";
      if (item.trangThaiDienThoai === "Thải") return "Đã Thải";
      if (item.trangThaiDienThoai === "Cai Sữa") return "Cai Sữa (Chờ lên giống)";
      
      // ✅ CHỮ PHẲNG VĂN BẢN THUẦN - SẠCH SẼ 100% ICON TRỰC QUAN
      if (item.trangThaiDienThoai === "Lốc") return "Lốc (Phối hỏng)";
      if (item.trangThaiDienThoai === "Sảy Thai") return "Sảy Thai";
      return "Chờ phối";
    })()}
  </Text>
</Text>

{/* ======================================================== */}
{/* 🟢 BẢN VÁ HIỂN THỊ: TRA CỨU BIẾN NGÀY ĐẺ ĐỘNG MỚI ĐƯỢC KHƠI THÔNG */}
{/* ======================================================== */}
{item.trangThaiDienThoai === "Đẻ" && item.ngayDeDongThoiGianThuc && item.ngayDeDongThoiGianThuc.toString().trim() !== "" && item.ngayDeDongThoiGianThuc.toString().trim() !== "---" && (
  <View 
    style={{ 
      marginTop: 2, 
      borderTopWidth: 0.5, 
      borderTopColor: '#e9ecef', 
      paddingTop: 4, 
      gap: 2 
    }}
  >
    <Text style={{ fontSize: 12.5, color: '#555555' }}>
      Số ngày đã đẻ: <Text style={{ color: '#28a745', fontWeight: '700' }}>
        {(() => {
          // Trỏ thẳng vào biến ngày đẻ động vừa khơi thông
          const dDe = parseToDateObject(item.ngayDeDongThoiGianThuc);
          if (!dDe) return "---";
          
          const dNay = new Date(); 
          dNay.setHours(0, 0, 0, 0);
          
          const khoangCachNgay = Math.floor((dNay.getTime() - dDe.getTime()) / (1000 * 60 * 60 * 24));
          
          if (khoangCachNgay === 0) return "Hôm nay";
          return khoangCachNgay > 0 ? `${khoangCachNgay} ngày` : "0 ngày";
        })()}
      </Text>
    </Text>
    
    
  </View>
)}

                    {/* Hàng 4 & 5: Chu kỳ mang thai thời gian thực (Chỉ tự động mở ra khi nái mang thai) */}
                    {item.trangThaiDienThoai === "Phối" && (
                      <View style={{ marginTop: 2, borderTopWidth: 0.5, borderTopColor: '#e9ecef', paddingTop: 4, gap: 2 }}>
                        {item.ngayDuKienDeMoi && item.ngayDuKienDeMoi.toString().trim() !== "---" && (
                          <Text style={{ fontSize: 12.5, color: '#555555' }}>
                            Dự kiến đẻ: <Text style={{ color: '#e65100', fontWeight: '700' }}>{formatStringtoVN(item.ngayDuKienDeMoi)}</Text>
                          </Text>
                        )}
                        {item.ngayPhoiDong && item.ngayPhoiDong.toString().trim() !== "---" && (
                          <Text style={{ fontSize: 12.5, color: '#555555' }}>
                            Số ngày bầu: <Text style={{ color: '#007bff', fontWeight: 'bold' }}>
                              {(() => {
                                const ngayPhoi = parseToDateObject(item.ngayPhoiDong);
                                if (!ngayPhoi) return "---";
                                const ngayHomNay = new Date();
                                ngayHomNay.setHours(0, 0, 0, 0);
                                const khoangCach = ngayHomNay.getTime() - ngayPhoi.getTime();
                                const soNgayBau = Math.floor(khoangCach / (1000 * 60 * 60 * 24));
                                return soNgayBau >= 0 ? `${soNgayBau} ngày` : "0 ngày";
                              })()}
                            </Text>
                          </Text>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'column', gap: 6, minWidth: 60 }}>
                    <TouchableOpacity onPress={() => handleMtEditClick(item)} style={{ backgroundColor: '#ffc107', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, alignItems: 'center' }}>
                      <Text style={{ color: '#000000', fontWeight: 'bold', fontSize: 12 }}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={()=>{
                        Alert.alert("Xác nhận",`Xóa mã tai [${item.maTai}] khỏi sổ đàn?`,[
                          {text:"Hủy"},
                          {
                            text:"Xóa",
                            onPress:()=>{
                              const dongMuonXoa={...item,syncStatus:"waiting",actionType:"mt_delete"};
                              setDongBoStatus(`⏳ Đang xóa tai: ${item.maTai}...`);
                              setDanhSachMaTai(prev => prev.map(i => i.id === item.id ? { ...i, syncStatus: "waiting" } : i));
                              guiYeuCauMang(dongMuonXoa,(res)=>{
                                if(res&&res.status==='success'){
                                  setDanhSachMaTai(prev=>prev.filter(i=>i.id!==item.id));
                                  setDongBoStatus('✅ Đã xóa Mã Tai thành công!');
                                } else {
                                  setDanhSachMaTai(prev => prev.map(i => i.id === item.id ? { ...i, syncStatus: "synced" } : i));
                                  setDongBoStatus('❌ Lỗi mạng, không thể xóa Mã Tai.');
                                }
                              });
                            }
                          }
                        ]);
                      }}
                      style={{ backgroundColor: '#dc3545', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={{ padding: 30, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, color: '#888888', fontStyle: 'italic', textAlign: 'center' }}>
                  {nhomNaiTab2 === 'Phoi' ? "🤰 Không có Nái nào đang mang thai" : (nhomNaiTab2 === 'CHUA_PHOI' ? "💢 Không có Nái nào chưa phối" : (nhomNaiTab2 === 'NUOI_CON' ? "🍼 Không có Nái nào đang nuôi con" : "❌ Không có Nái nào đã thải"))}
                </Text>
              </View>
            }
          />
        </View>
      )}



      {/* ======================================================== */}
          {/* ======================================================== */}
      {/* 📊 TAB 3: THỐNG KÊ NÁI & CÁM                              */}
      {/* ======================================================== */}
     {currentTab === 'thong_ke' && (
          <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 15, paddingBottom: 100 }}>
          {dataThongKe && dataThongKe[0] ? (
            <View>
              
            
              {/* KHỐI 2: TỔNG QUAN CƠ SỞ ĐÀN NÁI HIỆN TẠI */}
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100', marginBottom: 8, letterSpacing: 0.5 }}>📈 TỔNG QUAN CƠ SỞ ĐÀN NÁI</Text>
              <View style={{ backgroundColor: '#fffaf5', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#ffd3b6' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1.2, borderBottomColor: '#ffd3b6', marginBottom: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111111' }}>Tổng Số Heo Nái</Text>
                  <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 17 }}>{dataThongKe[0].tongHeoNai} con</Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ffe5d4' }}>
                  <Text style={{ fontSize: 13, color: '#555555' }}>Số Heo Đang Đẻ</Text>
                  <Text style={{ fontSize: 14, color: '#111111', fontWeight: 'bold' }}>{dataThongKe[0].dangDe} con</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ffe5d4' }}>
                  <Text style={{ fontSize: 13, color: '#555555' }}>Số Con Mang Bầu</Text>
                  <Text style={{ fontSize: 14, color: '#28a745', fontWeight: 'bold' }}>{dataThongKe[0].daPhoi} con</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ffe5d4' }}>
                  <Text style={{ fontSize: 13, color: '#555555' }}>Số Con Chưa Phối</Text>
                  <Text style={{ fontSize: 14, color: '#6c757d', fontWeight: 'bold' }}>{dataThongKe[0].chuaPhoi} con</Text>
                </View>

                {/* Khối thụt lề phân cấp chi tiết cho nhóm Chưa Phối */}
                <View style={{ paddingLeft: 12, marginTop: 4, borderLeftWidth: 2, borderLeftColor: '#fbc48c' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12.5, color: '#666666' }}>Chờ Phối</Text>
                    <Text style={{ fontSize: 13, color: '#111111', fontWeight: '600' }}>{dataThongKe[0].choPhoi} con</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12.5, color: '#666666' }}>Cai Sữa (Chờ lên giống)</Text>
                    <Text style={{ fontSize: 13, color: '#111111', fontWeight: '600' }}>{dataThongKe[0].caiSua} con</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12.5, color: '#dc3545' }}>Lốc (Phối hỏng)</Text>
                    <Text style={{ fontSize: 13, color: '#dc3545', fontWeight: 'bold' }}>{dataThongKe[0].loc} con</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12.5, color: '#dc3545' }}>Sảy Thai</Text>
                    <Text style={{ fontSize: 13, color: '#dc3545', fontWeight: 'bold' }}>{dataThongKe[0].sayThai} con</Text>
                  </View>
                </View>
              </View>


              {/* KHỐI 3: TIÊU CHUẨN TỈ LỆ NĂNG SUẤT NĂM HIỆN TẠI */}
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#28a745', marginBottom: 8, letterSpacing: 0.5 }}>📊 CHỈ SỐ NĂNG SUẤT (NĂM HIỆN TẠI)</Text>
              <View style={{ backgroundColor: '#f4fbf7', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#c3e6cb' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#d4edda' }}>
                  <Text style={{ fontSize: 13, color: '#444444', fontWeight: '500' }}>Tỉ Lệ Đẻ Thành Công</Text>
                  <Text style={{ fontSize: 15, color: '#28a745', fontWeight: 'bold' }}>{dataThongKe[0].tiLeDe}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                  <Text style={{ fontSize: 13, color: '#444444', fontWeight: '500' }}>Tỉ Lệ Cai Sữa Đạt</Text>
                  <Text style={{ fontSize: 15, color: '#007bff', fontWeight: 'bold' }}>{dataThongKe[0].tiLeCaiSua}</Text>
                </View>
              </View>

                          {/* ======================================================== */}
        {/* 📊 KHỐI THỐNG KÊ LƯỚI 3 Ô 1 HÀNG - PHẦN 1: BẢN VÁ TỐI GIẢN CHUẨN ĐÉT SỐ CON */}
        {/* ======================================================== */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eef2f5', marginTop: 12, marginBottom: 15 }}>
          
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#1a1f23', letterSpacing: 0.2 }}>
              📊 THỐNG KÊ NÁI BẦU
            </Text>
            <Text style={{ fontSize: 11.5, color: '#8a929a', marginTop: 2 }}>
              Chạm ô tuần tuổi để xem danh sách Mã Tai chi tiết.
            </Text>
          </View>

          {/* CẤU TRÚC LƯỚI 3 Ô 1 HÀNG PHẲNG MỊN SANG TRỌNG */}
          <View style={{ gap: 5, marginBottom: 5 }}>
            {(() => {
              const mangKhóaTuanBau = [
                "t1", "t2", "t3", "t4", "t5", "t6",
                "t7", "t8", "t9", "t10", "t11", "t12",
                "t13", "t14", "t15", "t16", "t17", "t18"
              ];

              // 🎯 KHƠI THÔNG MẠCH SỐ CON: Dò tìm bóc đúng tầng đối tượng [0] bọc thai của mảng dataThongKe
              let thongKeGoc = null;
              if (Array.isArray(dataThongKe) && dataThongKe.length > 0) {
                thongKeGoc = dataThongKe[0]; // Bốc phần tử số 0 chứa lõi dữ liệu
              } else if (dataThongKe) {
                thongKeGoc = dataThongKe;
              }

              const danhSachHangBaO = [];
              for (let i = 0; i < mangKhóaTuanBau.length; i += 3) {
                danhSachHangBaO.push(mangKhóaTuanBau.slice(i, i + 3));
              }

              return danhSachHangBaO.map((hangData, hangIdx) => {
                const laHangCanThietBiDongDe = hangData.includes("t16") || hangData.includes("t18");

                return (
                  <View key={`clean_hang_ba_o_${hangIdx}`} style={{ width: '100%' }}>
                    
                    

                    <View style={{ flexDirection: 'row', gap: 5, marginBottom: 5 }}>
                      {hangData.map((tuanKey, colIdx) => {
                        
                        // 🎯 ĐÃ VÁ ĐỒNG BỘ: Kéo chuẩn quân số từ thongKeGoc đã tháo màng bọc [0]
                        let soConHienTai = "0";
                        if (thongKeGoc && thongKeGoc[tuanKey] !== undefined && thongKeGoc[tuanKey] !== null) {
                          soConHienTai = thongKeGoc[tuanKey].toString();
                        }

                        const soTuanSo = tuanKey.replace('t', '');
                        const laOThuocCheck = tuanBauDangMoTab3 === tuanKey;
                        const coHeo = Number(soConHienTai) > 0;

                        // 🎯 PHONG CÁCH TỐI GIẢN: Tất cả đồng bộ nền trắng sứ cực thoáng mắt
                        let mauVienLuoi = laOThuocCheck ? '#1a1f23' : '#e9ecef';
                        let mauNenLuoi = laOThuocCheck ? '#f1f3f5' : '#ffffff';
                        let mauChuTuan = '#495057';
                        let mauChuCon = coHeo ? '#1a1f23' : '#adb5bd';
                        let iconNhacNho = "";

                        // GÀI VIỀN MỎNG TINH TẾ CHO TUẦN 4, 7, 10 CHỐNG RỐI MẮT
                        if (!laOThuocCheck) {
                          if (tuanKey === "t4" || tuanKey === "t7" || tuanKey === "t10") {
                            mauVienLuoi = '#20c997'; // Chỉ gài duy nhất một màu chỉ viền xanh Mint dịu mắt
                          }
                        }

                        // KHỐI CẢNH BÁO CAO CẤP TUẦN 16-17-18
                        if (tuanKey === "t18") {
                          mauVienLuoi = laOThuocCheck ? '#dc3545' : '#f5c6cb';
                          mauNenLuoi = laOThuocCheck ? '#fff5f5' : '#ffffff';
                          mauChuTuan = '#dc3545';
                          mauChuCon = '#dc3545';
                          iconNhacNho = "🚨 "; 
                        } else if (tuanKey === "t16" || tuanKey === "t17") {
                          mauVienLuoi = laOThuocCheck ? '#fd7e14' : '#ffe0b2';
                          mauNenLuoi = laOThuocCheck ? '#fffbf7' : '#ffffff';
                          mauChuTuan = '#fd7e14';
                          mauChuCon = '#fd7e14';
                          iconNhacNho = "🚨 "; 
                        }

                        return (
                          <TouchableOpacity
                            key={`grid3_clean_cell_${hangIdx}_${colIdx}`}
                            activeOpacity={0.7}
                            onPress={() => setTuanBauDangMoTab3(laOThuocCheck ? null : tuanKey)}
                            style={{
                              flex: 1, 
                              height: 48, 
                              borderRadius: 7,
                              borderWidth: laOThuocCheck ? 1.8 : 0.8,
                              borderColor: mauVienLuoi,
                              backgroundColor: mauNenLuoi,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 11.5, fontWeight: '800', color: mauChuTuan }}>
                              {iconNhacNho}Tuần {soTuanSo}
                            </Text>
                            <Text style={{ fontSize: 12.5, fontWeight: '700', color: mauChuCon, marginTop: 2 }}>
                              {soConHienTai} Con
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              });
            })()}
          </View>
          {/* ======================================================== */}
          {/* TAB 3 - PHẦN 2: DANH SÁCH MÃ TAI CHI TIẾT ĐỨNG IM DƯỚI CHÂN BẢNG LƯỚI */}
          {/* ======================================================== */}
          {tuanBauDangMoTab3 && (
            <View style={{ backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8, padding: 10, marginTop: 6 }}>
              
              {(() => {
                const soTuanHienTai = tuanBauDangMoTab3.replace('t', '');
                
                // Lọc trích xuất danh sách mã tai nái mang bầu lứa tuần này từ RAM danh bạ toàn cục
                const danhSachMaTaiBauTuanNay = (danhSachMaTai || []).filter(nai => {
                  if (!nai || !nai.tuanBauCotM) return false;
                  const soTuanNaiBau = nai.tuanBauCotM.toString().replace('t', '').trim();
                  return soTuanNaiBau === soTuanHienTai;
                });

                return (
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 5, borderBottomWidth: 0.5, borderBottomColor: '#e9ecef' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#1a1f23' }}>
                        📋 DANH SÁCH HEO TUẦN {soTuanHienTai}:
                      </Text>
                      <TouchableOpacity onPress={() => setTuanBauDangMoTab3(null)} style={{ backgroundColor: '#6c757d', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>Đóng x</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                      {danhSachMaTaiBauTuanNay.length === 0 ? (
                        <Text style={{ fontSize: 11, color: '#868e96', fontStyle: 'italic', paddingVertical: 4 }}>
                          Chưa có Mã Tai heo nái nào được gán ở Tuần Bầu này trên hệ thống danh bạ.
                        </Text>
                      ) : (
                        danhSachMaTaiBauTuanNay.map((naiBau, nIdx) => (
                          <View 
                            key={`grid3_clean_tag_${nIdx}`}
                            style={{ 
                              backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e9ecef', 
                              paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5,
                              minWidth: '31.5%', alignItems: 'center', justifyContent: 'center'
                            }}
                          >
                            <Text style={{ color: '#212529', fontWeight: 'bold', fontSize: 12 }}>
                              {naiBau.maTai || "---"}
                            </Text>
                            <Text style={{ color: '#6c757d', fontSize: 9.5, fontWeight: '700', marginTop: 1 }}>
                              Lứa: {naiBau.lua || "0"}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                );
              })()}

            </View>
          )}

        </View>


 {/* KHỐI 1: DỰ KIẾN TIÊU THỤ CÁM THÁNG NÀY */}
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0056b3', marginBottom: 8, letterSpacing: 0.5 }}>🌾 DỰ KIẾN TIÊU THỤ CÁM THÁNG NÀY</Text>
              <View style={{ backgroundColor: '#f8f9fa', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#e9ecef' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
                  <Text style={{ fontSize: 13, color: '#495057', fontWeight: '500' }}>Dự kiến cám Heo Thịt</Text>
                  <Text style={{ fontSize: 14, color: '#111111', fontWeight: 'bold' }}>{dataThongKe[0].heoThit} Kg</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
                  <Text style={{ fontSize: 13, color: '#495057', fontWeight: '500' }}>Dự kiến cám Heo Nái</Text>
                  <Text style={{ fontSize: 14, color: '#111111', fontWeight: 'bold' }}>{dataThongKe[0].heoNaiCam} Kg</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, marginTop: 4, backgroundColor: '#e7f1ff', paddingHorizontal: 8, borderRadius: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0056b3' }}>Tổng Dự Kiến Cám</Text>
                  <Text style={{ color: '#0056b3', fontSize: 16, fontWeight: 'bold' }}>{dataThongKe[0].duKienCam} Kg</Text>
                </View>
              </View>
            </View>

            
          ) : (
            <Text style={styles.emptyText}>Trại hiện tại chưa có dữ liệu báo cáo Thống Kê tổng hợp trên Server.</Text>
          )}
        </ScrollView>
      )}
{/* 🐷 TAB 4: HIỂN THỊ DANH SÁCH HEO ĐANG ĐẺ                  */}
      {/* ======================================================== */}
      {currentTab === 'heo_de' && (
        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
          <View style={{ paddingHorizontal: 15, marginTop: 10, marginBottom: 5 }}>
            <TextInput
              style={[styles.inputStandard, { marginBottom: 0, borderRadius: 20, paddingHorizontal: 15, height: 44, backgroundColor: '#f0f0f0', borderWidth: 0, color: '#111111' }]}
              placeholder="🔍 Tìm Heo Đang Đẻ"
              placeholderTextColor="#888888"
              value={searchTxtTab4}
              onChangeText={setSearchTxtTab4}
              autoCapitalize="characters"
            />
          </View>
         <FlatList
  data={(() => {
           const danhSachGoc = Array.isArray(global.danhSachCapNhatTrangThai) ? global.danhSachCapNhatTrangThai : [];
    const ngayHomNay = formatVNDate(new Date()); 

    // ✅ BẢN VÁ TỐI CAO: ĐỒNG BỘ 100% THEO RAM TRẠNG THÁI CỦA TAB 2 - SẠCH SẼ LỖI KẸT DÒNG
    const mangNuoiConThucTe = danhSachGoc.length > 0 
      ? danhSachGoc.filter(heo => {
          const maTaiInHoa = heo.maTai ? heo.maTai.toString().toUpperCase().trim() : "";
          
          // 1. Kiểm tra trạng thái thực tế cao nhất đã được RAM đỉnh App xử lý giống hệt Tab 2
          const trangThaiHienTaiCuaApp = heo.trangThaiDienThoai || "";

          // 2. Tra cứu riêng dòng nhật ký để xem tình trạng mạng của ca Cai Sữa lứa này
          const skCaiSuaMoiNhat = Array.isArray(danhSachLichSu)
            ? danhSachLichSu.find(i => i && i.maTai && i.maTai.toString().toUpperCase().trim() === maTaiInHoa && i.suKien === "Cai Sữa" && i.actionType !== "delete")
            : null;
          const trangThaiMang = skCaiSuaMoiNhat ? skCaiSuaMoiNhat.syncStatus : "";

          // TRƯỜNG HỢP A: Người nuôi vừa gõ Xác nhận Cai Sữa xong, trạng thái RAM nhảy sang "Cai Sữa" nhưng mác mạng đang là "waiting" -> GIỮ LẠI ĐỂ HIỆN NHÃN XANH
          if (trangThaiHienTaiCuaApp === "Cai Sữa" && trangThaiMang === "waiting") {
            return true;
          }

          // TRƯỜNG HỢP B: Khi bạn bấm nút "Cập nhật thống kê" (hoặc mạng lưu ngầm thành công), mác waiting biến mất -> ĐUỔI BAY MÀU KHỎI TAB 4 LẬP TỨC
          if (trangThaiHienTaiCuaApp === "Cai Sữa" || trangThaiHienTaiCuaApp === "Thải") {
            return false;
          }

          // Kiểm tra thêm từ trạng thái gốc của Sheet đổ về để bọc phòng hờ
          const trangThaiGocTuSheet = heo.trangThaiCotH ? heo.trangThaiCotH.toString().trim().normalize("NFC") : "";
          if (trangThaiGocTuSheet === "Cai Sữa" || trangThaiGocTuSheet === "Thải") {
            return false;
          }

          // Mặc định nái đang Đẻ nuôi con lứa mới thì giữ lại hiển thị bình thường
          return trangThaiHienTaiCuaApp === "Đẻ" || trangThaiGocTuSheet === "Đẻ";
        })
      : (Array.isArray(danhSachMaTai) ? danhSachMaTai.filter(h => h && h.trangThaiCotH === "Đẻ") : []);


    const mangDangDeChoList = mangNuoiConThucTe.map((nai, index) => {
      const maTaiInHoa = nai.maTai ? nai.maTai.toString().toUpperCase().trim() : "";
      
      const mangLichSuDe = Array.isArray(danhSachLichSu)
        ? danhSachLichSu.filter(i => i && i.maTai && i.maTai.toString().toUpperCase().trim() === maTaiInHoa && i.suKien === "Đẻ" && i.actionType !== "delete")
        : [];

      mangLichSuDe.sort((a, b) => {
        const timeA = parseToDateObject(a.ngay) ? parseToDateObject(a.ngay).getTime() : 0;
        const timeB = parseToDateObject(b.ngay) ? parseToDateObject(b.ngay).getTime() : 0;
        return timeB - timeA;
      });

      const skDeGanNhat = mangLichSuDe.length > 0 ? mangLichSuDe[0] : null;

      return {
        id: "RAM_DE_" + (nai.id || index),
        maTai: nai.maTai,
        giong: nai.giong || "---",
        luaDe: nai.lua || "---",
        trangThaiHienTai: nai.trangThaiDienThoai,
        ngayDe: nai.ngayDeDongThoiGianThuc || (skDeGanNhat ? skDeGanNhat.ngay : "---"),
        soHeoCon: skDeGanNhat ? String(skDeGanNhat.soHeo) : (nai.soHeoCon || "0"),
        khoThai: skDeGanNhat ? String(skDeGanNhat.khoThai) : (nai.khoThai || "0"),
        coiCoc: skDeGanNhat ? String(skDeGanNhat.coiCoc) : (nai.coiCoc || "0"),
        chetNgop: skDeGanNhat ? String(skDeGanNhat.chetNgop) : (nai.chetNgop || "0"),
        chonNuoi: skDeGanNhat ? String(skDeGanNhat.chonNuoi) : (nai.chonNuoi || "0"),
        ghiChuDe: skDeGanNhat ? skDeGanNhat.ghiChu : (nai.ghiChuDe || "")
      };
    });

    return mangDangDeChoList.filter(i => {
      if (!searchTxtTab4) return true;
      if (!i || !i.maTai) return false;
      return i.maTai.toLowerCase().includes(searchTxtTab4.toLowerCase());
    });
  })()}
  keyExtractor={(item) => item.id}
  contentContainerStyle={{ paddingBottom: 110 }}
  showsVerticalScrollIndicator={false}
  renderItem={({ item }) => {
              return (
                /* 🟢 THIẾT KẾ THẺ ĐỔ BÓNG PHẲNG CAO CẤP: Phân ô chuồng rạch ròi, chống lóa mắt */
                <View style={{ 
                  backgroundColor: '#ffffff', 
                  marginHorizontal: 15, 
                  marginTop: 10, 
                  borderRadius: 10, 
                  padding: 14,
                  borderWidth: 1, 
                  borderColor: '#eef2f5',
                  shadowColor: "#000000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 3
                }}>
                  <View style={{ flex: 1 }}>
                    
                    {/* Hàng 1: Mã số nái được đóng khung phẳng tinh tế */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ fontSize: 13, color: '#6c757d', fontWeight: '500' }}>Mã số nái</Text>
                      <View style={{ backgroundColor: '#e7f1ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: '#b8daff' }}>
                        <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 13 }}>{item.maTai || "---"}</Text>
                      </View>
                    </View>

                    {/* Hàng 2: Giống và Lứa Đẻ */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#f1f2f6' }}>
                      <Text style={{ fontSize: 13, color: '#555555' }}>Giống / Lứa đẻ</Text>
                      <Text style={{ fontSize: 13, color: '#111111', fontWeight: '500' }}>
                        {item.giong || "---"} | lứa <Text style={{ fontWeight: 'bold', color: '#e83e8c' }}>{item.luaDe || "---"}</Text>
                      </Text>
                    </View>

                    {/* Hàng 3: Ngày thực tế đẻ */}
                    {item.ngayDe && item.ngayDe !== "---" ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#f1f2f6' }}>
                        <Text style={{ fontSize: 13, color: '#555555' }}>Ngày thực tế đẻ</Text>
                        <Text style={{ fontSize: 13, color: '#111111', fontWeight: '600' }}>
                          {(() => {
                            const str = item.ngayDe.toString().trim();
                            if (str.includes('/') && str.split('/').length === 3) return str.substring(0, 10);
                            const d = new Date(str);
                            if (isNaN(d.getTime())) return str.substring(0, 10);
                            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                          })()}
                        </Text>
                      </View>
                    ) : null}

                    {/* Hàng 4: Số ngày đã đẻ & Số tuần tuổi heo con */}
                    {item.ngayDe && item.ngayDe !== "---" ? (
                      <View style={{ backgroundColor: '#f8f9fa', borderRadius: 6, padding: 8, marginTop: 5, marginBottom: 5, borderWidth: 0.5, borderColor: '#dee2e6' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ fontSize: 12.5, color: '#495057', fontWeight: '500' }}>Số ngày đã đẻ:</Text>
                          <Text style={{ fontSize: 13, color: '#111111', fontWeight: 'bold' }}>
                            {(() => {
                              const dDe = parseToDateObject(item.ngayDe);
                              if (!dDe) return "---";
                              const dNay = new Date(); 
                              dNay.setHours(0, 0, 0, 0);
                              const khoangCachNgay = Math.floor((dNay.getTime() - dDe.getTime()) / (1000 * 60 * 60 * 24));
                              
                              if (khoangCachNgay === 0) return "Hôm nay";
                              return khoangCachNgay > 0 ? `${khoangCachNgay} ngày` : "---";
                            })()}
                          </Text>
                        </View>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12.5, color: '#495057', fontWeight: '500' }}>Tuổi heo con ngoài ô:</Text>
                          <Text style={{ fontSize: 13, color: '#111111', fontWeight: 'bold' }}>
                            {(() => {
                              const dDe = parseToDateObject(item.ngayDe);
                              if (!dDe) return "---";
                              const dNay = new Date(); 
                              dNay.setHours(0, 0, 0, 0);
                              const khoangCachNgay = Math.floor((dNay.getTime() - dDe.getTime()) / (1000 * 60 * 60 * 24));
                              const soTuan = Math.floor(khoangCachNgay / 7);
                              
                              if (khoangCachNgay === 0) return "Sơ sinh mới đẻ";
                              return soTuan > 0 ? `${soTuan} tuần tuổi` : "Dưới 1 tuần tuổi";
                            })()}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                    {/* Hàng 5: Tổng số con đẻ ra */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#f1f2f6' }}>
                      <Text style={{ fontSize: 13, color: '#555555' }}>Tổng số con đẻ ra</Text>
                      <Text style={{ fontSize: 13, color: '#111111', fontWeight: 'bold' }}>{item.soHeoCon || "0"} con</Text>
                    </View>

                    {/* Hàng 6: Khối hiển thị chi tiết số con Khô, Còi, Ngộp, Chọn Nuôi phẳng sạch sẽ */}
                    <View style={{ backgroundColor: '#f8f9fa', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, marginTop: 4, borderWidth: 0.5, borderColor: '#dee2e6' }}>
                      <Text style={{ fontSize: 12, color: '#666666', lineHeight: 18 }}>
                        Khô thai: <Text style={{fontWeight:'600', color:'#111111'}}>{item.khoThai || 0}</Text> | Còi cọc: <Text style={{fontWeight:'600', color:'#111111'}}>{item.coiCoc || 0}</Text> | Chết ngộp: <Text style={{fontWeight:'600', color:'#111111'}}>{item.chetNgop || 0}</Text>
                      </Text>
                      <Text style={{ fontSize: 12, color: '#111111', fontWeight: 'bold', marginTop: 4, borderTopWidth: 0.5, borderTopColor: '#e9ecef', paddingTop: 4 }}>
                        Chọn Nuôi Thực Tế: <Text style={{color:'#28a745'}}>{item.chonNuoi || 0} con</Text>
                      </Text>
                    </View>

                    {/* Hàng 7: Khối hiển thị Ghi chú đẻ */}
                    {item.ghiChuDe && item.ghiChuDe.toString().trim() !== "" && item.ghiChuDe.toString().trim() !== "---" ? (
                      <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#f1f2f6' }}>
                        <Text style={{ fontSize: 12, color: '#6c757d', fontStyle: 'italic', lineHeight: 16 }}>
                          Ghi chú: <Text style={{ color: '#e65100', fontWeight: '500', fontStyle: 'normal' }}>{item.ghiChuDe}</Text>
                        </Text>
                      </View>
                    ) : null}

                    {/* ======================================================== */}
                    {/* 🟢 BẢN VÁ TỐI CAO: ƯU TIÊN KIỂM TRA ĐỒNG BỘ THEO NHẬT KÝ RAM TỨC THÌ */}
                    {/* ======================================================== */}
                                        {/* ======================================================== */}
                    {/* 🟢 BẢN VÁ TỐI CAO: SO SÁNH THEO HÀNH ĐỘNG CÓ NGÀY MỚI NHẤT TRÊN RAM */}
                    {/* ======================================================== */}
                {(() => {
                      const maTaiChuan = item.maTai ? item.maTai.toString().toUpperCase().trim() : "";

                      const lichSuNaiHienTai = Array.isArray(danhSachLichSu)
                        ? danhSachLichSu.filter(i => i && i.maTai && i.maTai.toString().toUpperCase().trim() === maTaiChuan && (i.suKien === "Cai Sữa" || i.suKien === "Đẻ") && i.actionType !== "delete")
                        : [];

                      lichSuNaiHienTai.sort((a, b) => {
                        const timeA = parseToDateObject(a.ngay) ? parseToDateObject(a.ngay).getTime() : 0;
                        const timeB = parseToDateObject(b.ngay) ? parseToDateObject(b.ngay).getTime() : 0;
                        if (timeB !== timeA) return timeB - timeA;
                        return (b.id ? b.id.toString() : "").localeCompare(a.id ? a.id.toString() : "");
                      });

                      // Lấy phần tử Index 0 mới nhất thực tế của lứa
                      const dongMoiNhatTrenRam = lichSuNaiHienTai.length > 0 ? lichSuNaiHienTai[0] : null;
                      const hanhDongMoiNhat = dongMoiNhatTrenRam ? dongMoiNhatTrenRam.suKien.toString().trim().normalize("NFC") : "";
                      const trangThaiMangMoiNhat = dongMoiNhatTrenRam ? dongMoiNhatTrenRam.syncStatus : "";

                      // Nếu ngày mới gõ là Cai Sữa và mạng đang chờ đồng bộ ngầm
                      if (hanhDongMoiNhat === "Cai Sữa" && trangThaiMangMoiNhat === "waiting") {
                        return (
                          <View 
                            style={{ 
                              backgroundColor: '#d4edda', 
                              paddingVertical: 10, 
                              borderRadius: 8, 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              marginTop: 12,
                              borderWidth: 1,
                              borderColor: '#c3e6cb'
                            }}
                          >
                            <Text style={{ color: '#155724', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 }}>
                              ✅ Đang Lưu
                            </Text>
                          </View>
                        );
                      }

                      return (
                        <TouchableOpacity 
                          activeOpacity={0.6}
                          onPress={() => handleMoModalCaiSuaNhanh(item)}
                          style={{ 
                            backgroundColor: '#e65100', 
                            paddingVertical: 10, 
                            borderRadius: 8, 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            marginTop: 12,
                            shadowColor: '#e65100',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 3,
                            elevation: 2
                          }}
                        >
                          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 }}>
                            Cai Sữa Nhanh
                          </Text>
                        </TouchableOpacity>
                      );
                    })()}
                    {/* ======================================================== */}

                    {/* ======================================================== */}

                  </View>
                </View>
              );
            }}
          />

        </View>
      )}

    
    {/* TAB 5: HEO THỊT - PHẦN 1: BỘ 3 NÚT BẤM VÀ KHỐI GIAI ĐOẠN ĐẦU */}
{currentTab === 'heo_thit' && (
  <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 12, paddingBottom: 120 }}>
    
    {/* 📊 KHỐI THIẾT KẾ BỘ 3 NÚT BIẾN ĐỘNG THEO LÔ TUẦN TUỔI */}
    <View style={{ marginBottom: 12, backgroundColor: '#fafbfc', borderWidth: 1, borderColor: '#eef2f5', padding: 10, borderRadius: 12 }}>
      <Text style={{ fontSize: 11.5, color: '#555555', fontWeight: 'bold', marginBottom: 8, letterSpacing: 0.3 }}>
        Nhập chính xác ngày thực hiện, Hệ thống sẽ tự động tính theo thời gian.
      </Text>
      
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <TouchableOpacity activeOpacity={0.6} onPress={() => handleMoModalHeoThit('Nhập Đàn')} style={{ flex: 1, backgroundColor: '#007bff', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12.5 }}>Nhập Đàn</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.6} onPress={() => handleMoModalHeoThit('Hao Hụt')} style={{ flex: 1, backgroundColor: '#dc3545', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12.5 }}>Hao Hụt</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.6} onPress={() => handleMoModalHeoThit('Bán')} style={{ flex: 1, backgroundColor: '#28a745', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12.5 }}>Bán Heo</Text>
        </TouchableOpacity>
      </View>
    </View>

    {/* Bảng số liệu gốc từ Server Google Sheet của bạn */}
    {dataHeoThit ? (
      <View>
        
        {/* Tổng số heo thịt gốc */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212529' }}>Tổng Số Heo Thịt:</Text>
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#137333' }}> {dataHeoThit.tongHeoThit || "0"} con </Text>
        </View>
        
        {/* Hộp Thống Kê Lớn Chia Khúc Giai Đoạn */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#dee2e6', overflow: 'hidden', padding: 10, gap: 10 }}>
          
                   {/* ======================================================== */}
          {/* 📊 GIAI ĐOẠN 1 & 2: KHÔI PHỤC THIẾT KẾ PHẲNG GỐC CỦA BẠN - TỰ ĐỘNG CỘNG TỔNG REAL-TIME */}
          {/* ======================================================== */}
          
          {/* GIAI ĐOẠN 1: THEO MẸ */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fdfdfd', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
            <View>
              <Text style={{ fontWeight: 'bold', color: '#111111', fontSize: 14 }}>1. Giai đoạn Theo Mẹ</Text>
              <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>Từ sơ sinh đến cai sữa</Text>
            </View>
            
            {/* 🎯 VÁ NGHIỆP VỤ: Tự động tính tổng thô Phase 1 trực tiếp từ RAM nội bộ giữ nguyên phông chữ gốc */}
            {(() => {
              const laySo = (v) => (!v || isNaN(v)) ? 0 : Number(v);
              const tongGd1 = laySo(dataHeoThit.theoMe) || laySo(dataHeoThit["Theo Mẹ"]);
              return (
                <Text style={{ color: '#212529', fontSize: 15, fontWeight: 'bold' }}>{tongGd1} con</Text>
              );
            })()}
          </View>

          {/* GIAI ĐOẠN 2: CAI SỮA */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fdfdfd', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
            <View>
              <Text style={{ fontWeight: 'bold', color: '#111111', fontSize: 14 }}>2. Giai đoạn Cai Sữa</Text>
              <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>Tuần tuổi: 4 tuần</Text>
            </View>
            
            {/* 🎯 VÁ NGHIỆP VỤ: Tự động tính tổng thô Phase 2 trực tiếp từ RAM nội bộ giữ nguyên phông chữ gốc */}
            {(() => {
              const laySo = (v) => (!v || isNaN(v)) ? 0 : Number(v);
              const tongGd2 = laySo(dataHeoThit["4 Tuần ( Cai Sữa )"]) || laySo(dataHeoThit.caiSua) || laySo(dataHeoThit["Cai Sữa"]);
              return (
                <Text style={{ color: '#212529', fontSize: 15, fontWeight: 'bold' }}>{tongGd2} con</Text>
              );
            })()}
          </View>


                   {/* ======================================================== */}
          {/* 📊 GIAI ĐOẠN 3: BẢO TOÀN THIẾT KẾ PHẲNG GỐC VÀ TỰ ĐỘNG CỘNG TỔNG REAL-TIME */}
          {/* ======================================================== */}
          <View style={{ backgroundColor: '#fffdf9', borderRadius: 8, borderWidth: 1, borderColor: '#ffe0b2', padding: 10, gap: openGiaiDoan.gd3 ? 8 : 0 }}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => setOpenGiaiDoan(prev => ({ ...prev, gd3: !prev.gd3 }))}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <View>
                <Text style={{ fontWeight: 'bold', color: '#e65100', fontSize: 14 }}>3. Giai đoạn 10 - 30kg {openGiaiDoan.gd3 ? '▲' : '▼'}</Text>
                <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>Tuần tuổi: 5 - 9 (Bấm xem chi tiết)</Text>
              </View>

              {/* 🎯 VÁ NGHIỆP VỤ CAO CẤP: Tự động cộng tổng lứa tuần 5-9 từ bộ nhớ RAM nội bộ, giữ nguyên thiết kế chữ màu xanh đậm */}
              {(() => {
                const laySo = (v) => (!v || isNaN(v)) ? 0 : Number(v);
                const tongGd3RealTime = laySo(dataHeoThit["5 Tuần"]) + laySo(dataHeoThit["6 Tuần"]) + laySo(dataHeoThit["7 Tuần"]) + laySo(dataHeoThit["8 Tuần"]) + laySo(dataHeoThit["9 Tuần"]);
                return (
                  <Text style={{ color: '#007bff', fontSize: 15, fontWeight: 'bold' }}>{tongGd3RealTime} con</Text>
                );
              })()}
            </TouchableOpacity>

            {/* LƯỚI Ô VUÔNG CHỮ TO RÕ CỦA GIAI ĐOẠN 3 */}
            {openGiaiDoan.gd3 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                {["5 Tuần", "6 Tuần", "7 Tuần", "8 Tuần", "9 Tuần"].map((keyTuan, idx) => {
                  const soC = dataHeoThit[keyTuan] || "0";
                  const soTuanSo = keyTuan.replace(' Tuần', '');
                  return (
                    <View key={`gd3_grid_${idx}`} style={{ width: '23.8%', height: 42, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ffe0b2', borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#212529' }}>Tuần {soTuanSo}</Text>
                      <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: Number(soC) > 0 ? '#137333' : '#a0a0a0', marginTop: 1 }}>{soC} Con</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* GIAI ĐOẠN 4: ĐÀN 30-60KG - SẬP XÒE LƯỚI Ô BẤM CHỮ LỚN */}
          <View style={{ backgroundColor: '#fffdf9', borderRadius: 8, borderWidth: 1, borderColor: '#ffe0b2', padding: 10, gap: openGiaiDoan.gd4 ? 8 : 0 }}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => setOpenGiaiDoan(prev => ({ ...prev, gd4: !prev.gd4 }))}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#e65100', fontSize: 14 }}>4. Giai đoạn 30 - 60kg {openGiaiDoan.gd4 ? '▲' : '▼'}</Text>
                <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>Tuần tuổi: 10 - 15 (Bấm xem chi tiết)</Text>
              </View>
              <Text style={{ color: '#007bff', fontSize: 15, fontWeight: 'bold' }}>{dataHeoThit.giaiDoan4 || "0"} con</Text>
            </TouchableOpacity>

            {/* LƯỚI Ô VUÔNG CHỮ TO RÕ CỦA GIAI ĐOẠN 4 (Gồm 6 ô xếp gọn) */}
            {openGiaiDoan.gd4 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                {["10 Tuần", "11 Tuần", "12 Tuần", "13 Tuần", "14 Tuần", "15 Tuần"].map((keyTuan, idx) => {
                  const soC = dataHeoThit[keyTuan] || "0";
                  const soTuanSo = keyTuan.replace(' Tuần', '');
                  return (
                    <View key={`gd4_grid_${idx}`} style={{ width: '23.8%', height: 42, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ffe0b2', borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#212529' }}>Tuần {soTuanSo}</Text>
                      <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: Number(soC) > 0 ? '#137333' : '#a0a0a0', marginTop: 1 }}>{soC} Con</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* GIAI ĐOẠN 5: ĐÀN 60-100KG - SẬP XÒE LƯỚI Ô BẤM CHỮ LỚN */}
          <View style={{ backgroundColor: '#fffdf9', borderRadius: 8, borderWidth: 1, borderColor: '#ffe0b2', padding: 10, gap: openGiaiDoan.gd5 ? 8 : 0 }}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => setOpenGiaiDoan(prev => ({ ...prev, gd5: !prev.gd5 }))}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#e65100', fontSize: 14 }}>5. Giai đoạn 60 - 100kg {openGiaiDoan.gd5 ? '▲' : '▼'}</Text>
                <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>Tuần tuổi: 16 - 20 (Bấm xem chi tiết)</Text>
              </View>
              <Text style={{ color: '#007bff', fontSize: 15, fontWeight: 'bold' }}>{dataHeoThit.giaiDoan5 || "0"} con</Text>
            </TouchableOpacity>

            {/* LƯỚI Ô VUÔNG CHỮ TO RÕ CỦA GIAI ĐOẠN 5 */}
            {openGiaiDoan.gd5 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                {["16 Tuần", "17 Tuần", "18 Tuần", "19 Tuần", "20 Tuần"].map((keyTuan, idx) => {
                  const soC = dataHeoThit[keyTuan] || "0";
                  const soTuanSo = keyTuan.replace(' Tuần', '');
                  return (
                    <View key={`gd5_grid_${idx}`} style={{ width: '23.8%', height: 42, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ffe0b2', borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#212529' }}>Tuần {soTuanSo}</Text>
                      <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: Number(soC) > 0 ? '#137333' : '#a0a0a0', marginTop: 1 }}>{soC} Con</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

                    {/* GIAI ĐOẠN 6: TỪ 100KG ĐẾN XUẤT CHUỒNG - PHÂN TÁCH CHI TIẾT 5 LỚI TUẦN */}
          <View style={{ backgroundColor: '#fff5f5', borderRadius: 8, borderWidth: 1, borderColor: '#f5c6cb', padding: 10, gap: openGiaiDoan.gd6 ? 8 : 0 }}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => setOpenGiaiDoan(prev => ({ ...prev, gd6: !prev.gd6 }))}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#c82333', fontSize: 14 }}>6. Từ 100kg - Xuất Chuồng {openGiaiDoan.gd6 ? '▲' : '▼'}</Text>
                <Text style={{ fontSize: 12, color: '#c82333', marginTop: 2 }}>Tuần tuổi: 21 - 25 (Bấm xem chi tiết)</Text>
              </View>
              <Text style={{ color: '#c82333', fontSize: 16, fontWeight: 'bold' }}>{dataHeoThit.giaiDoan6 || "0"} con</Text>
            </TouchableOpacity>

            {/* LƯỚI Ô BẤM TUẦN CHỮ LỚN CỦA GIAI ĐOẠN 6 (Dàn hàng ngang 5 ô phẳng lỳ cực đẹp) */}
            {openGiaiDoan.gd6 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                {["21 Tuần", "22 Tuần", "23 Tuần", "24 Tuần", "25 Tuần"].map((keyTuan, idx) => {
                  const soC = dataHeoThit[keyTuan] || "0";
                  const soTuanSo = keyTuan.replace(' Tuần', '');
                  return (
                    <View key={`gd6_grid_${idx}`} style={{ width: '18.8%', height: 42, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f5c6cb', borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#212529' }}>Tuần {soTuanSo}</Text>
                      <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: Number(soC) > 0 ? '#c82333' : '#a0a0a0', marginTop: 1 }}>{soC} Con</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>


        </View>
        {/* ======================================================== */}
        {/* TAB 5 - PHẦN 3: BẢNG LỊCH SỬ BIẾN ĐỘNG HEO THỊT VÀ THẺ ĐÓNG KÍN KẾT CẤU */}
        {/* ======================================================== */}
               {/* ======================================================== */}
        {/* 📜 KHỐI LỊCH SỬ CHUỒNG HEO THỊT - BẢN SẮP XẾP MỚI NHẤT & UX SANG TRỌNG */}
        {/* ======================================================== */}
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e9ecef' }}>
          <Text style={{ fontSize: 13, color: '#1a1f23', fontWeight: '900', marginBottom: 10, letterSpacing: 0.3 }}>
            📜 NHẬT KÝ BIẾN ĐỘNG CHUỒNG HEO THỊT:
          </Text>

          {(() => {
            const mangNhatKyGoc = Array.isArray(danhSachLichSu) ? danhSachLichSu : [];
            
            // 1. Màng lọc bốc tách các ca biến động heo thịt thương phẩm
            const lichSuHeoThit = mangNhatKyGoc.filter(item => 
              item && item.actionType !== "delete" && 
              (item.suKien === "Nhập Đàn" || item.suKien === "Hao Hụt" || item.suKien === "Bán")
            );

            // 🎯 THUẬT TOÁN CHÍ MẠNG: SẮP XẾP NGÀY MỚI NHẤT LÊN ĐỈNH ĐẦU (SORT DESCENDING)
            // Tự động phân tách chuỗi để so sánh ngày tháng từ lớn đến nhỏ phẳng sạch
            lichSuHeoThit.sort((a, b) => {
              const layThoiGianCuan = (itemObj) => {
                if (!itemObj || !itemObj.ngay) return 0;
                const chuoiN = itemObj.ngay.toString().trim();
                if (chuoiN.includes('-')) { // Dạng yyyy-mm-dd
                  const p = chuoiN.substring(0, 10).split('-');
                  if (p.length === 3) return new Date(`${p[0]}-${p[1]}-${p[2]}`).getTime();
                } else if (chuoiN.includes('/')) { // Dạng dd/mm/yyyy
                  const p = chuoiN.substring(0, 10).split('/');
                  if (p.length === 3) return new Date(`${p[2]}-${p[1]}-${p[0]}`).getTime();
                }
                const d = new Date(chuoiN);
                return !isNaN(d.getTime()) ? d.getTime() : 0;
              };

              const timeA = layThoiGianCuan(a);
              const timeB = layThoiGianCuan(b);
              
              if (timeA !== timeB) return timeB - timeA; // Ngày mới xếp lên trên
              return (b.id || "").toString().localeCompare((a.id || "").toString()); // Nếu trùng ngày, ID mới hơn xếp trên
            });

            if (lichSuHeoThit.length === 0) {
              return (
                <View style={{ paddingVertical: 20, alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#eef2f5' }}>
                  <Text style={{ fontSize: 12, color: '#8a929a', fontStyle: 'italic' }}>Chưa có dòng nhật ký biến động heo thịt nào được lưu.</Text>
                </View>
              );
            }

            return lichSuHeoThit.map((item, idx) => {
              let mauChuChuong = '#007bff'; 
              let mauNenBadge = '#e7f1ff';
              if (item.suKien === "Hao Hụt") { mauChuChuong = '#dc3545'; mauNenBadge = '#f8d7da'; }
              if (item.suKien === "Bán") { mauChuChuong = '#28a745'; mauNenBadge = '#d4edda'; }

              // 🎯 🌟 ĐỒNG BỘ NGHIỆP VỤ: Dịch ngược số "3" thành chữ "Theo Mẹ", "4" thành "Cai Sữa" ra màn hình lịch sử
              let hienThiTuanNhatKy = item.tuanBan !== undefined ? String(item.tuanBan).trim() : "";
              if (hienThiTuanNhatKy === "3" || hienThiTuanNhatKy === "theoMe") {
                hienThiTuanNhatKy = "Theo Mẹ";
              } else if (hienThiTuanNhatKy === "4" || hienThiTuanNhatKy === "caiSua") {
                hienThiTuanNhatKy = "Cai Sữa";
              } else if (hienThiTuanNhatKy !== "") {
                hienThiTuanNhatKy = `Tuần ${hienThiTuanNhatKy}`;
              } else {
                hienThiTuanNhatKy = "Lô Tổng";
              }

              return (
                <View 
                  key={`ht_hist_flat_${item.id || idx}`} 
                  style={{ 
                    backgroundColor: '#ffffff', 
                    borderWidth: 1, borderColor: item.syncStatus === "waiting" ? '#ffb74d' : '#e9ecef', 
                    borderRadius: 10, padding: 12, marginBottom: 8,
                    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1
                  }}
                >
                  {/* Hàng Đỉnh: Nhãn Sự Kiện và Ngày tháng phẳng sạch */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ backgroundColor: mauNenBadge, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 }}>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: mauChuChuong, letterSpacing: 0.2 }}>
                          {item.suKien.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#1a1f23' }}>
                        {hienThiTuanNhatKy}
                      </Text>
                    </View>
                    
                    <Text style={{ fontSize: 11.5, color: '#6c757d', fontWeight: '500' }}>
                      📅 {(() => {
                        if (!item.ngay) return "";
                        const ngayStr = item.ngay.toString().trim();
                        if (ngayStr.includes('/')) return ngayStr.substring(0, 10);
                        if (ngayStr.includes('-')) {
                          const phanTachNgay = ngayStr.substring(0, 10).split('-');
                          if (phanTachNgay.length === 3) return `${phanTachNgay[2]}/${phanTachNgay[1]}/${phanTachNgay[0]}`;
                        }
                        const d = new Date(ngayStr);
                        return !isNaN(d.getTime()) ? formatVNDate(d) : ngayStr;
                      })()}
                      {item.syncStatus === "waiting" ? " ⏳" : ""}
                    </Text>
                  </View>

                  {/* Hàng Đáy: Quân số và Cụm bộ đôi nút Sửa/Xóa phẳng lỳ */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 12.5, color: '#495057', fontWeight: '500' }}>Số lượng:</Text>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: mauChuChuong }}>
                          {item.soHeo} con
                        </Text>
                      </View>
                      {item.ghiChu ? (
                        <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 4, backgroundColor: '#f8f9fa', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, borderLeftWidth: 2, borderLeftColor: '#adb5bd' }} numberOfLines={2}>
                          {item.ghiChu}
                        </Text>
                      ) : null}
                    </View>

                    {/* Cụm nút bấm gọt nhỏ thanh mỏng chuẩn cao cấp */}
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity 
                        activeOpacity={0.6} 
                        onPress={() => handleMoSuaHeoThit(item)} 
                        style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ffc107', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}
                      >
                        <Text style={{ color: '#b58100', fontSize: 11, fontWeight: 'bold' }}>Sửa</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        activeOpacity={0.6} 
                        onPress={() => handleXoaNhatKyChuDong(item)} 
                        style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dc3545', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}
                      >
                        <Text style={{ color: '#dc3545', fontSize: 11, fontWeight: 'bold' }}>Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                </View>
              );
            });
          })()}
        </View>


      </View>
    ) : (
      <Text style={styles.emptyText}>Trại này hiện tại chưa có dữ liệu phân tích số liệu Heo Thịt trên Server.</Text>
    )}
  </ScrollView>
)}







      

            {/* ======================================================== */}
      {/* 👁️ POP-UP MODAL 1: XEM CHI TIẾT VÀ TỰ ĐỘNG LỌC LỊCH SỬ OFFLINE THẦN TỐC */}
      {/* ======================================================== */}
      <Modal visible={isDetailModalVisible && currentTab !== 'heo_thit'} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.popupCard, { width: '92%', maxHeight: '85%' }]}>
            <Text style={[styles.popupTitle, { fontSize: 18, color: '#007bff', marginBottom: 5 }]}>CHI TIẾT HEO NÁI: {selectedHeoDetail?.maTai}</Text>
            
             <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
              
              {/* THÔNG TIN TRẠNG THÁI HIỆN TẠI TRONG SỔ MÃ TAI */}
              <View style={{ marginBottom: 15 }}>
                {(() => {
                  const epNgayChuanVietNam = (str) => {
                    if (!str || str.toString().trim() === "" || str.toString().trim() === "---") return "---";
                    let s = str.toString().trim();
                    if (s.includes('/') && s.split('/').length === 3) return s.substring(0, 10);
                    const d = new Date(s);
                    if (isNaN(d.getTime())) return s.substring(0, 10);
                    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                  };

                  return (
                    <View>
                      {/* KHỐI 1: THÔNG TIN CHUNG CỦA NÁI ĐƯỢC CHIA HỘP PHẲNG SẠCH SẼ */}
                      <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e9ecef' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
                          <Text style={{ fontSize: 13, color: '#6c757d', fontWeight: '500' }}>Giống Heo Nái</Text>
                          <Text style={{ fontSize: 13, color: '#111111', fontWeight: 'bold' }}>{selectedHeoDetail?.giong || "---"}</Text>
                        </View>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
                          <Text style={{ fontSize: 13, color: '#6c757d', fontWeight: '500' }}>Lứa hiện tại</Text>
                          <Text style={{ fontSize: 13, color: '#e83e8c', fontWeight: 'bold' }}>{selectedHeoDetail?.luaHienThiThongMinh || selectedHeoDetail?.lua || "0"}</Text>
                        </View>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                          <Text style={{ fontSize: 13, color: '#6c757d', fontWeight: '500' }}>Trạng Thái Hiện Tại</Text>
                          <Text style={{ fontSize: 13, color: '#e65100', fontWeight: 'bold' }}>{selectedHeoDetail?.trangThaiCotH || "Trống"}</Text>
                        </View>
                      </View>
                       {/* KHỐI 2: CHI TIẾT THEO DÕI ĐỘNG CHO NHÓM MANG THAI */}
                      {nhomNaiTab2 === 'Phoi' && (
                        <View style={{ backgroundColor: '#fffaf5', borderRadius: 8, padding: 12, marginBottom: 5, borderWidth: 1, borderColor: '#ffd3b6' }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ffe5d4' }}>
                            <Text style={{ fontSize: 13, color: '#555555' }}>Ngày Phối Giống</Text>
                            <Text style={{ fontSize: 13, color: '#111111', fontWeight: '600' }}>{epNgayChuanVietNam(selectedHeoDetail?.ngayCotI)}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ffe5d4' }}>
                            <Text style={{ fontSize: 13, color: '#555555' }}>Ngày Dự Kiến Đẻ</Text>
                            <Text style={{ fontSize: 13, color: '#28a745', fontWeight: 'bold' }}>{epNgayChuanVietNam(selectedHeoDetail?.ngayDuKienDeMoi)}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ffe5d4' }}>
                            <Text style={{ fontSize: 13, color: '#555555' }}>Thời Gian Bầu (Ngày)</Text>
                            <Text style={{ fontSize: 13, color: '#007bff', fontWeight: 'bold' }}>
                              {(() => {
                                let strPhoi = selectedHeoDetail?.ngayCotI ? selectedHeoDetail.ngayCotI.toString().trim() : "";
                                if (strPhoi === "" || strPhoi === "---") return "0 ngày";
                                if (strPhoi.includes('/')) { let p = strPhoi.split('/'); if (p.length === 3) strPhoi = `${p[2]}-${p[1]}-${p[0]}`; }
                                const dPhoi = new Date(strPhoi); const dNay = new Date(); dPhoi.setHours(0,0,0,0); dNay.setHours(0,0,0,0);
                                return Math.floor((dNay.getTime() - dPhoi.getTime()) / (1000*60*60*24)) + " ngày";
                              })()}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                            <Text style={{ fontSize: 13, color: '#555555' }}>Thời Gian Bầu (Tuần)</Text>
                            <Text style={{ fontSize: 13, color: '#007bff', fontWeight: 'bold' }}>
                              {(() => {
                                let strPhoi = selectedHeoDetail?.ngayCotI ? selectedHeoDetail.ngayCotI.toString().trim() : "";
                                if (strPhoi === "" || strPhoi === "---") return "0 tuần";
                                if (strPhoi.includes('/')) { let p = strPhoi.split('/'); if (p.length === 3) strPhoi = `${p[2]}-${p[1]}-${p[0]}`; }
                                const dPhoi = new Date(strPhoi); const dNay = new Date(); dPhoi.setHours(0,0,0,0); dNay.setHours(0,0,0,0);
                                return Math.floor((dNay.getTime() - dPhoi.getTime()) / (1000*60*60*24*7)) + " tuần";
                              })()}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* KHỐI 3: CHÚ Ý CHO NHÓM CHƯA PHỐI */}
                      {nhomNaiTab2 === 'Cho Phoi' && (
                        <View style={{ paddingVertical: 12, backgroundColor: '#fff3cd', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ffeeba' }}>
                          <Text style={{ fontSize: 13, color: '#856404', fontWeight: 'bold', textAlign: 'center', lineHeight: 18 }}>
                            Chú ý: Heo nái đang Chờ Phối / Lốc. Hãy theo dõi chu kỳ lên giống để phối kịp thời!
                          </Text>
                        </View>
                      )}

                      {/* KHỐI 4: CHI TIẾT SẢN XUẤT CHO NHÓM NUÔI CON HOẶC ĐÃ CAI SỮA */}
                      {nhomNaiTab2 === 'De' && (
                        <View style={{ backgroundColor: '#f4fbf7', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#c3e6cb' }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#d4edda' }}>
                            <Text style={{ fontSize: 13, color: '#555555' }}>Ngày Đẻ Thực Tế</Text>
                            <Text style={{ fontSize: 13, color: '#111111', fontWeight: '600' }}>{epNgayChuanVietNam(selectedHeoDetail?.ngayDeCotJ)}</Text>
                          </View>
                          
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#d4edda' }}>
                            <Text style={{ fontSize: 13, color: '#555555' }}>Tổng Số Heo Sơ Sinh</Text>
                            <Text style={{ fontSize: 13, color: '#28a745', fontWeight: 'bold' }}>{selectedHeoDetail?.soHeoCon || "0"} con</Text>
                          </View>

                          {/* Hộp phụ chi tiết hao hụt sơ sinh phẳng sạch sẽ */}
                          <View style={{ backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, marginTop: 4, marginBottom: 4, borderWidth: 0.5, borderColor: '#dee2e6' }}>
                            <Text style={{ fontSize: 12, color: '#666666', lineHeight: 18 }}>
                              Khô thai: <Text style={{fontWeight:'600', color:'#111111'}}>{selectedHeoDetail?.khoThai || 0}</Text> | Còi cọc: <Text style={{fontWeight:'600', color:'#111111'}}>{selectedHeoDetail?.coiCoc || 0}</Text> | Chết ngộp: <Text style={{fontWeight:'600', color:'#111111'}}>{selectedHeoDetail?.chetNgop || 0}</Text>
                            </Text>
                            <Text style={{ fontSize: 12, color: '#111111', fontWeight: 'bold', marginTop: 5 }}>
                              Chọn Nuôi Thực Tế: <Text style={{color:'#28a745'}}>{selectedHeoDetail?.chonNuoi || 0} con</Text>
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#d4edda' }}>
                            <Text style={{ fontSize: 13, color: '#555555' }}>Ngày Cai Sữa Đàn</Text>
                            <Text style={{ fontSize: 13, color: '#111111', fontWeight: '600' }}>{epNgayChuanVietNam(selectedHeoDetail?.ngayCaiSuaCotKhat)}</Text>
                          </View>

                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                            <Text style={{ fontSize: 13, color: '#555555', fontWeight: '600' }}>Số Con Cai Sữa Đạt</Text>
                            <Text style={{ fontSize: 14, color: '#007bff', fontWeight: 'bold' }}>{selectedHeoDetail?.soConCaiSua || "0"} con</Text>
                          </View>
                        </View>
                      )}
                      {/* KHỐI 5: CHI TIẾT SẢN XUẤT CHO NHÓM HEO ĐÃ THẢI */}
                      {nhomNaiTab2 === 'Thai' && (
                        <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#dee2e6' }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
                            <Text style={{ fontSize: 13, color: '#555555' }}>Ngày Đẻ Thực Tế</Text>
                            <Text style={{ fontSize: 13, color: '#6c757d', fontWeight: 'bold' }}>{epNgayChuanVietNam(selectedHeoDetail?.ngayDeCotJ)}</Text>
                          </View>
                          
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
                            <Text style={{ fontSize: 13, color: '#555555' }}>Ngày Cai Sữa</Text>
                            <Text style={{ fontSize: 13, color: '#6c757d', fontWeight: 'bold' }}>{epNgayChuanVietNam(selectedHeoDetail?.ngayCaiSuaCotKhat)}</Text>
                          </View>

                          {selectedHeoDetail?.ngayCaiSuaCotKhat && selectedHeoDetail?.ngayCaiSuaCotKhat.toString().trim() !== "" && selectedHeoDetail?.ngayCaiSuaCotKhat.toString().trim() !== "---" && (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
                              <Text style={{ fontSize: 13, color: '#555555' }}>Số Con Cai Sữa Đạt</Text>
                              <Text style={{ fontSize: 13, color: '#6c757d', fontWeight: 'bold' }}>{selectedHeoDetail?.soConCaiSua || "0"} con</Text>
                            </View>
                          )}

                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                            <Text style={{ fontSize: 13, color: '#555555' }}>Tháng Đẻ Ghi Nhận</Text>
                            <Text style={{ fontSize: 13, color: '#111111', fontWeight: '600' }}>{selectedHeoDetail?.thangDeCotK || "---"}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })()}
              </View>

              {/* 📜 KHỐI LỊCH SỬ CÁC LỨA ĐÃ ĐẺ THÀNH CÔNG (Đồng bộ hộp xám phẳng phẳng sạch) */}
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#495057', marginTop: 10, marginBottom: 8, paddingLeft: 2, letterSpacing: 0.3 }}>📜 LỊCH SỬ CÁC LỨA ĐÃ ĐẺ THÀNH CÔNG</Text>
              
              {(() => {
                const epNgayTuongMinh = (str) => {
                  if (!str || str.toString().trim() === "") return "---";
                  let s = str.toString().trim();
                  if (s.includes('/') && s.split('/').length === 3) return s.substring(0, 10);
                  const d = new Date(s);
                  if (isNaN(d.getTime())) return s.substring(0, 10);
                  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                };

                const lichSuDeGopOffline = danhSachDangDe
                  .filter(heo => {
                    const maTaiKhachChon = selectedHeoDetail?.maTai?.toString().toUpperCase().trim();
                    const maTaiTuSheet = (heo.maTai || "").toString().toUpperCase().trim();
                    return maTaiTuSheet === maTaiKhachChon && maTaiKhachChon !== "";
                  })
                  .sort((a, b) => Number(b.luaDe || 0) - Number(a.luaDe || 0));

                if (lichSuDeGopOffline.length === 0) {
                  return (
                    <View style={{ padding: 12, backgroundColor: '#fcfcfc', borderRadius: 8, borderWidth: 1, borderColor: '#eaeaea' }}>
                      <Text style={{ fontSize: 13, color: '#95a5a6', textAlign: 'center', fontStyle: 'italic' }}>Chưa ghi nhận dữ liệu lịch sử lứa đẻ nào cho mã tai này.</Text>
                    </View>
                  );
                }

 return lichSuDeGopOffline.map((item, index) => (
                  <View key={index} style={{ backgroundColor: '#ffffff', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eef2f5', flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 }}>
                    <View style={{ width: 4, backgroundColor: '#ced4da' }} />
                    
                    <View style={{ flex: 1, padding: 12 }}>
                      {/* Tiêu đề lứa và ngày đẻ */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#495057' }}>Lứa đẻ: {item.luaDe || "---"}</Text>
                        <Text style={{ fontSize: 12, color: '#6c757d' }}>Ngày đẻ: {epNgayTuongMinh(item.ngayDe)}</Text>
                      </View>

                      {/* 🟢 KHỐI HỘP GỘP TỔNG LỰC: Gom toàn bộ dữ liệu Sơ Sinh và Cai Sữa vào chung 1 hộp nền xám */}
                      <View style={{ backgroundColor: '#f8f9fa', borderRadius: 6, padding: 8, borderWidth: 0.5, borderColor: '#eee' }}>
                        {/* Chỉ số sơ sinh */}
                        <Text style={{ fontSize: 12, color: '#666666', lineHeight: 18 }}>
                          Sơ sinh sống: <Text style={{fontWeight:'700', color:'#28a745'}}>{item.soHeoCon || "0"}</Text> con | Khô: {item.khoThai || 0} | Còi: {item.coiCoc || 0} | Ngộp: {item.chetNgop || 0}
                        </Text>
                        
                        <Text style={{ fontSize: 12, color: '#111111', fontWeight: 'bold', marginTop: 4 }}>
                          Chọn Nuôi: <Text style={{color:'#28a745'}}>{item.chonNuoi || 0} con</Text>
                        </Text>

                        {/* 🟢 CHÈN ĐỒNG BỘ CAI SỮA VÀO ĐÂY: Nếu lứa này đã cai sữa, hiện luôn ở hàng dưới bên trong hộp xám */}
                        {item.ngayCaiSua && item.ngayCaiSua !== "" && item.ngayCaiSua !== "---" ? (
                          <View style={{ borderTopWidth: 0.5, borderTopColor: '#dee2e6', marginTop: 6, paddingTop: 6 }}>
                            <Text style={{ fontSize: 12, color: '#2c3e50', fontWeight: '500' }}>
                              Số Con Cai Sữa Đạt: <Text style={{ fontWeight: '700', color: '#007bff' }}>{item.soConCaiSua || "0"} con</Text>
                            </Text>
                            <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>
                              Ngày cai sữa: <Text style={{ color: '#111111', fontWeight: '500' }}>{epNgayTuongMinh(item.ngayCaiSua)}</Text>
                            </Text>
                            {item.soNgay && item.soNgay !== "0" ? (
                              <Text style={{ fontSize: 11, color: '#007bff', fontWeight: '600', marginTop: 2 }}>Nuôi con: {item.soNgay} ngày</Text>
                            ) : null}
                            {item.ghiChuCaiSua ? <Text style={{ fontSize: 11, color: '#6c757d', fontStyle: 'italic', marginTop: 4 }}>Ghi chú cai sữa: {item.ghiChuCaiSua}</Text> : null}
                          </View>
                        ) : null}
                      </View>

                      {/* Ghi chú đẻ (nếu có) nằm ngoài hộp cho thoáng */}
                      {item.ghiChuDe ? <Text style={{ fontSize: 11, color: '#6c757d', fontStyle: 'italic', marginTop: 6 }}>Ghi chú đẻ: {item.ghiChuDe}</Text> : null}
                    </View>
                  </View>
                ));
              })()}
            </ScrollView>

            <View style={{ marginTop: 15, borderTopWidth: 1, borderTopColor: '#f1f2f6', paddingTop: 12 }}>
              <TouchableOpacity 
                onPress={() => { setIsDetailModalVisible(false); setSelectedHeoDetail(null); }} 
                activeOpacity={0.7}
                style={{ backgroundColor: '#6c757d', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>ĐÓNG CỬA SỔ XEM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>









           {/* ======================================================== */}
      {/* 📝 POP-UP MODAL SỬA NHẬT KÝ HEO NÁI ĐẺ GỐC (TAB 1 QUAY VỀ NGUYÊN BẢN) */}
      {/* ======================================================== */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>📝 SỬA NHẬT KÝ HEO</Text>
            
            {/* 1. Chọn ngày thực hiện sửa đổi */}
            <TouchableOpacity style={styles.popupDateButton} onPress={() => setEditDatePickerVisibility(true)}>
              <Text style={styles.dateButtonText}>📅 {editNgay}</Text>
            </TouchableOpacity>
            
            <DateTimePickerModal 
              isVisible={isEditDatePickerVisible} 
              mode="date" 
              onConfirm={(d) => { 
                setEditNgay(formatVNDate(d));
                setEditDatePickerVisibility(false); 
              }} 
              onCancel={() => setEditDatePickerVisibility(false)} 
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
            <View style={styles.popupPickerBorder}>
              <Picker selectedValue={editSuKien} dropdownIconColor="#111111" style={{ color: '#111111', backgroundColor: '#ffffff' }} onValueChange={(item) => { setEditSuKien(item); setEditSoHeo(''); }}>
                {danhSachSuKien.map((item, index) => (
                  <Picker.Item key={index} label={item} value={item} style={{ color: '#111111', backgroundColor: '#ffffff' }} />
                ))}
              </Picker>
            </View>

            {/* 4. Ô nhập Số lượng con dành cho các sự kiện Phối / Cai sữa cũ của bạn */}
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

            {/* 5. Khối chi tiết Heo Đẻ bung 5 ô nhập đặc trưng (Khô, Còi, Ngộp, Chọn nuôi) gốc vẹn nguyên */}
            {editSuKien === "Đẻ" && (
              <View style={{ backgroundColor: '#fdf7f2', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f5dad2', marginTop: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100', marginBottom: 12 }}>Sửa chi tiết Heo Đẻ:</Text>
                
                {/* Tổng số con sinh ra */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, color: '#d32f2f', fontWeight: '600', marginBottom: 4, paddingLeft: 2 }}>📊 Tổng số con sinh ra (Sống + Chết)</Text>
                  <TextInput 
                    style={[styles.popupInput, { fontSize: 14, height: 38, paddingVertical: 0, fontWeight: 'bold', borderColor: '#f5c6cb', backgroundColor: '#ffffff' }]} 
                    placeholder="Nhập tổng số con sinh ra lứa này..." 
                    keyboardType="numeric" 
                    placeholderTextColor="#888888" 
                    value={editSoHeo} 
                    onChangeText={setEditSoHeo} 
                  />
                </View>

                {/* Số heo Chọn nuôi */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, color: '#28a745', fontWeight: '600', marginBottom: 4, paddingLeft: 2 }}>🟢 Số heo Chọn nuôi </Text>
                  <TextInput 
                    style={[styles.popupInput, { fontSize: 14, height: 38, paddingVertical: 0, fontWeight: 'bold', borderColor: '#c3e6cb', backgroundColor: '#ffffff' }]} 
                    placeholder="Nhập số con sống chọn nuôi..." 
                    keyboardType="numeric" 
                    placeholderTextColor="#888888" 
                    value={editChonNuoi} 
                    onChangeText={setEditChonNuoi} 
                  />
                </View>

                {/* Số con chết khô */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, color: '#666666', marginBottom: 4, paddingLeft: 2 }}>📝 Số con chết khô</Text>
                  <TextInput 
                    style={[styles.popupInput, { fontSize: 14, height: 38, paddingVertical: 0, backgroundColor: '#ffffff' }]} 
                    placeholder="Nhập số con chết khô..." 
                    keyboardType="numeric" 
                    placeholderTextColor="#888888" 
                    value={editKhoThai} 
                    onChangeText={setEditKhoThai} 
                  />
                </View>

                {/* Số con còi cọc */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 11, color: '#666666', marginBottom: 4, paddingLeft: 2 }}>📝 Số con còi cọc, dị tật</Text>
                  <TextInput 
                    style={[styles.popupInput, { fontSize: 14, height: 38, paddingVertical: 0, backgroundColor: '#ffffff' }]} 
                    placeholder="Nhập số con còi cọc..." 
                    keyboardType="numeric" 
                    placeholderTextColor="#888888" 
                    value={editCoiCoc} 
                    onChangeText={setEditCoiCoc} 
                  />
                </View>

                {/* Số con chết ngộp */}
                <View style={{ marginBottom: 2 }}>
                  <Text style={{ fontSize: 11, color: '#666666', marginBottom: 4, paddingLeft: 2 }}>📝 Số con chết ngộp, lưu thai</Text>
                  <TextInput 
                    style={[styles.popupInput, { fontSize: 14, height: 38, paddingVertical: 0, backgroundColor: '#ffffff' }]} 
                    placeholder="Nhập số con chết ngộp..." 
                    keyboardType="numeric" 
                    placeholderTextColor="#888888" 
                    value={editChetNgop} 
                    onChangeText={setEditChetNgop} 
                  />
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

            {/* Cụm hai nút Lưu sửa và Hủy bo góc */}
            <View style={styles.popupButtonGroup}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Button title="LƯU SỬA" onPress={handleSaveEdit} color="#ffc107" />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="HỦY" onPress={() => setIsEditModalVisible(false)} color="#6c757d" />
              </View>
            </View>

          </View>
        </View>
      </Modal>


      {/* ======================================================== */}
      {/* 📝 POP-UP MODAL 3: SỬA SỔ DANH BẠ HEO (TAB 2)             */}
      {/* ======================================================== */}
      <Modal visible={isMtEditModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>📝 SỬA SỔ DANH BẠ HEO</Text>
            <TextInput style={[styles.popupInput, {color: '#111111', backgroundColor: '#ffffff'}]} value={mtEditMaTai} onChangeText={setMtEditMaTai} placeholderTextColor="#777777" autoCapitalize="characters" />
            <TextInput style={[styles.popupInput, {marginTop: 10, color: '#111111', backgroundColor: '#ffffff'}]} value={mtEditGiong} onChangeText={setMtEditGiong} placeholder="Sửa Giống heo" placeholderTextColor="#777777" />
            <View style={[styles.popupPickerBorder, {marginTop: 10}]}>
              <Picker 
                selectedValue={mtEditLua} 
                dropdownIconColor="#111111"
                style={{ color: '#111111', backgroundColor: '#ffffff' }}
                onValueChange={(v) => setMtEditLua(v)}
              >
                {danhSachLuaHeo.map((item) => (
                  <Picker.Item key={item} label={item} value={item} style={{ color: '#111111', backgroundColor: '#ffffff' }} />
                ))}
              </Picker>
            </View>
            <Text style={{ fontSize: 11.5, color: '#666666', fontStyle: 'italic', marginBottom: 12, paddingHorizontal: 4, lineHeight: 16 }}>( lứa heo lúc nhập về, thông thường sẽ để hậu bị. hệ thống tự tính toán lứa đẻ, không cần phải sửa )</Text>
            <View style={styles.popupButtonGroup}>
              <View style={{ flex: 1, marginRight: 8 }}><Button title="CẬP NHẬT" onPress={handleSaveMtEdit} color="#ffc107" /></View>
              <View style={{ flex: 1 }}><Button title="HỦY" onPress={() => setIsMtEditModalVisible(false)} color="#6c757d" /></View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 📊 POP-UP MODAL 4: GIẢI THÍCH CHI TIẾT GIAI ĐOẠN HEO THỊT   */}
      {/* ======================================================== */}
           <Modal visible={currentTab === 'heo_thit' && isDetailModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.popupCard, { width: '90%' }]}>
            <Text style={[styles.popupTitle, { fontSize: 16, color: '#2e7d32' }]}>📊 ĐỊNH NGHĨA GIAI ĐOẠN TUẦN TUỔI</Text>
            <View style={{ marginVertical: 10, borderWidth: 1, borderColor: '#eeeeee', borderRadius: 8, overflow: 'hidden' }}>
              <View style={{ backgroundColor: '#ffffff' }}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🍼 Giai đoạn Theo Mẹ:</Text>
                  <Text style={[styles.detailVal, { color: '#0056b3' }]}>Sơ sinh đang bú mẹ</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🥛 Giai đoạn Cai Sữa:</Text>
                  <Text style={[styles.detailVal, { color: '#0056b3' }]}>Vừa tách mẹ, tập ăn cám</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🐖 Giai đoạn Heo Choai:</Text>
                  <Text style={[styles.detailVal, { color: '#e65100' }]}>Tính từ Tuần 5 đến Tuần 14</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomWidth: 0, backgroundColor: '#fff3e0' }]}>
                  <Text style={[styles.detailLabel, { fontWeight: 'bold', color: '#d32f2f' }]}>🔥 Giai đoạn Gần Xuất:</Text>
                  <Text style={[styles.detailVal, { color: '#d32f2f', fontWeight: 'bold' }]}>Từ Tuần 15 trở lên</Text>
                </View>
              </View>
            </View>
            <View style={{ marginTop: 15 }}>
              <Button title="ĐÓNG BẢNG TRA CỨU" onPress={() => setIsDetailModalVisible(false)} color="#6c757d" />
            </View>
          </View>
        </View>
      </Modal>

      {/* 🚀 THANH MENU 5 TAB CHỮ PHẲNG - ĐÃ ĐƯỢC ĐƯA VÀO TRONG ĐÚNG QUY TẮC CẤU TRÚC LẬP TRÌNH */}
            {/* ======================================================== */}
      {/* 🚀 THANH MENU 5 TAB CHỮ PHẲNG - ĐÃ SỬA CHỐNG XUỐNG HÀNG & SÁNG SỐ 100% */}
      {/* ======================================================== */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f1f2f6',
        height: 54 + (insets.bottom > 0 ? insets.bottom : 6), 
        paddingBottom: insets.bottom > 0 ? insets.bottom : 6, 
        paddingTop: 4,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 8,
        zIndex: 99
      }}>
        {/* TAB 1: NHẬP LIỆU (Đã nới khung rộng 98% chống tuyệt đối nhảy xuống hàng) */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('nhap_lieu')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: currentTab === 'nhap_lieu' ? '#fff0e6' : 'transparent', paddingBottom: 2, paddingTop: 2, borderRadius: 10, width: '98%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, marginBottom: 1, opacity: currentTab === 'nhap_lieu' ? 1 : 0.6 }}>📝</Text>
            <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: currentTab === 'nhap_lieu' ? '700' : '500', color: currentTab === 'nhap_lieu' ? '#e65100' : '#666666' }}>Nhập Liệu</Text>
          </View>
        </TouchableOpacity>
        
        {/* TAB 2: SỔ MÃ TAI (Số đếm luôn sáng rõ 100%, chỉ mờ icon nhãn nếu ẩn) */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('ma_tai')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: currentTab === 'ma_tai' ? '#fff0e6' : 'transparent', paddingBottom: 2, paddingTop: 2, borderRadius: 10, width: '98%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 15, marginBottom: 1 }}>
              <Text style={{ opacity: currentTab === 'ma_tai' ? 1 : 0.6 }}>🏷️ </Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: currentTab === 'ma_tai' ? '#e65100' : '#28a745' }}>
                {Array.isArray(danhSachMaTai) ? String(danhSachMaTai.filter(item => !item || !item.trangThaiCotH ? true : item.trangThaiCotH.toString().trim().normalize("NFC") !== "Thải").length) : "0"}
              </Text>
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: currentTab === 'ma_tai' ? '700' : '500', color: currentTab === 'ma_tai' ? '#e65100' : '#666666' }}>Sổ Mã Tai</Text>
          </View>
        </TouchableOpacity>

        {/* TAB 3: THỐNG KÊ */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('thong_ke')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: currentTab === 'thong_ke' ? '#fff0e6' : 'transparent', paddingBottom: 2, paddingTop: 2, borderRadius: 10, width: '98%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, marginBottom: 1, opacity: currentTab === 'thong_ke' ? 1 : 0.6 }}>📊</Text>
            <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: currentTab === 'thong_ke' ? '700' : '500', color: currentTab === 'thong_ke' ? '#e65100' : '#666666' }}>Thống Kê</Text>
          </View>
        </TouchableOpacity>
        
        {/* TAB 4: ĐANG ĐẺ (Số đếm luôn sáng rõ 100%) */}
       <TouchableOpacity 
  activeOpacity={0.7} 
  onPress={() => setCurrentTab('heo_de')} 
  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
>
  <View style={{ backgroundColor: currentTab === 'heo_de' ? '#fff0e6' : 'transparent', paddingBottom: 2, paddingTop: 2, borderRadius: 10, width: '98%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 16, marginBottom: 1 }}>
      <Text style={{ opacity: currentTab === 'heo_de' ? 1 : 0.6 }}>🐖 </Text>
      <Text style={{ fontSize: 10, fontWeight: '700', color: currentTab === 'heo_de' ? '#e65100' : '#28a745' }}>
        {/* ======================================================== */}
        {/* 🟢 BẢN VÁ TỐI CAO: ĐẾM ĐỘNG THEO TRẠNG THÁI RAM ĐỈNH APP */}
        {/* ======================================================== */}
        {(() => {
          const danhSachGoc = Array.isArray(global.danhSachCapNhatTrangThai) ? global.danhSachCapNhatTrangThai : [];
          
          // Đếm chính xác tổng số nái đang có trạng thái sinh sản thực tế hiện tại là "Đẻ"
          const tongSoNaiDangDe = danhSachGoc.filter(heo => 
            heo && !heo.vuaNhapMoi && heo.trangThaiDienThoai === "Đẻ"
          ).length;
          
          return String(tongSoNaiDangDe);
        })()}
        {/* ======================================================== */}
      </Text>
    </Text>
    <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: currentTab === 'heo_de' ? '700' : '500', color: currentTab === 'heo_de' ? '#e65100' : '#666666' }}>Đang Đẻ</Text>
  </View>
</TouchableOpacity>
        
        {/* TAB 5: HEO THỊT (Số đếm luôn sáng rõ 100%) */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('heo_thit')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: currentTab === 'heo_thit' ? '#fff0e6' : 'transparent', paddingBottom: 2, paddingTop: 2, borderRadius: 10, width: '98%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 15, marginBottom: 1 }}>
              <Text style={{ opacity: currentTab === 'heo_thit' ? 1 : 0.6 }}>🏠 </Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: currentTab === 'heo_thit' ? '#e65100' : '#28a745' }}>
                {dataHeoThit && dataHeoThit.tongHeoThit ? String(dataHeoThit.tongHeoThit) : "0"}
              </Text>
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: currentTab === 'heo_thit' ? '700' : '500', color: currentTab === 'heo_thit' ? '#e65100' : '#666666' }}>Heo Thịt</Text>
          </View>
        </TouchableOpacity>
      </View>

{/* ======================================================== */}
{/* ⚠️ KHỐI ĐỘC LẬP 1: HỘP THÔNG BÁO SAI QUY TRÌNH (MÀU ĐỎ/CAM)  */}
{/* ======================================================== */}
<Modal visible={isQuyTrinhAlertVisible} animationType="fade" transparent={true}>
  <View style={styles.modalOverlay}>
    <View style={[styles.popupCard, { width: '85%', padding: 22, alignItems: 'center' }]}>
      
      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#fde8e8', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ fontSize: 22 }}>⚠️</Text>
      </View>

      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#dc3545', textAlign: 'center', marginBottom: 12 }}>
        {txtAlertNoiDung.tieuDe}
      </Text>
      
      <Text style={{ fontSize: 13, color: '#495057', textAlign: 'center', lineHeight: 20, marginBottom: 22, paddingHorizontal: 4 }}>
        Heo nái mã số <Text style={{ fontWeight: 'bold', color: '#0056b3', backgroundColor: '#e6f2ff', paddingHorizontal: 4, borderRadius: 4 }}> {txtAlertNoiDung.maTai} </Text> khi chọn sự kiện <Text style={{ fontWeight: 'bold', color: '#e65100', backgroundColor: '#fff0e6', paddingHorizontal: 4, borderRadius: 4 }}> {txtAlertNoiDung.hanhDong} </Text> {txtAlertNoiDung.loiGiai}
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

{/* ======================================================== */}
{/* 📝 KHỐI ĐỘC LẬP 2: SỔ KHAI BÁO THÊM NHANH (MÀU CAM NHẠT SANG TRỌNG) */}
{/* ======================================================== */}
<Modal 
  visible={isQuickAddModalVisible} 
  animationType="fade" 
  transparent={true}
  onRequestClose={() => { if (!isQuickSaving) setIsQuickAddModalVisible(false); }}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.popupCard, { 
      borderWidth: 1.5, 
      borderColor: '#ffd3b6', // Viền cam nhạt đồng bộ 100% màu hệ thống
      backgroundColor: '#ffffff',
      padding: 18,
      borderRadius: 16,
      width: '85%'
    }]}>
      
      {/* Banner đỉnh Sổ Khai Báo chữ đen đậm rõ nét */}
      <View style={{ backgroundColor: '#fffaf5', borderWidth: 1, borderColor: '#ffd3b6', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '900', color: '#e65100', letterSpacing: 0.5 }}>
          ➕ SỔ KHAI BÁO HEO MỚI NHẬP ĐÀN
        </Text>
      </View>
      
      {/* Ô hiển thị mã số tai nhãn tĩnh phẳng mịn */}
      <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 13, color: '#333333' }}>Mã Số Tai:</Text>
      <TextInput 
        style={[styles.popupInput, { backgroundColor: '#eeeeee', color: '#555555', fontWeight: 'bold', marginBottom: 12, borderRadius: 8, height: 42, paddingHorizontal: 12 }]} 
        value={maTai ? maTai.toUpperCase().trim() : "---"} 
        editable={false} 
      />

      {/* Ô nhập Giống heo chữ đen sắc nét */}
      <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 13, color: '#333333' }}>Giống Heo Nái:</Text>
      <TextInput 
        style={[styles.popupInput, { borderColor: '#ffd3b6', marginBottom: 12, borderRadius: 8, height: 42, paddingHorizontal: 12, color: '#111111', fontWeight: '600' }]} 
        placeholder="Nái Nhà, 909, CP ..."
        placeholderTextColor="#888888"
        value={quickGiong}
        onChangeText={setQuickGiong}
        editable={!isQuickSaving}
      />

      {/* Bộ chọn lứa đẻ - ĐÃ VÁ: Chữ Hậu Bị bọc khít lỳ bên trong kén nhựa không lo bung lọt dòng */}
           <Text style={{ fontWeight: 'bold', marginBottom: 6, fontSize: 13, color: '#333333' }}>🎂 Chọn Lứa Đẻ Đầu Vào:</Text>
      
      {/* 🎯 GIẢI PHÁP NỚI RỘNG KHUNG CHỐNG CHE CHỮ: Nới chiều cao lên 50 để chữ Hậu Bị hiện nguyên vẹn */}
      <View 
        style={{ 
          borderWidth: 1.2, 
          borderColor: '#ffd3b6', 
          borderRadius: 8, 
          backgroundColor: '#ffffff', 
          marginBottom: 20, 
          height: 50, // Nới rộng không gian cho Picker thở
          justifyContent: 'center',
          overflow: 'hidden' 
        }}
      >
        <Picker
          selectedValue={quickLua}
          style={{ 
            color: '#111111', 
            width: '100%',
            height: 50, // Đồng bộ chiều cao 50 cho Picker
            backgroundColor: 'transparent'
          }}
          dropdownIconColor="#e65100" 
          onValueChange={(val) => setQuickLua(val)}
          enabled={!isQuickSaving}
        >
          {danhSachLuaHeo.map((l, index) => (
            <Picker.Item 
              key={`quick_l_${index}`} 
              label={l} 
              value={l} 
              style={{ fontSize: 13, color: '#111111', backgroundColor: '#ffffff' }} // Định hình cỡ chữ 13 gọn gàng rõ nét
            />
          ))}
        </Picker>
      </View>

      {/* 🎯 CỤM 2 NÚT HÀNH ĐỘNG HƯỚNG RAM ĐỐI XỨNG BO CONG SANG MỊN */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        {/* Nút 1: Hủy bỏ màu xám */}
        <TouchableOpacity 
          activeOpacity={0.6} 
          onPress={() => {
            if (!isQuickSaving) {
              setIsQuickAddModalVisible(false);
              setQuickGiong(''); setQuickLua('Hậu Bị'); setNhanThongBaoNhoQuickAdd('');
            }
          }}
          disabled={isQuickSaving}
          style={{ flex: 1, backgroundColor: '#6c757d', paddingVertical: 11, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5 }}>HỦY BỎ</Text>
        </TouchableOpacity>

        {/* Nút 2: Lưu lại dạng nút bấm Touchable cảm ứng chống Multi-click */}
        <TouchableOpacity 
          activeOpacity={0.6} 
          onPress={handleQuickSaveHeoMoi}
          disabled={isQuickSaving}
          style={{ flex: 1, backgroundColor: isQuickSaving ? '#cccccc' : '#e65100', paddingVertical: 11, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5 }}>
            {isQuickSaving ? '⏳ ĐANG LƯU...' : 'LƯU LẠI'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🎯 VỊ TRÍ CHÈN CHUẨN VÀNG: Hiện dòng chữ thông báo nhỏ xanh dịu nằm lọt gọn ngay dưới chân 2 nút bấm hành động */}
      {!!nhanThongBaoNhoQuickAdd && (
        <Text style={{ color: '#28a745', fontSize: 12.5, fontWeight: 'bold', textAlign: 'center', marginTop: 12, fontStyle: 'italic' }}>
          {nhanThongBaoNhoQuickAdd}
        </Text>
      )}

    </View>
  </View>
</Modal>
{/* ======================================================== */}
{/* 📝 POP-UP MODAL 5: HỘP THOẠI LÀM THỦ TỤC CAI SỮA NHANH NGAY TẠI CHUỒNG (TAB 4) */}
{/* ======================================================== */}
<Modal visible={isCaiSuaModalVisible} transparent={true} animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={[styles.popupCard, { width: '85%', padding: 18, borderRadius: 16 }]}>
      
      <View style={{ backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fbc4c4', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', marginBottom: 15 }}>
        <Text style={{ fontSize: 13, fontWeight: '900', color: '#c82333', letterSpacing: 0.3 }}>
          Cai Sữa Nhanh
        </Text>
      </View>

      <Text style={{ fontSize: 13, color: '#444444', marginBottom: 12, textAlign: 'center' }}>
        Lý lịch nái: Mã tai <Text style={{ fontWeight: 'bold', color: '#e65100' }}>{caiSuaHeoItem?.maTai}</Text> | Giống: <Text style={{ fontWeight: '500' }}>{caiSuaHeoItem?.giong}</Text>
      </Text>

      {/* 1. Chọn ngày cai sữa đạt tiêu chuẩn */}
      <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 13, color: '#333333' }}>Chọn ngày cai sữa:</Text>
      <TouchableOpacity 
        style={[styles.popupDateButton, { borderColor: '#ffd3b6', backgroundColor: '#fdfdfd', height: 42, justifyContent: 'center', marginBottom: 12 }]} 
        onPress={() => setCaiSuaDatePickerVisibility(true)}
      >
        <Text style={{ fontSize: 14, color: '#111111', fontWeight: '500' }}>📅 {caiSuaNgay}</Text>
      </TouchableOpacity>

      <DateTimePickerModal 
        isVisible={isCaiSuaDatePickerVisible} 
        mode="date" 
        onConfirm={(d) => { 
          setCaiSuaNgay(formatVNDate(d)); 
          setCaiSuaDatePickerVisibility(false); 
        }} 
        onCancel={() => setCaiSuaDatePickerVisibility(false)} 
        confirmTextConfirm="Xác nhận" 
        cancelText="Hủy" 
      />

      {/* 2. Nhập số heo con tách mẹ */}
      <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 13, color: '#333333' }}>Nhập số heo cai sữa đạt (con):</Text>
      <TextInput 
        style={[styles.popupInput, { borderColor: '#ffd3b6', height: 42, paddingHorizontal: 12, color: '#111111', fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }]} 
        placeholder="Nhập số lượng heo..." 
        keyboardType="numeric" 
        placeholderTextColor="#888888" 
        value={caiSuaSoCon} 
        onChangeText={setCaiSuaHeoSoCon} 
      />

      {/* 3. Cụm hai nút điều hướng cân xứng bo cong */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity 
          activeOpacity={0.6} 
          onPress={() => setIsCaiSuaModalVisible(false)}
          style={{ flex: 1, backgroundColor: '#6c757d', paddingVertical: 11, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5 }}>HỦY BỎ</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.6} 
          onPress={handleLuuCaiSuaNhanhTaiChuong}
          style={{ flex: 1, backgroundColor: '#e65100', paddingVertical: 11, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5 }}>XÁC NHẬN</Text>
        </TouchableOpacity>
      </View>

    </View>
  </View>
</Modal>

<Modal visible={isAlertModalVisible} animationType="fade" transparent={true}>
  <View style={styles.modalOverlay}>
    <View style={[styles.popupCard, { width: '85%', padding: 24, alignItems: 'center' }]}>
      
      {/* Icon cảnh báo hình tròn màu cam phẳng đẹp mắt */}
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff0e6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 24 }}>🏷️</Text>
      </View>

      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111111', textAlign: 'center', marginBottom: 8 }}>
        Mã tai chưa khai báo
      </Text>
      
      <Text style={{ fontSize: 13, color: '#666666', textAlign: 'center', lineHeight: 18, marginBottom: 24 }}>
        Mã tai <Text style={{ fontWeight: 'bold', color: '#e65100' }}>{maTai.trim().toUpperCase()}</Text> chưa có bên Sổ mã tai. Bạn cần khai báo số tai này trước khi nhập nhật ký!
      </Text>

      {/* Thanh chứa 2 nút bấm phẳng, bo góc mịn nằm ngang */}
      <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
        <TouchableOpacity 
          activeOpacity={0.7}
          style={{ flex: 1, backgroundColor: '#f2f2f2', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => setIsAlertModalVisible(false)}
        >
          <Text style={{ color: '#555555', fontWeight: 'bold', fontSize: 14 }}>Để sau</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.7}
          style={{ flex: 1, backgroundColor: '#e65100', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => {
            setIsAlertModalVisible(false);          // Đóng modal thông báo này
            setIsQuickAddModalVisible(true);       // Kích hoạt bật luôn modal nhập nhanh Giống/Lứa lên liền
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>Thêm ngay</Text>
        </TouchableOpacity>
      </View>

    </View>
  </View>
</Modal>
      {/* ======================================================== */}
      {/* 🎉 KHỐI ĐỘC LẬP 3: HỘP THÔNG BÁO THÀNH CÔNG ĐẸP MẮT ĐẶT ĐỘC LẬP Ở ĐÁY FILE CHỐNG LỆCH KHUNG */}
      {/* ======================================================== */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isThanhCongModalVisible}
        onRequestClose={() => setIsThanhCongModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#ffffff', width: '90%', maxWidth: 350, borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: '#a7f3d0', shadowColor: '#059669', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 12 }}>
            
            <View style={{ backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: '#059669', letterSpacing: 0.5 }}>
                ✨ {txtThanhCongNoiDung.tieuDe}
              </Text>
            </View>

            <ScrollView style={{ maxHeight: 160 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 13.5, color: '#2d3748', lineHeight: 21, textAlign: 'justify' }}>
                Mã tai heo nái <Text style={{ fontWeight: 'bold', color: '#007bff' }}>[ {txtThanhCongNoiDung.maTai} ]</Text> {txtThanhCongNoiDung.loiGiai}
              </Text>
            </ScrollView>

            <TouchableOpacity 
              activeOpacity={0.6} 
              onPress={() => setIsThanhCongModalVisible(false)}
              style={{ backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 25, alignItems: 'center', marginTop: 16, shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 }}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5, letterSpacing: 0.3 }}>
                TIẾP TỤC NHẬP LIỆU 👍
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
{/* ======================================================== */}
<Modal visible={isHeoThitModalVisible} transparent={true} animationType="fade">
  <View style={styles.modalOverlay}>
    {/* 🎯 TỐI ƯU CỐT LÕI: Đổi maxHeight về 95% và đặt chiều rộng 96% để ôm khít máy nhỏ */}
    <View style={[styles.popupCard, { width: '96%', padding: 10, borderRadius: 14, backgroundColor: '#ffffff', maxHeight: '95%' }]}>
      
      {/* Tiêu đề thanh mảnh sạch sẽ nhận diện theo màu nghiệp vụ */}
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 2 }}>
        {/* HÀNG 1: Chọn ngày thực hiện */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 12.5, color: '#333333' }}>Chọn Ngày:</Text>
          <TouchableOpacity 
            style={{ flex: 1, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#fdfdfd', height: 34, justifyContent: 'center', paddingHorizontal: 10 }} 
            onPress={() => setHeoThitDatePickerVisibility(true)}
          >
            <Text style={{ fontSize: 13, color: '#111111', fontWeight: '500' }}>📅 {heoThitNgay}</Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal 
          isVisible={isHeoThitDatePickerVisible} mode="date" 
          onConfirm={(d) => { setHeoThitNgay(formatVNDate(d)); setHeoThitDatePickerVisibility(false); }} 
          onCancel={() => setHeoThitDatePickerVisibility(false)} 
          confirmTextConfirm="Xác nhận" cancelText="Hủy" 
        />

        {/* ======================================================== */}
        {/* 🌟 LƯỚI Ô BẤM 4X5 ĐÃ GÀI PHÒNG VỆ CHỐNG TRÀN CHỮ CHO MÁY NHỎ */}
        {/* ======================================================== */}
                {/* ======================================================== */}
        {/* 📊 BẢN VÁ LỘT XÁC POP-UP NHẬP MỚI: LƯỚI ĐÚNG 3 Ô 1 HÀNG CHỮ TO RÕ, ĐỒNG BỘ 100% */}
        {/* ======================================================== */}
                        {/* ======================================================== */}
                {/* 📊 BẢN VÁ TỐI CAO MODAL SỬA: ĐỒNG BỘ BIẾN KHÔNG DẤU CHUẨN QUỐC TẾ */}
                {/* ======================================================== */}
                       {/* ======================================================== */}
        {/* 📊 BẢN VÁ TỐI CAO POP-UP NHẬP MỚI: ĐỒNG BỘ BIẾN KHÔNG DẤU - THÔNG MẠCH SỐ THÔ ĐẦU VÀO */}
        {/* ======================================================== */}
               {/* ======================================================== */}
        {/* 📊 BẢN VÁ LỘT XÁC POP-UP NHẬP MỚI: CHIA GIAI ĐOẠN LƯỚI ĐÚNG 3 Ô 1 HÀNG SẠCH SẼ */}
        {/* ======================================================== */}
        <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 10, padding: 8, gap: 10, marginBottom: 10 }}>
          {(() => {
            // Mảng phẳng 21 lứa tuổi không dấu giúp đầu gán onPress ăn khớp chuỗi số thô 100%
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
              { id: "25", nhan: "Tuần 25", khoaRAM: "25 Tuần" }
            ];

            // Bộ dò chèn thanh tiêu đề phân giai đoạn chìm nhã nhặn, chống trải dài tù túng
            const bocNhanTieuDeGiaiDoan = (idTuan) => {
              if (idTuan === "4") return "Giai đoạn 6kg - 15kg";
              if (idTuan === "5") return "Giai đoạn 15kg - 30kg";
              if (idTuan === "10") return "Giai đoạn 30kg - 60kg";
              if (idTuan === "16") return "Giai đoạn 60kg - 100kg";
              if (idTuan === "21") return "Từ 100kg - Xuất Chuồng";
              return null;
            };

            let mauChuChuongCap = '#007bff';
            if (heoThitActionType === 'Hao Hụt') mauChuChuongCap = '#dc3545';
            if (heoThitActionType === 'Bán') mauChuChuongCap = '#28a745';

            const danhSachHangBaOAdd = [];
            for (let i = 0; i < mangLuaTuanThitAdd.length; i += 3) {
              danhSachHangBaOAdd.push(mangLuaTuanThitAdd.slice(i, i + 3));
            }

            return (
              <View style={{ gap: 4 }}>
                {danhSachHangBaOAdd.map((hangData, hangIdx) => (
                  <View key={`popup_add_row3_clean_${hangIdx}`} style={{ width: '100%' }}>
                    
                    {/* Duyệt qua từng ô nhỏ, nếu ô đầu tiên của hàng dính mốc giai đoạn thì nổ thanh vách ngăn */}
                    {hangData.map((itemCell, tIdx) => {
                      const tieuDeHienThi = tIdx === 0 ? bocNhanTieuDeGiaiDoan(itemCell.id) : null;
                      
                      return (
                        <View key={`block_label_add_${hangIdx}_${tIdx}`}>
                          
                          {tieuDeHienThi && (
                            <View style={{ borderBottomWidth: 0.5, borderBottomColor: '#dee2e6', paddingBottom: 3, marginBottom: 5, marginTop: hangIdx > 0 ? 8 : 2, paddingLeft: 2 }}>
                              <Text style={{ fontSize: 11, fontWeight: '800', color: '#495057', letterSpacing: 0.2 }}>
                                {tieuDeHienThi}
                              </Text>
                            </View>
                          )}

                          {/* Kích nổ dòng bọc ngang mượt mà khi duyệt tới ô đầu dòng */}
                          {tIdx === 0 && (
                            <View style={{ flexDirection: 'row', gap: 5, marginBottom: 2 }}>
                              {hangData.map((innerCell, innerIdx) => {
                                let soConHienTai = "0";
                                if (dataHeoThit) {
                                  soConHienTai = dataHeoThit[innerCell.khoaRAM] !== undefined ? dataHeoThit[innerCell.khoaRAM] : (dataHeoThit[`${innerCell.id} Tuần`] || "0");
                                  if (innerCell.id === "4" && dataHeoThit["4 Tuần ( Cai Sữa )"] !== undefined) {
                                    soConHienTai = dataHeoThit["4 Tuần ( Cai Sữa )"];
                                  }
                                }

                                const laOThuocCheck = heoThitTuanChon && heoThitTuanChon.toString().trim() === innerCell.id.toString().trim();

                                return (
                                  <TouchableOpacity
                                    key={`add_ht_box_grid3_clean_${hangIdx}_${innerIdx}`}
                                    activeOpacity={0.7}
                                    onPress={() => setHeoThitTuanChon(innerCell.id.toString().trim())}
                                    style={{
                                      flex: 1, 
                                      height: 44, 
                                      borderRadius: 6,
                                      borderWidth: laOThuocCheck ? 2 : 1,
                                      borderColor: laOThuocCheck ? mauChuChuongCap : '#dee2e6',
                                      backgroundColor: laOThuocCheck ? mauChuChuongCap + '10' : '#ffffff', 
                                      alignItems: 'center', 
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 11.5, fontWeight: '900', color: laOThuocCheck ? mauChuChuongCap : '#212529' }}>
                                      {innerCell.nhan}
                                    </Text>
                                    <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 10, fontWeight: 'bold', color: laOThuocCheck ? mauChuChuongCap : '#137333', marginTop: 2 }}>
                                      {soConHienTai} Con
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                              {/* Đệm ô rỗng ẩn giữ nguyên tỷ lệ 1/3 hàng ngang cho hàng cuối (Tuần 25) */}
                              {hangData.length < 3 && Array.from({ length: 3 - hangData.length }).map((_, rIdx) => (
                                <View key={`void_popup_add_cell_clean_${rIdx}`} style={{ flex: 1 }} />
                              ))}
                            </View>
                          )}

                        </View>
                      );
                    })}

                  </View>
                ))}
              </View>
            );
          })()}
        </View>




        {/* Ô NHẬP SỐ LƯỢNG CON (HÀNG RIÊNG 1) */}
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 12.5, color: '#333333' }}>🔢 Số lượng con heo</Text>
          <TextInput 
            style={{ borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, height: 38, paddingHorizontal: 10, color: '#111111', fontSize: 14, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ffffff' }} 
            placeholder="Nhập số con..." 
            keyboardType="numeric" 
            placeholderTextColor="#aaaaaa" 
            value={heoThitSoLuong} 
            onChangeText={setHeoThitSoCon} 
          />
        </View>

        {/* Ô NHẬP GHI CHÚ LÝ DO (HÀNG RIÊNG 2) */}
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 12.5, color: '#333333' }}>📝 Ghi chú lý do ( nếu có )</Text>
          <TextInput 
            style={{ borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, height: 38, paddingHorizontal: 10, color: '#111111', fontSize: 13, backgroundColor: '#ffffff' }} 
            placeholder="Ghi chú nếu có" 
            placeholderTextColor="#aaaaaa" 
            value={heoThitGhiChu} 
            onChangeText={setHeoThitGhiChu} 
          />
        </View>

        {/* Cụm hai nút điều hướng phẳng bo cong dưới đáy */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity 
            activeOpacity={0.6} onPress={() => setIsHeoThitModalVisible(false)}
            style={{ flex: 1, backgroundColor: '#6c757d', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5 }}>HỦY BỎ</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.6} onPress={handleLuuHanhDongHeoThit}
            style={{ 
              flex: 1, 
              backgroundColor: heoThitActionType === 'Nhập Đàn' ? '#007bff' : (heoThitActionType === 'Hao Hụt' ? '#dc3545' : '#28a745'), 
              paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' 
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5 }}>XÁC NHẬN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

    </View>
  </View>
</Modal>


      {/* ======================================================== */}
      {/* 📝 POP-UP MODAL SỬA NHẬT KÝ HEO THỊT RIÊNG BIỆT TẠI TAB 5 */}
      {/* ======================================================== */}
            {/* ======================================================== */}
      {/* 📝 POP-UP MODAL SỬA NHẬT KÝ HEO THỊT RIÊNG BIỆT - LƯỚI 4X5 CHỮ LỚN CHỐNG TRÀN */}
      {/* ======================================================== */}
      <Modal visible={isSuaHeoThitModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.popupCard, { width: '96%', padding: 12, borderRadius: 14, backgroundColor: '#ffffff', maxHeight: '92%' }]}>
            
            <Text style={[styles.popupTitle, { marginBottom: 12, color: '#111111', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }]}>
              📝 MỤC SỬA HEO THỊT
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 5 }}>
              {/* 1. Chọn ngày thực hiện sửa đổi */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#333333' }}>Ngày làm:</Text>
                <TouchableOpacity 
                  style={{ flex: 1, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, backgroundColor: '#fdfdfd', height: 36, justifyContent: 'center', paddingHorizontal: 10 }} 
                  onPress={() => setSuaHeoThitDatePickerVisible(true)}
                >
                  <Text style={{ fontSize: 13.5, color: '#111111', fontWeight: '500' }}>📅 {suaHeoThitNgay}</Text>
                </TouchableOpacity>
              </View>

              <DateTimePickerModal 
                isVisible={isSuaHeoThitDatePickerVisible} mode="date" 
                onConfirm={(d) => { setSuaHeoThitNgay(formatVNDate(d)); setSuaHeoThitDatePickerVisible(false); }} 
                onCancel={() => setSuaHeoThitDatePickerVisible(false)} 
                confirmTextConfirm="Xác nhận" cancelText="Hủy" 
              />

              {/* 2. Lưới ô bấm chọn lại số Tuần Tuổi lô heo thịt */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 6, fontSize: 13, color: '#555555' }}>
                  {suaHeoThitActionType === 'Nhập Đàn' ? 'SỬA Tuần tuổi NHẬP ĐÀN:' : 'SỬA tuần tuổi BÁN / HAO HỤT'}
                </Text>
                
                                {/* ======================================================== */}
                {/* 📊 BẢN VÁ UX CAO CẤP: LƯỚI ĐÚNG 3 Ô 1 HÀNG CHỮ TO RÕ, PHẲNG SẠCH 100% */}
                {/* ======================================================== */}
                                {/* ======================================================== */}
                {/* 📊 BẢN VÁ LỘT XÁC POP-UP SỬA ĐỔI - PHẦN 1: CHIA GIAI ĐOẠN LƯỚI ĐÚNG 3 Ô 1 HÀNG (ĐÃ BỎ THEO MẸ) */}
                {/* ======================================================== */}
                <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 10, padding: 8, gap: 10 }}>
                  {(() => {
                    // 🎯 ĐÃ DỌN SẠCH THEO MẸ: Danh sách mảng phẳng bắt đầu nghiêm ngặt từ lứa Cai Sữa
                    const danhSachTatCaCacTuan = [
                      "4 Tuần ( Cai Sữa )", "5 Tuần", "6 Tuần", "7 Tuần", "8 Tuần", "9 Tuần",
                      "10 Tuần", "11 Tuần", "12 Tuần", "13 Tuần", "14 Tuần", "15 Tuần",
                      "16 Tuần", "17 Tuần", "18 Tuần", "19 Tuần", "20 Tuần",
                      "21 Tuần", "22 Tuần", "23 Tuần", "24 Tuần", "25 Tuần"
                    ];

                    // Hàm phụ tự động chèn Thanh Tiêu Đề Cắt Dòng tinh tế ngay tại đỉnh đầu của lứa tuần tương ứng
                    const bocNhanTieuDeGiaiDoan = (tuanKey) => {
                      if (tuanKey === "4 Tuần ( Cai Sữa )") return { tieuDe: "Giai đoạn 6kg - 15kg" };
                      if (tuanKey === "5 Tuần") return { tieuDe: "Giai đoạn 15 - 30kg" };
                      if (tuanKey === "10 Tuần") return { tieuDe: "Giai đoạn 30 - 60kg" };
                      if (tuanKey === "16 Tuần") return { tieuDe: "Giai đoạn 60 - 100kg" };
                      if (tuanKey === "21 Tuần") return { tieuDe: "Từ 100kg - Xuất Chuồng" };
                      return null;
                    };

                    let mauChuChuongCap = '#007bff';
                    if (suaHeoThitActionType === 'Hao Hụt') mauChuChuongCap = '#dc3545';
                    if (suaHeoThitActionType === 'Bán') mauChuChuongCap = '#28a745';

                    // Chặt mảng phẳng thành các dòng, mỗi dòng chứa đúng 3 ô vuông vắn
                    const danhSachHangBaO = [];
                    for (let i = 0; i < danhSachTatCaCacTuan.length; i += 3) {
                      danhSachHangBaO.push(danhSachTatCaCacTuan.slice(i, i + 3));
                    }

                    return (
                      <View style={{ gap: 5 }}>
                        {danhSachHangBaO.map((hangData, hangIdx) => (
                          <View key={`popup_edit_row3_fixed_${hangIdx}`} style={{ width: '100%' }}>
                            
                            {hangData.map((tuanKey, tIdx) => {
                              // Khơi nổ bộ dò tiêu đề: Chỉ chèn nhãn giải thích khi ô đầu tiên của lứa xuất hiện
                              const thongTinNhan = tIdx === 0 ? bocNhanTieuDeGiaiDoan(tuanKey) : null;

                              return (
                                <View key={`cell_block_edit_${hangIdx}_${tIdx}`}>
                                  
                                  {/* 🎯 TỰ ĐỘNG CHÈN THANH VÁCH NGĂN GIAI ĐOẠN CHÌM GỌN GÀNG */}
                                  {thongTinNhan && (
                                    <View style={{ borderBottomWidth: 0.5, borderBottomColor: '#dee2e6', paddingBottom: 3, marginBottom: 5, marginTop: hangIdx > 0 ? 8 : 2, paddingLeft: 2 }}>
                                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#495057', letterSpacing: 0.2 }}>
                                        {thongTinNhan.tieuDe}
                                      </Text>
                                    </View>
                                  )}

                                  {/* Chỉ nổ dòng bọc flexDirection ngang khi bắt đầu lặp hàng */}
                                  {tIdx === 0 && (
                                    <View style={{ flexDirection: 'row', gap: 5, marginBottom: 2 }}>
                                      {hangData.map((innerKey, innerIdx) => {
                                        let soConHienTai = "0";
                                        if (dataHeoThit) {
                                          soConHienTai = dataHeoThit[innerKey] !== undefined ? dataHeoThit[innerKey] : "0";
                                        }

                                        let chuHienThiNut = innerKey.replace(' Tuần', '').replace(' ( Cai Sữa )', '');
                                        if (chuHienThiNut === "4") chuHienThiNut = "Cai Sữa";
                                        else chuHienThiNut = `Tuần ${chuHienThiNut}`;

                                        const giaTriGuiDi = innerKey.replace(' Tuần ( Cai Sữa )', '').replace(' Tuần', '').trim();
                                        const laOThuocCheck = suaHeoThitTuanChon === giaTriGuiDi;

                                        return (
                                          <TouchableOpacity
                                            key={`edit_ht_box_grid3_fixed_${hangIdx}_${innerIdx}`}
                                            activeOpacity={0.7}
                                            onPress={() => setSuaHeoThitTuanChon(giaTriGuiDi)}
                                            style={{
                                              flex: 1, 
                                              height: 44, // Chiều cao rộng rãi cho ngón tay dễ chạm bấm
                                              borderRadius: 6,
                                              borderWidth: laOThuocCheck ? 2 : 1,
                                              borderColor: laOThuocCheck ? mauChuChuongCap : '#dee2e6',
                                              backgroundColor: laOThuocCheck ? mauChuChuongCap + '10' : '#ffffff', 
                                              alignItems: 'center', 
                                              justifyContent: 'center'
                                            }}
                                          >
                                            <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 11.5, fontWeight: '900', color: laOThuocCheck ? mauChuChuongCap : '#212529' }}>
                                              {chuHienThiNut}
                                            </Text>
                                            <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 10, fontWeight: 'bold', color: laOThuocCheck ? mauChuChuongCap : '#137333', marginTop: 2 }}>
                                              {soConHienTai} Con
                                            </Text>
                                          </TouchableOpacity>
                                        );
                                      })}
                                      {/* Đệm ô rỗng ẩn nếu hàng cuối cùng (Tuần 25 lẻ) bị thiếu ô để giữ nguyên tỷ lệ lề ngang */}
                                      {hangData.length < 3 && Array.from({ length: 3 - hangData.length }).map((_, rIdx) => (
                                        <View key={`void_popup_edit_cell_fixed_${rIdx}`} style={{ flex: 1 }} />
                                      ))}
                                    </View>
                                  )}

                                </View>
                              );
                            })}

                          </View>
                        ))}
                      </View>
                    );
                  })()}
                </View>


              </View>

              {/* 3. Ô nhập Số lượng con heo tác động thương phẩm (Hàng riêng 1) */}
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 12.5, color: '#333333' }}>🔢 Số lượng con heo tác động:</Text>
                <TextInput 
                  style={{ borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, height: 38, paddingHorizontal: 10, color: '#111111', fontSize: 14, fontWeight: 'bold', textAlign: 'center', backgroundColor: '#ffffff' }} 
                  keyboardType="numeric" 
                  value={suaHeoThitSoLuong} 
                  onChangeText={setSuaHeoThitSoCon} 
                />
              </View>

              {/* 4. Ô nhập Ghi Cú Sửa Đổi (Hàng riêng 2) */}
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 12.5, color: '#333333' }}>📝 Ghi chú lý do chi tiết:</Text>
                <TextInput 
                  style={{ borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, height: 38, paddingHorizontal: 10, color: '#111111', fontSize: 13, backgroundColor: '#ffffff' }} 
                  value={suaHeoThitGhiChu} 
                  onChangeText={setSuaHeoThitGhiChu} 
                />
              </View>

              {/* 5. Cụm hai nút Lưu sửa và Hủy bo góc phẳng */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity 
                  activeOpacity={0.6} onPress={() => setIsSuaHeoThitModalVisible(false)}
                  style={{ flex: 1, backgroundColor: '#6c757d', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13.5 }}>HỦY BỎ</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.6} onPress={handleLuuSuaHeoThit}
                  style={{ flex: 1, backgroundColor: '#ffc107', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#111111', fontWeight: 'bold', fontSize: 13.5 }}>LƯU SỬA</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

          </View>
        </View>
      </Modal>


    </KeyboardAvoidingView>
  
  );
}
export default function App() {
  
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
      <MainApp />
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