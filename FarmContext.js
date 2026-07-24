import React, { createContext, useState, useContext } from 'react';

// ========================================================
// 🤰 TRẠM 1: QUẢN LÝ DỊCH TỄ ĐÀN HEO NÁI SINH SẢN (SOW CONTEXT)
// ========================================================
const SowContext = createContext();
export const SowProvider = ({ children }) => {
  const [danhSachTrangThaiNai, setDanhSachTrangThaiNai] = useState([]); // Nuôi sống Tab 2, Tab 4
  
  // 🎯 BẢN VÁ KHAI TỬ GLOBAL: Khai báo 3 khay State sạch gác cổng cảnh báo dịch tễ nái đẻ
  const [danhSachHeoLocCanhBao, setDanhSachHeoLocCanhBao] = useState([]);
  const [danhSachHeoSapDeCanhBao, setDanhSachHeoSapDeCanhBao] = useState([]);
  const [danhSachHeoCaiSuaCanhBao, setDanhSachHeoCaiSuaCanhBao] = useState([]);

  // 📡 PHÁT SÓNG TOÀN DIỆN: Bơm đầy đủ biến và hàm thay đổi ra mạng lưới để file chính App.js bốc về sử dụng
  return (
    <SowContext.Provider value={{ 
      danhSachTrangThaiNai, setDanhSachTrangThaiNai,
      danhSachHeoLocCanhBao, setDanhSachHeoLocCanhBao,
      danhSachHeoSapDeCanhBao, setDanhSachHeoSapDeCanhBao,
      danhSachHeoCaiSuaCanhBao, setDanhSachHeoCaiSuaCanhBao
    }}>
      {children}
    </SowContext.Provider>
  );
};
export const useSow = () => {
  const context = useContext(SowContext);
  if (!context) throw new Error('useSow phải được đặt trong SowProvider!');
  return context;
};

// ========================================================
// 📅 TRẠM 2: QUẢN LÝ LỊCH TIÊM VẮC-XIN & VIỆC THÚ Y (TASK CONTEXT)
// ========================================================
const TaskContext = createContext();
export const TaskProvider = ({ children }) => {
  const [danhSachViecCanLamThuy, setDanhSachViecCanLamThuy] = useState([]); // Nuôi sống Tab 6 Việc cần làm
  return (
    <TaskContext.Provider value={{ danhSachViecCanLamThuy, setDanhSachViecCanLamThuy }}>
      {children}
    </TaskContext.Provider>
  );
};
export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTask phải được đặt trong TaskProvider!');
  return context;
};

// ========================================================
// 🏠 TRẠM 3: QUẢN LÝ BÀN CỜ 7 GIAI ĐOẠN HEO THỊT THƯƠNG PHẨM (MEAT CONTEXT)
// ========================================================
const MeatContext = createContext();
export const MeatProvider = ({ children }) => {
  const [tongHeoThitSauBuTruRealTime, setTongHeoThitSauBuTruRealTime] = useState(0); // Nuôi sống số tổng Tab 5
  return (
    <MeatContext.Provider value={{ tongHeoThitSauBuTruRealTime, setTongHeoThitSauBuTruRealTime }}>
      {children}
    </MeatContext.Provider>
  );
};
export const useMeat = () => {
  const context = useContext(MeatContext);
  if (!context) throw new Error('useMeat phải được đặt trong MeatProvider!');
  return context;
};

// ========================================================
// 🚜 BỘ BỌC NGUỒN LIÊN HOÀN TỐI CAO (GLOBAL FARM PROVIDER)
// ========================================================
export const FarmProvider = ({ children }) => {
  return (
    <SowProvider>
      <TaskProvider>
        <MeatProvider>
          {children}
        </MeatProvider>
      </TaskProvider>
    </SowProvider>
  );
};
