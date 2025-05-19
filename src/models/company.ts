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

const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

export default Company;
