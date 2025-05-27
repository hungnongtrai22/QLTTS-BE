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
  },
  {
    timestamps: true,
  }
);

const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);

export default Account;
