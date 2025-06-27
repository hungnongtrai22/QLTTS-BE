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

    const { internId } = req.body;

    if (!internId) {
      return res.status(400).json({ message: 'Missing internId' });
    }

    const result = await Attendance.deleteMany({ internId });

    return res.status(200).json({
      message: `Deleted ${result.deletedCount} attendance record(s) for internId ${internId}`,
    });
  } catch (error) {
    console.error('[Delete attendance by InternId API]: ', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
