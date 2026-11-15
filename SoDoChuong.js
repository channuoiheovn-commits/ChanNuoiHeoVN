// ========================================================
// 🗺 SƠ ĐỒ Ô CHUỒNG NHƯ NGOÀI TRẠI (tùy chọn)
// - Chủ trại sắp xếp 1 sơ đồ chung cho cả trại (cả khu Cai Sữa lẫn khu Thịt):
//   số ô mỗi hàng, ô nào nằm đâu, ô trống, hàng lối đi, dòng chữ (VD "Chuồng 1", "Khu Cai Sữa").
// - Lưu riêng ở So_Do_Chuong/{maTrai} — KHÔNG đụng dữ liệu heo.
// - Trại chưa sắp xếp: vẫn hiện dạng danh sách theo khu như cũ.
// Cấu trúc: khu.TOAN_TRAI = { soCot: 4, hang: [ { loiDi: true } | { nhan: 'Chuồng 1' } | { o: ['Cai Sữa|1', 'Chuồng Thịt|3', null] } ] }
// Mỗi ô ghi "tênKhu|tênÔ" (null = chỗ trống)
// ========================================================
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './FirebaseConfig';
import * as NguoiNhap from './nguoiNhap';

// Mã trại: lấy từ phiên đăng nhập; nếu chưa có thì đọc thẳng từ quyền (claims) của tài khoản Firebase
const layMaTraiDongBo = () => (typeof NguoiNhap.layMaTrai === 'function' ? NguoiNhap.layMaTrai() : null);
const layMaTraiChac = async () => {
  const m = layMaTraiDongBo();
  if (m) return m;
  try {
    const u = auth && auth.currentUser;
    if (!u) return null;
    const kq = await u.getIdTokenResult();
    return (kq && kq.claims && kq.claims.maTrai) || null;
  } catch (e) { return null; }
};
const chanNeuKhongDuQuyen = (hd, item) => (typeof NguoiNhap.chanNeuKhongDuQuyen === 'function' ? NguoiNhap.chanNeuKhongDuQuyen(hd, item) : false);

const COLLECTION_SO_DO = 'So_Do_Chuong';
const sapTheoSo = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });

// Lắng nghe sơ đồ của trại. Trả về { khu: { [tenKhu]: { soCot, hang } } } hoặc {} nếu chưa có
export const useSoDoChuong = () => {
  const [soDo, setSoDo] = useState({});
  const [maTrai, setMaTrai] = useState(layMaTraiDongBo());
  useEffect(() => { if (!maTrai) layMaTraiChac().then((m) => { if (m) setMaTrai(m); }); }, []);
  useEffect(() => {
    if (!maTrai) return undefined;
    const huy = onSnapshot(doc(db, COLLECTION_SO_DO, maTrai),
      (snap) => setSoDo(snap.exists() && snap.data() && snap.data().khu ? snap.data().khu : {}),
      () => setSoDo({}));
    return huy;
  }, [maTrai]);
  return soDo;
};

const luuSoDoKhu = async (soDoHienTai, tenKhu, cauHinhKhu) => {
  const maTrai = await layMaTraiChac();
  if (!maTrai) throw new Error('KHONG_CO_TRAI');
  const khuMoi = { ...(soDoHienTai || {}) };
  if (cauHinhKhu) khuMoi[tenKhu] = cauHinhKhu; else delete khuMoi[tenKhu];
  await setDoc(doc(db, COLLECTION_SO_DO, maTrai), { khu: khuMoi, capNhatLuc: serverTimestamp() });
};

export const KHOA_TOAN_TRAI = 'TOAN_TRAI';
const khoaO = (c) => `${String(c.tenKhu).trim()}|${String(c.tenChuong).trim()}`;
const tenKhuNgan = (tenKhu) => {
  const t = String(tenKhu || '').trim();
  if (t === 'Cai Sữa') return 'Cai sữa';
  if (t === 'Chuồng Thịt') return 'Thịt';
  return t;
};
const mauKhu = (tenKhu) => (String(tenKhu || '').includes('Cai') ? '#e65100' : '#0056b3');

