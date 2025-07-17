import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
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
    state: {
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

const Source = mongoose.models.Source || mongoose.model('Source', sourceSchema);

export default Source;
