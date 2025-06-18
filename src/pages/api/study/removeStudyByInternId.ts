import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Study from 'src/models/study';
import db from '../../../utils/db';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'DELETE') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { internId } = req.body;

    if (!internId) {
      return res.status(400).json({ message: 'Missing internId' });
    }

    const result = await Study.deleteMany({ internId });

    return res.status(200).json({
      message: `Deleted ${result.deletedCount} study record(s) for internId ${internId}`,
    });
  } catch (error) {
    console.error('[Delete Study by InternId API]: ', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
