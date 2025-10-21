import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema;

const passSchema = new mongoose.Schema(
  {
    field: {
      type: String,
    },
    citizenId: {
      type: String,
    },
    citizenDate: {
      type: String,
    },
    citizenPlace: {
      type: String,
    },
    passportId: {
      type: String,
    },
    passportDate: {
      type: Date,
    },
    reff: {
      type: String,
    },
    street: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    postelCode: {
      type: String,
    },
    country: {
      type: String,
    },
    phone: {
      type: String,
    },
    contractId: {
      type: String,
    },
    contractDate: {
      type: String,
    },
   
    contractPeriod: {
      type: String,
    },
    contractResult: {
      type: String,
    },
    departureDate: {
      type: Date,
    },
    profileStatus: {
      type: String,
    },
    orderId: {
      type: ObjectId,
      ref: 'order',
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Pass = mongoose.models.Pass || mongoose.model('Pass', passSchema);

export default Pass;
