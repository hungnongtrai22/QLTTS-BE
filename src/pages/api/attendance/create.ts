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

    await db.connectDB();

    const { internId, attend, monthAndYear } = req.body;
    const newAttendance = await new Attendance({
      internId,
      attend,
      monthAndYear,
    }).save();

    return res.status(200).json({
      attendance: newAttendance,
    });
  } catch (error) {
    console.error('[Auth API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
