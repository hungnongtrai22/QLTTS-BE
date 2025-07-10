import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Company from 'src/models/company';
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

    const { tradeUnion } = req.body;

    if (!tradeUnion) {
      return res.status(400).json({ message: 'Missing tradeUnion ID' });
    }

    const result = await Company.deleteMany({ tradeUnion });

    return res.status(200).json({
      message: `Deleted ${result.deletedCount} companies linked to tradeUnion ${tradeUnion}`,
    });
  } catch (error) {
    console.error('[Delete Companies by TradeUnion API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
