import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, ScrollView, SafeAreaView  } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider,useSafeAreaInsets } from 'react-native-safe-area-context';


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
const auth = getAuth(app); // Cấu hình thêm dòng này để bạn gọi hàm đăng nhập phía dưới nếu cần

// ❌ ĐÃ XÓA BỎ DÒNG const analytics = getAnalytics(app); GÂY CRASH APP TẠI ĐÂY!

function MainApp() {
  const insets = useSafeAreaInsets();
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzzhHIuHTza48o6Dls2eQiZ02DwxQepqkLCzFJAB_5KrL0rVxoGh52gJzeLDxdTg3uMrA/exec';

  // --- STATE ĐĂNG NHẬP VÀ CHỌN TRẠI ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState(''); 
  const [typedEmail, setTypedEmail] = useState('');
  const [typedPassword, setTypedPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false); 

  const [danhSachTrai, setDanhSachTrai] = useState([]); 
  const [selectedTrai, setSelectedTrai] = useState(''); 
  const [isTraiModalVisible, setIsTraiModalVisible] = useState(false); 

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

        fetch(`${WEB_APP_URL}?action=get_farms&userEmail=${loggedEmail.toLowerCase().trim()}`, { method: 'GET', redirect: 'follow' })
          .then((res) => res.json())
          .then(async (result) => {
            setIsAuthLoading(false);
            if (result.status === 'success' && result.data.length > 0) {
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
                setIsTraiModalVisible(true);
                
                await AsyncStorage.setItem('saved_user_email', loggedEmail.toLowerCase().trim());
                setTypedPassword('');
              }
            } else {
              Alert.alert("Lỗi cấu hình", "Tài khoản đúng, nhưng Admin chưa phân quyền Mã Trại nào cho bạn trên Sever Trung Tâm!");
            }
          })
          .catch(() => {
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
  const handleConfirmFarmSelection = async () => {
    setIsTraiModalVisible(false);
    setDanhSachLichSu([]);
    setDanhSachMaTai([]);
    try {
      await AsyncStorage.setItem('saved_user_trai', selectedTrai);
    } catch (e) {
      console.log("Lỗi lưu trại:", e);
    }
  };
  // 🎯 VÁ TỐI ƯU HIỆU NĂNG: Hàm gọi dữ liệu nút Xem đặt độc lập bên ngoài FlatList
const handleXemChiTietHeo = (item) => {
  setSelectedHeoDetail(item); 
  setIsDetailModalVisible(true);
  setLoadingLichSuDe(true);
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
  useEffect(() => {
    const kiemTraDangNhapCu = async () => {
      try {
        const emailDaLuu = await AsyncStorage.getItem('saved_user_email');
        const traiDaLuu = await AsyncStorage.getItem('saved_user_trai');
        const cachedTraiList = await AsyncStorage.getItem('cached_danh_sach_trai');

        if (emailDaLuu !== null) {
          setUserEmail(emailDaLuu); 
          setIsLoggedIn(true); 
          
          if (cachedTraiList !== null) {
            setDanhSachTrai(JSON.parse(cachedTraiList));
          }

          if (traiDaLuu !== null) {
            setSelectedTrai(traiDaLuu); 
            setIsTraiModalVisible(false); 
          } else {
            taiDanhSachTraiMoiXong(emailDaLuu); 
          }
        }
      } catch (e) {
        console.log("Lỗi đọc bộ nhớ:", e);
      }
    };
    kiemTraDangNhapCu();
  }, []);

  const taiDanhSachTraiMoiXong = (emailKhach) => {
    fetch(`${WEB_APP_URL}?action=get_farms&userEmail=${emailKhach.toLowerCase().trim()}`, { method: 'GET', redirect: 'follow' })
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'success' && result.data.length > 0) {
          setDanhSachTrai(result.data);
          setIsTraiModalVisible(true);
        }
      }).catch(() => {});
  };

  // --- TỰ ĐỘNG TẢI DỮ LIỆU CŨ TỪ SEVER TRUNG TÂM VỀ APP SONG SONG 5 CỔNG ---
  useEffect(() => {
    if (isLoggedIn && selectedTrai !== '') {
      setDongBoStatus('⏳ Đang lấy dữ liệu trang trại');
      setIsInitialLoading(true); 
      
      const emailChuan = userEmail.toLowerCase().trim();
      const traiChuan = encodeURIComponent(selectedTrai);

      Promise.all([
        fetch(`${WEB_APP_URL}?action=get_history&userEmail=${emailChuan}&maTrai=${traiChuan}`, { method: 'GET', redirect: 'follow' }).then(res => res.json()),
        fetch(`${WEB_APP_URL}?action=get_ma_tai&userEmail=${emailChuan}&maTrai=${traiChuan}`, { method: 'GET', redirect: 'follow' }).then(res => res.json()),
        fetch(`${WEB_APP_URL}?action=get_tab3&userEmail=${emailChuan}&maTrai=${traiChuan}`, { method: 'GET', redirect: 'follow' }).then(res => res.json()),
        fetch(`${WEB_APP_URL}?action=get_tab4&userEmail=${emailChuan}&maTrai=${traiChuan}`, { method: 'GET', redirect: 'follow' }).then(res => res.json()),
        fetch(`${WEB_APP_URL}?action=get_heo_thit&userEmail=${emailChuan}&maTrai=${traiChuan}`, { method: 'GET', redirect: 'follow' }).then(res => res.json())
      ])
      .then(([resHistory, resMaTai, resTab3, resTab4, resHeoThit]) => {
        if (resHistory.status === 'success' && resHistory.data) setDanhSachLichSu(resHistory.data);
        if (resMaTai.status === 'success' && resMaTai.data) setDanhSachMaTai(resMaTai.data);
        if (resTab3 && resTab3.status === 'success' && resTab3.data) setDataThongKe(resTab3.data);
        if (resTab4 && resTab4.status === 'success' && resTab4.data) setDanhSachDangDe(resTab4.data);
        if (resHeoThit && resHeoThit.status === 'success' && resHeoThit.data) setDataHeoThit(resHeoThit.data);
        
        setDongBoStatus('🟢 Hệ thống sẵn sàng');
        setTimeout(() => setIsInitialLoading(false), 500); 
      })
      .catch((err) => {
        console.log("Lỗi tải data cũ:", err);
        setIsInitialLoading(false);
        setDongBoStatus('❌ Không thể tải dữ liệu cũ. Vui lòng thử lại.');
      });
    }
  }, [isLoggedIn, selectedTrai]);
  // ========================================================
  // 🔄 NÚT BẤM LÀM MỚI DỮ LIỆU CHỦ ĐỘNG TỪ ĐIỆN THOẠI (5 CỔNG)
  // ========================================================
  const handleRefreshData = () => {
    if (!isLoggedIn || selectedTrai === '') {
      Alert.alert("Thông báo", "Vui lòng đăng nhập và chọn trại trước khi làm mới!");
      return;
    }
    setDongBoStatus('⏳ Đang làm mới dữ liệu từ Sever Trung Tâm...');
    setIsInitialLoading(true); 

    const emailChuan = userEmail.toLowerCase().trim();
    const traiChuan = encodeURIComponent(selectedTrai);

    Promise.all([
      fetch(`${WEB_APP_URL}?action=get_history&userEmail=${emailChuan}&maTrai=${traiChuan}`, { method: 'GET', redirect: 'follow' }).then(res => res.json()),
      fetch(`${WEB_APP_URL}?action=get_ma_tai&userEmail=${emailChuan}&maTrai=${traiChuan}`, { method: 'GET', redirect: 'follow' }).then(res => res.json()),
      fetch(`${WEB_APP_URL}?action=get_tab3&userEmail=${emailChuan}&maTrai=${traiChuan}`, { method: 'GET', redirect: 'follow' }).then(res => res.json()),
      fetch(`${WEB_APP_URL}?action=get_tab4&userEmail=${emailChuan}&maTrai=${traiChuan}`, { method: 'GET', redirect: 'follow' }).then(res => res.json()),
      fetch(`${WEB_APP_URL}?action=get_heo_thit&userEmail=${emailChuan}&maTrai=${traiChuan}`, { method: 'GET', redirect: 'follow' }).then(res => res.json())
    ])
    .then(([resHistory, resMaTai, resTab3, resTab4, resHeoThit]) => {
      if (resHistory.status === 'success' && resHistory.data) setDanhSachLichSu(resHistory.data);
      if (resMaTai.status === 'success' && resMaTai.data) setDanhSachMaTai(resMaTai.data);
      if (resTab3 && resTab3.status === 'success' && resTab3.data) setDataThongKe(resTab3.data);
      if (resTab4 && resTab4.status === 'success' && resTab4.data) setDanhSachDangDe(resTab4.data);
      
      if (resHeoThit && resHeoThit.status === 'success' && resHeoThit.data) {
        setDataHeoThit(resHeoThit.data);
      } else {
        setDataHeoThit(null);
      }

      setDongBoStatus('✅ Đã làm mới dữ liệu thành công!');
      setTimeout(() => { 
        setDongBoStatus('🟢 Hệ thống sẵn sàng'); 
        setIsInitialLoading(false); 
      }, 1500);
    })
    .catch((err) => {
      console.log("Lỗi làm mới data 5 cổng:", err);
      setIsInitialLoading(false);
      setDongBoStatus('❌ Lỗi kết nối làm mới thất bại.');
    });
  };

  // --- HÀM 4: CỔNG GỬI YÊU CẦU MẠNG URL GET ---
  const guiYeuCauMang = (bodyData, callback) => {
    const ngayMaHoa = encodeURIComponent(bodyData.ngay || "");
    const maTaiMaHoa = encodeURIComponent(bodyData.maTai || "");
    const suKienMaHoa = encodeURIComponent(bodyData.suKien || "");
    const giongMaHoa = encodeURIComponent(bodyData.giong || "");
    const luaMaHoa = encodeURIComponent(bodyData.lua || "");
    const traiMaHoa = encodeURIComponent(selectedTrai || "");

    const duongLinkGửiData = `${WEB_APP_URL}?action=${bodyData.actionType}&id=${bodyData.id}&userEmail=${userEmail.toLowerCase().trim()}&maTrai=${traiMaHoa}&ngay=${ngayMaHoa}&maTai=${maTaiMaHoa}&suKien=${suKienMaHoa}&soHeo=${bodyData.soHeo !== undefined ? bodyData.soHeo : ""}&giong=${giongMaHoa}&lua=${luaMaHoa}&khoThai=${encodeURIComponent(bodyData.khoThai || "")}&coiCoc=${encodeURIComponent(bodyData.coiCoc || "")}&chetNgop=${encodeURIComponent(bodyData.chetNgop || "")}&chonNuoi=${encodeURIComponent(bodyData.chonNuoi || "")}&ghiChu=${encodeURIComponent(bodyData.ghiChu || "")}`;

    fetch(duongLinkGửiData, { method: 'GET', redirect: 'follow' })
    .then((res) => res.json())
    .then(callback)
    .catch((error) => { setDongBoStatus('⚠️ Gián đoạn mạng ngầm. Đang tự động thử lại...'); });
  };

  // --- HÀM 5: FORM NHẬP NHẬT KÝ HEO (TAB 1) ---
    const handleSaveNew = () => {
    if (!laSuKienBanHeo && !maTai.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Mã Tai!");
    if (canNhapSoHeo && !soHeo.trim()) return Alert.alert("Thông báo", "Vui lòng nhập Số Heo!");

    const dongMoi = { 
      id: "ID_" + new Date().getTime(), 
      ngay: ngayHienThi, 
      maTai: laSuKienBanHeo ? "BÁN HEO" : maTai.toUpperCase().trim(), 
      suKien, 
      soHeo: canNhapSoHeo ? Number(soHeo) : "", 
      khoThai: suKien === "Đẻ" ? khoThai : "",
      coiCoc: suKien === "Đẻ" ? coiCoc : "",
      chetNgop: suKien === "Đẻ" ? chetNgop : "",
      chonNuoi: suKien === "Đẻ" ? chonNuoi : "",
      ghiChu: ghiChu,
      syncStatus: "waiting", 
      actionType: "create" 
    };
    
    setDanhSachLichSu(prev => [dongMoi, ...prev]);
    setDongBoStatus(`⏳ Đang lưu: ${dongMoi.maTai}...`);

    guiYeuCauMang(dongMoi, (res) => {
      if (res.status === 'success') {
        // 🎯 CƠ CHẾ TỰ ĐỘNG NHẬN: Tự gọi hàm kéo dữ liệu mới tinh từ Sheet về điện thoại ngầm
        handleRefreshData();

        setDanhSachLichSu(prev => prev.map(i => i.id === dongMoi.id ? { ...i, syncStatus: "synced" } : i));
        setDongBoStatus('✅ Đã Lưu Thành Công');
        
        setMaTai(''); 
        setSoHeo('');
        setKhoThai(''); 
        setCoiCoc(''); 
        setChetNgop(''); 
        setChonNuoi(''); 
        setGhiChu('');
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
        // 🎯 ĐÃ BỔ SUNG: Nạp số liệu chi tiết và ghi chú cũ vào form sửa khi bấm nút Sửa
    setEditKhoThai(item.khoThai ? String(item.khoThai) : '');
    setEditCoiCoc(item.coiCoc ? String(item.coiCoc) : '');
    setEditChetNgop(item.chetNgop ? String(item.chetNgop) : '');
    setEditChonNuoi(item.chonNuoi ? String(item.chonNuoi) : '');
    setEditGhiChu(item.ghiChu || '');

    setIsEditModalVisible(true); 
  };

   const handleSaveEdit = () => {
    const dongChỉnhSửa = {
      id: editingId,
      ngay: editNgay,
      maTai: editMaTai.toUpperCase().trim(),
      suKien: editSuKien,
      soHeo: editCanNhapSoHeo ? Number(editSoHeo) : "",
      khoThai: editKhoThai,   
      coiCoc: editCoiCoc,     
      chetNgop: editChetNgop, 
      chonNuoi: editChonNuoi, 
      ghiChu: editGhiChu,     
      syncStatus: "waiting",
      actionType: "update"
    };

    setDanhSachLichSu(prev => prev.map(item => item.id === editingId ? dongChỉnhSửa : item));
    setIsEditModalVisible(false);
    setEditingId(null);

    setDongBoStatus(`⏳ Đang cập nhật nhật ký tai: ${dongChỉnhSửa.maTai}...`);
    guiYeuCauMang(dongChỉnhSửa, (res) => {
      if (res.status === 'success') {
        // 🎯 TỰ ĐỘNG ĐỒNG BỘ: Tự gọi hàm kéo dữ liệu mới từ Sheet về nạp lại cho tất cả các tab
        handleRefreshData();

        setDanhSachLichSu(prev => prev.map(i => i.id === dongChỉnhSửa.id ? { ...i, syncStatus: "synced" } : i));
        setDongBoStatus('✅ Đã cập nhật Nhật Ký thành công!');
      } else {
        setDongBoStatus('❌ Lỗi cập nhật nhật ký lên hệ thống.');
      }
    });
  };



  const handleXoaNhatKyChuDong = (item) => {
    const dongMuonXoa = {
      ...item,
      syncStatus: "waiting",
      actionType: "delete"
    };

    setDongBoStatus(`⏳ Đang xoá nhật ký tai: ${item.maTai}...`);
    
    guiYeuCauMang(dongMuonXoa, (res) => {
      if (res.status === 'success') {
        setDanhSachLichSu(prev => prev.filter(i => i.id !== item.id));
        setDongBoStatus('✅ Đã xoá dòng Nhật Ký trên Sever Trung Tâm!');
      } else {
        setDongBoStatus('❌ Lỗi không thể xoá dòng nhật ký.');
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
      <View style={styles.loginContainer}>
        <Text style={styles.loginEmoji}>🔥</Text>
        <Text style={styles.loginTitle}>HỆ THỐNG TRẠI HEO</Text>
        <Text style={styles.loginSub}>Nhập Liệu và Quản Lý Trang Trại Của bạn</Text>
        <TextInput style={styles.inputStandard} placeholder="Nhập số tài khoản (Email)" value={typedEmail} onChangeText={setTypedEmail} keyboardType="email-address" placeholderTextColor="#888888" autoCapitalize="none" editable={!isAuthLoading} />
        <TextInput style={styles.inputStandard} placeholder="Nhập mật mã" value={typedPassword} onChangeText={setTypedPassword} secureTextEntry={true} autoCapitalize="none" placeholderTextColor="#888888" editable={!isAuthLoading} />
        <View style={{ marginTop: 10 }}>
          {isAuthLoading ? <ActivityIndicator size="large" color="#e65100" /> : <Button title="ĐĂNG NHẬP HỆ THỐNG" onPress={handleLoginSubmit} color="#e65100" />}
        </View>
      </View>
    );
  }

  return (
    
   <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.mainWrapper}>
      
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
            <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>🔄 Tải Lại</Text>
          </TouchableOpacity>
        </View>
      </View>

      

     

            {/* TAB 1: NHẬP LIỆU */}
     {currentTab === 'nhap_lieu' && ( 
        <View style={{ flex: 1 }}>
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


                              ListHeaderComponent={
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
                    <TouchableOpacity style={[styles.dateButton, { borderColor: '#ffd3b6', backgroundColor: '#ffffff', height: 42, justifyContent: 'center', paddingHorizontal: 10 }]} onPress={() => setDatePickerVisibility(true)}>
                      <Text style={[styles.dateButtonText, { fontSize: 14 }]}>📅 {ngayHienThi}</Text>
                    </TouchableOpacity>
                    {!laSuKienBanHeo ? (
                      <TextInput style={[styles.inputMaTai, { color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', height: 42, fontSize: 14, paddingVertical: 0 }]} placeholder="Mã Tai" placeholderTextColor="#777777" value={maTai} onChangeText={setMaTai} autoCapitalize="characters" />
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

                 <TouchableOpacity 
                    onPress={handleSaveNew} 
                    activeOpacity={0.5} 
                    style={{ 
                      backgroundColor: '#e65100', 
                      paddingVertical: 9, 
                      borderRadius: 6, 
                      alignItems: 'center',
                      marginTop: 4
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>Thêm Mới Nhật Ký</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ paddingHorizontal: 15, marginTop: 12, marginBottom: 5 }}>
                  <TextInput style={[styles.inputStandard, { marginBottom: 0, borderRadius: 20, paddingHorizontal: 15, height: 42, backgroundColor: '#f2f2f2', borderWidth: 0, color: '#111111', fontSize: 14 }]} placeholder="🔍 Nhập Mã Tai để xem lịch sử" placeholderTextColor="#888888" value={searchTxtTab1} onChangeText={setSearchTxtTab1} autoCapitalize="characters" />
                </View>
              </View>
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
                    })()} | Mã Tai: <Text style={{color:'#007bff', fontWeight:'bold'}}>{item.maTai}</Text>
                  </Text>

                  <Text style={styles.cardBody}>
  📝 {item.suKien} {item.soHeo !== "" ? `(${item.soHeo} con)` : ""}
</Text>

{/* 🎯 SỬA CHUẨN: Bỏ ngoặc tròn, dùng toán tử && và bọc khít dòng chữ */}
{item.suKien === "Đẻ" && !!(item.khoThai || item.coiCoc || item.chetNgop || item.chonNuoi) && <Text style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>🍂 Khô: {String(item.khoThai || 0)} | 🐹 Còi: {String(item.coiCoc || 0)} | ❌ Ngộp: {String(item.chetNgop || 0)} | 🐷 Nuôi: {String(item.chonNuoi || 0)}</Text>}

{/* 🎯 SỬA CHUẨN: Bỏ ngoặc tròn, dùng toán tử && ép kiểu Boolean để chặn chữ rỗng */}
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
                                handleRefreshData();

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
          <FlatList 
            data={Array.isArray(danhSachMaTai) ? danhSachMaTai.filter(item => {
              if (!item) return false;
              
              // 🎯 Loại bỏ heo vừa nhập khỏi danh sách dưới để nó chỉ hiện duy nhất ở khung ghim trên đỉnh Header
              if (item.vuaNhapMoi) return false;

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

              if (!searchTxtTab2) return true;
              return (item.maTai ? item.maTai.toString().toLowerCase().trim() : "").includes(searchTxtTab2.toLowerCase().trim());
            })
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
                               ListHeaderComponent={
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
                    <Text style={{ fontSize: 13, color: '#e65100', fontWeight: 'bold' }}>
                      📌 TẠO MỚI HEO NÁI VÀO SỔ
                    </Text>
                  </View>

                  <View style={[styles.rowInput, { marginBottom: 10 }]}>
                    <TextInput 
                      style={[styles.inputStandard, { flex: 1, marginBottom: 0, marginRight: 8, color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', height: 42, fontSize: 14, paddingVertical: 0 }]} 
                      placeholder="Mã Tai" 
                      placeholderTextColor="#777777" 
                      value={mtMaTai} 
                      onChangeText={setMtMaTai} 
                      autoCapitalize="characters" 
                    />
                    <TextInput 
                      style={[styles.inputStandard, { flex: 1, marginBottom: 0, color: '#111111', backgroundColor: '#ffffff', borderColor: '#ffd3b6', height: 42, fontSize: 14, paddingVertical: 0 }]} 
                      placeholder="Giống heo" 
                      placeholderTextColor="#777777" 
                      value={mtGiong} 
                      onChangeText={setMtGiong} 
                    />
                  </View>
                  
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
                      selectedValue={mtLua} 
                      dropdownIconColor="#111111" 
                      style={{ color: '#111111', backgroundColor: 'transparent', width: '100%' }} 
                      onValueChange={(itemValue) => setMtLua(itemValue)}
                    >
                      {danhSachLuaHeo.map((item, index) => (
                        <Picker.Item key={index} label={item} value={item} style={{ color: '#111111', backgroundColor: '#ffffff', fontSize: 14 }} />
                      ))}
                    </Picker>
                  </View>
                  
                  <TouchableOpacity 
                    onPress={handleSaveMaTai} 
                    activeOpacity={0.5} 
                    style={{ 
                      backgroundColor: '#e65100', 
                      paddingVertical: 9, 
                      borderRadius: 6, 
                      alignItems: 'center',
                      marginTop: 4
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>THÊM MÃ TAI MỚI VÀO SỔ</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ paddingHorizontal: 15, marginTop: 12, marginBottom: 5 }}>
                  <TextInput 
                    style={[styles.inputStandard, { marginBottom: 0, borderRadius: 20, paddingHorizontal: 15, height: 42, backgroundColor: '#f2f2f2', borderWidth: 0, color: '#111111' }]} 
                    placeholder="🔍 Nhập Mã Tai để tìm kiếm..." 
                    placeholderTextColor="#888888" 
                    value={searchTxtTab2} 
                    onChangeText={setSearchTxtTab2} 
                    autoCapitalize="characters" 
                    disableFullscreenUI={true}
                  />
                </View>

                {Array.isArray(danhSachMaTai) && danhSachMaTai.some(i => i && i.vuaNhapMoi) && <View style={{ paddingHorizontal: 15, marginTop: 5, marginBottom: 5 }}>
                  <Text style={{ fontSize: 12, color: '#e65100', fontWeight: 'bold', marginBottom: 4 }}>🆕 Heo nái vừa thêm vào hệ thống:</Text>
                  {danhSachMaTai.filter(i => i && i.vuaNhapMoi).map((item, idx) => <View key={`vuanhap_${item.id || idx}`} style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffdf6', borderColor: '#fbc48c', opacity: 0.8 }, styles.historyCard, { marginHorizontal: 0, marginTop: 4, padding: 10 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardHeader}>🔑 Mã số: <Text style={{color: '#007bff', fontWeight: 'bold'}}>{item.maTai || "---"}</Text></Text>
                      <Text style={styles.cardBody} numberOfLines={1}>🧬 Giống: {item.giong || "---"} | 🎂 Lứa: {item.lua || "---"}</Text>
                      <Text style={{ fontSize: 11, color: '#e65100', marginTop: 2, fontWeight: 'bold' }}>✨ Heo vừa tạo thành công</Text>
                    </View>
                  </View>)}
                </View>}

                <View style={{ flexDirection: 'row', paddingHorizontal: 15, marginTop: 8, marginBottom: 10, gap: 5 }}>
                  <TouchableOpacity 
                    onPress={() => setNhomNaiTab2('BAU')}
                    style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'BAU' ? '#e65100' : '#f2f2f2', paddingVertical: 8, borderRadius: 15, alignItems: 'center' }}
                  >
                    <Text style={{ color: nhomNaiTab2 === 'BAU' ? '#ffffff' : '#555555', fontSize: 11, fontWeight: 'bold' }}>Mang Thai</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => setNhomNaiTab2('CHUA_PHOI')}
                    style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'CHUA_PHOI' ? '#e65100' : '#f2f2f2', paddingVertical: 8, borderRadius: 15, alignItems: 'center' }}
                  >
                    <Text style={{ color: nhomNaiTab2 === 'CHUA_PHOI' ? '#ffffff' : '#555555', fontSize: 11, fontWeight: 'bold' }}>Chưa Phối</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => setNhomNaiTab2('NUOI_CON')}
                    style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'NUOI_CON' ? '#e65100' : '#f2f2f2', paddingVertical: 8, borderRadius: 15, alignItems: 'center' }}
                  >
                    <Text style={{ color: nhomNaiTab2 === 'NUOI_CON' ? '#ffffff' : '#555555', fontSize: 11, fontWeight: 'bold' }}>Nuôi Con</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => setNhomNaiTab2('THAI')}
                    style={{ flex: 1, backgroundColor: nhomNaiTab2 === 'THAI' ? '#6c757d' : '#f2f2f2', paddingVertical: 8, borderRadius: 15, alignItems: 'center' }}
                  >
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
                <View style={{ flex: 1, paddingRight: 5 }}>
                  {/* 🎯 ĐÃ XÓA ICON: Loại bỏ toàn bộ biểu tượng cảm xúc ở khối chữ trái */}
                  <Text style={[styles.cardHeader, { marginBottom: 4 }]}>
                    Mã số: <Text style={{color: '#e65100', fontWeight: 'bold'}}>{item.maTai || "---"}</Text>
                  </Text>
                  
                  <Text style={styles.cardBody} numberOfLines={1}>Giống: {item.giong || "---"} | <Text style={{fontWeight: 'bold', color: '#e83e8c'}}>{item.lua || "---"}</Text></Text>
                  
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
                </View>

                <View style={{ flexDirection: 'column', gap: 6, minWidth: 60 }}>
               <TouchableOpacity 
                    onPress={()=>{
                      // 🎯 KHÔI PHỤC CHUẨN: Tất cả các Tab (kể cả Chưa Phối) khi bấm Xem đều kích hoạt gọi mạng kéo lịch sử Pop-up Modal về máy
                      setSelectedHeoDetail(item);
                      setIsDetailModalVisible(true);
                      setLoadingLichSuDe(true);
                      fetch(`${WEB_APP_URL}?action=get_lich_su_de&userEmail=${userEmail.toLowerCase().trim()}&maTrai=${encodeURIComponent(selectedTrai)}&maTai=${item.maTai}`,{method:'GET',redirect:'follow'})
                        .then(res=>res.json())
                        .then(result=>{
                          setLoadingLichSuDe(false);
                          if(result.status==='success'&&result.data){
                            setMangLichSuDeCuaTai(result.data);
                          }
                        }).catch(()=>setLoadingLichSuDe(false));
                    }} 
                    style={{ backgroundColor: '#17a2b8', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>Xem</Text>
                  </TouchableOpacity>
                  
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
        <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 15 }}>
          {dataThongKe && dataThongKe[0] ? (
            <View>
              {/* 🌾 NHÓM CÁM TIÊU THỤ THÁNG NÀY */}
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0056b3', marginBottom: 8 }}>🌾 DỰ KIẾN TIÊU THỤ CÁM THÁNG NÀY</Text>
              <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, padding: 5, marginBottom: 15, borderWidth: 1, borderColor: '#eee' }}>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Dự kiến cám Heo Thịt:</Text><Text style={styles.detailVal}>{dataThongKe[0].heoThit} Kg</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Dự kiến cám Heo Nái:</Text><Text style={styles.detailVal}>{dataThongKe[0].heoNaiCam} Kg</Text></View>
                <View style={[styles.detailRow, { backgroundColor: '#e7f1ff', borderBottomWidth: 0 }]}>
                  <Text style={[styles.detailLabel, { fontWeight: 'bold', color: '#0056b3' }]}>📊 Tổng Dự Kiến Cám:</Text>
                  <Text style={[styles.detailVal, { color: '#0056b3', fontSize: 16, fontWeight: 'bold' }]}>{dataThongKe[0].duKienCam} Kg</Text>
                </View>
              </View>

              {/* 📈 NHÓM 1: TỔNG QUAN ĐÀN NÁI */}
<Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0056b3', marginBottom: 10, marginTop: 10 }}>
  📈 TỔNG QUAN CƠ SỞ ĐÀN
</Text>

<View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e9ecef', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
  
  {/* Hàng chính: Tổng số heo nái */}
  <View style={[styles.detailRow, { paddingBottom: 10, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
    <Text style={[styles.detailLabel, { fontWeight: 'bold', color: '#333' }]}>Tổng Số Heo Nái:</Text>
    <Text style={[styles.detailVal, { color: '#007bff', fontWeight: 'bold', fontSize: 16 }]}>{dataThongKe[0].tongHeoNai} con</Text>
  </View>
   {/* Hàng Số Heo Đang Đẻ*/}
<View style={styles.detailRow}><Text style={styles.detailLabel}>Số Heo Đang Đẻ:</Text><Text style={styles.detailVal}>{dataThongKe[0].dangDe} con</Text></View>
  {/* Các hàng thông tin chi tiết */}
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>Số Con Đã Phối:</Text>
    <Text style={[styles.detailVal, { fontWeight: '600', color: '#28a745' }]}>{dataThongKe[0].daPhoi} con</Text>
  </View>

  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>Số Con Chưa Phối:</Text>
    <Text style={[styles.detailVal, { fontWeight: '600' }]}>{dataThongKe[0].chuaPhoi} con</Text>
  </View>

  {/* Nhóm chỉ số phụ (Thụt lề nhẹ để phân cấp thông tin) */}
  <View style={{ paddingLeft: 12, marginTop: 4, borderLeftWidth: 2, borderLeftColor: '#dee2e6' }}>
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Chờ Phối:</Text>
      <Text style={styles.detailVal}>{dataThongKe[0].choPhoi} con</Text>
    </View>

    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Cai Sữa:</Text>
      <Text style={styles.detailVal}>{dataThongKe[0].caiSua} con</Text>
    </View>

    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Lốc:</Text>
      <Text style={[styles.detailVal, { color: '#dc3545', fontWeight: '600' }]}>{dataThongKe[0].loc} con</Text>
    </View>

    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Sảy Thai:</Text>
      <Text style={[styles.detailVal, { color: '#dc3545', fontWeight: '600' }]}>{dataThongKe[0].sayThai} con</Text>
    </View>
  </View>

</View>


            

              {/* 📊 NHÓM 3: CHỈ SỐ CHẤT LƯỢNG & NĂNG SUẤT */}
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#28a745', marginBottom: 8 }}>📊 CHỈ SỐ NĂNG SUẤT TRẠI</Text>
              <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, padding: 5, marginBottom: 15, borderWidth: 1, borderColor: '#eee' }}>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Tỉ Lệ Đẻ Thành Công:</Text><Text style={[styles.detailVal, {color:'#28a745'}]}>{dataThongKe[0].tiLeDe}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Tỉ Lệ Cai Sữa Đạt:</Text><Text style={[styles.detailVal, {color:'#28a745'}]}>{dataThongKe[0].tiLeCaiSua}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Khô Thai / Gỗ:</Text><Text style={styles.detailVal}>{dataThongKe[0].khoThai} con</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Heo Con Còi Cọc:</Text><Text style={styles.detailVal}>{dataThongKe[0].coiCoc} con</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Heo Chết Ngộp:</Text><Text style={styles.detailVal}>{dataThongKe[0].chetNgop} con</Text></View>
              </View>

              {/* 🤰 NHÓM 4: CHI TIẾT THEO DÕI TUẦN BẦU */}
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#6f42c1', marginBottom: 8 }}>🐷 CHI TIẾT THEO DÕI TUẦN BẦU ({dataThongKe[0].tuanBauTotal} con)</Text>
              <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, padding: 5, marginBottom: 25, borderWidth: 1, borderColor: '#eee' }}>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>🆕 Mới Phối (Tuần 0):</Text><Text style={styles.detailVal}>{dataThongKe[0].moiPhoi} con</Text></View>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((t) => (
                  <View key={t} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📅 Bầu Tuần {t}:</Text>
                    <Text style={[styles.detailVal, t >= 15 && {color: '#dc3545', fontWeight: 'bold'}]}>
                      {dataThongKe[0]["t" + t] || "0"} con {t >= 15 ? "🔥 (Sắp đẻ)" : ""}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Trại này hiện tại chưa có dữ liệu báo cáo Báo Cáo Thống Kê tổng hợp trên Sever.</Text>
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
              style={[styles.inputStandard, { marginBottom: 0, borderRadius: 20, paddingHorizontal: 15, height: 40, backgroundColor: '#f0f0f0', borderWidth: 0, color: '#111111' }]}
              placeholder="🔍 Nhập Mã Tai để tra cứu heo đang đẻ..."
              placeholderTextColor="#888888"
              value={searchTxtTab4}
              onChangeText={setSearchTxtTab4}
              autoCapitalize="characters"
            />
          </View>
                       <FlatList
            data={
              Array.isArray(danhSachDangDe) ? danhSachDangDe.filter(i => {
                // 🎯 LỌC CHUẨN ĐÉT NGOÀI CHUỒNG: Cột H Ngày Cai Sữa trống thì MỚI HIỆN ở Tab 4
                const ngayCaiSua = i.ngayCaiSua ? i.ngayCaiSua.toString().trim() : "";
                return ngayCaiSua === "" || ngayCaiSua === "---";
              }).filter(i => {
                if (!searchTxtTab4) return true;
                if (!i || !i.maTai) return false;
                return i.maTai.toLowerCase().includes(searchTxtTab4.toLowerCase());
              }) : []
            }
            keyExtractor={(item, index) => item && item.id ? item.id.toString() : index.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Trại hiện tại trống danh sách theo dõi heo đang đẻ.
              </Text>
            }
            renderItem={({ item }) => {
              return (
                <View style={styles.historyCard}>
                  <View style={{ flex: 1 }}>
                    {/* 1. Mã số nái */}
                    <Text style={[styles.cardHeader, { color: '#111111' }]}>
                      🔑 Mã số nái: <Text style={{ color: '#007bff', fontWeight: 'bold' }}>{item.maTai || "---"}</Text> ✅
                    </Text>

                    {/* 2. Giống và Lứa Đẻ bốc từ sheet Xu_li_Heo_De */}
                    <Text style={[styles.cardBody, { color: '#444444', marginTop: 4 }]}>
                      🧬 Giống: {item.giong || "---"} | 🎂 Lứa đẻ: <Text style={{ fontWeight: 'bold', color: '#e83e8c' }}>{item.luaDe || "---"}</Text>
                    </Text>
                    
                    {/* 3. Ngày thực tế đẻ (Dùng đúng logic tự tính toán ngày chuẩn gốc của bác) */}
                    {item.ngayDe ? (
                      <Text style={{ fontSize: 13, color: '#e65100', marginTop: 4, fontWeight: '500' }}>
                        📅 Ngày thực tế đẻ: <Text style={{ fontWeight: 'bold', color: '#111111' }}>{(() => {
                          const str = item.ngayDe.toString().trim();
                          if (str.includes('/') && str.split('/').length === 3) return str.substring(0, 10);
                          const d = new Date(str);
                          if (isNaN(d.getTime())) return str.substring(0, 10);
                          return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                        })()}</Text>
                      </Text>
                    ) : null}

                    {/* 4. Số heo con sơ sinh sống */}
                    {item.soHeoCon && item.soHeoCon !== "" && item.soHeoCon !== "0" ? (
                      <Text style={{ fontSize: 13, color: '#28a745', marginTop: 4, fontWeight: 'bold' }}>
                        🐷 Số heo con sơ sinh: <Text style={{ fontSize: 15, color: '#28a745' }}>{item.soHeoCon}</Text> con
                      </Text>
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
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* THÔNG TIN TRẠNG THÁI HIỆN TẠI TRONG SỔ MÃ TAI */}
              <View style={{ borderWidth: 1, borderColor: '#eeeeee', borderRadius: 8, overflow: 'hidden', backgroundColor: '#ffffff', marginBottom: 15 }}>
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
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>🧬 Giống Heo Nái:</Text>
                        <Text style={styles.detailVal}>{selectedHeoDetail?.giong || "---"}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Lứa hiện tại:</Text>
                        <Text style={[styles.detailVal, {color:'#e83e8c', fontWeight:'bold'}]}>{selectedHeoDetail?.lua || "0"}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Trạng Thái:</Text>
                        <Text style={[styles.detailVal, {color:'#e65100', fontWeight:'bold'}]}>{selectedHeoDetail?.trangThaiCotH || "Trống"}</Text>
                      </View>

                      {nhomNaiTab2 === 'BAU' && <View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>📅 Ngày Phối Giống:</Text>
                          <Text style={styles.detailVal}>{epNgayChuanVietNam(selectedHeoDetail?.ngayCotI)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>📅 Ngày Dự Kiến Đẻ:</Text>
                          <Text style={[styles.detailVal, {color:'#28a745', fontWeight:'bold'}]}>{epNgayChuanVietNam(selectedHeoDetail?.ngayDuKienDeMoi)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Số Ngày Bầu:</Text>
                          <Text style={[styles.detailVal, {color:'#007bff', fontWeight:'bold'}]}>
                            {(() => {
                              let strPhoi = selectedHeoDetail?.ngayCotI ? selectedHeoDetail.ngayCotI.toString().trim() : "";
                              if (strPhoi === "" || strPhoi === "---") return "0 ngày";
                              if (strPhoi.includes('/')) {
                                let p = strPhoi.split('/');
                                if (p.length === 3) strPhoi = `${p[2]}-${p[1]}-${p[0]}`;
                              }
                              const dPhoi = new Date(strPhoi);
                              const dNay = new Date();
                              dPhoi.setHours(0,0,0,0); dNay.setHours(0,0,0,0);
                              const days = Math.floor((dNay.getTime() - dPhoi.getTime()) / (1000*60*60*24));
                              return days >= 0 ? days + " ngày" : "0 ngày";
                            })()}
                          </Text>
                        </View>
                        <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                          <Text style={styles.detailLabel}>⏳ Số Tuần Bầu:</Text>
                          <Text style={[styles.detailVal, {color:'#007bff', fontWeight:'bold'}]}>
                            {(() => {
                              let strPhoi = selectedHeoDetail?.ngayCotI ? selectedHeoDetail.ngayCotI.toString().trim() : "";
                              if (strPhoi === "" || strPhoi === "---") return "0 tuần";
                              if (strPhoi.includes('/')) {
                                let p = strPhoi.split('/');
                                if (p.length === 3) strPhoi = `${p[2]}-${p[1]}-${p[0]}`;
                              }
                              const dPhoi = new Date(strPhoi);
                              const dNay = new Date();
                              dPhoi.setHours(0,0,0,0); dNay.setHours(0,0,0,0);
                              const weeks = Math.floor((dNay.getTime() - dPhoi.getTime()) / (1000*60*60*24*7));
                              return weeks >= 0 ? weeks + " tuần" : "0 tuần";
                            })()}
                          </Text>
                        </View>
                      </View>}

                      {nhomNaiTab2 === 'CHUA_PHOI' && <View>
                        <View style={{ paddingVertical: 10, backgroundColor: '#fff3cd', borderRadius: 6, marginTop: 12, paddingHorizontal: 8, borderWidth: 1, borderColor: '#ffeeba', alignItems: 'center' }}>
                          <Text style={{ fontSize: 13, color: '#856404', fontWeight: 'bold', textAlign: 'center' }}>
                            ⚠️ Chú ý: Heo nái đang Chờ Phối/Lốc. Hãy theo dõi chu kỳ lên giống để phối kịp thời!
                          </Text>
                        </View>
                      </View>}

                      {nhomNaiTab2 === 'NUOI_CON' && <View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>📅 Ngày Đẻ Thực Tế:</Text>
                          <Text style={[styles.detailVal, {color:'#28a745', fontWeight:'bold'}]}>{epNgayChuanVietNam(selectedHeoDetail?.ngayDeCotJ)}</Text>
                        </View>
                        <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                          <Text style={styles.detailLabel}>📅 Ngày Cai Sữa:</Text>
                          <Text style={styles.detailVal}>{epNgayChuanVietNam(selectedHeoDetail?.ngayCaiSuaCotKhat)}</Text>
                        </View>
                      </View>}

                      {nhomNaiTab2 === 'THAI' && <View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>📅 Ngày Đẻ Thực Tế:</Text>
                          <Text style={[styles.detailVal, {color:'#28a745', fontWeight:'bold'}]}>{epNgayChuanVietNam(selectedHeoDetail?.ngayDeCotJ)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>📅 Ngày Cai Sữa:</Text>
                          <Text style={styles.detailVal}>{epNgayChuanVietNam(selectedHeoDetail?.ngayCaiSuaCotKhat)}</Text>
                        </View>
                        <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                          <Text style={styles.detailLabel}>Tháng Đẻ:</Text>
                          <Text style={styles.detailVal}>{selectedHeoDetail?.thangDeCotK || "---"}</Text>
                        </View>
                      </View>}
                    </View>

                  );
                })()}
              </View>

              {/* 📜 KHỐI LỊCH SỬ TRA CỨU ĐẺ OFFLINE CHUẨN XỊN */}
                              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12, paddingLeft: 2, letterSpacing: 0.3 }}>📜 LỊCH SỬ CÁC LỨA ĐÃ ĐẺ</Text>
              
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

                return lichSuDeGộpOffline.map((item, index) => <View key={index} style={{ backgroundColor: '#ffffff', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eef2f5', flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 }}>
                    
                    <View style={{ width: 4, backgroundColor: '#e65100' }} />
                    
                    <View style={{ flex: 1, padding: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#e65100', marginBottom: 5 }}>
                        Lứa đẻ: {item.luaDe || "---"}
                      </Text>

                      <Text style={{ fontSize: 12, color: '#2c3e50', marginBottom: 4, lineHeight: 18 }}>
                        Ngày đẻ: <Text style={{ fontWeight: '500', color: '#111111' }}>{epNgayTuongMinh(item.ngayDe)}</Text>
                      </Text>

                      <Text style={{ fontSize: 12, color: '#2c3e50', marginBottom: 4, lineHeight: 18 }}>
                        Số con đẻ: <Text style={{ fontWeight: '700', color: '#27ae60' }}>{item.soHeoCon || "0"}</Text> <Text style={{ color: '#7f8c8d' }}>(Khô: {item.khoThai || 0} | Còi: {item.coiCoc || 0} | Ngộp: {item.chetNgop || 0})</Text> Chọn Nuôi: <Text style={{ fontWeight: '700', color: '#27ae60' }}>{item.chonNuoi || 0}</Text>
                      </Text>

                      {item.ghiChuDe ? <Text style={{ fontSize: 11, color: '#7f8c8d', fontStyle: 'italic', marginBottom: 4, marginTop: 1 }}>✍️ Ghi chú đẻ: {item.ghiChuDe}</Text> : null}

                      {item.ngayCaiSua && item.ngayCaiSua !== "" && item.ngayCaiSua !== "---" ? <View style={{ borderTopWidth: 1, borderTopColor: '#f1f2f6', marginTop: 6, paddingTop: 6 }}>
                          <Text style={{ fontSize: 12, color: '#2c3e50', marginBottom: 4, lineHeight: 18 }}>
                            Số Con Cai Sữa: <Text style={{ fontWeight: '700', color: '#2980b9' }}>{item.soConCaiSua || "0"}</Text>  Ngày Cai Sữa: <Text style={{ fontWeight: '500', color: '#111111' }}>{epNgayTuongMinh(item.ngayCaiSua)}</Text>
                          </Text>
                          {item.soNgay && item.soNgay !== "0" ? <Text style={{ fontSize: 11, color: '#2980b9', fontWeight: '600', marginBottom: 2 }}>
                            ⏳ Số ngày nuôi con: {item.soNgay} ngày
                          </Text> : null}
                          {item.ghiChuCaiSua ? <Text style={{ fontSize: 11, color: '#7f8c8d', fontStyle: 'italic', marginTop: 1 }}>✍️ Ghi chú cai sữa: {item.ghiChuCaiSua}</Text> : null}
                        </View> : null}
                    </View>

                  </View>);
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
            {editCanNhapSoHeo && (
              <TextInput style={[styles.popupInput, { marginTop: 10, color: '#111111', backgroundColor: '#ffffff' }]} value={editSoHeo} onChangeText={setEditSoHeo} placeholderTextColor="#777777" keyboardType="numeric" />
            )}
            {editSuKien === "Đẻ" && (
  <View style={{ backgroundColor: '#fdf7f2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#f5dad2', marginTop: 10 }}>
    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100', marginBottom: 8 }}>Sửa chi tiết Heo Đẻ:</Text>
    <TextInput style={[styles.popupInput, { marginBottom: 8, fontSize: 14 }]} placeholder="Sửa Khô thai" keyboardType="numeric" placeholderTextColor="#888888" value={editKhoThai} onChangeText={setEditKhoThai} />
    <TextInput style={[styles.popupInput, { marginBottom: 8, fontSize: 14 }]} placeholder="Sửa Còi cọc" keyboardType="numeric" placeholderTextColor="#888888" value={editCoiCoc} onChangeText={setEditCoiCoc} />
    <TextInput style={[styles.popupInput, { marginBottom: 8, fontSize: 14 }]} placeholder="Sửa Chết ngộp" keyboardType="numeric" placeholderTextColor="#888888" value={editChetNgop} onChangeText={setEditChetNgop} />
    <TextInput style={[styles.popupInput, { fontSize: 14 }]} placeholder="Sửa Chọn nuôi" keyboardType="numeric" placeholderTextColor="#888888" value={editChonNuoi} onChangeText={setEditChonNuoi} />
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
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f1f2f6',
        // 🎯 TỰ ĐỘNG TÍNH CHIỀU CAO: Chiều cao gốc 54px + tự cộng thêm số pixel bị chiếm bởi phím ảo hệ thống
        height: 54 + (insets.bottom > 0 ? insets.bottom : 6), 
        // 🎯 TỰ ĐỘNG BÙ LỀ ĐÁY: Đẩy chữ số lên trên phím ảo Android hoặc dải gạch iOS một cách khít khao
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
        <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('nhap_lieu')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: currentTab === 'nhap_lieu' ? '#fff0e6' : 'transparent', paddingBottom: 4, paddingTop: 4, paddingHorizontal: 6, borderRadius: 10, width: '92%', height: 42, alignItems: 'center', justifyContent: 'flex-start' }}>
            <Text style={{ fontSize: 11, fontWeight: currentTab === 'nhap_lieu' ? '700' : '500', color: currentTab === 'nhap_lieu' ? '#e65100' : '#666666' }}>Nhập Liệu</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('ma_tai')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: currentTab === 'ma_tai' ? '#fff0e6' : 'transparent', paddingBottom: 4, paddingTop: 4, paddingHorizontal: 4, borderRadius: 10, width: '96%', height: 42, alignItems: 'center', justifyContent: 'flex-start' }}>
            <Text style={{ fontSize: 11, fontWeight: currentTab === 'ma_tai' ? '700' : '500', color: currentTab === 'ma_tai' ? '#e65100' : '#666666', marginBottom: 2 }}>Sổ Mã Tai</Text>
            <Text style={{ fontSize: 10, fontWeight: currentTab === 'ma_tai' ? '700' : '500', color: currentTab === 'ma_tai' ? '#e65100' : '#28a745' }}>
              {Array.isArray(danhSachMaTai) ? String(danhSachMaTai.filter(item => !item || !item.trangThaiCotH ? true : item.trangThaiCotH.toString().trim().normalize("NFC") !== "Thải").length) : "0"}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('thong_ke')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: currentTab === 'thong_ke' ? '#fff0e6' : 'transparent', paddingBottom: 4, paddingTop: 4, paddingHorizontal: 6, borderRadius: 10, width: '92%', height: 42, alignItems: 'center', justifyContent: 'flex-start' }}>
            <Text style={{ fontSize: 11, fontWeight: currentTab === 'thong_ke' ? '700' : '500', color: currentTab === 'thong_ke' ? '#e65100' : '#666666' }}>Thống Kê</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('heo_de')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: currentTab === 'heo_de' ? '#fff0e6' : 'transparent', paddingBottom: 4, paddingTop: 4, paddingHorizontal: 4, borderRadius: 10, width: '96%', height: 42, alignItems: 'center', justifyContent: 'flex-start' }}>
            <Text style={{ fontSize: 11, fontWeight: currentTab === 'heo_de' ? '700' : '500', color: currentTab === 'heo_de' ? '#e65100' : '#666666', marginBottom: 2 }}>Đang Đẻ</Text>
            <Text style={{ fontSize: 10, fontWeight: currentTab === 'heo_de' ? '700' : '500', color: currentTab === 'heo_de' ? '#e65100' : '#28a745' }}>
              {Array.isArray(danhSachDangDe) ? String(danhSachDangDe.filter(i => !i.ngayCaiSua || i.ngayCaiSua.toString().trim() === "" || i.ngayCaiSua.toString().trim() === "---").length) : "0"}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentTab('heo_thit')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: currentTab === 'heo_thit' ? '#fff0e6' : 'transparent', paddingBottom: 4, paddingTop: 4, paddingHorizontal: 6, borderRadius: 10, width: '92%', height: 42, alignItems: 'center', justifyContent: 'flex-start' }}>
            <Text style={{ fontSize: 11, fontWeight: currentTab === 'heo_thit' ? '700' : '500', color: currentTab === 'heo_thit' ? '#e65100' : '#666666', marginBottom: 2 }}>Heo Thịt</Text>
            <Text style={{ fontSize: 10, fontWeight: currentTab === 'heo_thit' ? '700' : '500', color: currentTab === 'heo_thit' ? '#e65100' : '#28a745' }}>
              {dataHeoThit && dataHeoThit.tongHeoThit ? String(dataHeoThit.tongHeoThit) : "0"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  
  );
}
export default function App() {
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
  tabMenuBar: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', // Kích hoạt tính năng tự động xuống hàng khi hết chiều rộng
    backgroundColor: '#ffffff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#dddddd' 
  },
  tabButton: { 
    paddingVertical: 12, 
    alignItems: 'center', 
    borderBottomWidth: 3, 
    borderBottomColor: 'transparent',
    justifyContent: 'center'
  },
  tabButtonHalf: { 
    width: '50%', // Ép 2 tab đầu chia đôi màn hình
  },
  tabButtonThird: { 
    width: '33.33%', // Ép 3 tab sau chia ba màn hình
    borderTopWidth: 1, // Tạo đường kẻ mờ phân cách hàng trên hàng dưới
    borderTopColor: '#eeeeee'
  },
tabButtonActive: { borderBottomColor: '#e65100' }, 
  tabButtonText: { 
    fontSize: 14, // Tăng kích thước chữ to lên từ 11 thành 14 cho dễ nhìn
    fontWeight: 'bold', // Tăng độ đậm để người nuôi dễ đọc ngoài chuồng nuôi
    color: '#555555' 
  },
  tabButtonTextActive: { color: '#e65100', fontWeight: 'bold' },
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