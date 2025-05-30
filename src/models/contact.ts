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

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

export default Contact;
