import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Pass from 'src/models/pass';

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
      return res.status(400).json({ message: 'Missing pass _id' });
    }

    const deletedPass = await Pass.findByIdAndDelete(_id);

    if (!deletedPass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    return res.status(200).json({
      message: 'Pass deleted successfully',
      pass: deletedPass,
    });
  } catch (error) {
    console.error('[Delete Pass API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
