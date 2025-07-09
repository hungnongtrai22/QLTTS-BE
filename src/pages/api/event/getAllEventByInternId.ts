import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
// _mock
import Event from 'src/models/event';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


   

    // Lấy tất cả bản ghi Attendance của internId, có thể sort theo thời gian nếu cần
    const eventRecords = await Event.find().sort({ year: 1, month: 1 });

    if (!eventRecords || eventRecords.length === 0) {
      return res.status(200).json({ attend: [] });
    }

    // Nối tất cả các attend, kèm theo attendanceId, month, year
    const mergedAttend = eventRecords.reduce((acc: any[], record: any) => {
      const attendsWithMeta = (record.attend || []).map((attend: any) => ({
        ...(attend.toObject?.() || attend),
        attendanceId: record._id,
        month: record.month,
        year: record.year,
      }));
      return acc.concat(attendsWithMeta);
    }, []);

    return res.status(200).json({ attend: mergedAttend });
  } catch (error) {
    console.error('[Get Merged Attendance API]: ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
