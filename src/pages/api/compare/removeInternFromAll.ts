// pages/api/compare/remove-intern.ts
import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Compare from 'src/models/compare';
import db from '../../../utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { compareId, internId } = req.body;

    if (!compareId || !internId) {
      return res.status(400).json({ message: 'Missing compareId or internId' });
    }

    const result = await Compare.findByIdAndUpdate(
      compareId,
      { $pull: { listIntern: internId } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Compare not found' });
    }

    return res.status(200).json({
      message: `Removed internId ${internId} from compare ${compareId}`,
      data: result,
    });
  } catch (error) {
    console.error('[Remove Intern from Compare API]: ', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
