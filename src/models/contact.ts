import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema;

const contactSchema = new mongoose.Schema(
  {
    internId: {
      type: ObjectId,
      required: true,
      ref: 'intern',
    },
    address: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    addressDadAndMom: {
      type: String,
      required: true,
    },
    phoneDad: {
      type: String,
      required: true,
    },
    phoneMom: {
      type: String,
      required: true,
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

// getByInternId và removeContactByInternId
contactSchema.index({ internId: 1 });

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

export default Contact;
