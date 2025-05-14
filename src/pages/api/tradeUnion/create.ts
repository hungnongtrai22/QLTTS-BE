
import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import { _users, JWT_SECRET, JWT_EXPIRES_IN } from 'src/_mock/_auth';
import db from '../../../utils/db';
import Intern from '../../../models/intern';
import TradeUnion from 'src/models/tradeUnion';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    db.connectDB();

    const {
      name,
    } = req.body;
    const newTradeUnion = await new TradeUnion({
      name,
      email: req?.body?.email,
      address: req?.body?.address,
      phone: req?.body?.phone,
    }).save();

    db.disconnectDB();

    res.status(200).json({
      tradeUnion: newTradeUnion,
    });
  } catch (error) {
    console.error('[Auth API]: ', error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
}
