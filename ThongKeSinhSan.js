// ========================================================
// 🐖 CHỈ SỐ SINH SẢN THEO KỲ (tuần / tháng / năm / tất cả)
// Nguồn: nhật ký heo nái (Du_Lieu_Goc) nhập ở tab Nhập liệu:
//   Phối, Lốc, Sảy Thai, Đẻ (soHeo = tổng sơ sinh, khoThai, chetNgop, coiCoc, chonNuoi), Cai Sữa (soHeo), Thải
// Tính riêng cho TỪNG NÁI từ chuỗi sự kiện của chính nó, rồi cộng lại thành tổng trại.
//
// NHÓM 1 - SINH SẢN & PHỐI GIỐNG
//   Sơ sinh / lứa        = tổng sơ sinh ÷ số ổ đẻ trong kỳ
//   Ca phối              = số lần phối, gộp các lần phối lặp (≤ 7 ngày) trong cùng một lần động dục
//   Tỉ lệ lốc            = số lốc ÷ số ca phối trong kỳ
//   Tỉ lệ sảy thai       = số sảy thai ÷ số ca phối trong kỳ
//   Tỉ lệ đẻ             = lần phối (trong kỳ) đã đẻ ÷ lần phối đã có kết quả (đẻ / lốc / sảy / thải)
// NHÓM 2 - NĂNG SUẤT ĐẺ & HEO CON
//   Sơ sinh sống / lứa   = (tổng sơ sinh − khô thai − chết ngộp) ÷ số ổ đẻ
//   Cai sữa / lứa        = tổng con cai sữa ÷ số ổ cai sữa
//   Chết trước cai sữa   = (con nuôi − con cai sữa) ÷ con nuôi, tính trên các ổ cai sữa trong kỳ
//                          con nuôi = "Chọn nuôi" nếu có, không có thì lấy sơ sinh sống của lần đẻ đó
// NHÓM 3 - HIỆU SUẤT TỔNG QUÁT CỦA NÁI (quy ra 1 năm)
//   Năm-nái              = tổng số ngày các nái có mặt trong kỳ ÷ 365
//                          (nái có mặt từ sự kiện đầu tiên đến ngày Thải, hoặc đến hôm nay)
//   Lứa / nái / năm      = số ổ đẻ ÷ năm-nái
//   Cai sữa / nái / năm  = số con cai sữa ÷ năm-nái
//   Ngày không làm việc  = ngày có mặt − ngày mang thai (phối → đẻ) − ngày nuôi con (đẻ → cai sữa)
//                          Phối mà lốc / sảy thì những ngày đó tính là KHÔNG làm việc.
// ========================================================
import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { parseToDateObject } from './DateUtils';
import { BoLocThoiGian, BO_LOC_MAC_DINH, tinhKhoang } from './BoLocThoiGian';

const NGAY = 86400000;
const MANG_THAI_TOI_DA = 120 * NGAY; // Phối chưa có kết quả: coi như mang thai tối đa 120 ngày
const NUOI_CON_TOI_DA = 40 * NGAY;   // Đẻ chưa ghi cai sữa: coi như nuôi con tối đa 40 ngày
const DE_TRUNG_TOI_DA = 100 * NGAY;  // 1 nái không thể đẻ 2 lần trong 100 ngày -> lần sau là nhập trùng
const CAI_TRUNG_TOI_DA = 60 * NGAY;  // 1 nái không thể cai sữa 2 lần trong 60 ngày -> lần sau là nhập trùng
const PHOI_LAP_TOI_DA = 7 * NGAY;

// ⚠️ NGƯỠNG XÁC ĐỊNH "NÁI CÓ VẤN ĐỀ" (chỉnh tại đây nếu trại có tiêu chuẩn khác)
export const NGUONG = {
  TI_LE_DE: 0.8,               // Tỉ lệ đẻ dưới 80%
  SO_SINH_LUA: 10,             // Sơ sinh dưới 10 con/lứa
  NGAY_CHO_PHOI_SAU_CAI: 10,   // Cai sữa quá 10 ngày chưa phối lại
  NGAY_CHO_PHOI_SAU_LOC: 21,   // Lốc / sảy quá 21 ngày chưa phối lại
  NGAY_QUA_DE: 120,            // Phối quá 120 ngày chưa có kết quả (chuẩn 114 ngày)
  NGAY_QUA_CAI: 40,            // Đẻ quá 40 ngày chưa ghi cai sữa
};    // 2 lần phối cách nhau ≤ 7 ngày, không có gì xen giữa = phối lặp trong cùng 1 lần động dục

