import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import db from '../../../utils/db';
import Intern from '../../../models/intern';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing intern ID (_id)' });
    }

    const deletedIntern = await Intern.findByIdAndDelete(_id);

    if (!deletedIntern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    return res.status(200).json({
      message: 'Intern deleted successfully',
      intern: deletedIntern,
    });
  } catch (error) {
    console.error('[Delete Intern API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
      error,
    });
  }
}
