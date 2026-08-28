import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

const PigMeatTab = ({ currentTab, styles, formatVNDate, dataHeoThit, danhSachLichSu, lichSuHeoThit, lichSuHeo, historyData, dataLichSu, openGiaiDoan, setOpenGiaiDoan, handleMoModalHeoThit, handleMoSuaHeoThit, handleXoaXoaNhatKyChuDong, handleXoaNhatKyChuDong }) => {
  if (currentTab !== 'heo_thit') return null;

  // 🧠 BỘ NÃO GOM MẢNG TOÀN CỤC: Đặt ở đỉnh file để nuôi sống khay hiển thị Nhật ký
  const mangLichSuGocRealTime = Array.isArray(danhSachLichSu) ? danhSachLichSu : 
                                (Array.isArray(lichSuHeoThit) ? lichSuHeoThit : 
                                (Array.isArray(lichSuHeo) ? lichSuHeo : 
                                (Array.isArray(historyData) ? historyData : 
                                (Array.isArray(dataLichSu) ? dataLichSu : []))));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 12, paddingBottom: 120 }}>
      {/* 📊 KHỐI THIẾT KẾ BỘ 3 NÚT BIẾN ĐỘNG */}
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

        // 🎯 BẢN VÁ KHÓA ĐINH CHÂN PHƯƠNG: Bốc trực tiếp các ô lẻ kịch sàn từ Server gửi về
        const khoRealTime = {};
        
        // Găm cứng ô Cai Sữa 4 Tuần theo đúng giá trị thô gốc từ Server đổ về (Sẽ ăn chuẩn số 6 của Phương, 144 của Vinh)
        khoRealTime["4 Tuần"] = laySoTho(dataHeoThit.caiSua) || laySoTho(dataHeoThit["4 Tuần"]) || 0; 

        // Khởi tạo và nạp tăm tắp quân số cho 26 ô tuần lẻ bằng phông chữ viết hoa khớp 100% Apps Script
        khoRealTime["5 Tuần"] = laySoTho(dataHeoThit["5 Tuần"]);
        khoRealTime["6 Tuần"] = laySoTho(dataHeoThit["6 Tuần"]);
        khoRealTime["7 Tuần"] = laySoTho(dataHeoThit["7 Tuần"]);
        khoRealTime["8 Tuần"] = laySoTho(dataHeoThit["8 Tuần"]);
        khoRealTime["9 Tuần"] = laySoTho(dataHeoThit["9 Tuần"]);
        khoRealTime["10 Tuần"] = laySoTho(dataHeoThit["10 Tuần"]);
        khoRealTime["11 Tuần"] = laySoTho(dataHeoThit["11 Tuần"]);
        khoRealTime["12 Tuần"] = laySoTho(dataHeoThit["12 Tuần"]);
        khoRealTime["13 Tuần"] = laySoTho(dataHeoThit["13 Tuần"]);
        khoRealTime["14 Tuần"] = laySoTho(dataHeoThit["14 Tuần"]);
        khoRealTime["15 Tuần"] = laySoTho(dataHeoThit["15 Tuần"]);
        khoRealTime["16 Tuần"] = laySoTho(dataHeoThit["16 Tuần"]);
        khoRealTime["17 Tuần"] = laySoTho(dataHeoThit["17 Tuần"]);
        khoRealTime["18 Tuần"] = laySoTho(dataHeoThit["18 Tuần"]);
        khoRealTime["19 Tuần"] = laySoTho(dataHeoThit["19 Tuần"]);
        khoRealTime["20 Tuần"] = laySoTho(dataHeoThit["20 Tuần"]);
        khoRealTime["21 Tuần"] = laySoTho(dataHeoThit["21 Tuần"]);
        khoRealTime["22 Tuần"] = laySoTho(dataHeoThit["22 Tuần"]);
        khoRealTime["23 Tuần"] = laySoTho(dataHeoThit["23 Tuần"]);
        khoRealTime["24 Tuần"] = laySoTho(dataHeoThit["24 Tuần"]);
        khoRealTime["25 Tuần"] = laySoTho(dataHeoThit["25 Tuần"]);
        khoRealTime["26 Tuần"] = laySoTho(dataHeoThit["26 Tuần"]);
        khoRealTime["27 Tuần"] = laySoTho(dataHeoThit["27 Tuần"]);
        khoRealTime["28 Tuần"] = laySoTho(dataHeoThit["28 Tuần"]);
        khoRealTime["29 Tuần"] = laySoTho(dataHeoThit["29 Tuần"]);
        khoRealTime["30 Tuần"] = laySoTho(dataHeoThit["30 Tuần"]);

        const soHeoTheoMeGoc = laySoTho(dataHeoThit.theoMe) || laySoTho(dataHeoThit["Theo Mẹ"]) || 0;

        // 🧠 ÉP TỰ ĐỘNG CỘNG TỔNG GIAI ĐOẠN TỪ CÁC Ô LẺ ĐÃ ĐƯỢC ĐỒNG BỘ ĐÚNG CHỈ SỐ FILE SHEET
        const tGd3 = khoRealTime["5 Tuần"] + khoRealTime["6 Tuần"] + khoRealTime["7 Tuần"] + khoRealTime["8 Tuần"] + khoRealTime["9 Tuần"];
        const tGd4 = khoRealTime["10 Tuần"] + khoRealTime["11 Tuần"] + khoRealTime["12 Tuần"] + khoRealTime["13 Tuần"] + khoRealTime["14 Tuần"] + khoRealTime["15 Tuần"];
        const tGd5 = khoRealTime["16 Tuần"] + khoRealTime["17 Tuần"] + khoRealTime["18 Tuần"] + khoRealTime["19 Tuần"] + khoRealTime["20 Tuần"];
        const tGd6 = khoRealTime["21 Tuần"] + khoRealTime["22 Tuần"] + khoRealTime["23 Tuần"] + khoRealTime["24 Tuần"] + khoRealTime["25 Tuần"];
        const tGd7 = khoRealTime["26 Tuần"] + khoRealTime["27 Tuần"] + khoRealTime["28 Tuần"] + khoRealTime["29 Tuần"] + khoRealTime["30 Tuần"];

        const renderGrid = (tuanArray, key) => (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
            {tuanArray.map((t, idx) => {
              const soC = khoRealTime[`${t.replace(' Tuần', '')} Tuần`] || 0;
              return (
                <View key={`${key}_g_${idx}`} style={{ width: '23.8%', height: 42, backgroundColor: '#ffffff', borderWidth: 1, borderColor: (key.includes('red')) ? '#f5c6cb' : '#dee2e6', borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '900' }}>Tuần {t.replace(' Tuần', '')}</Text>
                  <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: soC > 0 ? (key.includes('red') ? '#c82333' : '#137333') : '#a0a0a0' }}>{soC} Con</Text>
                </View>
              );
            })}
          </View>
        );

        return (
          <View style={{ width: '100%' }}>
             {/* Banner số tổng - ĐÃ VÁ: Đồng bộ mỏ neo gọi biến thời gian thực, dứt điểm lệch số tổng */}
            <View style={{ marginBottom: 12, backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212529' }}>Tổng Số Heo Thịt:</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#137333' }}>
                  {" "}
                  {dataHeoThit.tongHeoThitSauBuTruRealTime !== undefined 
                    ? String(dataHeoThit.tongHeoThitSauBuTruRealTime) 
                    : String(soHeoTheoMeGoc + khoRealTime["4 Tuần"] + tGd3 + tGd4 + tGd5 + tGd6 + tGd7)} con
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: '#6c757d', fontStyle: 'italic', marginTop: 4, fontWeight: '500' }}>
                ( Bấm Cập Nhật Số Liệu để ra số liệu mới nhất )
              </Text>
            </View>

            {/* Bàn cờ các giai đoạn tuổi */}
            <View style={{ backgroundColor: '#ffffff', borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#dee2e6', padding: 10, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fdfdfd', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 14 }}>1. Giai đoạn Theo Mẹ</Text>
                <Text style={{ fontSize: 15, fontWeight: 'bold' }}>{soHeoTheoMeGoc} con</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fdfdfd', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#dee2e6' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 14 }}>2. Giai đoạn Cai Sữa (4 Tuần)</Text>
                <Text style={{ fontSize: 15, fontWeight: 'bold' }}>{khoRealTime["4 Tuần"]} con</Text>
              </View>

                           {/* 3. Giai đoạn 10 - 30kg (BỔ SUNG MŨI TÊN ĐÓNG MỞ) */}
              <View style={{ backgroundColor: '#fffdf9', borderRadius: 8, borderWidth: 1, borderColor: '#ffe0b2', padding: 10 }}>
                <TouchableOpacity onPress={() => setOpenGiaiDoan(prev => ({ ...prev, gd3: !prev.gd3 }))} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={{ fontWeight: 'bold', color: '#e65100', fontSize: 14 }}>3. Giai đoạn: 10 - 30kg</Text>
                    <Text style={{ fontSize: 11, color: '#f57c00', marginTop: 2, fontWeight: '500' }}>Chi tiết: Tuần 5 - Tuần 9</Text>
                  </View>
                  {/* 🌟 CỤM SỐ CON VÀ MŨI TÊN HƯỚNG DẪN */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#007bff', fontSize: 15, fontWeight: 'bold' }}>{tGd3} con</Text>
                    <Text style={{ color: '#e65100', fontSize: 11, fontWeight: 'bold' }}>{openGiaiDoan.gd3 ? "▲" : "▼"}</Text>
                  </View>
                </TouchableOpacity>
                {openGiaiDoan.gd3 && renderGrid(["5 Tuần", "6 Tuần", "7 Tuần", "8 Tuần", "9 Tuần"], "gd3")}
              </View>

              {/* 4. Giai đoạn 30 - 60kg (BỔ SUNG MŨI TÊN ĐÓNG MỞ) */}
              <View style={{ backgroundColor: '#fffdf9', borderRadius: 8, borderWidth: 1, borderColor: '#ffe0b2', padding: 10 }}>
                <TouchableOpacity onPress={() => setOpenGiaiDoan(prev => ({ ...prev, gd4: !prev.gd4 }))} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={{ fontWeight: 'bold', color: '#e65100', fontSize: 14 }}>4. Giai đoạn: 30 - 60kg</Text>
                    <Text style={{ fontSize: 11, color: '#f57c00', marginTop: 2, fontWeight: '500' }}>Chi tiết: Tuần 10 - Tuần 15</Text>
                  </View>
                  {/* 🌟 CỤM SỐ CON VÀ MŨI TÊN HƯỚNG DẪN */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#007bff', fontSize: 15, fontWeight: 'bold' }}>{tGd4} con</Text>
                    <Text style={{ color: '#e65100', fontSize: 11, fontWeight: 'bold' }}>{openGiaiDoan.gd4 ? "▲" : "▼"}</Text>
                  </View>
                </TouchableOpacity>
                {openGiaiDoan.gd4 && renderGrid(["10 Tuần", "11 Tuần", "12 Tuần", "13 Tuần", "14 Tuần", "15 Tuần"], "gd4")}
              </View>

              {/* 5. Giai đoạn 60 - 100kg (BỔ SUNG MŨI TÊN ĐÓNG MỞ) */}
              <View style={{ backgroundColor: '#fffdf9', borderRadius: 8, borderWidth: 1, borderColor: '#ffe0b2', padding: 10 }}>
                <TouchableOpacity onPress={() => setOpenGiaiDoan(prev => ({ ...prev, gd5: !prev.gd5 }))} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={{ fontWeight: 'bold', color: '#e65100', fontSize: 14 }}>5. Giai đoạn: 60 - 100kg</Text>
                    <Text style={{ fontSize: 11, color: '#f57c00', marginTop: 2, fontWeight: '500' }}>Chi tiết: Tuần 16 - Tuần 20</Text>
                  </View>
                  {/* 🌟 CỤM SỐ CON VÀ MŨI TÊN HƯỚNG DẪN */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#007bff', fontSize: 15, fontWeight: 'bold' }}>{tGd5} con</Text>
                    <Text style={{ color: '#e65100', fontSize: 11, fontWeight: 'bold' }}>{openGiaiDoan.gd5 ? "▲" : "▼"}</Text>
                  </View>
                </TouchableOpacity>
                {openGiaiDoan.gd5 && renderGrid(["16 Tuần", "17 Tuần", "18 Tuần", "19 Tuần", "20 Tuần"], "gd5")}
              </View>
                {/* 6. Từ 100kg - 130kg (BỔ SUNG MŨI TÊN ĐÓNG MỞ KHỐI ĐỎ) */}
              <View style={{ backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#f5c6cb', padding: 10 }}>
                <TouchableOpacity onPress={() => setOpenGiaiDoan(prev => ({ ...prev, gd6: !prev.gd6 }))} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={{ fontWeight: 'bold', color: '#c82333', fontSize: 14 }}>6. Giai đoạn: 100kg - 130kg</Text>
                    <Text style={{ fontSize: 11, color: '#dc3545', marginTop: 2, fontWeight: '500' }}>Chi tiết: Tuần 21 - Tuần 25</Text>
                  </View>
                  {/* 🌟 CỤM SỐ CON VÀ MŨI TÊN HƯỚNG DẪN */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#c82333', fontSize: 16, fontWeight: 'bold' }}>{tGd6} con</Text>
                    <Text style={{ color: '#c82333', fontSize: 11, fontWeight: 'bold' }}>{openGiaiDoan.gd6 ? "▲" : "▼"}</Text>
                  </View>
                </TouchableOpacity>
                {openGiaiDoan.gd6 && renderGrid(["21 Tuần", "22 Tuần", "23 Tuần", "24 Tuần", "25 Tuần"], "gd6_red")}
              </View>

              {/* 7. 130kg - Xuất Chuồng (BỔ SUNG MŨI TÊN ĐÓNG MỞ KHỐI ĐỎ) */}
              <View style={{ backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#f5c6cb', padding: 10 }}>
                <TouchableOpacity onPress={() => setOpenGiaiDoan(prev => ({ ...prev, gd7: !prev.gd7 }))} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={{ fontWeight: 'bold', color: '#c82333', fontSize: 14 }}>7. Giai đoạn: 130kg - Xuất Chuồng</Text>
                    <Text style={{ fontSize: 11, color: '#dc3545', marginTop: 2, fontWeight: '500' }}>Chi tiết: Tuần 26 - Tuần 30</Text>
                  </View>
                  {/* 🌟 CỤM SỐ CON VÀ MŨI TÊN HƯỚNG DẪN */}
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
                      
                      // Xử lý bóc tách chuỗi định dạng dd/mm/yyyy thuần Việt
                      if (chuoiNgayGoc.includes('/')) {
                        const phanTu = chuoiNgayGoc.split('/');
                        if (phanTu.length === 3) {
                          return new Date(parseInt(phanTu[2], 10), parseInt(phanTu[1], 10) - 1, parseInt(phanTu[0], 10)).getTime() || 0;
                        }
                      } 
                      // Xử lý phòng hờ chuỗi định dạng yyyy-mm-dd từ máy chủ Sheets đổ về
                      else if (chuoiNgayGoc.includes('-')) {
                        const phanTu = chuoiNgayGoc.split('-');
                        if (phanTu.length === 3) {
                          if (phanTu[0].length === 4) {
                            return new Date(parseInt(phanTu[0], 10), parseInt(phanTu[1], 10) - 1, parseInt(phanTu[2], 10)).getTime() || 0;
                          }
                          return new Date(parseInt(phanTu[2], 10), parseInt(phanTu[1], 10) - 1, parseInt(phanTu[0], 10)).getTime() || 0;
                        }
                      }
                      
                      const dGoc = new Date(obj.ngay);
                      return !isNaN(dGoc.getTime()) ? dGoc.getTime() : 0;
                    } catch (e) {
                      return 0;
                    }
                  };

                  const timeA = parseDateToTimestampChuan(a);
                  const timeB = parseDateToTimestampChuan(b);

                  // Ép mốc thời gian lớn hơn (mới hơn) nhảy vọt lên vị trí số 1 đầu trang
                  if (timeB !== timeA) return timeB - timeA;
                  return (b.id || "").toString().localeCompare((a.id || "").toString());
                }); if (nhatKyFiltered.length === 0) {
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
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#1a1f23' }}>Thời Điểm : {nhanTuan}</Text>
                        </View>
                        <Text style={{ fontSize: 11.5, color: '#6c757d', fontWeight: '500' }}>📅 {(() => {
                          if (!item.ngay) return "---";
                          const dGoc = new Date(item.ngay);
                          if (!isNaN(dGoc.getTime()) && typeof formatVNDate === 'function') return formatVNDate(dGoc);
                          return item.ngay.toString().trim().substring(0, 10);
                        })()}{item.syncStatus === "waiting" ? " ⏳" : ""}</Text>
                      </View>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <Text style={{ fontSize: 12.5, color: '#495057' }}>Số lượng: <Text style={{ fontSize: 14, fontWeight: '900', color: mChu }}>{item.soHeo} con</Text></Text>
                          {item.ghiChu ? <Text style={{ fontSize: 12, color: '#6c757d', marginTop: 4, backgroundColor: '#f8f9fa', padding: 4, borderRadius: 4, borderLeftWidth: 2, borderLeftColor: '#adb5bd' }}>{item.ghiChu}</Text> : null}
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity activeOpacity={0.6} onPress={() => handleMoSuaHeoThit(item)} style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ffc107', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 }}><Text style={{ color: '#b58100', fontSize: 11, fontWeight: 'bold' }}>Sửa</Text></TouchableOpacity>
{/* NÚT XÓA ĐÃ ĐƯỢC CHÈN THÊM POP-UP XÁC NHẬN AN TOÀN */}
<TouchableOpacity 
  activeOpacity={0.6} 
  onPress={() => {
    const nhanTuan = item.tuanBan !== undefined ? String(item.tuanBan).trim() : "";
    const tenLo = (nhanTuan === "3" || nhanTuan === "theoMe") ? "Theo Mẹ" : ((nhanTuan === "4" || nhanTuan === "caiSua") ? "Cai Sữa" : (nhanTuan !== "" ? `Tuần ${nhanTuan}` : "Lô Tổng"));
    const txtHienBadge = (item.suKien || "Biến Động").toUpperCase();

    // Kích nổ Pop-up hệ thống hỏi ý kiến người nuôi trước khi xóa sạch dữ liệu
    const { Alert } = require('react-native');
    Alert.alert(
      "🗑️ Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa Dòng [${txtHienBadge}] ${item.soHeo} này không?`,
      [
        { 
          text: "Hủy bỏ", 
          style: "cancel" 
        },
        { 
          text: "Đồng ý xóa", 
          style: "destructive",
          onPress: () => {
            if (typeof handleXoaNhatKyChuDong === 'function') {
              handleXoaNhatKyChuDong(item);
            } else if (typeof handleXoaXoaNhatKyChuDong === 'function') {
              handleXoaXoaNhatKyChuDong(item);
            }
          }
        }
      ]
    );
  }} 
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
        );
      })() : <Text style={styles.emptyText}>Trại này hiện tại chưa có dữ liệu phân tích số liệu Heo Thịt trên Server.</Text>}
    </ScrollView>
  );
};

export default PigMeatTab;