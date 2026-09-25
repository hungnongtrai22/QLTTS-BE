import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema;

const accountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    role: {
      type: String,
      required: true,
    },
    tradeUnion: {
      type: ObjectId,
      ref: 'TradeUnion',
    },
    companySelect: [
      {
        type: ObjectId,
        ref: 'Company',
      },
    ],
    source: {
      type: ObjectId,
      ref: 'source',
    },
    internsDemo: [
      {
        type: ObjectId,
        ref: 'Intern',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ----------------------------------------------------------------------
// Index. Đây chỉ là cấu trúc tra cứu — KHÔNG thay đổi document nào.
// Trước khi thêm, toàn bộ collection chỉ có index _id mặc định, nên mọi truy vấn
// lọc/sắp xếp đều phải quét hết collection.

// tra cứu lúc đăng nhập; đã kiểm tra: không có username trùng
accountSchema.index({ username: 1 }, { unique: true });
// đếm admin còn lại khi xoá/hạ quyền
accountSchema.index({ role: 1 });
// lọc tài khoản theo nghiệp đoàn
accountSchema.index({ tradeUnion: 1 });

const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);

export default Account;
