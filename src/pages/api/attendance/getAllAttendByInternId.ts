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

    const { internId } = req.body;

    if (!internId) {
      return res.status(400).json({ message: 'Missing internId' });
    }

    // Lấy tất cả bản ghi Attendance của internId
    const attendanceRecords = await Attendance.find({ internId });

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return res.status(200).json([]);
    }

    // Nối tất cả các mảng attend lại với nhau
    const mergedAttend = attendanceRecords.reduce(
      (acc: any[], record: any) => acc.concat(record.attend || []),
      []
    );

    return res.status(200).json({ attend: mergedAttend });
  } catch (error) {
    console.error('[Get Merged Attendance API]: ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