const so = (v) => {
  const n = Number(String(v ?? '').trim());
  return isNaN(n) ? 0 : n;
};
const chuanSuKien = (sk) => String(sk || '').trim().normalize('NFC').toUpperCase();
const SK = { PHOI: 'PHỐI', LOC: 'LỐC', SAY: 'SẢY THAI', DE: 'ĐẺ', CAI: 'CAI SỮA', THAI: 'THẢI' };
const SK_KET_THUC_PHOI = [SK.DE, SK.LOC, SK.SAY, SK.THAI, SK.PHOI];
const SK_KET_THUC_NUOI = [SK.CAI, SK.PHOI, SK.THAI];

const songCuaO = (de) => Math.max(0, so(de.soHeo) - so(de.khoThai) - so(de.chetNgop));
const nuoiCuaO = (de) => (so(de.chonNuoi) > 0 ? so(de.chonNuoi) : songCuaO(de));

const trangThaiNai = (nai) => String(nai?.trangThaiDienThoai || nai?.trangThaiCotH || nai?.trangThai || '').trim().normalize('NFC').toUpperCase();

// Độ dài phần giao giữa [a1, a2) và [b1, b2)
const giao = (a1, a2, b1, b2) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));

export const tinhChiSoSinhSan = (danhSachLichSu, boLoc, danhSachMaTai) => {
  const bayGio = Date.now();

  // 1. Gom sự kiện của từng nái, sắp theo thời gian
  const theoNai = {};
  (Array.isArray(danhSachLichSu) ? danhSachLichSu : []).forEach((e) => {
    if (!e || e.actionType === 'delete' || !e.maTai) return;
    const sk = chuanSuKien(e.suKien);
    if (![SK.PHOI, SK.LOC, SK.SAY, SK.DE, SK.CAI, SK.THAI].includes(sk)) return;
    const d = parseToDateObject(e.ngay);
    if (!d) return;
    const ma = String(e.maTai).toUpperCase().trim();
    (theoNai[ma] = theoNai[ma] || []).push({ ...e, _sk: sk, _t: d.getTime() });
  });
  Object.values(theoNai).forEach((m) => m.sort((a, b) => a._t - b._t || String(a.id || '').localeCompare(String(b.id || ''))));

  // 🔁 Loại sự kiện NHẬP TRÙNG (đẻ 2 lần < 100 ngày, cai sữa 2 lần < 60 ngày): giữ lần đầu, lần sau không tính
  const trungLap = [];
  Object.keys(theoNai).forEach((ma) => {
    let deCuoi = null, caiCuoi = null;
    theoNai[ma] = theoNai[ma].filter((e) => {
      if (e._sk === SK.DE) {
        if (deCuoi && e._t - deCuoi._t < DE_TRUNG_TOI_DA) { trungLap.push({ ...e, _giuLai: deCuoi }); return false; }
        deCuoi = e;
      } else if (e._sk === SK.CAI) {
        if (caiCuoi && e._t - caiCuoi._t < CAI_TRUNG_TOI_DA) { trungLap.push({ ...e, _giuLai: caiCuoi }); return false; }
        caiCuoi = e;
      }
      return true;
    });
  });

  // 📒 Sổ mã tai: nguồn chuẩn để biết nái nào CÒN NUÔI (cùng nguồn với khối "Tổng quan đàn nái")
  // - Trạng thái "Thải" -> đã thải
  // - Có trong nhật ký nhưng KHÔNG còn trong sổ (đã xóa / đổi mã) -> coi như không còn nuôi
  const soMaTai = {};
  (Array.isArray(danhSachMaTai) ? danhSachMaTai : []).forEach((n) => {
    if (n && n.maTai) soMaTai[String(n.maTai).toUpperCase().trim()] = trangThaiNai(n);
  });
  const coSo = Object.keys(soMaTai).length > 0;
  const daThai = {};
  Object.keys(theoNai).forEach((ma) => {
    if (coSo && (!(ma in soMaTai) || soMaTai[ma] === 'THẢI')) daThai[ma] = true;
  });

  // 2. Khoảng thời gian của kỳ (không vượt quá hôm nay)
  const k = tinhKhoang(boLoc);
  let kTu, kDen;
  if (k) { kTu = k.tu.getTime(); kDen = Math.min(k.den.getTime(), bayGio); }
  else {
    kTu = Math.min(bayGio, ...Object.values(theoNai).map((ds) => ds[0]._t));
    kDen = bayGio;
  }
  const trongKy = (t) => t >= kTu && t < (k ? k.den.getTime() : Infinity);

  const taoKhung = () => ({
    phoi: 0, phoiLap: 0, loc: 0, say: 0,
    oDe: 0, soSinh: 0, songSinh: 0, khoThai: 0, chetNgop: 0, coiCoc: 0, chonNuoi: 0,
    oCai: 0, conCai: 0, conNuoiCuaOCai: 0, oCaiThieuDe: 0,
    phoiDeDuoc: 0, phoiKhongDe: 0, phoiDangCho: 0,
    ngayCoMat: 0, ngayLamViec: 0,
  });
  const tong = taoKhung();
  const tungNai = [];
  const suKienKy = []; // Danh sách sự kiện trong kỳ, để bấm vào ô số liệu xem chi tiết

  Object.entries(theoNai).forEach(([maTai, ds]) => {
    const kq = taoKhung();

    // --- Đếm sự kiện trong kỳ ---
    ds.forEach((e, i) => {
      if (!trongKy(e._t)) return;
      if ([SK.PHOI, SK.LOC, SK.DE, SK.CAI].includes(e._sk)) suKienKy.push(e);
      if (e._sk === SK.PHOI) {
        kq.phoi += 1;
        const kt = ds.slice(i + 1).find((x) => SK_KET_THUC_PHOI.includes(x._sk));
        // Phối lặp trong cùng lần động dục: chỉ tính 1 ca, kết quả lấy theo lần phối sau
        if (kt && kt._sk === SK.PHOI && kt._t - e._t <= PHOI_LAP_TOI_DA) { kq.phoiLap += 1; return; }
        if (!kt) kq.phoiDangCho += 1;
        else if (kt._sk === SK.DE) kq.phoiDeDuoc += 1;
        else kq.phoiKhongDe += 1;
      } else if (e._sk === SK.LOC) kq.loc += 1;
      else if (e._sk === SK.SAY) kq.say += 1;
      else if (e._sk === SK.DE) {
        kq.oDe += 1;
        kq.soSinh += so(e.soHeo);
        kq.songSinh += songCuaO(e);
        kq.khoThai += so(e.khoThai);
        kq.chetNgop += so(e.chetNgop);
        kq.coiCoc += so(e.coiCoc);
        kq.chonNuoi += nuoiCuaO(e);
      } else if (e._sk === SK.CAI) {
        kq.oCai += 1;
        kq.conCai += so(e.soHeo);
        const deTruoc = ds.slice(0, i).reverse().find((x) => x._sk === SK.DE);
        if (deTruoc) kq.conNuoiCuaOCai += nuoiCuaO(deTruoc);
        else kq.oCaiThieuDe += 1;
      }
    });

    // --- Ngày có mặt và ngày làm việc trong kỳ ---
    const vao = ds[0]._t;
    const suKienThai = ds.find((x) => x._sk === SK.THAI);
    const ra = suKienThai ? suKienThai._t : (daThai[maTai] ? ds[ds.length - 1]._t : bayGio);
    const tu = Math.max(vao, kTu);
    const den = Math.min(ra, kDen);
    if (den > tu) {
      kq.ngayCoMat = (den - tu) / NGAY;
      let lamViec = 0;
      ds.forEach((e, i) => {
        if (e._sk === SK.PHOI) {
          const kt = ds.slice(i + 1).find((x) => SK_KET_THUC_PHOI.includes(x._sk));
          if (kt && kt._sk === SK.PHOI && kt._t - e._t <= PHOI_LAP_TOI_DA) {
            lamViec += giao(e._t, kt._t, tu, den);                                                 // Phối lặp: nối liền ca sau
          } else if (kt && kt._sk === SK.DE) lamViec += giao(e._t, kt._t, tu, den);                       // Mang thai thành công
          else if (!kt) lamViec += giao(e._t, Math.min(bayGio, e._t + MANG_THAI_TOI_DA), tu, den);  // Đang mang thai
        } else if (e._sk === SK.DE) {
          const kt = ds.slice(i + 1).find((x) => SK_KET_THUC_NUOI.includes(x._sk));
          const het = kt ? kt._t : Math.min(bayGio, e._t + NUOI_CON_TOI_DA);
          lamViec += giao(e._t, het, tu, den);                                                     // Nuôi con
        }
      });
      kq.ngayLamViec = Math.min(lamViec / NGAY, kq.ngayCoMat);
    }

    // --- Tình trạng HIỆN TẠI (tính tới hôm nay): nái đang nằm không, quá ngày đẻ ---
    let hienTai = null;
    const cuoi = ds[ds.length - 1];
    if (!suKienThai && !daThai[maTai] && cuoi) {
      const soNgay = Math.floor((bayGio - cuoi._t) / NGAY);
      if (cuoi._sk === SK.CAI && soNgay > NGUONG.NGAY_CHO_PHOI_SAU_CAI) hienTai = `Cai sữa ${soNgay} ngày chưa phối lại`;
      else if ((cuoi._sk === SK.LOC || cuoi._sk === SK.SAY) && soNgay > NGUONG.NGAY_CHO_PHOI_SAU_LOC) hienTai = `${cuoi._sk === SK.LOC ? 'Lốc' : 'Sảy thai'} ${soNgay} ngày chưa phối lại`;
      else if (cuoi._sk === SK.PHOI && soNgay > NGUONG.NGAY_QUA_DE) hienTai = `Phối ${soNgay} ngày chưa đẻ`;
      else if (cuoi._sk === SK.DE && soNgay > NGUONG.NGAY_QUA_CAI) hienTai = `Đẻ ${soNgay} ngày chưa cai sữa`;
    }

    if (kq.ngayCoMat > 0 || kq.phoi + kq.loc + kq.say + kq.oDe + kq.oCai > 0) {
      tungNai.push({
        maTai, ...kq, hienTai,
        daThai: !!suKienThai || !!daThai[maTai],             // để ẩn khỏi bảng từng nái
        khongCoTrongSo: coSo && !(maTai in soMaTai),          // có nhật ký nhưng không còn trong sổ mã tai
      });
      Object.keys(tong).forEach((key) => { tong[key] += kq[key]; });
    }
  });

  // Nái còn nuôi trong sổ nhưng chưa có sự kiện nào (VD: hậu bị mới nhập) -> vẫn hiện trong bảng, số liệu trống
  Object.entries(soMaTai).forEach(([ma, st]) => {
    if (st !== 'THẢI' && !theoNai[ma]) tungNai.push({ maTai: ma, ...taoKhung(), daThai: false, chuaCoSuKien: true });
  });

  return {
    ...tong, tungNai, suKienKy,
    trungLap: trungLap.filter((e) => trongKy(e._t)),
    soNgayKy: Math.max(0, (kDen - kTu) / NGAY),
  };
};

