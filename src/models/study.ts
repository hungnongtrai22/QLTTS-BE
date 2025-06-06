import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema;

const studySchema = new mongoose.Schema(
  {
    internId: {
      type: ObjectId,
      required: true,
      ref: 'intern',
    },
    health: {
      type: Number,
      required: true,
    },
    cooperation: {
      type: Number,
      required: true,
    },
    attend: {
      type: Number,
      required: true,
    },
    discipline: {
      type: Number,
      required: true,
    },
    attitude: {
      type: Number,
      required: true,
    },
    acquiringKnowledge: {
      type: Number,
      required: true,
    },
    write: {
      type: Number,
      required: true,
    },
    read: {
      type: Number,
      required: true,
    },
    listen: {
      type: Number,
      required: true,
    },
    speak: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    average: {
      type: Number,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    time: {
      type: Number,
      required: true,
    },
    kanji: {
      type: Number,
    },
    grammarAndReading: {
      type: Number,
    },
    listeningComprehension: {
      type: Number,
    },
    totalReadingAndListening: {
      type: Number,
    },
    learningProcess: {
      type: String,
      required: true,
    },
    characteristic: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Study = mongoose.models.Study || mongoose.model('Study', studySchema);

export default Study;
