import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Attendance from 'src/models/attendance';
import db from 'src/utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const attendances = await Attendance.find(); 
    return res.status(200).json({
      attendances,
    });
  } catch (error) {
    console.error('[Attendance API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
