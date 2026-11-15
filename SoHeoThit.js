// ========================================================
// 🐷 SỐ HEO THỊT THEO TUẦN TUỔI - TÍNH NGAY TRÊN APP (thay cho sheet So_Heo_Thit_Hien_Tai)
//
// Quy tắc (giống cách Google Sheet đang làm):
// 1. Mỗi lần ĐẺ là 1 lứa. Chưa cai sữa -> nằm ở ô "Theo mẹ".
//    Số con = Chọn nuôi (nếu có nhập), không thì = Số heo đẻ ra.
// 2. CAI SỮA ghép đúng lứa: lần cai sữa thuộc về lần đẻ gần nhất CHƯA cai của chính nái đó
//    (không lấy nhầm cai sữa lứa 1 cho lứa 2). Đã cai -> số con của lứa = số cai sữa.
// 3. Tuổi = số tuần lịch (tuần bắt đầu Thứ Hai, như WEEKNUM(...;2) trên Sheet) từ tuần đẻ đến tuần hiện tại.
//    Đã cai sữa -> xếp vào ô 3, 4, 5... 30 tuần. Quá 30 tuần -> cộng dồn vào ô 30.
// 4. Lứa CHƯA cai sữa mà nái đã thải -> bỏ (heo con đã chuyển cho nái khác nuôi,
//    sẽ nằm trong số cai sữa của nái đó).
// 5. NHẬP ĐÀN / BÁN / HAO HỤT: cộng / trừ ở ô tuần đã chọn lúc nhập, rồi "lớn" cùng lứa:
//    bán ô 6 tuần, tuần sau sẽ trừ ở ô 7 tuần.
// ========================================================
import { parseToDateObject } from './DateUtils';

const NGAY = 86400000;
const TUAN = 7 * NGAY;
const DE_TRUNG_TOI_DA = 100 * NGAY; // Đẻ 2 lần < 100 ngày = nhập trùng, bỏ lần sau

const so = (v) => {
  const n = Number(String(v ?? '').trim());
  return isNaN(n) ? 0 : n;
};
const chuan = (v) => String(v || '').trim().normalize('NFC').toUpperCase();

// Thứ Hai đầu tuần của một ngày (giống cột "Tuần Đẻ" trên Sheet)
const thuHaiDauTuan = (d) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
// Số tuần lịch từ ngày a đến ngày b
const soTuanGiua = (a, b) => Math.round((thuHaiDauTuan(b) - thuHaiDauTuan(a)) / TUAN);
const kepTuan = (t) => Math.min(30, Math.max(2, t)); // ô nhỏ nhất: 2 tuần (cai sữa sớm)

