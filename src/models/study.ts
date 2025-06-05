import mongoose from 'mongoose';

const studySchema = new mongoose.Schema(
  {
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
      required: true,
    },
    grammarAndReading: {
      type: Number,
      required: true,
    },
    listeningComprehension: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Study = mongoose.models.Study || mongoose.model('Study', studySchema);

export default Study;