// Sơ đồ chỉ hợp lệ khi có ít nhất 1 hàng
export const coSoDoTrai = (soDo) => !!(soDo && soDo[KHOA_TOAN_TRAI] && Array.isArray(soDo[KHOA_TOAN_TRAI].hang) && soDo[KHOA_TOAN_TRAI].hang.length > 0);

// Màu 1 ô theo tình trạng heo
const mauO = (chuong) => {
  if (!chuong || !(chuong.tongSoCon > 0)) return { nen: '#f1f3f5', vien: '#dee2e6', chu: '#adb5bd' };
  const tuoiMax = Math.max(0, ...(chuong.mangTuanTuoi || []));
  if (tuoiMax >= 21) return { nen: '#fff5f5', vien: '#f1aeb5', chu: '#c82333' };
  return { nen: '#f1f8f3', vien: '#a3d9b1', chu: '#137333' };
};

// Tuần tuổi heo trong ô: 1–2 lứa ghi đủ ("19, 20 tuần"), nhiều lứa ghi khoảng ("8–19 tuần")
const chuoiTuan = (chuong) => {
  const t = (chuong.mangTuanTuoi || []).filter((x) => x > 0).sort((a, b) => a - b);
  if (!t.length) return '';
  if (t.length <= 2) return `${t.join(', ')} tuần`;
  return `${t[0]}–${t[t.length - 1]} tuần`;
};