export const tinhSoHeoThit = (danhSachLichSu, danhSachMaTai, homNay = new Date()) => {
  const o = {}; // Ô tuần 2..30
  for (let w = 2; w <= 30; w++) o[w] = 0;
  let theoMe = 0;
  const canhBao = { banKhongRoTuan: 0 };

  // Nái đang ở trạng thái thải trong sổ mã tai
  const naiThaiSo = new Set();
  (Array.isArray(danhSachMaTai) ? danhSachMaTai : []).forEach((n) => {
    if (!n || !n.maTai) return;
    const tt = chuan(n.trangThaiDienThoai || n.trangThaiCotH || n.trangThai);
    if (tt.includes('THẢI')) naiThaiSo.add(chuan(n.maTai));
  });

  const theoNai = {};
  (Array.isArray(danhSachLichSu) ? danhSachLichSu : []).forEach((e) => {
    if (!e || e.actionType === 'delete') return;
    const sk = chuan(e.suKien);
    const d = parseToDateObject(e.ngay);
    if (!d) return;

    // 5. Nhập đàn / Bán / Hao hụt: cộng trừ theo ô tuần đã chọn, lớn dần theo thời gian
    if (sk === 'BÁN' || sk === 'HAO HỤT' || sk === 'NHẬP ĐÀN') {
      const tuanLucNhap = parseInt(String(e.tuanBan ?? '').replace(/\D/g, ''), 10);
      if (isNaN(tuanLucNhap)) { canhBao.banKhongRoTuan += 1; return; }
      const tuanHienTai = kepTuan(tuanLucNhap + soTuanGiua(d, homNay));
      o[tuanHienTai] += (sk === 'NHẬP ĐÀN' ? 1 : -1) * so(e.soHeo);
      return;
    }

    if (!['ĐẺ', 'CAI SỮA', 'THẢI'].includes(sk) || !e.maTai) return;
    const ma = chuan(e.maTai);
    (theoNai[ma] = theoNai[ma] || []).push({ ...e, _sk: sk, _d: d, _t: d.getTime() });
  });

  Object.entries(theoNai).forEach(([ma, ds]) => {
    // Đẻ trước cai sữa nếu cùng ngày
    const thuTu = { 'ĐẺ': 0, 'CAI SỮA': 1, 'THẢI': 2 };
    ds.sort((a, b) => a._t - b._t || thuTu[a._sk] - thuTu[b._sk] || String(a.id || '').localeCompare(String(b.id || '')));

    // 2. Ghép đẻ - cai sữa đúng lứa
    const cacLua = [];
    let ngayThai = null;
    ds.forEach((e) => {
      if (e._sk === 'ĐẺ') {
        const truoc = cacLua[cacLua.length - 1];
        if (truoc && e._t - truoc.de._t < DE_TRUNG_TOI_DA) return; // nhập trùng
        cacLua.push({ de: e, cai: null });
      } else if (e._sk === 'CAI SỮA') {
        const luaMo = [...cacLua].reverse().find((l) => !l.cai);
        if (luaMo) luaMo.cai = e;
      } else if (e._sk === 'THẢI') {
        ngayThai = e._t;
      }
    });

    cacLua.forEach((l) => {
      if (l.cai) {
        // 3. Đã cai sữa: xếp theo tuần tuổi
        const tuan = kepTuan(soTuanGiua(l.de._d, homNay));
        o[tuan] += so(l.cai.soHeo);
      } else {
        // 4. Chưa cai mà nái đã thải -> bỏ
        const daThai = naiThaiSo.has(ma) || (ngayThai !== null && ngayThai >= l.de._t);
        if (daThai) return;
        // 1. Theo mẹ
        theoMe += so(l.de.chonNuoi) > 0 ? so(l.de.chonNuoi) : so(l.de.soHeo);
      }
    });
  });

  // Không để ô âm (bán nhiều hơn số đang có)
  for (let w = 2; w <= 30; w++) o[w] = Math.max(0, o[w]);

  const tong = (tu, den) => { let s = 0; for (let w = tu; w <= den; w++) s += o[w]; return s; };
  const kq = {
    theoMe: String(theoMe),
    '2 Tuần': String(o[2]),
    '3 Tuần': String(o[3]),
    '4 Tuần': String(o[4]),
    caiSua: String(o[2] + o[3] + o[4]),
    giaiDoan3: String(tong(5, 9)),
    giaiDoan4: String(tong(10, 15)),
    giaiDoan5: String(tong(16, 20)),
    giaiDoan6: String(tong(21, 25)),
    giaiDoan7: String(tong(26, 30)),
    canhBao,
  };
  for (let w = 5; w <= 30; w++) { kq[`t${w}`] = String(o[w]); kq[`${w} Tuần`] = String(o[w]); }
  const tongHeo = theoMe + tong(2, 30);
  kq['Theo Mẹ'] = kq.theoMe;            // Tên cũ một số màn hình còn dùng
  kq['4 Tuần ( Cai Sữa )'] = kq['4 Tuần'];
  kq.tongHeoThit = String(tongHeo);
  kq.tongHeoThitSauBuTruRealTime = String(tongHeo);
  return kq;
};


