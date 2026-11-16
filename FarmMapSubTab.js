import React, { useState, useRef, useEffect } from 'react';
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
  Platform,
  Animated,
  Easing
} from 'react-native';
import { parseToDateObject, formatVNDate } from './DateUtils';
import FarmLogSubForm from './FarmLogSubForm';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import ChonNgay from './ChonNgay'; // 📅 chọn ngày dạng cửa sổ, giống lúc chọn ngày Phối
import OKg, { docKg, hienKg } from './OKg'; // ⚖️ tổng kg khi bán / nhập heo mua ngoài
import { ghiDongMoi, ghiNhieuDong, suaDong, xoaDong, layDongCuaChuong, xoaNhieuDong, taoMaLuanChuyen } from './chuongThitService';
import OChoXepChuong from './ChoXepChuong';
const SK_DOI_CHIEU = 'DOI_CHIEU'; // (dòng đối chiếu cũ, nếu có, được ẩn khỏi lịch sử)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSoDoChuong, BanDoTrai, ModalSapXepSoDo, coSoDoTrai, KHOA_TOAN_TRAI, soDoMacDinh } from './SoDoChuong'; // 🗺 sơ đồ ô chuồng như ngoài trại (tùy chọn)
import NutSuaXoaNhatKy, { timDongCap } from './NutSuaXoaNhatKy'; // ✏️🗑 Sửa / xóa ở nhật ký toàn bộ ô chuồng // 📦 Heo cai sữa chờ xếp vào ô chuồng
import { BoLocThoiGian, BO_LOC_MAC_DINH, locTheoThoiGian } from './BoLocThoiGian'; // 📅 Lọc nhật ký theo tuần/tháng/năm
import { NhanNguoiNhap, chanNeuKhongDuQuyen, laChuTrai, duocThem, duocSuaXoa } from './nguoiNhap';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // icon nét mảnh cho 4 nút chính ô chuồng
const HIEN_ICON_NUT_CHUONG = true; // đổi thành false nếu muốn quay lại nút chỉ có chữ // ✍️ Hiện "Nhập bởi" + 🔐 quyền

const { width } = Dimensions.get('window');

// 🍏 iPhone: Alert bật đúng lúc cửa sổ (Modal) đang đóng sẽ bị kẹt sau màn hình -> app như bị treo.
// Đợi cửa sổ đóng xong (~0,65 giây) rồi mới báo thành công.
const baoSauKhiDong = (tieuDe, noiDung) => setTimeout(() => Alert.alert(tieuDe, noiDung), 650);

