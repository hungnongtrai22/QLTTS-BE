import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Attendance from 'src/models/attendance';

// _mock
import db from '../../../utils/db';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { _id, itemId, updateData } = req.body;

    if (!_id || !itemId) {
      return res.status(400).json({ message: 'Missing _id or itemId' });
    }

    const updatedAttendance = await Attendance.findOneAndUpdate(
      { _id, "attend._id": itemId },
      {
        $set: {
          "attend.$.title": updateData.title,
          "attend.$.description": updateData.description,
          "attend.$.color": updateData.color,
          "attend.$.allDay": updateData.allDay,
          "attend.$.am": updateData.am,
          "attend.$.pm": updateData.pm,
          "attend.$.start": updateData.start,
          "attend.$.end": updateData.end,
          "attend.$.late": updateData.late,
          "attend.$.soon": updateData.soon,
          "attend.$.off": updateData.off,
        },
      },
      { new: true }
    );

    if (!updatedAttendance) {
      return res.status(404).json({ message: 'Attendance or attend item not found' });
    }

    return res.status(200).json({
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error('[Update Attend Item API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : 'Something went wrong',
    });
  }
}
