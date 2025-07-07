import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import Attendance from 'src/models/attendance';
import db from '../../../utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { internId, month, year, itemId, updateData } = req.body;

    if (!internId || typeof month !== 'number' || typeof year !== 'number' || !itemId) {
      return res.status(400).json({ message: 'Thiếu internId, month, year hoặc itemId' });
    }

    const updatedAttendance = await Attendance.findOneAndUpdate(
      {
        internId,
        month,
        year,
        'attend._id': itemId,
      },
      {
        $set: {
          'attend.$.title': updateData.title,
          'attend.$.description': updateData.description,
          'attend.$.color': updateData.color,
          'attend.$.allDay': updateData.allDay,
          'attend.$.am': updateData.am,
          'attend.$.pm': updateData.pm,
          'attend.$.start': updateData.start,
          'attend.$.end': updateData.end,
          'attend.$.late': updateData.late,
          'attend.$.soon': updateData.soon,
          'attend.$.off': updateData.off,
        },
      },
      { new: true }
    );

    if (!updatedAttendance) {
      return res.status(404).json({ message: 'Không tìm thấy attendance hoặc attend item' });
    }

    return res.status(200).json({ attendance: updatedAttendance });
  } catch (error) {
    console.error('[Update Attend Item API]: ', error);
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Đã có lỗi xảy ra' });
  }
}
