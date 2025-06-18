import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Contact from 'src/models/contact';
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

    const { internId } = req.body;

    if (!internId) {
      return res.status(400).json({ message: 'Missing internId' });
    }

    const result = await Contact.deleteMany({ internId });

    return res.status(200).json({
      message: `Deleted ${result.deletedCount} contact(s) for internId ${internId}`,
    });
  } catch (error) {
    console.error('[Delete Contacts by InternId API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
      error,
    });
  }
}
