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

const TradeUnion = mongoose.models.TradeUnion || mongoose.model('TradeUnion', tradeUnionSchema);

export default TradeUnion;
