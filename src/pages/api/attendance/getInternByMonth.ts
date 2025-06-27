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

    if (!internId || !month || !year) {
      return res.status(400).json({ message: 'Missing internId, month, or year' });
    }

    // Tạo khoảng thời gian đầu tháng đến cuối tháng
    const startDate = new Date(year, month - 1, 1); // JS month: 0-11
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // last day of the month

    const attendance = await Attendance.findOne({
      internId,
      monthAndYear: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    if (!attendance) {
      return res.status(200).json(null);
    }

    return res.status(200).json({ attendance });
  } catch (error) {
    console.error('[Attendance API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
