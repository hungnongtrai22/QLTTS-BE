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

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { _id, internId, attend, monthAndYear } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing Attendance ID (_id)' });
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      _id,
      {
        internId,
        attend,
        monthAndYear,
      },
      { new: true }
    );

    if (!updatedAttendance) {
      return res.status(404).json({ message: 'Attendance not found' });
    }

    return res.status(200).json({
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error('[Update Attendance API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