// Chỉ số rút gọn của 1 nái (hoặc của tổng trại - cùng công thức)
export const chiSo = (n) => {
  const chia = (a, b) => (b > 0 ? a / b : null);
  const namNai = n.ngayCoMat / 365;
  const khongLamViec = Math.max(0, n.ngayCoMat - n.ngayLamViec);
  return {
    soSinhLua: chia(n.soSinh, n.oDe),
    songLua: chia(n.songSinh, n.oDe),
    caiLua: chia(n.conCai, n.oCai),
    tiLeDe: chia(n.phoiDeDuoc, n.phoiDeDuoc + n.phoiKhongDe),
    tiLeLoc: chia(n.loc, n.phoi - n.phoiLap),
    tiLeSay: chia(n.say, n.phoi - n.phoiLap),
    tiLeChetTruocCai: n.conNuoiCuaOCai > 0 ? Math.max(0, n.conNuoiCuaOCai - n.conCai) / n.conNuoiCuaOCai : null,
    luaNaiNam: chia(n.oDe, namNai),
    caiNaiNam: chia(n.conCai, namNai),
    ngayKhongLamViec: khongLamViec,
    ngayKhongLamViecNam: chia(khongLamViec, namNai),
  };
};

const pt = (v) => (v === null || v === undefined ? '—' : `${Math.round(v * 1000) / 10}%`);
const sl = (v, le = 1) => (v === null || v === undefined ? '—' : String(Math.round(v * 10 ** le) / 10 ** le));

