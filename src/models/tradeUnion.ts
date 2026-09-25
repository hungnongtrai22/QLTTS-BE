import mongoose from 'mongoose';

const tradeUnionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
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
    phone: {
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

// findByName và tra tên -> id cho bộ lọc
tradeUnionSchema.index({ name: 1 });

const TradeUnion = mongoose.models.TradeUnion || mongoose.model('TradeUnion', tradeUnionSchema);

export default TradeUnion;
