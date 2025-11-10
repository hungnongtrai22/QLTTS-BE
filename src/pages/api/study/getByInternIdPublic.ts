import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Study from 'src/models/study';
import db from 'src/utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    // tìm bản ghi có internId trùng và isPublic = true, sắp xếp theo time giảm dần
    const study = await Study.findOne({
      internId: req.body.internId,
      isPublic: true,
    }).sort({ time: -1 });

    return res.status(200).json({
      study,
    });
  } catch (error) {
    console.error('[Study Public API]: ', error);
    return res.status(400).json({
      message: error.message || error,
    });
  }
}
