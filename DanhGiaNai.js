// ========================================================
// ⭐ ĐÁNH GIÁ NÁI — tab thứ 3 trong cửa sổ chi tiết heo nái
// Tính hoàn toàn trên máy từ nhật ký nhập liệu (Đẻ / Cai sữa / Phối / Lốc / Sảy).
// Mỗi chỉ số chấm Tốt (2đ) / Đạt (1đ) / Kém (0đ) theo NGUONG bên dưới -> % điểm -> xếp loại A/B/C/D.
// Muốn đổi tiêu chuẩn của trại: chỉ cần sửa các con số trong NGUONG.
// ========================================================
import React from 'react';
import { View, Text } from 'react-native';
import { layCacLuaDeCuaNai } from './SoHeoThit';

const NGAY = 86400000;

// tot: đạt mức này là Tốt, dat: đạt mức này là Đạt, còn lại Kém. nguoc = số càng NHỎ càng tốt.
export const NGUONG = {
  soSinhSong: { tot: 15, dat: 10 },
  caiSua: { tot: 13, dat: 9 },
  nuoiSong: { tot: 90, dat: 80 }, // %
  luaNam: { tot: 2.2, dat: 2.0 },
  caiDenPhoi: { tot: 7, dat: 12, nguoc: true }, // ngày
  lucSay: { tot: 0, dat: 1, nguoc: true }, // số lần lốc + sảy
};

const XEP_LOAI = [
  { tu: 80, ma: 'A', ten: 'Nái tốt', loiKhuyen: 'Giữ lại, ưu tiên chăm sóc.', mau: '#16a34a', nen: '#ecfdf3' },
  { tu: 55, ma: 'B', ten: 'Nái khá', loiKhuyen: 'Giữ lại, tiếp tục theo dõi các chỉ số còn yếu.', mau: '#0284c7', nen: '#eff8ff' },
  { tu: 35, ma: 'C', ten: 'Trung bình', loiKhuyen: 'Theo dõi sát 1–2 lứa tới, xem lại khẩu phần và chăm sóc.', mau: '#d97706', nen: '#fff8eb' },
  { tu: 0, ma: 'D', ten: 'Năng suất thấp', loiKhuyen: 'Cân nhắc loại thải nếu lứa tới không cải thiện.', mau: '#dc2626', nen: '#fef2f2' },
];

const chuan = (v) => String(v || '').trim().normalize('NFC').toUpperCase();
const tb = (mang) => (mang.length ? mang.reduce((a, b) => a + b, 0) / mang.length : null);
const lam1 = (x) => (x === null || x === undefined || isNaN(x) ? null : Math.round(x * 10) / 10);

const cham = (giaTri, n) => {
  if (giaTri === null) return null;
  if (n.nguoc) return giaTri <= n.tot ? 2 : giaTri <= n.dat ? 1 : 0;
  return giaTri >= n.tot ? 2 : giaTri >= n.dat ? 1 : 0;
};