// ========================================================
// 📦 BÁO CÁO HEO THEO TUẦN TUỔI = Ô HEO CHƯA SẮP XẾP CHUỒNG + CÁC Ô CHUỒNG
//
// Ô HEO CHƯA SẮP XẾP CHUỒNG (từng tuần) =
//    Các lứa đã cai sữa (xếp theo tuần tuổi) + Nhập đàn / Bán / Hao hụt bản cũ
//  + các dòng ghi ngay trong ô này (nhập / bán / hao hụt / xóa / luân chuyển về)
//  − heo đã xếp ra ô chuồng (dòng ô chuồng có nguon = 'CHO_XEP')
//
// CÁC Ô CHUỒNG = cộng TẤT CẢ dòng sổ cái của ô chuồng thật (heo nhập cũ hay mới đều tính).
//
// => Khách cũ có thể thấy heo bị tính 2 lần (vừa ở ô chưa xếp, vừa ở ô chuồng đã nhập tay):
//    khách tự bấm Xóa ở ô chưa xếp hoặc ở ô chuồng cho đúng thực tế.
//    Xếp heo / luân chuyển: chỉ đổi chỗ nằm, tổng không đổi.
// ========================================================
export const KHU_CHO_XEP = 'CHO_XEP';
export const TEN_CHUONG_CHO_XEP = 'Chờ xếp chuồng';

const thuHai = (d) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
const tuanGiua = (a, b) => Math.round((thuHai(b) - thuHai(a)) / TUAN);

// Tuổi hiện tại của 1 dòng sổ cái ô chuồng (giống cách tab Ô chuồng đang tính)
export const tuoiDongChuong = (dong, homNay = new Date()) => {
  const tuoiVao = Number(dong.tuanTuoi) || 0;
  const ngay = parseToDateObject(dong.ngayNhapChuong);
  if (tuoiVao === 0 || !ngay) return tuoiVao;
  return tuoiVao + Math.max(0, tuanGiua(ngay, homNay));
};

const SK_BO_QUA_CHUONG = ['VAO_CAM', 'TIEM_VACCINE', 'DON_CHUONG', 'DOI_CHIEU'];

export const tinhBaoCaoHeo = ({ danhSachLichSu, danhSachMaTai, danhSachChuongThit, homNay = new Date() }) => {
  // 1. Theo mẹ + lứa đã cai + nhập/bán/hao hụt cũ (quy tắc như bản trước)
  const goc = tinhSoHeoThit(danhSachLichSu, danhSachMaTai, homNay);
  const choXep = {}; // Ô heo chưa sắp xếp chuồng
  const trongChuong = {}; // các ô chuồng thật
  for (let w = 2; w <= 30; w++) { choXep[w] = so(w <= 4 ? goc[`${w} Tuần`] : goc[`t${w}`]); trongChuong[w] = 0; }
  const theoMe = so(goc.theoMe);

  // 2. Sổ cái ô chuồng
  (Array.isArray(danhSachChuongThit) ? danhSachChuongThit : []).forEach((dong) => {
    if (!dong || !dong.tenChuong || SK_BO_QUA_CHUONG.includes(dong.suKienHeoThit)) return;
    const soCon = Number(dong.soCon) || 0;
    if (soCon === 0) return;
    const tuoi = tuoiDongChuong(dong, homNay);
    if (tuoi <= 0) return;
    const w = kepTuan(tuoi);
    if (String(dong.tenKhu || '').trim() === KHU_CHO_XEP) { choXep[w] += soCon; return; }
    trongChuong[w] += soCon;                          // heo trong ô chuồng: cũ hay mới đều tính
    if (dong.nguon === 'CHO_XEP') choXep[w] -= soCon; // xếp từ ô chưa xếp sang -> ô chưa xếp bớt đi
  });

  // 3. Báo cáo = ô chưa xếp + ô chuồng (từng tuần, không để âm)
  const baoCao = {};
  const choXepTheoTuoi = [];
  let tongDaXep = 0;
  for (let w = 2; w <= 30; w++) {
    const con = Math.max(0, choXep[w]);
    const trong = Math.max(0, trongChuong[w]);
    baoCao[w] = con + trong;
    if (con > 0) choXepTheoTuoi.push({ tuoi: w, soCon: con });
    tongDaXep += trong;
  }

  const tong = (tu, den) => { let t = 0; for (let w = tu; w <= den; w++) t += baoCao[w]; return t; };
  const tongChoXep = choXepTheoTuoi.reduce((a, b) => a + b.soCon, 0);
  const kq = {
    theoMe: String(theoMe),
    '2 Tuần': String(baoCao[2]), '3 Tuần': String(baoCao[3]), '4 Tuần': String(baoCao[4]),
    caiSua: String(baoCao[2] + baoCao[3] + baoCao[4]),
    giaiDoan3: String(tong(5, 9)), giaiDoan4: String(tong(10, 15)), giaiDoan5: String(tong(16, 20)),
    giaiDoan6: String(tong(21, 25)), giaiDoan7: String(tong(26, 30)),
    nguon: { theoMe, choXep: tongChoXep, daXep: tongDaXep },
    choXepTheoTuoi,
    canhBao: goc.canhBao,
  };
  for (let w = 5; w <= 30; w++) { kq[`t${w}`] = String(baoCao[w]); kq[`${w} Tuần`] = String(baoCao[w]); }
  kq['Theo Mẹ'] = kq.theoMe;
  kq['4 Tuần ( Cai Sữa )'] = kq['4 Tuần'];
  const tongHeo = theoMe + tong(2, 30);
  kq.tongHeoThit = String(tongHeo);
  kq.tongHeoThitSauBuTruRealTime = String(tongHeo);
  return kq;
};


