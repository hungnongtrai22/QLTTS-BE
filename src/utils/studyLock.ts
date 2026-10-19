// ----------------------------------------------------------------------
// Khóa báo cáo học tập đã công khai.
//
// Báo cáo công khai là thứ nghiệp đoàn / công ty đã thấy, nên mọi endpoint sửa hoặc xóa nội dung
// (study/edit, study/delete, study/updateBulk) từ chối báo cáo đang công khai, trừ khi request
// kèm `unlockPublished: true` — FE chỉ gửi cờ này sau khi người dùng bấm "Mở khóa để sửa" và
// xác nhận. Mở khóa KHÔNG đổi dữ liệu: báo cáo vẫn công khai, đối tác thấy bản mới ngay khi lưu
// (chủ dự án chọn cách này).
//
// Công khai / thu hồi công khai (study/updatePublic, study/updatePublicBulk) không phải sửa nội
// dung nên không cần mở khóa.
// ----------------------------------------------------------------------

export const STUDY_LOCKED_CODE = 'STUDY_LOCKED';

export const STUDY_LOCKED_MESSAGE =
  'Báo cáo đã công khai — bấm "Mở khóa để sửa" và xác nhận trước khi sửa hoặc xóa';

export const isUnlockRequest = (body: any) => body?.unlockPublished === true;
