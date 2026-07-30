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

  const epNgayChuanVietNam = (str) => {
    if (!str || str.toString().trim() === "" || str.toString().trim() === "---") return "---";
    let s = str.toString().trim();
    if (s.includes('/') && s.split('/').length === 3) return s.substring(0, 10);
    const d = new Date(s);
    if (isNaN(d.getTime())) return s.substring(0, 10);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const maTaiModal = selectedHeoDetail?.maTai?.toString().toUpperCase().trim() || "";

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.popupCard, { width: '92%', maxHeight: '85%' }]}>
          <Text style={[styles.popupTitle, { fontSize: 16, color: '#007bff', marginBottom: 5, fontWeight: 'bold', textAlign: 'center' }]}>
            CHI TIẾT HEO NÁI: {selectedHeoDetail?.maTai}
          </Text>
          
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
            
            {/* KHỐI 1: THÔNG TIN CHUNG CỦA NÁI */}
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
                <Text style={{ fontSize: 13, color: '#e65100', fontWeight: 'bold' }}>
                  {selectedHeoDetail?.trangThaiDienThoai || "Chờ Phối"}
                </Text>
              </View>
            </View>

            {/* KHỐI 2: CHI TIẾT THEO DÕI ĐỘNG CHO NHÓM MANG THAI */}
            {nhomNaiTab2 === 'Phoi' && (
              <View style={{ backgroundColor: '#fffaf5', borderRadius: 8, padding: 12, marginBottom: 5, borderWidth: 1, borderColor: '#ffd3b6' }}>
                {(() => {
                  const lichSuModal = Array.isArray(danhSachLichSu)
                    ? danhSachLichSu.filter(sk => sk && sk.maTai && sk.maTai.toString().toUpperCase().trim() === maTaiModal && sk.actionType !== "delete")
                    : [];

                  lichSuModal.sort((a, b) => (parseToDateObject(b.ngay)?.getTime() || 0) - (parseToDateObject(a.ngay)?.getTime() || 0));

                  let ngayPhoiThucTeOutside = "---";
                  if (lichSuModal.length > 0 && lichSuModal[0] && lichSuModal[0].suKien === "Phối") {
                    ngayPhoiThucTeOutside = lichSuModal[0].ngay || "---";
                  } else {
                    ngayPhoiThucTeOutside = selectedHeoDetail?.ngayPhoiDong || selectedHeoDetail?.ngayCotI || "---";
                  }

                  global.tinhToanModalBauTmp = {
                    ngayPhoi: ngayPhoiThucTeOutside,
                    ngayDuKien: selectedHeoDetail?.ngayDuKienDeMoi || "---"
                  };
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
                      const ngayPhoiGoc = parseToDateObject(global.tinhToanModalBauTmp?.ngayPhoi);
                      if (!ngayPhoiGoc) return "---";
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
                      const ngayPhoiGoc = parseToDateObject(global.tinhToanModalBauTmp?.ngayPhoi);
                      if (!ngayPhoiGoc) return "---";
                      const dNay = new Date(); dNay.setHours(0, 0, 0, 0);
                      const soNgayBauModal = Math.round((dNay.getTime() - ngayPhoiGoc.getTime()) / 86400000);
                      const soTuanBauModal = Math.floor(soNgayBauModal / 7);
                      return soNgayBauModal <= 0 || soTuanBauModal === 0 ? "Mới Phối ✨" : `${soTuanBauModal} tuần`;
                    })()}
                  </Text>
                </View>
              </View>
            )}
            {/* KHỐI 3: CHÚ Ý CHO NHÓM CHƯA PHỐI */}
            {nhomNaiTab2 === 'Cho Phoi' && (
              <View style={{ paddingVertical: 12, backgroundColor: '#fff3cd', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ffeeba' }}>
                <Text style={{ fontSize: 13, color: '#856404', fontWeight: 'bold', textAlign: 'center', lineHeight: 18 }}>
                  Chú ý: Heo nái chờ phối. Hãy theo dõi chu kỳ lên giống để phối kịp thời!
                </Text>
              </View>
            )}

            {/* KHỐI 4: CHI TIẾT SẢN XUẤT CHO NHÓM NUÔI CON */}
            {nhomNaiTab2 === 'De' && (
              <View style={{ backgroundColor: '#f4fbf7', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#c3e6cb' }}>
                
                {/* 🧠 ĐỘT PHÁ: Quét trực tiếp lịch sử Đẻ từ Nhật ký sự kiện ngoài RAM giống hệt Tab Đang Đẻ */}
                {(() => {
                  const mangLichSuDe = Array.isArray(danhSachLichSu)
                    ? danhSachLichSu.filter(i => i && i.maTai && i.maTai.toString().toUpperCase().trim() === maTaiModal && i.suKien === "Đẻ" && i.actionType !== "delete")
                    : [];

                  mangLichSuDe.sort((a, b) => {
                    const timeA = parseToDateObject(a.ngay) ? parseToDateObject(a.ngay).getTime() : 0;
                    const timeB = parseToDateObject(b.ngay) ? parseToDateObject(b.ngay).getTime() : 0;
                    return timeB - timeA;
                  });

                  const skDeGanNhat = mangLichSuDe.length > 0 ? mangLichSuDe[0] : null;

                  global.soLieuNuoiConRamTmp = {
                    ngayDe: selectedHeoDetail?.ngayDeDongThoiGianThuc || (skDeGanNhat ? skDeGanNhat.ngay : "---"),
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
                  <Text style={{ fontSize: 12, color: '#666666', lineHeight: 18 }}>
                    Khô thai: {global.soLieuNuoiConRamTmp?.khoThai} | Còi: {global.soLieuNuoiConRamTmp?.coiCoc} | Ngộp: {global.soLieuNuoiConRamTmp?.chetNgop}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#111111', fontWeight: 'bold', marginTop: 5 }}>
                    Chọn Nuôi Thực Tế: <Text style={{color:'#28a745'}}>{global.soLieuNuoiConRamTmp?.chonNuoi} con</Text>
                  </Text>
                </View>

               
              </View>
            )}
            {/* KHỐI 5: CHI TIẾT SẢN XUẤT CHO NHÓM HEO ĐÃ THẢI */}
            {nhomNaiTab2 === 'Thai' && (
              <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#dee2e6' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#dee2e6' }}>
                  <Text style={{ fontSize: 13, color: '#555555' }}>Ngày Đẻ Thực Tế</Text>
                  <Text style={{ fontSize: 13, color: '#6c757d', fontWeight: 'bold' }}>{epNgayChuanVietNam(global.soLieuNuoiConRamTmp?.ngayDe || selectedHeoDetail?.ngayDeCotJ)}</Text>
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

            {/* 📜 KHỐI LỊCH SỬ CÁC LỨA ĐÃ ĐẺ THÀNH CÔNG */}
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#495057', marginTop: 10, marginBottom: 8 }}>📜 LỊCH SỬ CÁC LỨA ĐÃ ĐẺ THÀNH CÔNG</Text>
            
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
                  const maTaiKhachChon = maTaiModal;
                  const maTaiTuSheet = (heo.maTai || "").toString().toUpperCase().trim();
                  return maTaiTuSheet === maTaiKhachChon && maTaiKhachChon !== "";
                })
                .sort((a, b) => Number(b.luaDe || 0) - Number(a.luaDe || 0));

              if (lichSuDeGopOffline.length === 0) {
                return (
                  <View style={{ padding: 12, backgroundColor: '#fcfcfc', borderRadius: 8, borderWidth: 1, borderColor: '#eaeaea' }}>
                    <Text style={{ fontSize: 12, color: '#95a5a6', textAlign: 'center', fontStyle: 'italic' }}>Chưa ghi nhận dữ liệu lịch sử lứa đẻ nào cho mã tai này.</Text>
                  </View>
                );
              }

              return lichSuDeGopOffline.map((item, index) => (
                <View key={index} style={{ backgroundColor: '#ffffff', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eef2f5', flexDirection: 'row', overflow: 'hidden' }}>
                  <View style={{ width: 4, backgroundColor: '#ced4da' }} />
                  
                  <View style={{ flex: 1, padding: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#495057' }}>Lứa đẻ: {item.luaDe || "---"}</Text>
                      <Text style={{ fontSize: 11, color: '#6c757d' }}>Ngày đẻ: {epNgayTuongMinh(item.ngayDe)}</Text>
                    </View>

                    <View style={{ backgroundColor: '#f8f9fa', borderRadius: 6, padding: 8, borderWidth: 0.5, borderColor: '#eee' }}>
                      <Text style={{ fontSize: 11, color: '#666666', lineHeight: 18 }}>
                        Sơ sinh sống: <Text style={{fontWeight:'700', color:'#28a745'}}>{item.soHeoCon || "0"}</Text> con | Khô: {item.khoThai || 0} | Còi: {item.coiCoc || 0} | Ngộp: {item.chetNgop || 0}
                      </Text>
                      
                      <Text style={{ fontSize: 11, color: '#111111', fontWeight: 'bold', marginTop: 4 }}>
                        Chọn Nuôi: <Text style={{color:'#28a745'}}>{item.chonNuoi || 0} con</Text>
                      </Text>

                      {item.ngayCaiSua && item.ngayCaiSua !== "" && item.ngayCaiSua !== "---" ? (
                        <View style={{ borderTopWidth: 0.5, borderTopColor: '#dee2e6', marginTop: 6, paddingTop: 6 }}>
                          <Text style={{ fontSize: 11, color: '#2c3e50', fontWeight: '500' }}>
                            Số Con Cai Sữa Đạt: <Text style={{ fontWeight: '700', color: '#007bff' }}>{item.soConCaiSua || "0"} con</Text>
                          </Text>
                          <Text style={{ fontSize: 11, color: '#6c757d', marginTop: 2 }}>
                            Ngày cai sữa: <Text style={{ color: '#111111', fontWeight: '500' }}>{epNgayTuongMinh(item.ngayCaiSua)}</Text>
                          </Text>
                          {item.soNgay && item.soNgay !== "0" ? (
                            <Text style={{ fontSize: 11, color: '#007bff', fontWeight: '600', marginTop: 2 }}>Nuôi con: {item.soNgay} ngày</Text>
                          ) : null}
                          {item.ghiChuCaiSua ? <Text style={{ fontSize: 11, color: '#6c757d', fontStyle: 'italic', marginTop: 4 }}>Ghi chú cai sữa: {item.ghiChuCaiSua}</Text> : null}
                        </View>
                      ) : null}
                    </View>

                    {item.ghiChuDe ? <Text style={{ fontSize: 11, color: '#6c757d', fontStyle: 'italic', marginTop: 6 }}>Ghi chú đẻ: {item.ghiChuDe}</Text> : null}
                  </View>
                </View>
              ));
            })()}
          </ScrollView>

          <View style={{ marginTop: 15, borderTopWidth: 1, borderTopColor: '#f1f2f6', paddingTop: 12 }}>
            <TouchableOpacity 
              onPress={onClose} 
              activeOpacity={0.7}
              style={{ backgroundColor: '#6c757d', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>ĐÓNG CỬA SỔ XEM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SowDetailModal;