// Tính toàn bộ chỉ số của 1 nái
export const tinhDanhGiaNai = (danhSachLichSu, maTai, luaGoc, parseToDateObject, homNay = new Date()) => {
  const ma = chuan(maTai);
  const cacLua = layCacLuaDeCuaNai(danhSachLichSu, maTai, luaGoc).slice().reverse(); // cũ -> mới
  const suKien = (Array.isArray(danhSachLichSu) ? danhSachLichSu : [])
    .filter((e) => e && e.actionType !== 'delete' && chuan(e.maTai) === ma)
    .map((e) => ({ sk: chuan(e.suKien), d: parseToDateObject(e.ngay) }))
    .filter((e) => e.d)
    .sort((a, b) => a.d - b.d);

  const ngayDe = cacLua.map((l) => parseToDateObject(l.ngayDe)).filter(Boolean);
  const daCai = cacLua.filter((l) => l.ngayCaiSua);

  // 1. Sinh sản từng lứa
  const soSinhSong = tb(cacLua.map((l) => Number(l.soHeoCon) || 0));
  const chetSoSinh = tb(cacLua.map((l) => (Number(l.khoThai) || 0) + (Number(l.coiCoc) || 0) + (Number(l.chetNgop) || 0)));
  const caiSua = tb(daCai.map((l) => Number(l.soConCaiSua) || 0));
  const tongChon = daCai.reduce((a, l) => a + (Number(l.chonNuoi) || 0), 0);
  const tongCai = daCai.reduce((a, l) => a + (Number(l.soConCaiSua) || 0), 0);
  const nuoiSong = tongChon > 0 ? Math.min(100, (tongCai / tongChon) * 100) : null;
  const ngayNuoiCon = tb(daCai.map((l) => Number(l.soNgay) || 0).filter((x) => x > 0));

  // 2. Nhịp đẻ: khoảng cách giữa 2 lứa -> số lứa / năm
  const khoangCach = [];
  for (let i = 1; i < ngayDe.length; i++) khoangCach.push((ngayDe[i] - ngayDe[i - 1]) / NGAY);
  const kcTB = tb(khoangCach);
  const luaNam = kcTB ? 365 / kcTB : null;

  // 3. Nái ĐANG nằm chờ: sự kiện cuối là Cai sữa / Lốc / Sảy mà chưa phối lại -> đếm ngày tới hôm nay
  const phoi = suKien.filter((e) => e.sk === 'PHỐI');
  const daThai = suKien.some((e) => e.sk === 'THẢI');
  const skChinh = suKien.filter((e) => ['PHỐI', 'ĐẺ', 'CAI SỮA', 'LỐC'].includes(e.sk) || e.sk.startsWith('SẢY'));
  const cuoi = skChinh[skChinh.length - 1];
  const dangCho = !daThai && cuoi && cuoi.sk !== 'PHỐI' && cuoi.sk !== 'ĐẺ'
    ? { soNgay: Math.max(0, Math.floor((homNay - cuoi.d) / NGAY)), tu: cuoi.sk === 'CAI SỮA' ? 'cai sữa' : cuoi.sk === 'LỐC' ? 'lốc' : 'sảy thai', d: cuoi.d }
    : null;

  // Cai sữa -> phối lại: lần phối đầu tiên sau cai (không giới hạn số ngày).
  // Lứa mới nhất chưa phối lại thì tính số ngày tới hôm nay (đang kéo dài).
  const caiDenPhoi = tb(daCai.map((l, i) => {
    const dc = parseToDateObject(l.ngayCaiSua);
    if (!dc) return null;
    const p = phoi.find((x) => x.d >= dc);
    if (p) return (p.d - dc) / NGAY;
    return i === daCai.length - 1 && dangCho && dangCho.tu === 'cai sữa' ? dangCho.soNgay : null;
  }).filter((x) => x !== null));

  // 4. Phối -> đẻ: chỉ tính các lần phối đã đủ 120 ngày (đã biết kết quả)
  const phoiDaBietKetQua = phoi.filter((p) => (homNay - p.d) / NGAY >= 120);
  const chuKyPhoi = phoiDaBietKetQua.filter((p, i) => i === 0 || (p.d - phoiDaBietKetQua[i - 1].d) / NGAY > 10); // phối lặp trong 10 ngày = 1 lần
  const deTuPhoi = ngayDe.filter((d) => chuKyPhoi.some((p) => (d - p.d) / NGAY >= 100 && (d - p.d) / NGAY <= 125)).length;
  const dauThai = chuKyPhoi.length ? Math.min(100, (deTuPhoi / chuKyPhoi.length) * 100) : null;

  // 5. Ngày lãng phí (không mang thai, không nuôi con): từ cai sữa lứa trước tới lúc đậu thai lứa sau
  //    = (ngày đẻ lứa sau − ngày cai sữa lứa trước) − 114 ngày mang thai
  const MANG_THAI = 114;
  const lanPhi = [];
  for (let i = 0; i + 1 < cacLua.length; i++) {
    const dc = parseToDateObject(cacLua[i].ngayCaiSua);
    const dd = parseToDateObject(cacLua[i + 1].ngayDe);
    if (dc && dd) lanPhi.push(Math.max(0, (dd - dc) / NGAY - MANG_THAI));
  }
  if (dangCho && dangCho.soNgay > 0) lanPhi.push(dangCho.soNgay); // đang chờ phối: số ngày tới hôm nay cũng là lãng phí
  const lanPhiLua = tb(lanPhi);
  const lanPhiNam = lanPhiLua !== null && luaNam ? lanPhiLua * luaNam : null;

  const lucSay = suKien.filter((e) => e.sk === 'LỐC' || e.sk.startsWith('SẢY')).length;
  const caiNam = caiSua !== null && luaNam ? caiSua * luaNam : null;
  const goc = parseInt(String(luaGoc || '').replace(/\D/g, ''), 10) || 0;

  const chiSo = [
    { ma: 'soSinhSong', ten: 'Sơ sinh sống / lứa', gt: lam1(soSinhSong), dv: 'con' },
    { ma: 'caiSua', ten: 'Cai sữa / lứa', gt: lam1(caiSua), dv: 'con' },
    { ma: 'nuoiSong', ten: 'Tỷ lệ nuôi sống', gt: lam1(nuoiSong), dv: '%' },
    { ma: 'luaNam', ten: 'Số lứa / năm', gt: luaNam ? Math.round(luaNam * 100) / 100 : null, dv: 'lứa', chuThich: kcTB ? `${Math.round(kcTB)} ngày / lứa` : 'cần ít nhất 2 lứa' },
    { ma: 'caiDenPhoi', ten: 'Cai sữa → phối lại', gt: lam1(caiDenPhoi), dv: 'ngày' },
    { ma: 'lucSay', ten: 'Lốc / sảy thai', gt: lucSay, dv: 'lần' },
  ].map((c) => ({ ...c, diem: cham(c.gt, NGUONG[c.ma]) }));

  const coDiem = chiSo.filter((c) => c.diem !== null && c.ma !== 'lucSay');
  const duDuLieu = cacLua.length >= 1 && coDiem.length >= 2;
  const tinhDiem = chiSo.filter((c) => c.diem !== null);
  const phanTram = tinhDiem.length ? Math.round((tinhDiem.reduce((a, c) => a + c.diem, 0) / (tinhDiem.length * 2)) * 100) : 0;
  const xepLoai = duDuLieu ? XEP_LOAI.find((x) => phanTram >= x.tu) : null;

  return {
    cacLua, chiSo, phanTram, xepLoai, duDuLieu,
    phu: [
      { ten: 'Lứa hiện tại', gt: goc + cacLua.length ? `Lứa ${goc + cacLua.length}` : '---' },
      { ten: 'Số ngày lãng phí', gt: lanPhiLua !== null ? `${Math.round(lanPhiLua)} ngày/lứa${lanPhiNam !== null ? ` · ${Math.round(lanPhiNam)} ngày/năm` : ''}` : '---' },
      { ten: 'Số ngày nuôi con TB', gt: ngayNuoiCon !== null ? `${Math.round(ngayNuoiCon)} ngày` : '---' },
      { ten: 'Tỷ lệ đậu thai (phối → đẻ)', gt: dauThai !== null ? `${Math.round(dauThai)}% (${deTuPhoi}/${chuKyPhoi.length} lần phối)` : '---' },
      { ten: 'Heo cai sữa / nái / năm', gt: caiNam !== null ? `${lam1(caiNam)} con` : '---' },
    ],
    laLuaCao: goc + cacLua.length >= 7,
    dangCho,
  };
};

