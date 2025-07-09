import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    attend: [
      {
        title: {
          type: String,
        },
        description: {
          type: String,
        },
        color: {
          type: String,
        },
        allDay: {
          type: Boolean,
        },
        am: {
          type: Boolean,
        },
        pm: {
          type: Boolean,
        },
        start: {
          type: Date,
        },
        end: {
          type: Date,
        },
        late: {
          type: Boolean,
        },
        soon: {
          type: Boolean,
        },
        off: {
          type: Boolean,
        },
      },
    ],
    month: {
      type: Number,
    },
    year: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

export default Event;
