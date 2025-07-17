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

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { _id, name, email, address, state, phone } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing source ID (_id)' });
    }

    const updatedSource = await Source.findByIdAndUpdate(
      _id,
      {
        name,
        email,
        address,
        state,
        phone,
      },
      { new: true }
    );

    if (!updatedSource) {
      return res.status(404).json({ message: 'Source not found' });
    }

    return res.status(200).json({
      source: updatedSource,
    });
  } catch (error) {
    console.error('[Update Source API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