// Trung bình cả trại (để so sánh)
export const tinhTrungBinhTrai = (danhSachLichSu, parseToDateObject) => {
  const cacMa = {};
  (Array.isArray(danhSachLichSu) ? danhSachLichSu : []).forEach((e) => { if (e && e.maTai && chuan(e.suKien) === 'ĐẺ') cacMa[chuan(e.maTai)] = true; });
  const ss = []; const cs = [];
  Object.keys(cacMa).forEach((m) => layCacLuaDeCuaNai(danhSachLichSu, m, '').forEach((l) => {
    ss.push(Number(l.soHeoCon) || 0);
    if (l.ngayCaiSua) cs.push(Number(l.soConCaiSua) || 0);
  }));
  return { soSinhSong: lam1(tb(ss)), caiSua: lam1(tb(cs)) };
};

const NHAN = [
  { ten: 'Kém', mau: '#dc2626', nen: '#fef2f2' },
  { ten: 'Đạt', mau: '#d97706', nen: '#fff8eb' },
  { ten: 'Tốt', mau: '#16a34a', nen: '#ecfdf3' },
];

export default function DanhGiaNai({ danhSachLichSu, maTai, luaGoc, parseToDateObject }) {
  const kq = React.useMemo(() => tinhDanhGiaNai(danhSachLichSu, maTai, luaGoc, parseToDateObject), [danhSachLichSu, maTai, luaGoc]);
  const trai = React.useMemo(() => tinhTrungBinhTrai(danhSachLichSu, parseToDateObject), [danhSachLichSu]);
  const xl = kq.xepLoai;

  return (
    <View style={{ paddingBottom: 10 }}>
      {/* KẾT LUẬN */}
      {xl ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: xl.nen, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: xl.mau + '55' }}>
          <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: xl.mau, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Text style={{ color: '#ffffff', fontSize: 26, fontWeight: '900' }}>{xl.ma}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: xl.mau }}>{xl.ten} · {kq.phanTram} điểm</Text>
            <Text style={{ fontSize: 12, color: '#374151', marginTop: 3, lineHeight: 17 }}>{xl.loiKhuyen}</Text>
          </View>
        </View>
      ) : (
        <View style={{ backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#6c757d' }}>Chưa đủ dữ liệu để xếp loại</Text>
          <Text style={{ fontSize: 11.5, color: '#8a929a', marginTop: 3 }}>Cần ít nhất 1 lứa đẻ đã cai sữa được nhập trong app.</Text>
        </View>
      )}
      {kq.dangCho && kq.dangCho.soNgay > NGUONG.caiDenPhoi.dat && (
        <View style={{ backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#fecaca' }}>
          <Text style={{ fontSize: 13, fontWeight: '900', color: '#dc2626' }}>⚠️ {kq.dangCho.soNgay} ngày chưa phối lại</Text>
          <Text style={{ fontSize: 11.5, color: '#7f1d1d', marginTop: 2 }}>
            Tính từ ngày {kq.dangCho.tu} {String(kq.dangCho.d.getDate()).padStart(2, '0')}/{String(kq.dangCho.d.getMonth() + 1).padStart(2, '0')}/{kq.dangCho.d.getFullYear()}. Mỗi ngày nái nằm chờ là 1 ngày lãng phí.
          </Text>
        </View>
      )}
      {kq.laLuaCao && (
        <Text style={{ fontSize: 11.5, color: '#b45309', backgroundColor: '#fffbeb', padding: 8, borderRadius: 8, marginBottom: 10 }}>⚠️ Nái đã đẻ từ lứa 7 trở lên, năng suất thường bắt đầu giảm.</Text>
      )}

      {/* CHỈ SỐ CHÍNH */}
      <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#495057', marginBottom: 6 }}>CHỈ SỐ CHÍNH</Text>
      <View style={{ backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#eef0f2', marginBottom: 12 }}>
        {kq.chiSo.map((c, i) => {
          const nhan = c.diem === null ? null : NHAN[c.diem];
          const soTrai = c.ma === 'soSinhSong' ? trai.soSinhSong : c.ma === 'caiSua' ? trai.caiSua : null;
          return (
            <View key={c.ma} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 10, borderTopWidth: i ? 1 : 0, borderTopColor: '#f1f3f5' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12.5, color: '#374151' }}>{c.ten}</Text>
                {(c.chuThich || soTrai !== null) && (
                  <Text style={{ fontSize: 10.5, color: '#9aa1a8', marginTop: 1 }}>{c.chuThich || `TB cả trại: ${soTrai} ${c.dv}`}</Text>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827', marginRight: 8 }}>{c.gt === null ? '---' : `${c.gt} ${c.dv}`}</Text>
              <View style={{ width: 40, alignItems: 'center', paddingVertical: 2, borderRadius: 6, backgroundColor: nhan ? nhan.nen : '#f1f3f5' }}>
                <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: nhan ? nhan.mau : '#adb5bd' }}>{nhan ? nhan.ten : '–'}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* CHỈ SỐ PHỤ */}
      <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#495057', marginBottom: 6 }}>THÊM</Text>
      <View style={{ backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#eef0f2', marginBottom: 12 }}>
        {kq.phu.map((p, i) => (
          <View key={p.ten} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10, borderTopWidth: i ? 1 : 0, borderTopColor: '#f1f3f5' }}>
            <Text style={{ fontSize: 12, color: '#6b7280', flex: 1 }}>{p.ten}</Text>
            <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#111827' }}>{p.gt}</Text>
          </View>
        ))}
      </View>

      {/* TỪNG LỨA: bảng gọn, lứa mới nhất trên cùng */}
      {kq.cacLua.length > 0 && (
        <>
          <Text style={{ fontSize: 12.5, fontWeight: 'bold', color: '#495057', marginBottom: 6 }}>TỪNG LỨA</Text>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#eef0f2', overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', backgroundColor: '#f8f9fa', paddingVertical: 6, paddingHorizontal: 10 }}>
              <Text style={{ width: 48, fontSize: 10.5, fontWeight: 'bold', color: '#8a929a' }}>Lứa</Text>
              <Text style={{ flex: 1, fontSize: 10.5, fontWeight: 'bold', color: '#8a929a' }}>Ngày đẻ</Text>
              <Text style={{ width: 62, textAlign: 'right', fontSize: 10.5, fontWeight: 'bold', color: '#8a929a' }}>Sơ sinh</Text>
              <Text style={{ width: 62, textAlign: 'right', fontSize: 10.5, fontWeight: 'bold', color: '#8a929a' }}>Cai sữa</Text>
            </View>
            {kq.cacLua.slice().reverse().map((l) => (
              <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: '#f1f3f5' }}>
                <Text style={{ width: 48, fontSize: 12.5, fontWeight: '900', color: '#495057' }}>{l.luaDe}</Text>
                <Text style={{ flex: 1, fontSize: 12, color: '#6b7280' }}>{l.ngayDe}</Text>
                <Text style={{ width: 62, textAlign: 'right', fontSize: 13, fontWeight: 'bold', color: '#111827' }}>{Number(l.soHeoCon) || 0}</Text>
                <Text style={{ width: 62, textAlign: 'right', fontSize: 13, fontWeight: 'bold', color: l.ngayCaiSua ? '#0284c7' : '#c0c6cc' }}>{l.ngayCaiSua ? Number(l.soConCaiSua) || 0 : 'chưa'}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={{ fontSize: 10.5, color: '#9aa1a8', marginTop: 10, lineHeight: 15 }}>
        Tính từ nhật ký nhập trong app. Mức Tốt: sơ sinh sống ≥ {NGUONG.soSinhSong.tot}, cai sữa ≥ {NGUONG.caiSua.tot}, nuôi sống ≥ {NGUONG.nuoiSong.tot}%, ≥ {NGUONG.luaNam.tot} lứa/năm, phối lại ≤ {NGUONG.caiDenPhoi.tot} ngày sau cai.
      </Text>
    </View>
  );
}