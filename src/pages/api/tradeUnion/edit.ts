import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import TradeUnion from 'src/models/tradeUnion';
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

    const { _id, name, email, address, city, state, country, phone } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing trade union ID (_id)' });
    }

    const updatedTradeUnion = await TradeUnion.findByIdAndUpdate(
      _id,
      {
        name,
        email,
        address,
        city,
        state,
        country,
        phone,
      },
      { new: true }
    );

    if (!updatedTradeUnion) {
      return res.status(404).json({ message: 'Trade Union not found' });
    }

    return res.status(200).json({
      tradeUnion: updatedTradeUnion,
    });
  } catch (error) {
    console.error('[Update Trade Union API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
