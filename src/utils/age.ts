import { Types } from 'mongoose';

// ----------------------------------------------------------------------
// Tuổi của TTS — nguồn duy nhất cho mọi endpoint.
//
// 1. Tính theo NGÀY Ở VIỆT NAM (UTC+7), không theo múi giờ của máy chủ. Ngày sinh lưu dạng
//    00:00 giờ VN (= 17:00 UTC hôm trước); máy chủ AWS chạy UTC, nên nếu so ngày/tháng theo
//    giờ máy chủ thì tuổi tăng sớm một ngày (từ 7h sáng hôm trước sinh nhật).
//
// 2. Trường `age` trong CSDL chỉ được ghi khi bấm lưu hồ sơ nên cũ dần theo thời gian. Mọi
//    endpoint trả TTS ra ngoài phải ghi đè nó bằng tuổi tính lại (withAge / withListInternAges),
//    nếu không file in ra sẽ mang tuổi của lần lưu cuối.
// ----------------------------------------------------------------------

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

export function calculateAge(birthday?: Date | string | null, now: Date = new Date()): number {
  if (!birthday) return 0;

  // Dời cả hai mốc sang giờ VN rồi đọc bằng getUTC*: kết quả không phụ thuộc múi giờ máy chủ.
  const birth = new Date(new Date(birthday).getTime() + VN_OFFSET_MS);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date(now.getTime() + VN_OFFSET_MS);

  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const month = today.getUTCMonth() - birth.getUTCMonth();
  if (month < 0 || (month === 0 && today.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export const withAge = <T extends Record<string, any>>(intern: T) => ({
  ...intern,
  age: calculateAge(intern.birthday),
});

// Ref chưa populate là ObjectId, không phải hồ sơ TTS — giữ nguyên.
const isInternDoc = (value: any) =>
  !!value && typeof value === 'object' && !(value instanceof Types.ObjectId);

/**
 * Cho document có `listIntern` đã populate (đơn hàng, danh sách so sánh).
 * Nhận cả document Mongoose lẫn object thuần. Với document thì đi qua toJSON() — đúng thứ
 * res.json() vẫn gửi đi trước đây (giữ giá trị mặc định của schema) — rồi chỉ thay `age`.
 */
export function withListInternAges(doc: any) {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
  if (!Array.isArray(plain.listIntern)) return plain;
  return {
    ...plain,
    listIntern: plain.listIntern.map((intern: any) =>
      isInternDoc(intern) ? withAge(intern) : intern
    ),
  };
}
