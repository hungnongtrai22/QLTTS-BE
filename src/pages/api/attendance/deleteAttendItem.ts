import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import Attendance from 'src/models/attendance';
import db from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { internId, itemId, month, year } = req.body;

    if (!internId || !itemId || typeof month !== 'number' || typeof year !== 'number') {
      return res.status(400).json({ message: 'Thiếu dữ liệu: internId, itemId, month hoặc year' });
    }

    const updatedAttendance = await Attendance.findOneAndUpdate(
      { internId, month, year },
      { $pull: { attend: { _id: itemId } } },
      { new: true }
    );

    if (!updatedAttendance) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công hoặc attend item' });
    }

    return res.status(200).json({ attendance: updatedAttendance });
  } catch (error) {
    console.error('[Delete Attend Item API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
    });
  }
}
