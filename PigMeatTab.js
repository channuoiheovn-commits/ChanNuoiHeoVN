import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

const PigMeatTab = ({ 
  currentTab, 
  styles, 
  dataHeoThit, 
  danhSachLichSu, 
  lichSuHeoThit, 
  lichSuHeo, 
  historyData, 
  dataLichSu, 
  openGiaiDoan, 
  setOpenGiaiDoan, 
  handleMoModalHeoThit, 
  handleMoSuaHeoThit, 
  handleXoaXoaNhatKyChuDong, 
  handleXoaNhatKyChuDong 
}) => {
  if (currentTab !== 'heo_thit') return null;

  // Gom mảng lịch sử biến động toàn cục ngoài RAM lán trại để nuôi khay Nhật ký ở đáy file
  const mangLichSuGocRealTime = Array.isArray(danhSachLichSu) ? danhSachLichSu : 
                                (Array.isArray(lichSuHeoThit) ? lichSuHeoThit : 
                                (Array.isArray(lichSuHeo) ? lichSuHeo : 
                                (Array.isArray(historyData) ? historyData : 
                                (Array.isArray(dataLichSu) ? dataLichSu : []))));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 12, paddingBottom: 120 }}>
      {/* 📊 KHỐI THIẾT KẾ BỘ 3 NÚT BIẾN ĐỘNG MẶT TIỀN */}
      <View style={{ marginBottom: 12, backgroundColor: '#fafbfc', borderWidth: 1, borderColor: '#eef2f5', padding: 10, borderRadius: 12 }}>
        <Text style={{ fontSize: 11.5, color: '#555555', fontWeight: 'bold', marginBottom: 8, letterSpacing: 0.3 }}>Nhập chính xác ngày thực hiện, Hệ thống sẽ tự động tính theo thời gian.</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity activeOpacity={0.6} onPress={() => handleMoModalHeoThit('Nhập Đàn')} style={{ flex: 1, backgroundColor: '#007bff', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12.5 }}>Nhập Đàn</Text></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6} onPress={() => handleMoModalHeoThit('Hao Hụt')} style={{ flex: 1, backgroundColor: '#dc3545', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12.5 }}>Hao Hụt</Text></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6} onPress={() => handleMoModalHeoThit('Bán')} style={{ flex: 1, backgroundColor: '#28a745', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12.5 }}>Bán Heo</Text></TouchableOpacity>
        </View>
      </View>
      {dataHeoThit ? (() => {
        const laySoTho = (val) => (!val || isNaN(val.toString().trim()) || val.toString().trim() === "") ? 0 : Number(val.toString().trim());

        const khoRealTime = {};
        
        // Cộng dồn mỏ neo 3 tuần và 4 tuần cai sữa từ mảng ngang máy chủ đẩy về
        khoRealTime["caiSua"] = laySoTho(dataHeoThit.caiSua) || laySoTho(dataHeoThit.caiSua3Tuan) || laySoTho(dataHeoThit["4 Tuần"]) || 0; 

        // Nhận dứt điểm mã hóa không dấu chuẩn mạng của bạn
        khoRealTime["t5"] = laySoTho(dataHeoThit.t5) || laySoTho(dataHeoThit["5 Tuần"]);
        khoRealTime["t6"] = laySoTho(dataHeoThit.t6) || laySoTho(dataHeoThit["6 Tuần"]);
        khoRealTime["t7"] = laySoTho(dataHeoThit.t7) || laySoTho(dataHeoThit["7 Tuần"]);
        khoRealTime["t8"] = laySoTho(dataHeoThit.t8) || laySoTho(dataHeoThit["8 Tuần"]);
        khoRealTime["t9"] = laySoTho(dataHeoThit.t9) || laySoTho(dataHeoThit["9 Tuần"]);
        khoRealTime["t10"] = laySoTho(dataHeoThit.t10) || laySoTho(dataHeoThit["10 Tuần"]);
        khoRealTime["t11"] = laySoTho(dataHeoThit.t11) || laySoTho(dataHeoThit["11 Tuần"]);
        khoRealTime["t12"] = laySoTho(dataHeoThit.t12) || laySoTho(dataHeoThit["12 Tuần"]);
        khoRealTime["t13"] = laySoTho(dataHeoThit.t13) || laySoTho(dataHeoThit["13 Tuần"]);
        khoRealTime["t14"] = laySoTho(dataHeoThit.t14) || laySoTho(dataHeoThit["14 Tuần"]);
        khoRealTime["t15"] = laySoTho(dataHeoThit.t15) || laySoTho(dataHeoThit["15 Tuần"]);
        khoRealTime["t16"] = laySoTho(dataHeoThit.t16) || laySoTho(dataHeoThit["16 Tuần"]);
        khoRealTime["t17"] = laySoTho(dataHeoThit.t17) || laySoTho(dataHeoThit["17 Tuần"]);
        khoRealTime["t18"] = laySoTho(dataHeoThit.t18) || laySoTho(dataHeoThit["18 Tuần"]);
        khoRealTime["t19"] = laySoTho(dataHeoThit.t19) || laySoTho(dataHeoThit["19 Tuần"]);
        khoRealTime["t20"] = laySoTho(dataHeoThit.t20) || laySoTho(dataHeoThit["20 Tuần"]);
        khoRealTime["t21"] = laySoTho(dataHeoThit.t21) || laySoTho(dataHeoThit["21 Tuần"]);
        khoRealTime["t22"] = laySoTho(dataHeoThit.t22) || laySoTho(dataHeoThit["22 Tuần"]);
        khoRealTime["t23"] = laySoTho(dataHeoThit.t23) || laySoTho(dataHeoThit["23 Tuần"]);
        khoRealTime["t24"] = laySoTho(dataHeoThit.t24) || laySoTho(dataHeoThit["24 Tuần"]);
        khoRealTime["t25"] = laySoTho(dataHeoThit.t25) || laySoTho(dataHeoThit["25 Tuần"]);
        khoRealTime["t26"] = laySoTho(dataHeoThit.t26) || laySoTho(dataHeoThit["26 Tuần"]);
        khoRealTime["t27"] = laySoTho(dataHeoThit.t27) || laySoTho(dataHeoThit["27 Tuần"]);
        khoRealTime["t28"] = laySoTho(dataHeoThit.t28) || laySoTho(dataHeoThit["28 Tuần"]);
        khoRealTime["t29"] = laySoTho(dataHeoThit.t29) || laySoTho(dataHeoThit["29 Tuần"]);
        khoRealTime["t30"] = laySoTho(dataHeoThit.t30) || laySoTho(dataHeoThit["30 Tuần"]);

        const soHeoTheoMeGoc = laySoTho(dataHeoThit.theoMe) || laySoTho(dataHeoThit["Theo Mẹ"]) || 0;

        const tGd3 = khoRealTime["t5"] + khoRealTime["t6"] + khoRealTime["t7"] + khoRealTime["t8"] + khoRealTime["t9"];
        const tGd4 = khoRealTime["t10"] + khoRealTime["t11"] + khoRealTime["t12"] + khoRealTime["t13"] + khoRealTime["t14"] + khoRealTime["t15"];
        const tGd5 = khoRealTime["t16"] + khoRealTime["t17"] + khoRealTime["t18"] + khoRealTime["t19"] + khoRealTime["t20"];
        const tGd6 = khoRealTime["t21"] + khoRealTime["t22"] + khoRealTime["t23"] + khoRealTime["t24"] + khoRealTime["t25"];
        const tGd7 = khoRealTime["t26"] + khoRealTime["t27"] + khoRealTime["t28"] + khoRealTime["t29"] + khoRealTime["t30"];

        const tongQuanSoHeoThit = soHeoTheoMeGoc + khoRealTime["caiSua"] + tGd3 + tGd4 + tGd5 + tGd6 + tGd7;
        // 🎯 ĐÃ VÁ LỖI HIỂN THỊ LƯỚI Ô CON: Dịch chuẩn xác chuỗi tiếng Việt chữ sang dạng "t5", "t6"... để nhặt trúng số đầu lợn ngoài RAM
        const renderGrid = (tuanArray, key) => (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
            {tuanArray.map((t, idx) => {
              const maTuanKhongDau = "t" + t.replace(/\D/g, '');
              const soC = khoRealTime[maTuanKhongDau] || 0;
              return (
                <View key={`${key}_g_${idx}`} style={{ width: '23.8%', height: 42, backgroundColor: '#ffffff', borderWidth: 1, borderColor: (key.includes('red')) ? '#f5c6cb' : '#dee2e6', borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '900' }}>Tuần {t.replace(/\D/g, '')}</Text>
                  <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: soC > 0 ? (key.includes('red') ? '#c82333' : '#137333') : '#a0a0a0' }}>{soC} Con</Text>
                </View>
              );
            })}
          </View>
        );

        return (
          <View style={{ width: '100%' }}>
            {/* Banner tổng quân số thời gian thực */}
            <View style={{ marginBottom: 12, backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212529' }}>Tổng Số Heo Thịt:</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#137333' }}>
                  {" "}
                  {tongQuanSoHeoThit} con
                </Text>
              </View>
             
            </View>
            {/* Bàn cờ các giai đoạn tuổi */}
            <View style={{ backgroundColor: '#ffffff', borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#dee2e6', padding: 10, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fdfdfd', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 14 }}>1. Giai đoạn Theo Mẹ</Text>
                <Text style={{ fontSize: 15, fontWeight: 'bold' }}>{soHeoTheoMeGoc} con</Text>
              </View>

              {/* 🎯 ĐÃ CHỈNH THEO CẬP NHẬT MỚI: Hạ chữ Tuần 3 - Tuần 4 xuống dòng chữ nhỏ màu cam ở dưới đúng chuẩn các khối kia */}
              <View style={{ backgroundColor: '#fffdf9', borderRadius: 8, borderWidth: 1, borderColor: '#ffe0b2', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={{ fontWeight: 'bold', color: '#e65100', fontSize: 14 }}>2. Giai đoạn Cai Sữa</Text>
                  <Text style={{ fontSize: 11, color: '#f57c00', marginTop: 2, fontWeight: '500' }}>Chi tiết: Tuần 3 - Tuần 4</Text>
                </View>
                <Text style={{ color: '#007bff', fontSize: 15, fontWeight: 'bold' }}>{khoRealTime["caiSua"]} con</Text>
              </View>

              {/* Giai đoạn 3 */}
              <View style={{ backgroundColor: '#fffdf9', borderRadius: 8, borderWidth: 1, borderColor: '#ffe0b2', padding: 10 }}>
                <TouchableOpacity onPress={() => setOpenGiaiDoan(prev => ({ ...prev, gd3: !prev.gd3 }))} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={{ fontWeight: 'bold', color: '#e65100', fontSize: 14 }}>3. Giai đoạn: 10 - 30kg</Text>
                    <Text style={{ fontSize: 11, color: '#f57c00', marginTop: 2, fontWeight: '500' }}>Chi tiết: Tuần 5 - Tuần 9</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#007bff', fontSize: 15, fontWeight: 'bold' }}>{tGd3} con</Text>
                    <Text style={{ color: '#e65100', fontSize: 11, fontWeight: 'bold' }}>{openGiaiDoan.gd3 ? "▲" : "▼"}</Text>
                  </View>
                </TouchableOpacity>
                {openGiaiDoan.gd3 && renderGrid(["5 Tuần", "6 Tuần", "7 Tuần", "8 Tuần", "9 Tuần"], "gd3")}
              </View>

              {/* Giai đoạn 4 */}
              <View style={{ backgroundColor: '#fffdf9', borderRadius: 8, borderWidth: 1, borderColor: '#ffe0b2', padding: 10 }}>
                <TouchableOpacity onPress={() => setOpenGiaiDoan(prev => ({ ...prev, gd4: !prev.gd4 }))} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={{ fontWeight: 'bold', color: '#e65100', fontSize: 14 }}>4. Giai đoạn: 30 - 60kg</Text>
                    <Text style={{ fontSize: 11, color: '#f57c00', marginTop: 2, fontWeight: '500' }}>Chi tiết: Tuần 10 - Tuần 15</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#007bff', fontSize: 15, fontWeight: 'bold' }}>{tGd4} con</Text>
                    <Text style={{ color: '#e65100', fontSize: 11, fontWeight: 'bold' }}>{openGiaiDoan.gd4 ? "▲" : "▼"}</Text>
                  </View>
                </TouchableOpacity>
                {openGiaiDoan.gd4 && renderGrid(["10 Tuần", "11 Tuần", "12 Tuần", "13 Tuần", "14 Tuần", "15 Tuần"], "gd4")}
              </View>

              {/* Giai đoạn 5 */}
              <View style={{ backgroundColor: '#fffdf9', borderRadius: 8, borderWidth: 1, borderColor: '#ffe0b2', padding: 10 }}>
                <TouchableOpacity onPress={() => setOpenGiaiDoan(prev => ({ ...prev, gd5: !prev.gd5 }))} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={{ fontWeight: 'bold', color: '#e65100', fontSize: 14 }}>5. Giai đoạn: 60 - 100kg</Text>
                    <Text style={{ fontSize: 11, color: '#f57c00', marginTop: 2, fontWeight: '500' }}>Chi tiết: Tuần 16 - Tuần 20</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#007bff', fontSize: 15, fontWeight: 'bold' }}>{tGd5} con</Text>
                    <Text style={{ color: '#e65100', fontSize: 11, fontWeight: 'bold' }}>{openGiaiDoan.gd5 ? "▲" : "▼"}</Text>
                  </View>
                </TouchableOpacity>
                {openGiaiDoan.gd5 && renderGrid(["16 Tuần", "17 Tuần", "18 Tuần", "19 Tuần", "20 Tuần"], "gd5")}
              </View>
              {/* Giai đoạn 6 */}
              <View style={{ backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#f5c6cb', padding: 10 }}>
                <TouchableOpacity onPress={() => setOpenGiaiDoan(prev => ({ ...prev, gd6: !prev.gd6 }))} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={{ fontWeight: 'bold', color: '#c82333', fontSize: 14 }}>6. Giai đoạn: 100kg - 130kg</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#c82333', fontSize: 16, fontWeight: 'bold' }}>{tGd6} con</Text>
                    <Text style={{ color: '#c82333', fontSize: 11, fontWeight: 'bold' }}>{openGiaiDoan.gd6 ? "▲" : "▼"}</Text>
                  </View>
                </TouchableOpacity>
                {openGiaiDoan.gd6 && renderGrid(["21 Tuần", "22 Tuần", "23 Tuần", "24 Tuần", "25 Tuần"], "gd6_red")}
              </View>

              {/* Giai đoạn 7 */}
              <View style={{ backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#f5c6cb', padding: 10 }}>
                <TouchableOpacity onPress={() => setOpenGiaiDoan(prev => ({ ...prev, gd7: !prev.gd7 }))} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={{ fontWeight: 'bold', color: '#c82333', fontSize: 14 }}>7. Giai đoạn: 130kg - Xuất Chuồng</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#c82333', fontSize: 16, fontWeight: 'bold' }}>{tGd7} con</Text>
                    <Text style={{ color: '#c82333', fontSize: 11, fontWeight: 'bold' }}>{openGiaiDoan.gd7 ? "▲" : "▼"}</Text>
                  </View>
                </TouchableOpacity>
                {openGiaiDoan.gd7 && renderGrid(["26 Tuần", "27 Tuần", "28 Tuần", "29 Tuần", "30 Tuần"], "gd7_red")}
              </View>
            </View>

            {/* 📜 KHỐI NHẬT KÝ BIẾN ĐỘNG CHUỒNG HEO THỊT TĨNH PHẲNG */}
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e9ecef' }}>
              <Text style={{ fontSize: 13, color: '#1a1f23', fontWeight: '900', marginBottom: 10, letterSpacing: 0.3 }}>📜 NHẬT KÝ BIẾN ĐỘNG CHUỒNG HEO THỊT</Text>
              {(() => {
                const nhatKyFiltered = mangLichSuGocRealTime.filter(item => {
                  if (!item || item.actionType === "delete" || item.syncStatus === "delete") return false;
                  const txtSuKien = item.suKien ? item.suKien.toString().trim().toLowerCase() : "";
                  const txtHanhDong = item.actionType ? item.actionType.toString().trim().toLowerCase() : "";
                  
                  return txtSuKien.includes("nhập") || txtSuKien.includes("nhap") || 
                         txtSuKien.includes("hao") || txtSuKien.includes("chết") || txtSuKien.includes("chet") ||
                         txtSuKien.includes("bán") || txtSuKien.includes("ban") ||
                         txtHanhDong.includes("nhập") || txtHanhDong.includes("nhap") ||
                         txtHanhDong.includes("hao") || txtHanhDong.includes("ban") || txtHanhDong.includes("bán");
                });
                
                nhatKyFiltered.sort((a, b) => {
                  const parseDateToTimestampChuan = (obj) => {
                    if (!obj || !obj.ngay) return 0;
                    try {
                      const chuoiNgayGoc = obj.ngay.toString().trim().substring(0, 10);
                      if (chuoiNgayGoc.includes('/')) {
                        const phanTu = chuoiNgayGoc.split('/');
                        if (phanTu.length === 3) return new Date(parseInt(phanTu, 10), parseInt(phanTu, 10) - 1, parseInt(phanTu, 10)).getTime() || 0;
                      } else if (chuoiNgayGoc.includes('-')) {
                        const phanTu = chuoiNgayGoc.split('-');
                        if (phanTu.length === 3) return new Date(parseInt(phanTu, 10), parseInt(phanTu, 10) - 1, parseInt(phanTu, 10)).getTime() || 0;
                      }
                      const dGoc = new Date(obj.ngay);
                      return !isNaN(dGoc.getTime()) ? dGoc.getTime() : 0;
                    } catch (e) { return 0; }
                  };
                  const timeA = parseDateToTimestampChuan(a);
                  const timeB = parseDateToTimestampChuan(b);
                  if (timeB !== timeA) return timeB - timeA;
                  return (b.id || "").toString().localeCompare((a.id || "").toString());
                });

                if (nhatKyFiltered.length === 0) {
                  return <View style={{ paddingVertical: 20, alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#eef2f5' }}><Text style={{ fontSize: 12, color: '#8a929a', fontStyle: 'italic' }}>Chưa có dòng nhật ký biến động heo thịt nào được tìm thấy ngoài RAM.</Text></View>;
                }

                return nhatKyFiltered.map((item, idx) => {
                  const txtSkCuaItem = (item.suKien || "").toString().trim().toLowerCase();
                  const txtActionCuaItem = (item.actionType || "").toString().trim().toLowerCase();
                  
                  let txtHienBadge = (item.suKien || "BIẾN ĐỘNG").toString().toUpperCase();
                  let mChu = '#007bff', mNen = '#e7f1ff';
                  
                  if (txtSkCuaItem.includes("hao") || txtSkCuaItem.includes("chết") || txtSkCuaItem.includes("chet") || txtActionCuaItem.includes("hao")) { 
                    mChu = '#dc3545'; mNen = '#f8d7da'; txtHienBadge = "HAO HỤT"; 
                  }
                  if (txtSkCuaItem.includes("bán") || txtSkCuaItem.includes("ban") || txtActionCuaItem.includes("ban")) { 
                    mChu = '#28a745'; mNen = '#d4edda'; txtHienBadge = "BÁN HEO"; 
                  }
                  if (txtSkCuaItem.includes("nhập") || txtSkCuaItem.includes("nhap") || txtActionCuaItem.includes("nhap")) { 
                    mChu = '#007bff'; mNen = '#e7f1ff'; txtHienBadge = "NHẬP ĐÀN"; 
                  }

                  let nhanTuan = item.tuanBan !== undefined ? String(item.tuanBan).trim() : "";
                  nhanTuan = (nhanTuan === "3" || nhanTuan === "theoMe") ? "Theo Mẹ" : ((nhanTuan === "4" || nhanTuan === "caiSua") ? "Cai Sữa" : (nhanTuan !== "" ? `Tuần ${nhanTuan}` : "Lô Tổng"));

                  return (
                    <View key={`ht_f_${item.id || idx}`} style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: item.syncStatus === "waiting" ? '#ffb74d' : '#e9ecef', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={{ backgroundColor: mNen, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 }}><Text style={{ fontSize: 11, fontWeight: '900', color: mChu }}>{txtHienBadge}</Text></View>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#1a1f23' }}>{nhanTuan}</Text>
                        </View>
                        <Text style={{ fontSize: 11.5, color: '#6c757d', fontWeight: '500' }}>📅 {item.ngay || "---"}{item.syncStatus === "waiting" ? " ⏳" : ""}</Text>
                      </View>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <Text style={{ fontSize: 12.5, color: '#495057' }}>Số lượng: <Text style={{ fontSize: 14, fontWeight: '900', color: mChu }}>{item.soHeo} con</Text></Text>
                          {item.ghiChu ? <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 4, backgroundColor: '#f8f9fa', padding: 4, borderRadius: 4, borderLeftWidth: 2, borderLeftColor: '#adb5bd' }}>{item.ghiChu}</Text> : null}
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity activeOpacity={0.6} onPress={() => handleMoSuaHeoThit(item)} style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ffc107', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}><Text style={{ color: '#b58100', fontSize: 11, fontWeight: 'bold' }}>Sửa</Text></TouchableOpacity>
                          <TouchableOpacity activeOpacity={0.6} onPress={() => handleXoaXoaNhatKyChuDong ? handleXoaXoaNhatKyChuDong(item) : (handleXoaXoaNhatKyChuDong && handleXoaXoaNhatKyChuDong(item))} style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dc3545', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}><Text style={{ color: '#dc3545', fontSize: 11, fontWeight: 'bold' }}>Xóa</Text></TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                });
              })()}
            </View>
          </View>
        );
      })() : <Text style={styles.emptyText}>Trại này hiện tại chưa có dữ liệu phân tích số liệu Heo Thịt trên Server.</Text>}
    </ScrollView>
  );
};

export default PigMeatTab;
