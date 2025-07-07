import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
// _mock
import Attendance from 'src/models/attendance';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const { internId, month, year } = req.body;

    if (!internId || typeof month !== 'number' || typeof year !== 'number') {
      return res.status(400).json({ message: 'Thiếu internId, month hoặc year' });
    }

    const attendance = await Attendance.findOne({ internId, month, year });

    if (!attendance) {
      return res.status(200).json(null);
    }

    return res.status(200).json({ attendance });
  } catch (error) {
    console.error('[Attendance API]: ', error);
    return res.status(500).json({
      message: 'Đã có lỗi xảy ra phía server',
    });
  }
}