// ---------------- GIAO DIỆN ----------------
const Dong = ({ ten, giaTri, mau = '#111111', dam, chuThich }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#ffe5d4' }}>
    <View style={{ flex: 1, paddingRight: 8 }}>
      <Text style={{ fontSize: 13, color: '#333333', fontWeight: dam ? 'bold' : 'normal' }}>{ten}</Text>
      {!!chuThich && <Text style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>{chuThich}</Text>}
    </View>
    <Text style={{ fontSize: dam ? 15 : 14, color: mau, fontWeight: 'bold' }}>{giaTri}</Text>
  </View>
);

const O = ({ ten, giaTri, mau, nen, dangMo, onPress }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress}
    style={{ flex: 1, backgroundColor: nen, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1.5, borderColor: dangMo ? mau : nen }}>
    <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: mau }}>{ten}</Text>
    <Text style={{ fontSize: 17, fontWeight: '900', color: mau }}>{giaTri}</Text>
    <Text style={{ fontSize: 9, color: mau, opacity: 0.7 }}>{dangMo ? '▲ ẩn' : '▼ xem'}</Text>
  </TouchableOpacity>
);

const TEN_SK = { 'PHỐI': 'Phối', 'LỐC': 'Lốc', 'ĐẺ': 'Đẻ', 'CAI SỮA': 'Cai sữa' };

