// ========================================================
// 📅 BỘ LỌC THỜI GIAN: Tất cả / Tuần / Tháng / Năm
// - Chọn kiểu lọc, bấm ◀ ▶ để lùi / tiến từng tuần, tháng, năm
// - Bấm vào nhãn giữa để quay về kỳ hiện tại
// Dùng: const [boLoc, setBoLoc] = useState(BO_LOC_MAC_DINH);
//       <BoLocThoiGian giaTri={boLoc} onDoi={setBoLoc} />
//       const mangDaLoc = locTheoThoiGian(mang, boLoc, (x) => x.ngayNhapChuong);
// ========================================================
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { parseToDateObject } from './DateUtils';

export const BO_LOC_MAC_DINH = { che: 'THANG', moc: new Date() };

const CAC_CHE = [
  { ma: 'TAT_CA', ten: 'Tất cả' },
  { ma: 'TUAN', ten: 'Tuần' },
  { ma: 'THANG', ten: 'Tháng' },
  { ma: 'NAM', ten: 'Năm' },
];

const hai = (n) => String(n).padStart(2, '0');

// Trả về khoảng [tu, den) theo kiểu lọc. Tuần tính từ Thứ 2.
export const tinhKhoang = ({ che, moc }) => {
  const m = new Date(moc);
  if (che === 'TUAN') {
    const tu = new Date(m.getFullYear(), m.getMonth(), m.getDate());
    const thu = (tu.getDay() + 6) % 7; // Thứ 2 = 0
    tu.setDate(tu.getDate() - thu);
    const den = new Date(tu); den.setDate(den.getDate() + 7);
    return { tu, den };
  }
  if (che === 'THANG') {
    return { tu: new Date(m.getFullYear(), m.getMonth(), 1), den: new Date(m.getFullYear(), m.getMonth() + 1, 1) };
  }
  if (che === 'NAM') {
    return { tu: new Date(m.getFullYear(), 0, 1), den: new Date(m.getFullYear() + 1, 0, 1) };
  }
  return null; // TAT_CA
};

const nhanKhoang = (boLoc) => {
  const k = tinhKhoang(boLoc);
  if (!k) return 'Toàn bộ thời gian';
  if (boLoc.che === 'TUAN') {
    const cuoi = new Date(k.den); cuoi.setDate(cuoi.getDate() - 1);
    return `${hai(k.tu.getDate())}/${hai(k.tu.getMonth() + 1)} – ${hai(cuoi.getDate())}/${hai(cuoi.getMonth() + 1)}/${cuoi.getFullYear()}`;
  }
  if (boLoc.che === 'THANG') return `Tháng ${hai(k.tu.getMonth() + 1)}/${k.tu.getFullYear()}`;
  return `Năm ${k.tu.getFullYear()}`;
};

const dichKy = (boLoc, buoc) => {
  const m = new Date(boLoc.moc);
  if (boLoc.che === 'TUAN') m.setDate(m.getDate() + 7 * buoc);
  else if (boLoc.che === 'THANG') m.setMonth(m.getMonth() + buoc, 1);
  else if (boLoc.che === 'NAM') m.setFullYear(m.getFullYear() + buoc);
  return { ...boLoc, moc: m };
};

// Lọc mảng theo khoảng thời gian. layNgay(item) trả về chuỗi ngày "dd/mm/yyyy".
// Dòng không đọc được ngày chỉ hiện ở chế độ "Tất cả".
export const locTheoThoiGian = (mang, boLoc, layNgay) => {
  const k = tinhKhoang(boLoc);
  if (!k) return mang;
  return mang.filter((x) => {
    const d = parseToDateObject(layNgay(x));
    return d && d >= k.tu && d < k.den;
  });
};

export function BoLocThoiGian({ giaTri, onDoi, mauChinh = '#2563eb' }) {
  const coDieuHuong = giaTri.che !== 'TAT_CA';
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
        {CAC_CHE.map((c) => {
          const bat = giaTri.che === c.ma;
          return (
            <TouchableOpacity
              key={c.ma}
              activeOpacity={0.7}
              onPress={() => onDoi({ che: c.ma, moc: new Date() })}
              style={{ flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: bat ? mauChinh : '#e2e8f0', backgroundColor: bat ? mauChinh : '#ffffff' }}
            >
              <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: bat ? '#ffffff' : '#64748b' }}>{c.ten}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
        {coDieuHuong && (
          <TouchableOpacity activeOpacity={0.6} onPress={() => onDoi(dichKy(giaTri, -1))} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: mauChinh }}>◀</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          activeOpacity={0.6}
          disabled={!coDieuHuong}
          onPress={() => onDoi({ ...giaTri, moc: new Date() })}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}
        >
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#1e293b' }}>{nhanKhoang(giaTri)}</Text>
          {coDieuHuong && <Text style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 1 }}>Chạm để về kỳ hiện tại</Text>}
        </TouchableOpacity>
        {coDieuHuong && (
          <TouchableOpacity activeOpacity={0.6} onPress={() => onDoi(dichKy(giaTri, 1))} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: mauChinh }}>▶</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}