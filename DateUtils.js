export const formatVNDate = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    date = new Date();
  }
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const parseToDateObject = (str) => {
  if (!str) return null;
  try {
    const s = str.toString().trim();
    if (s === "" || s === "---") return null;

    if (s.includes('/') && s.split('/').length === 3) {
      const parts = s.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    } 
    
    const parsedDate = new Date(s);
    if (!isNaN(parsedDate.getTime())) {
      parsedDate.setHours(0, 0, 0, 0);
      return parsedDate;
    }
    return null;
  } catch (e) {
    console.log("Lỗi parse ngày toàn cục:", e);
    return null;
  }
};

export const formatStringtoVN = (str) => {
  const dObj = parseToDateObject(str);
  if (!dObj) return str ? str.toString().substring(0, 10) : "---";
  return formatVNDate(dObj);
};

export const tinhNgayDuKienDe = (ngayGoc) => {
  const dateObject = parseToDateObject(ngayGoc);
  if (!dateObject) return "";
  dateObject.setDate(dateObject.getDate() + 114);
  return formatVNDate(dateObject);
};

export const laySoAnToan = (val) => {
  if (val === undefined || val === null) return 0;
  const cleanStr = val.toString().trim();
  if (cleanStr === "" || isNaN(cleanStr)) return 0;
  return Number(cleanStr);
};

export const sinhIDDocBan = (tienTo) => {
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${tienTo}_${timestamp}_${randomStr}`;
};
