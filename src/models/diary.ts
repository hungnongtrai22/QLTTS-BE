import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema;

const diarySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    intern: {
      type: ObjectId,
      ref: 'Intern',
    },

    status: {
      type: String,
    },
    direction: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    // time: {
    //   type: Number,
    // },
    description: {
      type: String,
    },
    person: {
      type: String,
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

// nhật ký theo thực tập sinh
diarySchema.index({ intern: 1 });

const Diary = mongoose.models.Diary || mongoose.model('Diary', diarySchema);

export default Diary;
