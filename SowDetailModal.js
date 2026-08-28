import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';

const SowDetailModal = ({ 
  visible, 
  onClose, 
  styles,
  parseToDateObject,
  selectedHeoDetail,
  nhomNaiTab2,
  danhSachLichSu,
  danhSachDangDe 
}) => {

  const [khayMenuPhu, setKhayMenuPhu] = React.useState('HO_SO');

  const epNgayChuanVietNam = (str) => {
    if (!str || str.toString().trim() === "" || str.toString().trim() === "---") return "---";
    let s = str.toString().trim();
    
    // 🎯 SỬA CHI MẠNG: Tách vách gạch ngang của Google Sheets để ép về chuẩn định dạng ngày Việt Nam
    if (s.includes('-') && s.substring(0, 10).split('-').length === 3) {
      const p = s.substring(0, 10).split('-');
      if (p[0].length === 4) return `${p[2]}/${p[1]}/${p[0]}`; // YYYY-MM-DD -> DD/MM/YYYY
    }
    if (s.includes('/') && s.split('/').length === 3) return s.substring(0, 10);
    
    const d = new Date(s);
    if (isNaN(d.getTime())) return s.substring(0, 10);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const maTaiModal = selectedHeoDetail?.maTai?.toString().toUpperCase().trim() || "";

  // 🎯 BẢN VÁ TRUY VẾT TỐI CAO: Bốc trọn vẹn thông tin lứa và trạng thái sống mới nhất ngoài RAM đàn nái
  const duLieuNaiMoiNhatRealTime = (() => {
    const mangGocSong = global.danhSachCapNhatTrangThai || [];
    if (Array.isArray(mangGocSong) && maTaiModal !== "") {
      const timThayNaiReal = mangGocSong.find(h => h && h.maTai && h.maTai.toString().toUpperCase().trim() === maTaiModal);
      if (timThayNaiReal) return timThayNaiReal;
    }
    return selectedHeoDetail;
  })();

  const trangThaiXacThucNai = (duLieuNaiMoiNhatRealTime?.trangThaiDienThoai || duLieuNaiMoiNhatRealTime?.trangThaiCotH || duLieuNaiMoiNhatRealTime?.trangThai || "CHOR_PHOI").toString().trim().toUpperCase().normalize("NFC");
  const laNaiMangBau = trangThaiXacThucNai === "PHỐI" || trangThaiXacThucNai.includes("PHOI");
  const laNaiNuoiCon = trangThaiXacThucNai === "ĐẺ" || trangThaiXacThucNai.includes("DE") || trangThaiXacThucNai.includes("ĐE");
  const laNaiDaThai = trangThaiXacThucNai === "THẢI" || trangThaiXacThucNai.includes("THAI");
  const laNaiTheoDoi = !laNaiMangBau && !laNaiNuoiCon && !laNaiDaThai;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={() => { setKhayMenuPhu('HO_SO'); onClose(); }}>
      <View style={styles.modalOverlay}>
<View style={[styles.popupCard, { width: '96%', maxHeight: '86%', paddingHorizontal: 8 }]}>
          <Text style={[styles.popupTitle, { fontSize: 16, color: '#007bff', marginBottom: 5, fontWeight: 'bold', textAlign: 'center' }]}>
            CHI TIẾT HEO NÁI: {duLieuNaiMoiNhatRealTime?.maTai}
          </Text>
          
          <View style={{ flexDirection: 'row', backgroundColor: '#f1f3f5', padding: 3, borderRadius: 10, marginBottom: 12 }}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setKhayMenuPhu('HO_SO')} style={{ flex: 1, backgroundColor: khayMenuPhu === 'HO_SO' ? '#ffffff' : 'transparent', paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: khayMenuPhu === 'HO_SO' ? '#e65100' : '#5c6770' }}>📋 Thẻ Nái</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setKhayMenuPhu('SUNG_KIEN')} style={{ flex: 1, backgroundColor: khayMenuPhu === 'SUNG_KIEN' ? '#ffffff' : 'transparent', paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: khayMenuPhu === 'SUNG_KIEN' ? '#e65100' : '#5c6770' }}>📝 Nhật Ký Sự Kiện</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 5 }} nestedScrollEnabled={true}>
            {khayMenuPhu === 'HO_SO' && (
              <View>
                {/* KHỐI 1: THÔNG TIN CHUNG CỦA NÁI ĐÃ ĐƯỢC ÉP BỐC ĐÚNG DATA ĐỒNG BỘ REALTIME */}
                <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e9ecef' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
                    <Text style={{ fontSize: 13, color: '#6c757d', fontWeight: '500' }}>Giống Heo Nái</Text>
                    <Text style={{ fontSize: 13, color: '#111111', fontWeight: 'bold' }}>{duLieuNaiMoiNhatRealTime?.giong || "---"}</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
                    <Text style={{ fontSize: 13, color: '#6c757d', fontWeight: '500' }}>Lứa hiện tại</Text>
                    <Text style={{ fontSize: 13, color: '#e83e8c', fontWeight: 'bold' }}>{duLieuNaiMoiNhatRealTime?.lua || duLieuNaiMoiNhatRealTime?.luaHienThiThongMinh || "Hậu bị"}</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                    <Text style={{ fontSize: 13, color: '#6c757d', fontWeight: '500' }}>Trạng Thái Hiện Tại</Text>
                    <Text style={{ 
                      fontSize: 13, 
                      fontWeight: 'bold',
                      color: laNaiMangBau ? '#007bff' : (laNaiNuoiCon ? '#28a745' : (laNaiDaThai ? '#dc3545' : '#e65100'))
                    }}>
                      {laNaiMangBau ? "Đang Bầu" : (laNaiNuoiCon ? "Đang Đẻ" : (laNaiDaThai ? "Đã Thải Loại ❌" : "Theo Dõi 📋"))}
                    </Text>
                  </View>
                </View>

                {/* KHỐI 2: CHI TIẾT THEO DÕI ĐỘNG CHO NHÓM MANG THAI */}
                {laNaiMangBau && (
                  <View style={{ backgroundColor: '#fffaf5', borderRadius: 8, padding: 12, marginBottom: 5, borderWidth: 1, borderColor: '#ffd3b6' }}>
                    {(() => {
                      const lichSuModal = Array.isArray(danhSachLichSu) ? danhSachLichSu.filter(sk => sk && sk.maTai && sk.maTai.toString().toUpperCase().trim() === maTaiModal && sk.actionType !== "delete") : [];
                      lichSuModal.sort((a, b) => (parseToDateObject(b.ngay)?.getTime() || 0) - (parseToDateObject(a.ngay)?.getTime() || 0));
                      let ngayPhoiThucTeOutside = "---";
                      if (lichSuModal.length > 0 && lichSuModal[0] && lichSuModal[0].suKien === "Phối") { ngayPhoiThucTeOutside = lichSuModal[0].ngay || "---"; } 
                      else { ngayPhoiThucTeOutside = duLieuNaiMoiNhatRealTime?.ngayPhoiDong || duLieuNaiMoiNhatRealTime?.ngayCotI || "---"; }
                      global.tinhToanModalBauTmp = { ngayPhoi: ngayPhoiThucTeOutside, ngayDuKien: duLieuNaiMoiNhatRealTime?.ngayDuKienDeMoi || "---" };
                      return null;
                    })()}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ffe5d4' }}>
                      <Text style={{ fontSize: 13, color: '#555555' }}>Ngày Phối Giống</Text>
                      <Text style={{ fontSize: 13, color: '#111111', fontWeight: '600' }}>{epNgayChuanVietNam(global.tinhToanModalBauTmp?.ngayPhoi)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ffe5d4' }}>
                      <Text style={{ fontSize: 13, color: '#555555' }}>Ngày Dự Kiến Đẻ</Text>
                      <Text style={{ fontSize: 13, color: '#28a745', fontWeight: 'bold' }}>{epNgayChuanVietNam(global.tinhToanModalBauTmp?.ngayDuKien)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ffe5d4' }}>
                      <Text style={{ fontSize: 13, color: '#555555' }}>Thời Gian Bầu (Ngày)</Text>
                      <Text style={{ fontSize: 13, color: '#007bff', fontWeight: 'bold' }}>
                        {(() => {
                          const ngayPhoiGoc = parseToDateObject(global.tinhToanModalBauTmp?.ngayPhoi); if (!ngayPhoiGoc) return "---";
                          const dNay = new Date(); dNay.setHours(0, 0, 0, 0);
                          const soNgayBauModal = Math.round((dNay.getTime() - ngayPhoiGoc.getTime()) / 86400000);
                          return soNgayBauModal <= 0 ? "Mới Phối ✨" : `${soNgayBauModal} ngày`;
                        })()}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingVertical: 6 }}>
                      <Text style={{ fontSize: 13, color: '#555555' }}>Thời Gian Bầu (Tuần)</Text>
                      <Text style={{ fontSize: 13, color: '#007bff', fontWeight: 'bold' }}>
                        {(() => {
                          const ngayPhoiGoc = parseToDateObject(global.tinhToanModalBauTmp?.ngayPhoi); if (!ngayPhoiGoc) return "---";
                          const dNay = new Date(); dNay.setHours(0, 0, 0, 0);
                          const soNgayBauModal = Math.round((dNay.getTime() - ngayPhoiGoc.getTime()) / 86400000);
                          const soTuanBauModal = Math.floor(soNgayBauModal / 7);
                          return soNgayBauModal <= 0 || soTuanBauModal === 0 ? "Mới Phối ✨" : `${soTuanBauModal} tuần`;
                        })()}
                      </Text>
                    </View>
                  </View>
                )}
                {/* KHỐI 3: CHÚ Ý CHO NHÓM CHƯA PHỐI THEO DÕI */}
                {laNaiTheoDoi && (
                  <View style={{ paddingVertical: 12, backgroundColor: '#fff3cd', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ffeeba', marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, color: '#856404', fontWeight: 'bold', textAlign: 'center', lineHeight: 18 }}>Chú ý: Heo nái đang theo dõi chu kỳ cách ly. Hãy chú ý thời mốc lên giống tiếp theo để phối kịp thời!</Text>
                  </View>
                )}

                {/* KHỐI 4: CHI TIẾT SẢN XUẤT CHO NHÓM NUÔI CON */}
                {laNaiNuoiCon && (
                  <View style={{ backgroundColor: '#f4fbf7', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#c3e6cb' }}>
                    {(() => {
                      const mangLichSuDe = Array.isArray(danhSachLichSu) ? danhSachLichSu.filter(i => i && i.maTai && i.maTai.toString().toUpperCase().trim() === maTaiModal && i.suKien === "Đẻ" && i.actionType !== "delete") : [];
                      mangLichSuDe.sort((a, b) => (parseToDateObject(b.ngay)?.getTime() || 0) - (parseToDateObject(a.ngay)?.getTime() || 0));
                      const skDeGanNhat = mangLichSuDe.length > 0 ? mangLichSuDe[0] : null;
                      global.soLieuNuoiConRamTmp = {
                        ngayDe: duLieuNaiMoiNhatRealTime?.ngayDeDongThoiGianThuc || (skDeGanNhat ? skDeGanNhat.ngay : "---"),
                        soHeoCon: skDeGanNhat ? String(skDeGanNhat.soHeo) : "0",
                        khoThai: skDeGanNhat ? String(skDeGanNhat.khoThai) : "0",
                        coiCoc: skDeGanNhat ? String(skDeGanNhat.coiCoc) : "0",
                        chetNgop: skDeGanNhat ? String(skDeGanNhat.chetNgop) : "0",
                        chonNuoi: skDeGanNhat ? String(skDeGanNhat.chonNuoi) : "0"
                      };
                      return null;
                    })()}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#d4edda' }}>
                      <Text style={{ fontSize: 13, color: '#555555' }}>Ngày Đẻ Thực Tế</Text>
                      <Text style={{ fontSize: 13, color: '#111111', fontWeight: '600' }}>{epNgayChuanVietNam(global.soLieuNuoiConRamTmp?.ngayDe)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#d4edda' }}>
                      <Text style={{ fontSize: 13, color: '#555555' }}>Tổng Số Heo Sơ Sinh</Text>
                      <Text style={{ fontSize: 13, color: '#28a745', fontWeight: 'bold' }}>{global.soLieuNuoiConRamTmp?.soHeoCon} con</Text>
                    </View>
                    <View style={{ backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, marginTop: 4, marginBottom: 4, borderWidth: 0.5, borderColor: '#dee2e6' }}>
                      <Text style={{ fontSize: 12, color: '#666666', lineHeight: 18 }}>Khô thai: {global.soLieuNuoiConRamTmp?.khoThai} | Còi: {global.soLieuNuoiConRamTmp?.coiCoc} | Ngộp: {global.soLieuNuoiConRamTmp?.chetNgop}</Text>
                      <Text style={{ fontSize: 12, color: '#111111', fontWeight: 'bold', marginTop: 5 }}>Chọn Nuôi Thực Tế: <Text style={{ color: '#28a745' }}>{global.soLieuNuoiConRamTmp?.chonNuoi} con</Text></Text>
                    </View>
                  </View>
                )}

                {laNaiDaThai && (
                  <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#dee2e6' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
                      <Text style={{ fontSize: 13, color: '#555555' }}>Ngày Đẻ Thực Tế</Text>
                      <Text style={{ fontSize: 13, color: '#6c757d', fontWeight: 'bold' }}>{epNgayChuanVietNam(global.soLieuNuoiConRamTmp?.ngayDe || duLieuNaiMoiNhatRealTime?.ngayDeCotJ)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
                      <Text style={{ fontSize: 13, color: '#555555' }}>Ngày Cai Sữa</Text>
                      <Text style={{ color: '#6c757d', fontSize: 13, fontWeight: 'bold' }}>{epNgayChuanVietNam(duLieuNaiMoiNhatRealTime?.ngayCaiSuaCotKhat)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                      <Text style={{ fontSize: 13, color: '#555555' }}>Tháng Đẻ Ghi Nhận</Text>
                      <Text style={{ fontSize: 13, color: '#111111', fontWeight: '600' }}>{duLieuNaiMoiNhatRealTime?.thangDeCotK || "---"}</Text>
                    </View>
                  </View>
                )}

                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#495057', marginTop: 10, marginBottom: 8 }}>📜 LỊCH SỬ CÁC LỨA ĐÃ ĐẺ THÀNH CÔNG</Text>
                {(() => {
                  const lichSuDeGopOffline = danhSachDangDe.filter(heo => (heo.maTai || "").toString().toUpperCase().trim() === maTaiModal && maTaiModal !== "").sort((a, b) => Number(b.luaDe || 0) - Number(a.luaDe || 0));
                  if (lichSuDeGopOffline.length === 0) { return <View style={{ padding: 12, backgroundColor: '#fcfcfc', borderRadius: 8, borderWidth: 1, borderColor: '#eaeaea' }}><Text style={{ fontSize: 12, color: '#95a5a6', textAlign: 'center', fontStyle: 'italic' }}>Chưa ghi nhận dữ liệu lịch sử lứa đẻ nào cho mã tai này.</Text></View>; }
                  return lichSuDeGopOffline.map((item, index) => (
                    <View key={`hist_farr_${index}`} style={{ backgroundColor: '#ffffff', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eef2f5', flexDirection: 'row', overflow: 'hidden' }}>
                      <View style={{ width: 4, backgroundColor: '#ced4da' }} />
                      <View style={{ flex: 1, padding: 12 }}>
                       <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
  <Text style={{ fontSize: 12, fontWeight: '700', color: '#495057' }}>Lứa đẻ: {item.luaDe || "---"}</Text>
  <Text style={{ fontSize: 11, color: '#6c757d' }}>Ngày đẻ: {epNgayChuanVietNam(item.ngayDe)}</Text>
</View>
                     <View style={{ backgroundColor: '#f8f9fa', borderRadius: 6, padding: 8, borderWidth: 0.5, borderColor: '#eee' }}>
  <Text style={{ fontSize: 11, color: '#666666', lineHeight: 18 }}>Sơ sinh sống: <Text style={{ fontWeight: '700', color: '#28a745' }}>{item.soHeoCon || "0"}</Text> con | Khô: {item.khoThai || 0} | Còi: {item.coiCoc || 0} | Ngộp: {item.chetNgop || 0}</Text>
  <Text style={{ fontSize: 11, color: '#111111', fontWeight: 'bold', marginTop: 4 }}>Chọn Nuôi: <Text style={{ color: '#28a745' }}>{item.chonNuoi || 0} con</Text></Text>
  
  {/* 🌟 PHÂN KHU KHÔI PHỤC: Hiện rõ ràng Ngày Cai Sữa và Số Ngày Nuôi Con của từng lứa đẻ cũ */}
  {item.ngayCaiSua && item.ngayCaiSua !== "" && item.ngayCaiSua !== "---" && (
    <View style={{ borderTopWidth: 0.5, borderTopColor: '#dee2e6', marginTop: 6, paddingTop: 6 }}>
      <Text style={{ fontSize: 11, color: '#2c3e50', fontWeight: '500' }}>Số Con Cai Sữa Đạt: <Text style={{ fontWeight: '700', color: '#007bff' }}>{item.soConCaiSua || "0"} con</Text></Text>
      <Text style={{ fontSize: 11, color: '#6c757d', marginTop: 2 }}>Ngày cai sữa: <Text style={{ color: '#111111', fontWeight: '500' }}>{epNgayChuanVietNam(item.ngayCaiSua)}</Text></Text>
      {item.soNgay && item.soNgay !== "0" && <Text style={{ fontSize: 11, color: '#007bff', fontWeight: '600', marginTop: 2 }}>Nuôi con: {item.soNgay} ngày</Text>}
      {item.ghiChuCaiSua ? <Text style={{ fontSize: 11, color: '#6c757d', fontStyle: 'italic', marginTop: 4 }}>Ghi chú cai sữa: {item.ghiChuCaiSua}</Text> : null}
    </View>
  )}
</View>

                      </View>
                    </View>
                  ));
                })()}
              </View>
            )}
            {/* ─── VÁCH 2: NHẬT KÝ SỰ KIỆN GÔM HOÀN TOÀN TỪ TAB 1 ─── */}
            {khayMenuPhu === 'SUNG_KIEN' && (
              <View style={{ paddingBottom: 10 }}>
                {(() => {
                 const mangSuKienNaiLocDuoc = Array.isArray(danhSachLichSu) ? danhSachLichSu.filter(i => i && i.maTai && i.maTai.toString().toUpperCase().trim() === maTaiModal && i.actionType !== "delete") : [];
                  
                  mangSuKienNaiLocDuoc.sort((a, b) => (parseToDateObject(a.ngay)?.getTime() || 0) - (parseToDateObject(b.ngay)?.getTime() || 0));

                  if (mangSuKienNaiLocDuoc.length === 0) {
                    return (
                      <View style={{ padding: 25, backgroundColor: '#fdfdfd', borderRadius: 10, borderWidth: 1, borderColor: '#eef2f5', alignItems: 'center', justifyContent: 'center', marginTop: 5 }}>
                        <Text style={{ fontSize: 13, color: '#95a5a6', fontStyle: 'italic', textAlign: 'center' }}>Nái chưa phát sinh sự kiện gieo tinh, sơ sinh hay vắc-xin nào ở Tab 1.</Text>
                      </View>
                    );
                  }

                 return mangSuKienNaiLocDuoc.map((skRow, sIdx) => {
                    const tenSk = (skRow.suKien || "---").toString().trim();
                    const laPhoi = tenSk.includes("Phối") || tenSk.includes("PHOI");
                    const laDe = tenSk.includes("Đẻ") || tenSk.includes("DE");
                    const laCaiSua = tenSk.includes("Cai Sữa") || tenSk.includes("CAI");

                    return (
                      <View 
                        key={`popup_log_row_${sIdx}`}
                        style={{ 
                          backgroundColor: '#ffffff', 
                          borderWidth: 0.8, 
                          borderColor: '#e9ecef', 
                          borderRadius: 10, 
                          padding: 10, 
                          marginBottom: 8,
                          flexDirection: 'row',
                          alignItems: 'center'
                        }}
                      >
                     {/* 📅 CỘT TRÁI: ĐƠN GIẢN HÓA - CHỈ HIỂN THỊ DUY NHẤT 1 DÒNG NGÀY THÁNG CĂNG PHẲNG */}
<View style={{ width: '36%', borderRightWidth: 1.2, borderRightColor: '#f1f3f5', paddingRight: 4, justifyContent: 'center' }}>
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1a1f23', textAlign: 'left' }} numberOfLines={1}>
                            {epNgayChuanVietNam(skRow.ngay)}
                          </Text>
                        </View>


                        {/* 🛠️ CỘT PHẢI: Tên sự kiện nghiệp vụ và chi tiết thông số sản xuất */}
                        <View style={{ flex: 1, paddingLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <View style={{ backgroundColor: laPhoi ? '#e7f1ff' : (laDe ? '#eafaf1' : '#f8f9fa'), paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                              <Text style={{ fontSize: 11, fontWeight: '900', color: laPhoi ? '#007bff' : (laDe ? '#28a745' : '#495057'), letterSpacing: 0.2 }}>
                                {tenSk.toUpperCase()}
                              </Text>
                            </View>
                            {skRow.syncStatus === "waiting" && (
                              <Text style={{ fontSize: 9.5, color: '#e65100', fontStyle: 'italic', fontWeight: '600' }}>Ghi tạm...</Text>
                            )}
                          </View>
                          
                          {laDe && (skRow.soHeo || skRow.chonNuoi) ? (
                            <Text style={{ fontSize: 11.5, color: '#333333', fontWeight: '500', marginBottom: 2 }}>
                              Sơ sinh: <Text style={{ color: '#28a745', fontWeight: 'bold' }}>{skRow.soHeo || "0"}</Text> con | Nuôi: <Text style={{ color: '#28a745', fontWeight: 'bold' }}>{skRow.chonNuoi || "0"}</Text> con
                            </Text>
                          ) : null}

                          {laCaiSua && skRow.soHeo ? (
                            <Text style={{ fontSize: 11.5, color: '#333333', fontWeight: '500', marginBottom: 2 }}>
                              Cai sữa đạt: <Text style={{ color: '#fd7e14', fontWeight: 'bold' }}>{skRow.soHeo}</Text> con
                            </Text>
                          ) : null}

                          {skRow.ghiChu ? (
                            <Text style={{ fontSize: 11, color: '#7f8c8d', fontStyle: 'italic' }} numberOfLines={1}>
                              📝 {skRow.ghiChu}
                            </Text>
                          ) : null}
                        </View>

                      </View>
                    );
                  });
                })()}
              </View>
            )}
          </ScrollView>

          <View style={{ marginTop: 15, borderTopWidth: 1, borderTopColor: '#f1f2f6', paddingTop: 12 }}>
            <TouchableOpacity onPress={() => { setKhayMenuPhu('HO_SO'); onClose(); }} activeOpacity={0.7} style={{ backgroundColor: '#6c757d', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>ĐÓNG CỬA SỔ XEM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SowDetailModal;