// Danh sách sự kiện trong kỳ (bấm vào ô số liệu để mở)
function DanhSachSuKien({ ds, tieuDe, mau, laTrung }) {
  const [soDong, setSoDong] = useState(30);
  const sx = [...ds].sort((a, b) => b._t - a._t);
  return (
    <View style={{ borderWidth: 1, borderColor: mau, borderRadius: 8, padding: 8, marginBottom: 10, backgroundColor: '#ffffff' }}>
      <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: mau, marginBottom: 6 }}>{tieuDe} ({ds.length})</Text>
      {sx.slice(0, soDong).map((e, i) => (
        <View key={`${e.id || ''}_${i}`} style={{ paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#eeeeee' }}>
          <Text style={{ fontSize: 12, color: '#1e293b' }}>
            <Text style={{ fontWeight: 'bold' }}>{e.maTai}</Text>
            {`  ·  ${e.ngay}  ·  ${TEN_SK[e._sk] || e.suKien}`}
            {(e._sk === SK.DE || e._sk === SK.CAI) ? `  ·  ${so(e.soHeo)} con` : ''}
          </Text>
          {laTrung && e._giuLai && (
            <Text style={{ fontSize: 10.5, color: '#dc2626' }}>
              Trùng với lần {TEN_SK[e._giuLai._sk]} ngày {e._giuLai.ngay}{e._giuLai._t === e._t ? ' (cùng ngày)' : ''} · không được tính
            </Text>
          )}
        </View>
      ))}
      {ds.length > soDong && (
        <TouchableOpacity onPress={() => setSoDong(soDong + 30)} style={{ paddingTop: 6, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: mau }}>Xem thêm ({ds.length - soDong})</Text>
        </TouchableOpacity>
      )}
      {laTrung && (
        <Text style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 6 }}>
          Nên vào tab Nhập liệu xóa dòng trùng bằng tài khoản chủ trại để số liệu gọn và đúng.
        </Text>
      )}
    </View>
  );
}

const Nhom = ({ so: soNhom, tieuDe, children }) => (
  <View style={{ backgroundColor: '#fffaf5', borderRadius: 10, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, borderWidth: 1, borderColor: '#ffd3b6', marginBottom: 10 }}>
    <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#e65100', marginBottom: 2, letterSpacing: 0.3 }}>{soNhom}. {tieuDe}</Text>
    {children}
  </View>
);

// Liệt kê lý do nái cần chú ý (dựa trên số liệu trong kỳ + tình trạng hiện tại)
export const vanDeCuaNai = (n, cs) => {
  const ds = [];
  if (n.hienTai) ds.push(n.hienTai);
  if (cs.tiLeDe !== null && cs.tiLeDe < NGUONG.TI_LE_DE) ds.push(`Tỉ lệ đẻ ${pt(cs.tiLeDe)}`);
  if (n.loc > 0) ds.push(`Lốc ${n.loc} lần`);
  if (n.say > 0) ds.push(`Sảy thai ${n.say} lần`);
  if (cs.soSinhLua !== null && cs.soSinhLua < NGUONG.SO_SINH_LUA) ds.push(`Sơ sinh ${sl(cs.soSinhLua)} con/lứa`);
  return ds;
};

const CACH_XEP = [
  { ma: 'VAN_DE', ten: 'Nhiều vấn đề' },
  { ma: 'TI_LE_DE', ten: 'Tỉ lệ đẻ thấp' },
  { ma: 'SO_SINH', ten: 'Sơ sinh ít' },
  { ma: 'NGAY_NGHI', ten: 'Nghỉ nhiều' },
];

const xepNai = (ds, cach) => {
  const v = ds;
  const cuoi = (x) => (x === null ? Infinity : x);
  if (cach === 'VAN_DE') v.sort((a, b) => b._vd.length - a._vd.length || a.maTai.localeCompare(b.maTai, 'vi', { numeric: true }));
  else if (cach === 'TI_LE_DE') v.sort((a, b) => cuoi(a._cs.tiLeDe) - cuoi(b._cs.tiLeDe) || b.loc - a.loc);
  else if (cach === 'SO_SINH') v.sort((a, b) => cuoi(a._cs.soSinhLua) - cuoi(b._cs.soSinhLua));
  else if (cach === 'NGAY_NGHI') v.sort((a, b) => b._cs.ngayKhongLamViec - a._cs.ngayKhongLamViec);
  else v.sort((a, b) => a.maTai.localeCompare(b.maTai, 'vi', { numeric: true }));
  return v;
};

