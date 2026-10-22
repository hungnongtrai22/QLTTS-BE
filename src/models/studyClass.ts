import mongoose from 'mongoose';

// ----------------------------------------------------------------------
// Lớp học tiếng Nhật ở trung tâm. TTS thuộc lớp qua Intern.studyClass; chỉ admin xếp lớp
// (trang Lớp, thanh chọn nhiều dòng ở danh sách TTS). Không có tài khoản đăng nhập theo lớp.

const studyClassSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Giáo viên phụ trách: điền sẵn cột giáo viên của phiếu nhập điểm Excel và trang Nhập
    // hàng loạt cho báo cáo mới của TTS trong lớp.
    teacher: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ----------------------------------------------------------------------
// Index. Đây chỉ là cấu trúc tra cứu — KHÔNG thay đổi document nào.

// studyClass/list sắp theo tên, kiểm tra trùng tên khi tạo / sửa
studyClassSchema.index({ name: 1 });

const StudyClass = mongoose.models.StudyClass || mongoose.model('StudyClass', studyClassSchema);

export default StudyClass;
