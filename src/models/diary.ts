import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema;

const diarySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    intern: {
      type: ObjectId,
      ref: 'Intern',
    },

    status: {
      type: String,
    },
    direction: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    time: {
      type: Number,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Diary = mongoose.models.Diary || mongoose.model('Diary', diarySchema);

export default Diary;
