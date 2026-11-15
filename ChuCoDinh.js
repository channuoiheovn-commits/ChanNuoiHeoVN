// ========================================================
// 🔠 GIỚI HẠN CỠ CHỮ THEO CÀI ĐẶT ĐIỆN THOẠI
// Android / iPhone cho người dùng phóng to chữ hệ thống (có máy tới 1,5 – 2 lần).
// Chữ phóng quá to làm vỡ các ô, nút, bảng trong app. File này bọc Text và TextInput:
// chữ vẫn được phóng to theo máy, nhưng tối đa HE_SO_CHU_TOI_DA lần.
//
// Không cần sửa file nào khác: metro.config.js tự chuyển mọi `import ... from 'react-native'`
// trong code của app sang file này.
// ⚠️ Viết kiểu require + getter "lười": chỉ lấy đúng thứ app dùng tới. KHÔNG dùng `export *`,
//    vì cách đó chạm vào MỌI module của react-native lúc khởi động (kể cả module không có trong Expo Go)
//    -> lỗi "native module that doesn't exist" / "main has not been registered".
// Muốn chữ to hơn / nhỏ hơn: đổi con số bên dưới (1 = khóa cứng, không phóng to).
// ========================================================
const React = require('react');
const RN = require('react-native'); // metro.config.js để file này lấy react-native THẬT

const HE_SO_CHU_TOI_DA = 1.02;

function Text(props) {
  return React.createElement(RN.Text, { maxFontSizeMultiplier: HE_SO_CHU_TOI_DA, ...props });
}
Text.displayName = 'Text';

function TextInput(props) {
  return React.createElement(RN.TextInput, { maxFontSizeMultiplier: HE_SO_CHU_TOI_DA, ...props });
}
TextInput.displayName = 'TextInput';

const ra = {};
// Chép "lối vào" của từng thứ trong react-native nhưng KHÔNG gọi tới (chỉ lấy khi app thật sự dùng)
Object.getOwnPropertyNames(RN).forEach((k) => {
  if (k === 'Text' || k === 'TextInput') return;
  Object.defineProperty(ra, k, { enumerable: true, configurable: true, get: () => RN[k] });
});
// TextInput.State... (hàm tĩnh) lấy từ TextInput thật khi cần
['State'].forEach((k) => Object.defineProperty(TextInput, k, { get: () => RN.TextInput[k] }));
Object.defineProperty(ra, 'Text', { enumerable: true, value: Text });
Object.defineProperty(ra, 'TextInput', { enumerable: true, value: TextInput });
Object.defineProperty(ra, 'HE_SO_CHU_TOI_DA', { enumerable: false, value: HE_SO_CHU_TOI_DA });

module.exports = ra;