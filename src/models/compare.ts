import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema;

const compareSchema = new mongoose.Schema(
  {
    account: {
      type: ObjectId,
      required: true,
      ref: 'Account',
      unique: true,
    },
    listIntern: [
      {
        type: ObjectId,
        ref: 'Intern',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Compare = mongoose.models.Compare || mongoose.model('Compare', compareSchema);

export default Compare;
