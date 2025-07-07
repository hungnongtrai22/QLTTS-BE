import { NextApiRequest, NextApiResponse } from 'next';
// utils
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

    const { internId, itemId, updateData, month, year } = req.body;

    if (!internId || !itemId || typeof month !== 'number' || typeof year !== 'number') {
      return res.status(400).json({ message: 'Thiếu internId, itemId, month hoặc year' });
    }

    const updatedAttendance = await Attendance.findOneAndUpdate(
      {
        internId,
        month,
        year,
        "attend._id": itemId,
      },
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
      return res.status(404).json({ message: 'Không tìm thấy attend item hoặc bản ghi attendance' });
    }

    return res.status(200).json({
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error('[Update Attend Item API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
    });
  }
}
