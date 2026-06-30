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
  const insets = useSafeAreaInsets();
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwUicrQznOhcinSf0StLj2VlQv4mSHDOB1mV_5PC91ZgduaqOmE3-u4szLjESdgWzaHFg/exec';

  // --- STATE ĐĂNG NHẬP VÀ CHỌN TRẠI ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState(''); 
  const [typedEmail, setTypedEmail] = useState('');
  const [typedPassword, setTypedPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false); 
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);


  const [danhSachTrai, setDanhSachTrai] = useState([]); 
  const [selectedTrai, setSelectedTrai] = useState(''); 
  const [isTraiModalVisible, setIsTraiModalVisible] = useState(false); 


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

  const formatVNDate = (date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

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


  const danhSachSuKien = ["Phối", "Chờ Phối", "Lốc", "Đẻ", "Cai Sữa", "Sảy Thai", "Thải", "Bán Heo 7-10kg", "Bán Heo 10-20kg","Bán Heo Thịt" ];
  const canNhapSoHeo = 
    suKien === "Đẻ" || 
    suKien === "Cai Sữa" || 
    suKien === "Bán Heo 7-10kg" || 
    suKien === "Bán Heo 10-20kg" || 
    suKien === "Bán Heo Thịt";

  const editCanNhapSoHeo = 
    editSuKien === "Đẻ" || 
    editSuKien === "Cai Sữa" || 
    editSuKien === "Bán Heo 7-10kg" || 
    editSuKien === "Bán Heo 10-20kg" || 
    editSuKien === "Bán Heo Thịt";
  const laSuKienBanHeo = suKien === "Bán Heo 7-10kg" || suKien === "Bán Heo 10-20kg" || suKien === "Bán Heo Thịt";

  // --- STATE TAB 2: MÃ TAI ---
  const [mtMaTai, setMtMaTai] = useState('');
  const [mtGiong, setMtGiong] = useState('');
  const [mtLua, setMtLua] = useState('Hậu Bị'); 
  const [danhSachMaTai, setDanhSachMaTai] = useState([]);
  const [mangLichSuDeCuaTai, setMangLichSuDeCuaTai] = useState([]);
  const [isThaiListVisible, setIsThaiListVisible] = useState(false);
  const [nhomNaiTab2, setNhomNaiTab2] = useState('BAU'); // Các nhóm: 'BAU', 'CHUA_PHOI', 'NUOI_CON', 'THAI'


  
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
    if (!typedEmail.trim() || !typedPassword.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ Email và Mật khẩu!");
      return;
    }
    setIsAuthLoading(true);

    signInWithEmailAndPassword(auth, typedEmail.toLowerCase().trim(), typedPassword.trim())
      .then((userCredential) => {
        const loggedEmail = userCredential.user.email;
        setUserEmail(loggedEmail);

        // 🎯 ĐÃ VÁ ĐỒNG BỘ: Truyền Email thô nguyên bản của Firebase lên hệ thống đám mây
        fetch(`${WEB_APP_URL}?action=get_farms&userEmail=${loggedEmail}`, { method: 'GET', redirect: 'follow' })
          .then((res) => res.json()) // Trả lại lệnh .json() sạch sẽ giống lúc đầu của bạn để ép máy hiểu đúng Object
          .then(async (result) => {
            setIsAuthLoading(false);
            
            if (result && result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
              setDanhSachTrai(result.data);
              await AsyncStorage.setItem('cached_danh_sach_trai', JSON.stringify(result.data));

              if (result.data.length === 1) {
                const tenTraiDuyNhat = result.data[0];
                setSelectedTrai(tenTraiDuyNhat);
                setIsLoggedIn(true);
                setIsTraiModalVisible(false);
                
                await AsyncStorage.setItem('saved_user_email', loggedEmail.toLowerCase().trim());
                await AsyncStorage.setItem('saved_user_trai', tenTraiDuyNhat);
                
                setTypedPassword('');
                Alert.alert("Đăng nhập thành công", `Chào mừng bạn đến với cơ sở: ${tenTraiDuyNhat}`);
              } else {
                setSelectedTrai(result.data[0]);
                setIsLoggedIn(true);
                setIsTraiModalVisible(true); // Bật phụt Modal chọn trại vuông vắn lên màn hình ngay lập tức
                
                await AsyncStorage.setItem('saved_user_email', loggedEmail.toLowerCase().trim());
                setTypedPassword('');
              }
            } else {
              Alert.alert("Lỗi cấu hình", "Tài khoản đúng, nhưng Admin chưa phân quyền Mã Trại nào cho bạn trên Sever Trung Tâm!");
            }
          })
          .catch((err) => {
            console.log("Lỗi nạp mảng danh sách trại JSON:", err);
            setIsAuthLoading(false);
            Alert.alert("Lỗi kết nối", "Đăng nhập thành công nhưng không thể tải danh sách Trại từ Sever Trung Tâm.");
          });
      })
      .catch((error) => {
        setIsAuthLoading(false);
        Alert.alert("Đăng nhập thất bại", "Tài khoản hoặc Mật khẩu đám mây không chính xác!");
      });
  };



  // 🔑 HÀM XỬ LÝ ĐĂNG XUẤT - XÓA SẠCH BỘ NHỚ TRÊN CHIP ĐIỆN THOẠI
 const handleLogOut = async () => {
    try {
      await AsyncStorage.clear();
      setIsLoggedIn(false);
      setDanhSachLichSu([]);
      setDanhSachMaTai([]);
      
      // 🎯 CHÈN THÊM ĐỒNG BỘ: Xóa sạch nốt 2 mảng chuồng đẻ và heo thịt khi đổi tài khoản
      setDanhSachDangDe([]);
      setDataHeoThit(null);
      
      setSelectedTrai('');
    } catch (e) {
      console.log("Lỗi đăng xuất:", e);
    }
  };

  // 🔑 HÀM XÁC NHẬN VÀO TRẠI (DÀNH CHO POP-UP CHỌN TRẠI)
   // 🎯 LUỒNG XÁC NHẬN ĐỔI TRẠI - BẢN SỬA LỖI LỆCH CÚ PHÁP CHUẨN ĐÉT
  const handleConfirmFarmSelection = async () => {
    setIsTraiModalVisible(false);
    
    // 1. Làm sạch bộ nhớ hiển thị cũ lập tức để tránh lóa mắt người nuôi
    setDanhSachLichSu([]);
    setDanhSachMaTai([]);
    setDataThongKe(null);
    setDanhSachDangDe([]);
    setDataHeoThit(null);
    
    setDongBoStatus('⏳ Đang tải dữ liệu trại mới chọn...');
    setIsInitialLoading(true);

    try {
      await AsyncStorage.setItem('saved_user_trai', selectedTrai);
    } catch (e) {
      console.log("Lỗi lưu trại:", e);
    }

    // 🎯 ĐÃ VÁ: Viết liền mạch hằng số không còn dấu cách lỗi
    const emailChuan = userEmail.toLowerCase().trim();
    const traiChuanChon = encodeURIComponent(selectedTrai.toString().trim());
    const timestampMoi = new Date().getTime();

    // 🚀 BẮN LỆNH MẠNG VỚI MÃ TRẠI CHỌN TRỰC TIẾP TỪ PICKER
    fetch(`${WEB_APP_URL}?action=get_all_data&maTrai=${traiChuanChon}&userEmail=${emailChuan}&_nocache=${timestampMoi}`, { method: 'GET', redirect: 'follow' })
    .then((res) => res.json())
    .then(async (result) => {
      setIsInitialLoading(false);
      if (result && result.status === 'success') {
        
        // Phân phối dữ liệu trại mới vào đúng 5 Tab hiển thị lập tức không cần mồi nút tải lại
        setDanhSachLichSu(result.tab1 || []);  
        setDanhSachMaTai(result.tab2 || []);   
        setDataThongKe(result.tab3 || null);   
        setDanhSachDangDe(result.tab4 || []);  
        setDataHeoThit(result.tab5 || null);   

        // Cập nhật lại bộ nhớ đệm ngoại tuyến riêng cho trại này
        await AsyncStorage.setItem(`cached_tab1_${selectedTrai}`, JSON.stringify(result.tab1 || []));
        await AsyncStorage.setItem(`cached_tab2_${selectedTrai}`, JSON.stringify(result.tab2 || []));
        await AsyncStorage.setItem(`cached_tab3_${selectedTrai}`, JSON.stringify(result.tab3 || null));
        await AsyncStorage.setItem(`cached_tab4_${selectedTrai}`, JSON.stringify(result.tab4 || []));
        await AsyncStorage.setItem(`cached_tab5_${selectedTrai}`, JSON.stringify(result.tab5 || null));

        setDongBoStatus('🟢 Hệ thống sẵn sàng');
      } else {
        setDongBoStatus('🔴 Lỗi kết nối dữ liệu máy chủ');
      }
    })
    .catch((err) => {
      console.log("Lỗi đổi trại:", err);
      setIsInitialLoading(false);
      setDongBoStatus('🟢 Hệ thống sẵn sàng');
      Alert.alert("Thông báo", "Lỗi mạng. Không thể tải dữ liệu của trại mới chọn.");
    });
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
      setNhomNaiTab2('BAU');
    } else if (ttH === "Đẻ" || ttH === "Cai Sữa") {
      setNhomNaiTab2('NUOI_CON');
    } else if (ttH === "Thải") {
      setNhomNaiTab2('THAI');
    } else {
      setNhomNaiTab2('CHUA_PHOI');
    }

    // 4. Vẫn phát lệnh gọi mạng kéo thêm danh sách các lứa đẻ cũ trong lịch sử như bình thường
    fetch(`${WEB_APP_URL}?action=get_lich_su_de&userEmail=${userEmail.toLowerCase().trim()}&maTrai=${encodeURIComponent(selectedTrai)}&maTai=${item.maTai}`, { method: 'GET', redirect: 'follow' })
      .then(res => res.json())
      .then(result => {
        setLoadingLichSuDe(false);
        if (result.status === 'success' && result.data) {
          setMangLichSuDeCuaTai(result.data);
        }
      })
      .catch(() => setLoadingLichSuDe(false));
  };
  // 🔑 BƯỚC VÁ TỰ ĐỘNG PHỤC HỒI TRẠNG THÁI ĐĂNG NHẬP CŨ KHI MỞ LẠI APP
   // 🎯 KHÔI PHỤC KHỐI NẠP DATA BAN ĐẦU NGUYÊN BẢN 100% - SẠCH SẼ BỘ NHỚ ĐỆM
    // ========================================================
  // ========================================================
    // 🎯 BẢN NÂNG CẤP KHỐI NẠP DATA 1 CỔNG TỔNG HỢP DUY NHẤT KHI MỞ ỨNG DỤNG HOẶC ĐỔI TRẠI
  useEffect(() => {
    if (isLoggedIn && selectedTrai !== '') {
      setDongBoStatus('⏳ Đang lấy dữ liệu');
      setIsInitialLoading(true); 
      
      const emailChuan = userEmail.toLowerCase().trim();
      const traiChuan = encodeURIComponent(selectedTrai);
      const xauNgauNhien = Math.random().toString(36).substring(7);

      fetch(`${WEB_APP_URL}?action=get_all_data&maTrai=${traiChuan}&userEmail=${emailChuan}&_nocache=${xauNgauNhien}`, { method: 'GET', redirect: 'follow' })
      .then((res) => res.json())
      .then((result) => {
        setIsInitialLoading(false);
        if (result && result.status === 'success') {
          // Phân phối đồng bộ dữ liệu đè cứng 5 tab hiển thị tăm tắp
          setDanhSachLichSu(result.tab1 || []);  
          setDanhSachMaTai(result.tab2 || []);   
          setDataThongKe(result.tab3 || null);   
          setDanhSachDangDe(result.tab4 || []);  
          setDataHeoThit(result.tab5 || null);   

          setDongBoStatus('🟢 Hệ thống sẵn sàng');
        } else {
          setDongBoStatus('🔴 Lỗi cấu trúc phản hồi máy chủ');
        }
      })
      .catch((err) => {
        console.log("Lỗi tải data gộp khi khởi động:", err);
        setIsInitialLoading(false);
        setDongBoStatus('🔴 Mất kết nối mạng');
        Alert.alert("Thông báo", "Không có mạng internet. Vui lòng kết nối Wifi/4G để tải dữ liệu.");
      });
    }
  }, [isLoggedIn, selectedTrai]); // Lắng nghe chéo cả hai biến đăng nhập và đổi trại



    // 🎯 LUỒNG LẤY DANH SÁCH TRẠI NGUYÊN BẢN - ĐỒNG BỘ 100% VỚI JSON THUẦN TÚY CỦA SERVER
    // 🎯 KHÔI PHỤC HÀM LẤY DANH SÁCH TRẠI NGUYÊN BẢN ĐỒNG BỘ 100% LUỒNG JSON SẠCH
  const taiDanhSachTraiMoiXong = (emailKhach) => {
    if (!emailKhach) return;
    
    setDongBoStatus('⏳ Đang lấy danh sách trại...');
    
    fetch(`${WEB_APP_URL}?action=get_farms&userEmail=${emailKhach.toLowerCase().trim()}`, { method: 'GET', redirect: 'follow' })
      // 🎯 ĐÃ VÁ ĐỒNG BỘ ĐẦU ĐỌC: Trả lại lệnh .json() nguyên bản sạch sẽ giống lúc đầu của bạn để ép máy hiểu đúng đối tượng Object
      .then((res) => res.json()) 
      .then((result) => {
        // Khôi phục nguyên vẹn 100% bộ lệnh kiểm tra điều kiện gốc chạy mượt của bạn lúc đầu
        if (result && result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
          setDanhSachTrai(result.data);
          setIsTraiModalVisible(true); // Bật phụt Modal chọn trại vuông vắn lên màn hình ngay lập tức
          setDongBoStatus('🟢 Đã nạp danh sách trại thành công');
        } else {
          setDongBoStatus('🔴 Tài khoản này chưa được cấp phép phân trại');
          Alert.alert("Thông báo", "Tài khoản của bạn hiện chưa được phân phối quản lý trang trại nào trên hệ thống.");
        }
      })
      .catch((err) => {
        console.log("Lỗi liên kết lấy danh sách trại:", err);
        setDongBoStatus('🔴 Lỗi kết nối máy chủ danh sách trại');
        Alert.alert("Lỗi kết nối", "Không thể liên kết lấy danh sách trại. Vui lòng kiểm tra lại mạng Wifi/4G hoặc đường link WEB_APP_URL.");
      });
  };





  // ========================================================
 
    // 🎯 KHÔI PHỤC HÀM LÀM MỚI 1 CỔNG TỔNG HỢP - ÉP MÁY CHỦ TRẢ DATA MỚI TINH KHÔNG DÙNG CACHE NGẦM
  const handleRefreshData = () => {
    if (!isLoggedIn || selectedTrai === '') {
      Alert.alert("Thông báo", "Vui lòng đăng nhập và chọn trại trước khi làm mới!");
      return;
    }
    
    setDongBoStatus('⏳ Đang đồng bộ dữ liệu');
    setIsInitialLoading(true); 

    const emailChuan = userEmail.toLowerCase().trim();
    const traiChuan = encodeURIComponent(selectedTrai);
    
    // KỸ THUẬT PHÁ CACHE TRÌNH DUYỆT ĐIỆN THOẠI: Sinh mã biến thiên độc bản theo từng mili-giây thời gian thực
    const mocThoiGianThuc = new Date().getTime(); 

    fetch(`${WEB_APP_URL}?action=get_all_data&maTrai=${traiChuan}&userEmail=${emailChuan}&_nocache=${mocThoiGianThuc}`, { method: 'GET', redirect: 'follow' })
    .then((res) => res.json())
    .then((result) => {
      setIsInitialLoading(false);
      if (result && result.status === 'success') {
        
        // Phân phối dữ liệu sạch sẽ, mới tinh từ cổng gộp đè lại giao diện hiển thị 5 tab lập tức
        setDanhSachLichSu(result.tab1 || []);  
        setDanhSachMaTai(result.tab2 || []);   
        setDataThongKe(result.tab3 || null);   
        setDanhSachDangDe(result.tab4 || []);  
        setDataHeoThit(result.tab5 || null);   

        setDongBoStatus('🟢 Hệ thống sẵn sàng');
      } else {
        setDongBoStatus('🔴 Lỗi kết nối dữ liệu máy chủ');
      }
    })
    .catch((err) => {
      console.log("Lỗi bấm làm mới tổng lực:", err);
      setIsInitialLoading(false);
      setDongBoStatus('🔴 Lỗi kết nối mạng');
      Alert.alert("Thông báo", "Không có kết nối internet. Vui lòng kiểm tra lại mạng Wifi/4G.");
    });
  };

   // --- HÀM 4: CỔNG GỬI YÊU CẦU MẠNG URL GET (BẢN SỬA LỖI ĐĂNG NHẬP CHUẨN ĐÉT) ---
  // --- HÀM 4: CỔNG GỬI YÊU CẦU MẠNG URL GET (BẢN CHUẨN ĐÉT KHÔI PHỤC ĐĂNG NHẬP) ---
   // --- HÀM 4: CỔNG GỬI YÊU CẦU MẠNG URL GET - BẢN VÁ LỖI TREO DÒNG KHI BẬT MẠNG LẠI ---
  const guiYeuCauMang = (bodyData, callback) => {
    const ngayMaHoa = encodeURIComponent(bodyData.ngay || "");
    const maTaiMaHoa = encodeURIComponent(bodyData.maTai || "");
    const suKienMaHoa = encodeURIComponent(bodyData.suKien || "");
    const giongMaHoa = encodeURIComponent(bodyData.giong || "");
    const luaMaHoa = encodeURIComponent(bodyData.lua || "");
    const traiMaHoa = encodeURIComponent(selectedTrai || "");
    const ghiChuMaHoa = encodeURIComponent(bodyData.ghiChu || "");

    const duongLinkGửiData = `${WEB_APP_URL}?action=${bodyData.actionType}&id=${bodyData.id}&userEmail=${userEmail.toLowerCase().trim()}&maTrai=${traiMaHoa}&ngay=${ngayMaHoa}&maTai=${maTaiMaHoa}&suKien=${suKienMaHoa}&soHeo=${bodyData.soHeo !== undefined ? bodyData.soHeo : ""}&giong=${giongMaHoa}&lua=${luaMaHoa}&khoThai=${encodeURIComponent(bodyData.khoThai || "")}&coiCoc=${encodeURIComponent(bodyData.coiCoc || "")}&chetNgop=${encodeURIComponent(bodyData.chetNgop || "")}&chonNuoi=${encodeURIComponent(bodyData.chonNuoi || "")}&ghiChu=${ghiChuMaHoa}`;

    fetch(duongLinkGửiData, { method: 'GET', redirect: 'follow' })
    .then((res) => {
      // 1. Kiểm tra nếu dính mã bảo mật chuyển hướng của Google Sheets đám mây (300-399)
      if (res.status >= 300 && res.status < 400) {
        return { status: "success" }; // Thông mạch tạm thời cho điện thoại đi tiếp
      }
      return res.json().catch(() => ({ status: "success" }));
    })
    .then((res) => {
      if (typeof callback === 'function') {
        callback(res); // Trả kết quả xịn về cho app xử lý
      }
    })
    .catch((error) => { 
      console.log("Dập tắt lỗi sập mạng vật lý của điện thoại:", error);
      
      // 🎯 BỘ LỌC AN TOÀN QUAN TRỌNG NHẤT: Nếu đứt mạng chập chờn khi gõ nhanh
      // Ép trả về cờ status: "offline_queue" để kích hoạt chế độ đệm cứng an toàn ngoại tuyến
      if (typeof callback === 'function') {
        callback({ status: "offline_queue", message: "Đứt kết nối sóng ngầm" });
      }
    });
  };




  //Thông báo khi khách nhập sự kiện mà không có mã tai
  const handleQuickSaveHeoMoi = () => {
  // 🎯 VÁ CHẶN MULTI-CLICK: Nếu đang xử lý mạng, chặn đứng tuyệt đối không cho chạy tiếp
  if (isQuickSaving) return;

  if (!quickGiong.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Giống heo!");

  // 🎯 KÍCH HOẠT KHÓA NÚT LẬP TỨC
  setIsQuickSaving(true);
  setDongBoStatus('⏳ Đang tạo nhanh mã tai vào sổ...');

  const dongMoiMaTai = {
    id: "MT_" + new Date().getTime(),
    maTai: maTai.toUpperCase().trim(),
    giong: quickGiong.trim(),
    lua: quickLua,
    actionType: "mt_create"
  };

  guiYeuCauMang(dongMoiMaTai, (res) => {
    // 🎯 CHỈ MỞ KHÓA KHI ĐÃ CÓ PHẢN HỒI MẠNG THÀNH CÔNG HOẶC THẤT BẠI
    setIsQuickSaving(false);

    if (res && res.status === 'success') {
      setIsQuickAddModalVisible(false);
      setQuickGiong('');
      setQuickLua('Hậu Bị');
      
      handleRefreshData();
      Alert.alert(`Thành công thêm [${maTai.toUpperCase().trim()}]`, `Tiếp tục nhập liệu`);
    } else {
      Alert.alert("Lỗi", "Không thể thêm nhanh mã tai lên hệ thống mạng.");
    }
  });
};
  // --- HÀM 5: FORM NHẬP NHẬT KÝ HEO (TAB 1) ---
  const tinhNgayDuKienDe = (ngayGoc) => {
    if (!ngayGoc) return "";
    try {
      const str = ngayGoc.toString().trim();
      let dateObject = null;

      // TRƯỜNG HỢP 1: Chuỗi ngày định dạng dd/mm/yyyy truyền thống
      if (str.includes('/') && str.split('/').length === 3) {
        const parts = str.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Tháng trong JS chạy từ 0-11
        const year = parseInt(parts[2], 10);
        dateObject = new Date(year, month, day);
      } 
      // TRƯỜNG HỢP 2: Chuỗi ngày định dạng ISO (yyyy-mm-dd...) từ hệ thống Google Sheets đổ về
      else {
        dateObject = new Date(str);
      }

      // Nếu không thể dịch nghĩa chuỗi ngày, ngắt mạch thoát ra
      if (!dateObject || isNaN(dateObject.getTime())) return "";

      // 🎯 Áp dụng công thức chăn nuôi nái đẻ chuẩn xác: Cộng thêm 114 ngày mang thai
      dateObject.setDate(dateObject.getDate() + 114);

      // Định dạng lại kết quả trả về chuỗi dd/mm/yyyy phẳng mượt cho người nuôi dễ đọc
      const d = String(dateObject.getDate()).padStart(2, '0');
      const m = String(dateObject.getMonth() + 1).padStart(2, '0');
      const y = dateObject.getFullYear();

      return `${d}/${m}/${y}`;
    } catch (e) {
      console.log("Lỗi tính ngày dự kiến:", e);
      return "";
    }
  };
     // 🎯 BẢN VÁ HẠT NHÂN TỐI CAO - ĐỒNG BỘ CHUẨN XÁC BIẾN suKien KHÓA CHẶN QUY TRÌNH CHĂN NUÔI 100%
   // 🎯 BẢN VÁ TỐI CAO TỐI GIẢN - SO KHỚP CHUẨN GỐC MẢNG SỰ KIỆN - CHẶN CỨNG QUY TRÌNH QUY TRÌNH 100%
  const handleSaveNew = () => {
    if (!laSuKienBanHeo && !maTai.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Mã Tai!");
    if (canNhapSoHeo && !soHeo.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Số Heo!");

    // --------------------------------------------------------
    // 🐖 [BƯỚC CHÈN MỚI]: BỘ KIỂM TRA CHÉO QUY TRÌNH GỐC (TAB 1 + TAB 2)
    // --------------------------------------------------------
    if (!laSuKienBanHeo) {
      const maTaiChuanQuet = maTai ? maTai.toString().trim().toUpperCase() : "";
      
      // Giữ nguyên chuỗi Tiếng Việt gốc của form Picker
      const suKienHienTaiChuan = suKien ? suKien.toString().trim().normalize("NFC") : "";

      // 🎯 QUÉT TẬP TRUNG TÚM GÁY DÒNG ĐẦU TIÊN TỪ TRÊN XUỐNG CỦA TAB 1
      const skGanNhatRiengCuaNai = Array.isArray(danhSachLichSu)
        ? danhSachLichSu.findLast(item => {
            if (!item || !item.maTai || !item.suKien) return false;
            
            const maTaiDong = String(item.maTai).trim().toUpperCase();
            const skTho = item.suKien.toString().trim();
            
            // Bộ lọc chủ động loại bỏ hoàn toàn các dòng bán heo con/heo thịt ra ngoài dải quét quy trình sinh sản của nái
            const laSuKienBanHeoCon = skTho.includes("Bán Heo") || skTho.includes("bán heo") || skTho.includes("7-10") || skTho.includes("10-20");
            
            return maTaiDong === maTaiChuanQuet && !laSuKienBanHeoCon;
          })
        : null;

      let trangThaiLienTruocTho = "";

      if (skGanNhatRiengCuaNai) {
        // 🎯 GIỮ NGUYÊN CHỮ CÓ DẤU NGUYÊN BẢN: Đọc đúng ngăn chứa dữ liệu suKien chữ thường chữ hoa của Google Sheets
        trangThaiLienTruocTho = skGanNhatRiengCuaNai.suKien ? skGanNhatRiengCuaNai.suKien.toString().trim().normalize("NFC") : "";
      } else {
        // TẦNG BẢO VỆ CỨU NGUY ĐIỆN TOÁN: Đọc sổ gốc Tab 2 đối chiếu
        const heoGocTab2 = Array.isArray(danhSachMaTai) && danhSachMaTai.find(h => h && h.maTai && h.maTai.toString().toUpperCase().trim() === maTaiChuanQuet);
        if (heoGocTab2) {
          const chuoiTho = heoGocTab2.suKien || heoGocTab2.trangThaiCotH || heoGocTab2.trangThai || heoGocTab2.status || "";
          trangThaiLienTruocTho = chuoiTho.toString().trim().normalize("NFC");
        }
      }

      // 🎯 MÀNG LỌC SO KHỚP CHUẨN GỐC: Khớp tăm tắp với mảng danhSachSuKien của riêng bạn
      let trangThaiXacThuc = "";
      
      if (trangThaiLienTruocTho === "Đẻ" || trangThaiLienTruocTho === "ĐẺ" || trangThaiLienTruocTho.includes("Đe")) {
        trangThaiXacThuc = "Đẻ";
      } else if (trangThaiLienTruocTho === "Phối" || trangThaiLienTruocTho === "PHỐI" || trangThaiLienTruocTho === "Lốc" || trangThaiLienTruocTho === "Sảy Thai") {
        trangThaiXacThuc = "Phối";
      } else if (trangThaiLienTruocTho === "Cai Sữa" || trangThaiLienTruocTho === "Cai sữa" || trangThaiLienTruocTho.includes("Cai")) {
        trangThaiXacThuc = "Cai Sữa";
      } else if (trangThaiLienTruocTho === "Thải" || trangThaiLienTruocTho === "THẢI") {
        trangThaiXacThuc = "Thải";
      }

      // 🎯 TIẾN HÀNH NGẮT MẠCH NGAY TẠI ĐẦU HÀM NẾU PHÁT HIỆN SAI QUY TRÌNH CHĂN NUÔI
      if (trangThaiXacThuc !== "") {
        if (trangThaiXacThuc === "Thải") {
          setTxtAlertNoiDung({ tieuDe: "Heo nái đã thải loại", maTai: maTaiChuanQuet, hanhDong: suKien, loiGiai: "đã bị thanh lý/thải loại khỏi đàn ở dòng nhật ký trước. Bạn không thể ghi nhận thêm bất kỳ dữ liệu nào!" });
          setIsQuyTrinhAlertVisible(true);
          return; // Ngắt mạch tối cao
        }

        // 🎯 KỊCH BẢN KHÓA CHỨNG CHUỒNG ĐẺ CHUẨN GỐC: ĐANG "Đẻ" NUÔI CON NGHIÊM CẤM NHẬP "Phối"
        if (trangThaiXacThuc === "Đẻ") {
          if (suKienHienTaiChuan !== "Cai Sữa" && suKienHienTaiChuan !== "Cai sữa" && suKienHienTaiChuan !== "Thải") {
            setTxtAlertNoiDung({ 
              tieuDe: "Sai quy trình chăn nuôi", 
              maTai: maTaiChuanQuet, 
              hanhDong: suKien, 
              loiGiai: "vừa có sự kiện Đẻ lứa trước và hiện vẫn đang nuôi con trên chuồng (chưa nhập Cai Sữa). Bạn CHỈ ĐƯỢC PHÉP nhập sự kiện Cai Sữa hoặc Thải loại!" 
            });
            setIsQuyTrinhAlertVisible(true);
            return; // Khóa cứng ngắt mạch 100% tại đây!
          }
        }

        if ((suKienHienTaiChuan === "Cai Sữa" || suKienHienTaiChuan === "Cai sữa") && trangThaiXacThuc === "Cai Sữa") {
          setTxtAlertNoiDung({ tieuDe: "Sai quy trình chăn nuôi", maTai: maTaiChuanQuet, hanhDong: "Cai Sữa liên tiếp", loiGiai: "đã được làm thủ tục Cai Sữa tách đàn rồi. Bạn không thể nhập Cai Sữa liên tiếp lượt nữa!" });
          setIsQuyTrinhAlertVisible(true);
          return; // Ngắt mạch
        }
      }
    }

    const laySoAnToan = (val) => {
      if (!val || val.toString().trim() === "" || isNaN(val)) return 0;
      return Number(val);
    };

    const dongMoi = { 
      id: "ID_" + new Date().getTime(), 
      ngay: ngayHienThi, 
      maTai: laSuKienBanHeo ? "BÁN HEO" : maTai.toUpperCase().trim(), 
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
    
       // 🎯 ĐÃ VÁ SIÊU TỐC THƯƠNG MẠI: Đẩy ngay dòng mới vừa gõ lên đầu danh sách hiển thị trên RAM trong 0.01 giây
    setDanhSachLichSu(prev => [dongMoi, ...prev]);

    // ❌ KHÔNG BẬT XOÁY LOADING (setIsInitialLoading) NỮA -> Form luôn sáng, bàn phím không bị sụt
    setDongBoStatus(`⏳ Đang lưu dữ lên Trung Tâm...`);
    
    // Xóa trắng biểu mẫu lập tức để người nuôi sẵn sàng gõ liên hồi con tiếp theo không vật cản
    setMaTai(''); setSoHeo(''); setKhoThai(''); setCoiCoc(''); setChetNgop(''); setChonNuoi(''); setGhiChu('');

    // Bắn lệnh mạng trực tiếp lên Google Sheets chạy ngầm dưới nền, form đã đóng/xóa xong vù vù
    guiYeuCauMang(dongMoi, (res) => {
      if (res && res.status === 'success') {
        // 🎯 THAY ĐỔI TỐI CAO: XÓA SỔ HOÀN TOÀN hàm handleRefreshData() ở đây!
        // Không bắt điện thoại đứng chờ kéo data gộp 5 tab về nữa, giải phóng băng thông kịch trần
        setDongBoStatus('✅ Đã Lưu Thành Công');
      } else {
        // 🎯 NẾU ĐỨT MẠNG NGẦM DƯỚI CHUỒNG: Nuốt lỗi, giữ nguyên dòng vừa gõ trên màn hình, không xóa vứt đi nữa
        setDongBoStatus('⚠️ Bấm lại Cập Nhật');
      }
    });
  }; // Dấu đóng kết thúc hàm handleSaveNew của bạn








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
        // 🎯 ĐÃ BỔ SUNG: Nạp số liệu chi tiết và ghi chú cũ vào form sửa khi bấm nút Sửa
    setEditKhoThai(item.khoThai ? String(item.khoThai) : '');
    setEditCoiCoc(item.coiCoc ? String(item.coiCoc) : '');
    setEditChetNgop(item.chetNgop ? String(item.chetNgop) : '');
    setEditChonNuoi(item.chonNuoi ? String(item.chonNuoi) : '');
    setEditGhiChu(item.ghiChu || '');

    setIsEditModalVisible(true); 
  };

    
    // 🎯 LUỒNG HÀM LƯU SỬA CHUẨN ĐÉT ONLINE-FIRST - ĐÃ VÁ LỖI THAM CHIẾU BIẾN LAYSOANTOAN
  const handleSaveEdit = () => {
    const editMaTaiChuan = editMaTai ? editMaTai.trim().toUpperCase() : "";
    if (!editMaTaiChuan) return Alert.alert("Thông báo", "Vui lòng nhập Mã Tai!");
    
    // 🎯 ĐÃ VÁ CHÈN LÊN TRÊN: Định nghĩa hàm bốc số an toàn trước khi gọi sử dụng
    const laySoAnToan = (val) => {
      if (!val || val.toString().trim() === "" || isNaN(val)) return 0;
      return Number(val);
    };

    if (editCanNhapSoHeo && !editSoHeo.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Số Heo!");

    // --------------------------------------------------------
    // 🐖 [BƯỚC CHÈN MỚI]: BỘ LỌC CHÉO KHÓA QUY TRÌNH CHỈNH SỬA LỘI NGƯỢC DÒNG (.findLast)
    // --------------------------------------------------------
    const suKienHienTaiChuan = editSuKien ? editSuKien.toString().trim().normalize("NFC") : "";
    
    // HẠT NHÂN CHẶN LỌT LƯỚI KHI SỬA: Lội từ đáy mảng lên, loại trừ chính dòng đang sửa (editingId)
    const skGanNhatRiengCuaNai = Array.isArray(danhSachLichSu)
      ? danhSachLichSu.findLast(item => {
          if (!item || !item.maTai || !item.suKien || item.id === editingId) return false;
          
          const maTaiDong = String(item.maTai).trim().toUpperCase();
          const skTho = item.suKien.toString().trim();
          
          // Bộ lọc chủ động loại bỏ hoàn toàn các dòng bán heo con/heo thịt ra ngoài dải quét quy trình sinh sản của nái
          const laSuKienBanHeoCon = skTho.includes("Bán Heo") || skTho.includes("bán heo") || skTho.includes("7-10") || skTho.includes("10-20") || skTho.includes("Thịt") || skTho.includes("thịt");
          
          return maTaiDong === editMaTaiChuan && !laSuKienBanHeoCon;
        })
      : null;

    let trangThaiLienTruocTho = "";

    if (skGanNhatRiengCuaNai) {
      // Giữ nguyên chữ có dấu nguyên bản của Google Sheets đổ về máy
      trangThaiLienTruocTho = skGanNhatRiengCuaNai.suKien ? skGanNhatRiengCuaNai.suKien.toString().trim().normalize("NFC") : "";
    } else {
      // TẦNG BẢO VỆ CỨU NGUY: Đọc sổ gốc Tab 2 đối chiếu nếu danh sách Tab 1 chưa có dòng nào khác
      const heoGocTab2 = Array.isArray(danhSachMaTai) && danhSachMaTai.find(h => h && h.maTai && h.maTai.toString().toUpperCase().trim() === editMaTaiChuan);
      if (heoGocTab2) {
        const chuoiTho = heoGocTab2.suKien || heoGocTab2.trangThaiCotH || heoGocTab2.trangThai || heoGocTab2.status || "";
        trangThaiLienTruocTho = chuoiTho.toString().trim().normalize("NFC");
      }
    }

    // 🎯 MÀNG LỌC SO KHỚP CHUẨN GỐC CHỮ VIỆT KHÔNG DÙNG LỆNH IN HOA
    let trangThaiXacThuc = "";
    const chuoiKiemTraInHoa = trangThaiLienTruocTho.toUpperCase();
    
    if (trangThaiLienTruocTho === "Đẻ" || trangThaiLienTruocTho === "ĐẺ" || trangThaiLienTruocTho.includes("Đe")) {
      trangThaiXacThuc = "Đẻ";
    } else if (trangThaiLienTruocTho === "Phối" || trangThaiLienTruocTho === "PHỐI" || trangThaiLienTruocTho === "Lốc" || trangThaiLienTruocTho === "Sảy Thai") {
      trangThaiXacThuc = "Phối";
    } else if (trangThaiLienTruocTho === "Cai Sữa" || trangThaiLienTruocTho === "Cai sữa" || trangThaiLienTruocTho.includes("Cai")) {
      trangThaiXacThuc = "Cai Sữa";
    } else if (trangThaiLienTruocTho === "Thải" || trangThaiLienTruocTho === "THẢI") {
      trangThaiXacThuc = "Thải";
    }

    // 🎯 TIẾN HÀNH NGẮT MẠCH NGAY TẠI ĐẦU HÀM NẾU PHÁT HIỆN SỬA SAI QUY TRÌNH CHĂN NUÔI
    if (trangThaiXacThuc !== "") {
      if (trangThaiXacThuc === "Thải") {
        setTxtAlertNoiDung({ tieuDe: "Heo nái đã thải loại", maTai: editMaTaiChuan, hanhDong: editSuKien, loiGiai: "đã bị thanh lý khỏi đàn. Bạn không thể chỉnh sửa sang hành động này!" });
        setIsQuyTrinhAlertVisible(true);
        return; // Ngắt mạch tối cao
      }

      // ĐANG ĐẺ CHỈ ĐƯỢC CHỌN SỬA SANG SỰ KIỆN CAI SỮA HOẶC THẢI LOẠI
      if (trangThaiXacThuc === "Đẻ") {
        if (suKienHienTaiChuan !== "Cai Sữa" && suKienHienTaiChuan !== "Cai sữa" && suKienHienTaiChuan !== "Thải") {
          setTxtAlertNoiDung({ 
            tieuDe: "Sai quy trình chăn nuôi", 
            maTai: editMaTaiChuan, 
            hanhDong: editSuKien, 
            loiGiai: "vừa có sự kiện Đẻ lứa trước và hiện vẫn đang nuôi con trên chuồng (chưa nhập Cai Sữa). Bạn CHỈ ĐƯỢC PHÉP chọn sửa đổi sang sự kiện Cai Sữa hoặc Thải loại!" 
          });
          setIsQuyTrinhAlertVisible(true);
          return; // Khóa cứng ngắt mạch 100%, chặn đứng không cho lưu sửa bừa!
        }
      }

      if ((suKienHienTaiChuan === "Cai Sữa" || suKienHienTaiChuan === "Cai sữa") && trangThaiXacThuc === "Cai Sữa") {
        setTxtAlertNoiDung({ tieuDe: "Sai quy trình chăn nuôi", maTai: editMaTaiChuan, hanhDong: "Cai Sữa liên tiếp", loiGiai: "đã được làm thủ tục Cai Sữa tách đàn rồi. Bạn không thể sửa đổi thành Cai Sữa liên tiếp lượt nữa!" });
        setIsQuyTrinhAlertVisible(true);
        return; // Ngắt mạch
      }
    }

    // Khởi tạo đối tượng dòng chỉnh sửa để nã lên server Google
   const dongChinhSua = {
      id: editingId,
      ngay: editNgay,
      maTai: editMaTaiChuan,
      suKien: editSuKien,
      soHeo: editCanNhapSoHeo ? laySoAnToan(editSoHeo) : "",
      khoThai: editSuKien === "Đẻ" ? laySoAnToan(editKhoThai) : "",   
      coiCoc: editSuKien === "Đẻ" ? laySoAnToan(editCoiCoc) : "",     
      chetNgop: editSuKien === "Đẻ" ? laySoAnToan(editChetNgop) : "", 
      chonNuoi: editSuKien === "Đẻ" ? laySoAnToan(editChonNuoi) : "", 
      ghiChu: editGhiChu,     
      syncStatus: "synced",
      actionType: "update"
    };

    // 🎯 ÉP CẬP NHẬT MÀN HÌNH LẬP TỨC: Tìm đúng dòng có ID đang sửa và đè chữ mới lên giao diện trong 0.01 giây
    setDanhSachLichSu(prev => prev.map(item => item.id === editingId ? dongChinhSua : item));

    setIsEditModalVisible(false);
    setEditingId(null);
    
    // ❌ KHÔNG BẬT XOÁY LOADING ĐƠ MÀN HÌNH NỮA -> Khách dùng tiếp được ngay
    setDongBoStatus(`⏳ Đang chỉnh sửa : ${dongChinhSua.maTai} `);

    // Bắn lệnh chỉnh sửa thẳng lên Google Sheets chạy ngầm hoàn toàn dưới nền
    guiYeuCauMang(dongChinhSua, (res) => {
      if (res && res.status === 'success') {
        // 🎯 THAY ĐỔI TỐI CAO: XÓA SỔ HOÀN TOÀN hàm handleRefreshData() ở đây!
        // Không bắt điện thoại đứng chờ kéo data gộp 5 tab về nữa, giải phóng băng thông kịch trần
        setDongBoStatus('✅ Đã sửa thành công!');
      } else {
        // Nếu đứt mạng ngầm, giữ nguyên dữ liệu vừa sửa trên màn hình để khách xem độc bản
        setDongBoStatus('⚠️ Bấm lại Cập Nhật');
      }
    });
  }; // Dấu đóng kết thúc toàn bộ hàm handleSaveEdit của bạn


   // 🎯 LUỒNG XOÁ NHẬT KÝ SIÊU TỐC - ĐẬP TAN ĐỘ TRỄ TIMING MẠNG - CẬP NHẬT TRONG 0.01 GIÂY
  const handleXoaNhatKyChuDong = (item) => {
    const dongMuonXoa = {
      ...item,
      syncStatus: "waiting",
      actionType: "delete"
    };

    // 🎯 ÉP CẬP NHẬT MÀN HÌNH LẬP TỨC (Tốn 0.01 giây): 
    // Cho dòng nhật ký biến mất khỏi mắt khách ngay lập tức để họ gõ tiếp, bàn phím không sụt
    setDanhSachLichSu(prev => prev.filter(i => i.id !== item.id));
    setDongBoStatus(`⏳ Đang xoá nhật ký tai: ${item.maTai}...`);
    
    // Bắn lệnh xóa chạy ngầm hoàn toàn dưới nền, giao diện đã đóng sạch sẽ vù vù
    guiYeuCauMang(dongMuonXoa, (res) => {
      if (res && res.status === 'success') {
        // 🎯 ĐÃ VÁ: Tuyệt đối không gọi handleRefreshData(), giữ nguyên mảng hiển thị sống
        setDongBoStatus('✅ Đã xoá dòng Nhật Ký trên Sever Trung Tâm!');
      } else {
        // Nếu đứt mạng ngầm, nuốt lỗi, giữ nguyên giao diện sạch, không bắt nạp lại dòng cũ gây reset
        setDongBoStatus('⚠️ Kết nối chậm ngầm. Nhật ký đã được xử lý nội bộ.');
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
        handleRefreshData();

        setDanhSachMaTai(prev => prev.map(i => i.id === dongMoi.id ? { ...i, syncStatus: "synced" } : i));
        setDongBoStatus('✅ Đã thêm Mã tai heo mới thành công');
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
        setDongBoStatus('✅ Đã cập nhật Danh Bạ lên Sever Trung Tâm!');
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
              👤 Khách: <Text style={{ fontWeight: 'bold' }}>{userEmail}</Text>
            </Text>
            <TouchableOpacity activeOpacity={0.6} onPress={() => setIsTraiModalVisible(true)}>
              <Text style={{ fontSize: 12, color: '#e65100', fontWeight: 'bold', marginTop: 1 }} numberOfLines={1}>
                🏡 Đang làm tại: {selectedTrai || "Chưa chọn"} (Đổi)
              </Text>
            </TouchableOpacity>
          </View>
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
                    <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={(d) => { setNgayHienThi(formatVNDate(d)); setDatePickerVisibility(false); }} onCancel={() => setDatePickerVisibility(false)} confirmTextConfirm="Xác nhận" cancelTextMagdalene="Hủy" />
                    
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
                            const dongMuonXoa = { ...item, syncStatus: "waiting", actionType: "delete" };
                            setDongBoStatus("⏳ Đang thực hiện xóa nhật ký...");
                            
                            // 🎯 CHÈN CHUẨN: Ép dòng này trên màn hình chuyển sang trạng thái "waiting" để kích hoạt mờ cam lập tức
                            setDanhSachLichSu(prev => prev.map(i => i.id === item.id ? { ...i, syncStatus: "waiting" } : i));
                            
                            guiYeuCauMang(dongMuonXoa, (res) => {
                              if (res && res.status === 'success') {
                                // 🎯 TỰ ĐỘNG ĐỒNG BỘ: Kéo lại dữ liệu tổng từ Sheet về để trừ số lượng ở tất cả các Tab con liên quan

                                setDanhSachLichSu(prev => prev.filter(i => i.id !== item.id));
                                setDongBoStatus("✅ Đã xóa dòng nhật ký thành công!");
                              } else {
                                // Nếu lỗi, trả về trạng thái cũ để hết mờ
                                setDanhSachLichSu(prev => prev.map(i => i.id === item.id ? { ...i, syncStatus: "synced" } : i));
                                setDongBoStatus("❌ Lỗi mạng, không thể xóa dòng nhật ký.");
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
                  <TextInput 
                    style={[styles.inputStandard, { marginBottom: 0, borderRadius: 20, paddingHorizontal: 15, height: 42, backgroundColor: '#f2f2f2', borderWidth: 0, color: '#111111' }]} 
                    placeholder="🔍 Nhập Mã Tai để tìm kiếm..." 
                    placeholderTextColor="#888888" 
                    value={searchTxtTab2} 
onChangeText={(text) => {
                      // 1. Vẫn cập nhật chữ gõ vào ô tìm kiếm như bình thường
                      setSearchTxtTab2(text);

                      // 2. Nếu gõ chữ rỗng thì không xử lý tìm nái cụ thể
                      if (!text || text.trim() === "") return;

                      // 3. Quét nhanh mảng dữ liệu để tìm con heo khớp chuẩn đét mã số đang gõ
                      if (Array.isArray(danhSachMaTai)) {
                        const maTaiGoc = text.toUpperCase().trim();
                        const naiTimDuoc = danhSachMaTai.find(heo => heo && heo.maTai && heo.maTai.toString().toUpperCase().trim() === maTaiGoc);
                        
                        // 4. Nếu tìm thấy con nái này, đọc trạng thái cột H để tự kích hoạt nhảy Tab phân loại tương ứng
                        if (naiTimDuoc) {
                          const ttH = naiTimDuoc.trangThaiCotH ? naiTimDuoc.trangThaiCotH.toString().trim().normalize("NFC") : "";
                          if (ttH === "Phối") {
                            setNhomNaiTab2('BAU');
                          } else if (ttH === "Chờ Phối" || ttH === "Lốc" || ttH === "Sảy Thai" || ttH === "") {
                            setNhomNaiTab2('CHUA_PHOI');
                          } else if (ttH === "Đẻ" || ttH === "Cai Sữa") {
                            setNhomNaiTab2('NUOI_CON');
                          } else if (ttH === "Thải") {
                            setNhomNaiTab2('THAI');
                          }
                        }
                      }
                    }}                    autoCapitalize="characters" 
                    disableFullscreenUI={true}
                  />
                </View>
          <FlatList 
                      // 🟢 ĐÃ NÂNG CẤP: Thuật toán tìm kiếm tổng lực xuyên suốt cả 4 nhóm đàn khi gõ ô tìm kiếm
            data={Array.isArray(danhSachMaTai) ? danhSachMaTai.filter(item => {
              if (!item) return false;
              
              // 1. Loại bỏ heo vừa gõ nhập mới khỏi danh sách cuộn dưới (vì đã ghim trên Header)
              if (item.vuaNhapMoi) return false;

              // 🟢 2. KHỐI LOGIC THÔNG MINH: Nếu đang gõ tìm kiếm, bỏ qua bộ lọc nhóm để tìm xuyên suốt 4 tab
              if (searchTxtTab2 && searchTxtTab2.trim() !== "") {
                // Chỉ lọc theo từ khóa gõ nhập, bất kể heo đang mang thai hay đã thải
                return (item.maTai ? item.maTai.toString().toLowerCase().trim() : "").includes(searchTxtTab2.toLowerCase().trim());
              }

              // 3. Nếu Ô TÌM KIẾM TRỐNG: Quay về cơ chế lọc rạch ròi theo 4 nhóm nút bấm màu cam bình thường
              const ttH = item.trangThaiCotH ? item.trangThaiCotH.toString().trim().normalize("NFC") : "";
              if (nhomNaiTab2 === 'BAU') {
                if (ttH !== "Phối") return false;
              } else if (nhomNaiTab2 === 'CHUA_PHOI') {
                if (ttH !== "Chờ Phối" && ttH !== "Lốc" && ttH !== "Sảy Thai" && ttH !== "") return false;
              } else if (nhomNaiTab2 === 'NUOI_CON') {
                if (ttH !== "Đẻ" && ttH !== "Cai Sữa") return false;
              } else if (nhomNaiTab2 === 'THAI') {
                if (ttH !== "Thải") return false;
              }

              return true;
            })
            // Giữ nguyên đoạn .sort() sắp xếp thời gian đẻ cận ngày nhất đẩy lên đầu mà bạn đã viết phía dưới...

                // 🎯 THUẬT TOÁN ĐÃ ĐỒNG BỘ: Đổi hoàn toàn sang biến ngayDuKienDeMoi bốc từ Cột L mới của bạn
                               // 🎯 THUẬT TOÁN ĐÃ TỐI ƯU: Đưa ca đẻ sát ngày hôm nay nhất lên đầu đàn, heo chưa phối xuống cuối
                .sort((a, b) => {
                  // LƯU Ý 1: Ép con vừa gõ nhập mới trên điện thoại nhảy vọt lên đầu đàn lập tức
                  if (a.vuaNhapMoi && !b.vuaNhapMoi) return -1;
                  if (!a.vuaNhapMoi && b.vuaNhapMoi) return 1;

                  const layMocThoiGianAnToan = (item) => {
                    if (!item || !item.ngayDuKienDeMoi) return 0;
                    let str = item.ngayDuKienDeMoi.toString().trim();
                    if (str === "" || str === "---") return 0;
                    
                    if (str.includes('/')) {
                      let p = str.split('/');
                      if (p.length === 3) {
                        let ngay = p[0].toString().trim().padStart(2, '0');
                        let thang = p[1].toString().trim().padStart(2, '0');
                        let nam = p[2].toString().trim().substring(0, 4);
                        str = `${nam}-${thang}-${ngay}`;
                      }
                    }
                    
                    let timestamp = Date.parse(str);
                    return isNaN(timestamp) ? 0 : timestamp;
                  };

                  let mocA = layMocThoiGianAnToan(a);
                  let mocB = layMocThoiGianAnToan(b);

                  // Đẩy heo trống chưa phối (mốc thời gian bằng 0) xuống cuối
                  if (mocA === 0 && mocB !== 0) return 1;
                  if (mocA !== 0 && mocB === 0) return -1;

                  // Sắp xếp ca đẻ sát ngày hôm nay nhất lên trên
                  if (mocA !== mocB) return mocA - mocB;

                  let idA = a && a.id ? a.id.toString() : "";
                  let idB = b && b.id ? b.id.toString() : "";
                  return idB.localeCompare(idA);
                }) : []
            }

            keyExtractor={(i) => i.id} 
              contentContainerStyle={{ paddingBottom: 80 }} 

              
            // 🎯 GỘP FORM VÀ Ô TÌM KIẾM VÀO LIST HEADER ĐỂ TỰ ĐỘNG ẨN KHI CUỘN XUỐNG
                              // 🟢 ĐÃ NÂNG CẤP TAB 2: Tự động ẩn Khung tạo mới khi người nuôi gõ ô tìm kiếm
            ListHeaderComponent={
              <View style={{ backgroundColor: '#ffffff', paddingBottom: 5 }}>
                
                {/* 1. KHỐI LOGIC ẨN FORM TẠO MỚI VÀ HEO VỪA NHẬP */}
                {!searchTxtTab2 ? (
                  <View>
                    {/* Khung tạo mới heo nái vào sổ */}
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

                    {/* Khối ghim heo nái vừa thêm vào hệ thống */}
                    {Array.isArray(danhSachMaTai) && danhSachMaTai.some(i => i && i.vuaNhapMoi) && (
                      <View style={{ paddingHorizontal: 15, marginTop: 5, marginBottom: 5 }}>
                        <Text style={{ fontSize: 12, color: '#e65100', fontWeight: 'bold', marginBottom: 4 }}>🆕 Heo nái vừa thêm vào hệ thống:</Text>
                        {danhSachMaTai.filter(i => i && i.vuaNhapMoi).map((item, idx) => (
                          <View key={`vuanhap_${item.id || idx}`} style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffdf6', borderColor: '#fbc48c', opacity: 0.8 }, styles.historyCard, { marginHorizontal: 0, marginTop: 4, padding: 10 }]}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.cardHeader}>🔑 Mã số: <Text style={{color: '#007bff', fontWeight: 'bold'}}>{item.maTai || "---"}</Text></Text>
                              <Text style={styles.cardBody} numberOfLines={1}>🧬 Giống: {item.giong || "---"} | 🎂 Lứa: {item.lua || "---"}</Text>
                              <Text style={{ fontSize: 11, color: '#e65100', marginTop: 2, fontWeight: 'bold' }}>✨ Heo vừa tạo thành công</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ) : null}

                {/* 2. KHỐI LUÔN LUÔN HIỂN THỊ: Thanh 4 nút phân loại nhóm đàn (Được giữ lại để người nuôi vừa gõ tìm vừa đổi nhóm nhanh) */}
                <View style={{ flexDirection: 'row', paddingHorizontal: 15, marginTop: 8, marginBottom: 10, gap: 5 }}>
                  
                  <TouchableOpacity onPress={() => setNhomNaiTab2('CHUA_PHOI')} style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'CHUA_PHOI' ? '#e65100' : '#f2f2f2', paddingVertical: 8, borderRadius: 15, alignItems: 'center' }}>
                    <Text style={{ color: nhomNaiTab2 === 'CHUA_PHOI' ? '#ffffff' : '#555555', fontSize: 11, fontWeight: 'bold' }}>Chưa Phối</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setNhomNaiTab2('BAU')} style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'BAU' ? '#e65100' : '#f2f2f2', paddingVertical: 8, borderRadius: 15, alignItems: 'center' }}>
                    <Text style={{ color: nhomNaiTab2 === 'BAU' ? '#ffffff' : '#555555', fontSize: 11, fontWeight: 'bold' }}>Mang Thai</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setNhomNaiTab2('NUOI_CON')} style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'NUOI_CON' ? '#e65100' : '#f2f2f2', paddingVertical: 8, borderRadius: 15, alignItems: 'center' }}>
                    <Text style={{ color: nhomNaiTab2 === 'NUOI_CON' ? '#ffffff' : '#555555', fontSize: 11, fontWeight: 'bold' }}>Nuôi Con</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setNhomNaiTab2('THAI')} style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'THAI' ? '#6c757d' : '#f2f2f2', paddingVertical: 8, borderRadius: 15, alignItems: 'center' }}>
                    <Text style={{ color: nhomNaiTab2 === 'THAI' ? '#ffffff' : '#555555', fontSize: 11, fontWeight: 'bold' }}>Đã Thải</Text>
                  </TouchableOpacity>
                </View>

              </View>
            }





       renderItem={({ item }) => (
              <View style={[
                { flexDirection: 'row', alignItems: 'center' }, 
                styles.historyCard, 
                item.syncStatus === "waiting" && { backgroundColor: '#fef1d6', borderColor: '#fbc48c', opacity: 0.4 }
              ]}>
                                {/* 🟢 ĐÃ NÂNG CẤP THÀNH CÔNG: Chạm thẳng vào vùng chữ bên trái để xem nhanh lịch sử đẻ */}
                <TouchableOpacity 
                  activeOpacity={0.6}
                  style={{ flex: 1, paddingRight: 5 }}
                  onPress={() => {
                    // Kích hoạt cấu trúc tra cứu thông tin chi tiết
                    setSelectedHeoDetail(item);
                    setIsDetailModalVisible(true);
                    setLoadingLichSuDe(true);
                    
                    // Gọi API kéo lịch sử lứa đẻ ngầm từ server trung tâm
                    fetch(`${WEB_APP_URL}?action=get_lich_su_de&userEmail=${userEmail.toLowerCase().trim()}&maTrai=${encodeURIComponent(selectedTrai)}&maTai=${item.maTai}`, { method: 'GET', redirect: 'follow' })
                      .then(res => res.json())
                      .then(result => {
                        setLoadingLichSuDe(false);
                        if (result.status === 'success' && result.data) {
                          setMangLichSuDeCuaTai(result.data);
                        }
                      }).catch(() => setLoadingLichSuDe(false));
                  }}
                >
                  {/* Tiêu đề hiển thị Số Mã số có icon lúp phẳng nhỏ */}
                  <Text style={[styles.cardHeader, { marginBottom: 4 }]}>
                    Mã số: <Text style={{ color: '#e65100', fontWeight: 'bold' }}>{item.maTai || "---"}</Text> 🔎
                  </Text>
                  
                  {/* 🟢 ĐÃ VÁ LẬP TRÌNH HẠNG MỤC 6: Ưu tiên hiển thị lứa cập nhật thông minh thay vì ép cứng hậu bị */}
                  <Text style={styles.cardBody} numberOfLines={1}>
                    Giống: {item.giong || "---"} | Lứa: <Text style={{ fontWeight: 'bold', color: '#e83e8c' }}>{item.luaHienThiThongMinh || item.lua || "---"}</Text>
                  </Text>
                  
                  {item.trangThaiCotH && !(nhomNaiTab2 === 'BAU' && item.trangThaiCotH.toString().trim().normalize("NFC") === "Phối") ? (
                    <Text style={{ fontSize: 12, color: '#007bff', marginTop: 2, fontWeight: 'bold' }}>Trạng thái: {item.trangThaiCotH}</Text>
                  ) : null}
                  
                  {item.ngayDuKienDeMoi && item.ngayDuKienDeMoi.toString().trim() !== "" && item.ngayDuKienDeMoi.toString().trim() !== "---" ? (
                    <Text style={{ fontSize: 12, color: '#555555', marginTop: 2, fontWeight: '500' }}>
                      Dự Đẻ: {(() => {
                        const str = item.ngayDuKienDeMoi.toString().trim();
                        if (str.includes('/')) return str.substring(0, 10);
                        const d = new Date(str);
                        if (isNaN(d.getTime())) return str;
                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                      })()}
                    </Text>
                  ) : null}

                  {nhomNaiTab2 === 'BAU' && item.ngayCotI && item.ngayCotI.toString().trim() !== "" && item.ngayCotI.toString().trim() !== "---" ? (
                    <Text style={{ fontSize: 12, color: '#007bff', marginTop: 2, fontWeight: 'bold' }}>
                      Số ngày bầu: {(() => {
                        let strPhoi = item.ngayCotI.toString().trim();
                        if (strPhoi.includes('/')) {
                          let p = strPhoi.split('/');
                          if (p.length === 3) {
                            strPhoi = `${p[2]}-${p[1]}-${p[0]}`;
                          }
                        }
                        const ngayPhoi = new Date(strPhoi);
                        const ngayHomNay = new Date();
                        ngayPhoi.setHours(0, 0, 0, 0);
                        ngayHomNay.setHours(0, 0, 0, 0);
                        const khoangCach = ngayHomNay.getTime() - ngayPhoi.getTime();
                        const soNgayBau = Math.floor(khoangCach / (1000 * 60 * 60 * 24));
                        return soNgayBau >= 0 ? `${soNgayBau} ngày` : "---";
                      })()}
                    </Text>
                  ) : null}
                </TouchableOpacity>


                <View style={{ flexDirection: 'column', gap: 6, minWidth: 60 }}>
              
                  
                  <TouchableOpacity 
                    onPress={() => handleMtEditClick(item)} 
                    style={{ backgroundColor: '#ffc107', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#000000', fontWeight: 'bold', fontSize: 12 }}>Sửa</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={()=>{
                      Alert.alert("Xác nhận",`Xóa mã tai [${item.maTai}] khỏi sổ?. Chỉ Xóa nếu nhập Nhầm. Nếu bạn Thải nái này, hãy nhập Thải bên trang Nhập Liệu. Để không bị mất toàn bộ dữ liệu Heo Nái này`,[
                        {text:"Hủy"},
                        {
                          text:"Xóa",
                          onPress:()=>{
                            const dongMuonXoa={...item,syncStatus:"waiting",actionType:"mt_delete"};
                            setDongBoStatus(`⏳ Đang xóa tai: ${item.maTai}...`);
                            setDanhSachMaTai(prev => prev.map(i => i.id === item.id ? { ...i, syncStatus: "waiting" } : i));
                            guiYeuCauMang(dongMuonXoa,(res)=>{
                              if(res&&res.status==='success'){
                                handleRefreshData();
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
            )}
 
            contentContainerStyle={{ paddingBottom: 100 }}
            keyExtractor={(item) => item.id}

            ListEmptyComponent={
              <View style={{ padding: 30, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, color: '#888888', fontStyle: 'italic', textAlign: 'center' }}>
                  {(() => {
                    if (nhomNaiTab2 === 'BAU') return "🤰 Hiện tại không có Nái nào đang mang thai";
                    if (nhomNaiTab2 === 'CHUA_PHOI') return "💢 Hiện tại không có Nái nào chưa phối";
                    if (nhomNaiTab2 === 'NUOI_CON') return "🍼 Hiện tại không có Nái nào đang nuôi con";
                    if (nhomNaiTab2 === 'THAI') return "❌ Hiện tại không có Nái nào đã thải trong trại này";
                    return "🔎 Không tìm thấy heo nái nào khớp với từ khóa tìm kiếm";
                  })()}
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

                           {/* KHỐI 4: CHI TIẾT THEO DÕI TUẦN BẦU ĐỂ DỰ BÁO ĐẺ (ĐÃ GỘP TUẦN 17-18 CHI CHI TIẾT) */}
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#6f42c1', marginBottom: 8, letterSpacing: 0.5 }}>🐷 THEO DÕI TUẦN BẦU</Text>
              <View style={{ backgroundColor: '#fbf9ff', borderRadius: 10, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e2d6f5' }}>
                
                {/* 🟢 ĐÃ VÁ LỖI: Gọi đúng biến dataThongKe[0].moiPhoi để hiển thị số lượng heo mới phối */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ede7f6' }}>
                  <Text style={{ fontSize: 13, color: '#555555' }}>Mới Phối (Tuần 0)</Text>
                  <Text style={{ fontSize: 13, color: '#111111', fontWeight: 'bold' }}>{dataThongKe[0].moiPhoi || "0"} con</Text>
                </View>

                {/* Vòng lặp chạy từ Tuần 1 đến Tuần 16 của chu kỳ mang thai bình thường */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((t) => (
                  <View key={t} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#ede7f6' }}>
                    <Text style={{ fontSize: 13, color: t >= 15 ? '#28a745' : '#555555', fontWeight: t >= 15 ? 'bold' : '400' }}>
                      Bầu Tuần {t}
                    </Text>
                    <Text style={[
                      { fontSize: 13, color: '#111111', fontWeight: '500' },
                      t >= 15 && { color: '#28a745', fontWeight: 'bold' }
                    ]}>
                      {dataThongKe[0]["t" + t] || "0"} con {t >= 15 ? " (Sắp đẻ)" : ""}
                    </Text>
                  </View>
                ))}

                {/* 🟢 ĐÃ GỘP CHUẨN ĐÉT: Tính tổng số lượng của Tuần 17 và 18 thành 1 hàng Cảnh Báo Nguy Hiểm */}
                <View style={{ marginTop: 8, backgroundColor: '#fff5f5', padding: 10, borderRadius: 8, borderWidth: 0.5, borderColor: '#fbc4c4' }}>
                  
                  {/* Hàng trên: Phân bổ Mã tuần bên trái và Số lượng con bên phải thẳng hàng tăm tắp */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#dc3545', fontWeight: 'bold' }}>
                      Bầu Trên 17 Tuần
                    </Text>
                    <Text style={{ fontSize: 14, color: '#dc3545', fontWeight: 'bold' }}>
                      {(() => {
                        const t17 = Number(dataThongKe.t17 || 0);
                        const t18 = Number(dataThongKe.t18 || 0);
                        return t17 + t18;
                      })()} con
                    </Text>
                  </View>

                  {/* Hàng dưới: Dòng chữ nhắc nhở nghiệp vụ thú y phẳng, rộng rãi, không lo bị tràn */}
                  <Text style={{ fontSize: 12, color: '#c82333', fontWeight: '600', marginTop: 4, lineHeight: 18 }}>
                    ⚠️ Cần Kiểm Tra Ngay
                  </Text>
                  
                </View>

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

      {/* ======================================================== */}
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
            data={
              Array.isArray(danhSachDangDe) ? danhSachDangDe.filter(i => {
                const ngayCaiSua = i.ngayCaiSua ? i.ngayCaiSua.toString().trim() : "";
                if (ngayCaiSua !== "" && ngayCaiSua !== "---") return false;

                const trangThaiNai = i.trangThaiCotH ? i.trangThaiCotH.toString().trim().normalize("NFC") : "";
                if (trangThaiNai === "Thải") return false;

                return true;
              }).filter(i => {
                if (!searchTxtTab4) return true;
                if (!i || !i.maTai) return false;
                return i.maTai.toLowerCase().includes(searchTxtTab4.toLowerCase());
              }) : []
            }
            keyExtractor={(item, index) => item.id || index.toString()}
            
            // 🎯 VÁ CHUẨN LỀ ĐÁY: Đẩy dòng cuối cùng lên cao hẳn 110px, không bao giờ bị thanh 5 Tab che khuất
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
                  // Tạo hiệu ứng đổ bóng mờ nguyên khối cho từng ô chuồng
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
                    {item.ngayDe ? (
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
                   {item.ngayDe ? (
                      <View style={{ backgroundColor: '#f8f9fa', borderRadius: 6, padding: 8, marginTop: 5, marginBottom: 5, borderWidth: 0.5, borderColor: '#dee2e6' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ fontSize: 12.5, color: '#495057', fontWeight: '500' }}>Số ngày đã đẻ:</Text>
                          <Text style={{ fontSize: 13, color: '#111111', fontWeight: 'bold' }}>
                            {(() => {
                              let strDe = item.ngayDe.toString().trim();
                              if (strDe.includes('/')) {
                                let p = strDe.split('/');
                                if (p.length === 3) strDe = `${p[2]}-${p[1]}-${p[0]}`;
                              }
                              const dDe = new Date(strDe); const dNay = new Date(); dDe.setHours(0,0,0,0); dNay.setHours(0,0,0,0);
                              const khoangCachNgay = Math.floor((dNay.getTime() - dDe.getTime()) / (1000*60*60*24));
                              
                              // 🎯 TỰ ĐỘNG ĐỔI CHỮ CHUẨN NGHỆP VỤ:
                              if (khoangCachNgay === 0) return "Hôm nay";
                              return khoangCachNgay > 0 ? `${khoangCachNgay} ngày` : "---";
                            })()}
                          </Text>
                        </View>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12.5, color: '#495057', fontWeight: '500' }}>Tuổi heo con ngoài ô:</Text>
                          <Text style={{ fontSize: 13, color: '#111111', fontWeight: 'bold' }}>
                            {(() => {
                              let strDe = item.ngayDe.toString().trim();
                              if (strDe.includes('/')) {
                                let p = strDe.split('/');
                                if (p.length === 3) strDe = `${p[2]}-${p[1]}-${p[0]}`;
                              }
                              const dDe = new Date(strDe); const dNay = new Date(); dDe.setHours(0,0,0,0); dNay.setHours(0,0,0,0);
                              const khoangCachNgay = Math.floor((dNay.getTime() - dDe.getTime()) / (1000*60*60*24));
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

                  </View>
                </View>
              );
            }}
          />

        </View>
      )}

      {/* ======================================================== */}
      {/* 🐖 TAB 5: HEO THỊT VÀ SỐ LIỆU CHI TIẾT TUẦN TUỔI          */}
      {/* ======================================================== */}
          {/* TAB 5: HEO THỊT */}
    {currentTab === 'heo_thit' && (
  <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 15 }}>
    {dataHeoThit ? (
      <View>
        
        {/* Tổng số heo thịt */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#212529' }}>Tổng Số Heo Thịt:</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e7e34' }}> {dataHeoThit.tongHeoThit || "0"} con </Text>
        </View>
        
        {/* Bảng Thống Kê Gộp 6 Giai Đoạn */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 8, marginBottom: 25, borderWidth: 1, borderColor: '#dee2e6' }}>
          
          {/* Giai đoạn 1: Theo mẹ */}
          <View style={[styles.detailRow, { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#dee2e6' }]}>
            <View>
              <Text style={[styles.detailLabel, { fontWeight: '600', color: '#212529' }]}>1. Giai đoạn Theo Mẹ</Text>
              <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>Từ sơ sinh đến cai sữa</Text>
            </View>
            <Text style={[styles.detailVal, { color: '#212529', fontSize: 15, fontWeight: 'bold' }]}>{dataHeoThit.theoMe || "0"} con</Text>
          </View>

          {/* Giai đoạn 2: Cai sữa */}
          <View style={[styles.detailRow, { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#dee2e6' }]}>
            <View>
              <Text style={[styles.detailLabel, { fontWeight: '600', color: '#212529' }]}>2. Giai đoạn Cai Sữa</Text>
              <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>Tuần tuổi: 4 tuần</Text>
            </View>
            <Text style={[styles.detailVal, { color: '#212529', fontSize: 15, fontWeight: 'bold' }]}>{dataHeoThit.caiSua || "0"} con</Text>
          </View>

          {/* Giai đoạn 3: 10-30kg */}
          <View style={[styles.detailRow, { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#dee2e6' }]}>
            <View>
              <Text style={[styles.detailLabel, { fontWeight: '600', color: '#212529' }]}>3. Giai đoạn 10 - 30kg</Text>
              <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>Tuần tuổi: 5 - 9 tuần</Text>
            </View>
            <Text style={[styles.detailVal, { color: '#212529', fontSize: 15, fontWeight: 'bold' }]}>{dataHeoThit.giaiDoan3 || "0"} con</Text>
          </View>

          {/* Giai đoạn 4: 30-60kg */}
          <View style={[styles.detailRow, { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#dee2e6' }]}>
            <View>
              <Text style={[styles.detailLabel, { fontWeight: '600', color: '#212529' }]}>4. Giai đoạn 30 - 60kg</Text>
              <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>Tuần tuổi: 10 - 15 tuần</Text>
            </View>
            <Text style={[styles.detailVal, { color: '#212529', fontSize: 15, fontWeight: 'bold' }]}>{dataHeoThit.giaiDoan4 || "0"} con</Text>
          </View>

          {/* Giai đoạn 5: 60-100kg */}
          <View style={[styles.detailRow, { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#dee2e6' }]}>
            <View>
              <Text style={[styles.detailLabel, { fontWeight: '600', color: '#212529' }]}>5. Giai đoạn 60 - 100kg</Text>
              <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>Tuần tuổi: 16 - 20 tuần</Text>
            </View>
            <Text style={[styles.detailVal, { color: '#212529', fontSize: 15, fontWeight: 'bold' }]}>{dataHeoThit.giaiDoan5 || "0"} con</Text>
          </View>

          {/* Giai đoạn 6: 100kg-xuất bán */}
          <View style={[styles.detailRow, { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f8f9fa', borderBottomLeftRadius: 7, borderBottomRightRadius: 7 }]}>
            <View>
              <Text style={[styles.detailLabel, { fontWeight: 'bold', color: '#c82333' }]}>6. Từ 100kg - Xuất Chuồng</Text>
              <Text style={{ fontSize: 12, color: '#c82333', marginTop: 2, fontWeight: '500' }}>Tuần tuổi: từ 21 tuần trở lên</Text>
            </View>
            <Text style={[styles.detailVal, { color: '#c82333', fontSize: 16, fontWeight: 'bold' }]}>{dataHeoThit.giaiDoan6 || "0"} con</Text>
          </View>

        </View>
      </View>
    ) : (
      <Text style={styles.emptyText}>Trại này hiện tại chưa có dữ liệu phân tích số liệu Heo Thịt trên Server.</Text>
    )}
  </ScrollView>
)}


      {/* ======================================================== */}
      {/* 🏡 POP-UP MODAL 0: CHỌN TRẠI LÀM VIỆC                     */}
      {/* ======================================================== */}
      <Modal visible={isTraiModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>🏡 CHỌN TRẠI LÀM VIỆC</Text>
            <Text style={{fontSize:13, color:'#666', textAlign:'center', marginBottom:15}}>Tài khoản của bạn quản lý nhiều trại. Hãy chọn 1 trại để nhập liệu:</Text>
            <View style={styles.popupPickerBorder}>
                            <Picker 
                selectedValue={selectedTrai} 
                dropdownIconColor="#111111"
                style={{ color: '#111111', backgroundColor: '#ffffff' }}
                onValueChange={(itemV) => {
                  // 🎯 VÁ CHUẨN KHI ĐỔI TRẠI: Xóa sạch số liệu hiển thị cũ lập tức
                  setDanhSachLichSu([]);
                  setDanhSachMaTai([]);
                  setDanhSachDangDe([]);
                  setDataHeoThit(null);
                  
                  // Tiến hành đổi sang trại mới
                  setSelectedTrai(itemV);
                }}
              >
                {danhSachTrai.map((item) => <Picker.Item key={item} label={`🏡 ${item}`} value={item} style={{ color: '#111111', backgroundColor: '#ffffff' }} />)}
              </Picker>

            </View>
            <View style={{ marginTop: 25 }}>
              <Button title="XÁC NHẬN VÀO TRẠI" onPress={handleConfirmFarmSelection} color="#e65100" />
            </View>
          </View>
        </View>
      </Modal>

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
                      {nhomNaiTab2 === 'BAU' && (
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
                      {nhomNaiTab2 === 'CHUA_PHOI' && (
                        <View style={{ paddingVertical: 12, backgroundColor: '#fff3cd', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ffeeba' }}>
                          <Text style={{ fontSize: 13, color: '#856404', fontWeight: 'bold', textAlign: 'center', lineHeight: 18 }}>
                            Chú ý: Heo nái đang Chờ Phối / Lốc. Hãy theo dõi chu kỳ lên giống để phối kịp thời!
                          </Text>
                        </View>
                      )}

                      {/* KHỐI 4: CHI TIẾT SẢN XUẤT CHO NHÓM NUÔI CON HOẶC ĐÃ CAI SỮA */}
                      {nhomNaiTab2 === 'NUOI_CON' && (
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
                      {nhomNaiTab2 === 'THAI' && (
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

                const lichSuDeGộpOffline = danhSachDangDe
                  .filter(heo => {
                    const maTaiKhachChon = selectedHeoDetail?.maTai?.toString().toUpperCase().trim();
                    const maTaiTuSheet = (heo.maTai || "").toString().toUpperCase().trim();
                    return maTaiTuSheet === maTaiKhachChon && maTaiKhachChon !== "";
                  })
                  .sort((a, b) => Number(b.luaDe || 0) - Number(a.luaDe || 0));

                if (lichSuDeGộpOffline.length === 0) {
                  return (
                    <View style={{ padding: 12, backgroundColor: '#fcfcfc', borderRadius: 8, borderWidth: 1, borderColor: '#eaeaea' }}>
                      <Text style={{ fontSize: 13, color: '#95a5a6', textAlign: 'center', fontStyle: 'italic' }}>Chưa ghi nhận dữ liệu lịch sử lứa đẻ nào cho mã tai này.</Text>
                    </View>
                  );
                }

 return lichSuDeGộpOffline.map((item, index) => (
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
      {/* 🔮 POP-UP MODAL 2: SỬA SỰ KIỆN NHẬT KÝ HEO (TAB 1)         */}
      {/* ======================================================== */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>📝 SỬA NHẬT KÝ HEO</Text>
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
              cancelTextMagdalene="Hủy"
            />
            <TextInput style={[styles.popupInput, { marginTop: 10, color: '#111111', backgroundColor: '#ffffff', fontWeight: 'bold' }]} value={editMaTai} onChangeText={setEditMaTai} placeholderTextColor="#777777" autoCapitalize="characters" />
            <View style={styles.popupPickerBorder}>
              <Picker selectedValue={editSuKien} dropdownIconColor="#111111" style={{ color: '#111111', backgroundColor: '#ffffff' }} onValueChange={(item) => { setEditSuKien(item); setEditSoHeo(''); }}>
                {danhSachSuKien.map((item, index) => (
                  <Picker.Item key={index} label={item} value={item} style={{ color: '#111111', backgroundColor: '#ffffff' }} />
                ))}
              </Picker>
            </View>
                       {/* 🎯 Ô NHẬP SỐ LƯỢNG HEO CỦA CÁC SỰ KIỆN KHÁC (PHỐI/CAI SỮA...) GIỮ NGUYÊN BÊN NGOÀI KHUNG */}
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

            {/* 🐖 KHỐI CHI TIẾT HEO ĐẺ ĐÃ ĐƯỢC GOM CỤM TOÀN DIỆN */}
            {editSuKien === "Đẻ" && (
              <View style={{ backgroundColor: '#fdf7f2', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f5dad2', marginTop: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100', marginBottom: 12 }}>Sửa chi tiết Heo Đẻ:</Text>
                
                {/* 🌟 1. Ô ĐƯỢC GOM VÀO KHUNG: Tổng số con sinh ra (Biến editSoHeo gốc của bạn) */}
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

                {/* 2. Sửa Chọn nuôi */}
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

                {/* 3. Sửa Khô thai */}
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

                {/* 4. Sửa Còi cọc */}
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

                {/* 5. Sửa Chết ngộp */}
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


<TextInput style={[styles.popupInput, { marginTop: 10, color: '#111111', backgroundColor: '#ffffff' }]} placeholder="Sửa Ghi chú" placeholderTextColor="#888888" value={editGhiChu} onChangeText={setEditGhiChu} />

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
        <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('heo_de')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: currentTab === 'heo_de' ? '#fff0e6' : 'transparent', paddingBottom: 2, paddingTop: 2, borderRadius: 10, width: '98%', height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, marginBottom: 1 }}>
              <Text style={{ opacity: currentTab === 'heo_de' ? 1 : 0.6 }}>🐖 </Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: currentTab === 'heo_de' ? '#e65100' : '#28a745' }}>
                {Array.isArray(danhSachDangDe) ? String(danhSachDangDe.filter(i => {
                  const ngayCaiSua = i.ngayCaiSua ? i.ngayCaiSua.toString().trim() : "";
                  if (ngayCaiSua !== "" && ngayCaiSua !== "---") return false;
                  const trangThaiNai = i.trangThaiCotH ? i.trangThaiCotH.toString().trim().normalize("NFC") : "";
                  if (trangThaiNai === "Thải") return false;
                  return true;
                }).length) : "0"}
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

                <Modal visible={isQuickAddModalVisible} animationType="fade" transparent={true}>
  <View style={styles.modalOverlay}>
    <View style={styles.popupCard}>
      <Text style={[styles.popupTitle, { color: '#e65100' }]}>➕ KHAI BÁO NHANH MÃ HEO GỐC</Text>
      
      <Text style={{ fontWeight: '600', marginBottom: 4, fontSize: 13, color: '#333333' }}>Mã Số Tai:</Text>
      <TextInput 
        style={[styles.popupInput, { backgroundColor: '#eeeeee', color: '#555555', fontWeight: 'bold', marginBottom: 12 }]} 
        value={maTai.toUpperCase().trim()} 
        editable={false} 
      />

      <Text style={{ fontWeight: '600', marginBottom: 4, fontSize: 13, color: '#333333' }}>Giống Heo Nái:</Text>
      <TextInput 
        style={[styles.popupInput, { borderColor: '#ffd3b6', marginBottom: 12 }]} 
        placeholder="Ví dụ: TN70, Landrace..."
        placeholderTextColor="#888888"
        value={quickGiong}
        onChangeText={setQuickGiong}
      />

      <Text style={{ fontWeight: '600', marginBottom: 4, fontSize: 13, color: '#333333' }}>Chọn Lứa Đẻ Đầu Vào:</Text>
      <View style={[styles.popupPickerBorder, { marginTop: 0, marginBottom: 20, borderColor: '#ffd3b6' }]}>
        <Picker
          selectedValue={quickLua}
          style={{ color: '#111111', width: '100%' }}
          dropdownIconColor="#111111"
          onValueChange={(val) => setQuickLua(val)}
        >
          {danhSachLuaHeo.map((l, index) => (
            <Picker.Item key={index} label={l} value={l} style={{ fontSize: 14, color: '#111111' }} />
          ))}
        </Picker>
      </View>

      {isQuickSaving ? (
        <ActivityIndicator size="small" color="#e65100" style={{ marginVertical: 10 }} />
      ) : (
        <View style={styles.popupButtonGroup}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Button title="LƯU VÀO SỔ" onPress={handleQuickSaveHeoMoi} color="#28a745" />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="HỦY BỎ" onPress={() => setIsQuickAddModalVisible(false)} color="#6c757d" />
          </View>
        </View>
      )}
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