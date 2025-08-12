import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Diary from 'src/models/diary';
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

    const { _id, name, intern, status, direction, startDate, endDate, description, person } =
      req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing diary ID (_id)' });
    }

    const updatedDiary = await Diary.findByIdAndUpdate(
      _id,
      {
        name,
        intern,
        status,
        direction,
        startDate,
        endDate,
        // time,
        description,
        person
      },
      { new: true }
    );

    if (!updatedDiary) {
      return res.status(404).json({ message: 'Diary not found' });
    }

    return res.status(200).json({
      diary: updatedDiary,
    });
  } catch (error) {
    console.error('[Update Diary API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
