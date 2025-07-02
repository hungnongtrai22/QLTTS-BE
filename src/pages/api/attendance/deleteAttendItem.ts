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

    const { _id, itemId } = req.body;

    if (!_id || !itemId) {
      return res.status(400).json({ message: 'Missing _id or itemId' });
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      _id,
      {
        $pull: { attend: { _id: itemId } },
      },
      { new: true }
    );

    if (!updatedAttendance) {
      return res.status(404).json({ message: 'Attendance or attend item not found' });
    }

    return res.status(200).json({ attendance: updatedAttendance });
  } catch (error) {
    console.error('[Delete Attend Item API]: ', error);
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Something went wrong' });
  }
}