const FarmMapSubTab = ({ 
  danhSachChuongThit, 
  setDanhSachChuongThit, 
  WEB_APP_URL, 
  userEmail,
  setDongBoStatus,
  cauHinhVacXinLoc,
  choXepTheoTuoi, // 📦 Chờ xếp chuồng: heo trong báo cáo chưa xếp vào ô chuồng
  lichSuBanCu, // 📜 dòng Nhập đàn / Bán / Hao hụt ghi theo cách cũ: hiện chung trong nhật ký toàn bộ ô chuồng
  onSuaBanCu, onXoaBanCu, // sửa / xóa dòng cũ bằng đúng cửa sổ cũ của app
  yeuCauMoChuong, // 📍 { tenKhu, tenChuong, lan } — màn hình ngoài nhờ mở 1 ô (tenKhu 'CHO_XEP' = ô chờ xếp)
}) => {
  const [moChoXep, setMoChoXep] = useState(false);
  const [tuoiChoXepChon, setTuoiChoXepChon] = useState(null); // 📍 mở từ ô tuần ở báo cáo -> chọn sẵn tuần đó // 📦 cửa sổ ô Chờ xếp chuồng
  const soDoChuong = useSoDoChuong(); // 🗺 sơ đồ đã sắp xếp của trại (khu nào chưa có thì hiện danh sách)
  const [moSapXepSoDo, setMoSapXepSoDo] = useState(false); // cửa sổ sắp xếp sơ đồ trại (chủ trại)
  // Sơ đồ / danh sách: thu gọn sẵn, nhớ lựa chọn của khách trên máy này
  const [moXemSoDo, setMoXemSoDo] = useState(false);
  const [popupXem, setPopupXem] = useState(null); // 🗺 cửa sổ sơ đồ trại: 'SO_DO' | null
  const moPopupSoDo = popupXem !== null;
  const setMoPopupSoDo = (mo) => { if (!mo) setPopupXem(null); };
  const quayLaiSoDo = useRef(null); // chạm ô từ sơ đồ / danh sách -> đóng ô thì quay lại đúng cửa sổ đó
  const [dongNhanhSoDo, setDongNhanhSoDo] = useState(false); // tắt hiệu ứng khi chuyển sang ô cho nhanh
  const truotSoDo = useRef(new Animated.Value(0)).current; // 0 = ẩn dưới đáy, 1 = hiện
  useEffect(() => {
    if (!moPopupSoDo) return;
    truotSoDo.setValue(0);
    Animated.timing(truotSoDo, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [popupXem]);
  const [moXemDanhSach, setMoXemDanhSach] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('PIGVN_CACH_XEM_O_CHUONG').then((v) => {
      if (!v) return;
      try { const o = JSON.parse(v); setMoXemSoDo(!!o.soDo); setMoXemDanhSach(!!o.danhSach); } catch (e) {}
    }).catch(() => {});
  }, []);
  const doiCachXem = (loai) => {
    const moi = { soDo: loai === 'soDo' ? !moXemSoDo : moXemSoDo, danhSach: loai === 'danhSach' ? !moXemDanhSach : moXemDanhSach };
    setMoXemSoDo(moi.soDo); setMoXemDanhSach(moi.danhSach);
    AsyncStorage.setItem('PIGVN_CACH_XEM_O_CHUONG', JSON.stringify(moi)).catch(() => {});
  };
  // --- STATE DIEU KHIEN POPUP MODAL HANH DONG TAI CHUONG ---
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const [selectedChuongGop, setSelectedChuongGop] = useState(null); 
  const [modalSubTab, setModalSubTab] = useState("AN_FORM"); 
  const cuonModalRef = useRef(null); // cuộn tới form khi bấm nút thao tác
  const [dongLichSuMo, setDongLichSuMo] = useState(null); // id dòng lịch sử heo đang mở xem ghi chú / sửa / xóa
  const [tabNhatKyToanTrai, setTabNhatKyToanTrai] = useState("QUAN_SO");
  const [locLoaiNhatKy, setLocLoaiNhatKy] = useState(null); // bấm ô Nhập / Bán / Hao hụt để chỉ xem loại đó (null = tất cả)
  const [boLocNhatKy, setBoLocNhatKy] = useState(BO_LOC_MAC_DINH); // 📅 Mặc định: tháng hiện tại
const [soDongNhatKyCam, setSoDongNhatKyCam] = useState(15);
  const [soDongNhatKyHeo, setSoDongNhatKyHeo] = useState(15); // 📜 nhật ký số heo: hiện 15 dòng, bấm "Xem thêm" để xem tiếp
  // Đổi bộ lọc / loại thì quay về 15 dòng đầu
  useEffect(() => { setSoDongNhatKyHeo(15); setSoDongNhatKyCam(15); }, [boLocNhatKy, locLoaiNhatKy, tabNhatKyToanTrai]);
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
  const [tongKgInput, setTongKgInput] = useState(''); // ⚖️ tổng kg (không bắt buộc)
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
  // 📦 Nhập heo: nguồn heo. 'CHO_XEP' = heo cai sữa của trại (lấy từ Ô heo chưa sắp xếp chuồng, báo cáo không đổi)
  //                         'MUA'     = heo mua / nhập từ ngoài trại (cộng vào báo cáo)
  const [nguonNhapHeo, setNguonNhapHeo] = useState('MUA');
  const tongChoXep = (Array.isArray(choXepTheoTuoi) ? choXepTheoTuoi : []).reduce((a, b) => a + (Number(b.soCon) || 0), 0);
  // 📜 Dòng bản cũ -> dạng dòng nhật ký (Nhập đàn: +, Bán / Hao hụt: −), nằm ở "Chờ xếp chuồng"
  const dongBanCuThanhNhatKy = (e) => {
    const sk = String(e.suKien || '').trim().toUpperCase();
    const so = Number(String(e.soHeo ?? '').replace(/[^\d.]/g, '')) || 0;
    const loai = sk === 'NHẬP ĐÀN' ? 'NHAP_HEO' : sk === 'BÁN' ? 'BAN_HEO' : 'HAO_HUT';
    return {
      ...e, _goc: e, banCu: true, id: `BC_${e.id}`,
      tenKhu: 'CHO_XEP', tenChuong: 'Ô heo chưa sắp xếp chuồng',
      soCon: loai === 'NHAP_HEO' ? so : -so,
      tuanTuoi: parseInt(String(e.tuanBan ?? '').replace(/\D/g, ''), 10) || 0,
      ngayNhapChuong: String(e.ngay || '').trim().substring(0, 10),
      suKienHeoThit: loai, ghiChu: e.ghiChu || '',
    };
  };
  const xoaDongBanCu = (log) => {
    const goc = log._goc;
    const tuanNay = log.tuanTuoi ? Math.min(30, tinhTuoiTinhTienThuHai(log.tuanTuoi, log.ngayNhapChuong)) : null;
    const soCon = Math.abs(Number(log.soCon) || 0);
    Alert.alert('Xóa dòng này?',
      `Dòng này đang được tính vào số heo theo tuần tuổi.` + (tuanNay ? `\n\nXóa đi, số heo ${tuanNay} tuần sẽ ${Number(log.soCon) > 0 ? 'GIẢM' : 'TĂNG'} ${soCon} con.` : '') + `\n\nBạn có chắc muốn xóa?`,
      [{ text: 'Hủy', style: 'cancel' }, { text: 'Xóa', style: 'destructive', onPress: () => { if (typeof onXoaBanCu === 'function') onXoaBanCu(goc); } }]);
  };

  // 📋 VẼ 1 DÒNG NHẬT KÝ GỌN: vạch màu + tên loại + (ngày · tuần · người) + số bên phải; chạm để xem ghi chú, sửa, xóa
  const tenNguoiNhapGon = (log) => (log && log.nguoiNhap ? (log.nguoiNhap === 'CHU' ? 'Chủ trại' : (log.tenNguoiNhap ? `${log.nguoiNhap} – ${log.tenNguoiNhap}` : log.nguoiNhap)) : '');
  const tenOGon = (log) => (log.tenKhu === 'CHO_XEP' ? 'Ô heo chưa sắp xếp chuồng' : `${log.tenKhu} - Ô ${log.tenChuong}`);
  const msNgayNhatKy = (log) => { const d = parseToDateObject(log.ngayNhapChuong); return d ? d.getTime() : 0; };
  const sapXepMoiNhat = (mang) => mang.sort((x, y) => (msNgayNhatKy(y) - msNgayNhatKy(x)) || String(y.id || '').localeCompare(String(x.id || '')));
  const veDanhSachNhatKyGon = (mang, moTa, loaiSuaXoa, tienTo) => {
    let thangTruoc = '';
    return mang.map((log, lIdx) => {
      const m = moTa(log);
      const ngay = String(log.ngayNhapChuong || '');
      const thang = ngay.split('/').slice(1).join('/');
      const hienThang = thang && thang !== thangTruoc;
      thangTruoc = thang;
      const khoa = `${tienTo}_${log.id || lIdx}`;
      const dangMo = dongLichSuMo === khoa;
      const nguoi = tenNguoiNhapGon(log);
      return (
        <View key={khoa}>
          {hienThang && (
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#8a929a', marginTop: lIdx === 0 ? 2 : 12, marginBottom: 4 }}>Tháng {thang}</Text>
          )}
          <TouchableOpacity activeOpacity={0.6} onPress={() => setDongLichSuMo(dangMo ? null : khoa)}
            style={{ paddingVertical: 9, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f1f3f5', backgroundColor: dangMo ? '#f8f9fa' : 'transparent' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: m.mau, marginRight: 9 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: '#1a1f23' }} numberOfLines={1}>
                  <Text style={{ fontWeight: 'bold' }}>{m.ten}</Text>{m.noi ? <Text style={{ color: '#495057' }}>{`  ·  ${m.noi}`}</Text> : null}
                </Text>
                <Text style={{ fontSize: 11, color: '#8a929a', marginTop: 1 }} numberOfLines={1}>
                  {[ngay, m.phu, nguoi].filter(Boolean).join('  ·  ')}
                </Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '900', color: m.mauSo || m.mau, marginLeft: 8 }}>{m.so}</Text>
            </View>
            {dangMo && (
              <View style={{ marginTop: 6, marginLeft: 12 }}>
                <Text style={{ fontSize: 11.5, color: '#495057', lineHeight: 16 }}>{log.ghiChu ? log.ghiChu : 'Không có ghi chú'}</Text>
                <NhanNguoiNhap item={log} nhan="Người tạo" style={{ fontSize: 10.5 }} />
                {log.banCu ? (
                  duocSuaXoa(log._goc) && (
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
                      <TouchableOpacity onPress={() => { if (typeof onSuaBanCu === 'function') onSuaBanCu(log._goc); }} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, backgroundColor: '#fff8e1', borderWidth: 1, borderColor: '#ffe082' }}>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#b58100' }}>✏️ Sửa</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => xoaDongBanCu(log)} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca' }}>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#dc3545' }}>🗑 Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  )
                ) : (
                  <NutSuaXoaNhatKy log={log} loai={loaiSuaXoa} danhSachChuongThit={danhSachChuongThit} setDanhSachChuongThit={setDanhSachChuongThit} setDongBoStatus={setDongBoStatus} />
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>
      );
    });
  };

  
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
    if (chanNeuKhongDuQuyen('them')) return; // 🔐
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
      Alert.alert("Đã tạo ô chuồng", `Ô ${maChuongMoiInput.trim()} · Khu ${khuChuan}`);
      if (typeof setDanhSachChuongThit === 'function') { setDanhSachChuongThit(prev => [...(Array.isArray(prev) ? prev : []), chuongTrongLocal]); }
      setMaChuongMoiInput(""); setGhiChuMoiInput(""); setIsCreateFormOpen(false);
    }).catch(() => {
      setIsCreatingRoom(false);
      Alert.alert("Thông báo", "Không thể khởi tạo chuồng, vui lòng kiểm tra mạng và bấm lại!");
    });
  };
  // 📡 LENH MANG 2: NAP MOI / SUA DE BAY LE QUA ID (GHI THANG FIRESTORE LEDGER)
  const handleXacNhanGhiChuongMoi = (soHeoTruyenTrucTiep, ghiChuTruyenTrucTiep) => {
    if (editingRowId ? chanNeuKhongDuQuyen('sua', (Array.isArray(danhSachChuongThit) ? danhSachChuongThit : []).find(x => x && x.id === editingRowId)) : chanNeuKhongDuQuyen('them')) return; // 🔐
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
      : ghiDongMoi({ userEmail, ...phanDuLieu, tuanTuoi: Number(tuanTuoiInput || 4), soBaoCam: 0, soLieuVaccine: 0, suKienHeoThit: "NHAP_HEO", tinhBaoCao: true }); // 📊 heo nhập từ ngoài -> cộng báo cáo

    tacVuGhi.then(dongMoiDaGhi => {
      setIsSaving(false);
      if (typeof setDongBoStatus === 'function') setDongBoStatus("✅ Đã cập nhật chuồng trại!");
      baoSauKhiDong("Thành công 🎉");

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
    if (chanNeuKhongDuQuyen('them')) return; // 🔐
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
    if (chanNeuKhongDuQuyen('them')) return; // 🔐
    setIsSaving(true);
    if (typeof setDongBoStatus === 'function') setDongBoStatus("⏳ Đang lùa lợn...");

    ghiNhieuDong([dongTruGui, dongCongGui])
    .then(cacDongDaGhi => {
      setIsSaving(false);
      baoSauKhiDong("Thành công 🚚", `Đã luân chuyển ${soConChuyenGui} heo sang Ô ${chuongDichInput.trim()} Khu ${khuDichInput}.`);

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
    if (chanNeuKhongDuQuyen('chuTrai')) return; // 🔐 Chỉ chủ trại xóa ô chuồng
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
    if (chanNeuKhongDuQuyen('chuTrai')) return; // 🔐 Chỉ chủ trại xóa toàn bộ lịch sử
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
      baoSauKhiDong("Thành công 🧹", thongBaoGiaoDien);
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
      if (item.tenKhu === "CHO_XEP") return; // 📦 Chờ xếp chuồng hiển thị ở khung riêng, không phải ô chuồng thật
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
  // Mở cửa sổ thao tác của 1 ô chuồng (dùng cho danh sách, sơ đồ và yêu cầu từ ngoài)
  const moOChuong = (chuong) => {
    if (!chuong) return;
    setSelectedChuongGop(chuong); setTenKhuInput(chuong.tenKhu); setEditingRowId(null);
    setNgayNhapInput(formatVNDate(new Date())); setIsCalendarOpen(false); setModalSubTab("AN_FORM");
    setIsActionModalVisible(true);
  };

  useEffect(() => {
    if (!isActionModalVisible && quayLaiSoDo.current) { const kieu = quayLaiSoDo.current; quayLaiSoDo.current = null; setPopupXem(kieu); }
  }, [isActionModalVisible]);
  const chamOTuSoDo = (chuong) => chamOTuPopup(chuong, 'SO_DO');
  const chamOTuPopup = (chuong, kieu) => {
    quayLaiSoDo.current = kieu;
    setDongNhanhSoDo(true); setMoPopupSoDo(false);
    setTimeout(() => { setDongNhanhSoDo(false); moOChuong(chuong); }, Platform.OS === 'ios' ? 120 : 30);
  };

  // 🔄 Ô chuồng đang mở luôn lấy số MỚI NHẤT: mỗi lần sổ cái đổi (xóa / sửa / thêm dòng) thì thay bản chụp cũ
  // bằng bản vừa tính lại, để tổng số con và các bầy tuần tuổi trong cửa sổ không bị đứng ở số lúc mới mở.
  useEffect(() => {
    if (!selectedChuongGop) return;
    const khu = danhSachPhanKhuHienThi.find((k) => k.tenKhu === selectedChuongGop.tenKhu);
    const moi = khu ? khu.danhSachChuongCuaKhu.find((c) => String(c.tenChuong) === String(selectedChuongGop.tenChuong)) : null;
    if (moi) { if (moi !== selectedChuongGop) setSelectedChuongGop(moi); }
    else if (Number(selectedChuongGop.tongSoCon) !== 0 || (selectedChuongGop.cacBayNho || []).length) setSelectedChuongGop({ ...selectedChuongGop, tongSoCon: 0, cacBayNho: [], mangTuanTuoi: [] });
  }, [danhSachPhanKhuHienThi]);

  // 📍 Màn hình ngoài (chạm 1 tuần tuổi -> chạm tên ô) nhờ mở đúng ô chuồng
  useEffect(() => {
    if (!yeuCauMoChuong || !yeuCauMoChuong.lan) return;
    if (yeuCauMoChuong.tenKhu === 'CHO_XEP') { setTuoiChoXepChon(yeuCauMoChuong.tuoi || null); setMoChoXep(true); return; }
    const khu = danhSachPhanKhuHienThi.find((k) => k.tenKhu === yeuCauMoChuong.tenKhu);
    const chuong = khu ? khu.danhSachChuongCuaKhu.find((c) => String(c.tenChuong) === String(yeuCauMoChuong.tenChuong)) : null;
    if (!chuong) return;
    setSelectedChuongGop(chuong); setTenKhuInput(chuong.tenKhu); setEditingRowId(null);
    setNgayNhapInput(formatVNDate(new Date())); setIsCalendarOpen(false); setModalSubTab("AN_FORM");
    setIsActionModalVisible(true);
  }, [yeuCauMoChuong && yeuCauMoChuong.lan]);

  return (
   <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: '#ffffff' }}>     
    <ScrollView style={{ flex: 1, marginTop: 8 }} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, paddingHorizontal: 2 }}>
          
          {/* ========================================== */}
          {/* Ô CHUỒNG: nơi duy nhất để Nhập / Bán / Hao hụt / Luân chuyển */}
          {/* ========================================== */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, paddingLeft: 2 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#1a1f23' }}>Ô CHUỒNG</Text>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              {duocThem() && (
                <TouchableOpacity onPress={() => { setMaChuongMoiInput(""); setIsCreateFormOpen(true); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#137333' }}>+ Tạo ô chuồng</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={{ fontSize: 11, color: '#8a929a', marginBottom: 10, paddingLeft: 2 }}>Bấm vào ô để Nhập heo / Bán heo / Hao hụt / Luân chuyển</Text>
          {/* ========================================== */}
          {/* ➕ POPUP TẠO Ô CHUỒNG MỚI */}
          {/* ========================================== */}
          {(() => {
            const laKhuCaiSua = tenKhuMoiInput === "Cai Sữa";
            const mau = laKhuCaiSua ? '#e65100' : '#0056b3';
            const nen = laKhuCaiSua ? '#fff3e0' : '#e7f1ff';
            const khuDangChon = danhSachPhanKhuHienThi.find((k) => k.tenKhu === tenKhuMoiInput);
            const oDaCo = khuDangChon ? khuDangChon.danhSachChuongCuaKhu.map((c) => String(c.tenChuong)) : [];
            const tenMoi = maChuongMoiInput.trim();
            const biTrung = tenMoi !== '' && oDaCo.some((t) => t.toLowerCase() === tenMoi.toLowerCase());
            // Gợi ý số ô kế tiếp: lớn nhất trong các ô đặt tên bằng số + 1
            const cacSo = oDaCo.filter((t) => /^\d+$/.test(t)).map((t) => parseInt(t, 10));
            const goiY = String((cacSo.length ? Math.max(...cacSo) : 0) + 1);
            const dong = () => { if (!isCreatingRoom) { setIsCreateFormOpen(false); setMaChuongMoiInput(""); } };
            return (
              <Modal visible={isCreateFormOpen} transparent animationType="fade" onRequestClose={dong}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                  <TouchableOpacity activeOpacity={1} onPress={dong} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 18 }}>
                    <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 16 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <Text style={{ fontSize: 17, fontWeight: '900', color: '#1a1f23' }}>Tạo ô chuồng mới</Text>
                        <TouchableOpacity onPress={dong} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <Text style={{ fontSize: 18, color: '#8a929a', fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Bước 1: chọn khu */}
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#495057', marginBottom: 6 }}>1. Ô này thuộc khu nào?</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                        {[{ ten: 'Cai Sữa', mau: '#e65100', nen: '#fff3e0' }, { ten: 'Chuồng Thịt', mau: '#0056b3', nen: '#e7f1ff' }].map((k) => {
                          const chon = tenKhuMoiInput === k.ten;
                          const soO = ((danhSachPhanKhuHienThi.find((x) => x.tenKhu === k.ten) || {}).danhSachChuongCuaKhu || []).length;
                          return (
                            <TouchableOpacity key={k.ten} activeOpacity={0.7} onPress={() => setTenKhuMoiInput(k.ten)}
                              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: chon ? k.nen : '#f8f9fa', borderWidth: chon ? 2 : 1, borderColor: chon ? k.mau : '#dee2e6' }}>
                              <Text style={{ fontSize: 13.5, fontWeight: '900', color: chon ? k.mau : '#495057' }}>{k.ten}</Text>
                              <Text style={{ fontSize: 10.5, color: '#8a929a', marginTop: 2 }}>Đang có {soO} ô</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Bước 2: tên / số ô */}
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#495057', marginBottom: 6 }}>2. Tên hoặc số của ô</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: mau }}>Ô</Text>
                        <TextInput value={maChuongMoiInput} onChangeText={setMaChuongMoiInput} editable={!isCreatingRoom}
                          placeholder={`VD: ${goiY}`} placeholderTextColor="#adb5bd" autoFocus
                          style={{ flex: 1, height: 46, borderWidth: 1.5, borderColor: biTrung ? '#dc3545' : (tenMoi ? mau : '#ced4da'), borderRadius: 10, paddingHorizontal: 12, fontSize: 16, fontWeight: '900', color: '#111111', backgroundColor: '#ffffff' }} />
                      </View>
                      {biTrung ? (
                        <Text style={{ fontSize: 11.5, color: '#dc3545', marginTop: 5 }}>Khu {tenKhuMoiInput} đã có Ô {tenMoi}. Hãy đặt tên khác.</Text>
                      ) : (
                        <TouchableOpacity onPress={() => setMaChuongMoiInput(goiY)} style={{ alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: nen }}>
                          <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: mau }}>Gợi ý: Ô {goiY}</Text>
                        </TouchableOpacity>
                      )}
                      {oDaCo.length > 0 && (
                        <Text style={{ fontSize: 10.5, color: '#8a929a', marginTop: 8 }} numberOfLines={2}>Đã có: {oDaCo.map((t) => `Ô ${t}`).join(', ')}</Text>
                      )}

                      {/* Xem trước ô sẽ tạo */}
                      {tenMoi !== '' && !biTrung && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 10, borderRadius: 12, backgroundColor: '#f8f9fa' }}>
                          <View style={{ width: 70, minHeight: 62, borderRadius: 8, borderWidth: 1.5, borderColor: '#dee2e6', backgroundColor: '#f1f3f5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: mau }} />
                            <Text style={{ fontSize: 10, color: '#8a929a', fontWeight: 'bold' }} numberOfLines={1}>Ô {tenMoi}</Text>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#adb5bd', marginTop: 2 }}>Trống</Text>
                          </View>
                          <Text style={{ flex: 1, fontSize: 12, color: '#495057' }}>Ô mới sẽ trống, nằm trong khu {tenKhuMoiInput}. Sau đó bấm vào ô để nhập heo.</Text>
                        </View>
                      )}

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                        <TouchableOpacity onPress={dong} disabled={isCreatingRoom} style={{ flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center', backgroundColor: '#f1f3f5' }}>
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#495057' }}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleTaoChuongMoiTinh} disabled={isCreatingRoom || biTrung || tenMoi === ''}
                          style={{ flex: 1.4, paddingVertical: 13, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: (biTrung || tenMoi === '') ? '#ced4da' : mau }}>
                          {isCreatingRoom && <ActivityIndicator size="small" color="#ffffff" />}
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>TẠO Ô</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </KeyboardAvoidingView>
              </Modal>
            );
          })()}

          {/* 📦 Ô CHỜ XẾP CHUỒNG: heo cai sữa tự vào đây */}
          {(() => {
            const dsCho = Array.isArray(choXepTheoTuoi) ? choXepTheoTuoi : [];
            const tongCho = dsCho.reduce((a, b) => a + (Number(b.soCon) || 0), 0);
            return (
              <TouchableOpacity activeOpacity={0.7} onPress={() => setMoChoXep(true)}
                style={{ padding: 12, marginBottom: 14, backgroundColor: '#fffaf0', borderWidth: 1.5, borderColor: '#ffcc80', borderRadius: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#b26a00' }}>Ô heo chưa sắp xếp chuồng</Text>
                  <Text style={{ fontSize: 13.5, fontWeight: '900', color: tongCho > 0 ? '#b26a00' : '#adb5bd' }}>{tongCho > 0 ? `${tongCho} Con` : 'Trống'}</Text>
                </View>
                {tongCho > 0 && (
                  <Text style={{ fontSize: 10.5, color: '#e65100', fontWeight: '700', marginTop: 6 }}>
                    {`Tuần Tuổi: ${dsCho.map((x) => x.tuoi).join(', ')}`}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })()}

          {/* 🗺 SƠ ĐỒ TRẠI: trại đã sắp xếp thì theo sơ đồ đó, chưa thì tự xếp theo khu và số ô */}
          {(() => {
            const soO = danhSachPhanKhuHienThi.reduce((a, k) => a + (k.danhSachChuongCuaKhu || []).length, 0);
            return (
              <TouchableOpacity activeOpacity={0.7} onPress={() => setPopupXem('SO_DO')}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#0056b3', backgroundColor: '#eef5ff', marginBottom: 12 }}>
                <MaterialCommunityIcons name="view-grid-outline" size={26} color="#0056b3" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: '#1a1f23' }}>Sơ đồ trại</Text>
                  <Text style={{ fontSize: 11, color: '#6c757d', marginTop: 1 }}>{`${soO} ô chuồng · ${tongHeoKhuChuongThit + tongHeoKhuCaiSua} con`}</Text>
                </View>
                <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#0056b3' }}>Mở ›</Text>
              </TouchableOpacity>
            );
          })()}





          <Modal visible={popupXem === 'SO_DO'} animationType={dongNhanhSoDo ? 'none' : 'fade'} transparent statusBarTranslucent onRequestClose={() => setMoPopupSoDo(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
              <TouchableOpacity activeOpacity={1} onPress={() => setMoPopupSoDo(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              <Animated.View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 8, paddingHorizontal: 10, maxHeight: '94%',
                transform: [{ translateY: truotSoDo.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }] }}>
                <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#dee2e6', marginBottom: 8 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: '#1a1f23' }}>Sơ đồ trại</Text>
                    <Text style={{ fontSize: 11.5, color: '#6c757d' }}>{`${tongHeoKhuChuongThit + tongHeoKhuCaiSua} con · chạm vào ô để thao tác`}</Text>
                  </View>
                  {laChuTrai() && (
                    <TouchableOpacity onPress={() => { setMoPopupSoDo(false); setTimeout(() => setMoSapXepSoDo(true), 250); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginRight: 16 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0056b3' }}>{coSoDoTrai(soDoChuong) ? 'Sửa sơ đồ' : 'Sắp xếp sơ đồ'}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setMoPopupSoDo(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={{ fontSize: 20, color: '#8a929a', fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                  <BanDoTrai cauHinh={coSoDoTrai(soDoChuong) ? soDoChuong[KHOA_TOAN_TRAI] : soDoMacDinh(danhSachPhanKhuHienThi)} danhSachKhu={danhSachPhanKhuHienThi} onChamO={chamOTuSoDo} />
                </ScrollView>
              </Animated.View>
            </View>
          </Modal>

          <ModalSapXepSoDo visible={moSapXepSoDo} soDo={soDoChuong} danhSachKhu={danhSachPhanKhuHienThi}
            onClose={() => setMoSapXepSoDo(false)} />
          <OChoXepChuong visible={moChoXep} tuoiChon={tuoiChoXepChon} onClose={() => { setMoChoXep(false); setTuoiChoXepChon(null); }}
            choXepTheoTuoi={choXepTheoTuoi} danhSachKhu={danhSachPhanKhuHienThi} danhSachChuongThit={danhSachChuongThit}
            userEmail={userEmail} setDongBoStatus={setDongBoStatus}
            onDaGhi={(dong) => { if (dong && typeof setDanhSachChuongThit === 'function') setDanhSachChuongThit(prev => [...(Array.isArray(prev) ? prev : []), dong]); }}
            NutSuaXoa={({ log }) => <NutSuaXoaNhatKy log={log} loai="QUAN_SO" danhSachChuongThit={danhSachChuongThit} setDanhSachChuongThit={setDanhSachChuongThit} setDongBoStatus={setDongBoStatus} />} />

               {/* 📥 POPUP MODAL CAO CẤP: PHÂN TÁCH 2 TAB (ĐIỀU HÀNH CHUỒNG VÀ LỊCH SỬ Ô CHUỒNG CO GIÃN) */}
          <Modal
            animationType="fade" transparent={true} visible={isActionModalVisible}
            onRequestClose={() => { setIsActionModalVisible(false); setSelectedChuongGop(null); setEditingRowId(null); setSoHeoInput(""); setTuanTuoiInput(""); setTenKhuInput(""); setGhiChuInput(""); }}
          >
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
              <ScrollView ref={cuonModalRef} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 14, width: width }} keyboardShouldPersistTaps="handled">
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
                              <View>
                                <Text style={{ fontSize: 14, fontWeight: '900', color: mauKhu }}>
                                  {`${selectedChuongGop?.tenKhu || ''} · Ô ${selectedChuongGop?.tenChuong || ''}`}
                                </Text>
                                <Text style={{ fontSize: 22, fontWeight: '900', color: '#1a1f23', marginTop: 1 }}>
                                  {Math.max(0, Number(selectedChuongGop?.tongSoCon) || 0)} con
                                </Text>
                              </View>
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
                    <TouchableOpacity onPress={() => { setModalSubTab("AN_FORM"); setEditingRowId(null); }} style={{ flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: 'center', backgroundColor: (modalSubTab !== "XEM_LICH_SU" && modalSubTab !== "LICH_SU_CAM_THUOC") ? '#ffffff' : 'transparent' }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: (modalSubTab !== "XEM_LICH_SU" && modalSubTab !== "LICH_SU_CAM_THUOC") ? '#0056b3' : '#495057' }}>Thao tác</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setModalSubTab("XEM_LICH_SU")} style={{ flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: 'center', backgroundColor: modalSubTab === "XEM_LICH_SU" ? '#ffffff' : 'transparent' }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: modalSubTab === "XEM_LICH_SU" ? '#0056b3' : '#495057' }}>Lịch sử heo</Text></TouchableOpacity>
                    
                    {/* 🆕 MỚI CHÈN: Nút bấm lật trúng Sub-Tab số 3 tách chi phí cám thuốc vật tư biệt lập */}
                    <TouchableOpacity onPress={() => setModalSubTab("LICH_SU_CAM_THUOC")} style={{ flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: 'center', backgroundColor: modalSubTab === "LICH_SU_CAM_THUOC" ? '#ffffff' : 'transparent' }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: modalSubTab === "LICH_SU_CAM_THUOC" ? '#fd7e14' : '#495057' }}>Cám & thuốc</Text></TouchableOpacity>
                  </View>


                  {/* ----------------------------------------------------------------- */}
                  {/* TRƯỜNG HỢP A: KHÔNG PHẢI TAB LỊCH SỬ -> HIỆN MA TRẬN ĐIỀU HÀNH CHUỒNG */}
                  {/* ----------------------------------------------------------------- */}
{modalSubTab !== "XEM_LICH_SU" && modalSubTab !== "LICH_SU_CAM_THUOC" && (
                    <View style={{ width: '100%' }}>
                      
                                        {/* 📊 KHU VỰC 1: DA VA CHAC CHAN — EP MA TRAN DUNG 2 O VUONG DOI XUNG NAM PHANG TREN 1 HANG NGANG */}
<View style={{ marginBottom: 12 }}>
  <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
    
    {/* 🎯 MO NEO VANG: DA DONG BO THUAT TOAN GOP DOI TRU AM DUONG — BAT BUOC PHAI TU TRU SO CON THEO TUAN */}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: '100%', gap: 5 }}>
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
              <Text style={{ fontSize: 12, color: '#8a929a' }}>Ô chuồng đang trống</Text>
            </View>
          );
        }

        return mangGopThucTe.map((bayGop, bIdx) => {
          // Mũi vaccine sắp tới theo quy trình heo thịt (±5 ngày)
          const quyTrinh = Array.isArray(cauHinhVacXinLoc) ? cauHinhVacXinLoc.filter((v) => v && ['loaiHanhDong', 'loaiMocGoc', 'loaiMoc', 'nhom']
            .some((k) => String(v[k] || '').trim().toUpperCase().includes('HEO_THIT'))) : [];
          const ngayTuoi = (Number(bayGop.tuanTuoiHienTai) || 0) * 7;
          const muiSapToi = ngayTuoi > 0 ? quyTrinh.filter((v) => { const n = parseInt(v.soNgay, 10) || 0; return n > 0 && Math.abs(ngayTuoi - n) <= 5; }) : [];
          return (
            <View key={`bay_${bayGop.tuanTuoiHienTai}_${bIdx}`} style={{ width: '23%', paddingVertical: 4, paddingHorizontal: 2, alignItems: 'center', backgroundColor: '#fff4e5', borderWidth: 1, borderColor: '#ffb74d', borderRadius: 7 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#e65100' }}>{bayGop.tuanTuoiHienTai} Tuần</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1a1f23' }}>{bayGop.tongSoConThucTe} con</Text>
              {muiSapToi.map((mui, idx) => (
                <Text key={`mui_${mui.id || idx}`} style={{ fontSize: 9.5, fontWeight: 'bold', color: '#6f42c1', textAlign: 'center', marginTop: 2 }} numberOfLines={2}>
                  Sắp tiêm: {mui.tenNhiemVu || 'Vaccine'}
                </Text>
              ))}
            </View>
          );
        });
      })()}
    </View>

  </ScrollView>
</View>


                      {/* 🧭 KHU VỰC 2: THANH MENU 5 HÀNH ĐỘNG CỨNG PHẲNG HẠ LỀ CHÂN */}
                      {duocThem() && (() => {
                        const cuonToiForm = () => setTimeout(() => { if (cuonModalRef.current) cuonModalRef.current.scrollToEnd({ animated: true }); }, 200);
                        const chon = (tab, xoaO) => { if (chanNeuKhongDuQuyen('them')) return; setModalSubTab(tab); setEditingRowId(null); setIsCalendarOpen(false); if (xoaO) xoaO(); cuonToiForm(); };
                        const NUT_CHINH = [
                          { tab: 'NHAP_HEO', ten: HIEN_ICON_NUT_CHUONG ? 'Nhập Heo' : '+ Nhập Heo', icon: 'plus-circle-outline', mau: '#007bff', xoa: () => { setTongKgInput(''); setNguonNhapHeo(tongChoXep > 0 ? 'CHO_XEP' : 'MUA'); setTuanChuyenDuocChon(""); setSoHeoInput(""); setTuanTuoiInput(""); setGhiChuInput(""); } },
                          { tab: 'BAN_HEO', ten: 'Bán Heo', icon: 'cash-multiple', mau: '#28a745', xoa: () => { setTongKgInput(''); setSoHeoInput(""); setTuanTuoiInput(""); setGhiChuInput(""); } },
                          { tab: 'HAO_HUT', ten: 'Hao Hụt', icon: 'minus-circle-outline', mau: '#dc3545', xoa: () => { setSoHeoInput(""); setTuanTuoiInput(""); setGhiChuInput(""); } },
                          { tab: 'LUAN_CHUYEN', ten: 'Luân Chuyển', icon: 'swap-horizontal', mau: '#e65100', xoa: () => { setSoHeoChuyenInput(""); setChuongDichInput(""); } },
                          { tab: 'XOA_HEO', ten: 'Xóa', icon: 'delete-outline', mau: '#6c757d', xoa: () => { setSoHeoInput(""); setTuanTuoiInput(""); setGhiChuInput(""); } },
                        ];
                        const NUT_PHU = [{ tab: 'VAO_CAM', ten: 'Nhập Cám' }, { tab: 'TIEM_VACCINE', ten: 'Chích Vacxin' }];
                        return (
                          <>
                            <View style={{ flexDirection: 'row', gap: 5, marginBottom: 6 }}>
                              {NUT_CHINH.map((n) => {
                                const dangChon = modalSubTab === n.tab;
                                return (
                                  <TouchableOpacity key={n.tab} activeOpacity={0.7} onPress={() => chon(n.tab, n.xoa)}
                                    style={{ flex: 1, paddingVertical: HIEN_ICON_NUT_CHUONG ? 7 : 10, borderRadius: 7, alignItems: 'center', backgroundColor: dangChon ? n.mau : '#ffffff', borderWidth: 1.5, borderColor: n.mau }}>
                                    {HIEN_ICON_NUT_CHUONG && <MaterialCommunityIcons name={n.icon} size={22} color={dangChon ? '#ffffff' : n.mau} />}
                                    <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: dangChon ? '#ffffff' : n.mau, marginTop: HIEN_ICON_NUT_CHUONG ? 2 : 0 }} numberOfLines={1} adjustsFontSizeToFit>{n.ten}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            <View style={{ flexDirection: 'row', gap: 5, marginBottom: 12 }}>
                              {NUT_PHU.map((n) => {
                                const dangChon = modalSubTab === n.tab;
                                return (
                                  <TouchableOpacity key={n.tab} activeOpacity={0.7} onPress={() => chon(n.tab)}
                                    style={{ flex: 1, paddingVertical: 8, borderRadius: 7, alignItems: 'center', backgroundColor: dangChon ? '#495057' : '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6' }}>
                                    <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: dangChon ? '#ffffff' : '#495057' }}>{n.ten}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </>
                        );
                      })()}
                      {/* 📋 KHU VỰC 3: KHAY FORM CHI TIẾT THEO TỪNG SỰ KIỆN CHỌN (TỰ ĐỘNG ẨN GIẤU) */}
                    
                                                         {/* 🎯 BẢN NÂNG CẤP CAO CẤP: KHAY FORM A TỰ ĐỘNG HIỆN DANH SÁCH BẦY TUỔI KHI BÁN / HAO HỤT CHẶN ĐỨNG NHẦM LẪN */}
                      {(modalSubTab === "NHAP_HEO" || modalSubTab === "BAN_HEO" || modalSubTab === "HAO_HUT" || modalSubTab === "XOA_HEO" || modalSubTab === "SUA_FORM") && (
                        <View style={{ width: '100%', padding: 10, backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 0.5, borderColor: '#ced4da', marginBottom: 10 }}>
                          
                          {/* 1. THANH TIÊU ĐỀ DẸT KÈM NÚT ẨN FORM */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#ced4da', paddingBottom: 5, marginBottom: 8 }}>
                            <Text style={{ fontSize: 11, fontWeight: '900', color: modalSubTab === "SUA_FORM" ? '#b58100' : modalSubTab === "NHAP_HEO" ? '#28a745' : '#dc3545' }}>
                              {modalSubTab === "SUA_FORM" ? "Sửa Số Liệu" : modalSubTab === "NHAP_HEO" ? "NHẬP HEO VÀO Ô" : modalSubTab === "BAN_HEO" ? "XUẤT BÁN" : modalSubTab === "XOA_HEO" ? "XÓA HEO KHỎI Ô" : "HAO HỤT"}
                            </Text>
                            <TouchableOpacity onPress={() => { setModalSubTab("AN_FORM"); setSoHeoInput(""); setTuanTuoiInput(""); setGhiChuInput(""); setTuanChuyenDuocChon(""); }} style={{ backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#4a5568' }}>✕ Ẩn Form</Text></TouchableOpacity>
                          </View>

                          {modalSubTab === "XOA_HEO" && (
                            <Text style={{ fontSize: 11.5, color: '#6c757d', backgroundColor: '#f1f3f5', padding: 8, borderRadius: 8, marginBottom: 10, lineHeight: 16 }}>
                              Dùng khi số heo bị dư, nhập sai… Heo xóa sẽ trừ khỏi số heo theo tuần tuổi, nhưng không tính là bán hay hao hụt và không tính vào năng suất.
                            </Text>
                          )}
                          <ChonNgay value={ngayNhapInput} onChange={setNgayNhapInput} mau={modalSubTab === "NHAP_HEO" ? '#007bff' : modalSubTab === "BAN_HEO" ? '#28a745' : modalSubTab === "HAO_HUT" ? '#dc3545' : modalSubTab === "XOA_HEO" ? '#495057' : '#b58100'} />

                          {/* 🎯 BẢN VÁ BIẾN ĐỘNG: KHÓA CỨNG DANH SÁCH BẦY THEO HIỆN TRẠNG REAL-TIME (LÙI LỊCH CHỌN NGÀY THOẢI MÁI KHÔNG LO ẨN BẦY) */}
                          {(modalSubTab === "BAN_HEO" || modalSubTab === "HAO_HUT" || modalSubTab === "XOA_HEO") && (
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
                        {/* 📦 NGUỒN HEO: hỏi rõ ngay từ đầu để không bị tính 2 lần */}
                        {modalSubTab === "NHAP_HEO" && (
                          <View style={{ marginBottom: 8 }}>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#666666', marginBottom: 4 }}>Heo này từ đâu?</Text>
                            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                              {[
                                { ma: 'CHO_XEP', ten: `🐷 Heo cai sữa của trại (${tongChoXep} con chưa sắp xếp chuồng)` },
                                { ma: 'MUA', ten: '🛒 Heo mua từ ngoài' },
                              ].map(n => {
                                const bat = nguonNhapHeo === n.ma;
                                return (
                                  <TouchableOpacity key={n.ma} activeOpacity={0.7}
                                    onPress={() => { setNguonNhapHeo(n.ma); setTuanChuyenDuocChon(""); setTuanTuoiInput(""); }}
                                    style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 6, borderWidth: 1.5, borderColor: bat ? '#28a745' : '#ced4da', backgroundColor: bat ? '#e9f7ef' : '#ffffff', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: bat ? '#137333' : '#495057', textAlign: 'center' }}>{n.ten}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            {nguonNhapHeo === 'CHO_XEP' ? (
                              <View style={{ backgroundColor: '#ffffff', padding: 6, borderRadius: 6, borderWidth: 1, borderColor: '#ffe082' }}>
                                <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#8d6e00', marginBottom: 4 }}>• Chọn nhóm heo trong Ô heo chưa sắp xếp chuồng:</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                                  {tongChoXep === 0 ? (
                                    <Text style={{ fontSize: 10.5, color: '#7f8c8d', fontStyle: 'italic' }}>Không có heo chưa sắp xếp chuồng. Nếu là heo mua về, chọn "Heo mua từ ngoài".</Text>
                                  ) : choXepTheoTuoi.map(nhom => {
                                    const bat = String(tuanChuyenDuocChon) === String(nhom.tuoi);
                                    return (
                                      <TouchableOpacity key={`nx_${nhom.tuoi}`} activeOpacity={0.6}
                                        onPress={() => { setTuanChuyenDuocChon(String(nhom.tuoi)); setSoHeoInput(String(nhom.soCon)); }}
                                        style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5, backgroundColor: bat ? '#e65100' : '#f8f9fa', borderWidth: 1, borderColor: bat ? '#e65100' : '#ffe082' }}>
                                        <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: bat ? '#ffffff' : '#333333' }}>{`${nhom.tuoi} Tuần (${nhom.soCon} con)`}</Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                                <Text style={{ fontSize: 10, color: '#8a929a', marginTop: 4 }}>Heo cai sữa đã có trong báo cáo, xếp vào chuồng chỉ đổi chỗ nằm, không cộng thêm.</Text>
                              </View>
                            ) : (
                              <Text style={{ fontSize: 10, color: '#8a929a' }}>Heo mua / nhập từ ngoài trại sẽ được cộng thêm vào báo cáo theo tuần tuổi.</Text>
                            )}
                          </View>
                        )}
                          {/* 4. SỐ LƯỢNG LỢN TÁC ĐỘNG (GÕ TAY) */}
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#495057', marginBottom: 4 }}>Số lượng (con)</Text>
                          <TextInput style={{ height: 44, borderWidth: 1.5, borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#111111', borderColor: '#ced4da', backgroundColor: '#ffffff', marginBottom: 12 }} value={soHeoInput} onChangeText={(txt) => setSoHeoInput(txt.replace(/[^0-9]/g, ''))} keyboardType="numeric" placeholder="Số heo..." placeholderTextColor="#999999" />
                          {(modalSubTab === "BAN_HEO" || (modalSubTab === "NHAP_HEO" && nguonNhapHeo === 'MUA')) && (
                            <OKg value={tongKgInput} onChange={setTongKgInput} soCon={soHeoInput} nhan={modalSubTab === "BAN_HEO" ? 'Tổng trọng lượng bán (kg)' : 'Tổng trọng lượng heo nhập (kg)'} />
                          )}

                          {/* 5. LỨA TUẦN TUỔI (RẼ NHÁNH Dropdown HOẶC CHỮ KHÓA CỨNG TỰ ĐỘNG ĐIỀN CHỐNG NHẦM) */}
                            {/* 🚀 ĐÃ KHÓA CHẶT TRỤC CHÂN: Ép editable={false} và đổi nền xám để cấm công nhân thay đổi Tuần tuổi lô lẻ lung tung */}
                        {((modalSubTab === "NHAP_HEO" && nguonNhapHeo === 'MUA') || modalSubTab === "SUA_FORM") ? (
                          <View style={{ width: '100%' }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#495057', marginBottom: 4 }}>Tuần tuổi của heo lúc nhập</Text>
                            <TextInput 
                              style={{ height: 44, borderWidth: 1.5, borderColor: '#ced4da', borderRadius: 10, backgroundColor: modalSubTab === "SUA_FORM" ? '#e2e8f0' : '#ffffff', marginBottom: 12, fontSize: 16, fontWeight: '800', textAlign: 'center', color: modalSubTab === "SUA_FORM" ? '#64748b' : '#111111', fontWeight: 'bold' }} 
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
                            disabled={isSending || ((modalSubTab === "BAN_HEO" || modalSubTab === "HAO_HUT" || modalSubTab === "XOA_HEO") && !tuanChuyenDuocChon)} 
                            style={{ backgroundColor: (isSending || ((modalSubTab === "BAN_HEO" || modalSubTab === "HAO_HUT" || modalSubTab === "XOA_HEO") && !tuanChuyenDuocChon)) ? '#95a5a6' : '#28a745', paddingVertical: 9, borderRadius: 5, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }} 
                          onPress={() => {
                          if (modalSubTab === "SUA_FORM" ? chanNeuKhongDuQuyen('sua', (Array.isArray(danhSachChuongThit) ? danhSachChuongThit : []).find(x => x && x.id === editingRowId)) : chanNeuKhongDuQuyen('them')) return; // 🔐
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

                          let soXoaHeoCu = 0;
                          // 🎯 BẢN VÁ TRIỆT ĐỂ MỐC NGÀY: Khóa cứng ngày gửi đi bắt buộc phải là mốc ngày lùi lịch khách chọn (ngayNhapInput)
                          if (modalSubTab === "BAN_HEO" || modalSubTab === "HAO_HUT" || modalSubTab === "XOA_HEO") {
                            const mocTuoiDangGo = Number(tuanChuyenDuocChon) || 0; // Nhặt đúng lứa tuần hiện tại công nhân chạm chọn bầy
                            const mangPhuThoQuet = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
                            
                            let thucTeTuanNayCo = 0;
                            let coNhanMoi = 0; // phần heo của lứa này đi theo luồng mới (đã nằm trong báo cáo theo cách mới)
                            mangPhuThoQuet.forEach(d => {
                              if (d && d.tenChuong?.toString().trim() === chuongHienTai && d.tenKhu?.toString().trim() === khuChuan) {
                                const tGocVao = Number(d.tuanTuoi) || 0;
                                const tuoiThucTeDoDuoc = Number(d.soCon) === 0 ? 0 : tinhTuoiTinhTienThuHai(tGocVao, d.ngayNhapChuong || "");
                                if (tuoiThucTeDoDuoc === mocTuoiDangGo) {
                                  thucTeTuanNayCo += (Number(d.soCon) || 0);
                                  if (d.tinhBaoCao === true || d.nguon === 'CHO_XEP') coNhanMoi += (Number(d.soCon) || 0);
                                }
                              }
                            });
                            soXoaHeoCu = 0; // heo cũ hay mới trong ô đều nằm trong báo cáo -> Xóa ở ô là trừ báo cáo

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
                            const nhanHanhDongPrefix = (modalSubTab === "BAN_HEO") ? "[XUẤT BÁN]" : (modalSubTab === "XOA_HEO") ? "[XÓA]" : "[HAO HỤT]";
                            
                            if (ghiChuGoTay !== "") {
                              // Nếu khách có nhập chữ -> Tự động điền nhãn Sự kiện chọn lên trước nội dung khách gõ tay chằn chặn
                              chuoiGhiChuGuiGoc = `${nhanHanhDongPrefix}: ${ghiChuGoTay}`;
                            } else {
                              // Nếu khách bỏ trống -> Tự động sinh chuỗi thông báo đầy đủ mốc lứa Tuần và Ngày hôm nay vật lý
                              chuoiGhiChuGuiGoc = (modalSubTab === "BAN_HEO")
                                ? `[XUẤT BÁN]: Bán ${quanSoGoc} con heo Tuần ${mocTuoiTuanHienTaiCuaBay} (Xuất ngày ${chuoiNgayHomNayVatLy})`
                                : (modalSubTab === "XOA_HEO") ? `[XÓA]: Xóa ${quanSoGoc} con heo Tuần ${mocTuoiTuanHienTaiCuaBay} khỏi ô (ngày ${chuoiNgayHomNayVatLy})`
                                : `[HAO HỤT]: Hao Hụt ${quanSoGoc} con heo Tuần ${mocTuoiTuanHienTaiCuaBay} (Ghi sổ ngày ${chuoiNgayHomNayVatLy})`;
                            }
                            setTuanTuoiInput(tuanTuoiGuiGoc);
                          }

                                                   // 📡 KÍCH NỔ API MẠNG: Đổ trực tiếp tham số chốt chặn đa cột lên mây, đồng bộ cứng mã sự kiện sang Cột K
                          setIsSaving(true);
                          if (typeof setDongBoStatus === 'function') setDongBoStatus("⏳ Đang dồn chứng từ đối trừ...");
                          
                          // 📦 NHẬP HEO CAI SỮA CỦA TRẠI: lấy từ Ô heo chưa sắp xếp chuồng -> chỉ đổi chỗ nằm, báo cáo KHÔNG đổi
                          let laTuChoXep = false;
                          // (soXoaHeoCu đã tính ở trên khi Xóa: số con là heo nhập theo cách cũ)
                          if (modalSubTab === "NHAP_HEO" && nguonNhapHeo === 'CHO_XEP') {
                            const nhom = (Array.isArray(choXepTheoTuoi) ? choXepTheoTuoi : []).find(x => String(x.tuoi) === String(tuanChuyenDuocChon));
                            if (!nhom) { setIsSaving(false); return Alert.alert("Thông báo", "Vui lòng chọn nhóm heo trong Ô heo chưa sắp xếp chuồng."); }
                            if (quanSoGoc > nhom.soCon) { setIsSaving(false); return Alert.alert("Thông báo", `Nhóm ${nhom.tuoi} tuần chỉ còn ${nhom.soCon} con chưa sắp xếp chuồng.`); }
                            const soTuanDaQua = tinhTuoiTinhTienThuHai(1, ngayNhapGuiGoc) - 1; // ngày nhập có thể lùi lịch
                            tuanTuoiGuiGoc = String(Math.max(1, nhom.tuoi - soTuanDaQua));
                            if (!ghiChuInput.trim()) chuoiGhiChuGuiGoc = `📦 Nhận ${quanSoGoc} con ${nhom.tuoi} tuần (heo cai sữa) từ Ô heo chưa sắp xếp chuồng`;
                            laTuChoXep = true;
                          }

                          // 🚀 GHI SỔ CÁI THẲNG LÊN FIRESTORE: 1 dòng = 1 document, nhãn sự kiện (suKienHeoThit) = modalSubTab; Cloud Function tự đồng bộ sang Sheet
                          const dongGoc = {
                            userEmail, tenKhu: khuChuan, tenChuong: chuongHienTai,
                            soCon: Number(chuoiSoHeoGuiGoc), tuanTuoi: Number(tuanTuoiGuiGoc), ngayNhapChuong: ngayNhapGuiGoc, ghiChu: chuoiGhiChuGuiGoc,
                            soBaoCam: 0, soLieuVaccine: 0, suKienHeoThit: modalSubTab,
                            // 📊 Heo mua về / bán / hao hụt -> đổi báo cáo. Heo cai sữa từ chờ xếp -> chỉ đổi chỗ nằm.
                            ...(laTuChoXep ? { nguon: 'CHO_XEP' } : { tinhBaoCao: true }),
                            // ⚖️ Tổng kg: chỉ khi bán, hoặc nhập heo mua ngoài
                            ...(((modalSubTab === "BAN_HEO") || (modalSubTab === "NHAP_HEO" && !laTuChoXep)) && docKg(tongKgInput) > 0 ? { tongKg: docKg(tongKgInput) } : {})
                          };
                          // 🗑 Xóa heo nhập cũ: phần heo cũ ghi dòng KHÔNG trừ báo cáo, phần còn lại (heo luồng mới) trừ báo cáo như thường
                          let tacVu;
                          if (modalSubTab === "XOA_HEO" && soXoaHeoCu > 0) {
                            const { tinhBaoCao, ...khongTruBaoCao } = dongGoc;
                            const cacDong = [{ ...khongTruBaoCao, soCon: -soXoaHeoCu, ghiChu: `${chuoiGhiChuGuiGoc} (heo nhập cũ, không trừ báo cáo)` }];
                            if (quanSoGoc - soXoaHeoCu > 0) cacDong.push({ ...dongGoc, soCon: -(quanSoGoc - soXoaHeoCu) });
                            tacVu = ghiNhieuDong(cacDong).then((ds) => ds[ds.length - 1]);
                          } else {
                            tacVu = ghiDongMoi(dongGoc);
                          }
                          tacVu.then(dongMoiHoanThien => {
                            setTongKgInput('');
                            setIsSaving(false);
                            baoSauKhiDong("Thành công 🎉");
                            if (typeof setDanhSachChuongThit === 'function') { setDanhSachChuongThit(prev => [...(Array.isArray(prev) ? prev : []), dongMoiHoanThien]); }
                            setSoHeoInput(""); setTuanTuoiInput(""); setTenKhuInput(""); setGhiChuInput(""); setTuanChuyenDuocChon(""); setIsActionModalVisible(false); setSelectedChuongGop(null);
                          }).catch(() => { setIsSaving(false); Alert.alert("Lỗi", "Không thể lưu dữ liệu, vui lòng kiểm tra mạng và thử lại."); });
                        }}
                      >
                        <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>
                          {((modalSubTab === "BAN_HEO" || modalSubTab === "HAO_HUT" || modalSubTab === "XOA_HEO") && !tuanChuyenDuocChon) ? "⚠️ VUI LÒNG CHỌN BẦY TUỔI Ở TRÊN" : "💾 LƯU"}
                        </Text>
                      </TouchableOpacity>
                        </View>
                      )}

<FarmLogSubForm 
    cauHinhVacXinLoc={cauHinhVacXinLoc}
                        modalSubTab={modalSubTab} setModalSubTab={setModalSubTab} selectedChuongGop={selectedChuongGop} ngayNhapInput={ngayNhapInput} setNgayNhapInput={setNgayNhapInput} setIsCalendarOpen={setIsCalendarOpen} isCalendarOpen={isCalendarOpen} danhSachNgayTrongThangCalendar={danhSachNgayTrongThangCalendar} currentCalendarMonth={currentCalendarMonth} setCurrentCalendarMonth={setCurrentCalendarMonth} currentCalendarYear={currentCalendarYear} setCurrentCalendarYear={setCurrentCalendarYear} formatVNDate={formatVNDate} WEB_APP_URL={WEB_APP_URL} userEmail={userEmail} setDongBoStatus={setDongBoStatus} setDanhSachChuongThit={setDanhSachChuongThit}
                      />
                      
                     

                   {/* KHAY B: ĐÃ THU GỌN VÀO ĐÚNG RUỘT VIEW LUÂN CHUYỂN, GIẤU KÍN 100% KHI CHƯA CHỌN LỆNH */}
                  {modalSubTab === "LUAN_CHUYEN" && (
                    <View style={{ width: '100%', padding: 10, backgroundColor: '#e8f4fd', borderRadius: 8, borderWidth: 0.5, borderColor: '#b1dcfa', marginBottom: 10 }}>
                      
                      {/* 🌟 TIÊU ĐỀ DẸT KHÉP VÁCH BỌC LUÂN CHUYỂN: Chỉ xuất hiện đồng hành khi bấm nút Luân Chuyển */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#b1dcfa', paddingBottom: 5, marginBottom: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: '#0056b3' }}>
                          Luân Chuyển
                        </Text>
                        <TouchableOpacity 
                          onPress={() => { setModalSubTab("AN_FORM"); setSoHeoChuyenInput(""); setChuongDichInput(""); setTuanChuyenDuocChon(""); }} 
                          style={{ backgroundColor: '#d0e7ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}
                        >
                          <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: '#0056b3' }}>✕ Ẩn Form</Text>
                        </TouchableOpacity>
                      </View>
                      <ChonNgay value={ngayNhapInput} onChange={setNgayNhapInput} mau="#e65100" nhan="Ngày luân chuyển" />
                      
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
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#495057', marginBottom: 4 }}>Số lượng heo chuyển đi (con)</Text>
                      <TextInput style={{ height: 44, borderWidth: 1.5, borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#111111', borderColor: '#ced4da', backgroundColor: '#ffffff', marginBottom: 12 }} placeholder="Ví dụ: 50" placeholderTextColor="#999999" keyboardType="numeric" value={soHeoChuyenInput} onChangeText={(txt) => setSoHeoChuyenInput(txt.replace(/[^0-9]/g, ''))} />
                      
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
                          const chuoiNgayHomNay = (ngayNhapInput || formatVNDate(new Date())).trim(); // 📅 ngày luân chuyển khách chọn
                          const tuoiLucChuyen = Number(tuanChuyenDuocChon) - (tinhTuoiTinhTienThuHai(1, chuoiNgayHomNay) - 1); // tuổi heo vào đúng ngày chuyển
                          if (tuoiLucChuyen < 1) return Alert.alert("Thông báo", "Ngày luân chuyển lùi quá xa so với tuổi của lứa heo này.");

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

                          const maLuanChuyen = taoMaLuanChuyen(); // 🔗 nối 2 dòng: sửa / xóa luôn đi cùng nhau
                          const dongTruDieuChuyen = { userEmail, tenKhu: khuNguon, tenChuong: chuongNguon, soCon: -soConChuyen, tuanTuoi: tuoiLucChuyen, ngayNhapChuong: chuoiNgayHomNay, ghiChu: ghiChuTru, soBaoCam: 0, soLieuVaccine: 0, suKienHeoThit: "LUAN_CHUYEN", maLuanChuyen };
                          const dongCongDieuChuyen = { userEmail, tenKhu: khuDichInput, tenChuong: chuongDichInput.trim(), soCon: soConChuyen, tuanTuoi: tuoiLucChuyen, ngayNhapChuong: chuoiNgayHomNay, ghiChu: ghiChuCong, soBaoCam: 0, soLieuVaccine: 0, suKienHeoThit: "LUAN_CHUYEN", maLuanChuyen };

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


                      {/* Thao tác ít dùng, dễ bấm nhầm: để chữ nhỏ ở cuối cửa sổ */}
                      {duocThem() && (
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 18, marginTop: 4, marginBottom: 4 }}>
                          {laChuTrai() && (
                            <TouchableOpacity onPress={() => {
                              const conHeoHienTai = Number(selectedChuongGop?.tongSoCon) > 0;
                              Alert.alert(
                                "Xóa hoàn toàn ô chuồng?",
                                conHeoHienTai
                                  ? `Ô chuồng [${selectedChuongGop?.tenChuong}] hiện vẫn còn ${selectedChuongGop?.tongSoCon} con heo. Xóa sẽ gỡ hẳn ô chuồng này khỏi sơ đồ trại. Hành động này KHÔNG hoàn tác được. Bạn chắc chắn chứ?`
                                  : `Xóa hẳn ô chuồng [${selectedChuongGop?.tenChuong}] khỏi sơ đồ trại? Hành động này KHÔNG hoàn tác được.`,
                                [{ text: "Hủy", style: "cancel" }, { text: "Xóa hoàn toàn", style: "destructive", onPress: handleXoaBoHoanToanChuong }]
                              );
                            }}>
                              <Text style={{ fontSize: 11.5, color: '#dc3545', textDecorationLine: 'underline' }}>Xóa ô chuồng</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                      <TouchableOpacity activeOpacity={0.7}
                        onPress={() => { setIsActionModalVisible(false); setSelectedChuongGop(null); setEditingRowId(null); setModalSubTab("AN_FORM"); setSoHeoInput(""); setTuanTuoiInput(""); setTenKhuInput(""); setGhiChuInput(""); }}
                        style={{ marginTop: 10, paddingVertical: 11, borderRadius: 8, alignItems: 'center', backgroundColor: '#f1f3f5' }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#495057' }}>Trở về</Text>
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
                  {modalSubTab === "XEM_LICH_SU" && (() => {
                    const mangGocTho = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
                    const nhatKy = mangGocTho.filter((log) => log
                      && log.tenChuong?.toString().trim() === selectedChuongGop?.tenChuong
                      && log.tenKhu?.toString().trim() === selectedChuongGop?.tenKhu
                      && Number(log.soCon) !== 0
                      && !['VAO_CAM', 'TIEM_VACCINE', 'DON_CHUONG', SK_DOI_CHIEU].includes(log.suKienHeoThit));

                    // Mới nhất lên đầu: theo ngày, cùng ngày thì theo lúc ghi
                    // Dòng chuyển đi mang ngày / tuổi gốc của lứa -> hiển thị theo dòng đi cặp (ngày chuyển thật)
                    const capCua = (log) => timDongCap(log, mangGocTho);
                    const ngayCua = (log) => { const c = Number(log.soCon) < 0 ? capCua(log) : null; return String((c || log).ngayNhapChuong || ''); };
                    const tuanCua = (log) => { const c = Number(log.soCon) < 0 ? capCua(log) : null; return (c || log).tuanTuoi; };
                    const msNgay = (log) => { const d = parseToDateObject(ngayCua(log)); return d ? d.getTime() : 0; };
                    nhatKy.sort((x, y) => (msNgay(y) - msNgay(x)) || String(y.id || '').localeCompare(String(x.id || '')));

                    // Tên loại biến động cho dễ đọc
                    const loaiDong = (log) => {
                      const so = Number(log.soCon) || 0;
                      const gc = String(log.ghiChu || '');
                      const sk = log.suKienHeoThit;
                      if (sk === 'BAN_HEO' || gc.includes('[XUẤT BÁN]')) return { ten: 'Bán heo', mau: '#28a745' };
                      if (sk === 'HAO_HUT' || gc.includes('[HAO HỤT]')) return { ten: 'Hao hụt', mau: '#dc3545' };
                      if (sk === 'XOA_HEO') return { ten: 'Xóa heo', mau: '#6c757d' };
                      if (sk === 'LUAN_CHUYEN' || gc.includes('🚚')) { const c = capCua(log); const o = c ? (c.tenKhu === 'CHO_XEP' ? 'Ô heo chưa sắp xếp chuồng' : `${c.tenKhu} - Ô ${c.tenChuong}`) : ''; return so < 0 ? { ten: c ? `Chuyển đi tới ${o}` : 'Chuyển đi', mau: '#e65100' } : { ten: c ? `Chuyển đến từ ${o}` : 'Chuyển đến', mau: '#e65100' }; }
                      if (sk === 'XOA_SACH_LOTUOI') return { ten: 'Xóa lứa', mau: '#6c757d' };
                      if (log.nguon === 'CHO_XEP') return { ten: 'Từ ô chưa xếp chuồng', mau: '#007bff' };
                      if (so > 0) return { ten: 'Nhập heo', mau: '#007bff' };
                      return { ten: 'Giảm', mau: '#6c757d' };
                    };

                    const tongTang = nhatKy.reduce((a, l) => a + Math.max(0, Number(l.soCon) || 0), 0);
                    const tongGiam = nhatKy.reduce((a, l) => a + Math.max(0, -(Number(l.soCon) || 0)), 0);
                    let thangTruoc = '';

                    return (
                      <View style={{ width: '100%' }}>
                        {nhatKy.length > 0 && (
                          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                            <View style={{ flex: 1, backgroundColor: '#f8f9fa', borderRadius: 8, paddingVertical: 7, alignItems: 'center' }}>
                              <Text style={{ fontSize: 10.5, color: '#6c757d' }}>Số lần ghi</Text>
                              <Text style={{ fontSize: 15, fontWeight: '900', color: '#1a1f23' }}>{nhatKy.length}</Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: '#e7f5ec', borderRadius: 8, paddingVertical: 7, alignItems: 'center' }}>
                              <Text style={{ fontSize: 10.5, color: '#1e7e34' }}>Tổng vào</Text>
                              <Text style={{ fontSize: 15, fontWeight: '900', color: '#1e7e34' }}>+{tongTang}</Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: '#fdecee', borderRadius: 8, paddingVertical: 7, alignItems: 'center' }}>
                              <Text style={{ fontSize: 10.5, color: '#c82333' }}>Tổng ra</Text>
                              <Text style={{ fontSize: 15, fontWeight: '900', color: '#c82333' }}>−{tongGiam}</Text>
                            </View>
                          </View>
                        )}

                        <ScrollView style={{ maxHeight: 360 }} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                          {nhatKy.length === 0 ? (
                            <Text style={{ fontSize: 12, color: '#8a929a', paddingVertical: 35, textAlign: 'center' }}>Ô chuồng chưa có lịch sử nhập / xuất heo.</Text>
                          ) : nhatKy.map((log, lIdx) => {
                            const so = Number(log.soCon) || 0;
                            const loai = loaiDong(log);
                            const ngay = ngayCua(log);
                            const thang = ngay.split('/').slice(1).join('/');
                            const hienThang = thang && thang !== thangTruoc;
                            thangTruoc = thang;
                            const dangMo = dongLichSuMo === (log.id || lIdx);
                            const nguoi = log.nguoiNhap ? (log.nguoiNhap === 'CHU' ? 'Chủ trại' : (log.tenNguoiNhap ? `${log.nguoiNhap} – ${log.tenNguoiNhap}` : log.nguoiNhap)) : '';
                            return (
                              <View key={`ls_heo_${log.id || lIdx}`}>
                                {hienThang && (
                                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#8a929a', marginTop: lIdx === 0 ? 0 : 10, marginBottom: 4 }}>Tháng {thang}</Text>
                                )}
                                <TouchableOpacity activeOpacity={0.6} onPress={() => setDongLichSuMo(dangMo ? null : (log.id || lIdx))}
                                  style={{ paddingVertical: 9, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f1f3f5', backgroundColor: dangMo ? '#f8f9fa' : 'transparent' }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: loai.mau, marginRight: 9 }} />
                                    <View style={{ flex: 1 }}>
                                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1a1f23' }}>{loai.ten}</Text>
                                      <Text style={{ fontSize: 11, color: '#8a929a', marginTop: 1 }} numberOfLines={1}>
                                        {[ngay, `${tuanCua(log)} tuần`, hienKg(log.tongKg), nguoi].filter(Boolean).join('  ·  ')}
                                      </Text>
                                    </View>
                                    <Text style={{ fontSize: 16, fontWeight: '900', color: so < 0 ? '#c82333' : '#1e7e34', marginLeft: 8 }}>
                                      {so < 0 ? `−${Math.abs(so)}` : `+${so}`}
                                    </Text>
                                  </View>
                                  {dangMo && (
                                    <View style={{ marginTop: 6, marginLeft: 12 }}>
                                      <Text style={{ fontSize: 11.5, color: '#495057', lineHeight: 16 }}>{log.ghiChu ? log.ghiChu : 'Không có ghi chú'}</Text>
                                      <NhanNguoiNhap item={log} nhan="Người tạo" style={{ fontSize: 10.5 }} />
                                      <NutSuaXoaNhatKy log={log} loai="QUAN_SO" danhSachChuongThit={danhSachChuongThit} setDanhSachChuongThit={setDanhSachChuongThit} setDongBoStatus={setDongBoStatus} />
                                    </View>
                                  )}
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </ScrollView>
                        {nhatKy.length > 0 && (
                          <Text style={{ fontSize: 10.5, color: '#adb5bd', textAlign: 'center', marginTop: 6 }}>Chạm vào một dòng để xem ghi chú, sửa hoặc xóa</Text>
                        )}


                        <TouchableOpacity activeOpacity={0.7}
                          onPress={() => { setIsActionModalVisible(false); setSelectedChuongGop(null); setEditingRowId(null); setModalSubTab("AN_FORM"); setDongLichSuMo(null); }}
                          style={{ marginTop: 10, paddingVertical: 11, borderRadius: 8, alignItems: 'center', backgroundColor: '#f1f3f5' }}>
                          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#495057' }}>Trở về</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })()}

           
                                {/* ================================================================= */}
                  {/* 🆕 TRƯỜNG HỢP C: LẬT TRÚNG SUB-TAB SỐ 3 — CHỈ XỔ RIÊNG LỊCH SỬ VÀO CÁM VÀ VACCINE PHẲNG MỊN */}
                  {/* ================================================================= */}
                  {/* 🆕 TRƯỜNG HỢP C HOÀN THIỆN: NHẬT KÝ CHI PHÍ VẬT TƯ TÍCH HỢP ĐỦ CẶP NÚT SỬA VÀ XÓA */}
                  {/* ================================================================= */}
                  {modalSubTab === "LICH_SU_CAM_THUOC" && (() => {
                    const mangGocTho = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];
                    const nhatKy = mangGocTho.filter((log) => log
                      && log.tenChuong?.toString().trim() === selectedChuongGop?.tenChuong
                      && log.tenKhu?.toString().trim() === selectedChuongGop?.tenKhu
                      && (log.suKienHeoThit === 'VAO_CAM' || log.suKienHeoThit === 'TIEM_VACCINE'));

                    // Mới nhất lên đầu: theo ngày, cùng ngày thì theo lúc ghi
                    const msNgay = (log) => { const d = parseToDateObject(log.ngayNhapChuong); return d ? d.getTime() : 0; };
                    nhatKy.sort((x, y) => (msNgay(y) - msNgay(x)) || String(y.id || '').localeCompare(String(x.id || '')));

                    const tongBao = nhatKy.reduce((a, l) => a + (l.suKienHeoThit === 'VAO_CAM' ? (Number(l.soBaoCam) || 0) : 0), 0);
                    const tongLieu = nhatKy.reduce((a, l) => a + (l.suKienHeoThit === 'TIEM_VACCINE' ? (Number(l.soLieuVaccine) || 0) : 0), 0);
                    let thangTruoc = '';

                    return (
                      <View style={{ width: '100%' }}>
                        {nhatKy.length > 0 && (
                          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                            <View style={{ flex: 1, backgroundColor: '#f8f9fa', borderRadius: 8, paddingVertical: 7, alignItems: 'center' }}>
                              <Text style={{ fontSize: 10.5, color: '#6c757d' }}>Số lần ghi</Text>
                              <Text style={{ fontSize: 15, fontWeight: '900', color: '#1a1f23' }}>{nhatKy.length}</Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: '#fff3e0', borderRadius: 8, paddingVertical: 7, alignItems: 'center' }}>
                              <Text style={{ fontSize: 10.5, color: '#e65100' }}>Tổng cám</Text>
                              <Text style={{ fontSize: 15, fontWeight: '900', color: '#e65100' }}>{tongBao} bao</Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: '#f3eefe', borderRadius: 8, paddingVertical: 7, alignItems: 'center' }}>
                              <Text style={{ fontSize: 10.5, color: '#6f42c1' }}>Tổng thuốc</Text>
                              <Text style={{ fontSize: 15, fontWeight: '900', color: '#6f42c1' }}>{tongLieu} liều</Text>
                            </View>
                          </View>
                        )}

                        <ScrollView style={{ maxHeight: 360 }} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                          {nhatKy.length === 0 ? (
                            <Text style={{ fontSize: 12, color: '#8a929a', paddingVertical: 35, textAlign: 'center' }}>Ô chuồng chưa có lịch sử nhập cám / chích thuốc.</Text>
                          ) : nhatKy.map((log, lIdx) => {
                            const laCam = log.suKienHeoThit === 'VAO_CAM';
                            const mau = laCam ? '#e65100' : '#6f42c1';
                            const ngay = String(log.ngayNhapChuong || '');
                            const thang = ngay.split('/').slice(1).join('/');
                            const hienThang = thang && thang !== thangTruoc;
                            thangTruoc = thang;
                            const dangMo = dongLichSuMo === (log.id || lIdx);
                            const nguoi = log.nguoiNhap ? (log.nguoiNhap === 'CHU' ? 'Chủ trại' : (log.tenNguoiNhap ? `${log.nguoiNhap} – ${log.tenNguoiNhap}` : log.nguoiNhap)) : '';
                            return (
                              <View key={`ls_cam_${log.id || lIdx}`}>
                                {hienThang && (
                                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#8a929a', marginTop: lIdx === 0 ? 0 : 10, marginBottom: 4 }}>Tháng {thang}</Text>
                                )}
                                <TouchableOpacity activeOpacity={0.6} onPress={() => setDongLichSuMo(dangMo ? null : (log.id || lIdx))}
                                  style={{ paddingVertical: 9, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f1f3f5', backgroundColor: dangMo ? '#f8f9fa' : 'transparent' }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: mau, marginRight: 9 }} />
                                    <View style={{ flex: 1 }}>
                                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1a1f23' }}>{laCam ? 'Nhập cám' : 'Chích thuốc'}</Text>
                                      <Text style={{ fontSize: 11, color: '#8a929a', marginTop: 1 }} numberOfLines={1}>
                                        {`${ngay}${nguoi ? `  ·  ${nguoi}` : ''}`}
                                      </Text>
                                    </View>
                                    <Text style={{ fontSize: 15, fontWeight: '900', color: mau, marginLeft: 8 }}>
                                      {laCam ? `${log.soBaoCam || 0} bao` : `${log.soLieuVaccine || 0} liều`}
                                    </Text>
                                  </View>
                                  {dangMo && (
                                    <View style={{ marginTop: 6, marginLeft: 12 }}>
                                      <Text style={{ fontSize: 11.5, color: '#495057', lineHeight: 16 }}>{log.ghiChu ? log.ghiChu : 'Không có ghi chú'}</Text>
                                      <NhanNguoiNhap item={log} nhan="Người tạo" style={{ fontSize: 10.5 }} />
                                      <NutSuaXoaNhatKy log={log} loai="CAM" danhSachChuongThit={danhSachChuongThit} setDanhSachChuongThit={setDanhSachChuongThit} setDongBoStatus={setDongBoStatus} />
                                    </View>
                                  )}
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </ScrollView>
                        {nhatKy.length > 0 && (
                          <Text style={{ fontSize: 10.5, color: '#adb5bd', textAlign: 'center', marginTop: 6 }}>Chạm vào một dòng để xem ghi chú, sửa hoặc xóa</Text>
                        )}


                        <TouchableOpacity activeOpacity={0.7}
                          onPress={() => { setIsActionModalVisible(false); setSelectedChuongGop(null); setEditingRowId(null); setModalSubTab("AN_FORM"); setDongLichSuMo(null); }}
                          style={{ marginTop: 10, paddingVertical: 11, borderRadius: 8, alignItems: 'center', backgroundColor: '#f1f3f5' }}>
                          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#495057' }}>Trở về</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })()}


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
                    if (chanNeuKhongDuQuyen('sua', (Array.isArray(danhSachChuongThit) ? danhSachChuongThit : []).find(x => x && x.id === editingRowId))) return; // 🔐
                    
                    const quanSoMoiGo = soHeoInput ? soHeoInput.trim() : "";
                    if (quanSoMoiGo === "" || Number(quanSoMoiGo) < 0) return Alert.alert("Thông báo", "Vui lòng nhập số lượng hợp lệ lớn hơn hoặc bằng 0!");

                    // 🚀 CHẤT LƯỢNG MẠNG: Gọi chuẩn xác hàm Props viết hoa đầu cổng để kích hoạt cờ xoay Đang tải lề đỉnh
                    if (typeof setIsSaving === 'function') {
                      setIsSaving(true);
                    } else if (typeof setIsSending === 'function') {
                      setIsSending(true);
                    }

                    if (typeof setDongBoStatus === 'function') setDongBoStatus("⏳ Đang dồn số liệu hiệu chỉnh...");

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

                 <View style={{ marginTop: 18, paddingHorizontal: 2 }}>
            <Text style={{ fontSize: 13, color: '#1e293b', fontWeight: '900', marginBottom: 10 }}>NHẬT KÝ TOÀN BỘ Ô CHUỒNG</Text>

            {/* 2 NÚT CHỌN LOẠI NHẬT KÝ: bấm nút nào thì hiện nhật ký đó */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTabNhatKyToanTrai("QUAN_SO")}
                style={{ flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: tabNhatKyToanTrai === "QUAN_SO" ? '#2563eb' : '#e2e8f0', backgroundColor: tabNhatKyToanTrai === "QUAN_SO" ? '#dbeafe' : '#f8fafc' }}
              >
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: tabNhatKyToanTrai === "QUAN_SO" ? '#1d4ed8' : '#64748b' }}>Biến động số heo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTabNhatKyToanTrai("CAM")}
                style={{ flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: tabNhatKyToanTrai === "CAM" ? '#e65100' : '#e2e8f0', backgroundColor: tabNhatKyToanTrai === "CAM" ? '#fff0e6' : '#f8fafc' }}
              >
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: tabNhatKyToanTrai === "CAM" ? '#e65100' : '#64748b' }}>Biến động cám</Text>
              </TouchableOpacity>
            </View>

            {/* 📅 BỘ LỌC THỜI GIAN: dùng chung cho cả 2 loại nhật ký */}
            <BoLocThoiGian giaTri={boLocNhatKy} onDoi={setBoLocNhatKy} mauChinh={tabNhatKyToanTrai === "CAM" ? '#e65100' : '#2563eb'} />

            {/* ===== NHẬT KÝ 1: BIẾN ĐỘNG QUÂN SỐ TOÀN BỘ Ô CHUỒNG ===== */}
            {tabNhatKyToanTrai === "QUAN_SO" && (() => {
              const mangGocTho = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];

              // Bộ lọc: Chỉ nhặt dòng quân số thực tế (khác 0), bỏ qua các dòng vật tư Cám/Thuốc hoặc dòng khởi tạo ô trống
              const dongBanCu = (Array.isArray(lichSuBanCu) ? lichSuBanCu : []).map(dongBanCuThanhNhatKy);
              const nhatKyOChuong = locTheoThoiGian(mangGocTho.concat(dongBanCu).filter(log => 
                log && 
                Number(log.soCon) !== 0 && 
                log.suKienHeoThit !== "VAO_CAM" && 
                log.suKienHeoThit !== "TIEM_VACCINE" && 
                log.suKienHeoThit !== "TAO_CHUONG" &&
                log.suKienHeoThit !== "DON_CHUONG" &&
                log.suKienHeoThit !== SK_DOI_CHIEU
              ), boLocNhatKy, (log) => log.ngayNhapChuong); // 📅 Lọc theo kỳ đang chọn

              if (nhatKyOChuong.length === 0) { 
                return (
                  <View style={{ paddingVertical: 25, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Text style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>
                      {boLocNhatKy.che === "TAT_CA" ? "Chưa có lịch sử biến động quân số nào ở các ô chuồng." : "Không có biến động quân số nào trong kỳ này."}
                    </Text>
                  </View>
                ); 
              }
              
              // Sắp xếp chứng từ theo ID thời gian, dòng mới nhất nhảy lên đầu sảnh
              sapXepMoiNhat(nhatKyOChuong); // Mới nhất lên đầu: theo ngày, cùng ngày theo lúc ghi

              // 📅 Tổng kết trong kỳ: nhập, bán, hao hụt (luân chuyển giữa các ô không tính)
              const laLuanChuyen = (log) => (log.ghiChu || "").includes("🚚");
              // Phân loại từng dòng: NHAP / BAN / HAO / KHAC (luân chuyển, dọn chuồng...)
              const loaiCuaDong = (log) => {
                const so = Number(log.soCon) || 0;
                if (laLuanChuyen(log)) return 'KHAC';
                if (log.suKienHeoThit === "BAN_HEO" || (log.ghiChu || "").includes("XUẤT BÁN")) return 'BAN';
                if (log.suKienHeoThit === "HAO_HUT" || (log.ghiChu || "").includes("HAO HỤT")) return 'HAO';
                if (so > 0) return 'NHAP';
                return 'KHAC';
              };
              const tongKy = nhatKyOChuong.reduce((t, log) => {
                const loai = loaiCuaDong(log);
                const so = Math.abs(Number(log.soCon) || 0);
                if (loai === 'NHAP') t.nhap += so; else if (loai === 'BAN') t.ban += so; else if (loai === 'HAO') t.hao += so;
                return t;
              }, { nhap: 0, ban: 0, hao: 0 });
              // 🔗 Luân chuyển: 2 dòng (đi / đến) gộp thành 1 dòng hiển thị, đặt ở dòng chuyển đến (ngày chuyển thật)
              const dongHienThi = (locLoaiNhatKy ? nhatKyOChuong.filter((log) => loaiCuaDong(log) === locLoaiNhatKy) : nhatKyOChuong)
                .filter((log) => !(laLuanChuyen(log) && Number(log.soCon) < 0 && timDongCap(log, mangGocTho)));

              return (
                <View>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                    {[
                      { ma: 'NHAP', ten: 'Nhập', so: tongKy.nhap, mau: '#2563eb', nen: '#dbeafe' },
                      { ma: 'BAN', ten: 'Bán', so: tongKy.ban, mau: '#16a34a', nen: '#dcfce7' },
                      { ma: 'HAO', ten: 'Hao hụt', so: tongKy.hao, mau: '#dc2626', nen: '#fee2e2' },
                    ].map((o) => {
                      const dangLoc = locLoaiNhatKy === o.ma;
                      return (
                        <TouchableOpacity key={o.ma} activeOpacity={0.7} onPress={() => setLocLoaiNhatKy(dangLoc ? null : o.ma)}
                          style={{ flex: 1, backgroundColor: dangLoc ? o.mau : o.nen, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1.5, borderColor: o.mau }}>
                          <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: dangLoc ? '#ffffff' : o.mau }}>{o.ten}</Text>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: dangLoc ? '#ffffff' : o.mau }}>{o.so} con</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={{ fontSize: 10.5, color: '#8a929a', textAlign: 'center', marginBottom: 8 }}>
                    {locLoaiNhatKy
                      ? `Đang xem ${dongHienThi.length} lần ${{ NHAP: 'nhập', BAN: 'bán', HAO: 'hao hụt' }[locLoaiNhatKy]} · bấm lại ô đó để xem tất cả`
                      : 'Bấm ô Nhập / Bán / Hao hụt để lọc · chạm vào dòng để xem ghi chú, sửa, xóa'}
                  </Text>
                  {dongHienThi.length === 0 && (
                    <Text style={{ fontSize: 11.5, color: '#94a3b8', textAlign: 'center', paddingVertical: 20 }}>Không có lần nào trong kỳ này.</Text>
                  )}
                  {veDanhSachNhatKyGon(dongHienThi.slice(0, soDongNhatKyHeo), (log) => {
                    const so = Number(log.soCon) || 0;
                    const gc = String(log.ghiChu || '');
                    let ten = so > 0 ? 'Nhập heo' : 'Giảm', mau = '#2563eb';
                    if (log.suKienHeoThit === 'XOA_HEO') { ten = 'Xóa heo'; mau = '#6c757d'; }
                    else if (log.suKienHeoThit === 'HAO_HUT' || gc.includes('HAO HỤT')) { ten = 'Hao hụt'; mau = '#dc2626'; }
                    else if (log.suKienHeoThit === 'BAN_HEO' || gc.includes('XUẤT BÁN')) { ten = 'Bán heo'; mau = '#16a34a'; }
                    else if (log.suKienHeoThit === 'LUAN_CHUYEN' || gc.includes('🚚')) {
                      const cap = timDongCap(log, mangGocTho);
                      if (cap && so > 0) return { ten: 'Luân chuyển', mau: '#e65100', noi: `${tenOGon(cap)} → ${tenOGon(log)}`, phu: `${log.tuanTuoi} tuần`, so: `${so} con`, mauSo: '#e65100' };
                      ten = so < 0 ? 'Chuyển đi' : 'Chuyển đến'; mau = '#e65100';
                    }
                    else if (log.suKienHeoThit === 'XOA_SACH_LOTUOI') { ten = 'Xóa lứa'; mau = '#6c757d'; }
                    else if (log.nguon === 'CHO_XEP') { ten = 'Từ ô chưa xếp chuồng'; mau = '#2563eb'; }
                    else if (so < 0) { mau = '#6c757d'; }
                    return { ten, mau, noi: tenOGon(log), phu: [`${log.tuanTuoi} tuần`, hienKg(log.tongKg)].filter(Boolean).join('  ·  '), so: so < 0 ? `−${Math.abs(so)}` : `+${so}`, mauSo: so < 0 ? '#c82333' : '#1e7e34' };
                  }, 'QUAN_SO', 'nk_qs')}

                  {dongHienThi.length > soDongNhatKyHeo && (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => setSoDongNhatKyHeo(soDongNhatKyHeo + 15)}
                      style={{ paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff', alignItems: 'center', marginTop: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2563eb' }}>Xem thêm (còn {dongHienThi.length - soDongNhatKyHeo} dòng)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}

            {/* ===== NHẬT KÝ 2: BIẾN ĐỘNG CÁM TOÀN BỘ Ô CHUỒNG ===== */}
            {tabNhatKyToanTrai === "CAM" && (() => {
              const mangGocTho = Array.isArray(danhSachChuongThit) ? danhSachChuongThit : [];

              // Bộ lọc: chỉ nhặt các dòng nhập cám (nhãn VAO_CAM) của mọi ô chuồng
              const nhatKyCam = locTheoThoiGian(mangGocTho.filter(log => log && log.suKienHeoThit === "VAO_CAM"), boLocNhatKy, (log) => log.ngayNhapChuong); // 📅 Lọc theo kỳ

              if (nhatKyCam.length === 0) {
                return (
                  <View style={{ paddingVertical: 25, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Text style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>
                      {boLocNhatKy.che === "TAT_CA" ? "Chưa có lần nhập cám nào ở các ô chuồng." : "Không có lần nhập cám nào trong kỳ này."}
                    </Text>
                  </View>
                );
              }

              // Dòng mới nhất nhảy lên đầu
              sapXepMoiNhat(nhatKyCam);
              const tongBaoCamToanTrai = nhatKyCam.reduce((tong, log) => tong + (Number(log.soBaoCam) || 0), 0);
              const cacDongHienThi = nhatKyCam.slice(0, soDongNhatKyCam);

              return (
                <View>
                  {/* Tổng cám toàn bộ các ô chuồng */}
                  <View style={{ backgroundColor: '#fff8e6', borderWidth: 1, borderColor: '#ffe0b2', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#e65100' }}>{boLocNhatKy.che === "TAT_CA" ? "Tổng cám đã nhập toàn bộ ô chuồng" : "Tổng cám nhập trong kỳ"}</Text>
                      <Text style={{ fontSize: 10, color: '#8a6d3b', marginTop: 2 }}>{nhatKyCam.length} lần nhập cám</Text>
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#e65100' }}>{tongBaoCamToanTrai} bao</Text>
                  </View>

                  {veDanhSachNhatKyGon(cacDongHienThi, (log) => ({
                    ten: 'Nhập cám', mau: '#e65100', noi: tenOGon(log), phu: '', so: `${Number(log.soBaoCam) || 0} bao`,
                  }), 'CAM', 'nk_cam')}

                  {/* Nút xem thêm khi còn nhiều dòng */}
                  {nhatKyCam.length > soDongNhatKyCam && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setSoDongNhatKyCam(soDongNhatKyCam + 15)}
                      style={{ paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: '#ffe0b2', backgroundColor: '#fffaf0', alignItems: 'center', marginTop: 2 }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#e65100' }}>
                        Xem thêm (còn {nhatKyCam.length - soDongNhatKyCam} dòng)
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