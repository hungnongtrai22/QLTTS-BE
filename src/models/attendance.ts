import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema;

const attendanceSchema = new mongoose.Schema(
  {
    internId: {
      type: ObjectId,
      required: true,
      ref: 'intern',
    },
    attend: [
      {
        title: {
          type: String,
        },
        description: {
          type: String,
        },
        color: {
          type: String,
        },
        allDay: {
          type: Boolean,
        },
        am: {
          type: Boolean,
        },
        pm: {
          type: Boolean,
        },
        start: {
          type: Date,
        },
        end: {
          type: Date,
        },
        late: {
          type: Boolean,
        },
        soon: {
          type: Boolean,
        },
        off: {
          type: Boolean,
        },
      },
    ],
    // monthAndYear: {
    //   type: Date,
    // },
    month: {
      type: Number,
    },
    year: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// ----------------------------------------------------------------------
// Index. Đây chỉ là cấu trúc tra cứu — KHÔNG thay đổi document nào.
// Trước khi thêm, toàn bộ collection chỉ có index _id mặc định, nên mọi truy vấn
// lọc/sắp xếp đều phải quét hết collection.

// điểm danh theo thực tập sinh
attendanceSchema.index({ internId: 1 });
// thống kê điểm danh theo tháng
attendanceSchema.index({ internId: 1, month: 1, year: 1 });

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

export default Attendance;
