import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Study from 'src/models/study';

// _mock
import db from '../../../utils/db';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    const { id } = req.body; // Lấy id từ query string hoặc req.body tùy ý

    if (!id) {
      return res.status(400).json({ message: 'Missing study ID' });
    }

    const deletedStudy = await Study.findByIdAndDelete(id);

    if (!deletedStudy) {
      return res.status(404).json({ message: 'Study not found' });
    }

    return res.status(200).json({
      message: 'Deleted successfully',
      study: deletedStudy,
    });
  } catch (error) {
    console.error('[Delete Study API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : error,
    });
  }
}