function TheO({ chuong, rong, onPress }) {
  const m = mauO(chuong);
  const cacMui = Array.isArray(chuong.lichVacXinMatTien) ? chuong.lichVacXinMatTien.filter(Boolean) : [];
  return (
    <TouchableOpacity activeOpacity={0.6} onPress={() => onPress(chuong)} style={{ width: rong, padding: 3 }}>
      <View style={{ flex: 1, minHeight: 70, borderRadius: 8, borderWidth: 1.5, borderColor: m.vien, backgroundColor: m.nen, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, paddingHorizontal: 2, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: mauKhu(chuong.tenKhu) }} />
        {cacMui.length > 0 && (
          <View style={{ alignSelf: 'stretch', marginHorizontal: 2, marginTop: 2, marginBottom: 2, paddingVertical: 1.5, paddingHorizontal: 3, borderRadius: 4, backgroundColor: '#f3eefe' }}>
            <Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#6f42c1', textAlign: 'center' }} numberOfLines={1}>
              💉 {cacMui.join(', ')}
            </Text>
          </View>
        )}
        <Text style={{ fontSize: 10, color: '#8a929a', fontWeight: 'bold' }} numberOfLines={1}>Ô {chuong.tenChuong}</Text>
        {chuong.tongSoCon > 0 ? (
          <>
            <Text style={{ fontSize: 19, fontWeight: '900', color: m.chu, lineHeight: 23 }} numberOfLines={1}>{chuong.tongSoCon}</Text>
            {chuoiTuan(chuong) !== '' && (
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#1a1f23' }} numberOfLines={1}>{chuoiTuan(chuong)}</Text>
            )}
          </>
        ) : (
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: m.chu, marginTop: 2 }}>Trống</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const HangLoiDi = () => (
  <View style={{ marginVertical: 4, marginHorizontal: 3, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderStyle: 'dashed', borderColor: '#ced4da', backgroundColor: '#fafafa', alignItems: 'center' }}>
    <Text style={{ fontSize: 10.5, color: '#8a929a', letterSpacing: 2 }}>LỐI ĐI</Text>
  </View>
);

// 🗺 Vẽ sơ đồ cả trại. Ô chưa đặt lên sơ đồ hiện ở nhóm "Chưa xếp lên sơ đồ" để không bao giờ bị mất
export function BanDoTrai({ cauHinh, danhSachKhu, onChamO }) {
  const soCot = Math.max(2, Math.min(8, Number(cauHinh.soCot) || 4));
  const rong = `${100 / soCot}%`;
  const theoKhoa = {};
  (danhSachKhu || []).forEach((k) => (k.danhSachChuongCuaKhu || []).forEach((c) => { theoKhoa[khoaO(c)] = c; }));
  const daDat = new Set();
  const cacKhu = (danhSachKhu || []).filter((k) => (k.danhSachChuongCuaKhu || []).length > 0);
  return (
    <View>
      {/* Chú thích: vạch màu mép trên = khu; số lớn = số con; dòng dưới = tuần tuổi */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6, marginLeft: 3 }}>
        {cacKhu.map((k) => (
          <View key={`cc_${k.tenKhu}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 14, height: 3, borderRadius: 2, backgroundColor: mauKhu(k.tenKhu) }} />
            <Text style={{ fontSize: 10, color: '#6c757d' }}>{k.tenKhu}</Text>
          </View>
        ))}
        <Text style={{ fontSize: 10, color: '#adb5bd' }}>Số lớn: số con · dưới: tuần tuổi</Text>
      </View>
      {cauHinh.hang.map((h, hIdx) => {
        if (h.loiDi) return <HangLoiDi key={`ld_${hIdx}`} />;
        if (h.nhan !== undefined) {
          return <Text key={`nh_${hIdx}`} style={{ fontSize: 12, fontWeight: '900', color: '#495057', marginTop: hIdx === 0 ? 0 : 8, marginBottom: 2, marginLeft: 3 }}>{h.nhan}</Text>;
        }
        const o = Array.isArray(h.o) ? h.o : [];
        return (
          <View key={`h_${hIdx}`} style={{ flexDirection: 'row' }}>
            {Array.from({ length: soCot }).map((_, cIdx) => {
              const k = o[cIdx];
              const chuong = k ? theoKhoa[k] : null;
              if (!chuong) return <View key={`c_${hIdx}_${cIdx}`} style={{ width: rong, padding: 3 }}><View style={{ minHeight: 70 }} /></View>;
              daDat.add(k);
              return <TheO key={`c_${hIdx}_${cIdx}`} chuong={chuong} rong={rong} onPress={onChamO} />;
            })}
          </View>
        );
      })}
      {(() => {
        const conLai = Object.keys(theoKhoa).filter((k) => !daDat.has(k)).map((k) => theoKhoa[k]);
        if (conLai.length === 0) return null;
        return (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 10.5, color: '#8a929a', marginBottom: 2, marginLeft: 3 }}>Chưa xếp lên sơ đồ</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {conLai.map((c) => <TheO key={`cl_${khoaO(c)}`} chuong={c} rong={rong} onPress={onChamO} />)}
            </View>
          </View>
        );
      })()}
    </View>
  );
}

// Tự xếp: từng khu có dòng tên khu, các ô theo số thứ tự, giữa 2 khu có lối đi
// Trại chưa tự sắp xếp thì sơ đồ hiện theo cách này
export const soDoMacDinh = (danhSachKhu, soCot = 4) => ({ soCot, hang: tuXep(danhSachKhu, soCot) });
const tuXep = (danhSachKhu, soCot) => {
  const hang = [];
  (danhSachKhu || []).forEach((k, kIdx) => {
    const ds = (k.danhSachChuongCuaKhu || []).map(khoaO).sort((a, b) => sapTheoSo(a.split('|')[1], b.split('|')[1]));
    if (!ds.length) return;
    if (hang.length) hang.push({ loiDi: true });
    hang.push({ nhan: `Khu ${k.tenKhu}` });
    for (let i = 0; i < ds.length; i += soCot) hang.push({ o: ds.slice(i, i + soCot) });
  });
  return hang.length ? hang : [{ o: [] }];
};

// ✏️ Cửa sổ sắp xếp sơ đồ cả trại (chỉ chủ trại)
export function ModalSapXepSoDo({ visible, danhSachKhu, soDo, onClose }) {
  const tatCa = [];
  (danhSachKhu || []).forEach((k) => (k.danhSachChuongCuaKhu || []).forEach((c) => tatCa.push({ khoa: khoaO(c), tenKhu: k.tenKhu, tenChuong: String(c.tenChuong) })));
  const [soCot, setSoCot] = useState(4);
  const [hang, setHang] = useState([]);
  const [oChon, setOChon] = useState(null); // { h, c } chỗ trên lưới đang chọn để đặt ô chuồng
  const [dangLuu, setDangLuu] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const ch = soDo && soDo[KHOA_TOAN_TRAI];
    if (ch && Array.isArray(ch.hang) && ch.hang.length) {
      setSoCot(Math.max(2, Math.min(8, Number(ch.soCot) || 4)));
      setHang(ch.hang.map((h) => (h.loiDi ? { loiDi: true } : h.nhan !== undefined ? { nhan: String(h.nhan) } : { o: [...(h.o || [])] })));
    } else {
      setSoCot(4);
      setHang(tuXep(danhSachKhu, 4));
    }
    setOChon(null);
  }, [visible]);

  const daDat = new Set();
  hang.forEach((h) => (h.o || []).forEach((t, i) => { if (t && i < soCot) daDat.add(t); }));
  const chuaDat = tatCa.filter((x) => !daDat.has(x.khoa));

  const datVao = (khoa) => {
    if (!oChon) return;
    setHang((prev) => prev.map((h, hi) => {
      if (h.loiDi || h.nhan !== undefined) return h;
      const o = Array.from({ length: soCot }, (_, i) => (h.o || [])[i] ?? null).map((t) => (khoa && t === khoa ? null : t));
      if (hi === oChon.h) o[oChon.c] = khoa;
      return { o };
    }));
    setOChon(null);
  };
  const themHang = (loai) => setHang((prev) => [...prev, loai === 'LOI_DI' ? { loiDi: true } : loai === 'NHAN' ? { nhan: '' } : { o: [] }]);
  const xoaHang = (hi) => { setHang((prev) => prev.filter((_, i) => i !== hi)); setOChon(null); };
  const dichHang = (hi, buoc) => { setOChon(null); setHang((prev) => {
    const j = hi + buoc;
    if (j < 0 || j >= prev.length) return prev;
    const ds = [...prev];
    [ds[hi], ds[j]] = [ds[j], ds[hi]];
    return ds;
  }); };
  const doiNhan = (hi, chu) => setHang((prev) => prev.map((h, i) => (i === hi ? { nhan: chu } : h)));

  const luu = async () => {
    if (chanNeuKhongDuQuyen('chuTrai')) return;
    const sach = hang.map((h) => (h.loiDi ? { loiDi: true } : h.nhan !== undefined ? { nhan: String(h.nhan).trim() } : { o: Array.from({ length: soCot }, (_, i) => (h.o || [])[i] ?? null) }));
    setDangLuu(true);
    try {
      await luuSoDoKhu(soDo, KHOA_TOAN_TRAI, { soCot, hang: sach });
      setDangLuu(false);
      onClose();
    } catch (e) {
      setDangLuu(false);
      Alert.alert('Lỗi', e && e.message === 'KHONG_CO_TRAI' ? 'Tài khoản chưa có trại nên chưa lưu được sơ đồ.' : 'Không lưu được sơ đồ, vui lòng kiểm tra mạng và thử lại.');
    }
  };
  const boSoDo = () => {
    if (chanNeuKhongDuQuyen('chuTrai')) return;
    Alert.alert('Bỏ sơ đồ', 'Ô chuồng sẽ hiện lại dạng danh sách theo khu như cũ. Dữ liệu heo không đổi.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Bỏ sơ đồ', style: 'destructive', onPress: async () => {
        try { await luuSoDoKhu(soDo, KHOA_TOAN_TRAI, null); onClose(); } catch (e) { Alert.alert('Lỗi', 'Không lưu được, vui lòng thử lại.'); }
      } },
    ]);
  };

  const rong = `${100 / soCot}%`;
  const theoKhoa = {};
  tatCa.forEach((x) => { theoKhoa[x.khoa] = x; });
  const nutNho = (chu, onPress, mau = '#495057') => (
    <TouchableOpacity onPress={onPress} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} style={{ paddingHorizontal: 6, paddingVertical: 2 }}>
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: mau }}>{chu}</Text>
    </TouchableOpacity>
  );
  const nutThem = (chu, loai, mau, nen, net) => (
    <TouchableOpacity onPress={() => themHang(loai)} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderStyle: net ? 'dashed' : 'solid', borderColor: mau, backgroundColor: nen }}>
      <Text style={{ fontSize: 12, fontWeight: 'bold', color: mau === '#ced4da' ? '#6c757d' : mau }}>{chu}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 10 }}>
        <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 14, maxHeight: '95%' }}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#1a1f23' }}>Sắp xếp sơ đồ trại</Text>
            <Text style={{ fontSize: 11.5, color: '#6c757d', marginTop: 3, marginBottom: 12 }}>
              Chạm vào một chỗ trên lưới rồi chọn ô chuồng đặt vào đó. Thêm lối đi và dòng chữ (VD "Chuồng 1") để giống ngoài trại.
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ flex: 1, fontSize: 12.5, fontWeight: 'bold', color: '#495057' }}>Số ô mỗi hàng</Text>
              {nutNho('−', () => setSoCot(Math.max(2, soCot - 1)))}
              <Text style={{ fontSize: 15, fontWeight: '900', width: 28, textAlign: 'center' }}>{soCot}</Text>
              {nutNho('+', () => setSoCot(Math.min(8, soCot + 1)))}
            </View>

            {hang.map((h, hi) => (
              <View key={`sx_${hi}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <View style={{ flex: 1 }}>
                  {h.loiDi ? (
                    <View style={{ paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderStyle: 'dashed', borderColor: '#ced4da', backgroundColor: '#fafafa', alignItems: 'center' }}>
                      <Text style={{ fontSize: 10.5, color: '#8a929a', letterSpacing: 2 }}>LỐI ĐI</Text>
                    </View>
                  ) : h.nhan !== undefined ? (
                    <TextInput value={h.nhan} onChangeText={(t) => doiNhan(hi, t)} placeholder="Gõ chữ, VD: Chuồng 1" placeholderTextColor="#adb5bd"
                      style={{ height: 36, borderWidth: 1, borderColor: '#dee2e6', borderRadius: 6, paddingHorizontal: 8, fontSize: 12.5, fontWeight: 'bold', color: '#495057' }} />
                  ) : (
                    <View style={{ flexDirection: 'row' }}>
                      {Array.from({ length: soCot }).map((_, ci) => {
                        const k = (h.o || [])[ci];
                        const x = k ? theoKhoa[k] : null;
                        const dangChon = oChon && oChon.h === hi && oChon.c === ci;
                        return (
                          <TouchableOpacity key={`sx_${hi}_${ci}`} activeOpacity={0.6} onPress={() => setOChon(dangChon ? null : { h: hi, c: ci })} style={{ width: rong, padding: 2 }}>
                            <View style={{ height: 42, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: dangChon ? 2 : 1, borderStyle: x ? 'solid' : 'dashed', borderColor: dangChon ? '#0056b3' : (x ? mauKhu(x.tenKhu) : '#ced4da'), backgroundColor: x ? '#ffffff' : '#fcfcfc' }}>
                              {x ? (
                                <>
                                  <Text style={{ fontSize: 8.5, fontWeight: 'bold', color: mauKhu(x.tenKhu) }} numberOfLines={1}>{tenKhuNgan(x.tenKhu)}</Text>
                                  <Text style={{ fontSize: 11.5, fontWeight: '900', color: '#1a1f23' }} numberOfLines={1}>Ô {x.tenChuong}</Text>
                                </>
                              ) : (
                                <Text style={{ fontSize: 14, color: '#ced4da' }}>+</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', marginLeft: 2 }}>
                  {nutNho('↑', () => dichHang(hi, -1), '#8a929a')}
                  {nutNho('↓', () => dichHang(hi, 1), '#8a929a')}
                  {nutNho('✕', () => xoaHang(hi), '#dc3545')}
                </View>
              </View>
            ))}

            {oChon && (
              <View style={{ marginTop: 6, padding: 10, borderRadius: 10, backgroundColor: '#f0f6ff', borderWidth: 1, borderColor: '#b3d7ff' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0056b3', marginBottom: 6 }}>Đặt ô chuồng nào vào chỗ này?</Text>
                {(danhSachKhu || []).map((k) => (
                  <View key={`pk_${k.tenKhu}`} style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: mauKhu(k.tenKhu), marginBottom: 4 }}>Khu {k.tenKhu}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {(k.danhSachChuongCuaKhu || []).map((c) => {
                        const khoa = khoaO(c);
                        const daCo = daDat.has(khoa);
                        return (
                          <TouchableOpacity key={`chon_${khoa}`} onPress={() => datVao(khoa)} style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 7, backgroundColor: daCo ? '#f8f9fa' : '#ffffff', borderWidth: 1, borderColor: daCo ? '#e9ecef' : mauKhu(k.tenKhu) }}>
                            <Text style={{ fontSize: 12.5, fontWeight: daCo ? 'normal' : 'bold', color: daCo ? '#8a929a' : '#1a1f23' }}>Ô {c.tenChuong}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
                <TouchableOpacity onPress={() => datVao(null)} style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dee2e6' }}>
                  <Text style={{ fontSize: 12.5, color: '#6c757d' }}>Để trống</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 10.5, color: '#6c757d', marginTop: 6 }}>Ô chữ đậm: chưa có trên sơ đồ. Ô chữ mờ: đang nằm chỗ khác, chọn thì sẽ dời sang đây.</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
              {nutThem('+ Hàng ô', 'O', '#137333', '#f1f8f3', false)}
              {nutThem('+ Lối đi', 'LOI_DI', '#ced4da', '#fafafa', true)}
              {nutThem('+ Dòng chữ', 'NHAN', '#495057', '#ffffff', false)}
            </View>
            <TouchableOpacity onPress={() => { setHang(tuXep(danhSachKhu, soCot)); setOChon(null); }} style={{ marginTop: 8, alignItems: 'center', paddingVertical: 6 }}>
              <Text style={{ fontSize: 12, color: '#0056b3', textDecorationLine: 'underline' }}>Tự xếp lại theo khu và số ô</Text>
            </TouchableOpacity>
            {chuaDat.length > 0 && !oChon && (
              <Text style={{ fontSize: 11, color: '#b26a00', textAlign: 'center', marginTop: 2 }}>
                Còn {chuaDat.length} ô chưa đặt lên sơ đồ: {chuaDat.map((x) => `${tenKhuNgan(x.tenKhu)} Ô ${x.tenChuong}`).join(', ')}
              </Text>
            )}

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <TouchableOpacity onPress={onClose} disabled={dangLuu} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#f1f3f5' }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#495057' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={luu} disabled={dangLuu} style={{ flex: 1.4, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#0056b3', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                {dangLuu && <ActivityIndicator size="small" color="#ffffff" />}
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>LƯU SƠ ĐỒ</Text>
              </TouchableOpacity>
            </View>
            {coSoDoTrai(soDo) && (
              <TouchableOpacity onPress={boSoDo} style={{ marginTop: 10, alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ fontSize: 11.5, color: '#dc3545', textDecorationLine: 'underline' }}>Bỏ sơ đồ, quay về dạng danh sách</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}