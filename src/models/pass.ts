import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema;

const passSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      required: true,
    },
    citizenId: {
      type: String,
      required: true,
    },
    citizenDate: {
      type: String,
      required: true,
    },
    citizenPlace: {
      type: String,
      required: true,
    },
    passportId: {
      type: String,
      // required: true,
    },
    passportDate: {
      type: Date,
      // required: true,
    },
    reff: {
      type: String,
      // required: true,
    },
    street: {
      type: String,
      // required: true,
    },
    state: {
      type: String,
      // required: true,
    },
    city: {
      type: String,
      // required: true,
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
      // required: true,
    },
    contractDate: {
      type: String,
      // required: true,
    },
   
    contractPeriod: {
      type: String,
      // required: true,
    },
    contractResult: {
      type: String,
      // required: true,
    },
    departureDate: {
      type: Date,
      // required: true,
    },
    profileStatus: {
      type: String,
      // required: true,
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