// ========================================================
// 📜 LỊCH SỬ CÁC LỨA ĐÃ ĐẺ CỦA 1 NÁI — lấy thẳng từ nhật ký nhập liệu (không cần Google Sheet)
// Ghép mỗi lần Đẻ với lần Cai Sữa ngay sau nó (cùng quy tắc ghép với báo cáo heo theo mẹ).
// Số lứa = lứa gốc lúc nhập sổ (Hậu bị = 0, "Lứa 3" = 3) + thứ tự lần đẻ.
// ========================================================
export const layCacLuaDeCuaNai = (danhSachLichSu, maTai, luaGoc) => {
  const ma = chuan(maTai);
  if (!ma) return [];
  const thuTu = { 'ĐẺ': 0, 'CAI SỮA': 1 };
  const ds = (Array.isArray(danhSachLichSu) ? danhSachLichSu : [])
    .filter((e) => e && e.actionType !== 'delete' && e.syncStatus !== 'delete' && chuan(e.maTai) === ma)
    .map((e) => ({ ...e, _sk: chuan(e.suKien), _d: parseToDateObject(e.ngay) }))
    .filter((e) => e._d && (e._sk === 'ĐẺ' || e._sk === 'CAI SỮA'))
    .sort((a, b) => a._d - b._d || thuTu[a._sk] - thuTu[b._sk] || String(a.id || '').localeCompare(String(b.id || '')));

  const cacLua = [];
  ds.forEach((e) => {
    if (e._sk === 'ĐẺ') {
      const truoc = cacLua[cacLua.length - 1];
      if (truoc && e._d - truoc.de._d < DE_TRUNG_TOI_DA) return; // nhập trùng
      cacLua.push({ de: e, cai: null });
    } else {
      const luaMo = [...cacLua].reverse().find((l) => !l.cai);
      if (luaMo) luaMo.cai = e;
    }
  });

  const goc = parseInt(String(luaGoc || '').replace(/\D/g, ''), 10) || 0;
  return cacLua.map((l, i) => ({
    id: l.de.id,
    luaDe: String(goc + i + 1),
    ngayDe: l.de.ngay,
    soHeoCon: String(so(l.de.soHeo)),
    khoThai: String(so(l.de.khoThai)),
    coiCoc: String(so(l.de.coiCoc)),
    chetNgop: String(so(l.de.chetNgop)),
    chonNuoi: String(so(l.de.chonNuoi) > 0 ? so(l.de.chonNuoi) : so(l.de.soHeo)),
    ngayCaiSua: l.cai ? l.cai.ngay : '',
    soConCaiSua: l.cai ? String(so(l.cai.soHeo)) : '',
    soNgay: l.cai ? String(Math.round((l.cai._d - l.de._d) / NGAY)) : '',
    ghiChuCaiSua: l.cai && l.cai.ghiChu ? String(l.cai.ghiChu) : '',
  })).reverse(); // lứa mới nhất lên đầu
};