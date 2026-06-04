import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Nhập thư viện cấu hình Firebase Web SDK xịn cho Expo
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// 🛠 HÃY DÁN CẤU HÌNH FIREBASE CỦA BẠN VÀO ĐÂY
const firebaseConfig = {
  apiKey: "AIzaSyCAjBx_PUHLfNEI0iJr-Er1tU9ZYzcZMrs",
  authDomain: "channuoiheovn-ea76f.firebaseapp.com",
  projectId: "channuoiheovn-ea76f",
  storageBucket: "channuoiheovn-ea76f.firebasestorage.app",
  messagingSenderId: "145385942946",
  appId: "1:145385942946:web:da9faed815bd759b78ccfb",
  measurementId: "G-XM4KM1L4DS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Cấu hình thêm dòng này để bạn gọi hàm đăng nhập phía dưới nếu cần

// ❌ ĐÃ XÓA BỎ DÒNG const analytics = getAnalytics(app); GÂY CRASH APP TẠI ĐÂY!

export default function App() {
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxFgDzer1K0TaWIBqncYmpNpp-YvX8ZJ9hBW_vuTTPRdqMtOY2ZI-06IaFnsEmnasP7/exec';

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
  
  // STATE MODAL SỬA TAB 1
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editNgay, setEditNgay] = useState('');
  const [isEditDatePickerVisible, setEditDatePickerVisibility] = useState(false);
  const [editMaTai, setEditMaTai] = useState('');
  const [editSuKien, setEditSuKien] = useState('Phối');
  const [editSoHeo, setEditSoHeo] = useState('');

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
      setDongBoStatus('⏳ Đang tải dữ liệu lịch sử của trại từ Sever...');
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

    const duongLinkGửiData = `${WEB_APP_URL}?action=${bodyData.actionType}&id=${bodyData.id}&userEmail=${userEmail.toLowerCase().trim()}&maTrai=${traiMaHoa}&ngay=${ngayMaHoa}&maTai=${maTaiMaHoa}&suKien=${suKienMaHoa}&soHeo=${bodyData.soHeo !== undefined ? bodyData.soHeo : ""}&giong=${giongMaHoa}&lua=${luaMaHoa}`;

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
      syncStatus: "waiting", 
      actionType: "create" 
    };
    
    setDanhSachLichSu(prev => [dongMoi, ...prev]);
    setMaTai(''); setSoHeo('');

    setDongBoStatus(`⏳ Đang đồng bộ nhật ký tai: ${dongMoi.maTai}...`);
    guiYeuCauMang(dongMoi, (res) => {
      if (res.status === 'success') {
        setDanhSachLichSu(prev => prev.map(i => i.id === dongMoi.id ? { ...i, syncStatus: "synced" } : i));
        setDongBoStatus('✅ Đã đồng bộ Nhật Ký lên Sever Trung Tâm!');
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
    
    setIsEditModalVisible(true); 
  };

  const handleSaveEdit = () => {
    const dongChỉnhSửa = {
      id: editingId,
      ngay: editNgay,
      maTai: editMaTai.toUpperCase().trim(),
      suKien: editSuKien,
      soHeo: editCanNhapSoHeo ? Number(editSoHeo) : "",
      syncStatus: "waiting",
      actionType: "update"
    };

    setDanhSachLichSu(prev => prev.map(item => item.id === editingId ? dongChỉnhSửa : item));
    setIsEditModalVisible(false);
    setEditingId(null);

    setDongBoStatus(`⏳ Đang cập nhật nhật ký tai: ${dongChỉnhSửa.maTai}...`);
    guiYeuCauMang(dongChỉnhSửa, (res) => {
      if (res.status === 'success') {
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

    setDongBoStatus(`⏳ Đang đồng bộ danh bạ tai: ${dongMoi.maTai}...`);
    guiYeuCauMang(dongMoi, (res) => {
      if (res.status === 'success') {
        setDanhSachMaTai(prev => prev.map(i => i.id === dongMoi.id ? { ...i, syncStatus: "synced" } : i));
        setDongBoStatus('✅ Đã đồng bộ Danh Bạ Mã Tai lên Sever Trung Tâm!');
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
        <Text style={styles.loginSub}>Ổ khóa kết hợp Firebase Cloud và Phân quyền Trại từ xa</Text>
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
      
         {/* THANH MENU CHUYỂN TRANG CHIA 2 HÀNG TO RÕ */}
      <View style={styles.tabMenuBar}>
        {/* HÀNG 1: 2 TAB ĐẦU (Chiếm 50% chiều rộng mỗi tab) */}
        <TouchableOpacity style={[styles.tabButton, styles.tabButtonHalf, currentTab === 'nhap_lieu' && styles.tabButtonActive]} onPress={() => setCurrentTab('nhap_lieu')}>
          <Text style={[styles.tabButtonText, currentTab === 'nhap_lieu' && styles.tabButtonTextActive]}>📝 Nhập Liệu</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tabButton, styles.tabButtonHalf, currentTab === 'ma_tai' && styles.tabButtonActive]} onPress={() => setCurrentTab('ma_tai')}>
          <Text style={[styles.tabButtonText, currentTab === 'ma_tai' && styles.tabButtonTextActive]}>🔑 Sổ Mã Tai ({Array.isArray(danhSachMaTai) ? danhSachMaTai.length : 0})</Text>
        </TouchableOpacity>

        {/* HÀNG 2: 3 TAB SAU (Chiếm 33.33% chiều rộng mỗi tab) */}
        <TouchableOpacity style={[styles.tabButton, styles.tabButtonThird, currentTab === 'thong_ke' && styles.tabButtonActive]} onPress={() => setCurrentTab('thong_ke')}>
          <Text style={[styles.tabButtonText, currentTab === 'thong_ke' && styles.tabButtonTextActive]}>📊 Thống Kê </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tabButton, styles.tabButtonThird, currentTab === 'heo_de' && styles.tabButtonActive]} onPress={() => setCurrentTab('heo_de')}>
          <Text style={[styles.tabButtonText, currentTab === 'heo_de' && styles.tabButtonTextActive]}>🐷 Đang Đẻ ({Array.isArray(danhSachDangDe) ? danhSachDangDe.filter(i => !i.ngayCaiSua || i.ngayCaiSua.toString().trim() === "" || i.ngayCaiSua.toString().trim() === "---").length : 0})</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tabButton, styles.tabButtonThird, currentTab === 'heo_thit' && styles.tabButtonActive]} onPress={() => setCurrentTab('heo_thit')}>
          <Text style={[styles.tabButtonText, currentTab === 'heo_thit' && styles.tabButtonTextActive]}>🐖 Heo Thịt ({dataHeoThit && dataHeoThit.tongHeoThit ? dataHeoThit.tongHeoThit : "0"})</Text>
        </TouchableOpacity>
      </View>

      {/* THANH THÔNG TIN TÀI KHOẢN VÀ TRẠI ĐANG LÀM VIỆC */}
      <View style={styles.userInfoRow}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.userInfoText} numberOfLines={1}>👤 Khách: <Text style={{fontWeight:'bold'}}>{userEmail}</Text></Text>
          <TouchableOpacity onPress={() => setIsTraiModalVisible(true)}>
            <Text style={{fontSize:13, color:'#e65100', fontWeight:'bold', marginTop:2}} numberOfLines={1}>🏡 Đang làm tại: {selectedTrai || "Chưa chọn"} (Đổi)</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleLogOut}><Text style={styles.logoutText}>Đăng xuất 🚪</Text></TouchableOpacity>
      </View>

      {/* THANH TRẠNG THÁI ĐỒNG BỘ */}
      <View style={styles.statusMiniBox}>
        <Text style={styles.statusMiniText} numberOfLines={1}>{dongBoStatus}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshData} disabled={isInitialLoading}>
          <Text style={styles.refreshButtonText}>🔄 Làm Mới</Text>
        </TouchableOpacity>
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

            ListHeaderComponent={
              <View style={{ backgroundColor: '#ffffff', paddingBottom: 5 }}>
                <View style={styles.formFixedContainer}>
                  <View style={styles.rowInput}>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setDatePickerVisibility(true)}>
                      <Text style={styles.dateButtonText}>📅 {ngayHienThi}</Text>
                    </TouchableOpacity>
                    {!laSuKienBanHeo ? (
                      <TextInput style={[styles.inputMaTai, { color: '#111111', backgroundColor: '#ffffff' }]} placeholder="Mã Tai" placeholderTextColor="#777777" value={maTai} onChangeText={setMaTai} autoCapitalize="characters" />
                    ) : (
                      <View style={{ flex: 0.5 }} />
                    )}
                  </View>
                  <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={(d) => { setNgayHienThi(formatVNDate(d)); setDatePickerVisibility(false); }} onCancel={() => setDatePickerVisibility(false)} confirmTextConfirm="Xác nhận" cancelTextMagdalene="Hủy" />
                  
                  <View style={styles.pickerBorder}>
                    <Picker selectedValue={suKien} dropdownIconColor="#111111" style={{ color: '#111111', backgroundColor: '#ffffff' }} onValueChange={(itemValue) => { setSuKien(itemValue); setSoHeo(''); }}>
                      {danhSachSuKien.map((item, index) => (
                        <Picker.Item key={index} label={item} value={item} style={{ color: '#111111', backgroundColor: '#ffffff' }} />
                      ))}
                    </Picker>
                  </View>
                  {canNhapSoHeo && <TextInput style={[styles.inputStandard, { color: '#111111', backgroundColor: '#ffffff' }]} value={soHeo} onChangeText={setSoHeo} placeholder="Nhập Số Heo (con)" keyboardType="numeric" placeholderTextColor="#888888"/>}
                  <Button title="GỬI NHẬT KÝ LÊN Sever" onPress={handleSaveNew} color="#28a745" />
                </View>

                <View style={{ paddingHorizontal: 15, marginTop: 10, marginBottom: 5 }}>
                  <TextInput style={[styles.inputStandard, { marginBottom: 0, borderRadius: 20, paddingHorizontal: 15, height: 40, backgroundColor: '#f0f0f0', borderWidth: 0, color: '#111111' }]} placeholder="🔍 Nhập Mã Tai để tra cứu lịch sử HEO..." placeholderTextColor="#888888" value={searchTxtTab1} onChangeText={setSearchTxtTab1} autoCapitalize="characters" />
                </View>
              </View>
            }

            renderItem={({ item }) => (
              <View style={[styles.historyCard, item.syncStatus === "waiting" && styles.cardWaiting]}>
                <View style={{ flex: 1, paddingRight: 5 }}>
                  <Text style={styles.cardHeader}>
                    📅 {(() => {
                      if (!item.ngay) return "---";
                      const str = item.ngay.toString().trim();
                      if (str.includes('/') && str.split('/')[0].length === 2) return str.substring(0, 10);
                      const d = new Date(str);
                      if (isNaN(d.getTime())) return str.substring(0, 10);
                      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                    })()} | Mã Tai: <Text style={{color:'#007bff', fontWeight:'bold'}}>{item.maTai}</Text>
                  </Text>
                  <Text style={styles.cardBody}>📝 {item.suKien} {item.soHeo !== "" ? `(${item.soHeo} con)` : ""}</Text>
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
                            
                            guiYeuCauMang(dongMuonXoa, (res) => {
                              if (res && res.status === 'success') {
                                setDanhSachLichSu(prev => prev.filter(i => i.id !== item.id));
                                setDongBoStatus("✅ Đã xóa dòng nhật ký thành công!");
                              } else {
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
            {/* TAB 2: MÃ TAI */}
      {currentTab === 'ma_tai' && (
        <View style={{ flex: 1 }}>
          <FlatList 
                        data={
              Array.isArray(danhSachMaTai) ? danhSachMaTai
                .filter(item => {
                  if (!searchTxtTab2) return true;
                  if (!item || !item.maTai) return false;
                  return item.maTai.toString().toLowerCase().includes(searchTxtTab2.toLowerCase().trim());
                })
                // 🎯 THUẬT TOÁN SẮP XẾP CHUẨN ĐÉT: Quy đổi mọi loại ngày về số để không bị nhảy xen kẽ lộn xộn
                .sort((a, b) => {
                  const layMocThoiGianAnToan = (item) => {
                    if (!item || !item.ngayDeCotJ) return 0;
                    let str = item.ngayDeCotJ.toString().trim();
                    if (str === "" || str === "---") return 0;
                    
                    // Trường hợp 1: Nếu dữ liệu là chuỗi Việt Nam có dấu gạch chéo DD/MM/YYYY
                    if (str.includes('/')) {
                      let p = str.split('/');
                      if (p.length === 3) {
                        let ngay = p[0].toString().trim().padStart(2, '0');
                        let thang = p[1].toString().trim().padStart(2, '0');
                        let nam = p[2].toString().trim().substring(0, 4);
                        // Ép về cấu trúc YYYY-MM-DD chuẩn quốc tế
                        str = `${nam}-${thang}-${ngay}`;
                      }
                    }
                    
                    // Chuyển chuỗi văn bản về định dạng con số Timestamp để so sánh chính xác 100%
                    let timestamp = Date.parse(str);
                    return isNaN(timestamp) ? 0 : timestamp;
                  };

                  let mocA = layMocThoiGianAnToan(a);
                  let mocB = layMocThoiGianAnToan(b);

                  // Đưa con có lịch Dự Đẻ lớn hơn (gần nhất/mới nhất) lên vị trí đầu tiên
                  if (mocA !== mocB) return mocA - mocB;

                  
                  let idA = a && a.id ? a.id.toString() : "";
                  let idB = b && b.id ? b.id.toString() : "";
                  return idB.localeCompare(idA);
                }) : []
            }

            keyExtractor={(i) => i.id} 
            
            // 🎯 GỘP FORM VÀ Ô TÌM KIẾM VÀO LIST HEADER ĐỂ TỰ ĐỘNG ẨN KHI CUỘN XUỐNG
            ListHeaderComponent={
              <View style={{ backgroundColor: '#ffffff', paddingBottom: 5 }}>
                {/* Form nhập liệu gốc Tab 2 - GIỮ NGUYÊN HOÀN TOÀN CẤU TRÚC GỐC CỦA BẠN */}
                <View style={styles.formFixedContainer}>
                  <View style={styles.rowInput}>
                    <TextInput 
                      style={[styles.inputStandard, { flex: 1, marginBottom: 0, marginRight: 8, color: '#111111', backgroundColor: '#ffffff' }]} 
                      placeholder="Mã Tai" 
                      placeholderTextColor="#777777" 
                      value={mtMaTai} 
                      onChangeText={setMtMaTai} 
                      autoCapitalize="characters" 
                    />
                    <TextInput 
                      style={[styles.inputStandard, { flex: 1, marginBottom: 0, color: '#111111', backgroundColor: '#ffffff' }]} 
                      placeholder="Giống heo" 
                      placeholderTextColor="#777777" 
                      value={mtGiong} 
                      onChangeText={setMtGiong} 
                    />
                  </View>
                  <View style={[styles.popupPickerBorder, { marginTop: 10, marginBottom: 12 }]}>
                    <Picker 
                      selectedValue={mtLua} 
                      dropdownIconColor="#111111" 
                      style={{ color: '#111111', backgroundColor: '#ffffff' }} 
                      onValueChange={(itemValue) => setMtLua(itemValue)}
                    >
                      {danhSachLuaHeo.map((item, index) => (
                        <Picker.Item key={index} label={item} value={item} style={{ color: '#111111', backgroundColor: '#ffffff' }} />
                      ))}
                    </Picker>
                  </View>
                  <Button title="THÊM MÃ TAI VÀO SỔ" onPress={handleSaveMaTai} color="#28a745" />
                </View>

                {/* Ô Tìm Kiếm Mã Tai độc lập */}
                <View style={{ paddingHorizontal: 15, marginTop: 10, marginBottom: 5 }}>
                  <TextInput 
                    style={[styles.inputStandard, { marginBottom: 0, borderRadius: 20, paddingHorizontal: 15, height: 50, backgroundColor: '#f0f0f0', borderWidth: 0, color: '#111111' }]} 
                    placeholder="🔍 Nhập Mã Tai để tìm kiếm..." 
                    placeholderTextColor="#888888" 
                    value={searchTxtTab2} 
                    onChangeText={setSearchTxtTab2} 
                    autoCapitalize="characters" 
                    disableFullscreenUI={true}
                  />
                </View>
              </View>
            }

            renderItem={({ item }) => (
              <View style={[{ flexDirection: 'row', alignItems: 'center' }, styles.historyCard, item.syncStatus === "waiting" && styles.cardWaiting]}>
                
                {/* Phần chữ bên trái */}
                <View style={{ flex: 1, paddingRight: 5 }}>
                  <Text style={styles.cardHeader}>🔑 Mã số: <Text style={{color: '#007bff', fontWeight: 'bold'}}>{item.maTai}</Text></Text>
                  <Text style={styles.cardBody} numberOfLines={1}>🧬 Giống: {item.giong} | 🎂 Lứa: <Text style={{fontWeight: 'bold', color: '#e83e8c'}}>{item.lua}</Text></Text>
                  {item.trangThaiCotH ? <Text style={{ fontSize: 12, color: '#e65100', marginTop: 2, fontWeight: 'bold' }}>✨ Trạng thái: {item.trangThaiCotH}</Text> : null}
                  {item.ngayDeCotJ ? (
                    <Text style={{ fontSize: 12, color: '#28a745', marginTop: 2, fontWeight: '500' }}>
                      📅 Dự Đẻ: {(() => {
                        const str = item.ngayDeCotJ.toString().trim();
                        if (str.includes('/') && str.split('/')[0].length === 2) return str.substring(0, 10);
                        const d = new Date(str);
                        if (isNaN(d.getTime())) return str.substring(0, 10);
                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                      })()}
                    </Text>
                  ) : null}
                </View>

                {/* Phần nút bấm bên phải được sắp xếp dọc cân đối, dễ bấm hơn */}
                <View style={{ flexDirection: 'column', gap: 6, minWidth: 60 }}>
                  <TouchableOpacity 
                    onPress={()=>{setSelectedHeoDetail(item);setIsDetailModalVisible(true);setLoadingLichSuDe(true);fetch(`${WEB_APP_URL}?action=get_lich_su_de&userEmail=${userEmail.toLowerCase().trim()}&maTrai=${encodeURIComponent(selectedTrai)}&maTai=${item.maTai}`,{method:'GET',redirect:'follow'}).then(res=>res.json()).then(result=>{setLoadingLichSuDe(false);if(result.status==='success'&&result.data){setMangLichSuDeCuaTai(result.data);}}).catch(()=>setLoadingLichSuDe(false));}} 
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
                    onPress={()=>{Alert.alert("Xác nhận",`Xóa mã tai [${item.maTai}] khỏi sổ?`,[{text:"Hủy"},{text:"Xóa",onPress:()=>{const dongMuonXoa={...item,syncStatus:"waiting",actionType:"mt_delete"};setDongBoStatus(`⏳ Đang xóa tai: ${item.maTai}...`);guiYeuCauMang(dongMuonXoa,(res)=>{if(res&&res.status==='success'){setDanhSachMaTai(prev=>prev.filter(i=>i.id!==item.id));setDongBoStatus('✅ Đã xóa Mã Tai thành công!');}});}}]);}} 
                    style={{ backgroundColor: '#dc3545', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>Xóa</Text>
                  </TouchableOpacity>
                </View>

              </View>
            )} 
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
            <Text style={[styles.popupTitle, { fontSize: 18, color: '#007bff', marginBottom: 5 }]}>👁️ CHI TIẾT HEO NÁI: {selectedHeoDetail?.maTai}</Text>
            
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
                      <View style={styles.detailRow}><Text style={styles.detailLabel}>🧬 Giống Heo Nái:</Text><Text style={styles.detailVal}>{selectedHeoDetail?.giong}</Text></View>
                      <View style={styles.detailRow}><Text style={styles.detailLabel}>Lứa hiện tại:</Text><Text style={[styles.detailVal, {color:'#e83e8c', fontWeight:'bold'}]}>{selectedHeoDetail?.lua}</Text></View>
                      <View style={styles.detailRow}><Text style={styles.detailLabel}>Trạng Thái:</Text><Text style={[styles.detailVal, {color:'#e65100', fontWeight:'bold'}]}>{selectedHeoDetail?.trangThaiCotH || "Trống"}</Text></View>
                      <View style={styles.detailRow}><Text style={styles.detailLabel}>📅 Phối/Cai/Đẻ:</Text><Text style={styles.detailVal}>{epNgayChuanVietNam(selectedHeoDetail?.ngayCotI)}</Text></View>
                      <View style={styles.detailRow}><Text style={styles.detailLabel}>Ngày Đẻ:</Text><Text style={[styles.detailVal, {color:'#28a745', fontWeight:'bold'}]}>{epNgayChuanVietNam(selectedHeoDetail?.ngayDeCotJ)}</Text></View>
                      <View style={styles.detailRow}><Text style={styles.detailLabel}>Tháng Đẻ:</Text><Text style={styles.detailVal}>{selectedHeoDetail?.thangDeCotK || "---"}</Text></View>
                      <View style={styles.detailRow}><Text style={styles.detailLabel}>Ngày Bầu:</Text><Text style={styles.detailVal}>{selectedHeoDetail?.ngayBauCotL || "0"} ngày</Text></View>
                      <View style={[styles.detailRow, { borderBottomWidth: 0 }]}><Text style={styles.detailLabel}>⏳ Tuần Bầu (Cột M):</Text><Text style={[styles.detailVal, {color:'#007bff', fontWeight:'bold'}]}>{selectedHeoDetail?.tuanBauCotM || "0"} tuần</Text></View>
                    </View>
                  );
                })()}
              </View>

              {/* 📜 KHỐI LỊCH SỬ TRA CỨU ĐẺ OFFLINE CHUẨN XỊN */}
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#444444', marginBottom: 8, paddingLeft: 2 }}>📜 LỊCH SỬ CÁC LỨA ĐÃ ĐẺ </Text>
              
              {(() => {
                const epNgayTuongMinh = (str) => {
                  if (!str || str.toString().trim() === "") return "---";
                  let s = str.toString().trim();
                  if (s.includes('/') && s.split('/').length === 3) return s.substring(0, 10);
                  const d = new Date(s);
                  if (isNaN(d.getTime())) return s.substring(0, 10);
                  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                };

                // Tự động bốc lịch sử đẻ từ mảng dữ liệu tổng đã nạp trong bộ nhớ máy
               // 🎯 ĐÃ RÚT GỌN SIÊU NGẮN CHO MODAL 1 - CHẠY THẦN TỐC
const lichSuDeGộpOffline = danhSachDangDe
  .filter(heo => {
    const maTaiKhachChon = selectedHeoDetail?.maTai?.toString().toUpperCase().trim();
    const maTaiTuSheet = (heo.maTai || "").toString().toUpperCase().trim();
    return maTaiTuSheet === maTaiKhachChon && maTaiKhachChon !== "";
  })
  .sort((a, b) => Number(b.luaDe || 0) - Number(a.luaDe || 0)); // Xếp lứa mới nhất lên đầu

if (lichSuDeGộpOffline.length === 0) {
  return (
    <View style={{ padding: 12, backgroundColor: '#fdf6f6', borderRadius: 8, borderWidth: 1, borderColor: '#fde8e8' }}>
      <Text style={{ fontSize: 13, color: '#c53030', textAlign: 'center', fontStyle: 'italic' }}>Chưa ghi nhận dữ liệu lịch sử lứa đẻ nào cho mã tai này.</Text>
    </View>
  );
}

return lichSuDeGộpOffline.map((item, index) => (
  <View key={index} style={{ backgroundColor: '#fff5f5', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#ffe3e3' }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#ffe3e3', paddingBottom: 6, marginBottom: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#d32f2f' }}>🎂 Lứa đẻ: {item.luaDe || "---"}</Text>
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#28a745' }}>🐷 Số con: {item.soHeoCon || "0"} con</Text>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 }}>
      <Text style={{ fontSize: 12, color: '#555555' }}>📅 Ngày thực tế đẻ:</Text>
      <Text style={{ fontSize: 12, fontWeight: '500', color: '#111111' }}>{epNgayTuongMinh(item.ngayDe)}</Text>
    </View>
    {item.ngayCaiSua && item.ngayCaiSua !== "" && item.ngayCaiSua !== "---" ? (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 }}>
        <Text style={{ fontSize: 12, color: '#555555' }}>🥛 Ngày cai sữa đàn:</Text>
        <Text style={{ fontSize: 12, fontWeight: '500', color: '#111111' }}>{epNgayTuongMinh(item.ngayCaiSua)}</Text>
      </View>
    ) : null}
  </View>
));

if (lichSuDeOffline.length === 0) {
  return (
    <View style={{ padding: 12, backgroundColor: '#fdf6f6', borderRadius: 8, borderWidth: 1, borderColor: '#fde8e8' }}>
      <Text style={{ fontSize: 13, color: '#c53030', textAlign: 'center', fontStyle: 'italic' }}>Chưa ghi nhận dữ liệu lịch sử lứa đẻ nào cho mã tai này.</Text>
    </View>
  );
}

return lichSuDeOffline.map((item, index) => (
  <View key={index} style={{ backgroundColor: '#fff5f5', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#ffe3e3' }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#ffe3e3', paddingBottom: 6, marginBottom: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#d32f2f' }}>🎂 Lứa đẻ: Lứa thực tế</Text>
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#28a745' }}>🐷 Số con: {item.soHeo || "0"} con</Text>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 }}>
      <Text style={{ fontSize: 12, color: '#555555' }}>📅 Ngày thực tế đẻ:</Text>
      <Text style={{ fontSize: 12, fontWeight: '500', color: '#111111' }}>{epNgayTuongMinh(item.ngay)}</Text>
    </View>
  </View>
));

return mangLichSuDeCuaTai.map((item, index) => (
  <View key={index} style={{ backgroundColor: '#fff5f5', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#ffe3e3' }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#ffe3e3', paddingBottom: 6, marginBottom: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#d32f2f' }}>🎂 Lứa đẻ: {item.luaDe || "---"}</Text>
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#28a745' }}>🐷 Số con: {item.soHeoCon || "0"} con</Text>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 }}>
      <Text style={{ fontSize: 12, color: '#555555' }}>📅 Ngày thực tế đẻ:</Text>
      <Text style={{ fontSize: 12, fontWeight: '500', color: '#111111' }}>{epNgayTuongMinh(item.ngayDe)}</Text>
    </View>
    {item.ngayCaiSua && item.ngayCaiSua !== "" && item.ngayCaiSua !== "---" ? (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 }}>
        <Text style={{ fontSize: 12, color: '#555555' }}>🥛 Ngày cai sữa đàn:</Text>
        <Text style={{ fontSize: 12, fontWeight: '500', color: '#111111' }}>{epNgayTuongMinh(item.ngayCaiSua)}</Text>
      </View>
    ) : null}
  </View>
));
              })()}
            </ScrollView>

            <View style={{ marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }}>
              <Button title="ĐÓNG CỬA SỔ XEM" onPress={() => { setIsDetailModalVisible(false); setSelectedHeoDetail(null); }} color="#6c757d" />
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

    </KeyboardAvoidingView>
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