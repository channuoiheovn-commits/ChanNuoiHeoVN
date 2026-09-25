import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { parseToDateObject, formatVNDate } from './DateUtils';
import FarmLogSubForm from './FarmLogSubForm';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { ghiDongMoi, ghiNhieuDong, suaDong, xoaDong, layDongCuaChuong, xoaNhieuDong } from './chuongThitService';

const { width } = Dimensions.get('window');

const FarmMapSubTab = ({ 
  danhSachChuongThit, 
  setDanhSachChuongThit, 
  WEB_APP_URL, 
  userEmail,
  setDongBoStatus,
  cauHinhVacXinLoc,
}) => {
  // --- STATE DIEU KHIEN POPUP MODAL HANH DONG TAI CHUONG ---
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const [selectedChuongGop, setSelectedChuongGop] = useState(null); 
  const [modalSubTab, setModalSubTab] = useState("AN_FORM"); 
  const [tabNhatKyToanTrai, setTabNhatKyToanTrai] = useState("QUAN_SO");
const [soDongNhatKyCam, setSoDongNhatKyCam] = useState(30);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // --- STATE AN HIEN ACCORDION TAO CHUONG MOI NGOAI MAT TIEN ---
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false); 
  

  // --- STATE PHUC VU KHAY NHAP LIEU BEN TRONG POPUP MODAL ---
  const [tenKhuInput, setTenKhuInput] = useState("");
  const [soHeoInput, setSoHeoInput] = useState("");
  const [tuanTuoiInput, setTuanTuoiInput] = useState("");
  const [ghiChuInput, setGhiChuInput] = useState(""); 
  const [editingRowId, setEditingRowId] = useState(null); 
  const [isSending, setIsSaving] = useState(false);

  // --- STATE AN HIEN CALENDAR ACCORDION PHẲNG TRONG POPUP ---
  const [ngayNhapInput, setNgayNhapInput] = useState(formatVNDate(new Date())); 
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); 
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date().getMonth());
  const [currentCalendarYear, setCurrentCalendarYear] = useState(new Date().getFullYear());

  // --- STATE PHUC VU KHAY TAO CHUONG TRONG MOI NGOAI MAT TIEN ---
  const [tenKhuMoiInput, setTenKhuMoiInput] = useState("Cai Sữa"); 
  const [maChuongMoiInput, setMaChuongMoiInput] = useState("");
  const [ghiChuMoiInput, setGhiChuMoiInput] = useState(""); 
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // --- STATE PHUC VU KHAU LUAN CHUYEN O CHUONG DOI XUONG ---
  const [soHeoChuyenInput, setSoHeoChuyenInput] = useState("");
  const [chuongDichInput, setChuongDichInput] = useState("");
  const [khuDichInput, setKhuDichInput] = useState("Cai Sữa");
  const [tuanChuyenDuocChon, setTuanChuyenDuocChon] = useState("");

  
  // 🎯 THUAT TOAN THOI GIAN: Dich chuyen moc ngay ve Thu Hai dau tuan dung truoc
  const layNgayThuHaiDauTuan = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) return new Date();
    const saoChep = new Date(dateObj.getTime());
    saoChep.setHours(0, 0, 0, 0);
    const khoangCach = saoChep.getDay() === 0 ? 6 : saoChep.getDay() - 1;
    return new Date(saoChep.getTime() - khoangCach * 24 * 60 * 60 * 1000);
  };

  // 🧠 THUAT TOAN TINH TUOI CHOT THU HAI: Tu dong nhay so dong loat vao dau tuan
  const tinhTuoiTinhTienThuHai = (tuoiGocLucVao, ngayNhapGoc) => {
    const tuoiVao = Number(tuoiGocLucVao) || 0;
    if (tuoiVao === 0 || !ngayNhapGoc) return tuoiVao;

    const ngayVaoObj = parseToDateObject(ngayNhapGoc);
    if (!ngayVaoObj) return tuoiVao;

    const ngayHomNayObj = new Date();
    ngayHomNayObj.setHours(0, 0, 0, 0);

    const thuHaiGocVao = layNgayThuHaiDauTuan(ngayVaoObj);
    const thuHaiHomNay = layNgayThuHaiDauTuan(ngayHomNayObj);

    const soMiligiayChenh = thuHaiHomNay.getTime() - thuHaiGocVao.getTime();
    const soTuanChenhRealTime = Math.floor(soMiligiayChenh / (7 * 24 * 60 * 60 * 1000));

    return tuoiVao + (soTuanChenhRealTime > 0 ? soTuanChenhRealTime : 0);
  };

  // 🗓️ THUAT TOAN MA TRAN LICH CHON PHANG MINI
  const danhSachNgayTrongThangCalendar = React.useMemo(() => {
    const ngayDauThang = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const ngayCuoiThang = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
    const dayOfFirst = ngayDauThang.getDay();
    const paddingNgayTruoc = dayOfFirst === 0 ? 6 : dayOfFirst - 1;

    const mangCalendarNgay = [];
    for (let i = paddingNgayTruoc; i > 0; i--) {
      const d = new Date(currentCalendarYear, currentCalendarMonth, 1 - i);
      mangCalendarNgay.push({ dateObj: d, laThangChinh: false });
    }
    for (let i = 1; i <= ngayCuoiThang.getDate(); i++) {
      const d = new Date(currentCalendarYear, currentCalendarMonth, i);
      mangCalendarNgay.push({ dateObj: d, laThangChinh: true });
    }
    return mangCalendarNgay;
  }, [currentCalendarMonth, currentCalendarYear]);
  // 📡 LENH MANG 1: KHI TAO O CHUONG TRONG MOI (GHI THANG LEN FIRESTORE, CLOUD FUNCTION TU DONG DONG BO SANG SHEET)
  const handleTaoChuongMoiTinh = () => {
    if (!maChuongMoiInput.trim()) {
      return Alert.alert("Thông báo", "Vui lòng nhập tên/số mã chuồng muốn khởi tạo trước!");
    }
    setIsCreatingRoom(true);
    if (typeof setDongBoStatus === 'function') setDongBoStatus("⏳ Đang tạo chuồng mới...");

    const khuChuan = tenKhuMoiInput.trim();
    const ghiChuChuan = ghiChuMoiInput.trim() || "Chuồng trống mới khởi tạo";
    const chuoiNgayHnay = formatVNDate(new Date());

    // 🚀 MỎ NEO KHỞI TẠO: Ghim cứng nhãn TAO_CHUONG vào suKienHeoThit (cột K trên Sheet) ngay từ giây phút ô chuồng được khai sinh
    ghiDongMoi({
      userEmail, tenKhu: khuChuan, tenChuong: maChuongMoiInput.trim(),
      soCon: 0, tuanTuoi: 0, ngayNhapChuong: chuoiNgayHnay, ghiChu: ghiChuChuan,
      soBaoCam: 0, soLieuVaccine: 0, suKienHeoThit: "TAO_CHUONG"
    }).then(chuongTrongLocal => {
      setIsCreatingRoom(false);
      if (typeof setDongBoStatus === 'function') setDongBoStatus("✅ Đã dựng chuồng trống!");
      Alert.alert("Thành công 🎉", `Đã tạo thành công [Chuồng ${maChuongMoiInput.trim()}] tại [Khu ${khuChuan}].`);
      if (typeof setDanhSachChuongThit === 'function') { setDanhSachChuongThit(prev => [...(Array.isArray(prev) ? prev : []), chuongTrongLocal]); }
      setMaChuongMoiInput(""); setGhiChuMoiInput(""); setIsCreateFormOpen(false);
    }).catch(() => {
      setIsCreatingRoom(false);
      Alert.alert("Thông báo", "Không thể khởi tạo chuồng, vui lòng kiểm tra mạng và bấm lại!");
    });
  };
  // 📡 LENH MANG 2: NAP MOI / SUA DE BAY LE QUA ID (GHI THANG FIRESTORE LEDGER)
  const handleXacNhanGhiChuongMoi = (soHeoTruyenTrucTiep, ghiChuTruyenTrucTiep) => {
    setIsSaving(true);
    if (typeof setDongBoStatus === 'function') setDongBoStatus("⏳ Đang dồn số liệu vào chuồng...");

    const chuongHienTai = selectedChuongGop?.tenChuong || "1";
    const khuChuan = selectedChuongGop?.tenKhu || "Cai Sữa";
    const chuoiNgayHnay = ngayNhapInput.trim() || formatVNDate(new Date());

    // Phần dữ liệu dùng chung cho cả ghi mới lẫn sửa
    const phanDuLieu = {
      tenKhu: khuChuan,
      tenChuong: chuongHienTai,
      soCon: Number(soHeoTruyenTrucTiep) || 0,
      ngayNhapChuong: chuoiNgayHnay,
      ghiChu: ghiChuTruyenTrucTiep
    };
    if (tuanTuoiInput !== "") phanDuLieu.tuanTuoi = Number(tuanTuoiInput) || 0; // Khi sửa: để trống thì giữ nguyên tuổi cũ

    const idDangSua = editingRowId;
    const tacVuGhi = idDangSua
      ? suaDong(idDangSua, phanDuLieu).then(() => null)
      : ghiDongMoi({ userEmail, ...phanDuLieu, tuanTuoi: Number(tuanTuoiInput || 4), soBaoCam: 0, soLieuVaccine: 0, suKienHeoThit: "NHAP_HEO" });

    tacVuGhi.then(dongMoiDaGhi => {
      setIsSaving(false);
      if (typeof setDongBoStatus === 'function') setDongBoStatus("✅ Đã cập nhật chuồng trại!");
      Alert.alert("Thành công 🎉");

      let mangMoiSauGhi = [];
      if (typeof setDanhSachChuongThit === 'function') {
        setDanhSachChuongThit(prev => {
          const mTho = Array.isArray(prev) ? prev : [];
          mangMoiSauGhi = idDangSua ? mTho.map(c => c.id === idDangSua ? { ...c, ...phanDuLieu } : c) : [...mTho, dongMoiDaGhi];
          return mangMoiSauGhi;
        });
      }

      try {
        const emailChuoiSach = userEmail ? userEmail.toString().toLowerCase().trim() : "";
        const khoaDemTongHop = `cache_tonghop_pigvn_${emailChuoiSach}`;
        const { default: AsyncStorageLib } = require('@react-native-async-storage/async-storage');
        AsyncStorageLib.getItem(khoaDemTongHop).then(dataDemTho => {
          if (dataDemTho !== null) {
            const resultChuan = JSON.parse(dataDemTho); resultChuan.tab8 = mangMoiSauGhi;
            AsyncStorageLib.setItem(khoaDemTongHop, JSON.stringify(resultChuan));
          }
        });
      } catch(e) {}

      setSoHeoInput(""); setTuanTuoiInput(""); setTenKhuInput(""); setGhiChuInput("");
      setEditingRowId(null); setIsActionModalVisible(false); setSelectedChuongGop(null);
    }).catch(() => {
      setIsSaving(false);
      Alert.alert("Lỗi", "Không thể ghi dữ liệu chuồng, vui lòng kiểm tra mạng và thử lại.");
    });
  };
  // 📡 LENH MANG 3: DON TRONG CHUONG THEO CÁCH SỐ ÂM TRIỆT TIÊU ĐÀN (BAO TOÀN LỊCH SỬ)
   // 📡 LENH MANG 3 HOAN THIEN: DA GOT SACH BIEN CO DAU VA LOI KHOANG TRANG CHEN TÊN BIẾN
  const handleXoaSachOChuong = () => {
    const chuongCanXoa = selectedChuongGop?.tenChuong || ""; 
    const khuCanXoa = selectedChuongGop?.tenKhu || "Cai Sữa";
    if (!chuongCanXoa) return;

    // 🧠 BUOC 1: Quet ma tran don so thuc kho de tim sach cac bay tron le thuoc o chuong hien tai
    const mangGocThoQuet = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
    const khoGopTuoiDon = {}; // 🎯 Da sua thanh khoGopTuoiDon sach chu khong dau

    mangGocThoQuet.forEach(d => {
      if (d && d.tenChuong?.toString().trim() === chuongCanXoa && d.tenKhu?.toString().trim() === khuCanXoa) {
        const tGocLucVao = Number(d.tuanTuoi) || 0;
        const ngayGocVao = d.ngayNhapChuong || "";
        const tuoiThucTeHnay = Number(d.soCon) === 0 ? 0 : tinhTuoiTinhTienThuHai(tGocLucVao, ngayGocVao);
        
        if (tuoiThucTeHnay > 0) {
          if (!khoGopTuoiDon[tuoiThucTeHnay]) {
            khoGopTuoiDon[tuoiThucTeHnay] = {
              tuoiHnay: tuoiThucTeHnay,
              tongConHnay: 0,
              tuoiVaoGoc: tGocLucVao,
              ngayVaoGoc: ngayGocVao
            };
          }
          khoGopTuoiDon[tuoiThucTeHnay].tongConHnay += (Number(d.soCon) || 0);
        }
      }
    });

    // Trich xuat danh sach cac lua tuoi thuc te dang con lon chao doi tron trong o
    const cacBayCanTrietTieu = Object.values(khoGopTuoiDon).filter(l => l.tongConHnay > 0);

    if (cacBayCanTrietTieu.length === 0) {
      return Alert.alert("Thông báo", "Ô chuồng hiện tại đã trống sẵn, không cần dọn!");
    }

    setIsSaving(true);
    setIsActionModalVisible(false);

    // 🧠 BUOC 2: Ghi cac dong so am (triet tieu tung bay) len Firestore trong 1 lo duy nhat: hoac thanh cong het, hoac khong dong nao
    const ghiChuXoa = `Dọn Chuồng`;
    ghiNhieuDong(cacBayCanTrietTieu.map(bay => ({
      userEmail, tenKhu: khuCanXoa, tenChuong: chuongCanXoa,
      soCon: -bay.tongConHnay, tuanTuoi: bay.tuoiVaoGoc, ngayNhapChuong: bay.ngayVaoGoc, ghiChu: ghiChuXoa,
      soBaoCam: 0, soLieuVaccine: 0, suKienHeoThit: ""
    })))
    // 🧠 BUOC 3: Cap nhat nong vao RAM ao cac dong vua ghi
    .then(cacDongDaGhi => {
      setIsSaving(false);
      Alert.alert("Đã dọn trống hoàn toàn 🧹", `Chuồng số [ ${chuongCanXoa} ] đã triệt tiêu sạch bách toàn bộ các lứa tuổi lợn về số 0.`);

      if (typeof setDanhSachChuongThit === 'function') {
        setDanhSachChuongThit(prev => [...(Array.isArray(prev) ? prev : []), ...cacDongDaGhi]);
      }
      setSelectedChuongGop(null);
    })
    .catch(() => {
      setIsSaving(false);
      Alert.alert("Lỗi kết nối", "Không thể ghi lệnh dọn chuồng, vui lòng kiểm tra mạng và thử lại.");
    });
  };


  // 📡 LENH MANG 4: LUAN CHUYEN HEO NOI BO DOI XUONG CHOT CHAN THU HAI
  // Dong tru (nguon) va dong cong (dich) duoc ghi cung 1 lo: khong bao gio bi tru ma khong duoc cong
  const handleXacNhanDieuChuyenHeoMoi = (dongTruGui, dongCongGui, soConChuyenGui) => {
    setIsSaving(true);
    if (typeof setDongBoStatus === 'function') setDongBoStatus("⏳ Đang lùa lợn lên Sheets nội bộ...");

    ghiNhieuDong([dongTruGui, dongCongGui])
    .then(cacDongDaGhi => {
      setIsSaving(false);
      Alert.alert("Thành công 🚚", `Đã luân chuyển ${soConChuyenGui} heo sang Ô ${chuongDichInput.trim()} Khu ${khuDichInput}.`);

      if (typeof setDanhSachChuongThit === 'function') {
        setDanhSachChuongThit(prev => [...(Array.isArray(prev) ? prev : []), ...cacDongDaGhi]);
      }
      setSoHeoChuyenInput(""); setChuongDichInput(""); setTuanChuyenDuocChon(""); setIsActionModalVisible(false); setSelectedChuongGop(null);
    })
    .catch(() => {
      setIsSaving(false);
      Alert.alert("Lỗi mạng", "Không thể ghi lệnh điều chuyển, vui lòng kiểm tra mạng và thử lại.");
    });
  };

  // 📡 LENH MANG 5: KHAI TU HOAN TOAN CHUONG (XOA HET DONG CUA O CHUONG TREN FIRESTORE, CLOUD FUNCTION TU XOA DONG TREN SHEET)
  const handleXoaBoHoanToanChuong = () => {
    const chuongCanXoaKhaiTu = selectedChuongGop?.tenChuong || ""; 
    const khuCanXoaKhaiTu = selectedChuongGop?.tenKhu || "";
    if (!chuongCanXoaKhaiTu) return;
    setIsSaving(true);
    layDongCuaChuong(userEmail, khuCanXoaKhaiTu, chuongCanXoaKhaiTu)
    .then(cacDong => xoaNhieuDong(cacDong.map(d => d.id)))
    .then(() => {
      setIsSaving(false);
      Alert.alert("Đã xóa hoàn toàn ❌", `Ô chuồng số [ ${chuongCanXoaKhaiTu} ] đã được xóa sạch khỏi sơ đồ trại.`);
      if (typeof setDanhSachChuongThit === 'function') { setDanhSachChuongThit(prev => (Array.isArray(prev) ? prev : []).filter(c => !(c && c.tenChuong?.toString().trim() === chuongCanXoaKhaiTu && c.tenKhu?.toString().trim() === khuCanXoaKhaiTu))); }
      setIsActionModalVisible(false);
      setSelectedChuongGop(null);
    }).catch(() => {
      setIsSaving(false);
      Alert.alert("Mất sóng mạng", "Không thể xóa ô chuồng, vui lòng thử lại.");
    });
  };

  // 📡 LENH MANG 6: XÓA HÀNG LOẠT NHIỀU DÒNG NHẬT KÝ CÙNG LÚC (DÙNG CHUNG CHO LỊCH SỬ ĐÀN & LỊCH SỬ CÁM/THUỐC)
  const handleXoaSachTuyetDoiTheoHangMuc = (maHangMucGiaoChuyen, thongBaoGiaoDien) => {
    setIsSaving(true);
    if (typeof setDongBoStatus === 'function') setDongBoStatus("⏳ Dang dong bo xoa sach...");

    const chuongHienTai = selectedChuongGop?.tenChuong || "1";
    const khuHienTai = selectedChuongGop?.tenKhu || "Cai Sữa";
    const laDongVatTuTrenMay = (d) => d.suKienHeoThit === "VAO_CAM" || d.suKienHeoThit === "TIEM_VACCINE";

    // 🎯 Tìm các dòng của ô chuồng trên Firestore rồi xóa đúng hạng mục. Dòng khai sinh TAO_CHUONG luôn được giữ lại.
    layDongCuaChuong(userEmail, khuHienTai, chuongHienTai)
    .then(cacDong => {
      const cacIdCanXoa = cacDong.filter(d => {
        if (d.suKienHeoThit === "TAO_CHUONG") return false;
        if (maHangMucGiaoChuyen === "VAT_TU") return laDongVatTuTrenMay(d);   // Xóa vật tư thì giữ lại dòng quân số đàn
        if (maHangMucGiaoChuyen === "QUAN_SO") return !laDongVatTuTrenMay(d); // Xóa quân số thì giữ lại dòng vật tư cám thuốc
        return false;
      }).map(d => d.id);
      return xoaNhieuDong(cacIdCanXoa);
    })
    .then(() => {
      setIsSaving(false);
      Alert.alert("Thành công 🧹", thongBaoGiaoDien);
      if (typeof setDanhSachChuongThit === 'function') {
        setDanhSachChuongThit(prev => {
          const mTho = Array.isArray(prev) ? prev : [];
          // 🎯 BẢN VÁ BỘ NHỚ LOCAL: Tuyệt đối không cho phép filter băm nhổ dòng mang nhãn TAO_CHUONG ngoài RAM ảo của điện thoại
          return mTho.filter(c => {
            if (!c) return false;

            // Nếu là dòng của ô chuồng khác hoặc phân khu khác -> Giữ nguyên trạng vẹn toàn
            if (c.tenChuong?.toString().trim() !== chuongHienTai || c.tenKhu?.toString().trim() !== khuHienTai) return true;

            // 🚀 KHIÊN BẢO VỆ LOCAL: Dòng mang nhãn TAO_CHUONG -> Giữ lại 100%!
            if (c.suKienHeoThit === "TAO_CHUONG") return true;

            var laDongVatTu = (c.suKienHeoThit === "VAO_CAM" || c.suKienHeoThit === "TIEM_VACCINE");

            if (maHangMucGiaoChuyen === "VAT_TU") return !laDongVatTu; // Xóa vật tư thì giữ lại dòng quân số đàn
            if (maHangMucGiaoChuyen === "QUAN_SO") return laDongVatTu; // Xóa quân số thì giữ lại dòng vật tư cám thuốc
            return true;
          });
        });
      }
      setIsActionModalVisible(false); setSelectedChuongGop(null);
    }).catch(() => { setIsSaving(false); Alert.alert("Lỗi", "Không thể xóa dữ liệu, vui lòng kiểm tra mạng và thử lại."); });
  };
  // 🧠 THUAT TOAN QUET GOP MA TRẬN PHÂN KHU THEO NGÀY THỨ HAI
  // =================================================================
  // 🧠 BẢN VÁ CỬA NGÕ: TỰ ĐỘNG TÍNH LỊCH VACCINE ĐỂ ĐẨY RA NGOÀI MẶT TIỀN
  // =================================================================
  const danhSachPhanKhuHienThi = React.useMemo(() => {
    const mangChuongTho = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : []; 
    const khoGopChuong = {};
    
    // Bước 1: Phân nhóm thô theo từng ô chuồng và tính tuổi thực tế từng dòng
    mangChuongTho.forEach(item => {
      if (!item || !item.tenChuong) return;
      if (item.suKienHeoThit === "VAO_CAM" || item.suKienHeoThit === "TIEM_VACCINE" || item.suKienHeoThit === "DON_CHUONG") return;

      const keyTenKhu = item.tenKhu ? item.tenKhu.toString().trim() : "Cai Sữa"; 
      const keyTenChuong = item.tenChuong.toString().trim();
      const soLuongHeo = Number(item.soCon) || 0; 
      const tuoiMocLucVao = Number(item.tuanTuoi) || 0; 
      const chuoiNgayMocVao = item.ngayNhapChuong || "";

      const soTuanTuoiThucTeHomNay = soLuongHeo === 0 ? 0 : tinhTuoiTinhTienThuHai(tuoiMocLucVao, chuoiNgayMocVao);
      const khoaDinhDanhPhucHop = `${keyTenKhu}_${keyTenChuong}`;

      if (!khoGopChuong[khoaDinhDanhPhucHop]) {
        khoGopChuong[khoaDinhDanhPhucHop] = { 
          tenChuong: keyTenChuong, 
          tenKhu: keyTenKhu, 
          mangLichSuTho: [] 
        };
      }
      
      khoGopChuong[khoaDinhDanhPhucHop].mangLichSuTho.push({ 
        ...item, 
        soCon: soLuongHeo,
        tuanTuoiThucTe: soTuanTuoiThucTeHomNay 
      });
    });

    // Bước 2: Xử lý đối trừ đại số từng lứa tuổi bên trong ô chuồng để lọc bỏ tuần rác
    Object.values(khoGopChuong).forEach(chuongObj => {
      const khoGopTuoiTungChuong = {};
      const khoDaiDienDong = {}; 

      chuongObj.mangLichSuTho.forEach(bay => {
        const tuoi = bay.tuanTuoiThucTe;
        if (!khoGopTuoiTungChuong[tuoi]) {
          khoGopTuoiTungChuong[tuoi] = 0;
        }
        khoGopTuoiTungChuong[tuoi] += bay.soCon;
        khoDaiDienDong[tuoi] = bay; 
      });

      const danhSachBaySach = [];
      const mangTuanTuoiSach = [];
      const mangLichVacXinOChuong = []; // Mảng chứa toàn bộ tên các mũi cần tiêm ngoài mặt tiền

      Object.keys(khoGopTuoiTungChuong).forEach(tuoiKey => {
        const tuoiNum = Number(tuoiKey);
        const tongSoConCuaTuan = khoGopTuoiTungChuong[tuoiKey];

        if (tuoiNum > 0 && tongSoConCuaTuan > 0) {
          mangTuanTuoiSach.push(tuoiNum);
          danhSachBaySach.push({
            ...khoDaiDienDong[tuoiKey],
            soCon: tongSoConCuaTuan, 
            tuanTuoiThucTe: tuoiNum
          });

          // 💉 THUẬT TOÁN QUÉT LỊCH VACCINE ĐƯA RA NGOÀI MẶT TIỀN
          if (cauHinhVacXinLoc && Array.isArray(cauHinhVacXinLoc) && cauHinhVacXinLoc.length > 0) {
            const quyTrinhHeoThit = cauHinhVacXinLoc.filter(v => {
              if (!v) return false;
              const chuoiMoc1 = (v.loaiHanhDong || "").toString().trim().toUpperCase();
              const chuoiMoc2 = (v.loaiMocGoc || "").toString().trim().toUpperCase();
              const chuoiMoc3 = (v.loaiMoc || "").toString().trim().toUpperCase();
              const chuoiMoc4 = (v.nhom || "").toString().trim().toUpperCase();
              return chuoiMoc1.includes("HEO_THIT") || chuoiMoc2.includes("HEO_THIT") || chuoiMoc3.includes("HEO_THIT") || chuoiMoc4.includes("HEO_THIT");
            });

            const ngayTuoiHeoHnay = tuoiNum * 7;
            const cacMuiKhopLich = quyTrinhHeoThit.filter(v => {
              if (!v) return false;
              const ngayQuyDinhTiem = parseInt(v.soNgay, 10) || 0;
              if (ngayQuyDinhTiem === 0) return false;
              return Math.abs(ngayTuoiHeoHnay - ngayQuyDinhTiem) <= 5;
            });

            cacMuiKhopLich.forEach(mui => {
              if (mui && mui.tenNhiemVu && !mangLichVacXinOChuong.includes(mui.tenNhiemVu)) {
                mangLichVacXinOChuong.push(mui.tenNhiemVu);
              }
            });
          }
        }
      });

      chuongObj.mangTuanTuoi = mangTuanTuoiSach.sort((a, b) => a - b);
      chuongObj.cacBayNho = danhSachBaySach.sort((a, b) => a.tuanTuoiThucTe - b.tuanTuoiThucTe);
      chuongObj.tongSoCon = mangTuanTuoiSach.reduce((acc, tuoi) => acc + khoGopTuoiTungChuong[tuoi], 0);
      chuongObj.lichVacXinMatTien = mangLichVacXinOChuong; // Bỏ lịch tiêm chủng đã lọc vào gói chuồng
      
      delete chuongObj.mangLichSuTho;
    });

    // Bước 3: Phân nhóm vào các Phân khu mặt tiền
    const khoNhomTheoKhu = {};
    Object.values(khoGopChuong).forEach(chuongObj => {
      const tenKhuMoc = chuongObj.tenKhu; 
      if (!khoNhomTheoKhu[tenKhuMoc]) { 
        khoNhomTheoKhu[tenKhuMoc] = { tenKhu: tenKhuMoc, danhSachChuongCuaKhu: [] }; 
      }
      khoNhomTheoKhu[tenKhuMoc].danhSachChuongCuaKhu.push(chuongObj);
    });

    const mangKhuSauCung = Object.values(khoNhomTheoKhu);
    mangKhuSauCung.forEach(khu => {
      khu.danhSachChuongCuaKhu.sort((a, b) => a.tenChuong.localeCompare(b.tenChuong, undefined, { numeric: true, sensitivity: 'base' }));
    });

    mangKhuSauCung.sort((a, b) => b.tenKhu.localeCompare(a.tenKhu)); 
    return mangKhuSauCung;
  }, [danhSachChuongThit, cauHinhVacXinLoc]);
 // 🧠 THUẬT TOÁN MỚI THÊM: Quét RAM tính tổng số heo thực tế của riêng Phân Khu "Chuồng Thịt"
  const tongHeoKhuChuongThit = React.useMemo(() => {
    const mangChuongTho = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
    let tongXacNhan = 0;
    
    mangChuongTho.forEach(item => {
      // Hễ trùng khít chữ tên Khu là "Chuồng Thịt" thì nhặt quân số cộng dồn vào Ledger
      if (item && item.tenKhu?.toString().trim() === "Chuồng Thịt") {
        tongXacNhan += (Number(item.soCon) || 0);
      }
    });
    return tongXacNhan < 0 ? 0 : tongXacNhan; // Chặn sai số âm phòng hờ rớt mạng
  }, [danhSachChuongThit]);
   // 🧠 THUẬT TOÁN MỚI THÊM: Quét RAM tính tổng số heo thực tế của riêng Phân Khu "Cai Sữa"
  const tongHeoKhuCaiSua = React.useMemo(() => {
    const mangChuongTho = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
    let tongXacNhan = 0;
    
    mangChuongTho.forEach(item => {
      // Hễ trùng khít chữ tên Khu là "Cai Sữa" thì nhặt quân số cộng dồn vào Ledger
      if (item && item.tenKhu?.toString().trim() === "Cai Sữa") {
        tongXacNhan += (Number(item.soCon) || 0);
      }
    });
    return tongXacNhan < 0 ? 0 : tongXacNhan; // Chặn sai số âm phòng hờ rớt mạng
  }, [danhSachChuongThit]);
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView style={{ flex: 1, marginTop: 8 }} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, paddingHorizontal: 2 }}>
          
                   {/* ========================================== */}
          {/* KHỐI TẠO Ô CHUỒNG MỚI - ĐỒNG BỘ MÀU ĐỘNG LIÊN KẾT TRẠI */}
          {/* ========================================== */}
          {(() => {
            // Khởi tạo bộ màu động dựa trên Phân khu đang được chọn để tạo tính liên kết
            const laKhuCaiSua = tenKhuMoiInput === "Cai Sữa";
            const mauChuDao = laKhuCaiSua ? '#e65100' : '#0056b3';     // Cam đậm / Xanh dương đậm
            const mauNenNhat = laKhuCaiSua ? '#fff3cd' : '#e7f1ff';    // Cam nhạt / Xanh nhạt
            const mauVienButton = laKhuCaiSua ? '#ffd3b6' : '#b3d7ff'; // Màu viền bổ trợ
            
            return (
              <View style={{ marginBottom: 14 }}>
                {/* NÚT BẤM MỞ KHAY: Đồng bộ màu theo phân khu đang chọn */}
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={() => setIsCreateFormOpen(!isCreateFormOpen)} 
                  style={{ 
                    paddingVertical: 12, 
                    paddingHorizontal: 16, 
                    backgroundColor: mauNenNhat, 
                    borderWidth: 1, 
                    borderColor: mauVienButton, 
                    borderRadius: 12, 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '900', color: mauChuDao }}>
                    ⚙️ TẠO CHUỒNG MỚI ({tenKhuMoiInput.toUpperCase()})
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: mauChuDao }}>
                    {isCreateFormOpen ? "Thu gọn ▲" : "Mở ▼"}
                  </Text>
                </TouchableOpacity>

                {isCreateFormOpen && (
                  <View 
                    style={{ 
                      padding: 14, 
                      backgroundColor: '#ffffff', 
                      borderWidth: 1.5, 
                      borderColor: mauVienButton, 
                      borderRadius: 14, 
                      marginTop: 6,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.02,
                      shadowRadius: 3,
                      elevation: 1
                    }}
                  >
                    {/* BƯỚC 1: CHỌN PHÂN KHU */}
                    <Text style={{ fontSize: 11, fontWeight: '900', color: '#495057', marginBottom: 8, letterSpacing: 0.2 }}>
                      CHỌN PHÂN KHU CHUỒNG NUÔI:
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                      <TouchableOpacity 
                        activeOpacity={0.7}
                        onPress={() => setTenKhuMoiInput("Cai Sữa")} 
                        style={{ 
                          flex: 1, 
                          paddingVertical: 11, 
                          borderRadius: 10, 
                          backgroundColor: laKhuCaiSua ? '#fff3cd' : '#f8f9fa', 
                          borderWidth: laKhuCaiSua ? 2 : 1, 
                          borderColor: laKhuCaiSua ? '#e65100' : '#dee2e6', 
                          alignItems: 'center' 
                        }}
                      >
                        <Text style={{ fontSize: 12.5, fontWeight: '800', color: laKhuCaiSua ? '#e65100' : '#495057' }}>
                          Khu Cai Sữa
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        activeOpacity={0.7}
                        onPress={() => setTenKhuMoiInput("Chuồng Thịt")} 
                        style={{ 
                          flex: 1, 
                          paddingVertical: 11, 
                          borderRadius: 10, 
                          backgroundColor: !laKhuCaiSua ? '#e7f1ff' : '#f8f9fa', 
                          borderWidth: !laKhuCaiSua ? 2 : 1, 
                          borderColor: !laKhuCaiSua ? '#0056b3' : '#dee2e6', 
                          alignItems: 'center' 
                        }}
                      >
                        <Text style={{ fontSize: 12.5, fontWeight: '800', color: !laKhuCaiSua ? '#0056b3' : '#495057' }}>
                          Khu Chuồng Thịt
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* BƯỚC 2: NHẬP SỐ CHUỒNG & NÚT TẠO */}
                    <Text style={{ fontSize: 11, fontWeight: '900', color: '#495057', marginBottom: 8, letterSpacing: 0.2 }}>
                      NHẬP SỐ Ô CHUỒNG MỚI:
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput 
                        style={{ 
                          flex: 1, 
                          height: 44, 
                          borderWidth: 1.5, 
                          borderColor: '#ced4da', 
                          borderRadius: 10, 
                          paddingHorizontal: 12, 
                          fontSize: 14, 
                          color: '#111111', 
                          backgroundColor: '#f8f9fa', 
                          fontWeight: '800', 
                          textAlign: 'center' 
                        }} 
                        placeholder="VD: Thịt hoặc Cai Sữa 1" 
                        placeholderTextColor="#adb5bd" 
                        value={maChuongMoiInput} 
                        onChangeText={txt => setMaChuongMoiInput(txt)} 
                        editable={!isCreatingRoom} 
                      />
                      
                      <TouchableOpacity 
                        activeOpacity={0.8} 
                        disabled={isCreatingRoom} 
                        style={{ 
                          backgroundColor: mauChuDao, // Đổi màu nút tạo động theo phân khu được chọn
                          paddingHorizontal: 22, 
                          borderRadius: 10, 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          flexDirection: 'row', 
                          gap: 6,
                          height: 44,
                        }} 
                        onPress={handleTaoChuongMoiTinh}
                      >
                        {isCreatingRoom && <ActivityIndicator size="small" color="#ffffff" />}
                        <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>
                          + TẠO
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })()}


                    {/* ========================================== */}
          {/* SƠ ĐỒ CHUỒNG DẠNG THẺ HAI TẦNG COMPACT CARD */}
          {/* ========================================== */}
          <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#1a1f23', marginBottom: 10, paddingLeft: 2 }}>SƠ ĐỒ KHU THỊT + KHU CAI SỮA</Text>
          {danhSachPhanKhuHienThi.map((khuVuc, kIdx) => (
            <View key={`khu_row_container_${khuVuc.tenKhu}_${kIdx}`} style={{ marginBottom: 14, backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '950', color: khuVuc.tenKhu.includes("Cai") ? '#e65100' : '#0056b3', marginBottom: 12, backgroundColor: khuVuc.tenKhu.includes("Cai") ? '#fff3cd' : '#e7f1ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, alignSelf: 'flex-start' }}>
                {khuVuc.tenKhu?.toString().trim() === "Cai Sữa" 
                  ? `⚡ KHU: ${khuVuc.tenKhu.toUpperCase()} ( Tổng : ${tongHeoKhuCaiSua} Heo )` 
                  : khuVuc.tenKhu?.toString().trim() === "Chuồng Thịt"
                  ? `⚡ KHU: ${khuVuc.tenKhu.toUpperCase()} ( Tổng : ${tongHeoKhuChuongThit} Heo )`
                  : `⚡ KHU: ${khuVuc.tenKhu.toUpperCase()}`}
              </Text>
              
              <View style={{ flexDirection: 'column', gap: 8 }}>
                {khuVuc.danhSachChuongCuaKhu.map((chuong, idx) => {
                  const coHeoThucTe = chuong.tongSoCon > 0; 
                  const chuoiHienThiTuan = chuong.mangTuanTuoi.length > 0 ? `Tuần Tuổi: ${chuong.mangTuanTuoi.join(', ')} ` : "";
                  const coLichVacXin = Array.isArray(chuong.lichVacXinMatTien) && chuong.lichVacXinMatTien.length > 0;
                  
                  return (
                    <TouchableOpacity 
                      key={`chuong_row_node_${chuong.tenChuong}_${idx}`} 
                      activeOpacity={0.7} 
                      onPress={() => { 
                        setSelectedChuongGop(chuong); 
                        setTenKhuInput(chuong.tenKhu); 
                        setEditingRowId(null); 
                        setNgayNhapInput(formatVNDate(new Date())); 
                        setIsCalendarOpen(false); 
                        setModalSubTab("AN_FORM");  
                        setIsActionModalVisible(true); 
                      }} 
                      style={{ 
                        flexDirection: 'column', // Chuyển sang bố cục dọc bên trong thẻ
                        padding: 12, 
                        backgroundColor: coHeoThucTe ? '#ffffff' : '#f8f9fa', 
                        borderWidth: 1, 
                        borderColor: coHeoThucTe ? '#ffe0b2' : '#e9ecef', 
                        borderRadius: 10,
                        // Thêm đổ bóng nhẹ giúp giao diện giống ứng dụng chuyên nghiệp
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.03,
                        shadowRadius: 2,
                        elevation: 1
                      }}
                    >
                      {/* TẦNG 1: THÔNG TIN CỐ ĐỊNH CHÍNH (Đẩy về 2 đầu tuyệt đối) */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: '#111111' }}>
                          {`Chuồng ${chuong.tenChuong}`}
                        </Text>
                        
                        <Text style={{ fontSize: 13.5, fontWeight: '850', color: coHeoThucTe ? '#137333' : '#adb5bd' }}>
                          {coHeoThucTe ? `${chuong.tongSoCon} Con` : "Chuồng Trống"}
                        </Text>
                      </View>

                      {/* TẦNG 2: VÙNG THÔNG TIN PHỤ BIẾN ĐỘNG (Chỉ hiện khi có heo thực tế) */}
                      {coHeoThucTe && (
                        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#f1f3f5', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                          
                          {/* Nhãn hiển thị số tuần tuổi */}
                          {chuoiHienThiTuan !== "" && (
                            <Text style={{ fontSize: 10.5, color: '#e65100', fontWeight: '700', backgroundColor: '#fff0e6', paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 4 }}>
                              {chuoiHienThiTuan}
                            </Text>
                          )}
                          
                          {/* Danh sách các mũi Vaccine (Tự động xuống hàng nếu quá dài, không bao giờ đè chữ) */}
                          {coLichVacXin && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1 }}>
                              {chuong.lichVacXinMatTien.map((tenMui, vIdx) => (
                                <View 
                                  key={`vax_row_tag_${vIdx}`}
                                  style={{ 
                                    paddingVertical: 2, 
                                    paddingHorizontal: 6, 
                                    backgroundColor: '#f5f0ff', 
                                    borderRadius: 4, 
                                    borderWidth: 0.5, 
                                    borderColor: '#d6c4ff'
                                  }}
                                >
                                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#6741d9' }}>
                                    💉vacxin {tenMui}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                          
                        </View>
                      )}

                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}


               {/* 📥 POPUP MODAL CAO CẤP: PHÂN TÁCH 2 TAB (ĐIỀU HÀNH CHUỒNG VÀ LỊCH SỬ Ô CHUỒNG CO GIÃN) */}
          <Modal
            animationType="fade" transparent={true} visible={isActionModalVisible}
            onRequestClose={() => { setIsActionModalVisible(false); setSelectedChuongGop(null); setEditingRowId(null); setSoHeoInput(""); setTuanTuoiInput(""); setTenKhuInput(""); setGhiChuInput(""); }}
          >
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
              <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 14, width: width }} keyboardShouldPersistTaps="handled">
                <View style={{ width: '94%', alignSelf: 'center', backgroundColor: '#ffffff', borderRadius: 16, padding: 14, elevation: 5 }}>
                  
                                   {/* ========================================== */}
                  {/* 1. THANH TIÊU ĐỀ ĐỈNH POPUP - TỐI GIẢN & ĐẢO KHU LÊN TRƯỚC */}
                  {/* ========================================== */}
                  {(() => {
                    const laKhuCaiSua = selectedChuongGop?.tenKhu?.toString().trim() === "Cai Sữa";
                    const mauKhu = laKhuCaiSua ? '#e65100' : '#0056b3';
                    const mauNenKhu = laKhuCaiSua ? '#fff3cd' : '#e7f1ff';

                    return (
                      <View 
                        style={{ 
                          flexDirection: 'row', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          borderBottomWidth: 1, 
                          borderBottomColor: '#f1f2f6', 
                          paddingBottom: 10, 
                          marginBottom: 12 
                        }}
                      >
                        {/* Khối nhãn thông tin định vị Khu trước - Ô sau */}
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          {editingRowId ? (
                            <Text style={{ fontSize: 13.5, fontWeight: '900', color: '#64748b' }}>
                              ✏️ SỬA LÔ ID: <Text style={{ color: '#0f172a' }}>{editingRowId.substring(3, 8)}</Text>
                            </Text>
                          ) : (
                            <>
                              {/* Tag Phân Khu đưa lên trước - Màu sắc liên kết theo sơ đồ trại */}
                              <View style={{ backgroundColor: mauNenKhu, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5, borderColor: mauKhu }}>
                                <Text style={{ fontSize: 12, fontWeight: '900', color: mauKhu }}>
                                  {selectedChuongGop?.tenKhu?.toUpperCase()}
                                </Text>
                              </View>

                              {/* Tag số Ô Chuồng đưa ra sau - Làm đậm, chữ rõ nét */}
                              <View style={{ backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                                <Text style={{ fontSize: 12, fontWeight: '900', color: '#ffffff' }}>
                                  {`Ô CHUỒNG ${selectedChuongGop?.tenChuong}`}
                                </Text>
                              </View>
                            </>
                          )}
                        </View>

                        {/* Nút đóng hình tròn vùng chạm lớn */}
                        <TouchableOpacity 
                          activeOpacity={0.6}
                          onPress={() => { 
                            setIsActionModalVisible(false); 
                            setSelectedChuongGop(null); 
                            setEditingRowId(null); 
                            setSoHeoInput(""); 
                            setTuanTuoiInput(""); 
                            setTenKhuInput(""); 
                            setGhiChuInput(""); 
                          }} 
                          style={{ 
                            width: 32,
                            height: 32,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f1f5f9',
                            borderRadius: 16,
                            marginLeft: 8
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#64748b' }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })()}


                                   {/* 2. BỘ BA CÔNG TẮC LẬT PHÂN PHÂN PHẲNG MỊN (TÁCH BIỆT QUÂN SỐ VÀ CÁM/VACCINE) */}
                  <View style={{ flexDirection: 'row', backgroundColor: '#f1f3f5', padding: 3, borderRadius: 8, marginBottom: 12, gap: 4 }}>
                    <TouchableOpacity onPress={() => { setModalSubTab("AN_FORM"); setEditingRowId(null); }} style={{ flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: 'center', backgroundColor: (modalSubTab !== "XEM_LICH_SU" && modalSubTab !== "LICH_SU_CAM_THUOC") ? '#ffffff' : 'transparent' }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: (modalSubTab !== "XEM_LICH_SU" && modalSubTab !== "LICH_SU_CAM_THUOC") ? '#0056b3' : '#495057' }}>Xem / Thao Tác</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setModalSubTab("XEM_LICH_SU")} style={{ flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: 'center', backgroundColor: modalSubTab === "XEM_LICH_SU" ? '#ffffff' : 'transparent' }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: modalSubTab === "XEM_LICH_SU" ? '#0056b3' : '#495057' }}>📜 Lịch Sử Đàn</Text></TouchableOpacity>
                    
                    {/* 🆕 MỚI CHÈN: Nút bấm lật trúng Sub-Tab số 3 tách chi phí cám thuốc vật tư biệt lập */}
                    <TouchableOpacity onPress={() => setModalSubTab("LICH_SU_CAM_THUOC")} style={{ flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: 'center', backgroundColor: modalSubTab === "LICH_SU_CAM_THUOC" ? '#ffffff' : 'transparent' }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: modalSubTab === "LICH_SU_CAM_THUOC" ? '#fd7e14' : '#495057' }}>🌾 Lịch Sử Cám/ Chích Thuốc</Text></TouchableOpacity>
                  </View>


                  {/* ----------------------------------------------------------------- */}
                  {/* TRƯỜNG HỢP A: KHÔNG PHẢI TAB LỊCH SỬ -> HIỆN MA TRẬN ĐIỀU HÀNH CHUỒNG */}
                  {/* ----------------------------------------------------------------- */}
{modalSubTab !== "XEM_LICH_SU" && modalSubTab !== "LICH_SU_CAM_THUOC" && (
                    <View style={{ width: '100%' }}>
                      
                                        {/* 📊 KHU VỰC 1: DA VA CHAC CHAN — EP MA TRAN DUNG 2 O VUONG DOI XUNG NAM PHANG TREN 1 HANG NGANG */}
<View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 8, marginBottom: 12, borderWidth: 1, borderColor: '#dee2e6' }}>
  <Text style={{ fontSize: 11, fontWeight: '900', color: '#495057', marginBottom: 8, letterSpacing: 0.3 }}>📋 QUÂN SỐ THỰC TẾ TRONG Ô NUÔI:</Text>
  <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
    
    {/* 🎯 MO NEO VANG: DA DONG BO THUAT TOAN GOP DOI TRU AM DUONG — BAT BUOC PHAI TU TRU SO CON THEO TUAN */}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>
      {(() => {
        const mangBayTho = Array.isArray(selectedChuongGop?.cacBayNho) ? selectedChuongGop.cacBayNho : [];
        const khoGopTuoiRealTime = {};

        // 🧠 BO NAO TINH TOAN: Duyet qua tung dong Ledger tho, tu dong cong dong duong, tru dong am kich san
        mangBayTho.forEach(dong => {
          if (!dong) return;
          const mocTuoiHnay = Number(dong.tuanTuoiThucTe) || 0;
          const soConBienden = Number(dong.soCon) || 0;

          if (!khoGopTuoiRealTime[mocTuoiHnay]) {
            khoGopTuoiRealTime[mocTuoiHnay] = {
              tuanTuoiHienTai: mocTuoiHnay,
              tongSoConThucTe: 0,
              idGocPhu: dong.id,
              ngayNhapGocPhu: dong.ngayNhapChuong,
              tuanLucVaoGocPhu: dong.tuanTuoi,
              ghiChuGocPhu: dong.ghiChu
            };
          }
          // Thuc hien phep toan bu tru dai so (+ / -) thang vao RAM ao
          khoGopTuoiRealTime[mocTuoiHnay].tongSoConThucTe += soConBienden;
        });

        // CHOT CHAN TRIET TIEU LO RAC CHUAN: Loc bo hoan toan cac lua tuoi sau doi tru bang 0 hoac am dan
        const mangGopThucTe = Object.values(khoGopTuoiRealTime).filter(lo => lo && lo.tongSoConThucTe > 0);
        
        // Sap xep thu tu bay lon tu nho tuoi den lon tuoi cho ngan nap
        mangGopThucTe.sort((a, b) => a.tuanTuoiHienTai - b.tuanTuoiHienTai);

        if (mangGopThucTe.length === 0) {
          return (
            <View style={{ width: '100%', paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 11, color: '#7f8c8d', fontStyle: 'italic' }}>Ô chuồng hiện tại hoàn toàn trống nuôi ⛔</Text>
            </View>
          );
        }

        return mangGopThucTe.map((bayGop, bIdx) => (
          <View 
            key={`compact_grid_card_${bayGop.tuanTuoiHienTai}_${bIdx}`} 
            style={{ 
              width: '48.5%', 
              backgroundColor: '#fffdf4', 
              borderWidth: 1.2, 
              borderColor: '#ffe0b2', 
              borderRadius: 8, 
              padding: 6, 
              justifyContent: 'space-between',
              marginBottom: 6,
              shadowColor: "#e65100",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.01,
              shadowRadius: 1,
              elevation: 0.5
            }}
          >
            {/* THONG TIN CHOT SO: TUAN TUOI TU DONG TRU CHAN CHAN CHAN */}
            <View style={{ width: '100%', alignItems: 'center', marginBottom: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#111111' }}>
                Tuần tuổi: <Text style={{ color: '#e65100', fontWeight: '950' }}>{bayGop.tuanTuoiHienTai}Tuần</Text>
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '900', color: '#111111', marginTop: 2 }}>
                Số con: <Text style={{ color: '#137333', fontWeight: '950' }}>{bayGop.tongSoConThucTe} con</Text>
              </Text>
            </View>

            {/* BAN VA VACXIN AN TOAN KHONG LO KET DATA */}
            {(() => {
              if (!cauHinhVacXinLoc || !Array.isArray(cauHinhVacXinLoc) || cauHinhVacXinLoc.length === 0) return null;
              
              const quyTrinhHeoThit = cauHinhVacXinLoc.filter(v => {
                if (!v) return false;
                const chuoiMoc1 = (v.loaiHanhDong || "").toString().trim().toUpperCase();
                const chuoiMoc2 = (v.loaiMocGoc || "").toString().trim().toUpperCase();
                const chuoiMoc3 = (v.loaiMoc || "").toString().trim().toUpperCase();
                const chuoiMoc4 = (v.nhom || "").toString().trim().toUpperCase();
                return chuoiMoc1.includes("HEO_THIT") || chuoiMoc2.includes("HEO_THIT") || chuoiMoc3.includes("HEO_THIT") || chuoiMoc4.includes("HEO_THIT");
              });
              
              if (!quyTrinhHeoThit || quyTrinhHeoThit.length === 0) return null;

              const soTuanThucTeMatTien = Number(bayGop.tuanTuoiHienTai) || 0;
              if (soTuanThucTeMatTien === 0) return null;
              
              const ngayTuoiHeoHnay = soTuanThucTeMatTien * 7;

              const cacMuiKhopLich = quyTrinhHeoThit.filter(v => {
                if (!v) return false;
                const ngayQuyDinhTiem = parseInt(v.soNgay, 10) || 0;
                if (ngayQuyDinhTiem === 0) return false;
                return Math.abs(ngayTuoiHeoHnay - ngayQuyDinhTiem) <= 5;
              });

              if (!cacMuiKhopLich || cacMuiKhopLich.length === 0) return null;

              return (
                <View style={{ width: '100%', marginTop: 3, marginBottom: 3, gap: 2 }}>
                  {cacMuiKhopLich.map((mui, idx) => (
                    <View 
                      key={`alert_vax_pure_final_${mui.id || idx}`} 
                      style={{ 
                        width: '100%', 
                        paddingVertical: 4, 
                        paddingHorizontal: 4, 
                        backgroundColor: '#f5f0ff', 
                        borderRadius: 5, 
                        borderWidth: 0.8, 
                        borderColor: '#6f42c1', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#6f42c1', textAlign: 'center' }} numberOfLines={1}>
                        📢 LỊCH: {mui.tenNhiemVu || 'Vaccine'}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })()}

            {/* NUT SUA SO DET PHANG OM DAY HOP VUONG MINI */}
            {/* NUT SUA SO DET PHANG OM DAY HOP VUONG MINI */}
                                              {/* 🎯 BẢN VÁ CAO CẤP: CẶP NÚT SỬA SỐ LỢN & XÓA BĂM DÒNG CHỨNG TỪ NHẦM NGAY TẠI TRẬN KỀ CHÂN Ô VUÔNG */}
                                  <View style={{ flexDirection: 'row', gap: 4, width: '100%' }}>

                                     {/* NÚT XÓA BĂM ĐÀN TOÀN DIỆN VẬT LÝ: Tự động phát hành chứng từ số lượng âm để triệt tiêu chằn chặn quân số bầy về 0 */}
                                  <TouchableOpacity 
                                    activeOpacity={0.6} 
                                    onPress={() => {
                                      const soConHienTaiCuaBay = Number(bayGop.tongSoConThucTe) || 0;
                                      if (soConHienTaiCuaBay <= 0) return Alert.alert("Thông báo", "Bầy lợn hiện tại đã trống sẵn!");

                                      Alert.alert(
                                        "🗑️ Xóa sạch bầy tuần này?", 
                                        `Hệ thống sẽ phát hành chứng từ xuất trừ [ -${soConHienTaiCuaBay} con ] để đưa bầy lợn [ Lô ${bayGop.tuanTuoiHienTai} Tuần ] về số trống 0 con. Bạn có chắc chắn?`, 
                                        [
                                          { text: "Hủy", style: "cancel" },
                                          { 
                                            text: "Đồng ý xóa", 
                                            style: "destructive", 
                                            onPress: () => {
                                              setIsSaving(true);
                                              if (typeof setDongBoStatus === 'function') setDongBoStatus("⏳ Đang bắn lệnh triệt tiêu đàn lên mây Sheets...");

                                              const chuongNguon = selectedChuongGop?.tenChuong || "1";
                                              const khuNguon = selectedChuongGop?.tenKhu || "Cai Sữa";

                                              // 🚀 ÉP CHỐT CHẶN: Ép mốc ngày ghi sổ bắt buộc phải là mốc ngày hôm nay vật lý thời gian thực
                                              const chuoiNgayHnayChuan = formatVNDate(new Date());
                                              const tuoituanMocGoc = Number(bayGop.tuanLucVaoGocPhu) || 4;
                                              const ngayNhapGocLôVatLy = (bayGop.ngayNhapGocPhu || chuoiNgayHnayChuan).toString().trim();

                                              const ghiChuXoaSach = `🧹 [XÓA SẠCH BẦY]: Lệnh băm triệt tiêu tự động toàn bộ ${soConHienTaiCuaBay} con lợn lô Tuần ${bayGop.tuanTuoiHienTai}`;

                                              // 🚀 KÍCH HOẠT LỆNH Ledger: Ghi dòng số lượng âm găm đúng mốc ngày gốc vật lý lên Firestore để đối trừ sạch bầy
                                              ghiDongMoi({
                                                userEmail, tenKhu: khuNguon, tenChuong: chuongNguon,
                                                soCon: -Number(soConHienTaiCuaBay), tuanTuoi: tuoituanMocGoc, ngayNhapChuong: ngayNhapGocLôVatLy, ghiChu: ghiChuXoaSach,
                                                soBaoCam: 0, soLieuVaccine: 0, suKienHeoThit: "XOA_SACH_LOTUOI"
                                              }).then(dongCapNhatAmLocal => {
                                                setIsSaving(false);
                                                Alert.alert("Đã xóa hoàn toàn 🧹", `Bầy lợn lứa tuần ${bayGop.tuanTuoiHienTai} đã được xóa.`);

                                                if (typeof setDanhSachChuongThit === 'function') {
                                                  setDanhSachChuongThit(prev => [...(Array.isArray(prev) ? prev : []), dongCapNhatAmLocal]);
                                                }
                                                setIsActionModalVisible(false); setSelectedChuongGop(null);
                                              }).catch(() => { setIsSaving(false); Alert.alert("Lỗi", "Không thể ghi lệnh xóa bầy, vui lòng kiểm tra mạng và thử lại."); });
                                            } 
                                          }
                                        ]
                                      );
                                    }}
                                    style={{ paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#fff5f5', borderRadius: 4, borderWidth: 0.5, borderColor: '#fbc4c4', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#dc3545' }}>Xóa</Text>
                                  </TouchableOpacity>

                                  </View>

          </View>
        ));
      })()}
    </View>

  </ScrollView>
</View>


                      {/* 🧭 KHU VỰC 2: THANH MENU 5 HÀNH ĐỘNG CỨNG PHẲNG HẠ LỀ CHÂN */}
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#495057', marginBottom: 6 }}>🛠️ CHỌN HÀNH ĐỘNG ĐỂ KHAI BÁO BIẾN ĐỘNG QUÂN SỐ:</Text>
                      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 6 }}>
                        <TouchableOpacity onPress={() => { setModalSubTab("NHAP_HEO"); setEditingRowId(null); setSoHeoInput(""); setTuanTuoiInput(""); setGhiChuInput(""); setIsCalendarOpen(false); }} style={{ flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: modalSubTab === "NHAP_HEO" ? '#28a745' : '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', alignItems: 'center' }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: modalSubTab === "NHAP_HEO" ? '#ffffff' : '#212529' }}>📥 Nhập Heo</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => { setModalSubTab("BAN_HEO"); setEditingRowId(null); setSoHeoInput(""); setTuanTuoiInput(""); setGhiChuInput(""); setIsCalendarOpen(false); }} style={{ flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: modalSubTab === "BAN_HEO" ? '#e67e22' : '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', alignItems: 'center' }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: modalSubTab === "BAN_HEO" ? '#ffffff' : '#212529' }}>💰 Bán Heo</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => { setModalSubTab("HAO_HUT"); setEditingRowId(null); setSoHeoInput(""); setTuanTuoiInput(""); setGhiChuInput(""); setIsCalendarOpen(false); }} style={{ flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: modalSubTab === "HAO_HUT" ? '#dc3545' : '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', alignItems: 'center' }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: modalSubTab === "HAO_HUT" ? '#ffffff' : '#212529' }}>☠️ Hao Hụt</Text></TouchableOpacity>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 12 }}>
                        <TouchableOpacity onPress={() => { setModalSubTab("LUAN_CHUYEN"); setEditingRowId(null); setSoHeoChuyenInput(""); setChuongDichInput(""); setIsCalendarOpen(false); }} style={{ flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: modalSubTab === "LUAN_CHUYEN" ? '#0056b3' : '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', alignItems: 'center' }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: modalSubTab === "LUAN_CHUYEN" ? '#ffffff' : '#212529' }}>🚚 Luân Chuyển</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => { if (!(selectedChuongGop?.tongSoCon > 0)) return Alert.alert("Thông báo", "Ô chuồng hiện tại đã trống sẵn!"); Alert.alert("🧹 Dọn chuồng", `Dọn hết heo hiện có khỏi [Chuồng ${selectedChuongGop?.tenChuong}]? (Lịch sử đàn / cám thuốc vẫn được giữ nguyên)`, [{ text: "Hủy", style: "cancel" }, { text: "Xác nhận dọn", style: "destructive", onPress: handleXoaSachOChuong }]); }} style={{ flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#212529', alignItems: 'center' }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: '#dc3545' }}>🧹 Dọn Chuồng</Text></TouchableOpacity>
                      </View>
                      {/* 🆕 MỚI CHÈN HÀNG NGANG SỐ 3: BỘ ĐÔI NÚT LỆNH VÀO CÁM VÀ TIÊU THỤ VACCINE THUỐC ĐIỀU TRỊ */}
                          <View style={{ flexDirection: 'row', gap: 5, marginBottom: 12 }}>
                            <TouchableOpacity onPress={() => { setModalSubTab("VAO_CAM"); setIsCalendarOpen(false); }} style={{ flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: modalSubTab === "VAO_CAM" ? '#e67e22' : '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: modalSubTab === "VAO_CAM" ? '#ffffff' : '#212529' }}>🌾 Nhập Cám</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => { setModalSubTab("TIEM_VACCINE"); setIsCalendarOpen(false); }} style={{ flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: modalSubTab === "TIEM_VACCINE" ? '#28a745' : '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: modalSubTab === "TIEM_VACCINE" ? '#ffffff' : '#212529' }}>💊 Chích Vacxin</Text></TouchableOpacity>
                          </View>
                      {/* 📋 KHU VỰC 3: KHAY FORM CHI TIẾT THEO TỪNG SỰ KIỆN CHỌN (TỰ ĐỘNG ẨN GIẤU) */}
                    
                                                         {/* 🎯 BẢN NÂNG CẤP CAO CẤP: KHAY FORM A TỰ ĐỘNG HIỆN DANH SÁCH BẦY TUỔI KHI BÁN / HAO HỤT CHẶN ĐỨNG NHẦM LẪN */}
                      {(modalSubTab === "NHAP_HEO" || modalSubTab === "BAN_HEO" || modalSubTab === "HAO_HUT" || modalSubTab === "SUA_FORM") && (
                        <View style={{ width: '100%', padding: 10, backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 0.5, borderColor: '#ced4da', marginBottom: 10 }}>
                          
                          {/* 1. THANH TIÊU ĐỀ DẸT KÈM NÚT ẨN FORM */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#ced4da', paddingBottom: 5, marginBottom: 8 }}>
                            <Text style={{ fontSize: 11, fontWeight: '900', color: modalSubTab === "SUA_FORM" ? '#b58100' : modalSubTab === "NHAP_HEO" ? '#28a745' : '#dc3545' }}>
                              {modalSubTab === "SUA_FORM" ? "Sửa Số Liệu" : modalSubTab === "NHAP_HEO" ? "NHẬP HEO VÀO Ô" : modalSubTab === "BAN_HEO" ? "XUẤT BÁN" : "HAO HỤT"}
                            </Text>
                            <TouchableOpacity onPress={() => { setModalSubTab("AN_FORM"); setSoHeoInput(""); setTuanTuoiInput(""); setGhiChuInput(""); setTuanChuyenDuocChon(""); }} style={{ backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#4a5568' }}>✕ Ẩn Form</Text></TouchableOpacity>
                          </View>

                          {/* 2. CHỌN NGÀY THỰC HIỆN ACCORDION PHẲNG */}
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>1. Chọn Ngày thực hiện:</Text>
                          <TouchableOpacity activeOpacity={0.7} onPress={() => setIsCalendarOpen(!isCalendarOpen)} style={{ height: 36, borderWidth: 1, borderColor: '#e65100', borderRadius: 5, backgroundColor: '#fff3e0', alignItems: 'center', justifyContent: 'center', marginBottom: 6, flexDirection: 'row', gap: 6 }}><Text style={{ color: '#e65100', fontSize: 12.5, fontWeight: '900' }}>📅 {ngayNhapInput || formatVNDate(new Date())}</Text><Text style={{ color: '#e65100', fontSize: 10, fontWeight: 'bold' }}>{isCalendarOpen ? "▲ Đóng" : "▼ Đổi ngày"}</Text></TouchableOpacity>

                          {isCalendarOpen && (
                            <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ffe082', borderRadius: 6, padding: 6, marginBottom: 8 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><TouchableOpacity onPress={() => { if (currentCalendarMonth === 0) { setCurrentCalendarMonth(11); setCurrentCalendarYear(currentCalendarYear - 1); } else { setCurrentCalendarMonth(currentCalendarMonth - 1); } }}><Text style={{ fontSize: 14, fontWeight: 'bold', color: '#e65100' }}>◀</Text></TouchableOpacity><Text style={{ fontSize: 11, fontWeight: '900' }}>Tháng {currentCalendarMonth + 1} - {currentCalendarYear}</Text><TouchableOpacity onPress={() => { if (currentCalendarMonth === 11) { setCurrentCalendarMonth(0); setCurrentCalendarYear(currentCalendarYear + 1); } else { setCurrentCalendarMonth(currentCalendarMonth + 1); } }}><Text style={{ fontSize: 14, fontWeight: 'bold', color: '#e65100' }}>▶</Text></TouchableOpacity></View>
                              <View style={{ flexDirection: 'row', marginBottom: 4 }}>{['T2','T3','T4','T5','T6','T7','CN'].map((t, tIdx) => (<View key={`cal_mini_t_${tIdx}`} style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 9, fontWeight: '700', color: '#7f8c8d' }}>{t}</Text></View>))}</View>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{danhSachNgayTrongThangCalendar.map((itemNgay, nIdx) => { const chuoiNgayNode = formatVNDate(itemNgay.dateObj); const laChon = ngayNhapInput === chuoiNgayNode; return (<TouchableOpacity key={`cal_mini_n_${nIdx}`} activeOpacity={0.6} onPress={() => { setNgayNhapInput(chuoiNgayNode); setIsCalendarOpen(false); }} style={{ width: '14.28%', paddingVertical: 5, alignItems: 'center', borderRadius: 4, backgroundColor: laChon ? '#e67e22' : 'transparent' }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: laChon ? '#ffffff' : itemNgay.laThangChinh ? '#111111' : '#c0c0c0' }}>{itemNgay.dateObj.getDate()}</Text></TouchableOpacity>); })}</View>
                            </View>
                          )}

                          {/* 🎯 BẢN VÁ BIẾN ĐỘNG: KHÓA CỨNG DANH SÁCH BẦY THEO HIỆN TRẠNG REAL-TIME (LÙI LỊCH CHỌN NGÀY THOẢI MÁI KHÔNG LO ẨN BẦY) */}
                          {(modalSubTab === "BAN_HEO" || modalSubTab === "HAO_HUT") && (
                            <View style={{ marginBottom: 8, backgroundColor: '#ffffff', padding: 6, borderRadius: 6, borderWidth: 1, borderColor: '#fbc4c4' }}>
                              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#dc3545', marginBottom: 4 }}>• Chạm chọn chính xác Bầy tuổi muốn tác động:</Text>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                                {(() => {
                                  // 🧠 BỘ NÃO GỘP ĐỘNG: Quét ma trận dựa theo tuổi hiện tại thực tế hôm nay của ô chuồng
                                  const mangBayTho = Array.isArray(selectedChuongGop?.cacBayNho) ? selectedChuongGop.cacBayNho : [];
                                  const khoLoTuoiFormA = {};
                                  
                                  mangBayTho.forEach(b => {
                                    if (!b) return;
                                    // 🚀 KHÓA CHỨNG TỪ: Ép máy lấy đúng số tuần tuổi thực tế hiện tại hiển thị ở ô vuông mặt tiền, bỏ qua mốc ngày lùi lịch chọn
                                    const tReal = Number(b.tuanTuoiThucTe) || 0; 
                                    const sCon = Number(b.soCon) || 0;
                                    
                                    if (!khoLoTuoiFormA[tReal]) {
                                      khoLoTuoiFormA[tReal] = { 
                                        tuoi: tReal, 
                                        tongCon: 0,
                                        tuoiGocLucVao: Number(b.tuanTuoi) || 0,
                                        ngayNhapGocLô: b.ngayNhapChuong
                                      };
                                    }
                                    khoLoTuoiFormA[tReal].tongCon += sCon;
                                  });

                                  const cacLoHienCoFormA = Object.values(khoLoTuoiFormA).filter(l => l.tongCon > 0);
                                  if (cacLoHienCoFormA.length === 0) return <Text style={{ fontSize: 10, color: '#7f8c8d', fontStyle: 'italic' }}>Ô chuồng hiện tại hoàn toàn trống lợn ⛔</Text>;
                                  
                                  return cacLoHienCoFormA.map((lo, idx) => {
                                    const laChonTuoi = Number(tuanChuyenDuocChon) === lo.tuoi;
                                    return (
                                      <TouchableOpacity 
                                        key={`formA_pure_select_tuan_${lo.tuoi}_${idx}`} 
                                        activeOpacity={0.6} 
                                        onPress={() => {
                                          setTuanChuyenDuocChon(lo.tuoi.toString()); // Lưu nhãn hiển thị lứa tuần hiện tại màu cam bên lề dưới
                                          
                                          // 🚀 THÔNG MẠCH: Bốc chuẩn xác giấy tờ mốc tuổi gốc và ngày nhập gốc vật lý của bầy nạp vào Form ngầm bắn lên mây
                                          setTuanTuoiInput(lo.tuoiGocLucVao.toString()); 
                                        }} 
                                        style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5, backgroundColor: laChonTuoi ? '#dc3545' : '#f8f9fa', borderWidth: 1, borderColor: laChonTuoi ? '#dc3545' : '#dee2e6' }}
                                      >
                                        <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: laChonTuoi ? '#ffffff' : '#333333' }}>{`Bầy ${lo.tuoi} Tuần (${lo.tongCon} con)`}</Text>
                                      </TouchableOpacity>
                                    );
                                  });
                                })()}
                              </View>
                            </View>
                          )}
                          {/* 4. SỐ LƯỢNG LỢN TÁC ĐỘNG (GÕ TAY) */}
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>2. Số lượng (Con):</Text>
                          <TextInput style={{ height: 36, borderWidth: 1, borderColor: '#ced4da', borderRadius: 5, backgroundColor: '#ffffff', paddingHorizontal: 10, marginBottom: 6, fontSize: 12, fontWeight: 'bold', textAlign: 'center' }} value={soHeoInput} onChangeText={(txt) => setSoHeoInput(txt.replace(/[^0-9]/g, ''))} keyboardType="numeric" placeholder="Số heo..." placeholderTextColor="#999999" />

                          {/* 5. LỨA TUẦN TUỔI (RẼ NHÁNH Dropdown HOẶC CHỮ KHÓA CỨNG TỰ ĐỘNG ĐIỀN CHỐNG NHẦM) */}
                            {/* 🚀 ĐÃ KHÓA CHẶT TRỤC CHÂN: Ép editable={false} và đổi nền xám để cấm công nhân thay đổi Tuần tuổi lô lẻ lung tung */}
                        {(modalSubTab === "NHAP_HEO" || modalSubTab === "SUA_FORM") ? (
                          <View style={{ width: '100%' }}>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>3. Lứa tuổi lợn chăn nuôi (Tuần):</Text>
                            <TextInput 
                              style={{ height: 36, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 5, backgroundColor: modalSubTab === "SUA_FORM" ? '#e2e8f0' : '#ffffff', paddingHorizontal: 10, marginBottom: 8, fontSize: 12, textAlign: 'center', color: modalSubTab === "SUA_FORM" ? '#64748b' : '#111111', fontWeight: 'bold' }} 
                              value={tuanTuoiInput} 
                              onChangeText={(txt) => { if(modalSubTab !== "SUA_FORM") setTuanTuoiInput(txt.replace(/[^0-9]/g, '')); }} 
                              keyboardType="numeric" 
                              placeholder="Ví dụ: 4" 
                              placeholderTextColor="#999999"
                              editable={modalSubTab !== "SUA_FORM"} // 🚀 CHỐT HẠ KHÓA CHẾT KHI SỬA
                            />
                          </View>
                          ) : (
                            <View style={{ paddingVertical: 4, marginBottom: 6 }}>
                              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#555555' }}>
                                3. Lứa tuổi heo lựa chọn: <Text style={{ color: '#e65100', fontWeight: '950' }}>{tuanChuyenDuocChon ? `${tuanChuyenDuocChon} Tuần tuổi` : "⚠️ Chưa chọn bầy ở trên"}</Text>
                              </Text>
                            </View>
                          )}

                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>4. Ghi chú (nếu có):</Text>
                          <TextInput style={{ height: 36, borderWidth: 1, borderColor: '#ced4da', borderRadius: 5, backgroundColor: '#ffffff', paddingHorizontal: 10, marginBottom: 10, fontSize: 12 }} value={ghiChuInput} onChangeText={setGhiChuInput} placeholder="Ví dụ: Heo 5 tuần" placeholderTextColor="#999999" />

                          {/* 6. NÚT KÍCH LỆNH LƯU CHỐT SỔ SỐ ÂM ĐÍCH DANH THEO TUẦN */}
                          <TouchableOpacity 
                            disabled={isSending || ((modalSubTab === "BAN_HEO" || modalSubTab === "HAO_HUT") && !tuanChuyenDuocChon)} 
                            style={{ backgroundColor: (isSending || ((modalSubTab === "BAN_HEO" || modalSubTab === "HAO_HUT") && !tuanChuyenDuocChon)) ? '#95a5a6' : '#28a745', paddingVertical: 9, borderRadius: 5, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }} 
                          onPress={() => {
                          const quanSoGoc = Number(soHeoInput);
                          if (modalSubTab !== "SUA_FORM" && (!quanSoGoc || quanSoGoc <= 0)) {
                            return Alert.alert("Thông báo", "Vui lòng nhập một số lượng heo thực tế lớn hơn 0!");
                          }

                          const chuongHienTai = selectedChuongGop?.tenChuong || "1";
                          const khuChuan = selectedChuongGop?.tenKhu || "Cai Sữa";
                          
                          let chuoiSoHeoGuiGoc = soHeoInput.trim();
                          let chuoiGhiChuGuiGoc = ghiChuInput.trim() || "Thả thêm heo mới vào ô";
                          let tuanTuoiGuiGoc = tuanTuoiInput.trim() || "4";
                          let ngayNhapGuiGoc = ngayNhapInput.trim() || formatVNDate(new Date());

                          // 🧠 TRƯỜNG HỢP NẾU LÀM LỆNH SỬA SỐ LÔ LẺ HỆ THỐNG
                          if (modalSubTab === "SUA_FORM" && editingRowId) {
                            chuoiSoHeoGuiGoc = soHeoInput.trim();
                            chuoiGhiChuGuiGoc = ghiChuInput.trim() || "Sửa số lượng lô heo hệ thống";
                            handleXacNhanGhiChuongMoi(chuoiSoHeoGuiGoc, chuoiGhiChuGuiGoc);
                            return; // Sập phanh an toàn cho lệnh sửa
                          }

                          // 🎯 BẢN VÁ TRIỆT ĐỂ MỐC NGÀY: Khóa cứng ngày gửi đi bắt buộc phải là mốc ngày lùi lịch khách chọn (ngayNhapInput)
                          if (modalSubTab === "BAN_HEO" || modalSubTab === "HAO_HUT") {
                            const mocTuoiDangGo = Number(tuanChuyenDuocChon) || 0; // Nhặt đúng lứa tuần hiện tại công nhân chạm chọn bầy
                            const mangPhuThoQuet = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
                            
                            let thucTeTuanNayCo = 0;
                            mangPhuThoQuet.forEach(d => {
                              if (d && d.tenChuong?.toString().trim() === chuongHienTai && d.tenKhu?.toString().trim() === khuChuan) {
                                const tGocVao = Number(d.tuanTuoi) || 0;
                                const tuoiThucTeDoDuoc = Number(d.soCon) === 0 ? 0 : tinhTuoiTinhTienThuHai(tGocVao, d.ngayNhapChuong || "");
                                if (tuoiThucTeDoDuoc === mocTuoiDangGo) { thucTeTuanNayCo += (Number(d.soCon) || 0); }
                              }
                            });

                            if (quanSoGoc > thucTeTuanNayCo) {
                              return Alert.alert("🚨 Vượt hạn mức thực kho!", `Lứa lợn [ ${mocTuoiDangGo} Tuần ] hiện tại chỉ còn đúng [ ${thucTeTuanNayCo} con ]. Bạn không thể xuất bán hoặc hao hụt vượt quá mức đang giữ!`);
                            }

                            const bayGocMocDocFormA = mangPhuThoQuet.find(d => {
                              if (d && d.tenChuong?.toString().trim() === chuongHienTai && d.tenKhu?.toString().trim() === khuChuan) {
                                const tuoiThucTeDoDuoc = Number(d.soCon) === 0 ? 0 : tinhTuoiTinhTienThuHai(Number(d.tuanTuoi) || 0, d.ngayNhapChuong || "");
                                return tuoiThucTeDoDuoc === mocTuoiDangGo;
                              }
                              return false;
                            }) || {};

                                         // 🎯 BẢN VÁ KHÓA CỨNG TUỔI THỰC TẾ: Ép chứng từ xuất bán / hao hụt ăn chằn chặn theo Tuần hiện tại và Ngày hôm nay
                            // Tuyệt đối không bốc lại ngày nhập chuồng quá khứ làm lệch pha trục báo cáo Ledger trại
                            const mocTuoiTuanHienTaiCuaBay = Number(tuanChuyenDuocChon) || 10;
                            const chuoiNgayHomNayVatLy = (ngayNhapInput || formatVNDate(new Date())).toString().trim();
                            const soTuanLuiNgay = tinhTuoiTinhTienThuHai(1, chuoiNgayHomNayVatLy) - 1;
const tuoiGhiSo = mocTuoiTuanHienTaiCuaBay - soTuanLuiNgay;
if (tuoiGhiSo < 1) {
  return Alert.alert("Thông báo", `Ngày ${chuoiNgayHomNayVatLy} lùi quá xa: lúc đó lứa Tuần ${mocTuoiTuanHienTaiCuaBay} chưa đủ 1 tuần tuổi. Vui lòng chọn ngày gần hơn.`);
}  
                            chuoiSoHeoGuiGoc = `-${quanSoGoc}`;
                            
                            // 🚀 TRỌ LỰC CỐT LÕI: Ép tuổi tuần vào gốc bắn lên mây Sheets bằng chính số Tuần hiện tại khách chạm chọn ngoài mặt sảnh (Ví dụ: số 10)
                            tuanTuoiGuiGoc = tuoiGhiSo.toString();
                            
                            // 🚀 KHÓA MỐC NGÀY CHỨNG TỪ: Ép mốc ngày ghi sổ bắt buộc phải là Ngày hôm nay khách chọn thực hiện nghiệp vụ
                            ngayNhapGuiGoc = chuoiNgayHomNayVatLy; 
                            
                                                    // 🎯 BẢN VÁ GHI CHÚ THỜI GIAN THỰC: Ép nhãn chữ luôn luôn nảy số theo đúng lứa tuần gối đầu hiện hành và Ngày hôm nay vật lý
                         // 🎯 BẢN VÁ BỘ LỌC GHI CHÚ THÔNG MINH: Ưu tiên bốc chữ khách tự gõ tay, nếu để trống mới tự động sinh nhãn mặc định chuẩn đét
                           // 🎯 BẢN VÁ GHI CHÚ THÔNG MINH TỐI CAO: Khởi tạo trống, tự động nối nhãn Sự kiện chọn vào trước nội dung khách gõ tay
                            const ghiChuGoTay = ghiChuInput ? ghiChuInput.trim() : "";
                            const nhanHanhDongPrefix = (modalSubTab === "BAN_HEO") ? "[XUẤT BÁN]" : "[HAO HỤT]";
                            
                            if (ghiChuGoTay !== "") {
                              // Nếu khách có nhập chữ -> Tự động điền nhãn Sự kiện chọn lên trước nội dung khách gõ tay chằn chặn
                              chuoiGhiChuGuiGoc = `${nhanHanhDongPrefix}: ${ghiChuGoTay}`;
                            } else {
                              // Nếu khách bỏ trống -> Tự động sinh chuỗi thông báo đầy đủ mốc lứa Tuần và Ngày hôm nay vật lý
                              chuoiGhiChuGuiGoc = (modalSubTab === "BAN_HEO")
                                ? `[XUẤT BÁN]: Bán ${quanSoGoc} con heo Tuần ${mocTuoiTuanHienTaiCuaBay} (Xuất ngày ${chuoiNgayHomNayVatLy})`
                                : `[HAO HỤT]: Hao Hụt ${quanSoGoc} con heo Tuần ${mocTuoiTuanHienTaiCuaBay} (Ghi sổ ngày ${chuoiNgayHomNayVatLy})`;
                            }
                            setTuanTuoiInput(tuanTuoiGuiGoc);
                          }

                                                   // 📡 KÍCH NỔ API MẠNG: Đổ trực tiếp tham số chốt chặn đa cột lên mây, đồng bộ cứng mã sự kiện sang Cột K
                          setIsSaving(true);
                          if (typeof setDongBoStatus === 'function') setDongBoStatus("⏳ Đang dồn chứng từ đối trừ lên mây Sheets...");
                          
                          // 🚀 GHI SỔ CÁI THẲNG LÊN FIRESTORE: 1 dòng = 1 document, nhãn sự kiện (suKienHeoThit) = modalSubTab; Cloud Function tự đồng bộ sang Sheet
                          ghiDongMoi({
                            userEmail, tenKhu: khuChuan, tenChuong: chuongHienTai,
                            soCon: Number(chuoiSoHeoGuiGoc), tuanTuoi: Number(tuanTuoiGuiGoc), ngayNhapChuong: ngayNhapGuiGoc, ghiChu: chuoiGhiChuGuiGoc,
                            soBaoCam: 0, soLieuVaccine: 0, suKienHeoThit: modalSubTab
                          }).then(dongMoiHoanThien => {
                            setIsSaving(false);
                            Alert.alert("Thành công 🎉");
                            if (typeof setDanhSachChuongThit === 'function') { setDanhSachChuongThit(prev => [...(Array.isArray(prev) ? prev : []), dongMoiHoanThien]); }
                            setSoHeoInput(""); setTuanTuoiInput(""); setTenKhuInput(""); setGhiChuInput(""); setTuanChuyenDuocChon(""); setIsActionModalVisible(false); setSelectedChuongGop(null);
                          }).catch(() => { setIsSaving(false); Alert.alert("Lỗi", "Không thể lưu dữ liệu, vui lòng kiểm tra mạng và thử lại."); });
                        }}
                      >
                        <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>
                          {((modalSubTab === "BAN_HEO" || modalSubTab === "HAO_HUT") && !tuanChuyenDuocChon) ? "⚠️ VUI LÒNG CHỌN BẦY TUỔI Ở TRÊN" : "💾 LƯU"}
                        </Text>
                      </TouchableOpacity>
                        </View>
                      )}

<FarmLogSubForm 
    cauHinhVacXinLoc={cauHinhVacXinLoc}
                        modalSubTab={modalSubTab} setModalSubTab={setModalSubTab} selectedChuongGop={selectedChuongGop} ngayNhapInput={ngayNhapInput} setIsCalendarOpen={setIsCalendarOpen} isCalendarOpen={isCalendarOpen} danhSachNgayTrongThangCalendar={danhSachNgayTrongThangCalendar} currentCalendarMonth={currentCalendarMonth} setCurrentCalendarMonth={setCurrentCalendarMonth} currentCalendarYear={currentCalendarYear} setCurrentCalendarYear={setCurrentCalendarYear} formatVNDate={formatVNDate} WEB_APP_URL={WEB_APP_URL} userEmail={userEmail} setDongBoStatus={setDongBoStatus} setDanhSachChuongThit={setDanhSachChuongThit}
                      />
                      
                     

                   {/* KHAY B: ĐÃ THU GỌN VÀO ĐÚNG RUỘT VIEW LUÂN CHUYỂN, GIẤU KÍN 100% KHI CHƯA CHỌN LỆNH */}
                  {modalSubTab === "LUAN_CHUYEN" && (
                    <View style={{ width: '100%', padding: 10, backgroundColor: '#e8f4fd', borderRadius: 8, borderWidth: 0.5, borderColor: '#b1dcfa', marginBottom: 10 }}>
                      
                      {/* 🌟 TIÊU ĐỀ DẸT KHÉP VÁCH BỌC LUÂN CHUYỂN: Chỉ xuất hiện đồng hành khi bấm nút Luân Chuyển */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#b1dcfa', paddingBottom: 5, marginBottom: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: '#0056b3' }}>
                          🚚 Luân Chuyển Heo
                        </Text>
                        <TouchableOpacity 
                          onPress={() => { setModalSubTab("AN_FORM"); setSoHeoChuyenInput(""); setChuongDichInput(""); setTuanChuyenDuocChon(""); }} 
                          style={{ backgroundColor: '#d0e7ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}
                        >
                          <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#0056b3' }}>✕ Ẩn Form</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#e67e22', marginBottom: 6 }}>4 Bước Luân Chuyển</Text>
                      
                      {/* CHẶNG 1: CHỌN ĐÍCH DANH TUẦN TUỔI MUỐN ĐUỔI ĐI TRONG CHUỒNG TRỘN */}
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#495057', marginBottom: 4 }}>Bước 1: Chọn Tuần Heo muốn chuyển đi</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8, backgroundColor: '#ffffff', padding: 5, borderRadius: 6, borderWidth: 0.5, borderColor: '#b1dcfa' }}>
                        {(() => {
                          const mangBayTho = Array.isArray(selectedChuongGop?.cacBayNho) ? selectedChuongGop.cacBayNho : [];
                          const khoLoTuoi = {};
                          
                          mangBayTho.forEach(b => {
                            if (!b) return;
                            const tReal = Number(b.tuanTuoiThucTe) || 0;
                            const sCon = Number(b.soCon) || 0;
                            if (!khoLoTuoi[tReal]) khoLoTuoi[tReal] = { tuoi: tReal, tongCon: 0, tuoiGocLucVao: Number(b.tuanTuoi) || 0, ngayGoc: b.ngayNhapChuong };
                            khoLoTuoi[tReal].tongCon += sCon;
                          });

                          const cacLoTuoiHienCo = Object.values(khoLoTuoi).filter(l => l.tongCon > 0);
                          if (cacLoTuoiHienCo.length === 0) return <Text style={{ fontSize: 10, color: '#7f8c8d', fontStyle: 'italic' }}>Không có bầy lợn nào hợp lệ để chuyển.</Text>;
                          
                          return cacLoTuoiHienCo.map((lo, lIdx) => {
                            const laTuoiDuocChon = tuanChuyenDuocChon === lo.tuoi;
                            return (
                              <TouchableOpacity 
                                key={`node_select_tuan_chuyen_${lo.tuoi}_${lIdx}`} 
                                activeOpacity={0.6} 
                                onPress={() => {
                                  setTuanChuyenDuocChon(lo.tuoi);
                                  setTuanTuoiInput(lo.tuoiGocLucVao.toString());
                                  setGhiChuInput(lo.ngayGoc); 
                                }} 
                                style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4, backgroundColor: laTuoiDuocChon ? '#e67e22' : '#f8f9fa', borderWidth: 1, borderColor: laTuoiDuocChon ? '#e67e22' : '#dee2e6' }}
                              >
                                <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: laTuoiDuocChon ? '#ffffff' : '#333333' }}>{`Bầy ${lo.tuoi} Tuần (${lo.tongCon} con)`}</Text>
                              </TouchableOpacity>
                            );
                          });
                        })()}
                      </View>

                      {/* CHẶNG 2: CHỌN PHÂN KHU ĐÍCH ĐỂ ĐUỔI LỢN ĐẾN */}
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#495057', marginBottom: 4 }}>Bước 2: Chọn Phân Khu đích muốn lùa Heo đến:</Text>
                      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 8 }}>
                        <TouchableOpacity activeOpacity={0.7} onPress={() => { setKhuDichInput("Cai Sữa"); setChuongDichInput(""); }} style={{ flex: 1, paddingVertical: 6, borderRadius: 5, backgroundColor: khuDichInput === "Cai Sữa" ? '#e63f22' : '#ffffff', borderWidth: 1, borderColor: '#b1dcfa', alignItems: 'center' }}><Text style={{ fontSize: 10.5, fontWeight: 'bold', color: khuDichInput === "Cai Sữa" ? '#ffffff' : '#555555' }}>Sang Cai Sữa</Text></TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.7} onPress={() => { setKhuDichInput("Chuồng Thịt"); setChuongDichInput(""); }} style={{ flex: 1, paddingVertical: 6, borderRadius: 5, backgroundColor: khuDichInput === "Chuồng Thịt" ? '#0056b3' : '#ffffff', borderWidth: 1, borderColor: '#b1dcfa', alignItems: 'center' }}><Text style={{ fontSize: 10.5, fontWeight: 'bold', color: khuDichInput === "Chuồng Thịt" ? '#ffffff' : '#555555' }}>Sang Chuồng Thịt</Text></TouchableOpacity>
                      </View>
                                            {/* CHẶNG 3: CHỌN SỐ Ô CHUỒNG ĐÍCH NHẬN ĐÀN */}
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#495057', marginBottom: 4 }}>Bước 3: Chọn Ô chuồng nhận Heo</Text>
                      {(() => {
                        const mangGocTho = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : []; const danhSachChuongGoiY = [];
                        mangGocTho.forEach(c => { if (c && c.tenChuong && c.tenKhu === khuDichInput) { const soCh = c.tenChuong.toString().trim(); if (soCh !== selectedChuongGop?.tenChuong || khuDichInput !== selectedChuongGop?.tenKhu) { if (!danhSachChuongGoiY.includes(soCh)) danhSachChuongGoiY.push(soCh); } } });
                        danhSachChuongGoiY.sort((x, y) => x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' }));
                        if (danhSachChuongGoiY.length === 0) return <Text style={{ fontSize: 10, color: '#7f8c8d', fontStyle: 'italic', paddingVertical: 4 }}>Khu vực {khuDichInput} hiện tại chưa khởi tạo ô trống nào.</Text>;
                        return (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8, backgroundColor: '#ffffff', padding: 5, borderRadius: 6, borderWidth: 0.5, borderColor: '#b1dcfa' }}>
                            {danhSachChuongGoiY.map((soChuongGoiY, sIdx) => { const laChon = chuongDichInput === soChuongGoiY; return (<TouchableOpacity key={`node_goi_y_${soChuongGoiY}_${sIdx}`} activeOpacity={0.6} onPress={() => setChuongDichInput(soChuongGoiY)} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: laChon ? '#e67e22' : '#f8f9fa', borderWidth: 1, borderColor: laChon ? '#e67e22' : '#dee2e6' }}><Text style={{ fontSize: 10.5, fontWeight: 'bold', color: laChon ? '#ffffff' : '#333333' }}>{`Ô ${soChuongGoiY}`}</Text></TouchableOpacity>); })}
                          </View>
                        );
                      })()}

                      {/* CHẶNG 4: NHẬP SỐ CON LỢN ĐUỔI ĐI VÀ LƯU CHỨNG TỪ ĐỐI XỨNG CHẶN CHẶN */}
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#495057', marginBottom: 4 }}>Bước 4: Nhập số lượng Heo chuyển đi:</Text>
                      <TextInput style={{ height: 36, borderWidth: 1, borderColor: '#b1dcfa', borderRadius: 5, paddingHorizontal: 10, fontSize: 13, color: '#111111', backgroundColor: '#ffffff', textAlign: 'center', fontWeight: 'bold', marginBottom: 10 }} placeholder="Ví dụ: 50" placeholderTextColor="#999999" keyboardType="numeric" value={soHeoChuyenInput} onChangeText={(txt) => setSoHeoChuyenInput(txt.replace(/[^0-9]/g, ''))} />
                      
                                           {/* 🎯 MỎ NEO CHỐT HẠ: BỘ LỌC KIỂM KHO TUYỆT ĐỐI KHÓA CHẶN 100% NGUY CƠ ĐUỔI LỢN VƯỢT ĐÀN CHUẨN ERP TRẠI */}
                      <TouchableOpacity 
                        activeOpacity={0.7} 
                        disabled={isSending || !chuongDichInput || !tuanChuyenDuocChon} 
                        style={{ backgroundColor: (isSending || !chuongDichInput || !tuanChuyenDuocChon) ? '#95a5a6' : '#0056b3', paddingVertical: 9, borderRadius: 5, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }} 
                        onPress={() => {
                          const soConChuyen = Number(soHeoChuyenInput);
                          if (!soConChuyen || soConChuyen <= 0) {
                            return Alert.alert("Thông báo", "Vui lòng nhập một số lượng lợn luân chuyển thực tế lớn hơn 0!");
                          }

                          const chuongNguon = selectedChuongGop?.tenChuong || "1";
                          const khuNguon = selectedChuongGop?.tenKhu || "Cai Sữa";
                          const chuoiNgayHomNay = formatVNDate(new Date());

                          // 🧠 THUẬT TOÁN ĐO TUỔI THỨ HAI ĐỒNG BỘ: Ép máy đo tuổi thực tế của bầy ngay tại thời điểm bấm nút
                          const mangGocThoQuet = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
                          let thucTeTuanChuyenCo = 0;

                          mangGocThoQuet.forEach(d => {
                            if (d && d.tenChuong?.toString().trim() === chuongNguon && d.tenKhu?.toString().trim() === khuNguon) {
                              const tuoiMocLucVao = Number(d.tuanTuoi) || 0;
                              const chuoiNgayMocVao = d.ngayNhapChuong || "";
                              const tuoiThucTeDoDuoc = Number(d.soCon) === 0 ? 0 : tinhTuoiTinhTienThuHai(tuoiMocLucVao, chuoiNgayMocVao);
                              
                              // Hễ bầy lẻ nào có số tuổi thực tế sau khi tăng tịnh tiến trùng khít lứa tuần được chọn thì gom quân số
                              if (tuoiThucTeDoDuoc === Number(tuanChuyenDuocChon)) {
                                thucTeTuanChuyenCo += (Number(d.soCon) || 0);
                              }
                            }
                          });

                          // 🚀 PHANH CHỐT CỨNG: Nếu gõ vượt quá quân số thực tế sau gộp của riêng lứa tuần đó, sập phanh dừng hình lập tức!
                          if (soConChuyen > thucTeTuanChuyenCo) {
                            return Alert.alert(
                              "🚨 Không đủ quân số điều chuyển!", 
                              `Lứa lợn [ ${tuanChuyenDuocChon} Tuần tuổi ] này hiện tại trong chuồng chỉ còn đúng [ ${thucTeTuanChuyenCo} con ]. Bạn không thể luân chuyển quá số lượng thực kho!`
                            );
                          }

                          // 🧠 Trích xuất đích danh mốc giấy tờ bầy gốc để bắn lên mây đối trừ dòng âm chằn chặn
                          const bayGocMocDoc = mangGocThoQuet.find(d => {
                            if (d && d.tenChuong?.toString().trim() === chuongNguon && d.tenKhu?.toString().trim() === khuNguon) {
                              const tuoiThucTeDoDuoc = Number(d.soCon) === 0 ? 0 : tinhTuoiTinhTienThuHai(Number(d.tuanTuoi) || 0, d.ngayNhapChuong || "");
                              return tuoiThucTeDoDuoc === Number(tuanChuyenDuocChon);
                            }
                            return false;
                          }) || {};

                          const tuoiGocLucVao = Number(bayGocMocDoc.tuanTuoi) || 4;
                          const ngayNhapGocCuaLo = bayGocMocDoc.ngayNhapChuong || formatVNDate(new Date());

                          const ghiChuTru = `🚚 Đuổi lứa ${tuanChuyenDuocChon}T sang Khu ${khuDichInput} - Ô ${chuongDichInput}`;
                          const ghiChuCong = `🚚 Nhận lứa ${tuanChuyenDuocChon}T từ Khu ${khuNguon} - Ô ${chuongNguon}`;

                          const dongTruDieuChuyen = { userEmail, tenKhu: khuNguon, tenChuong: chuongNguon, soCon: -soConChuyen, tuanTuoi: tuoiGocLucVao, ngayNhapChuong: ngayNhapGocCuaLo, ghiChu: ghiChuTru, soBaoCam: 0, soLieuVaccine: 0, suKienHeoThit: "LUAN_CHUYEN" };
                          const dongCongDieuChuyen = { userEmail, tenKhu: khuDichInput, tenChuong: chuongDichInput.trim(), soCon: soConChuyen, tuanTuoi: tuanChuyenDuocChon, ngayNhapChuong: chuoiNgayHomNay, ghiChu: ghiChuCong, soBaoCam: 0, soLieuVaccine: 0, suKienHeoThit: "LUAN_CHUYEN" };

                          // Kích nổ lệnh điều phối: 2 dòng (trừ + cộng) được ghi cùng 1 lô, hoặc thành công cả hai hoặc không dòng nào
                          handleXacNhanDieuChuyenHeoMoi(dongTruDieuChuyen, dongCongDieuChuyen, soConChuyen);
                        }}
                      >
                        <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 11.5 }}>
                          {!tuanChuyenDuocChon ? "⚠️ CHƯA CHỌN BẦY LỢN MUỐN ĐUỔI" : !chuongDichInput ? "⚠️ CHƯA CHỌN Ô CHUỒNG ĐÍCH" : "🔀 XÁC NHẬN CHUYỂN ĐÀN"}
                        </Text>
                      </TouchableOpacity>

                    </View>
                  )}


                      {/* KHỐI XÓA CHUỒNG: LUÔN HIỂN THỊ, KỂ CẢ CÒN HEO */}
                      <TouchableOpacity 
                        onPress={() => {
                          const conHeoHienTai = Number(selectedChuongGop?.tongSoCon) > 0;
                          Alert.alert(
                            "❌ Xóa hoàn toàn ô chuồng?",
                            conHeoHienTai
                              ? `Ô chuồng [${selectedChuongGop?.tenChuong}] hiện vẫn còn ${selectedChuongGop?.tongSoCon} con heo. Xóa sẽ gỡ hẳn ô chuồng này khỏi sơ đồ trại. Hành động này KHÔNG hoàn tác được. Bạn chắc chắn chứ?`
                              : `Xóa hẳn ô chuồng [${selectedChuongGop?.tenChuong}] khỏi sơ đồ trại? Hành động này KHÔNG hoàn tác được.`,
                            [
                              { text: "Hủy", style: "cancel" },
                              { text: "Xóa hoàn toàn", style: "destructive", onPress: handleXoaBoHoanToanChuong }
                            ]
                          );
                        }} 
                        style={{ backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fbc4c4', paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginBottom: 10 }}
                      >
                        <Text style={{ color: '#e53e3e', fontWeight: 'bold', fontSize: 11 }}>❌ XÓA HOÀN TOÀN Ô CHUỒNG NÀY KHỎI SƠ ĐỒ TRẠI</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                {/* ================================================================= */}
                  {/* TRƯỜNG HỢP B: LẬT TRÚNG TAB LỊCH SỬ ĐÀN — CHỈ HIỆN BIẾN ĐỘNG QUÂN SỐ HEO */}
                  {/* ================================================================= */}
                                  {/* ========================================== */}
                  {/* KHỐI LỊCH SỬ BIẾN ĐỘNG - THIẾT KẾ TIMELINE BA CỘT SIÊU THOÁNG */}
                  {/* ========================================== */}
                                   {/* ========================================== */}
                  {/* KHỐI LỊCH SỬ BIẾN ĐỘNG - THIẾT KẾ TIMELINE MINI-CARD CHUYÊN NGHIỆP */}
                  {/* ========================================== */}
                  {modalSubTab === "XEM_LICH_SU" && (
                    <View style={{ width: '100%' }}>
                      <Text style={{ fontSize: 13, fontWeight: '900', color: '#1e293b', marginBottom: 12, letterSpacing: 0.2 }}>
                        📜 LỊCH SỬ BIẾN ĐỘNG QUÂN SỐ:
                      </Text>

                      {/* 🆕 NÚT XÓA TOÀN BỘ LỊCH SỬ ĐÀN CỦA Ô CHUỒNG NÀY */}
                      <TouchableOpacity 
                        onPress={() => {
                          const mangGocThoXoa = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
                          const nhatKyCuaChuongXoa = mangGocThoXoa.filter(item => item && item.tenChuong?.toString().trim() === selectedChuongGop?.tenChuong && item.tenKhu?.toString().trim() === selectedChuongGop?.tenKhu);
                          const nhatKyQuanSoCanXoa = nhatKyCuaChuongXoa.filter(log => log && Number(log.soCon) !== 0 && log.suKienHeoThit !== "VAO_CAM" && log.suKienHeoThit !== "TIEM_VACCINE" && log.suKienHeoThit !== "DON_CHUONG");
                          if (nhatKyQuanSoCanXoa.length === 0) return Alert.alert("Thông báo", "Không có lịch sử đàn nào để xóa!");
                          Alert.alert(
                            "🗑️ Xóa toàn bộ lịch sử đàn?",
                            `Sẽ xóa vĩnh viễn toàn bộ ${nhatKyQuanSoCanXoa.length} dòng lịch sử biến động quân số của ô chuồng này. Hành động này KHÔNG hoàn tác được!`,
                            [
                              { text: "Hủy", style: "cancel" },
{ text: "Xóa hết", style: "destructive", onPress: () => handleXoaSachTuyetDoiTheoHangMuc("QUAN_SO", "Toàn bộ chứng từ nhật ký quân số đàn của ô chuồng này đã bị bốc nhổ vĩnh viễn khỏi Sheets!") }
                            ]
                          );
                        }} 
                        style={{ paddingVertical: 8, backgroundColor: '#fff5f5', borderRadius: 6, borderWidth: 1, borderColor: '#fbc4c4', alignItems: 'center', marginBottom: 10 }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#dc3545' }}>🗑️ XÓA TOÀN BỘ LỊCH SỬ ĐÀN</Text>
                      </TouchableOpacity>
                      
                      <ScrollView 
                        style={{ maxHeight: 290 }} 
                        nestedScrollEnabled={true} 
                        showsVerticalScrollIndicator={true}
                      >
                        {(() => {
                          const mangGocTho = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
                          const nhatKyCuaChuong = mangGocTho.filter(item => item && item.tenChuong?.toString().trim() === selectedChuongGop?.tenChuong && item.tenKhu?.toString().trim() === selectedChuongGop?.tenKhu);

                          // BỘ LỌC CỨNG: Lọc bỏ dòng cám thuốc và dòng dọn chuồng 0 con ra khỏi Tab quân số
                          const nhatKyQuanSo = nhatKyCuaChuong.filter(log => log && Number(log.soCon) !== 0 && log.suKienHeoThit !== "VAO_CAM" && log.suKienHeoThit !== "TIEM_VACCINE" && log.suKienHeoThit !== "DON_CHUONG");

                          if (nhatKyQuanSo.length === 0) { 
                            return (
                              <Text style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic', paddingVertical: 35, textAlign: 'center' }}>
                                Ô chuồng chưa có lịch sử nhập xuất quân số.
                              </Text>
                            ); 
                          }
                          
                          nhatKyQuanSo.sort((x, y) => (y.id || "").toString().localeCompare((x.id || "").toString()));

                          return nhatKyQuanSo.map((log, lIdx) => {
                            const laSoAm = Number(log.soCon) < 0;
                            const hienThiSoCon = laSoAm ? `${log.soCon}` : `+${log.soCon}`;
                            
                            return (
                              <View 
                                key={`ledger_pig_history_${log.id || lIdx}`} 
                                style={{ 
                                  flexDirection: 'column',
                                  padding: 12,
                                  backgroundColor: laSoAm ? '#fff8f8' : '#f8fafc', // Màu nền Pastel nguyên khối cực sạch
                                  borderWidth: 1,
                                  borderColor: laSoAm ? '#fee2e2' : '#e2e8f0',
                                  borderRadius: 12, // Bo góc mềm mại hiện đại
                                  marginBottom: 8,
                                }}
                              >
                                {/* 🔝 HÀNG 1: THÔNG TIN SỐ LIỆU CHÍNH & CẶP NÚT BẤM THAO TÁC */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                  
                                  {/* Cột trái hàng 1: Ngày tháng + Số lượng heo to rõ */}
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b' }}>
                                      {log.ngayNhapChuong}
                                    </Text>
                                    
                                    <Text style={{ fontSize: 15, fontWeight: '900', color: laSoAm ? '#dc2626' : '#059669', marginLeft: 2 }}>
                                      {hienThiSoCon}
                                    </Text>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: laSoAm ? '#dc2626' : '#059669' }}>
                                      con
                                    </Text>

                                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#b45309', backgroundColor: '#fef3c7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginLeft: 4 }}>
                                      {`${log.tuanTuoi}Tuần`}
                                    </Text>
                                  </View>

                                  {/* Cột phải hàng 1: Nút bấm Icon Xóa mini cố định phía trên */}
                                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                    <TouchableOpacity 
                                      activeOpacity={0.6} 
                                      onPress={() => { 
                                        Alert.alert(
                                          "🗑️ Xóa lịch sử?", 
                                          `Xác nhận xóa dòng quân số [ ${log.soCon} con ] này?`, 
                                          [
                                            { text: "Hủy", style: "cancel" }, 
                                            { 
                                              text: "Xóa", 
                                              style: "destructive", 
                                              onPress: () => { 
                                                setIsSaving(true); 
                                                // 🗑️ XÓA HẲN document trên Firestore; Cloud Function tự xóa dòng tương ứng trên Sheet
                                                xoaDong(log.id)
                                                  .then(() => { 
                                                    setIsSaving(false); 
                                                    Alert.alert("Thành công 🗑️", "Đã xóa dòng lịch sử quân số."); 
                                                    if (typeof setDanhSachChuongThit === 'function') { 
                                                      setDanhSachChuongThit(prev => (Array.isArray(prev) ? prev : []).filter(c => c && c.id !== log.id)); 
                                                    }
                                                    setIsActionModalVisible(false); 
                                                    setSelectedChuongGop(null); 
                                                  })
                                                  .catch(() => { setIsSaving(false); Alert.alert("Lỗi", "Không thể xóa dòng này, vui lòng kiểm tra mạng và thử lại."); });
                                              } 
                                            }
                                          ]
                                        ); 
                                      }} 
                                      style={{ width: 28, height: 28, backgroundColor: '#ffffff', borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fca5a5' }}
                                    >
                                      <Text style={{ fontSize: 12 }}>🗑️</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>

                                {/* 📋 HÀNG 2: DÒNG GHI CHÚ RIÊNG BIỆT DÀN ĐỀU PHÍA DƯỚI */}
                                <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: laSoAm ? '#fee2e2' : '#e2e8f0' }}>
                                  <Text style={{ fontSize: 11, color: '#475569', lineHeight: 15 }}>
                                    {log.ghiChu ? `📝: ${log.ghiChu}` : "📝 Không có ghi chú phụ đi kèm"}
                                  </Text>
                                </View>

                              </View>
                            );
                          });
                        })()}
                      </ScrollView>

                      {/* THANH QUAY LẠI ĐEN CÁ TÍNH */}
                      <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => setModalSubTab("AN_FORM")} 
                        style={{ marginTop: 14, paddingVertical: 10, backgroundColor: '#1e293b', borderRadius: 8, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12.5 }}>
                          ◀ QUAY LẠI KHAY ĐIỀU HÀNH
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

           
                                {/* ================================================================= */}
                  {/* 🆕 TRƯỜNG HỢP C: LẬT TRÚNG SUB-TAB SỐ 3 — CHỈ XỔ RIÊNG LỊCH SỬ VÀO CÁM VÀ VACCINE PHẲNG MỊN */}
                  {/* ================================================================= */}
                  {/* 🆕 TRƯỜNG HỢP C HOÀN THIỆN: NHẬT KÝ CHI PHÍ VẬT TƯ TÍCH HỢP ĐỦ CẶP NÚT SỬA VÀ XÓA */}
                  {/* ================================================================= */}
                  {modalSubTab === "LICH_SU_CAM_THUOC" && (
                    <View style={{ width: '100%' }}>
                      <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#474441', marginBottom: 8 }}>🌾 NHẬT KÝ TIÊU THỤ CÁM VÀ THUỐC CỦA CHUỒNG:</Text>
{/* 🌾 TỔNG CÁM ĐÃ NHẬP CHO Ô CHUỒNG NÀY (cộng toàn bộ các lần nhập cám trong lịch sử) */}
{(() => {
  const mangGocTongCam = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
  const cacLanNhapCam = mangGocTongCam.filter(item => item && item.suKienHeoThit === "VAO_CAM" && item.tenChuong?.toString().trim() === selectedChuongGop?.tenChuong && item.tenKhu?.toString().trim() === selectedChuongGop?.tenKhu);
  const tongBaoCam = cacLanNhapCam.reduce((tong, log) => tong + (Number(log.soBaoCam) || 0), 0);
  return (
    <View style={{ backgroundColor: '#eee6ff', borderWidth: 1, borderColor: '#b2c5ff', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#e65100' }}> Tổng cám đã nhập</Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: '900', color: '#e65100' }}>{tongBaoCam} bao</Text>
    </View>
  );
})()}
                      {/* 🆕 NÚT XÓA TOÀN BỘ LỊCH SỬ CÁM/THUỐC CỦA Ô CHUỒNG NÀY */}
                      <TouchableOpacity 
                        onPress={() => {
                          const mangGocThoXoaVT = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
                          const nhatKyCuaChuongXoaVT = mangGocThoXoaVT.filter(item => item && item.tenChuong?.toString().trim() === selectedChuongGop?.tenChuong && item.tenKhu?.toString().trim() === selectedChuongGop?.tenKhu);
                          const nhatKyVatTuCanXoa = nhatKyCuaChuongXoaVT.filter(log => log && (log.suKienHeoThit === "VAO_CAM" || log.suKienHeoThit === "TIEM_VACCINE"));
                          if (nhatKyVatTuCanXoa.length === 0) return Alert.alert("Thông báo", "Không có lịch sử cám/thuốc nào để xóa!");
                          Alert.alert(
                            "🗑️ Xóa toàn bộ lịch sử cám/thuốc?",
                            `Sẽ xóa vĩnh viễn toàn bộ ${nhatKyVatTuCanXoa.length} dòng nhật ký cám/thuốc của ô chuồng này. Hành động này KHÔNG hoàn tác được!`,
                            [
                              { text: "Hủy", style: "cancel" },
{ text: "Xóa hết", style: "destructive", onPress: () => handleXoaSachTuyetDoiTheoHangMuc("VAT_TU", "Toàn bộ nhật ký bao cám và mũi tiêm của ô chuồng này đã bị bốc nhổ vĩnh viễn khỏi Sheets!") }
                            ]
                          );
                        }} 
                        style={{ paddingVertical: 8, backgroundColor: '#fff5f5', borderRadius: 6, borderWidth: 1, borderColor: '#fbc4c4', alignItems: 'center', marginBottom: 10 }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#dc3545' }}>🗑️ XÓA TOÀN BỘ LỊCH SỬ CÁM/THUỐC</Text>
                      </TouchableOpacity>
                      <ScrollView style={{ maxHeight: 260 }} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                        {(() => {
                          const mangGocTho = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
                          const nhatKyCuaChuong = mangGocTho.filter(item => item && item.tenChuong?.toString().trim() === selectedChuongGop?.tenChuong && item.tenKhu?.toString().trim() === selectedChuongGop?.tenKhu);

                          // BỘ LỌC CỨNG: Ép mảng chỉ nhặt đúng 2 nhãn sự kiện vật tư truyền mạng kịch lề
                          const nhatKyVatTu = nhatKyCuaChuong.filter(log => log && (log.suKienHeoThit === "VAO_CAM" || log.suKienHeoThit === "TIEM_VACCINE"));

                          if (nhatKyVatTu.length === 0) { return <Text style={{ fontSize: 11, color: '#7f8c8d', fontStyle: 'italic', paddingVertical: 15, textAlign: 'center' }}>Chưa có phát sinh nhật ký đổ cám hay vaccine nào.</Text>; }
                          nhatKyVatTu.sort((x, y) => (y.id || "").toString().localeCompare((x.id || "").toString()));
                          
                          return nhatKyVatTu.map((log, lIdx) => {
                            const laCam = log.suKienHeoThit === "VAO_CAM";
                            return (
                              <View 
                                key={`history_vattu_node_${log.id || lIdx}`} 
                                style={{ 
                                  padding: 8, 
                                  backgroundColor: laCam ? '#fffdf4' : '#f5f0ff', 
                                  borderRadius: 8, 
                                  borderWidth: 0.5, 
                                  borderColor: laCam ? '#ffe0b2' : '#d6c4ff', 
                                  marginBottom: 6, 
                                  flexDirection: 'row', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between' 
                                }}
                              >
                                {/* KHỐI CHỮ TRÁI SIÊU TINH GIẢN: ĐÃ TRIỆT TIÊU TOÀN BỘ SỐ HEO / HÀNH ĐỘNG THỪA */}
                                <View style={{ flex: 1, paddingRight: 6 }}>
                                  <Text style={{ fontSize: 11, color: '#6c757d', fontWeight: 'bold', marginBottom: 2 }}>
                                    📅 {log.ngayNhapChuong}
                                  </Text>
                                  {/* 🚀 ĐÃ VÁ THÔNG MẠCH: Bốc trúng phóc thông số định lượng từ cột soBaoCam và soLieuVaccine lên giao diện */}
                                  <Text style={{ fontSize: 12, color: '#111111', fontWeight: '900' }}>
                                    {laCam 
                                      ? `🌾 Số Cám: ${log.soBaoCam || 0} Bao cám` 
                                      : `💊 Tiêm chủng: ${log.soLieuVaccine || 0} Liều thuốc`}
                                  </Text>

                                  {log.ghiChu ? (
                                    <Text style={{ fontSize: 10, color: '#495057', fontStyle: 'italic', marginTop: 3, backgroundColor: '#f1f3f5', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, alignSelf: 'flex-start' }}>
                                      📌 Ghi chú: {log.ghiChu}
                                    </Text>
                                  ) : null}
                                </View>

                                {/* CẶP NÚT ĐIỀU HÀNH VẬT TƯ: ĐÃ TÍCH HỢP THÊM NÚT SỬA ĐA TẦNG PHẲNG MỊN KỀ CẠNH CHÂN */}
                                <View style={{ flexDirection: 'row', gap: 4 }}>
                                  
                                  {/* 1. 🆕 NÚT SỬA DÒNG CHI PHÍ VẬT TƯ: Tự động nẹp số con bằng 0, kích nổ Form phụ */}
                                  <TouchableOpacity 
  activeOpacity={0.6} 
   onPress={() => { 
                                    setEditingRowId(log.id); 
                                    const soLuongCu = laCam ? (log.soBaoCam || 0).toString() : (log.soLieuVaccine || 0).toString();
                                    setSoHeoInput(soLuongCu); 
                                    setTuanTuoiInput((log.tuanTuoi || 4).toString()); 
                                    setGhiChuInput(log.ghiChu || ""); 
                                    setNgayNhapInput(log.ngayNhapChuong || formatVNDate(new Date())); 
                                    
                                    // 🚀 KHÓA MẠCH: Ép nhảy State phụ phụ chuẩn đét để nút Lưu nhận diện đúng phân hệ Cám / Thuốc
                                    setModalSubTab(laCam ? "VAO_CAM" : "TIEM_VACCINE");
                                    setIsEditModalVisible(true);
                                  }} 
  style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fff3cd', borderRadius: 4, borderWidth: 0.5, borderColor: '#ffeeba' }}
>
  <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#b58100' }}>Sửa</Text>
</TouchableOpacity>


                                  {/* 2. NÚT XÓA TRIỆT TIÊU DÒNG VẬT TƯ NHẦM */}
                                  <TouchableOpacity 
                                    activeOpacity={0.6} 
                                    onPress={() => { 
                                      Alert.alert(
                                        "🗑️ Xóa nhật ký?", 
                                        "Bạn muốn xóa dòng nhật ký cám / vacxin này?", 
                                        [
                                          { text: "Hủy", style: "cancel" }, 
                                          { 
                                            text: "Đồng ý", 
                                            style: "destructive", 
                                            onPress: () => { 
                                              setIsSaving(true); 
                                              // 🗑️ XÓA HẲN document trên Firestore; Cloud Function tự xóa dòng tương ứng trên Sheet
                                              xoaDong(log.id)
                                              .then(() => { 
                                                setIsSaving(false); 
                                                Alert.alert("Đã xóa 🗑️", "Dòng nhật ký cám / vacxin đã được xóa."); 
                                                if (typeof setDanhSachChuongThit === 'function') { 
                                                  setDanhSachChuongThit(prev => (Array.isArray(prev) ? prev : []).filter(c => c && c.id !== log.id)); 
                                                } 
                                                setIsActionModalVisible(false); 
                                                setSelectedChuongGop(null); 
                                              })
                                              .catch(() => { setIsSaving(false); Alert.alert("Lỗi", "Không thể xóa dòng này, vui lòng kiểm tra mạng và thử lại."); });
                                            } 
                                          }
                                        ]
                                      ); 
                                    }} 
                                    style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#ffffff', borderRadius: 4, borderWidth: 0.5, borderColor: '#fbc4c4' }}
                                  >
                                    <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#dc3545' }}>Xóa</Text>
                                  </TouchableOpacity>

                                </View>
                              </View>
                            );
                          });
                        })()}
                      </ScrollView>
                      
                      <TouchableOpacity onPress={() => setModalSubTab("AN_FORM")} style={{ marginTop: 10, paddingVertical: 8, backgroundColor: '#fd7e14', borderRadius: 6, alignItems: 'center' }}><Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>◀ QUAY LẠI KHAY ĐIỀU HÀNH Ô CHUỒNG</Text></TouchableOpacity>
                    </View>
                  )}


{/* ================================================================= */}
          {/* 📥 POPUP MODAL MỚI TINH: CHUYÊN BIỆT DÀNH RIÊNG CHO VIỆC HIỆU CHỈNH SỐ LIỆU TRỰC QUAN */}
          {/* ================================================================= */}
          <Modal
            animationType="fade" 
            transparent={true} 
            visible={isEditModalVisible}
            onRequestClose={() => { setIsEditModalVisible(false); setEditingRowId(null); }}
          >
            <KeyboardAvoidingView 
              behavior={Platform.OS === "ios" ? "padding" : "height"} 
              style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' }}
            >
              <View style={{ width: '88%', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, elevation: 10, borderWidth: 1.5, borderColor: '#ffc107' }}>
                
                {/* Header Popup */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ffeeba', paddingBottom: 10, marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#a77900' }}>✏️ HIỆU CHỈNH SỐ LIỆU Ô CHUỒNG</Text>
                  <TouchableOpacity 
                    onPress={() => { setIsEditModalVisible(false); setEditingRowId(null); }}
                    style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: 14 }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#64748b' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* 1. Nhập Số Lượng */}
               <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#495057', marginBottom: 4 }}>
  {modalSubTab === "LICH_SU_CAM_THUOC" 
    ? (ghiChuInput.includes("Cám") || soHeoInput ? "Số lượng vật tư cũ (Bao/Liều):" : "Số lượng:") 
    : "Số lượng heo hiện tại trong lô (Con):"}
</Text>
 <TextInput 
                  style={{ height: 40, borderWidth: 1, borderColor: '#ced4da', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, marginBottom: 10, fontSize: 13, fontWeight: 'bold', textAlign: 'center' }} 
                  value={soHeoInput} 
                  onChangeText={(txt) => setSoHeoInput(txt.replace(/[^0-9]/g, ''))} 
                  keyboardType="numeric" 
                />

                             {/* 🚀 ĐÃ KHÓA CỨNG POPUP SỐ 2: Biến ô gõ thành khối đọc thông số tĩnh, cấm bẻ vỡ lứa tuổi tuần gốc */}
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#64748b', marginBottom: 4 }}>Lứa tuổi heo hiện trạng (Cố định khóa sửa):</Text>
              <TextInput 
                style={{ height: 40, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, backgroundColor: '#e2e8f0', paddingHorizontal: 10, marginBottom: 10, fontSize: 13, textAlign: 'center', color: '#64748b', fontWeight: 'bold' }} 
                value={tuanTuoiInput} 
                editable={false} // 🚀 KHÓA CHẶT TỐI CAO
              />


                {/* 3. Nhập Ghi Chú */}
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#495057', marginBottom: 4 }}>Ghi chú điều chỉnh:</Text>
                <TextInput 
                  style={{ height: 40, borderWidth: 1, borderColor: '#ced4da', borderRadius: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, marginBottom: 16, fontSize: 12 }} 
                  value={ghiChuInput} 
                  onChangeText={setGhiChuInput} 
                  placeholder="Lý do chỉnh sửa..."
                />

                          {/* 🎯 BẢN VÁ KHÓA CỨNG PHÂN HỆ VẬT TƯ: Ép sửa Cám găm chuẩn đét Cột I, Thuốc găm chuẩn Cột J, đồng bộ chính xác đét hàm setIsSaving viết hoa chống đơ App 100% */}
                <TouchableOpacity 
                  disabled={isSending}
                  style={{ backgroundColor: isSending ? '#95a5a6' : '#28a745', paddingVertical: 11, borderRadius: 8, alignItems: 'center' }}
                  onPress={() => {
                    if (!editingRowId) return Alert.alert("Thông báo", "Không tìm thấy mã ID dòng cần hiệu chỉnh!");
                    
                    const quanSoMoiGo = soHeoInput ? soHeoInput.trim() : "";
                    if (quanSoMoiGo === "" || Number(quanSoMoiGo) < 0) return Alert.alert("Thông báo", "Vui lòng nhập số lượng hợp lệ lớn hơn hoặc bằng 0!");

                    // 🚀 CHẤT LƯỢNG MẠNG: Gọi chuẩn xác hàm Props viết hoa đầu cổng để kích hoạt cờ xoay Đang tải lề đỉnh
                    if (typeof setIsSaving === 'function') {
                      setIsSaving(true);
                    } else if (typeof setIsSending === 'function') {
                      setIsSending(true);
                    }

                    if (typeof setDongBoStatus === 'function') setDongBoStatus("⏳ Đang dồn số liệu hiệu chỉnh lên mây Sheets...");

                    const chuongHienTai = selectedChuongGop?.tenChuong || "1";
                    const khuChuan = selectedChuongGop?.tenKhu || "Cai Sữa";
                    
                    // 🧠 THUẬT TOÁN ĐO NHÃN TĨNH: Đo khớp khít trúng phóc cờ trạng thái đang đứng ở khâu VẬT TƯ (Cám / Thuốc) hay quân số đàn
                    const laLuongSuaVatTu = modalSubTab === "VAO_CAM" || modalSubTab === "TIEM_VACCINE";
                    const laDongCamMoc = modalSubTab === "VAO_CAM"; 
                    
                    let thamSoSoHeo = "0"; let thamSoCam = 0; let thamSoThuoc = 0; let nhanSuKienXo = "NHAP_HEO";
                    // 🛠️ ĐÃ VÁ: chỉ dùng nhãn mặc định khi người dùng KHÔNG gõ ghi chú gì cả, không còn ghi đè ghi chú người dùng đã nhập
                    let chuoiGhiChuMoi = ghiChuInput ? ghiChuInput.trim() : "";

                    // Thực thi đóng gói tham số chốt chặn vật lý đa cột liên thông
                    if (laLuongSuaVatTu) {
                      if (laDongCamMoc) {
                        thamSoCam = Number(quanSoMoiGo); // Ép con số gõ vào cột I cám chằn chặn
                        nhanSuKienXo = "VAO_CAM";
                        thamSoSoHeo = "0";               // Khóa cứng không cho thay đổi cột E quân số heo
                        if (!chuoiGhiChuMoi) chuoiGhiChuMoi = `🌾 Số Cám: ${thamSoCam} Bao cám`;
                      } else {
                        thamSoThuoc = Number(quanSoMoiGo); // Ép con số gõ vào cột J thuốc chằn chặn
                        nhanSuKienXo = "TIEM_VACCINE";
                        thamSoSoHeo = "0";                 // Khóa cứng cột E quân số
                        if (!chuoiGhiChuMoi) chuoiGhiChuMoi = `💊 Tiêm chủng: ${thamSoThuoc} Liều thuốc`;
                      }
                    } else {
                      if (!chuoiGhiChuMoi) chuoiGhiChuMoi = "Hiệu chỉnh số liệu lẻ từ hệ thống";
                      // Nếu khách sửa lịch sử quân số đàn, bốc nhổ giữ nguyên xi nhãn và dấu âm dương đối trừ cũ
                      const mangQuetMoc = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
                      const dongThoGoc = mangQuetMoc.find(x => x && x.id === editingRowId) || {};
                      const laDongAmXuat = Number(dongThoGoc.soCon) < 0;
                      
                      thamSoSoHeo = laDongAmXuat ? `-${quanSoMoiGo}` : quanSoMoiGo;
                      nhanSuKienXo = dongThoGoc.suKienHeoThit || (laDongAmXuat ? "BAN_HEO" : "NHAP_HEO");
                      thamSoCam = 0; thamSoThuoc = 0; // Khóa chết 2 cột vật tư về 0
                    }

                    // 🚀 GHI ĐÈ THẲNG LÊN FIRESTORE theo ID dòng; Cloud Function tự cập nhật dòng tương ứng trên Sheet
                    suaDong(editingRowId, {
                      tenKhu: khuChuan, tenChuong: chuongHienTai,
                      soCon: Number(thamSoSoHeo) || 0, soBaoCam: Number(thamSoCam) || 0, soLieuVaccine: Number(thamSoThuoc) || 0,
                      suKienHeoThit: nhanSuKienXo, ghiChu: chuoiGhiChuMoi, ngayNhapChuong: ngayNhapInput
                    })
                    .then(() => {
                      {
                        // ✅ Firestore đã nhận lệnh ghi
                        // 🛠️ ĐÃ VÁ CHỐNG ĐƠ: KHÔNG đóng đồng thời 2 Modal lồng nhau rồi mới gọi Alert (đây là nguyên nhân treo máy khi bấm OK).
                        // Chỉ đóng Modal con (sửa) ngay, cập nhật dữ liệu, rồi mới hiện Alert; Modal cha chỉ đóng SAU khi người dùng bấm OK.
                        setIsSaving(false);
                        setIsEditModalVisible(false);
                        setEditingRowId(null);

                        if (typeof setDongBoStatus === 'function') setDongBoStatus("✅ Đồng bộ thành công!");

                        // CẬP NHẬT GĂM CỨNG RAM ĐỊA PHƯƠNG CHẰN CHẶN KHÔNG LỆCH CỘT CỦA SẢNH NUÔI
                        if (typeof setDanhSachChuongThit === 'function') {
                          setDanhSachChuongThit(prev => (Array.isArray(prev) ? prev : []).map(c => {
                            if (!c || !c.id) return c;
                            return c.id === editingRowId ? { ...c, soCon: Number(thamSoSoHeo), soBaoCam: thamSoCam, soLieuVaccine: thamSoThuoc, suKienHeoThit: nhanSuKienXo, ghiChu: chuoiGhiChuMoi, ngayNhapChuong: ngayNhapInput } : c;
                          }));
                        }

                        setSoHeoInput(""); setTuanTuoiInput(""); setGhiChuInput("");

                        // 🚀 Đợi Modal con đóng animation xong (tránh 2 Modal lồng nhau + Alert chen cùng lúc) rồi mới hiện thông báo
                        setTimeout(() => {
                          Alert.alert(
                            "Thành công 🎉",
    
                            [{ text: "OK", onPress: () => { setIsActionModalVisible(false); setSelectedChuongGop(null); } }]
                          );
                        }, 300);
                      }
                    }).catch(() => { 
                      if (typeof setIsSaving === 'function') setIsSaving(false);
                      if (typeof setIsSending === 'function') setIsSending(false);
                      setIsEditModalVisible(false); 
                      Alert.alert("Lỗi mạng", "Đường truyền lán nuôi nghẽn mạng."); 
                    });
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>💾 XÁC NHẬN CẬP NHẬT</Text>
                </TouchableOpacity>


             </View>
            </KeyboardAvoidingView>
          </Modal>
          {/* 🚀 ĐÃ VÁ TÁCH BIỆT: Chiếc thẻ đóng trên đã sập màn bọc Popup số 2 xuống độc lập hoàn toàn kịch lề! */}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </Modal>
  {/* 🚀 ĐÃ VÁ TÁCH BIỆT: Chiếc thẻ đóng trên sập sảnh sảnh Popup Modal mẹ chính xuống ngăn nắp kịch vách! */}

                 <View style={{ marginTop: 25, paddingTop: 15, borderTopWidth: 1.5, borderTopColor: '#e2e8f0', paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 13, color: '#1e293b', fontWeight: '900', marginBottom: 10, letterSpacing: 0.3 }}>
              📜 NHẬT KÝ TOÀN BỘ Ô CHUỒNG
            </Text>

            {/* 2 NÚT CHỌN LOẠI NHẬT KÝ: bấm nút nào thì hiện nhật ký đó */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTabNhatKyToanTrai("QUAN_SO")}
                style={{ flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: tabNhatKyToanTrai === "QUAN_SO" ? '#2563eb' : '#e2e8f0', backgroundColor: tabNhatKyToanTrai === "QUAN_SO" ? '#dbeafe' : '#f8fafc' }}
              >
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: tabNhatKyToanTrai === "QUAN_SO" ? '#1d4ed8' : '#64748b' }}>🐖 Biến động Số Heo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTabNhatKyToanTrai("CAM")}
                style={{ flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: tabNhatKyToanTrai === "CAM" ? '#e65100' : '#e2e8f0', backgroundColor: tabNhatKyToanTrai === "CAM" ? '#fff0e6' : '#f8fafc' }}
              >
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: tabNhatKyToanTrai === "CAM" ? '#e65100' : '#64748b' }}>🌾 Biến động cám</Text>
              </TouchableOpacity>
            </View>

            {/* ===== NHẬT KÝ 1: BIẾN ĐỘNG QUÂN SỐ TOÀN BỘ Ô CHUỒNG ===== */}
            {tabNhatKyToanTrai === "QUAN_SO" && (() => {
              const mangGocTho = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];

              // Bộ lọc: Chỉ nhặt dòng quân số thực tế (khác 0), bỏ qua các dòng vật tư Cám/Thuốc hoặc dòng khởi tạo ô trống
              const nhatKyOChuong = mangGocTho.filter(log => 
                log && 
                Number(log.soCon) !== 0 && 
                log.suKienHeoThit !== "VAO_CAM" && 
                log.suKienHeoThit !== "TIEM_VACCINE" && 
                log.suKienHeoThit !== "TAO_CHUONG" &&
                log.suKienHeoThit !== "DON_CHUONG"
              );

              if (nhatKyOChuong.length === 0) { 
                return (
                  <View style={{ paddingVertical: 25, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Text style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>
                      Chưa có lịch sử biến động quân số nào ở các ô chuồng.
                    </Text>
                  </View>
                ); 
              }
              
              // Sắp xếp chứng từ theo ID thời gian, dòng mới nhất nhảy lên đầu sảnh
              nhatKyOChuong.sort((x, y) => (y.id || "").toString().localeCompare((x.id || "").toString()));

              return nhatKyOChuong.map((log, lIdx) => {
                const laSoAm = Number(log.soCon) < 0;
                const hienThiSoCon = laSoAm ? `${log.soCon}` : `+${log.soCon}`;
                
                // Cấu hình nhãn danh mục tự động theo mã sự kiện găm trên cột K
                let txtHienBadge = "BIẾN ĐỘNG";
                let mChu = '#2563eb', mNen = '#dbeafe'; // Mặc định xanh dương
                
                if (log.suKienHeoThit === "HAO_HUT" || log.ghiChu?.includes("HAO HỤT")) {
                  mChu = '#dc2626'; mNen = '#fee2e2'; txtHienBadge = "HAO HỤT";
                } else if (log.suKienHeoThit === "BAN_HEO" || log.ghiChu?.includes("XUẤT BÁN")) {
                  mChu = '#16a34a'; mNen = '#dcfce7'; txtHienBadge = "BÁN HEO";
                } else if (log.suKienHeoThit === "NHAP_HEO") {
                  mChu = '#2563eb'; mNen = '#dbeafe'; txtHienBadge = "NHẬP Ô";
                } else if (log.ghiChu?.includes("🚚")) {
                  mChu = '#4f46e5'; mNen = '#e0e7ff'; txtHienBadge = "LUÂN CHUYỂN";
                }

                return (
                  <View 
                    key={`farm_map_overall_history_${log.id || lIdx}`} 
                    style={{ 
                      flexDirection: 'column',
                      padding: 12,
                      backgroundColor: '#ffffff',
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                      borderRadius: 12,
                      marginBottom: 8,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.02,
                      shadowRadius: 2,
                      elevation: 0.5
                    }}
                  >
                    {/* Hàng 1: Badge + Tên Ô chuồng phát sinh + Số lượng heo theo tuần */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ backgroundColor: mNen, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: mChu }}>{txtHienBadge}</Text>
                        </View>
                        <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#1e293b' }}>
                          {`${log.tenKhu} - Ô ${log.tenChuong}`}
                        </Text>
                      </View>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: laSoAm ? '#dc2626' : '#16a34a' }}>
                          {hienThiSoCon} con
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#b45309', backgroundColor: '#fef3c7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                          {`${log.tuanTuoi} Tuần`}
                        </Text>
                      </View>
                    </View>

                    {/* Hàng 2: Ghi chú chi tiết từ công nhân gõ + Ngày tháng chứng từ */}
                    <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#f1f3f5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ fontSize: 11, color: '#475569', flex: 1, paddingRight: 8 }}>
                        {log.ghiChu ? `${log.ghiChu}` : "Không có ghi chú phụ"}
                      </Text>
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#64748b' }}>
                        {log.ngayNhapChuong}
                      </Text>
                    </View>
                  </View>
                );
              });
            })()}

            {/* ===== NHẬT KÝ 2: BIẾN ĐỘNG CÁM TOÀN BỘ Ô CHUỒNG ===== */}
            {tabNhatKyToanTrai === "CAM" && (() => {
              const mangGocTho = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];

              // Bộ lọc: chỉ nhặt các dòng nhập cám (nhãn VAO_CAM) của mọi ô chuồng
              const nhatKyCam = mangGocTho.filter(log => log && log.suKienHeoThit === "VAO_CAM");

              if (nhatKyCam.length === 0) {
                return (
                  <View style={{ paddingVertical: 25, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Text style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>
                      Chưa có lần nhập cám nào ở các ô chuồng.
                    </Text>
                  </View>
                );
              }

              // Dòng mới nhất nhảy lên đầu
              nhatKyCam.sort((x, y) => (y.id || "").toString().localeCompare((x.id || "").toString()));
              const tongBaoCamToanTrai = nhatKyCam.reduce((tong, log) => tong + (Number(log.soBaoCam) || 0), 0);
              const cacDongHienThi = nhatKyCam.slice(0, soDongNhatKyCam);

              return (
                <View>
                  {/* Tổng cám toàn bộ các ô chuồng */}
                  <View style={{ backgroundColor: '#fff8e6', borderWidth: 1, borderColor: '#ffe0b2', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#e65100' }}>Tổng cám đã nhập toàn bộ ô chuồng</Text>
                      <Text style={{ fontSize: 10, color: '#8a6d3b', marginTop: 2 }}>{nhatKyCam.length} lần nhập cám</Text>
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#e65100' }}>{tongBaoCamToanTrai} bao</Text>
                  </View>

                  {cacDongHienThi.map((log, lIdx) => (
                    <View
                      key={`farm_map_overall_cam_${log.id || lIdx}`}
                      style={{ flexDirection: 'column', padding: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, marginBottom: 8 }}
                    >
                      {/* Hàng 1: Badge + Tên Ô chuồng + Số bao cám */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={{ backgroundColor: '#ffedd5', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#c2410c' }}>NHẬP CÁM</Text>
                          </View>
                          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#1e293b' }}>
                            {`${log.tenKhu} - Ô ${log.tenChuong}`}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: '#e65100' }}>
                          +{Number(log.soBaoCam) || 0} bao
                        </Text>
                      </View>

                      {/* Hàng 2: Tên cám / ghi chú + Ngày nhập */}
                      <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#f1f3f5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 11, color: '#475569', flex: 1, paddingRight: 8 }}>
                          {log.ghiChu ? `📝 ${log.ghiChu}` : "📝 Không có ghi chú phụ"}
                        </Text>
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#64748b' }}>
                          📅 {log.ngayNhapChuong}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {/* Nút xem thêm khi còn nhiều dòng */}
                  {nhatKyCam.length > soDongNhatKyCam && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setSoDongNhatKyCam(soDongNhatKyCam + 30)}
                      style={{ paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: '#ffe0b2', backgroundColor: '#fffaf0', alignItems: 'center', marginTop: 2 }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#e65100' }}>
                        ⬇️ Xem thêm 30 dòng (còn {nhatKyCam.length - soDongNhatKyCam} dòng)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}
          </View>


        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default FarmMapSubTab;