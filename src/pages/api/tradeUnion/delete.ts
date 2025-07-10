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

    await db.connectDB();

    // if (req.method !== 'DELETE') {
    //   return res.status(405).json({ message: 'Method not allowed' });
    // }

    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({ message: 'Missing tradeUnion _id' });
    }

    const deletedTradeUnion = await TradeUnion.findByIdAndDelete(_id);

    if (!deletedTradeUnion) {
      return res.status(404).json({ message: 'TradeUnion not found' });
    }

    return res.status(200).json({
      message: 'TradeUnion deleted successfully',
      tradeUnion: deletedTradeUnion,
    });
  } catch (error) {
    console.error('[Delete TradeUnion API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
