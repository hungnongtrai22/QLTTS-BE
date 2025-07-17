import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Source from 'src/models/source';
// _mock
import db from '../../../utils/db';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    // if (req.method !== 'DELETE') {
    //   return res.status(405).json({ message: 'Method not allowed' });
    // }

    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing source _id' });
    }

    const deletedSource = await Source.findByIdAndDelete(_id);

    if (!deletedSource) {
      return res.status(404).json({ message: 'Source not found' });
    }

    return res.status(200).json({
      message: 'Source deleted successfully',
      source: deletedSource,
    });
  } catch (error) {
    console.error('[Delete Source API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