function BangTungNai({ tungNai, onXemNai }) {
  const [moBang, setMoBang] = useState(false);
  const [cachXep, setCachXep] = useState('VAN_DE');
  const [soDong, setSoDong] = useState(20);
  const [hienTatCa, setHienTatCa] = useState(false);     // Mặc định chỉ nái có vấn đề
  const [hienNaiThai, setHienNaiThai] = useState(false); // Mặc định ẩn nái đã thải
  const daTinh = useMemo(() => tungNai.map((n) => { const cs = chiSo(n); return { ...n, _cs: cs, _vd: vanDeCuaNai(n, cs) }; }), [tungNai]);
  const conNuoi = daTinh.filter((n) => !n.daThai);
  const coVanDe = conNuoi.filter((n) => n._vd.length > 0);
  const soNaiThai = daTinh.length - conNuoi.length;
  const ds = useMemo(() => {
    let loc = hienTatCa ? daTinh : coVanDe;
    if (!hienNaiThai) loc = loc.filter((n) => !n.daThai);
    return xepNai([...loc], cachXep);
  }, [daTinh, cachXep, hienTatCa, hienNaiThai]);

  return (
    <View style={{ marginTop: 2 }}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setMoBang(!moBang)}
        style={{ backgroundColor: '#fff0e6', borderWidth: 1, borderColor: '#ffd3b6', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}>
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100' }}>
          {moBang ? '▲ Ẩn danh sách nái' : (coVanDe.length ? `⚠️ Nái cần chú ý (${coVanDe.length}/${conNuoi.length} con)` : `✅ Không có nái nào cần chú ý (${conNuoi.length} con)`)}
        </Text>
      </TouchableOpacity>

      {moBang && (
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', gap: 5, marginBottom: 8 }}>
            {CACH_XEP.map((c) => {
              const bat = cachXep === c.ma;
              return (
                <TouchableOpacity key={c.ma} activeOpacity={0.7} onPress={() => { setCachXep(c.ma); setSoDong(20); }}
                  style={{ flex: 1, paddingVertical: 6, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: bat ? '#e65100' : '#e2e8f0', backgroundColor: bat ? '#e65100' : '#ffffff' }}>
                  <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: bat ? '#ffffff' : '#64748b' }}>{c.ten}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity activeOpacity={0.7} onPress={() => { setHienTatCa(!hienTatCa); setSoDong(20); }}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 15, marginRight: 6 }}>{hienTatCa ? '☑️' : '⬜'}</Text>
            <Text style={{ fontSize: 12, color: '#555555' }}>Hiện cả nái bình thường ({conNuoi.length - coVanDe.length} con)</Text>
          </TouchableOpacity>
          {soNaiThai > 0 && (
            <TouchableOpacity activeOpacity={0.7} onPress={() => { setHienNaiThai(!hienNaiThai); setSoDong(20); }}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 15, marginRight: 6 }}>{hienNaiThai ? '☑️' : '⬜'}</Text>
              <Text style={{ fontSize: 12, color: '#555555' }}>Hiện cả nái đã thải / không còn trong sổ ({soNaiThai} con)</Text>
            </TouchableOpacity>
          )}

          {ds.slice(0, soDong).map((n) => {
            const cs = n._cs;
            const canhBao = n._vd.length > 0;
            return (
              <TouchableOpacity key={n.maTai} activeOpacity={onXemNai ? 0.7 : 1} disabled={!onXemNai} onPress={() => onXemNai && onXemNai(n.maTai)}
                style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: canhBao ? '#fecaca' : '#e9ecef', borderRadius: 8, padding: 10, marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: n.daThai ? '#94a3b8' : '#1e293b' }}>
                    {canhBao ? '⚠️ ' : '🐷 '}{n.maTai}{n.khongCoTrongSo ? ' (không còn trong sổ)' : (n.daThai ? ' (đã thải)' : '')}{n.chuaCoSuKien ? ' · chưa có sự kiện' : ''}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: cs.tiLeDe === null ? '#94a3b8' : (cs.tiLeDe < 0.8 ? '#dc2626' : '#16a34a') }}>
                    Tỉ lệ đẻ {pt(cs.tiLeDe)}
                  </Text>
                </View>
                <Text style={{ fontSize: 11.5, color: '#555555', marginTop: 4 }}>
                  Phối {n.phoi} · Đẻ {n.oDe} · Lốc {n.loc}{n.say ? ` · Sảy ${n.say}` : ''}{n.phoiDangCho ? ` · Đang chờ ${n.phoiDangCho}` : ''}
                </Text>
                <Text style={{ fontSize: 11.5, color: '#555555', marginTop: 2 }}>
                  Sơ sinh {sl(cs.soSinhLua)} · Sống {sl(cs.songLua)} · Cai sữa {sl(cs.caiLua)} con/lứa
                </Text>
                <Text style={{ fontSize: 11.5, color: '#555555', marginTop: 2 }}>
                  Chết trước cai {pt(cs.tiLeChetTruocCai)} · Không làm việc {sl(cs.ngayKhongLamViec, 0)} ngày
                </Text>
                {canhBao && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {n._vd.map((ld) => (
                      <Text key={ld} style={{ fontSize: 10.5, fontWeight: 'bold', color: '#b91c1c', backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' }}>{ld}</Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {ds.length === 0 && (
            <Text style={{ fontSize: 12, color: '#16a34a', textAlign: 'center', paddingVertical: 10 }}>✅ Không có nái nào cần chú ý trong kỳ này.</Text>
          )}

          {ds.length > soDong && (
            <TouchableOpacity activeOpacity={0.7} onPress={() => setSoDong(soDong + 20)} style={{ paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#e65100' }}>Xem thêm ({ds.length - soDong} nái)</Text>
            </TouchableOpacity>
          )}
          <Text style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 4 }}>
            Nái cần chú ý: tỉ lệ đẻ dưới {NGUONG.TI_LE_DE * 100}%, có lốc/sảy, sơ sinh dưới {NGUONG.SO_SINH_LUA} con/lứa (trong kỳ); hoặc hiện đang cai sữa quá {NGUONG.NGAY_CHO_PHOI_SAU_CAI} ngày, lốc/sảy quá {NGUONG.NGAY_CHO_PHOI_SAU_LOC} ngày chưa phối lại, phối quá {NGUONG.NGAY_QUA_DE} ngày chưa đẻ, đẻ quá {NGUONG.NGAY_QUA_CAI} ngày chưa cai sữa.{onXemNai ? ' Chạm vào nái để xem lịch sử.' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function ThongKeSinhSan({ danhSachLichSu, danhSachMaTai, onXemNai }) {
  const [boLoc, setBoLoc] = useState(BO_LOC_MAC_DINH);
  // Cùng nguồn trạng thái nái với khối "Tổng quan đàn nái"
  const soNai = (Array.isArray(global.danhSachCapNhatTrangThai) && global.danhSachCapNhatTrangThai.length) ? global.danhSachCapNhatTrangThai : danhSachMaTai;
  const kq = useMemo(() => tinhChiSoSinhSan(danhSachLichSu, boLoc, soNai), [danhSachLichSu, soNai, boLoc]);
  const [moDs, setMoDs] = useState(null); // Ô số liệu đang mở danh sách
  const [hienChiSo, setHienChiSo] = useState(false); // 👁 nút Ẩn / Hiện cả khối chỉ số sinh sản (mặc định ẩn cho gọn)
  const batTat = (ma) => setMoDs(moDs === ma ? null : ma);
  const locSk = (sk) => kq.suKienKy.filter((e) => e._sk === sk);
  const cs = chiSo(kq);
  const daCoKetQua = kq.phoiDeDuoc + kq.phoiKhongDe;
  const naiBinhQuan = kq.soNgayKy > 0 ? kq.ngayCoMat / kq.soNgayKy : 0;

  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ marginBottom: 8, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#e65100', letterSpacing: 0.5 }}>🐖 CHỈ SỐ SINH SẢN</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setHienChiSo(!hienChiSo)}
          style={{ backgroundColor: hienChiSo ? '#fff0e6' : '#e65100', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 0.5, borderColor: '#ffd3b6' }}>
          <Text style={{ color: hienChiSo ? '#e65100' : '#ffffff', fontSize: 11, fontWeight: 'bold' }}>{hienChiSo ? 'Ẩn ▲' : 'Hiện ▼'}</Text>
        </TouchableOpacity>
      </View>
      {hienChiSo && (<>
      <BoLocThoiGian giaTri={boLoc} onDoi={setBoLoc} mauChinh="#e65100" />

      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
        <O ten="Phối" giaTri={kq.phoi} mau="#2563eb" nen="#dbeafe" dangMo={moDs === SK.PHOI} onPress={() => batTat(SK.PHOI)} />
        <O ten="Lốc" giaTri={kq.loc} mau="#dc2626" nen="#fee2e2" dangMo={moDs === SK.LOC} onPress={() => batTat(SK.LOC)} />
        <O ten="Ổ đẻ" giaTri={kq.oDe} mau="#16a34a" nen="#dcfce7" dangMo={moDs === SK.DE} onPress={() => batTat(SK.DE)} />
        <O ten="Ổ cai sữa" giaTri={kq.oCai} mau="#7c3aed" nen="#ede9fe" dangMo={moDs === SK.CAI} onPress={() => batTat(SK.CAI)} />
      </View>

      {kq.trungLap.length > 0 && (
        <TouchableOpacity activeOpacity={0.7} onPress={() => batTat('TRUNG')}
          style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, padding: 8, marginBottom: 10 }}>
          <Text style={{ fontSize: 12, color: '#b91c1c', fontWeight: 'bold' }}>
            ⚠️ {kq.trungLap.length} sự kiện nghi nhập trùng, không được tính · {moDs === 'TRUNG' ? 'ẩn' : 'bấm để xem'}
          </Text>
        </TouchableOpacity>
      )}

      {moDs === 'TRUNG' && <DanhSachSuKien ds={kq.trungLap} tieuDe="Sự kiện nghi nhập trùng" mau="#dc2626" laTrung />}
      {moDs === SK.PHOI && <DanhSachSuKien ds={locSk(SK.PHOI)} tieuDe="Các lần phối trong kỳ" mau="#2563eb" />}
      {moDs === SK.LOC && <DanhSachSuKien ds={locSk(SK.LOC)} tieuDe="Các lần lốc trong kỳ" mau="#dc2626" />}
      {moDs === SK.DE && <DanhSachSuKien ds={locSk(SK.DE)} tieuDe="Các ổ đẻ trong kỳ" mau="#16a34a" />}
      {moDs === SK.CAI && <DanhSachSuKien ds={locSk(SK.CAI)} tieuDe="Các ổ cai sữa trong kỳ" mau="#7c3aed" />}

      <Nhom so={1} tieuDe="SINH SẢN & PHỐI GIỐNG">
        <Dong ten="Tổng sơ sinh / lứa" giaTri={`${sl(cs.soSinhLua)} con`} chuThich={`${kq.soSinh} con / ${kq.oDe} ổ đẻ`} />
        <Dong ten="Số ca phối" giaTri={`${kq.phoi - kq.phoiLap} ca`} mau="#2563eb"
          chuThich={kq.phoiLap ? `${kq.phoi} lần phối · ${kq.phoiLap} lần phối lặp trong cùng kỳ động dục được gộp` : `${kq.phoi} lần phối`} />
        <Dong ten="Tỉ lệ lốc" mau="#dc2626" giaTri={pt(cs.tiLeLoc)} chuThich={`${kq.loc} lốc / ${kq.phoi - kq.phoiLap} ca phối`} />
        <Dong ten="Tỉ lệ sảy thai" mau="#dc2626" giaTri={pt(cs.tiLeSay)} chuThich={`${kq.say} sảy / ${kq.phoi - kq.phoiLap} ca phối`} />
        <Dong ten="Tỉ lệ đẻ (thụ thai thành công)" dam mau="#16a34a" giaTri={pt(cs.tiLeDe)}
          chuThich={`${kq.phoiDeDuoc} đẻ / ${daCoKetQua} ca phối đã có kết quả${kq.phoiDangCho ? ` · ${kq.phoiDangCho} ca đang chờ` : ''}`} />
      </Nhom>

      <Nhom so={2} tieuDe="NĂNG SUẤT ĐẺ & HEO CON">
        <Dong ten="Tổng sơ sinh / lứa" giaTri={`${sl(cs.soSinhLua)} con`} />
        <Dong ten="Sơ sinh còn sống / lứa" mau="#16a34a" giaTri={`${sl(cs.songLua)} con`}
          chuThich={`Trừ khô thai ${kq.khoThai} · chết ngộp ${kq.chetNgop} (còi cọc ${kq.coiCoc} vẫn tính sống)`} />
        <Dong ten="Cai sữa / lứa" mau="#7c3aed" giaTri={`${sl(cs.caiLua)} con`} chuThich={`${kq.conCai} con / ${kq.oCai} ổ cai sữa`} />
        <Dong ten="Chết trước cai sữa" dam mau="#dc2626" giaTri={pt(cs.tiLeChetTruocCai)}
          chuThich={`Nuôi ${kq.conNuoiCuaOCai} → cai ${kq.conCai} con${kq.oCaiThieuDe ? ` · ${kq.oCaiThieuDe} ổ thiếu dữ liệu đẻ` : ''}`} />
      </Nhom>

      {/* Nhóm 3 quy ra 1 năm: chỉ hiện khi xem theo Năm hoặc Tất cả (tuần/tháng dao động quá mạnh) */}
      {(boLoc.che === 'NAM' || boLoc.che === 'TAT_CA') ? (
      <Nhom so={3} tieuDe="HIỆU SUẤT TỔNG QUÁT CỦA NÁI">
        <Dong ten="Số lứa / nái / năm" dam mau="#16a34a" giaTri={sl(cs.luaNaiNam, 2)} />
        <Dong ten="Cai sữa / nái / năm" dam mau="#7c3aed" giaTri={`${sl(cs.caiNaiNam)} con`} />
        <Dong ten="Ngày không làm việc / nái / năm" dam mau="#dc2626" giaTri={`${sl(cs.ngayKhongLamViecNam, 0)} ngày`}
          chuThich="Ngày nái không mang thai, không nuôi con (kể cả thời gian phối rồi lốc/sảy)" />
        <Dong ten="Số nái bình quân trong kỳ" giaTri={`${sl(naiBinhQuan)} con`} />
      </Nhom>
      ) : (
        <TouchableOpacity activeOpacity={0.7} onPress={() => setBoLoc({ che: 'NAM', moc: new Date() })}
          style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: '#ffd3b6', borderRadius: 10, padding: 10, marginBottom: 10, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>3. Hiệu suất tổng quát của nái chỉ xem theo Năm · <Text style={{ color: '#e65100', fontWeight: 'bold' }}>Chuyển sang Năm</Text></Text>
        </TouchableOpacity>
      )}

      {/* 🐷 PHIẾU THÀNH TÍCH TỪNG NÁI: các chỉ số trên chính là cộng các nái này */}
      <BangTungNai tungNai={kq.tungNai} onXemNai={onXemNai} />
      </>)}
    </View>
  );
}