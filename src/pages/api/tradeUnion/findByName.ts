import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import TradeUnion from 'src/models/tradeUnion';
import db from 'src/utils/db';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();


    const tradeUnion = await TradeUnion.findOne({name: req.body.name}); 
    return res.status(200).json({
      tradeUnion,
    });
  } catch (error) {
    console.error('[Trade Union API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
