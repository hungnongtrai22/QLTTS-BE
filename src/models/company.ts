import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema;

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },

    web: {
      type: String,
    },

    phone: {
      type: String,
    },

    address: {
      type: String,
    },

    city: {
      type: String,
    },

    state: {
      type: String,
    },

    country: {
      type: String,
    },

    description: {
      type: String,
    },

    // Người đại diện của xí nghiệp tiếp nhận — mục "Đại diện người sử dụng lao động" trên HĐLĐ.
    director: {
      type: String,
    },

    // Khối lương in trên HĐLĐ, đơn vị Yên. Lưu theo công ty (không theo từng TTS):
    // mọi TTS của cùng một xí nghiệp dùng chung các mức này.
    trainingAllowance: {
      type: Number,
    },
    salary: {
      type: Number,
    },
    tax: {
      type: Number,
    },
    socialInsurance: {
      type: Number,
    },
    housingFee: {
      type: Number,
    },

    tradeUnion: {
      type: ObjectId,
      required: true,
      ref: 'TradeUnion',
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

// listByTradeUnion — danh sách công ty của một nghiệp đoàn
companySchema.index({ tradeUnion: 1 });
// tra tên -> id cho bộ lọc. KHÔNG unique: có 5 tên công ty trùng nhau
companySchema.index({ name: 1 });

const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

export default Company;
