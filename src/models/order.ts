import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema;

const orderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      required: true,
    },
    interviewFormat: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    recruitmentDate: {
      type: Date,
      required: true,
    },
    work: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    contractPeriod: {
      type: Number,
      required: true,
    },
    ageFrom: {
      type: Number,
      required: true,
    },
    ageTo: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Boolean,
      required: true,
    },
    quantityMen: {
      type: Number,
      required: true,
    },
    quantityWomen: {
      type: Number,
      required: true,
    },
    married: {
      type: String,
      required: true,
    },
    study: {
      type: String,
      required: true,
    },
    applicationConditions: {
      type: String,
      required: true,
    },
    insurance: {
      type: String,
      required: true,
    },
    housingConditions: {
      type: String,
    },
    livingConditions: {
      type: String,
    },
    otherLivingConditions: {
      type: String,
    },
    listWorker: [
      {
        id: {
          type: ObjectId,
          ref: 'intern',
        },
      },
    ],
    listIntern: [
      {
        id: {
          type: ObjectId,
          ref: 'intern',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
