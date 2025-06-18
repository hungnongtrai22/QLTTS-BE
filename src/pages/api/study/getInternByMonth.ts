import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
// _mock
import Study from 'src/models/study';

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

    const study = await Study.findOne({
      internId,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    if (!study) {
      return res.status(404).json({ message: 'Study not found' });
    }

    return res.status(200).json({ study });
  } catch (error) {
    console.error('[Study API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
