import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema;

const attendanceSchema = new mongoose.Schema(
  {
    internId: {
      type: ObjectId,
      required: true,
      ref: 'intern',
    },
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
    // monthAndYear: {
    //   type: Date,
    // },
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

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

export default Attendance;
